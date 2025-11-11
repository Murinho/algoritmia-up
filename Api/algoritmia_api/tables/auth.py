from datetime import date, datetime, timedelta
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, Field
from passlib.hash import argon2

from .. import db

router = APIRouter(prefix="/auth", tags=["Auth"])

# Optional: bootstrap sessions table (idempotent)
DDL_SESSIONS = """
CREATE TABLE IF NOT EXISTS sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
"""
def ensure_table(conn):
    with conn.cursor() as cur:
        cur.execute(DDL_SESSIONS)
    conn.commit()

class SignUp(BaseModel):
    # user profile
    full_name: str = Field(min_length=1)
    email: EmailStr
    codeforces_handle: str = Field(min_length=1)
    birthdate: date
    degree_program: str
    entry_year: int = Field(ge=2000, le=2100)
    country: str
    profile_image_url: Optional[str] = None
    # local auth
    password: str = Field(min_length=8)

class Login(BaseModel):
    email: EmailStr
    password: str
    create_session: bool = True
    ttl_minutes: int = 60 * 24

@router.post("/signup")
def signup(payload: SignUp):
    pwd_hash = argon2.hash(payload.password)

    with db.connect() as conn:
        try:
            with conn.cursor() as cur:
                # 1) create user
                cur.execute(
                    """
                    INSERT INTO users
                      (full_name, email, codeforces_handle, birthdate, degree_program,
                       entry_year, country, profile_image_url)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
                    RETURNING id, full_name, email, codeforces_handle, birthdate,
                              degree_program, entry_year, country, profile_image_url, created_at
                    """,
                    [
                        payload.full_name,
                        str(payload.email),
                        payload.codeforces_handle,
                        payload.birthdate,
                        payload.degree_program,
                        payload.entry_year,
                        payload.country,
                        payload.profile_image_url,
                    ],
                )
                user = cur.fetchone()
                user_id = user["id"]

                # 2) bind local identity
                cur.execute(
                    """
                    INSERT INTO auth_identities
                      (user_id, provider, provider_uid, email, password_hash, email_verified_at)
                    VALUES (%s,'local',NULL,%s,%s,NULL)
                    RETURNING id, user_id, provider, provider_uid, email, created_at
                    """,
                    [user_id, str(payload.email), pwd_hash],
                )
                identity = cur.fetchone()

            conn.commit()

        except Exception as e:
            conn.rollback()
            msg = str(e).lower()
            if "users_email_key" in msg:
                raise HTTPException(status_code=409, detail="Email already registered")
            if "users_codeforces_handle_key" in msg:
                raise HTTPException(status_code=409, detail="Codeforces handle already in use")
            if "auth_identities_local_email_uq" in msg:
                raise HTTPException(status_code=409, detail="Local account already exists for this email")
            raise

    return {"user": user, "identity": identity}

@router.post("/login")
def login(payload: Login):
    # 1) fetch local identity by email
    with db.connect() as conn:
        ident = db.fetchone(
            conn,
            "SELECT * FROM auth_identities WHERE provider='local' AND email=%s",
            [str(payload.email)],
        )
    if not ident or not ident.get("password_hash"):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # 2) verify password
    if not argon2.verify(payload.password, ident["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    result = {"identity": {k: v for k, v in ident.items() if k != "password_hash"}}

    # 3) optional session
    if payload.create_session:
        expires_at = datetime.utcnow() + timedelta(minutes=payload.ttl_minutes)
        with db.connect() as conn:
            session_row = db.fetchone(
                conn,
                "INSERT INTO sessions(user_id, expires_at) VALUES(%s,%s) RETURNING *",
                [ident["user_id"], expires_at],
            )
        result["session"] = session_row

    # 4) fetch user profile
    with db.connect() as conn:
        user = db.fetchone(conn, "SELECT * FROM users WHERE id=%s", [ident["user_id"]])
    result["user"] = user

    return result
