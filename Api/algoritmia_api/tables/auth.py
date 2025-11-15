import secrets, hashlib, string

from datetime import date, datetime, timedelta
from typing import Optional

from fastapi import Response, Request, Depends, Cookie

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, Field
from passlib.hash import argon2

from .. import db

router = APIRouter(prefix="/auth", tags=["Auth"])

SESSION_COOKIE_NAME = "sid"
SESSION_COOKIE_AGE = 60 * 60 * 24  # one day in seconds

def _hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()

def _new_session_token() -> tuple[str, str]:
    raw = secrets.token_urlsafe(32)
    return raw, _hash_token(raw)

DDL_SESSIONS = """
CREATE TABLE IF NOT EXISTS sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_sha256 TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
"""

DDL_SESSIONS_TOKEN_UQ = """
CREATE UNIQUE INDEX IF NOT EXISTS sessions_token_sha256_uq
ON sessions(token_sha256);
"""

DDL_SESSIONS_ACTIVE_IDX = """
CREATE INDEX IF NOT EXISTS sessions_user_active_idx
ON sessions(user_id)
WHERE revoked_at IS NULL;
"""

def ensure_table(conn):
    with conn.cursor() as cur:
        cur.execute(DDL_SESSIONS)
        cur.execute(DDL_SESSIONS_TOKEN_UQ)
        cur.execute(DDL_SESSIONS_ACTIVE_IDX)
    conn.commit()


class SignUp(BaseModel):
    # user profile
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
    # local auth
    password: str = Field(min_length=8)


class Login(BaseModel):
    email: EmailStr
    password: str
    create_session: bool = True
    ttl_minutes: int = 60 * 24


def _validate_password_strength(pw: str) -> None:
    """
    Enforces:
    - at least 8 chars
    - at least 1 lowercase, 1 uppercase, 1 digit, 1 symbol
    """
    if len(pw) < 8:
        raise HTTPException(
            status_code=422,
            detail="La contraseña debe tener al menos 8 caracteres.",
        )

    has_lower = any(c.islower() for c in pw)
    has_upper = any(c.isupper() for c in pw)
    has_digit = any(c.isdigit() for c in pw)
    has_symbol = any(c in string.punctuation for c in pw)

    if not (has_lower, has_upper, has_digit, has_symbol) == (True, True, True, True):
        raise HTTPException(
            status_code=422,
            detail=(
                "La contraseña debe incluir al menos una letra minúscula, "
                "una mayúscula, un dígito y un símbolo."
            ),
        )


def get_current_user(request: Request):
    # read cookie
    raw = request.cookies.get(SESSION_COOKIE_NAME)
    if not raw:
        raise HTTPException(status_code=401, detail="Not authenticated")

    token_sha256 = _hash_token(raw)

    with db.connect() as conn:
        sess = db.fetchone(
            conn,
            """
            SELECT * FROM sessions
            WHERE token_sha256=%s AND revoked_at IS NULL AND expires_at > NOW()
            """,
            [token_sha256],
        )
        if not sess:
            raise HTTPException(status_code=401, detail="Invalid or expired session")

        user = db.fetchone(conn, "SELECT * FROM users WHERE id=%s", [sess["user_id"]])
    return {"session": sess, "user": user}


@router.get("/me")
def me(current = Depends(get_current_user)):
    return current


@router.post("/logout")
def logout(response: Response, request: Request):
    raw = request.cookies.get(SESSION_COOKIE_NAME)
    if not raw:
        # idempotent
        response.delete_cookie(SESSION_COOKIE_NAME, path="/")
        return {"ok": True}

    token_sha256 = _hash_token(raw)
    with db.connect() as conn:
        db.execute(
            conn,
            "UPDATE sessions SET revoked_at=NOW() WHERE token_sha256=%s AND revoked_at IS NULL",
            [token_sha256],
        )

    response.delete_cookie(SESSION_COOKIE_NAME, path="/")
    return {"ok": True}


