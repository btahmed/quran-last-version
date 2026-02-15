"""Tests for output_contract.py — schema validation, sanitization, defaults."""

import json
import pytest
from src.output_contract import validate_output, sanitize_raw_response, fill_defaults, load_schema


# ── Fixtures ─────────────────────────────────────────────────────────

def _valid_output() -> dict:
    return {
        "problem_summary": "Users cannot log in when using SSO provider.",
        "implementation_plan": ["Add SAML handler", "Write integration test"],
        "tasks": ["Implement SAML endpoint", "Add unit tests"],
        "files_to_edit": ["src/auth/saml.py"],
        "tests_to_add_or_run": ["pytest tests/test_saml.py"],
        "risk_notes": ["Requires new dependency: python3-saml"],
        "draft_pr_title": "feat(auth): add SAML SSO support",
        "draft_pr_body": "## Context\nSSO login broken\n## Changes\nAdded SAML handler.",
        "draft_email_subject": "[Draft PR] feat(auth): add SAML SSO support",
        "draft_email_body": "PR ready: {{pr_url}} for issue {{issue_url}}. CI: {{ci_status}}",
    }


# ── Schema loading ──────────────────────────────────────────────────

class TestSchemaLoading:
    def test_schema_loads(self):
        schema = load_schema()
        assert schema["type"] == "object"
        assert "problem_summary" in schema["properties"]

    def test_schema_has_all_required_fields(self):
        schema = load_schema()
        assert len(schema["required"]) == 10


# ── Validation ──────────────────────────────────────────────────────

class TestValidateOutput:
    def test_valid_output_passes(self):
        ok, errors = validate_output(_valid_output())
        assert ok is True
        assert errors == []

    def test_missing_field_fails(self):
        data = _valid_output()
        del data["problem_summary"]
        ok, errors = validate_output(data)
        assert ok is False
        assert any("problem_summary" in e for e in errors)

    def test_empty_problem_summary_fails(self):
        data = _valid_output()
        data["problem_summary"] = "short"  # less than minLength=10
        ok, errors = validate_output(data)
        assert ok is False

    def test_empty_plan_array_fails(self):
        data = _valid_output()
        data["implementation_plan"] = []
        ok, errors = validate_output(data)
        assert ok is False

    def test_extra_field_fails(self):
        data = _valid_output()
        data["extra_garbage"] = "oops"
        ok, errors = validate_output(data)
        assert ok is False

    def test_wrong_type_fails(self):
        data = _valid_output()
        data["tasks"] = "not a list"
        ok, errors = validate_output(data)
        assert ok is False

    def test_empty_risk_notes_is_ok(self):
        data = _valid_output()
        data["risk_notes"] = []
        ok, errors = validate_output(data)
        assert ok is True


# ── Sanitization ────────────────────────────────────────────────────

class TestSanitizeRawResponse:
    def test_clean_json(self):
        raw = json.dumps(_valid_output())
        parsed = sanitize_raw_response(raw)
        assert parsed["problem_summary"] == _valid_output()["problem_summary"]

    def test_markdown_fences(self):
        raw = "```json\n" + json.dumps({"key": "value"}) + "\n```"
        parsed = sanitize_raw_response(raw)
        assert parsed["key"] == "value"

    def test_leading_garbage(self):
        raw = "Sure! Here is the JSON:\n\n" + json.dumps({"key": "value"})
        parsed = sanitize_raw_response(raw)
        assert parsed["key"] == "value"

    def test_think_blocks_stripped(self):
        raw = (
            "<think>Let me reason about this...</think>\n"
            + json.dumps({"key": "value"})
        )
        parsed = sanitize_raw_response(raw)
        assert parsed["key"] == "value"

    def test_no_json_raises(self):
        with pytest.raises(ValueError, match="No JSON object"):
            sanitize_raw_response("This is just plain text with no JSON.")

    def test_multiline_think_block(self):
        raw = (
            "<think>\nStep 1: think\nStep 2: more thinking\n</think>\n"
            '{"answer": 42}'
        )
        parsed = sanitize_raw_response(raw)
        assert parsed["answer"] == 42


# ── fill_defaults ───────────────────────────────────────────────────

class TestFillDefaults:
    def test_fills_missing_fields(self):
        data = {}
        filled = fill_defaults(data)
        assert filled["problem_summary"] == ""
        assert filled["draft_pr_title"] == "Draft: untitled"
        assert isinstance(filled["tasks"], list)

    def test_does_not_overwrite_existing(self):
        data = {"problem_summary": "already set"}
        filled = fill_defaults(data)
        assert filled["problem_summary"] == "already set"

    def test_replaces_none_values(self):
        data = {"problem_summary": None}
        filled = fill_defaults(data)
        assert filled["problem_summary"] == ""
