import os
import time
from threading import Lock
from typing import Any, Dict, Optional
import logging

logger = logging.getLogger("alg-init")
logging.basicConfig(level=logging.INFO)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import uploads

from . import db
from .tables import (
    users,
    contests,
    resources,
    events,
    auth_identities,
    email_verification_tokens,
    password_reset_tokens,
    audit_logs,
    auth,
)


def create_app() -> FastAPI:
    app = FastAPI(
        title="Algoritmia API",
        version=os.getenv("ALGORITMIA_API_VERSION", "0.1.0"),
        description="Backend endpoints for the Algoritmia website.",
    )

    # ---- CORS (with credentials) ----
    default_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://algoritmia-up.vercel.app",
    ]
    extra_origins_env = os.getenv("ALLOWED_ORIGINS", "").strip()
    extra_origins = [o.strip() for o in extra_origins_env.split(",") if o.strip()]
    origin_regex = os.getenv("ALLOWED_ORIGIN_REGEX", "").strip() or None

    allow_origins = list(dict.fromkeys(default_origins + extra_origins))

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allow_origins,
        allow_origin_regex=origin_regex,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # (No more local /static mounts — avatars and event banners are on R2 now)

    # Health/Version
    @app.get("/health")
    def health() -> Dict[str, str]:
        return {"status": "ok"}

    @app.get("/version")
    def version() -> Dict[str, str]:
        return {"version": app.version}

    # Init state
    _init_lock = Lock()
    _initialized: bool = False
    _initialized_at: Optional[float] = None
    _init_runs: int = 0

    # Include routers
    app.include_router(users.router)
    app.include_router(contests.router)
    app.include_router(resources.router)
    app.include_router(events.router)
    app.include_router(auth_identities.router)
    app.include_router(email_verification_tokens.router)
    app.include_router(password_reset_tokens.router)
    app.include_router(audit_logs.router)
    app.include_router(auth.router)
    app.include_router(uploads.router)

    @app.post("/init")
    def initialize(force: bool = False) -> Dict[str, Any]:
        nonlocal _initialized, _initialized_at, _init_runs
        ran = False

        # Execute idempotent DB bootstrap
        db_status: Dict[str, Any] = {}
        try:
            with db.connect() as conn:
                db.ensure_extensions(conn)
                for name, mod in [
                    ("users", users),
                    ("contests", contests),
                    ("resources", resources),
                    ("events", events),
                    ("auth_identities", auth_identities),
                    ("email_verification_tokens", email_verification_tokens),
                    ("password_reset_tokens", password_reset_tokens),
                    ("audit_logs", audit_logs),
                    ("auth", auth),
                ]:
                    try:
                        mod.ensure_table(conn)
                        conn.commit()
                        db_status[name] = {"ok": True}
                    except Exception as e:
                        conn.rollback()
                        logger.exception("ensure_table failed for %s", name)
                        db_status[name] = {"ok": False, "error": str(e)}
        except Exception as e:  # pragma: no cover
            db_status = {"ok": False, "error": str(e)}

        with _init_lock:
            if force or not _initialized:
                _initialized = True
                _initialized_at = time.time()
                _init_runs += 1
                ran = True

        return {
            "initialized": _initialized,
            "ran": ran,
            "initialized_at": _initialized_at,
            "runs": _init_runs,
            "db": db_status,
        }

    @app.get("/init/status")
    def init_status() -> Dict[str, Any]:
        return {
            "initialized": _initialized,
            "initialized_at": _initialized_at,
            "runs": _init_runs,
        }

    return app


# Export a default app for uvicorn
app = create_app()
