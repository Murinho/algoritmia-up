from typing import Optional

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, AnyUrl, Field

from .. import db
from .auth import get_current_user
from .audit_logs import add_audit_log

router = APIRouter(prefix="/resources", tags=["Resources"])

DDL = """
CREATE TABLE IF NOT EXISTS resources (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    url TEXT NOT NULL,
    tags TEXT[],
    difficulty INT CHECK (difficulty BETWEEN 1 AND 5),
    added_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
"""

def ensure_table(conn) -> None:
    with conn.cursor() as cur:
        cur.execute(DDL)
    conn.commit()

def row_to_resource(row: dict) -> dict:
    """Normalize DB row → JSON shape expected by the frontend."""
    created_at = row.get("created_at")
    return {
        "id": row["id"],
        "title": row["title"],
        "type": row["type"],
        "url": row["url"],
        "tags": row["tags"] or [],
        "difficulty": row["difficulty"] or 3,  # default if NULL
        "notes": row["notes"] or "",
        "addedBy": row.get("added_by_name") or row.get("added_by") or "",
        # send ISO string to frontend
        "createdAt": created_at.isoformat() if created_at is not None else None,
    }

class ResourceCreate(BaseModel):
    type: str
    title: str
    url: AnyUrl
    tags: Optional[list[str]] = None
    difficulty: Optional[int] = Field(default=None, ge=1, le=5)
    notes: Optional[str] = None

class ResourceUpdate(BaseModel):
    type: Optional[str] = None
    title: Optional[str] = None
    url: Optional[AnyUrl] = None
    tags: Optional[list[str]] = None
    difficulty: Optional[int] = Field(default=None, ge=1, le=5)
    notes: Optional[str] = None

@router.get("")
def list_resources(
    type: Optional[str] = None,
    difficulty: Optional[str] = None,
    auth = Depends(get_current_user),  # ensure only logged-in users, don't remove!
):
    base = """
        SELECT
            r.*,
            u.full_name AS added_by_name
        FROM resources r
        LEFT JOIN users u ON r.added_by = u.id
    """
    clauses = []
    params: list = []

    if type:
        clauses.append("r.type = %s")
        params.append(type)
    if difficulty:
        clauses.append("r.difficulty = %s")
        params.append(difficulty)

    if clauses:
        base += " WHERE " + " AND ".join(clauses)

    base += " ORDER BY r.created_at DESC LIMIT 200"

    with db.connect() as conn:
        rows = db.fetchall(conn, base, params)

    items = [row_to_resource(row) for row in rows]
    return {"items": items}


@router.post("")
def create_resource(payload: ResourceCreate, auth=Depends(get_current_user)):
    """
    Only 'coach' or 'admin' can create resources.
    `auth` looks like: {"session": ..., "user": ...}
    """
    user = auth["user"]
    role = user.get("role")
    user_id = user["id"]

    if role not in ("coach", "admin"):
        raise HTTPException(status_code=403, detail="Only coaches/admins can create resources")

    with db.connect() as conn:
        # first insert
        inserted = db.fetchone(
            conn,
            """
            INSERT INTO resources(
                title, type, url, tags, difficulty,
                added_by, notes
            )
            VALUES (%s,%s,%s,%s,%s,%s,%s)
            RETURNING id
            """,
            [
                payload.title,
                payload.type,
                str(payload.url),
                payload.tags,
                payload.difficulty,
                user_id,
                payload.notes,
            ],
        )

        # then re-fetch with JOIN to get added_by_name
        row = db.fetchone(
            conn,
            """
            SELECT
                r.*,
                u.full_name AS added_by_name
            FROM resources r
            LEFT JOIN users u ON r.added_by = u.id
            WHERE r.id = %s
            """,
            [inserted["id"]],
        )

    resource = row_to_resource(row)

    add_audit_log(
        actor_user_id=user_id,
        action="resource.create",
        entity_table="resources",
        entity_id=row["id"],
        metadata={
            "title": row["title"],
            "type": row["type"],
            "difficulty": row["difficulty"],
            "tags": row["tags"] or [],
            "added_by": row["added_by"],
        },
    )

    return resource


@router.get("/{resource_id}")
def get_resource(
    resource_id: int, 
    auth = Depends(get_current_user) # ensure only logged-in users, don't remove!
):
    with db.connect() as conn:
        row = db.fetchone(
            conn,
            """
            SELECT
                r.*,
                u.full_name AS added_by_name
            FROM resources r
            LEFT JOIN users u ON r.added_by = u.id
            WHERE r.id = %s
            """,
            [resource_id],
        )
    if not row:
        raise HTTPException(status_code=404, detail="Resource not found")
    return row_to_resource(row)


@router.patch("/{resource_id}")
def update_resource(resource_id: int, payload: ResourceUpdate, auth=Depends(get_current_user)):
    user = auth["user"]
    role = user.get("role")
    user_id = user["id"]

    if role not in ("coach", "admin"):
        raise HTTPException(status_code=403, detail="Only coaches/admins can update resources")

    data = payload.model_dump(exclude_unset=True)
    if "url" in data and data["url"] is not None:
        data["url"] = str(data["url"])
        
    if not data:
        raise HTTPException(status_code=400, detail="No fields to update")

    cols = ", ".join(f"{k}=%s" for k in data.keys())
    params = list(data.values()) + [resource_id]

    with db.connect() as conn:
        updated = db.fetchone(
            conn,
            f"UPDATE resources SET {cols} WHERE id=%s RETURNING id",
            params,
        )

        if not updated:
            raise HTTPException(status_code=404, detail="Resource not found")

        row = db.fetchone(
            conn,
            """
            SELECT
                r.*,
                u.full_name AS added_by_name
            FROM resources r
            LEFT JOIN users u ON r.added_by = u.id
            WHERE r.id = %s
            """,
            [updated["id"]],
        )

    resource = row_to_resource(row)

    add_audit_log(
        actor_user_id=user_id,
        action="resource.update",
        entity_table="resources",
        entity_id=row["id"],
        metadata={
            "changed_fields": list(data.keys()),
            "title": row["title"],
            "type": row["type"],
            "difficulty": row["difficulty"],
        },
    )

    return resource


@router.delete("/{resource_id}")
def delete_resource(resource_id: int, auth=Depends(get_current_user)):
    user = auth["user"]
    role = user.get("role")
    user_id = user["id"]

    if role not in ("coach", "admin"):
        raise HTTPException(status_code=403, detail="Only coaches/admins can delete resources")

    with db.connect() as conn:
        # Fetch before deleting for logging purposes
        row = db.fetchone(
            conn,
            "SELECT * FROM resources WHERE id=%s",
            [resource_id],
        )

        if not row:
            raise HTTPException(status_code=404, detail="Resource not found")

        count = db.execute(conn, "DELETE FROM resources WHERE id=%s", [resource_id])

    add_audit_log(
        actor_user_id=user_id,
        action="resource.delete",
        entity_table="resources",
        entity_id=resource_id,
        metadata={
            "title": row["title"],
            "type": row["type"],
            "difficulty": row["difficulty"],
            "tags": row["tags"] or [],
            "added_by": row["added_by"],
        },
    )

    return {"deleted": True}