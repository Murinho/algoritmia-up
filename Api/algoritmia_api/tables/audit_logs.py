from typing import Optional, Any

from fastapi import APIRouter, HTTPException, Depends, Request
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


def add_audit_log(
    *,
    actor_user_id: Optional[int],
    action: str,
    entity_table: Optional[str] = None,
    entity_id: Optional[int] = None,
    metadata: Optional[dict[str, Any]] = None,
) -> None:
    """
    Internal helper to append an audit log entry.

    Used by other routers (auth, users, contests, etc.).
    Does NOT depend on get_current_user, so it's safe to import from auth.py.
    """
    with db.connect() as conn:
        db.execute(
            conn,
            """
            INSERT INTO audit_logs(actor_user_id, action, entity_table, entity_id, metadata)
            VALUES (%s,%s,%s,%s,%s)
            """,
            [actor_user_id, action, entity_table, entity_id, metadata],
        )


# ---------- Admin-only dependency without top-level import of auth ----------

def _require_admin(request: Request):
    """
    Lazy-imports get_current_user to avoid circular imports.

    auth.py can safely do:
        from .audit_logs import add_audit_log

    and we only import auth.get_current_user here when a request actually hits
    an /audit-logs endpoint.
    """
    from .auth import get_current_user  # local import breaks the circular dependency

    auth_ctx = get_current_user(request)
    user = auth_ctx["user"]
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Solo administradores pueden ver los logs.")
    return auth_ctx


# ---------- Endpoints (admin-only) ----------

@router.get("")
def list_audit_logs(
    actor_user_id: Optional[int] = None,
    entity_table: Optional[str] = None,
    entity_id: Optional[int] = None,
    auth_ctx = Depends(_require_admin),
):
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


# Optional: keep a POST endpoint for manual/admin insertion.
# You could also delete this if you only log via add_audit_log.

@router.post("")
def create_audit_log_endpoint(
    payload: AuditLogCreate,
    auth_ctx = Depends(_require_admin),
):
    with db.connect() as conn:
        row = db.fetchone(
            conn,
            """
            INSERT INTO audit_logs(actor_user_id, action, entity_table, entity_id, metadata)
            VALUES (%s,%s,%s,%s,%s) RETURNING *
            """,
            [
                payload.actor_user_id,
                payload.action,
                payload.entity_table,
                payload.entity_id,
                payload.metadata,
            ],
        )
    return row
