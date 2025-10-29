from typing import Optional, Any

from fastapi import APIRouter
from pydantic import BaseModel

from .. import db


router = APIRouter(prefix="/audit-logs", tags=["AuditLogs"])


DDL = """
CREATE TABLE IF NOT EXISTS audit_logs (
    id             BIGSERIAL PRIMARY KEY,
    actor_user_id  BIGINT REFERENCES users(id) ON DELETE SET NULL,
    action         TEXT NOT NULL,
    entity_table   TEXT,
    entity_id      BIGINT,
    metadata       JSONB,
    created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auditlogs_actor   ON audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_auditlogs_entity  ON audit_logs(entity_table, entity_id);
CREATE INDEX IF NOT EXISTS idx_auditlogs_created ON audit_logs(created_at);
"""


def ensure_table(conn) -> None:
    with conn.cursor() as cur:
        cur.execute(DDL)
    conn.commit()


class AuditLogCreate(BaseModel):
    actor_user_id: Optional[int] = None
    action: str
    entity_table: Optional[str] = None
    entity_id: Optional[int] = None
    metadata: Optional[dict[str, Any]] = None


@router.get("")
def list_audit_logs(actor_user_id: Optional[int] = None, entity_table: Optional[str] = None, entity_id: Optional[int] = None):
    base = "SELECT * FROM audit_logs"
    clauses = []
    params: list = []
    if actor_user_id is not None:
        clauses.append("actor_user_id=%s")
        params.append(actor_user_id)
    if entity_table is not None:
        clauses.append("entity_table=%s")
        params.append(entity_table)
    if entity_id is not None:
        clauses.append("entity_id=%s")
        params.append(entity_id)
    if clauses:
        base += " WHERE " + " AND ".join(clauses)
    base += " ORDER BY created_at DESC LIMIT 300"
    with db.connect() as conn:
        rows = db.fetchall(conn, base, params)
    return {"items": rows}


@router.post("")
def create_audit_log(payload: AuditLogCreate):
    with db.connect() as conn:
        row = db.fetchone(
            conn,
            """
            INSERT INTO audit_logs(actor_user_id, action, entity_table, entity_id, metadata)
            VALUES (%s,%s,%s,%s,%s) RETURNING *
            """,
            [payload.actor_user_id, payload.action, payload.entity_table, payload.entity_id, payload.metadata],
        )
    return row
