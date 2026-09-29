"""
TerraMesh AI — Structured Logging Configuration
================================================
Configures structlog for JSON-formatted, leveled, production-ready logging.
Call configure_logging() once at process start (main.py does this). All
terramesh.* loggers emit structured JSON in production and colored console
output in development. The ingestion pipeline, MQTT client, Redis client and
services use these loggers; a few deliberate pre-logging prints remain in
startup-fatal paths and standalone scripts.
"""

import logging
import os
import sys

try:
    import structlog
    HAS_STRUCTLOG = True
except ImportError:
    HAS_STRUCTLOG = False

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")


def configure_logging():
    """Call once at application startup to configure structlog."""
    level = getattr(logging, LOG_LEVEL, logging.INFO)

    if HAS_STRUCTLOG:
        shared_processors = [
            structlog.contextvars.merge_contextvars,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
        ]

        if ENVIRONMENT == "production":
            # JSON output for log aggregators (Loki, CloudWatch, etc.)
            renderer = structlog.processors.JSONRenderer()
        else:
            # Coloured console output for development
            renderer = structlog.dev.ConsoleRenderer()

        structlog.configure(
            processors=shared_processors + [
                structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
            ],
            wrapper_class=structlog.stdlib.BoundLogger,
            context_class=dict,
            logger_factory=structlog.stdlib.LoggerFactory(),
            cache_logger_on_first_use=True,
        )

        formatter = structlog.stdlib.ProcessorFormatter(
            foreign_pre_chain=shared_processors,
            processors=[
                structlog.stdlib.ProcessorFormatter.remove_processors_meta,
                renderer,
            ],
        )

        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(formatter)
        root = logging.getLogger()
        root.handlers = [handler]
        root.setLevel(level)

    else:
        # Fallback to stdlib logging if structlog not installed
        logging.basicConfig(
            stream=sys.stdout,
            level=level,
            format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        )

    # Silence noisy third-party loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)


def get_logger(name: str):
    """Get a logger for a module. Falls back to stdlib if structlog absent."""
    if HAS_STRUCTLOG:
        return structlog.get_logger(name)
    return logging.getLogger(name)
