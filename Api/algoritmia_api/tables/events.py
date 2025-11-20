import uuid
import shutil
import os

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, UploadFile, File, Depends
from pydantic import BaseModel
from pathlib import Path

from .. import db
from .auth import get_current_user
from .audit_logs import add_audit_log

router = APIRouter(prefix="/events", tags=["Events"])

EVENT_BANNER_DIR = Path("uploads/event_banners")
EVENT_BANNER_DIR.mkdir(parents=True, exist_ok=True)

DDL = """
CREATE TABLE IF NOT EXISTS events (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    location TEXT,
    description TEXT,
    image_url TEXT,
    video_call_link TEXT,
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
    video_call_link: Optional[str] = None


class EventUpdate(BaseModel):
    title: Optional[str] = None
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    location: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    video_call_link: Optional[str] = None



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
def create_event(
    payload: EventCreate,
    current = Depends(get_current_user),
):
    user = current["user"]
    role = user.get("role")
    user_id = user["id"]

    if role not in ("coach", "admin"):
        raise HTTPException(status_code=403, detail="Solo coaches o admins pueden crear eventos.")

    if payload.starts_at and payload.ends_at and payload.starts_at >= payload.ends_at:
        raise HTTPException(status_code=400, detail="starts_at must be before ends_at")

    with db.connect() as conn:
        row = db.fetchone(
            conn,
            """
            INSERT INTO events(
                title,
                starts_at,
                ends_at,
                location,
                description,
                image_url,
                video_call_link
            )
            VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING *
            """,
            [
                payload.title,
                payload.starts_at,
                payload.ends_at,
                payload.location,
                payload.description,
                payload.image_url,
                payload.video_call_link,
            ],
        )

    add_audit_log(
        actor_user_id=user_id,
        action="event.create",
        entity_table="events",
        entity_id=row["id"],
        metadata={
            "title": row["title"],
            "starts_at": row["starts_at"].isoformat() if row["starts_at"] else None,
            "ends_at": row["ends_at"].isoformat() if row["ends_at"] else None,
            "location": row["location"],
            "has_image": bool(row["image_url"]),
            "has_video_call_link": bool(row["video_call_link"]),
        },
    )

    return row


@router.post("/upload-banner")
def upload_banner(
    file: UploadFile = File(...),
    current = Depends(get_current_user),
):
    user = current["user"]
    role = user.get("role")
    user_id = user["id"]

    if role not in ("coach", "admin"):
        raise HTTPException(status_code=403, detail="Solo coaches o admins pueden subir banners.")

    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="El archivo debe ser una imagen.")

    os.makedirs(EVENT_BANNER_DIR, exist_ok=True)

    ext = file.filename.split(".")[-1].lower()
    filename = f"{uuid.uuid4()}.{ext}"
    save_path = os.path.join(EVENT_BANNER_DIR, filename)

    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    public_url = f"/static/event_banners/{filename}"

    add_audit_log(
        actor_user_id=user_id,
        action="event.banner_upload",
        entity_table="event_banners",
        entity_id=None,
        metadata={
            "filename": filename,
            "original_filename": file.filename,
            "content_type": file.content_type,
            "public_url": public_url,
        },
    )

    return {"url": public_url}


@router.patch("/{event_id}")
def update_event(
    event_id: int,
    payload: EventUpdate,
    current = Depends(get_current_user),
):
    user = current["user"]
    role = user.get("role")
    user_id = user["id"]

    if role not in ("coach", "admin"):
        raise HTTPException(status_code=403, detail="Solo coaches o admins pueden editar eventos.")

    data = payload.model_dump(exclude_unset=True)
    if not data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    if "starts_at" in data and "ends_at" in data:
        if data["starts_at"] >= data["ends_at"]:
            raise HTTPException(status_code=400, detail="starts_at must be before ends_at")

    cols = ", ".join(f"{k}=%s" for k in data.keys())
    params = list(data.values()) + [event_id]
    with db.connect() as conn:
        row = db.fetchone(conn, f"UPDATE events SET {cols} WHERE id=%s RETURNING *", params)
    if not row:
        raise HTTPException(status_code=404, detail="Event not found")

    add_audit_log(
        actor_user_id=user_id,
        action="event.update",
        entity_table="events",
        entity_id=row["id"],
        metadata={
            "changed_fields": list(data.keys()),
            "title": row["title"],
            "starts_at": row["starts_at"].isoformat() if row["starts_at"] else None,
            "ends_at": row["ends_at"].isoformat() if row["ends_at"] else None,
        },
    )

    return row


@router.delete("/{event_id}")
def delete_event(
    event_id: int,
    current = Depends(get_current_user),
):
    user = current["user"]
    role = user.get("role")
    user_id = user["id"]

    if role not in ("coach", "admin"):
        raise HTTPException(status_code=403, detail="Solo coaches o admins pueden borrar eventos.")

    with db.connect() as conn:
        # Fetch event for logging before deletion
        row = db.fetchone(conn, "SELECT * FROM events WHERE id=%s", [event_id])
        if not row:
            raise HTTPException(status_code=404, detail="Event not found")

        db.execute(conn, "DELETE FROM events WHERE id=%s", [event_id])

    add_audit_log(
        actor_user_id=user_id,
        action="event.delete",
        entity_table="events",
        entity_id=event_id,
        metadata={
            "title": row["title"],
            "starts_at": row["starts_at"].isoformat() if row["starts_at"] else None,
            "ends_at": row["ends_at"].isoformat() if row["ends_at"] else None,
            "location": row["location"],
            "had_image": bool(row["image_url"]),
            "had_video_call_link": bool(row["video_call_link"]),
        },
    )

    return {"deleted": True}


