import hashlib
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr

from .. import db


router = APIRouter(prefix="/auth-identities", tags=["AuthIdentities"])


DDL = """
CREATE TABLE IF NOT EXISTS auth_identities (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    provider_uid TEXT,
    email CITEXT,
    password_hash TEXT,
    email_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (provider, COALESCE(provider_uid, 'local'))
);
"""


def ensure_table(conn) -> None:
    with conn.cursor() as cur:
        cur.execute(DDL)
    conn.commit()


def hash_password(email: str, password: str) -> str:
    # Simple deterministic hash (placeholder). Replace with bcrypt/argon2 in production.
    salt = (email or "").lower().encode()
    return hashlib.sha256(salt + password.encode()).hexdigest()


class IdentityCreate(BaseModel):
    user_id: int
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    provider: str = "local"
    provider_uid: Optional[str] = None


class Login(BaseModel):
    email: EmailStr
    password: str
    create_session: bool = True
    ttl_minutes: int = 60 * 24


@router.get("")
def list_auth_identities(user_id: Optional[int] = None):
    base = "SELECT * FROM auth_identities"
    params: list = []
    if user_id is not None:
        base += " WHERE user_id=%s"
        params.append(user_id)
    base += " ORDER BY created_at DESC LIMIT 200"
    with db.connect() as conn:
        rows = db.fetchall(conn, base, params)
    return {"items": rows}


@router.post("")
def create_auth_identity(payload: IdentityCreate):
    pwd_hash = None
    if payload.password:
        pwd_hash = hash_password(str(payload.email or ""), payload.password)
    with db.connect() as conn:
        row = db.fetchone(
            conn,
            """
            INSERT INTO auth_identities(user_id, provider, provider_uid, email, password_hash)
            VALUES (%s,%s,%s,%s,%s) RETURNING *
            """,
            [payload.user_id, payload.provider, payload.provider_uid, str(payload.email) if payload.email else None, pwd_hash],
        )
    return row


@router.post("/login")
def login(payload: Login):
    pwd_hash = hash_password(str(payload.email), payload.password)
    with db.connect() as conn:
        row = db.fetchone(
            conn,
            "SELECT * FROM auth_identities WHERE provider='local' AND email=%s AND password_hash=%s",
            [str(payload.email), pwd_hash],
        )
    if not row:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    result = {"identity": row}
    if payload.create_session:
        expires_at = datetime.utcnow() + timedelta(minutes=payload.ttl_minutes)
        with db.connect() as conn:
            session_row = db.fetchone(
                conn,
                "INSERT INTO sessions(user_id, expires_at) VALUES(%s,%s) RETURNING *",
                [row["user_id"], expires_at],
            )
        result["session"] = session_row
    return result
