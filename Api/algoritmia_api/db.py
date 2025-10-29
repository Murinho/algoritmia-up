import os
from typing import Any, Iterable, Optional, Sequence

try:
    import psycopg
    from psycopg.rows import dict_row
except Exception:  # pragma: no cover
    psycopg = None


def require_psycopg() -> None:
    if psycopg is None:
        raise RuntimeError("psycopg is not installed; add psycopg[binary] to requirements and install")


def get_database_url() -> str:
    url = os.getenv("DATABASE_URL")
    if not url:
        raise RuntimeError("DATABASE_URL environment variable is not set")
    return url


def connect():  # context manager usage: with connect() as conn: ...
    require_psycopg()
    return psycopg.connect(get_database_url(), row_factory=dict_row)


def ensure_extensions(conn) -> None:
    with conn.cursor() as cur:
        cur.execute("CREATE EXTENSION IF NOT EXISTS citext;")
        cur.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto;")
    conn.commit()


# Convenience query helpers
def fetchall(conn, sql: str, params: Optional[Sequence[Any]] = None):
    with conn.cursor() as cur:
        cur.execute(sql, params or ())
        return cur.fetchall()


def fetchone(conn, sql: str, params: Optional[Sequence[Any]] = None):
    with conn.cursor() as cur:
        cur.execute(sql, params or ())
        return cur.fetchone()


def execute(conn, sql: str, params: Optional[Sequence[Any]] = None) -> int:
    with conn.cursor() as cur:
        cur.execute(sql, params or ())
        rowcount = cur.rowcount
    conn.commit()
    return rowcount

