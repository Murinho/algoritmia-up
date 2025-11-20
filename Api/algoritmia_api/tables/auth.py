import secrets, hashlib, string

from datetime import date, datetime, timedelta
from typing import Optional

from fastapi import Response, Request, Depends, Cookie

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, EmailStr, Field
from passlib.hash import argon2
import secrets, hashlib, string, re
import json
import urllib.request
import urllib.error
import os
import logging

from .. import db
from ..email_utils import send_email 

FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "https://algoritmia.up.edu.mx")
logger = logging.getLogger("auth")

router = APIRouter(prefix="/auth", tags=["Auth"])

SESSION_COOKIE_NAME = "sid"
SESSION_COOKIE_AGE = 60 * 60 * 24  # one day in seconds

CF_HANDLE_RE = re.compile(r"^[A-Za-z0-9_\-]{1,24}$")

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

class ResetPasswordPayload(BaseModel):
    token: str
    new_password: str = Field(min_length=8)

class RequestPasswordReset(BaseModel):
    email: EmailStr

class ResetPasswordPayload(BaseModel):
    token: str
    new_password: str = Field(min_length=8)

class VerifyEmailResponse(BaseModel):
    ok: bool
    message: str


def _hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()

def _new_session_token() -> tuple[str, str]:
    raw = secrets.token_urlsafe(32)
    return raw, _hash_token(raw)

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
    
def _send_password_reset_email(to_email: str, reset_url: str) -> None:
    subject = "Restablecer contraseña - Algoritmia UP"

    text_body = f"""Hola,

Recibimos una solicitud para restablecer la contraseña de tu cuenta de Algoritmia UP.

Para continuar, haz clic en el siguiente enlace (o cópialo en tu navegador):

{reset_url}

Si tú no solicitaste este cambio, puedes ignorar este correo.

Saludos,
Equipo Algoritmia UP
"""

    html_body = f"""\
<html>
  <body style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color:#f5f5f5; padding:24px;">
    <div style="max-width:480px; margin:0 auto; background:white; padding:24px; border-radius:12px;">
      <h2 style="margin-top:0; color:#C5133D;">Restablecer tu contraseña</h2>
      <p>Hola,</p>
      <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta de <strong>Algoritmia UP</strong>.</p>
      <p>Haz clic en el siguiente botón para continuar:</p>
      <p style="text-align:center; margin:24px 0;">
        <a href="{reset_url}"
           style="background-color:#C5133D; color:white; padding:12px 24px; border-radius:999px; text-decoration:none; font-weight:600;">
          Restablecer contraseña
        </a>
      </p>
      <p style="font-size:14px; color:#555;">
        Si el botón no funciona, copia y pega este enlace en tu navegador:<br/>
        <a href="{reset_url}" style="color:#C5133D;">{reset_url}</a>
      </p>
      <p style="font-size:12px; color:#777; margin-top:24px;">
        Si tú no solicitaste este cambio, puedes ignorar este correo.
      </p>
      <p style="font-size:12px; color:#777;">
        — Equipo Algoritmia UP
      </p>
    </div>
  </body>
</html>
"""
    send_email(to_email=to_email, subject=subject, text_body=text_body, html_body=html_body)


