"""Tests for templates.py — PR and email rendering."""

import pytest
from src.templates import render_pr_body, render_email


def _sample_output() -> dict:
    return {
        "problem_summary": "Search is broken on mobile.",
        "implementation_plan": ["Fix query parsing", "Add responsive CSS"],
        "tasks": ["Update parser", "Write mobile test"],
        "files_to_edit": ["src/search.py", "static/style.css"],
        "tests_to_add_or_run": ["pytest tests/test_search.py"],
        "risk_notes": ["May affect desktop layout"],
        "draft_pr_title": "fix(search): mobile search broken",
        "draft_pr_body": "Original body.",
        "draft_email_subject": "[Draft PR] fix(search): mobile search broken",
        "draft_email_body": "Check {{issue_url}} and {{pr_url}}. CI: {{ci_status}}",
    }


class TestRenderPrBody:
    def test_contains_context_section(self):
        body = render_pr_body(_sample_output())
        assert "## Context" in body
        assert "Search is broken on mobile" in body

    def test_contains_files(self):
        body = render_pr_body(_sample_output())
        assert "`src/search.py`" in body
        assert "`static/style.css`" in body

    def test_contains_tests(self):
        body = render_pr_body(_sample_output())
        assert "`pytest tests/test_search.py`" in body

    def test_contains_risks(self):
        body = render_pr_body(_sample_output())
        assert "desktop layout" in body

    def test_contains_checklist(self):
        body = render_pr_body(_sample_output())
        assert "- [ ] Update parser" in body

    def test_review_summary_appended(self):
        body = render_pr_body(_sample_output(), review_summary="All good")
        assert "## Automated Review" in body
        assert "All good" in body

    def test_empty_risks_shows_none(self):
        output = _sample_output()
        output["risk_notes"] = []
        body = render_pr_body(output)
        assert "None identified" in body

    def test_implementation_plan_numbered(self):
        body = render_pr_body(_sample_output())
        assert "1. Fix query parsing" in body
        assert "2. Add responsive CSS" in body


class TestRenderEmail:
    def test_placeholder_replacement(self):
        email = render_email(
            _sample_output(),
            issue_url="https://github.com/org/repo/issues/42",
            pr_url="https://github.com/org/repo/pull/99",
            ci_status="passing",
        )
        assert "https://github.com/org/repo/issues/42" in email["body"]
        assert "https://github.com/org/repo/pull/99" in email["body"]
        assert "passing" in email["body"]

    def test_subject_preserved(self):
        email = render_email(_sample_output())
        assert email["subject"] == "[Draft PR] fix(search): mobile search broken"

    def test_fallback_body_on_empty(self):
        output = _sample_output()
        output["draft_email_body"] = ""
        email = render_email(output, issue_url="http://issue", pr_url="http://pr")
        assert "http://issue" in email["body"]
        assert "http://pr" in email["body"]

    def test_default_placeholders_kept(self):
        email = render_email(_sample_output())
        # When no concrete URLs given, placeholders remain in body
        assert "{{issue_url}}" in email["body"]
        assert "{{pr_url}}" in email["body"]
        assert "{{ci_status}}" in email["body"]
