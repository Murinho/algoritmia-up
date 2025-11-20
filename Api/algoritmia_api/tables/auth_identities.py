import string

from typing import Optional

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from passlib.hash import argon2

from .. import db
from .auth import get_current_user
from .audit_logs import add_audit_log

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
def list_auth_identities(
    user_id: Optional[int] = None,
    auth_ctx = Depends(get_current_user),
):
    """
    List auth identities.

    - Normal users: can only see their own identities.
    - Admins: can see all identities, or filter by user_id.
    """
    current_user = auth_ctx["user"]
    current_role = current_user["role"]
    current_id = current_user["id"]

    base = "SELECT * FROM auth_identities"
    params: list = []

    if current_role != "admin":
        # Non-admins are always restricted to their own identities
        user_id = current_id

    if user_id is not None:
        base += " WHERE user_id = %s"
        params.append(user_id)

    base += " ORDER BY created_at DESC LIMIT 200"

    with db.connect() as conn:
        rows = db.fetchall(conn, base, params)

    return {"items": rows}


@router.post("/")
def create_auth_identity(
    payload: IdentityCreate,
    auth_ctx = Depends(get_current_user),
):
    """
    Create/link an identity.

    - Non-admins: can only create identities for themselves.
    - Admins: can create identities for any user_id.
    """
    current_user = auth_ctx["user"]
    current_role = current_user["role"]
    current_id = current_user["id"]

    target_user_id = payload.user_id or current_id

    # Enforce self-only for non-admins
    if current_role != "admin" and target_user_id != current_id:
        raise HTTPException(
            status_code=403,
            detail="Solo un administrador puede crear identidades para otros usuarios.",
        )

    if payload.provider == "local":
        if not payload.email or not payload.password:
            raise HTTPException(
                status_code=422,
                detail="Local identity requires email and password",
            )
        pwd_hash = argon2.hash(payload.password)
        provider_uid = None  # enforce NULL for local
    else:
        pwd_hash = None
        provider_uid = payload.provider_uid

    try:
        with db.connect() as conn:
            row = db.fetchone(
                conn,
                """
                INSERT INTO auth_identities(user_id, provider, provider_uid, email, password_hash)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id, user_id, provider, provider_uid, email, created_at
                """,
                [
                    target_user_id,
                    payload.provider,
                    provider_uid,
                    str(payload.email) if payload.email else None,
                    pwd_hash,
                ],
            )

        add_audit_log(
            actor_user_id=current_id,
            action="auth_identity.create",
            entity_table="auth_identities",
            entity_id=row["id"],
            metadata={
                "provider": row["provider"],
                "target_user_id": row["user_id"],
                "is_self": (row["user_id"] == current_id),
                # To avoid leaking email contents, just log whether it's present.
                "email_present": bool(row["email"]),
            },
        )

        return row

    except Exception as e:
        msg = str(e).lower()
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

    if len(payload.new_password) < 8:
        raise HTTPException(
            status_code=422,
            detail="La nueva contraseña debe tener al menos 8 caracteres.",
        )

    _validate_password_strength(payload.new_password)

    with db.connect() as conn:
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
            raise HTTPException(
                status_code=400,
                detail=(
                    "Tu cuenta no tiene una contraseña local configurada. "
                    "Inicia sesión con tu proveedor (Google, GitHub, etc.) "
                    "o configura primero una contraseña local."
                ),
            )

        if not identity["password_hash"]:
            raise HTTPException(
                status_code=400,
                detail="Tu cuenta no usa contraseña local.",
            )

        if not argon2.verify(payload.current_password, identity["password_hash"]):
            raise HTTPException(
                status_code=401,
                detail="La contraseña actual no es correcta.",
            )

        if argon2.verify(payload.new_password, identity["password_hash"]):
            raise HTTPException(
                status_code=422,
                detail="La nueva contraseña no puede ser igual a la actual.",
            )

        new_hash = argon2.hash(payload.new_password)

        db.execute(
            conn,
            "UPDATE auth_identities SET password_hash = %s WHERE id = %s",
            [new_hash, identity["id"]],
        )

    add_audit_log(
        actor_user_id=user_id,
        action="auth_password.change",
        entity_table="auth_identities",
        entity_id=identity["id"],
        metadata={
            "provider": identity["provider"],
            # You might add a marker if later you allow multiple identities:
            # "reason": "user_initiated"
        },
    )

    return {"ok": True}

