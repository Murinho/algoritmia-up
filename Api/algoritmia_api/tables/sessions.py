from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from .. import db


router = APIRouter(prefix="/sessions", tags=["Sessions"])


DDL = """
CREATE TABLE IF NOT EXISTS sessions (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at   TIMESTAMPTZ NOT NULL,
    ip           INET,
    user_agent   TEXT,
    revoked_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_exp  ON sessions(expires_at);
"""


def ensure_table(conn) -> None:
    with conn.cursor() as cur:
        cur.execute(DDL)
    conn.commit()


class SessionCreate(BaseModel):
    user_id: int
    ttl_minutes: int = 60 * 24  # 1 day default


@router.get("")
def list_sessions(user_id: Optional[int] = None):
    base = "SELECT * FROM sessions"
    params: list = []
    if user_id is not None:
        base += " WHERE user_id=%s"
        params.append(user_id)
    base += " ORDER BY created_at DESC LIMIT 200"
    with db.connect() as conn:
        rows = db.fetchall(conn, base, params)
    return {"items": rows}


@router.post("")
def create_session(payload: SessionCreate):
    expires_at = datetime.utcnow() + timedelta(minutes=payload.ttl_minutes)
    with db.connect() as conn:
        row = db.fetchone(
            conn,
            "INSERT INTO sessions(user_id, expires_at) VALUES(%s,%s) RETURNING *",
            [payload.user_id, expires_at],
        )
    return row


@router.delete("/{session_id}")
def revoke_session(session_id: str):
    with db.connect() as conn:
        count = db.execute(conn, "DELETE FROM sessions WHERE id=%s", [session_id])
    if count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"deleted": True}