def _send_email_verification(to_email: str, verify_url: str, preferred_name: str) -> None:
    subject = "Confirma tu correo - Algoritmia UP"

    text_body = f"""Hola {preferred_name},

Gracias por registrarte en Algoritmia UP.

Para completar tu registro y confirmar que este correo te pertenece, haz clic en el siguiente enlace (o cópialo en tu navegador):

{verify_url}

Si tú no iniciaste este registro, puedes ignorar este correo.

Saludos,
Equipo Algoritmia UP
"""

    html_body = f"""\
<html>
  <body style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color:#f5f5f5; padding:24px;">
    <div style="max-width:480px; margin:0 auto; background:white; padding:24px; border-radius:12px;">
      <h2 style="margin-top:0; color:#C5133D;">Confirma tu correo</h2>
      <p>Hola {preferred_name},</p>
      <p>Gracias por registrarte en <strong>Algoritmia UP</strong>.</p>
      <p>Para completar tu registro, confirma que este correo te pertenece haciendo clic en el siguiente botón:</p>
      <p style="text-align:center; margin:24px 0;">
        <a href="{verify_url}"
           style="background-color:#C5133D; color:white; padding:12px 24px; border-radius:999px; text-decoration:none; font-weight:600;">
          Confirmar correo
        </a>
      </p>
      <p style="font-size:14px; color:#555;">
        Si el botón no funciona, copia y pega este enlace en tu navegador:<br/>
        <a href="{verify_url}" style="color:#C5133D;">{verify_url}</a>
      </p>
      <p style="font-size:12px; color:#777; margin-top:24px;">
        Si tú no iniciaste este registro, puedes ignorar este correo.
      </p>
      <p style="font-size:12px; color:#777;">
        — Equipo Algoritmia UP
      </p>
    </div>
  </body>
</html>
"""
    send_email(to_email=to_email, subject=subject, text_body=text_body, html_body=html_body)


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
def logout(response: Response, current = Depends(get_current_user)):
    session = current["session"]

    with db.connect() as conn:
        db.execute(
            conn,
            """
            UPDATE sessions
            SET revoked_at = NOW()
            WHERE id = %s AND revoked_at IS NULL
            """,
            [session["id"]],
        )
        conn.commit()

    response.delete_cookie(SESSION_COOKIE_NAME, path="/")
    return {"ok": True}


@router.post("/signup")
def signup(payload: SignUp, background_tasks: BackgroundTasks):
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

    # 5) Codeforces handle must exist
    _validate_codeforces_handle_exists(payload.codeforces_handle)

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

    # --- NEW: create email verification token + send email ---
    # raw token (what we send by email) and hashed token (what we store)
    raw_token = secrets.token_urlsafe(32)
    token_hash = _hash_token(raw_token)
    ttl_hours = 24
    expires_at = datetime.utcnow() + timedelta(hours=ttl_hours)

    with db.connect() as conn:
        # Optional: invalidate older pending tokens for this user
        db.execute(
            conn,
            """
            UPDATE email_verification_tokens
            SET used_at = NOW()
            WHERE user_id = %s AND used_at IS NULL AND expires_at > NOW()
            """,
            [user_id],
        )

        db.execute(
            conn,
            """
            INSERT INTO email_verification_tokens (user_id, token_hash, expires_at)
            VALUES (%s, %s, %s)
            """,
            [user_id, token_hash, expires_at],
        )
        conn.commit()

    verify_url = f"{FRONTEND_BASE_URL}/verificar-correo?token={raw_token}"

    # Send in background so signup response is fast
    background_tasks.add_task(
        _send_email_verification,
        str(payload.email),
        verify_url,
        payload.preferred_name,
    )

    return {"user": user, "identity": identity, "email_verification_sent": True}


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
    
    if ident.get("email_verified_at") is None:
        raise HTTPException(
            status_code=403,
            detail="Debes verificar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.",
        )

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

@router.post("/request-password-reset")
def request_password_reset(payload: RequestPasswordReset, background_tasks: BackgroundTasks):
    """
    User provides email. We:

    - Look up the local identity.
    - Generate a single-use reset token.
    - Store token_hash in password_reset_tokens with TTL (e.g. 30 min).
    - Send email containing the *raw* token in a link to the frontend.

    Response is always 200 + generic message to avoid user enumeration.
    """
    email_str = str(payload.email).lower()

    # Generic success message (same even if user doesn't exist)
    generic_msg = {
        "ok": True,
        "message": "Si existe una cuenta asociada a este correo, hemos enviado un enlace para restablecer la contraseña.",
    }

    with db.connect() as conn:
        # 1) Find local identity
        ident = db.fetchone(
            conn,
            """
            SELECT ai.id, ai.user_id, ai.provider, ai.email, u.full_name
            FROM auth_identities ai
            JOIN users u ON u.id = ai.user_id
            WHERE ai.provider='local' AND ai.email=%s
            """,
            [email_str],
        )

        # If no identity, don't reveal that → return generic success
        if not ident:
            return generic_msg

        user_id = ident["user_id"]

        # 2) Generate token (raw + hashed)
        raw_token = secrets.token_urlsafe(32)
        token_hash = _hash_token(raw_token)

        # Optional: invalidate older tokens for this user
        # (so only the latest link works)
        db.execute(
            conn,
            """
            UPDATE password_reset_tokens
            SET used_at = NOW()
            WHERE user_id = %s AND used_at IS NULL AND expires_at > NOW()
            """,
            [user_id],
        )

        # 3) Insert new token with TTL (e.g. 30 minutes)
        ttl_minutes = 30
        expires_at = datetime.utcnow() + timedelta(minutes=ttl_minutes)

        db.execute(
            conn,
            """
            INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
            VALUES (%s, %s, %s)
            """,
            [user_id, token_hash, expires_at],
        )

        conn.commit()

    reset_url = f"{FRONTEND_BASE_URL}/reiniciar-contrasena?token={raw_token}"

    # Send email in background
    background_tasks.add_task(_send_password_reset_email, email_str, reset_url)

    return generic_msg


