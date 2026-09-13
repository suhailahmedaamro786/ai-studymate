import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))
from app.domain.documents.status import can_transition


def test_queued_to_processing():
    assert can_transition("queued", "processing") is True


def test_processing_to_ready():
    assert can_transition("processing", "ready") is True


def test_processing_to_failed():
    assert can_transition("processing", "failed") is True


def test_no_backward_transition():
    assert can_transition("ready", "queued") is False
    assert can_transition("failed", "queued") is False


def test_no_invalid_transition():
    assert can_transition("ready", "processing") is False
