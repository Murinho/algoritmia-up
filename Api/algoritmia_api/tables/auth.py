import secrets, hashlib

from datetime import date, datetime, timedelta
from typing import Optional

from fastapi import Response, Request, Depends
from fastapi import Cookie
from fastapi import Depends

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, Field
from passlib.hash import argon2

from .. import db

router = APIRouter(prefix="/auth", tags=["Auth"])

SESSION_COOKIE_NAME = "sid"
SESSION_COOKIE_AGE = 60 * 60 * 24  # one day in seconds

def _hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()

def _new_session_token() -> tuple[str, str]:
    raw = secrets.token_urlsafe(32)
    return raw, _hash_token(raw)

DDL_SESSIONS = """
CREATE TABLE IF NOT EXISTS sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_sha256 TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
"""

DDL_SESSIONS_TOKEN_UQ = """
CREATE UNIQUE INDEX IF NOT EXISTS sessions_token_sha256_uq
ON sessions(token_sha256);
"""

DDL_SESSIONS_ACTIVE_IDX = """
CREATE INDEX IF NOT EXISTS sessions_user_active_idx
ON sessions(user_id)
WHERE revoked_at IS NULL;
"""

def ensure_table(conn):
    with conn.cursor() as cur:
        cur.execute(DDL_SESSIONS)
        cur.execute(DDL_SESSIONS_TOKEN_UQ)
        cur.execute(DDL_SESSIONS_ACTIVE_IDX)
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

def get_current_user(request: Request):
    # read cookie
    raw = request.cookies.get(SESSION_COOKIE_NAME)
    if not raw:
        raise HTTPException(status_code=401, detail="Not authenticated")

    token_sha256 = _hash_token(raw)

    with db.connect() as conn:
        sess = db.fetchone(
            conn,
            """
            SELECT * FROM sessions
            WHERE token_sha256=%s AND revoked_at IS NULL AND expires_at > NOW()
            """,
            [token_sha256],
        )
        if not sess:
            raise HTTPException(status_code=401, detail="Invalid or expired session")

        user = db.fetchone(conn, "SELECT * FROM users WHERE id=%s", [sess["user_id"]])
    return {"session": sess, "user": user}

@router.get("/me")
def me(current = Depends(get_current_user)):
    return current

@router.post("/logout")
def logout(response: Response, request: Request):
    raw = request.cookies.get(SESSION_COOKIE_NAME)
    if not raw:
        # idempotent
        response.delete_cookie(SESSION_COOKIE_NAME, path="/")
        return {"ok": True}

    token_sha256 = _hash_token(raw)
    with db.connect() as conn:
        db.execute(
            conn,
            "UPDATE sessions SET revoked_at=NOW() WHERE token_sha256=%s AND revoked_at IS NULL",
            [token_sha256],
        )

    response.delete_cookie(SESSION_COOKIE_NAME, path="/")
    return {"ok": True}

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
def login(payload: Login, response: Response):
    # 1) fetch identity
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
        now = datetime.utcnow()
        expires_at = now + timedelta(minutes=payload.ttl_minutes)

        with db.connect() as conn:
            # **Single-session policy (BLOCK)**
            active = db.fetchone(
                conn,
                """
                SELECT id FROM sessions
                WHERE user_id=%s AND revoked_at IS NULL AND expires_at > NOW()
                LIMIT 1
                """,
                [ident["user_id"]],
            )
            if active:
                # If you'd rather REPLACE, delete here instead of raising:
                # db.execute(conn, "UPDATE sessions SET revoked_at=NOW() WHERE user_id=%s AND revoked_at IS NULL", [ident["user_id"]])
                raise HTTPException(status_code=409, detail="Already logged in on this browser. Log out first.")

            raw_token, token_sha256 = _new_session_token()

            session_row = db.fetchone(
                conn,
                """
                INSERT INTO sessions(user_id, token_sha256, expires_at)
                VALUES(%s,%s,%s)
                RETURNING id, user_id, expires_at, created_at
                """,
                [ident["user_id"], token_sha256, expires_at],
            )

        # Set signed/secure cookie
        # (Use `secure=True` when served over HTTPS; SameSite=Lax is OK for login flows)
        response.set_cookie(
            key=SESSION_COOKIE_NAME,
            value=raw_token,
            httponly=True,
            samesite="lax",
            secure=False,  # set to True in production over HTTPS!
            max_age=SESSION_COOKIE_AGE,
            path="/",
        )
        result["session"] = session_row

    # 4) user profile
    with db.connect() as conn:
        user = db.fetchone(conn, "SELECT * FROM users WHERE id=%s", [ident["user_id"]])
    result["user"] = user

    return result