@router.post("/reset-password")
def reset_password(payload: ResetPasswordPayload):
    """
    Reset a user's password using a one-time reset token.

    Expects:
      - token: raw reset token from the email link
      - new_password: new password (validated for strength)
    """
    # 1) validate strength
    _validate_password_strength(payload.new_password)

    token_hash = _hash_token(payload.token)

    with db.connect() as conn:
        try:
            # 2) look up valid, unused, non-expired reset token
            reset_row = db.fetchone(
                conn,
                """
                SELECT *
                FROM password_reset_tokens
                WHERE token_hash = %s
                  AND used_at IS NULL
                  AND expires_at > NOW()
                """,
                [token_hash],
            )

            if not reset_row:
                raise HTTPException(
                    status_code=400,
                    detail="El enlace de recuperación no es válido o ha expirado.",
                )

            user_id = reset_row["user_id"]

            # 3) ensure local identity exists
            ident = db.fetchone(
                conn,
                """
                SELECT id
                FROM auth_identities
                WHERE user_id = %s AND provider = 'local'
                """,
                [user_id],
            )
            if not ident:
                raise HTTPException(
                    status_code=400,
                    detail="No existe una cuenta local asociada a este usuario.",
                )

            # 4) hash new password & update
            new_hash = argon2.hash(payload.new_password)
            db.execute(
                conn,
                "UPDATE auth_identities SET password_hash = %s WHERE id = %s",
                [new_hash, ident["id"]],
            )

            # 5) mark this token as used
            db.execute(
                conn,
                """
                UPDATE password_reset_tokens
                SET used_at = NOW()
                WHERE id = %s AND used_at IS NULL
                """,
                [reset_row["id"]],
            )

            # 6) revoke all active sessions for this user (recommended)
            db.execute(
                conn,
                """
                UPDATE sessions
                SET revoked_at = NOW()
                WHERE user_id = %s AND revoked_at IS NULL
                """,
                [user_id],
            )

            conn.commit()

        except HTTPException:
            conn.rollback()
            raise
        except Exception:
            conn.rollback()
            raise HTTPException(
                status_code=500,
                detail="Error interno al restablecer la contraseña.",
            )

    return {"ok": True}


@router.get("/verify-email", response_model=VerifyEmailResponse)
def verify_email(token: str):
    """
    Verifies a user's email using a one-time verification token.
    Called from the frontend when the user opens /verificar-correo?token=...
    """
    token_hash = _hash_token(token)

    with db.connect() as conn:
        try:
            row = db.fetchone(
                conn,
                """
                SELECT *
                FROM email_verification_tokens
                WHERE token_hash = %s
                  AND used_at IS NULL
                  AND expires_at > NOW()
                """,
                [token_hash],
            )

            if not row:
                raise HTTPException(
                    status_code=400,
                    detail="El enlace de verificación no es válido o ha expirado.",
                )

            user_id = row["user_id"]

            # Mark token as used
            db.execute(
                conn,
                """
                UPDATE email_verification_tokens
                SET used_at = NOW()
                WHERE id = %s AND used_at IS NULL
                """,
                [row["id"]],
            )

            # Mark email as verified on local identity
            db.execute(
                conn,
                """
                UPDATE auth_identities
                SET email_verified_at = NOW()
                WHERE user_id = %s AND provider = 'local'
                """,
                [user_id],
            )

            conn.commit()

        except HTTPException:
            conn.rollback()
            raise
        except Exception:
            conn.rollback()
            raise HTTPException(
                status_code=500,
                detail="Error interno al verificar el correo.",
            )

    return VerifyEmailResponse(
        ok=True,
        message="Correo verificado correctamente. Ya puedes iniciar sesión.",
    )
