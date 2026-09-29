import os
import sys
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

logger = logging.getLogger("terramesh.database")

ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# PostgreSQL is the production database. SQLite is permitted ONLY for
# local development/tests; production refuses to start on SQLite.
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/terramesh")

IS_SQLITE = DATABASE_URL.startswith("sqlite")

if ENVIRONMENT == "production" and IS_SQLITE:
    print("[ERROR] Production environment CANNOT fall back to SQLite. Please configure a valid PostgreSQL DATABASE_URL.")
    sys.exit(1)

if IS_SQLITE and ENVIRONMENT != "test":
    logger.warning(
        "SQLite is in use (DATABASE_URL=%s). This is a LOCAL DEVELOPMENT / TEST database only. "
        "TimescaleDB, PostGIS and concurrent-write production behaviour are NOT available on SQLite.",
        DATABASE_URL,
    )

engine_kwargs = {}

if IS_SQLITE:
    # SQLite needs check_same_thread=False under FastAPI's threadpool
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # PostgreSQL connection pooling — production posture
    engine_kwargs.update(
        pool_size=int(os.getenv("DB_POOL_SIZE", "20")),
        max_overflow=int(os.getenv("DB_MAX_OVERFLOW", "0")),
        pool_pre_ping=True,   # verify connections are alive before checkout
        pool_recycle=int(os.getenv("DB_POOL_RECYCLE", "1800")),  # recycle stale conns
        connect_args={"application_name": "terramesh-backend", "connect_timeout": 10},
    )

engine = create_engine(DATABASE_URL, **engine_kwargs)

if IS_SQLITE:
    from sqlalchemy import event

    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_database_health() -> dict:
    """Honest database health probe. Never reports healthy unless SELECT 1 succeeds."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        dialect = "sqlite" if IS_SQLITE else engine.url.get_backend_name()
        info = {"status": "healthy", "type": dialect}
        if dialect == "postgresql":
            # Detect optional extensions honestly
            try:
                with engine.connect() as conn:
                    rows = conn.execute(
                        text("SELECT extname FROM pg_extension")
                    ).fetchall()
                exts = {r[0] for r in rows}
                info["postgis"] = "available" if "postgis" in exts else "unavailable"
                info["timescaledb"] = "available" if "timescaledb" in exts else "unavailable"
            except Exception as ext_err:  # extension listing must not flip overall health
                info["extension_check_error"] = str(ext_err)
        return info
    except Exception as e:
        return {"status": "unavailable", "detail": str(e), "type": "sqlite" if IS_SQLITE else "postgresql"}
