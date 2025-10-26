from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from .. import db


router = APIRouter(prefix="/leaderboard", tags=["Leaderboard"])


DDL = """
CREATE TABLE IF NOT EXISTS public.leaderboard (
    id BIGSERIAL PRIMARY KEY,
    user_name TEXT NOT NULL,
    points INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
"""


def ensure_table(conn) -> None:
    with conn.cursor() as cur:
        cur.execute(DDL)
    conn.commit()


class LeaderboardEntryCreate(BaseModel):
    user_name: str
    points: int


class LeaderboardEntryUpdate(BaseModel):
    points: int


@router.get("")
def list_leaderboard(limit: int = Query(100, ge=1, le=1000)):
    with db.connect() as conn:
        rows = db.fetchall(conn, "SELECT * FROM leaderboard ORDER BY points DESC, id ASC LIMIT %s", [limit])
    return {"items": rows}


@router.post("")
def create_leaderboard_entry(payload: LeaderboardEntryCreate):
    with db.connect() as conn:
        row = db.fetchone(
            conn,
            "INSERT INTO leaderboard(user_name, points) VALUES(%s,%s) RETURNING *",
            [payload.user_name, payload.points],
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
