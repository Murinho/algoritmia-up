from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from .. import db
from .auth import get_current_user
from .audit_logs import add_audit_log

router = APIRouter(prefix="/password-reset-tokens", tags=["PasswordResetTokens"])


DDL = """
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    used_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_pwreset_tokens_user ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_pwreset_tokens_exp  ON password_reset_tokens(expires_at);
"""


def ensure_table(conn) -> None:
    with conn.cursor() as cur:
        cur.execute(DDL)
    conn.commit()


class PasswordResetTokenCreate(BaseModel):
    user_id: int
    ttl_minutes: int = 30
    token_hash: str


def _require_admin(auth_ctx = Depends(get_current_user)):
    """
    Ensure the caller is an authenticated admin.

    We keep this helper small and re-use it in all endpoints that must be
    admin-only. The "system" (backend code) should typically bypass HTTP and
    call DB helpers or Python functions directly rather than going through
    these endpoints.
    """
    user = auth_ctx["user"]
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admins only")
    return auth_ctx


@router.get("")
def list_password_reset_tokens(
    user_id: Optional[int] = None,
    auth_ctx = Depends(_require_admin),  # ⬅ admin-only
):
    base = "SELECT * FROM password_reset_tokens"
    params: list = []
    if user_id is not None:
        base += " WHERE user_id=%s"
        params.append(user_id)
    base += " ORDER BY created_at DESC LIMIT 200"
    with db.connect() as conn:
        rows = db.fetchall(conn, base, params)
    return {"items": rows}


@router.post("")
def create_password_reset_token(
    payload: PasswordResetTokenCreate,
    auth_ctx = Depends(_require_admin),  # ⬅ admin-only
):
    admin = auth_ctx["user"]
    admin_id = admin["id"]

    expires_at = datetime.utcnow() + timedelta(minutes=payload.ttl_minutes)
    with db.connect() as conn:
        row = db.fetchone(
            conn,
            """
            INSERT INTO password_reset_tokens(user_id, token_hash, expires_at)
            VALUES (%s,%s,%s) RETURNING *
            """,
            [payload.user_id, payload.token_hash, expires_at],
        )

    add_audit_log(
        actor_user_id=admin_id,
        action="password_reset_token.create",
        entity_table="password_reset_tokens",
        entity_id=None,  # UUID → store it in metadata instead
        metadata={
            "token_id": str(row["id"]),
            "user_id": row["user_id"],
            "ttl_minutes": payload.ttl_minutes,
            "expires_at": row["expires_at"].isoformat(),
            "token_hash_present": bool(row["token_hash"]),
        },
    )

    return row


@router.post("/{token_id}/mark-used")
def mark_password_reset_token_used(
    token_id: str,
    auth_ctx = Depends(_require_admin),  # ⬅ admin-only
):
    admin = auth_ctx["user"]
    admin_id = admin["id"]

    with db.connect() as conn:
        row = db.fetchone(
            conn,
            "UPDATE password_reset_tokens SET used_at=NOW() WHERE id=%s RETURNING *",
            [token_id],
        )
    if not row:
        raise HTTPException(status_code=404, detail="Token not found")


    add_audit_log(
        actor_user_id=admin_id,
        action="password_reset_token.mark_used",
        entity_table="password_reset_tokens",
        entity_id=None,  # UUID goes into metadata
        metadata={
            "token_id": str(row["id"]),
            "user_id": row["user_id"],
            "used_at": row["used_at"].isoformat() if row["used_at"] else None,
        },
    )

    return row

