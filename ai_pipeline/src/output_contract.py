"""
output_contract.py — Validate and sanitize model outputs against the canonical schema.

Usage:
    from src.output_contract import validate_output, sanitize_raw_response
"""

import json
import re
from pathlib import Path
from typing import Any

import jsonschema

SCHEMA_PATH = Path(__file__).parent / "output_contract.schema.json"

REQUIRED_FIELDS = [
    "problem_summary",
    "implementation_plan",
    "tasks",
    "files_to_edit",
    "tests_to_add_or_run",
    "risk_notes",
    "draft_pr_title",
    "draft_pr_body",
    "draft_email_subject",
    "draft_email_body",
]


def load_schema() -> dict:
    """Load the JSON schema from disk."""
    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def validate_output(data: dict) -> tuple[bool, list[str]]:
    """
    Validate *data* against the canonical output schema.

    Returns:
        (is_valid, errors)  where errors is a list of human-readable strings.
    """
    schema = load_schema()
    validator = jsonschema.Draft7Validator(schema)
    errors = sorted(validator.iter_errors(data), key=lambda e: list(e.absolute_path))
    messages = [_format_error(e) for e in errors]
    return (len(messages) == 0, messages)


def sanitize_raw_response(raw: str) -> dict:
    """
    Best-effort extraction of JSON from a model's raw text response.

    Handles:
      - Markdown ```json fences
      - Leading/trailing garbage
      - <think>…</think> blocks (DeepSeek-R1)
    """
    # Strip <think> blocks
    cleaned = re.sub(r"<think>.*?</think>", "", raw, flags=re.DOTALL)
    # Strip markdown fences
    cleaned = re.sub(r"```json\s*", "", cleaned)
    cleaned = re.sub(r"```\s*", "", cleaned)
    # Try to find the outermost JSON object
    match = re.search(r"\{[\s\S]*\}", cleaned)
    if not match:
        raise ValueError("No JSON object found in model response")
    return json.loads(match.group(0))


def fill_defaults(data: dict) -> dict:
    """
    Fill missing optional fields with safe defaults so downstream code
    never crashes on a KeyError.
    """
    defaults: dict[str, Any] = {
        "problem_summary": "",
        "implementation_plan": [],
        "tasks": [],
        "files_to_edit": [],
        "tests_to_add_or_run": [],
        "risk_notes": [],
        "draft_pr_title": "Draft: untitled",
        "draft_pr_body": "No body provided.",
        "draft_email_subject": "[Draft PR] untitled",
        "draft_email_body": "No email body provided.",
    }
    for key, default in defaults.items():
        if key not in data or data[key] is None:
            data[key] = default
    return data


# ── helpers ──────────────────────────────────────────────────────────

def _format_error(error: jsonschema.ValidationError) -> str:
    path = ".".join(str(p) for p in error.absolute_path) or "(root)"
    return f"[{path}] {error.message}"
