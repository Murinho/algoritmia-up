from datetime import date
from typing import Optional, Literal

from fastapi import APIRouter, HTTPException, Query, UploadFile, File, Depends
from pydantic import BaseModel, EmailStr, Field

from pathlib import Path
import secrets, hashlib, string, re
import os
import json
import urllib.request
import urllib.error

from .. import db
from .auth import get_current_user
from .audit_logs import add_audit_log
from ..r2_client import upload_file_obj, delete_object, get_key_from_url

CF_HANDLE_RE = re.compile(r"^[A-Za-z0-9_\-]{1,24}$")

router = APIRouter(prefix="/users", tags=["Users"])

AVATAR_DIR = Path("uploads/avatars")
AVATAR_DIR.mkdir(parents=True, exist_ok=True)

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

def _ensure_role(auth_ctx, allowed_roles: set[str]) -> None:
    """
    Ensure the current user has one of the allowed roles.
    allowed_roles: e.g. {"coach", "admin"} or {"admin"}
    """
    role = auth_ctx["user"]["role"]
    if role not in allowed_roles:
        raise HTTPException(
            status_code=403,
            detail="No tienes permisos para realizar esta acción.",
        )


def _validate_entry_before_grad(
    entry_year: int,
    entry_month: int,
    grad_year: int,
    grad_month: int,
) -> None:
    # Compare (year, month) tuples
    if (entry_year, entry_month) >= (grad_year, grad_month):
        raise HTTPException(
            status_code=422,
            detail="La fecha de ingreso debe ser anterior a la fecha de graduación.",
        )


def _validate_birthdate_before_today(birthdate: date) -> None:
    if birthdate >= date.today():
        raise HTTPException(
            status_code=422,
            detail="La fecha de nacimiento debe ser anterior a hoy.",
        )

def _validate_codeforces_handle_exists(handle: str) -> None:
    # Basic format validation
    if not CF_HANDLE_RE.fullmatch(handle):
        raise HTTPException(
            status_code=422,
            detail=(
                "El handle de Codeforces debe tener entre 3 y 24 caracteres "
                "(letras, dígitos, '_' o '-')."
            ),
        )

    url = f"https://codeforces.com/api/user.info?handles={handle}"

    try:
        # timeout in seconds
        with urllib.request.urlopen(url, timeout=5) as resp:
            raw = resp.read().decode("utf-8")
    except (urllib.error.URLError, urllib.error.HTTPError):
        # Treat this as an external service issue, not a bad handle syntax
        raise HTTPException(
            status_code=503,
            detail=(
                "No se pudo contactar a Codeforces para verificar tu handle. "
                "Intenta de nuevo más tarde."
            ),
        )

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=503,
            detail="Respuesta inválida de Codeforces al verificar tu handle.",
        )

    # Codeforces semantics:
    # OK   → handle exists, data["result"] is a list with one user
    # FAILED → handle does not exist (or other error)
    if data.get("status") != "OK":
        raise HTTPException(
            status_code=422,
            detail=f"El usuario de Codeforces '{handle}' no existe.",
        )

@router.get("")
def list_users(
    q: Optional[str] = Query(None, description="Search by name or email"),
    auth_ctx = Depends(get_current_user),
):
    # Only coaches/admins can list the whole user base
    _ensure_role(auth_ctx, {"admin"})

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


@router.get("/public-leaderboard")
def get_public_leaderboard_users():
    """
    Public endpoint used by the Codeforces leaderboard.
    Returns only the minimal fields needed, WITHOUT email or role.
    """
    with db.connect() as conn:
        rows = db.fetchall(
            conn,
            """
            SELECT
                id,
                preferred_name,
                codeforces_handle,
                country,
                profile_image_url
            FROM users
            WHERE codeforces_handle IS NOT NULL
            ORDER BY created_at DESC
            """
        )
    return {"items": rows}


@router.get("/by-email")
def get_user_by_email(
    email: EmailStr,
    auth_ctx = Depends(get_current_user),
):
    # Only admins can look up arbitrary users by email
    _ensure_role(auth_ctx, {"admin"})

    with db.connect() as conn:
        row = db.fetchone(conn, "SELECT * FROM users WHERE email=%s", [str(email)])
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return row


