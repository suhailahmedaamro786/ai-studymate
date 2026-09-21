import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))
import pytest
from app.domain.tutor.grounding import check_grounding


def test_grounding_above_threshold():
    chunks = [{"similarity": 0.85}, {"similarity": 0.72}]
    grounded, score = check_grounding(chunks)
    assert grounded is True
    assert score == 0.85


def test_grounding_below_threshold():
    chunks = [{"similarity": 0.2}, {"similarity": 0.35}]
    grounded, score = check_grounding(chunks)
    assert grounded is False
    assert score == 0.35


def test_grounding_empty_chunks():
    grounded, score = check_grounding([])
    assert grounded is False
    assert score == 0.0


def test_grounding_at_threshold():
    chunks = [{"similarity": 0.7}]
    grounded, score = check_grounding(chunks)
    assert grounded is True
