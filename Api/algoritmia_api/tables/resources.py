from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, AnyUrl

from .. import db


router = APIRouter(prefix="/resources", tags=["Resources"])


DDL = """
CREATE TABLE IF NOT EXISTS resources (
    id BIGSERIAL PRIMARY KEY,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    tags TEXT[],
    difficulty TEXT NOT NULL,
    added_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
"""


def ensure_table(conn) -> None:
    with conn.cursor() as cur:
        cur.execute(DDL)
    conn.commit()


class ResourceCreate(BaseModel):
    type: str
    title: str
    url: AnyUrl
    tags: Optional[list[str]] = None
    difficulty: str
    added_by: Optional[int] = None


class ResourceUpdate(BaseModel):
    type: Optional[str] = None
    title: Optional[str] = None
    url: Optional[AnyUrl] = None
    tags: Optional[list[str]] = None
    difficulty: Optional[str] = None


@router.get("")
def list_resources(type: Optional[str] = None, difficulty: Optional[str] = None):
    base = "SELECT * FROM resources"
    clauses = []
    params: list = []
    if type:
        clauses.append("type=%s")
        params.append(type)
    if difficulty:
        clauses.append("difficulty=%s")
        params.append(difficulty)
    if clauses:
        base += " WHERE " + " AND ".join(clauses)
    base += " ORDER BY created_at DESC LIMIT 200"
    with db.connect() as conn:
        rows = db.fetchall(conn, base, params)
    return {"items": rows}


@router.get("/{resource_id}")
def get_resource(resource_id: int):
    with db.connect() as conn:
        row = db.fetchone(conn, "SELECT * FROM resources WHERE id=%s", [resource_id])
    if not row:
        raise HTTPException(status_code=404, detail="Resource not found")
    return row


@router.post("")
def create_resource(payload: ResourceCreate):
    with db.connect() as conn:
        row = db.fetchone(
            conn,
            """
            INSERT INTO resources(type, title, url, tags, difficulty, added_by)
            VALUES (%s,%s,%s,%s,%s,%s) RETURNING *
            """,
            [payload.type, payload.title, str(payload.url), payload.tags, payload.difficulty, payload.added_by],
        )
    return row


@router.patch("/{resource_id}")
def update_resource(resource_id: int, payload: ResourceUpdate):
    data = payload.model_dump(exclude_unset=True)
    if not data:
        raise HTTPException(status_code=400, detail="No fields to update")
    cols = ", ".join(f"{k}=%s" for k in data.keys())
    params = list(data.values()) + [resource_id]
    with db.connect() as conn:
        row = db.fetchone(conn, f"UPDATE resources SET {cols} WHERE id=%s RETURNING *", params)
    if not row:
        raise HTTPException(status_code=404, detail="Resource not found")
    return row


@router.delete("/{resource_id}")
def delete_resource(resource_id: int):
    with db.connect() as conn:
        count = db.execute(conn, "DELETE FROM resources WHERE id=%s", [resource_id])
    if count == 0:
        raise HTTPException(status_code=404, detail="Resource not found")
    return {"deleted": True}
