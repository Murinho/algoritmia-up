# leaderboard.py (fixed)
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from .. import db

router = APIRouter(prefix="/leaderboard", tags=["Leaderboard"])

DDL = """
CREATE TABLE IF NOT EXISTS leaderboard (
    id BIGSERIAL PRIMARY KEY,
    -- Prefer user_id referencing users instead of user_name to avoid duplicates/misspells
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id)
);
"""

CREATE_INDEXES = [
    # handy if you query “top N” often
    "CREATE INDEX IF NOT EXISTS leaderboard_points_desc_idx ON leaderboard (points DESC);",
]

def ensure_table(conn) -> None:
    with conn.cursor() as cur:
        cur.execute(DDL)
        for stmt in CREATE_INDEXES:
            cur.execute(stmt)
    conn.commit()

class LeaderboardEntryCreate(BaseModel):
    user_id: int
    points: int

class LeaderboardEntryUpdate(BaseModel):
    points: int

@router.get("")
def list_leaderboard(limit: int = Query(100, ge=1, le=1000)):
    with db.connect() as conn:
        rows = db.fetchall(
            conn,
            "SELECT * FROM leaderboard ORDER BY points DESC, id ASC LIMIT %s",
            [limit],
        )
    return {"items": rows}

@router.post("")
def create_leaderboard_entry(payload: LeaderboardEntryCreate):
    with db.connect() as conn:
        row = db.fetchone(
            conn,
            "INSERT INTO leaderboard(user_id, points) VALUES(%s,%s) RETURNING *",
            [payload.user_id, payload.points],
        )
    return row

@router.patch("/{entry_id}")
def update_leaderboard_entry(entry_id: int, payload: LeaderboardEntryUpdate):
    with db.connect() as conn:
        row = db.fetchone(
            conn,
            "UPDATE leaderboard SET points=%s WHERE id=%s RETURNING *",
            [payload.points, entry_id],
        )
    if not row:
        raise HTTPException(status_code=404, detail="Entry not found")
    return row

@router.delete("/{entry_id}")
def delete_leaderboard_entry(entry_id: int):
    with db.connect() as conn:
        count = db.execute(conn, "DELETE FROM leaderboard WHERE id=%s", [entry_id])
    if count == 0:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"deleted": True}
