import string

from typing import Optional

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from passlib.hash import argon2

from .. import db
from .auth import get_current_user

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

# --- IMPORTANT: replace the old COALESCE unique with a sane partial unique ---
DDL_DROP_OLD_PROVIDER_UID = """
DROP INDEX IF EXISTS auth_identities_provider_uid_uq;
"""

# Uniqueness for OAuth (provider, provider_uid) when provider_uid IS NOT NULL
DDL_IDX_PROVIDER_UID = """
CREATE UNIQUE INDEX IF NOT EXISTS auth_identities_provider_uid_uq
ON auth_identities (provider, provider_uid)
WHERE provider_uid IS NOT NULL;
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
  NULL;
END $$;
"""

def ensure_table(conn):
    with conn.cursor() as cur:
        cur.execute(DDL)
        cur.execute(DDL_IDX_USER_PROVIDER)
        cur.execute(DDL_IDX_LOCAL_EMAIL)
        # drop the problematic legacy unique and create the correct partial unique
        cur.execute(DDL_DROP_OLD_PROVIDER_UID)
        cur.execute(DDL_IDX_PROVIDER_UID)
        cur.execute(DDL_CHECK_LOCAL_REQ)
    conn.commit()

class IdentityCreate(BaseModel):
    user_id: int
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    provider: str = "local"
    provider_uid: Optional[str] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

def _validate_password_strength(pw: str) -> None:
    has_lower = any(c.islower() for c in pw)
    has_upper = any(c.isupper() for c in pw)
    has_digit = any(c.isdigit() for c in pw)
    has_symbol = any(c in string.punctuation for c in pw)

    if not (has_lower and has_upper and has_digit and has_symbol):
        raise HTTPException(
            status_code=422,
            detail=(
                "La nueva contraseña debe incluir al menos una letra minúscula, "
                "una mayúscula, un dígito y un símbolo."
            ),
        )
    

@router.get("/")
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

@router.post("/")
def create_auth_identity(payload: IdentityCreate):
    """
    Use this to manually link an identity (e.g., after OAuth completes).
    For 'local', you MUST provide email + password (CHECK constraint also enforces this).
    """
    if payload.provider == "local":
        if not payload.email or not payload.password:
            raise HTTPException(status_code=422, detail="Local identity requires email and password")
        # For local, keep provider_uid as NULL (works with partial unique)
        pwd_hash = argon2.hash(payload.password)
    else:
        pwd_hash = None

    try:
        with db.connect() as conn:
            row = db.fetchone(
                conn,
                """
                INSERT INTO auth_identities(user_id, provider, provider_uid, email, password_hash)
                VALUES (%s,%s,%s,%s,%s)
                RETURNING id, user_id, provider, provider_uid, email, created_at
                """,
                [
                    payload.user_id,
                    payload.provider,
                    payload.provider_uid,  # keep None for 'local'
                    str(payload.email) if payload.email else None,
                    pwd_hash,
                ],
            )
        return row
    except Exception as e:
        msg = str(e).lower()
        # Map uniques to clean 409s
        if "auth_identities_user_provider_uq" in msg:
            raise HTTPException(status_code=409, detail="User already has an identity for this provider")
        if "auth_identities_local_email_uq" in msg:
            raise HTTPException(status_code=409, detail="Local account already exists for this email")
        if "auth_identities_provider_uid_uq" in msg:
            raise HTTPException(status_code=409, detail="This provider identity already exists")
        raise

@router.patch("/me/password")
def change_my_password(
    payload: PasswordChange,
    auth_ctx = Depends(get_current_user),
):
    user = auth_ctx["user"]
    user_id = user["id"]

    # Basic backend-side validation
    if len(payload.new_password) < 8:
        raise HTTPException(
            status_code=422,
            detail="La nueva contraseña debe tener al menos 8 caracteres.",
        )

    # Strength validation
    _validate_password_strength(payload.new_password)

    with db.connect() as conn:
        # 1) Get the local identity for this user
        identity = db.fetchone(
            conn,
            """
            SELECT id, provider, password_hash
            FROM auth_identities
            WHERE user_id = %s AND provider = 'local'
            """,
            [user_id],
        )

        if not identity:
            # User logged in via OAuth only, no local password to change
            raise HTTPException(
                status_code=400,
                detail=(
                    "Tu cuenta no tiene una contraseña local configurada. "
                    "Inicia sesión con tu proveedor (Google, GitHub, etc.) "
                    "o configura primero una contraseña local."
                ),
            )

        if not identity["password_hash"]:
            # Just in case, guard against null hash
            raise HTTPException(
                status_code=400,
                detail="Tu cuenta no usa contraseña local.",
            )

        # 2) Verify current password
        if not argon2.verify(payload.current_password, identity["password_hash"]):
            raise HTTPException(
                status_code=401,
                detail="La contraseña actual no es correcta.",
            )

        # 3) Prevent reusing the same password
        if argon2.verify(payload.new_password, identity["password_hash"]):
            raise HTTPException(
                status_code=422,
                detail="La nueva contraseña no puede ser igual a la actual.",
            )

        # 4) Hash and update
        new_hash = argon2.hash(payload.new_password)

        # If you have db.execute helper:
        db.execute(
            conn,
            "UPDATE auth_identities SET password_hash = %s WHERE id = %s",
            [new_hash, identity["id"]],
        )

    return {"ok": True}

