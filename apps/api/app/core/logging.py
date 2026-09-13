import logging
import sys
import uuid
from contextvars import ContextVar

request_id_var: ContextVar[str] = ContextVar("request_id", default="-")
user_id_var: ContextVar[str] = ContextVar("user_id", default="-")


class RequestIdFilter(logging.Filter):
    def filter(self, record):
        record.request_id = request_id_var.get("-")
        record.user_id = user_id_var.get("-")
        return True


def setup_logging():
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(
        logging.Formatter(
            "%(asctime)s | %(levelname)s | req=%(request_id)s | user=%(user_id)s | %(message)s"
        )
    )
    handler.addFilter(RequestIdFilter())

    root = logging.getLogger()
    root.handlers = [handler]
    root.setLevel(logging.INFO)
