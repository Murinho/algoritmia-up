from datetime import date
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, EmailStr, Field

from .. import db


router = APIRouter(prefix="/users", tags=["Users"])


DDL = """
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    full_name TEXT NOT NULL,
    email CITEXT UNIQUE NOT NULL,
    codeforces_handle TEXT UNIQUE NOT NULL,
    birthdate DATE NOT NULL,
    degree_program TEXT NOT NULL,
    entry_year INT NOT NULL CHECK (entry_year BETWEEN 2000 AND 2100),
    country TEXT NOT NULL,
    profile_image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
"""


def ensure_table(conn) -> None:
    with conn.cursor() as cur:
        cur.execute(DDL)
    conn.commit()


class UserCreate(BaseModel):
    full_name: str = Field(min_length=1)
    email: EmailStr
    codeforces_handle: str = Field(min_length=1)
    birthdate: date
    degree_program: str
    entry_year: int = Field(ge=2000, le=2100)
    country: str
    profile_image_url: Optional[str] = None


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    codeforces_handle: Optional[str] = None
    birthdate: Optional[date] = None
    degree_program: Optional[str] = None
    entry_year: Optional[int] = Field(default=None, ge=2000, le=2100)
    country: Optional[str] = None
    profile_image_url: Optional[str] = None


@router.get("")
def list_users(q: Optional[str] = Query(None, description="Search by name or email")):
    sql = "SELECT * FROM users"
    params = []
    if q:
        sql += " WHERE full_name ILIKE %s OR email::text ILIKE %s"
        like = f"%{q}%"
        params.extend([like, like])
    sql += " ORDER BY created_at DESC LIMIT 200"
    with db.connect() as conn:
        rows = db.fetchall(conn, sql, params)
    return {"items": rows}


@router.get("/{user_id}")
def get_user(user_id: int):
    with db.connect() as conn:
        row = db.fetchone(conn, "SELECT * FROM users WHERE id=%s", [user_id])
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return row


@router.get("/by-email")
def get_user_by_email(email: EmailStr):
    with db.connect() as conn:
        row = db.fetchone(conn, "SELECT * FROM users WHERE email=%s", [str(email)])
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return row


@router.post("")
def create_user(payload: UserCreate):
    with db.connect() as conn:
        sql = (
            "INSERT INTO users (full_name, email, codeforces_handle, birthdate, degree_program, entry_year, country, profile_image_url) "
            "VALUES (%s,%s,%s,%s,%s,%s,%s,%s) RETURNING *"
        )
        row = db.fetchone(
            conn,
            sql,
            [
                payload.full_name,
                str(payload.email),
                payload.codeforces_handle,
                payload.birthdate,
                payload.degree_program,
                payload.entry_year,
                payload.country,
                payload.profile_image_url,
            ],
        )
    return row


@router.patch("/{user_id}")
def update_user(user_id: int, payload: UserUpdate):
    fields = payload.model_dump(exclude_unset=True)
    if not fields:
        raise HTTPException(status_code=400, detail="No fields to update")
    cols = ", ".join(f"{k}=%s" for k in fields.keys())
    params = list(fields.values()) + [user_id]
    with db.connect() as conn:
        row = db.fetchone(conn, f"UPDATE users SET {cols} WHERE id=%s RETURNING *", params)
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return row


@router.delete("/{user_id}")
def delete_user(user_id: int):
    with db.connect() as conn:
        count = db.execute(conn, "DELETE FROM users WHERE id=%s", [user_id])
    if count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"deleted": True}
