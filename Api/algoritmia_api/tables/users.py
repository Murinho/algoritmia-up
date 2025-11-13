from datetime import date
from typing import Optional, Literal  # 👈 added Literal

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, EmailStr, Field

from .. import db

router = APIRouter(prefix="/users", tags=["Users"])

DDL = """
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    full_name TEXT NOT NULL,
    preferred_name TEXT NOT NULL,
    email CITEXT UNIQUE NOT NULL,
    codeforces_handle TEXT UNIQUE NOT NULL,
    birthdate DATE NOT NULL,
    degree_program TEXT NOT NULL,
    entry_year INT NOT NULL CHECK (entry_year BETWEEN 2000 AND 2100),
    entry_month INT NOT NULL CHECK (entry_month BETWEEN 1 AND 12),
    grad_year INT NOT NULL CHECK (grad_year BETWEEN 2000 AND 2100),
    grad_month INT NOT NULL CHECK (grad_month BETWEEN 1 AND 12),
    country TEXT NOT NULL,
    profile_image_url TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'coach', 'admin')),  
    created_at TIMESTAMPTZ DEFAULT NOW()
);
"""

def ensure_table(conn) -> None:
    with conn.cursor() as cur:
        cur.execute(DDL)
    conn.commit()


# Public API: you *could* later restrict who can set role via /users,
# but the DB default is still 'user'.
class UserCreate(BaseModel):
    full_name: str = Field(min_length=1)
    preferred_name: str = Field(min_length=1)
    email: EmailStr
    codeforces_handle: str = Field(min_length=1)
    birthdate: date
    degree_program: str
    entry_year: int = Field(ge=2000, le=2100)
    entry_month: int = Field(ge=1, le=12)
    grad_year: int = Field(ge=2000, le=2100)
    grad_month: int = Field(ge=1, le=12)
    country: str
    profile_image_url: Optional[str] = None
    role: Literal["user", "coach", "admin"] = "user"

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    preferred_name: Optional[str] = None
    codeforces_handle: Optional[str] = None
    birthdate: Optional[date] = None
    degree_program: Optional[str] = None
    entry_year: Optional[int] = Field(default=None, ge=2000, le=2100)
    entry_month: Optional[int] = Field(default=None, ge=1, le=12)
    grad_year: Optional[int] = Field(default=None, ge=2000, le=2100)
    grad_month: Optional[int] = Field(default=None, ge=1, le=12)
    country: Optional[str] = None
    profile_image_url: Optional[str] = None
    role: Optional[Literal["user", "coach", "admin"]] = None


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
            "INSERT INTO users (full_name, preferred_name, email, codeforces_handle, birthdate, degree_program, "
            "entry_year, entry_month, grad_year, grad_month, country, profile_image_url, role) "
            "VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING *"
        )
        row = db.fetchone(
            conn,
            sql,
            [
                payload.full_name,
                payload.preferred_name,
                str(payload.email),
                payload.codeforces_handle,
                payload.birthdate,
                payload.degree_program,
                payload.entry_year,
                payload.entry_month,
                payload.grad_year,
                payload.grad_month,
                payload.country,
                payload.profile_image_url,
                payload.role,
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
