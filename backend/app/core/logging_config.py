"""
MedAI Hub - Structured JSON Logging Configuration
Provides JSON-formatted logging for production monitoring and debugging
"""

import logging
import json
from datetime import datetime


class JSONFormatter(logging.Formatter):
    """Custom formatter that outputs logs in JSON format for structured logging"""

    def format(self, record):
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
        }
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_data)


def setup_logging(debug: bool = False):
    """
    Configure application-wide logging with JSON formatting

    Args:
        debug: If True, sets log level to DEBUG, otherwise INFO
    """
    level = logging.DEBUG if debug else logging.INFO
    handler = logging.StreamHandler()
    handler.setFormatter(JSONFormatter())
    logging.basicConfig(level=level, handlers=[handler])
