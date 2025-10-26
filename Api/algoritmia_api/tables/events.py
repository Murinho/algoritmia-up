from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from .. import db


router = APIRouter(prefix="/events", tags=["Events"])


DDL = """
CREATE TABLE IF NOT EXISTS events (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    location TEXT,
    description TEXT,
    image_url TEXT,
    topic TEXT,
    organizer TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
"""


def ensure_table(conn) -> None:
    with conn.cursor() as cur:
        cur.execute(DDL)
    conn.commit()


class EventCreate(BaseModel):
    title: str
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    location: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    topic: Optional[str] = None
    organizer: Optional[str] = None


class EventUpdate(BaseModel):
    title: Optional[str] = None
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    location: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    topic: Optional[str] = None
    organizer: Optional[str] = None


@router.get("")
def list_events(upcoming_only: bool = Query(False)):
    base = "SELECT * FROM events"
    if upcoming_only:
        base += " WHERE ends_at IS NULL OR ends_at >= NOW()"
    base += " ORDER BY COALESCE(starts_at, created_at) DESC LIMIT 200"
    with db.connect() as conn:
        rows = db.fetchall(conn, base)
    return {"items": rows}


@router.get("/{event_id}")
def get_event(event_id: int):
    with db.connect() as conn:
        row = db.fetchone(conn, "SELECT * FROM events WHERE id=%s", [event_id])
    if not row:
        raise HTTPException(status_code=404, detail="Event not found")
    return row


@router.post("")
def create_event(payload: EventCreate):
    with db.connect() as conn:
        row = db.fetchone(
            conn,
            """
            INSERT INTO events(title, starts_at, ends_at, location, description, image_url, topic, organizer)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s) RETURNING *
            """,
            [
                payload.title,
                payload.starts_at,
                payload.ends_at,
                payload.location,
                payload.description,
                payload.image_url,
                payload.topic,
                payload.organizer,
            ],
        )
    return row


@router.patch("/{event_id}")
def update_event(event_id: int, payload: EventUpdate):
    data = payload.model_dump(exclude_unset=True)
    if not data:
        raise HTTPException(status_code=400, detail="No fields to update")
    cols = ", ".join(f"{k}=%s" for k in data.keys())
    params = list(data.values()) + [event_id]
    with db.connect() as conn:
        row = db.fetchone(conn, f"UPDATE events SET {cols} WHERE id=%s RETURNING *", params)
    if not row:
        raise HTTPException(status_code=404, detail="Event not found")
    return row


@router.delete("/{event_id}")
def delete_event(event_id: int):
    with db.connect() as conn:
        count = db.execute(conn, "DELETE FROM events WHERE id=%s", [event_id])
    if count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"deleted": True}
