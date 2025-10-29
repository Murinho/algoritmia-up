from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from .. import db


router = APIRouter(prefix="/roles", tags=["Roles"])


DDL = """
CREATE TABLE IF NOT EXISTS roles (
    id SMALLSERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
);
"""

SEED = """
INSERT INTO roles (name)
VALUES ('user'), ('coach'), ('admin')
ON CONFLICT DO NOTHING;
"""


def ensure_table(conn) -> None:
    with conn.cursor() as cur:
        cur.execute(DDL)
        cur.execute(SEED)
    conn.commit()


class RoleCreate(BaseModel):
    name: str


@router.get("")
def list_roles():
    with db.connect() as conn:
        rows = db.fetchall(conn, "SELECT * FROM roles ORDER BY id")
    return {"items": rows}


@router.post("")
def create_role(payload: RoleCreate):
    with db.connect() as conn:
        row = db.fetchone(conn, "INSERT INTO roles(name) VALUES(%s) ON CONFLICT DO NOTHING RETURNING *", [payload.name])
        if not row:
            # existed already
            row = db.fetchone(conn, "SELECT * FROM roles WHERE name=%s", [payload.name])
    return row


@router.delete("/{name}")
def delete_role(name: str):
    with db.connect() as conn:
        count = db.execute(conn, "DELETE FROM roles WHERE name=%s", [name])
    if count == 0:
        raise HTTPException(status_code=404, detail="Role not found")
    return {"deleted": True}
