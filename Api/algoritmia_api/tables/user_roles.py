from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from .. import db


router = APIRouter(prefix="/user-roles", tags=["UserRoles"])


DDL = """
CREATE TABLE IF NOT EXISTS user_roles (
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id SMALLINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);
"""


def ensure_table(conn) -> None:
    with conn.cursor() as cur:
        cur.execute(DDL)
    conn.commit()


class AssignRole(BaseModel):
    user_id: int
    role_name: str


@router.get("")
def list_user_roles():
    with db.connect() as conn:
        rows = db.fetchall(conn, """
            SELECT ur.user_id, r.name AS role_name
            FROM user_roles ur
            JOIN roles r ON r.id = ur.role_id
            ORDER BY ur.user_id
        """)
    return {"items": rows}


@router.get("/by-user/{user_id}")
def list_user_roles_by_user(user_id: int):
    with db.connect() as conn:
        rows = db.fetchall(conn, """
            SELECT r.name AS role_name
            FROM user_roles ur
            JOIN roles r ON r.id = ur.role_id
            WHERE ur.user_id=%s
            ORDER BY r.name
        """, [user_id])
    return {"user_id": user_id, "roles": [r["role_name"] for r in rows]}


@router.post("/assign")
def assign_role(payload: AssignRole):
    with db.connect() as conn:
        role = db.fetchone(conn, "SELECT id FROM roles WHERE name=%s", [payload.role_name])
        if not role:
            raise HTTPException(status_code=404, detail="Role not found")
        try:
            db.execute(conn, "INSERT INTO user_roles(user_id, role_id) VALUES(%s,%s) ON CONFLICT DO NOTHING", [payload.user_id, role["id"]])
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
    return {"ok": True}


@router.post("/revoke")
def revoke_role(payload: AssignRole):
    with db.connect() as conn:
        role = db.fetchone(conn, "SELECT id FROM roles WHERE name=%s", [payload.role_name])
        if not role:
            raise HTTPException(status_code=404, detail="Role not found")
        count = db.execute(conn, "DELETE FROM user_roles WHERE user_id=%s AND role_id=%s", [payload.user_id, role["id"]])
    return {"deleted": count > 0}