@router.post("")
def create_user(
    payload: UserCreate,
    auth_ctx = Depends(get_current_user),
):
    # Only admins can create arbitrary users
    _ensure_role(auth_ctx, {"admin"})

    admin = auth_ctx["user"]
    admin_id = admin["id"]

    # birthdate check
    _validate_birthdate_before_today(payload.birthdate)

    # entry/grad check
    _validate_entry_before_grad(
        payload.entry_year,
        payload.entry_month,
        payload.grad_year,
        payload.grad_month,
    )

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
                payload.role,  # safe because only admins reach here
            ],
        )

    add_audit_log(
        actor_user_id=admin_id,
        action="user.create",
        entity_table="users",
        entity_id=row["id"],
        metadata={
            "email": row["email"],
            "role": row["role"],
            "codeforces_handle": row["codeforces_handle"],
            "degree_program": row["degree_program"],
            "country": row["country"],
        },
    )

    return row


@router.patch("/me")
def update_me(
    payload: UserUpdate,
    auth_ctx = Depends(get_current_user),
):
    """
    Update the currently authenticated user's profile fields.
    Email and role are NOT editable from here.
    Avatar is handled via /users/me/avatar.
    """
    user = auth_ctx["user"]
    user_id = user["id"]

    fields = payload.model_dump(exclude_unset=True)
    if not fields:
        raise HTTPException(status_code=400, detail="No fields to update")

    # Never allow role/profile_image_url changes from here
    fields.pop("role", None)
    fields.pop("profile_image_url", None)

    if "codeforces_handle" in fields:
        new_cf = (fields["codeforces_handle"] or "").strip()
        old_cf = (user.get("codeforces_handle") or "").strip()

        if new_cf and new_cf != old_cf:
            _validate_codeforces_handle_exists(new_cf)

            with db.connect() as conn:
                existing = db.fetchone(
                    conn,
                    "SELECT id FROM users WHERE codeforces_handle=%s AND id<>%s",
                    [new_cf, user_id],
                )
            if existing:
                raise HTTPException(
                    status_code=409,
                    detail=(
                        "Ese handle de Codeforces ya está asociado a otro usuario de "
                        "Algoritmia UP."
                    ),
                )

            fields["codeforces_handle"] = new_cf
        elif not new_cf:
            raise HTTPException(
                status_code=422,
                detail="El handle de Codeforces no puede estar vacío.",
            )

    # birthdate validation if present
    if "birthdate" in fields and fields["birthdate"] is not None:
        _validate_birthdate_before_today(fields["birthdate"])

    # Normalize country if present
    if "country" in fields and fields["country"] and len(fields["country"]) == 2:
        fields["country"] = fields["country"].lower()

    effective_entry_year = fields.get("entry_year", user["entry_year"])
    effective_entry_month = fields.get("entry_month", user["entry_month"])
    effective_grad_year = fields.get("grad_year", user["grad_year"])
    effective_grad_month = fields.get("grad_month", user["grad_month"])

    _validate_entry_before_grad(
        effective_entry_year,
        effective_entry_month,
        effective_grad_year,
        effective_grad_month,
    )

    cols = ", ".join(f"{k}=%s" for k in fields.keys())
    params = list(fields.values()) + [user_id]

    with db.connect() as conn:
        row = db.fetchone(
            conn,
            f"UPDATE users SET {cols} WHERE id=%s RETURNING *",
            params,
        )

    if not row:
        raise HTTPException(status_code=404, detail="User not found")

    add_audit_log(
        actor_user_id=user_id,
        action="user.update_self",
        entity_table="users",
        entity_id=row["id"],
        metadata={
            "changed_fields": list(fields.keys()),
            "codeforces_handle": row["codeforces_handle"],
            "degree_program": row["degree_program"],
            "country": row["country"],
        },
    )

    return row