@router.post("/signup")
def signup(payload: SignUp):
    """
    Create a user + local auth identity.
    NOTE: This DOES NOT log the user in or create a session.
    Frontend should redirect to the login page on success.
    """
    # --- Server-side validations ---

    # 1) email domain
    email_str = str(payload.email).lower()
    if not email_str.endswith("@up.edu.mx"):
        raise HTTPException(
            status_code=422,
            detail="El email debe pertenecer al dominio @up.edu.mx.",
        )

    # 2) birthdate before today
    if payload.birthdate >= date.today():
        raise HTTPException(
            status_code=422,
            detail="La fecha de nacimiento debe ser anterior a hoy.",
        )

    # 3) entry date < graduation date (strict)
    if (payload.entry_year, payload.entry_month) >= (
        payload.grad_year,
        payload.grad_month,
    ):
        raise HTTPException(
            status_code=422,
            detail="La fecha de ingreso debe ser anterior a la fecha de graduación.",
        )

    # 4) password strength
    _validate_password_strength(payload.password)

    # --- Existing logic ---

    pwd_hash = argon2.hash(payload.password)

    with db.connect() as conn:
        try:
            # ---- Pre-checks for clean 409s ----
            existing_user = db.fetchone(
                conn,
                "SELECT 1 FROM users WHERE email=%s",
                [str(payload.email)],
            )
            if existing_user:
                raise HTTPException(status_code=409, detail="Email already registered")

            existing_local = db.fetchone(
                conn,
                "SELECT 1 FROM auth_identities WHERE provider='local' AND email=%s",
                [str(payload.email)],
            )
            if existing_local:
                raise HTTPException(
                    status_code=409,
                    detail="Local account already exists for this email",
                )

            # ---- Create user ----
            # First user in the table becomes 'admin', others become 'user'
            user = db.fetchone(
                conn,
                """
                INSERT INTO users
                  (full_name, preferred_name, email, codeforces_handle, birthdate,
                   degree_program, entry_year, entry_month, grad_year, grad_month,
                   country, profile_image_url, role)
                VALUES (
                   %s,%s,%s,%s,%s,
                   %s,%s,%s,%s,%s,
                   %s,%s,
                   (SELECT CASE WHEN COUNT(*) = 0 THEN 'admin' ELSE 'user' END FROM users)
                )
                RETURNING id, full_name, preferred_name, email, codeforces_handle,
                          birthdate, degree_program, entry_year, entry_month,
                          grad_year, grad_month, country, profile_image_url,
                          role, created_at
                """,
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
                ],
            )
            user_id = user["id"]

            # ---- Create local identity (no session, no provider_uid) ----
            identity = db.fetchone(
                conn,
                """
                INSERT INTO auth_identities
                  (user_id, provider, provider_uid, email, password_hash, email_verified_at)
                VALUES (%s,'local',NULL,%s,%s,NULL)
                RETURNING id, user_id, provider, provider_uid, email, created_at
                """,
                [user_id, str(payload.email), pwd_hash],
            )

            conn.commit()

        except HTTPException:
            conn.rollback()
            raise

        except Exception as e:
            conn.rollback()
            msg = str(e).lower()
            if "users_email_key" in msg:
                raise HTTPException(status_code=409, detail="Email already registered")
            if "users_codeforces_handle_key" in msg:
                raise HTTPException(status_code=409, detail="Codeforces handle already in use")
            if "auth_identities_local_email_uq" in msg:
                raise HTTPException(status_code=409, detail="Local account already exists for this email")
            if "auth_identities_user_provider_uq" in msg:
                raise HTTPException(status_code=409, detail="Local identity already exists for this user")
            if "auth_identities_provider_uid_uq" in msg:
                raise HTTPException(status_code=409, detail="This provider identity already exists")
            raise HTTPException(status_code=500, detail="Internal error during signup")

    return {"user": user, "identity": identity}


@router.post("/login")
def login(payload: Login, response: Response):
    # 1) fetch identity
    with db.connect() as conn:
        ident = db.fetchone(
            conn,
            "SELECT * FROM auth_identities WHERE provider='local' AND email=%s",
            [str(payload.email)],
        )
    if not ident or not ident.get("password_hash"):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # 2) verify password
    if not argon2.verify(payload.password, ident["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    result = {"identity": {k: v for k, v in ident.items() if k != "password_hash"}}

    # 3) optional session
    if payload.create_session:
        now = datetime.utcnow()
        expires_at = now + timedelta(minutes=payload.ttl_minutes)

        with db.connect() as conn:
            # **Single-session policy (BLOCK)**
            active = db.fetchone(
                conn,
                """
                SELECT id FROM sessions
                WHERE user_id=%s AND revoked_at IS NULL AND expires_at > NOW()
                LIMIT 1
                """,
                [ident["user_id"]],
            )
            if active:
                raise HTTPException(status_code=409, detail="Already logged in on this browser. Log out first.")

            raw_token, token_sha256 = _new_session_token()

            session_row = db.fetchone(
                conn,
                """
                INSERT INTO sessions(user_id, token_sha256, expires_at)
                VALUES(%s,%s,%s)
                RETURNING id, user_id, expires_at, created_at
                """,
                [ident["user_id"], token_sha256, expires_at],
            )

        response.set_cookie(
            key=SESSION_COOKIE_NAME,
            value=raw_token,
            httponly=True,
            samesite="lax",
            secure=False,  # set to True in production over HTTPS!
            max_age=SESSION_COOKIE_AGE,
            path="/",
        )
        result["session"] = session_row

    # 4) user profile (now includes role)
    with db.connect() as conn:
        user = db.fetchone(conn, "SELECT * FROM users WHERE id=%s", [ident["user_id"]])
    result["user"] = user

    return result
