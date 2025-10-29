from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from .. import db


router = APIRouter(prefix="/email-verification-tokens", tags=["EmailVerificationTokens"])


DDL = """
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    used_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_email_tokens_user ON email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_tokens_exp  ON email_verification_tokens(expires_at);
"""


def ensure_table(conn) -> None:
    with conn.cursor() as cur:
        cur.execute(DDL)
    conn.commit()


class EmailTokenCreate(BaseModel):
    user_id: int
    ttl_minutes: int = 60
    token_hash: str


@router.get("")
def list_email_verification_tokens(user_id: Optional[int] = None):
    base = "SELECT * FROM email_verification_tokens"
    params: list = []
    if user_id is not None:
        base += " WHERE user_id=%s"
        params.append(user_id)
    base += " ORDER BY created_at DESC LIMIT 200"
    with db.connect() as conn:
        rows = db.fetchall(conn, base, params)
    return {"items": rows}


@router.post("")
def create_email_verification_token(payload: EmailTokenCreate):
    expires_at = datetime.utcnow() + timedelta(minutes=payload.ttl_minutes)
    with db.connect() as conn:
        row = db.fetchone(
            conn,
            """
            INSERT INTO email_verification_tokens(user_id, token_hash, expires_at)
            VALUES (%s,%s,%s) RETURNING *
            """,
            [payload.user_id, payload.token_hash, expires_at],
        )
    return row


@router.post("/{token_id}/mark-used")
def mark_email_token_used(token_id: str):
    with db.connect() as conn:
        row = db.fetchone(conn, "UPDATE email_verification_tokens SET used_at=NOW() WHERE id=%s RETURNING *", [token_id])
    if not row:
        raise HTTPException(status_code=404, detail="Token not found")
    return row
