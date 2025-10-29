import os
import time
from threading import Lock
from typing import Any, Dict, Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import db
from .tables import (
    users,
    contests,
    resources,
    events,
    auth_identities,
    roles,
    user_roles,
    sessions,
    email_verification_tokens,
    password_reset_tokens,
    audit_logs,
    leaderboard,
)


def create_app() -> FastAPI:
    app = FastAPI(
        title="Algoritmia API",
        version=os.getenv("ALGORITMIA_API_VERSION", "0.1.0"),
        description="Backend endpoints for the Algoritmia website.",
    )

    default_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    extra_origins_env = os.getenv("ALLOWED_ORIGINS", "").strip()
    extra_origins = [o for o in (x.strip() for x in extra_origins_env.split(",")) if o]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=(extra_origins or default_origins),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

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

    # Include routers (placeholders for now)
    app.include_router(users.router)
    app.include_router(contests.router)
    app.include_router(resources.router)
    app.include_router(events.router)
    app.include_router(auth_identities.router)
    app.include_router(roles.router)
    app.include_router(user_roles.router)
    app.include_router(sessions.router)
    app.include_router(email_verification_tokens.router)
    app.include_router(password_reset_tokens.router)
    app.include_router(audit_logs.router)
    app.include_router(leaderboard.router)

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
                    ("roles", roles),
                    ("user_roles", user_roles),
                    ("sessions", sessions),
                    ("email_verification_tokens", email_verification_tokens),
                    ("password_reset_tokens", password_reset_tokens),
                    ("audit_logs", audit_logs),
                    ("leaderboard", leaderboard),
                ]:
                    try:
                        mod.ensure_table(conn)
                        db_status[name] = {"ok": True}
                    except Exception as e:  # pragma: no cover
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

