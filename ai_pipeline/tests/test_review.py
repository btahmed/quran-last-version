"""Tests for review.py — heuristic review checks."""

import pytest
from src.review import heuristic_review, ReviewResult


def _base_output(**overrides) -> dict:
    base = {
        "problem_summary": "Fix login bug.",
        "implementation_plan": ["Step 1"],
        "tasks": ["Task 1"],
        "files_to_edit": ["src/auth.py"],
        "tests_to_add_or_run": ["pytest tests/"],
        "risk_notes": [],
        "draft_pr_title": "Fix login",
        "draft_pr_body": "## Context\nLogin fix.",
        "draft_email_subject": "[Draft PR] Fix login",
        "draft_email_body": "PR created.",
    }
    base.update(overrides)
    return base


class TestHeuristicReview:
    def test_clean_output_passes(self):
        result = heuristic_review(_base_output())
        assert result.passed is True
        assert len(result.blockers) == 0
        assert result.checklist["Tests added or specified"] is True

    def test_no_tests_warns(self):
        result = heuristic_review(_base_output(tests_to_add_or_run=[]))
        assert result.passed is True  # warning, not blocker
        assert result.checklist["Tests added or specified"] is False
        assert any("tests" in w.lower() for w in result.warnings)

    def test_breaking_change_detected(self):
        result = heuristic_review(
            _base_output(risk_notes=["This is a BREAKING change"])
        )
        assert result.checklist["No breaking changes detected"] is False
        assert any("breaking" in w.lower() for w in result.warnings)

    def test_migration_detected(self):
        result = heuristic_review(
            _base_output(draft_pr_body="## Changes\nALTER TABLE users ADD COLUMN email")
        )
        assert result.checklist["No DB migration required"] is False

    def test_secret_leak_blocks(self):
        result = heuristic_review(
            _base_output(draft_pr_body='api_key: "sk-abc123456789012345678901"')
        )
        assert result.passed is False
        assert len(result.blockers) > 0
        assert any("secret" in b.lower() or "key" in b.lower() for b in result.blockers)

    def test_aws_key_detected(self):
        result = heuristic_review(
            _base_output(risk_notes=["Key: AKIAIOSFODNN7EXAMPLE"])
        )
        assert result.passed is False

    def test_github_pat_detected(self):
        result = heuristic_review(
            _base_output(
                draft_pr_body="token: ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij"
            )
        )
        assert result.passed is False

    def test_summary_format(self):
        result = heuristic_review(_base_output())
        summary = result.summary
        assert "PASS" in summary
        assert "✓" in summary

    def test_failed_summary_format(self):
        result = heuristic_review(
            _base_output(draft_pr_body='api_key: "sk-longfakekey0123456789abc"')
        )
        summary = result.summary
        assert "BLOCKED" in summary
        assert "⛔" in summary
