from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel, AnyUrl, Field

from .. import db
from .auth import get_current_user

router = APIRouter(prefix="/contests", tags=["Contests"])

DDL = """
CREATE TABLE IF NOT EXISTS contests (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    platform TEXT NOT NULL,
    url TEXT NOT NULL,
    tags TEXT[],
    difficulty INT CHECK (difficulty BETWEEN 1 AND 5),
    added_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    format TEXT NOT NULL,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    location TEXT,
    season TEXT,
    notes TEXT
);
"""


def ensure_table(conn) -> None:
    with conn.cursor() as cur:
        cur.execute(DDL)
    conn.commit()


def row_to_contest(row: dict) -> dict:
    """Normalize DB row → JSON shape expected by the frontend."""
    return {
        "id": row["id"],
        "title": row["title"],
        "platform": row["platform"],
        "url": row["url"],
        "tags": row["tags"] or [],
        "difficulty": row["difficulty"] or 3,  # default if NULL
        "format": row["format"],
        "startsAt": row["start_at"].isoformat(),
        "endsAt": row["end_at"].isoformat(),
        "location": row["location"] or "",
        "season": row["season"] or "",
        "notes": row["notes"] or "",
    }

class ContestCreate(BaseModel):
    title: str
    platform: str
    url: AnyUrl
    tags: Optional[list[str]] = None
    difficulty: Optional[int] = Field(default=None, ge=1, le=5)
    format: str
    start_at: datetime
    end_at: datetime
    location: Optional[str] = None
    season: Optional[str] = None
    notes: Optional[str] = None


class ContestUpdate(BaseModel):
    title: Optional[str] = None
    platform: Optional[str] = None
    url: Optional[AnyUrl] = None
    tags: Optional[list[str]] = None
    difficulty: Optional[int] = Field(default=None, ge=1, le=5)
    format: Optional[str] = None
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
    location: Optional[str] = None
    season: Optional[str] = None
    notes: Optional[str] = None


@router.get("")
def list_contests(
    platform: Optional[str] = None,
    season: Optional[str] = None,
    upcoming_only: bool = Query(False),
):
    base = "SELECT * FROM contests"
    clauses = []
    params: list = []

    if platform:
        clauses.append("platform=%s")
        params.append(platform)
    if season:
        clauses.append("season=%s")
        params.append(season)
    if upcoming_only:
        clauses.append("end_at >= NOW()")

    if clauses:
        base += " WHERE " + " AND ".join(clauses)

    base += " ORDER BY start_at DESC LIMIT 200"

    with db.connect() as conn:
        rows = db.fetchall(conn, base, params)
    return {"items": [row_to_contest(r) for r in rows]}


@router.get("/{contest_id}")
def get_contest(contest_id: int):
    with db.connect() as conn:
        row = db.fetchone(conn, "SELECT * FROM contests WHERE id=%s", [contest_id])
    if not row:
        raise HTTPException(status_code=404, detail="Contest not found")
    return row_to_contest(row)


@router.post("")
def create_contest(payload: ContestCreate, auth=Depends(get_current_user)):
    """
    Only 'coach' or 'admin' can create contests.
    `auth` looks like: {"session": ..., "user": ...}
    """
    user = auth["user"]
    role = user.get("role")
    user_id = user["id"]

    if role not in ("coach", "admin"):
        raise HTTPException(status_code=403, detail="Only coaches/admins can create contests")

    if payload.start_at >= payload.end_at:
        raise HTTPException(status_code=400, detail="start_at must be before end_at")

    with db.connect() as conn:
        row = db.fetchone(
            conn,
            """
            INSERT INTO contests(
                title, platform, url, tags, difficulty,
                added_by, format, start_at, end_at, location, season, notes
            )
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            RETURNING *
            """,
            [
                payload.title,
                payload.platform,
                str(payload.url),
                payload.tags,
                payload.difficulty,
                user_id,
                payload.format,
                payload.start_at,
                payload.end_at,
                payload.location,
                payload.season,
                payload.notes,
            ],
        )
    return row_to_contest(row)


@router.patch("/{contest_id}")
def update_contest(contest_id: int, payload: ContestUpdate, auth=Depends(get_current_user)):
    user = auth["user"]
    role = user.get("role")

    if role not in ("coach", "admin"):
        raise HTTPException(status_code=403, detail="Only coaches/admins can update contests")

    data = payload.model_dump(exclude_unset=True)

    if "url" in data and data["url"] is not None:
        data["url"] = str(data["url"])

    if not data:
        raise HTTPException(status_code=400, detail="No fields to update")

    # optional: validate start_at < end_at if both present
    if "start_at" in data and "end_at" in data:
        if data["start_at"] >= data["end_at"]:
            raise HTTPException(status_code=400, detail="start_at must be before end_at")

    cols = ", ".join(f"{k}=%s" for k in data.keys())
    params = list(data.values()) + [contest_id]

    with db.connect() as conn:
        row = db.fetchone(conn, f"UPDATE contests SET {cols} WHERE id=%s RETURNING *", params)

    if not row:
        raise HTTPException(status_code=404, detail="Contest not found")
    return row_to_contest(row)


@router.delete("/{contest_id}")
def delete_contest(contest_id: int, auth=Depends(get_current_user)):
    user = auth["user"]
    role = user.get("role")

    if role not in ("coach", "admin"):
        raise HTTPException(status_code=403, detail="Only coaches/admins can delete contests")

    with db.connect() as conn:
        count = db.execute(conn, "DELETE FROM contests WHERE id=%s", [contest_id])

    if count == 0:
        raise HTTPException(status_code=404, detail="Contest not found")
    return {"deleted": True}