@router.post("/me/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    auth_ctx = Depends(get_current_user),
):
    """
    Upload a profile picture for the current user to R2.
    - Uploads to R2
    - Updates profile_image_url in DB
    - Deletes the previous R2 object (if any)
    """
    user = auth_ctx["user"]
    user_id = user["id"]

    if file.content_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(status_code=400, detail="Formato de imagen no soportado.")

    ext_map = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
    }
    ext = ext_map.get(file.content_type, ".jpg")

    random_part = secrets.token_hex(8)
    key = f"avatars/user_{user_id}_{random_part}{ext}"

    # We need the raw file-like object for upload_file_obj
    contents = await file.read()

    try:
        from io import BytesIO
        url = upload_file_obj(BytesIO(contents), key=key, content_type=file.content_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error subiendo avatar a R2: {e!r}")

    with db.connect() as conn:
        row = db.fetchone(
            conn,
            "SELECT profile_image_url FROM users WHERE id=%s",
            [user_id],
        )
        if not row:
            raise HTTPException(status_code=404, detail="User not found")

        old_url = row["profile_image_url"]

        updated = db.fetchone(
            conn,
            "UPDATE users SET profile_image_url = %s WHERE id=%s RETURNING profile_image_url",
            [url, user_id],
        )

    # Delete old avatar from R2 if possible
    if old_url:
        old_key = get_key_from_url(old_url)
        if old_key:
            delete_object(old_key)

    add_audit_log(
        actor_user_id=user_id,
        action="user.avatar.upload",
        entity_table="users",
        entity_id=user_id,
        metadata={
            "new_profile_image_url": updated["profile_image_url"],
            "old_profile_image_url": old_url,
            "content_type": file.content_type,
            "key": key,
        },
    )

    return {"profile_image_url": updated["profile_image_url"]}


@router.delete("/me/avatar")
def delete_avatar(auth_ctx = Depends(get_current_user)):
    """
    Remove the current user's profile picture (DB and R2 object).
    """
    user = auth_ctx["user"]
    user_id = user["id"]

    with db.connect() as conn:
        row = db.fetchone(
            conn,
            "SELECT profile_image_url FROM users WHERE id=%s",
            [user_id],
        )
        if not row:
            raise HTTPException(status_code=404, detail="User not found")

        old_url = row["profile_image_url"]

        db.fetchone(
            conn,
            "UPDATE users SET profile_image_url = NULL WHERE id=%s RETURNING id",
            [user_id],
        )

    # Delete from R2 if we can extract the key
    if old_url:
        old_key = get_key_from_url(old_url)
        if old_key:
            delete_object(old_key)

    add_audit_log(
        actor_user_id=user_id,
        action="user.avatar.delete",
        entity_table="users",
        entity_id=user_id,
        metadata={
            "old_profile_image_url": old_url,
        },
    )

    return {"profile_image_url": None}


@router.get("/{user_id}")
def get_user(
    user_id: int,
    auth_ctx = Depends(get_current_user),
):
    current = auth_ctx["user"]

    # Allow self OR coach/admin
    if current["id"] != user_id and current["role"] not in ("coach", "admin"):
        raise HTTPException(
            status_code=403,
            detail="No tienes permiso para ver este usuario.",
        )

    with db.connect() as conn:
        row = db.fetchone(conn, "SELECT * FROM users WHERE id=%s", [user_id])
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return row


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    auth_ctx = Depends(get_current_user),
):
    # Only admins can delete arbitrary users
    _ensure_role(auth_ctx, {"admin"})
    admin = auth_ctx["user"]
    admin_id = admin["id"]

    with db.connect() as conn:
        # Fetch user first for logging purposes
        row = db.fetchone(conn, "SELECT * FROM users WHERE id=%s", [user_id])
        if not row:
            raise HTTPException(status_code=404, detail="User not found")

        count = db.execute(conn, "DELETE FROM users WHERE id=%s", [user_id])

    add_audit_log(
        actor_user_id=admin_id,
        action="user.delete",
        entity_table="users",
        entity_id=user_id,
        metadata={
            "email": row["email"],
            "role": row["role"],
            "codeforces_handle": row["codeforces_handle"],
            "degree_program": row["degree_program"],
            "country": row["country"],
        },
    )

    return {"deleted": True}


