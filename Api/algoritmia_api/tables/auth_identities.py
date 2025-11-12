from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from passlib.hash import argon2

from .. import db

router = APIRouter(prefix="/auth-identities", tags=["AuthIdentities"])

DDL = """
CREATE TABLE IF NOT EXISTS auth_identities (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,              -- 'local' | 'google' | 'github' | ...
    provider_uid TEXT,                   -- NULL for 'local'; oauth subject/id for social
    email CITEXT,
    password_hash TEXT,                  -- nullable for oauth; required for 'local'
    email_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
"""

# One identity per (user, provider)
DDL_IDX_USER_PROVIDER = """
CREATE UNIQUE INDEX IF NOT EXISTS auth_identities_user_provider_uq
ON auth_identities (user_id, provider);
"""

# Local email must be unique (across local identities)
DDL_IDX_LOCAL_EMAIL = """
CREATE UNIQUE INDEX IF NOT EXISTS auth_identities_local_email_uq
ON auth_identities (email) WHERE provider = 'local';
"""

# Optional: uniqueness of (provider, COALESCE(provider_uid,'local')) to protect oauth duplicates
DDL_IDX_PROVIDER_UID = """
CREATE UNIQUE INDEX IF NOT EXISTS auth_identities_provider_uid_uq
ON auth_identities (provider, COALESCE(provider_uid, 'local'));
"""

# CHECK: local requires email and password_hash (guarded with DO block to be idempotent)
DDL_CHECK_LOCAL_REQ = """
DO $$
BEGIN
  ALTER TABLE auth_identities
  ADD CONSTRAINT auth_identities_local_requires_pwd_email_chk
  CHECK (
    (provider <> 'local')
    OR (provider = 'local' AND email IS NOT NULL AND password_hash IS NOT NULL)
  );
EXCEPTION WHEN duplicate_object THEN
  -- already added
  NULL;
END $$;
"""

def ensure_table(conn):
    with conn.cursor() as cur:
        cur.execute(DDL)
        cur.execute(DDL_IDX_USER_PROVIDER)
        cur.execute(DDL_IDX_LOCAL_EMAIL)
        cur.execute(DDL_IDX_PROVIDER_UID)
        cur.execute(DDL_CHECK_LOCAL_REQ)
    conn.commit()

class IdentityCreate(BaseModel):
    user_id: int
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    provider: str = "local"
    provider_uid: Optional[str] = None

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
    """
    Use this to manually link an identity (e.g., after OAuth completes).
    For 'local', you MUST provide email + password (CHECK constraint enforces).
    """
    pwd_hash = None
    if payload.password:
        pwd_hash = argon2.hash(payload.password)

    with db.connect() as conn:
        row = db.fetchone(
            conn,
            """
            INSERT INTO auth_identities(user_id, provider, provider_uid, email, password_hash)
            VALUES (%s,%s,%s,%s,%s) RETURNING *
            """,
            [
                payload.user_id,
                payload.provider,
                payload.provider_uid,
                str(payload.email) if payload.email else None,
                pwd_hash,
            ],
        )
    return row
