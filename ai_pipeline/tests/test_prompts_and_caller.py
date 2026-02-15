"""Tests for prompts.py and model_caller.py."""

import json
import pytest
from unittest.mock import AsyncMock, patch, MagicMock

from src.prompts import SYSTEM_PROMPT, build_user_prompt
from src.model_caller import (
    call_with_fallback,
    _call_single_model,
    DEFAULT_MODELS,
    ModelResponse,
)


# ── Prompts ─────────────────────────────────────────────────────────

class TestPrompts:
    def test_system_prompt_mentions_json(self):
        assert "JSON" in SYSTEM_PROMPT

    def test_system_prompt_lists_all_fields(self):
        for field in [
            "problem_summary",
            "implementation_plan",
            "tasks",
            "files_to_edit",
            "draft_pr_title",
        ]:
            assert field in SYSTEM_PROMPT

    def test_user_prompt_contains_issue(self):
        prompt = build_user_prompt("Bug title", "Bug description body")
        assert "Bug title" in prompt
        assert "Bug description body" in prompt

    def test_user_prompt_includes_spec(self):
        prompt = build_user_prompt("T", "B", spec="My spec content")
        assert "spec-kit spec" in prompt
        assert "My spec content" in prompt

    def test_user_prompt_includes_plan_and_tasks(self):
        prompt = build_user_prompt("T", "B", plan="Plan A", tasks="Task X")
        assert "Plan A" in prompt
        assert "Task X" in prompt

    def test_user_prompt_ends_with_instruction(self):
        prompt = build_user_prompt("T", "B")
        assert prompt.strip().endswith("No extra text.")


# ── Model Caller ────────────────────────────────────────────────────

class TestModelCaller:
    def test_default_models_not_empty(self):
        assert len(DEFAULT_MODELS) >= 3

    def test_default_models_are_free(self):
        for m in DEFAULT_MODELS:
            assert ":free" in m

    @pytest.mark.asyncio
    async def test_missing_api_key_raises(self):
        with patch.dict("os.environ", {}, clear=True):
            with pytest.raises(EnvironmentError, match="OPENROUTER_API_KEY"):
                await call_with_fallback("sys", "user", api_key="")

    @pytest.mark.asyncio
    async def test_fallback_on_failure(self):
        """If model 1 fails, model 2 should be tried."""
        valid_output = {
            "problem_summary": "Test problem summary here.",
            "implementation_plan": ["step 1"],
            "tasks": ["task 1"],
            "files_to_edit": ["file.py"],
            "tests_to_add_or_run": ["pytest"],
            "risk_notes": [],
            "draft_pr_title": "test title",
            "draft_pr_body": "test body that is long enough",
            "draft_email_subject": "test email subject",
            "draft_email_body": "test email body long enough here",
        }

        call_count = 0

        async def mock_call(model, sys, usr, key, timeout=120.0):
            nonlocal call_count
            call_count += 1
            if call_count == 1:
                return None  # first model fails
            return ModelResponse(
                model_used=model,
                raw_text=json.dumps(valid_output),
                parsed=valid_output,
                valid=True,
                errors=[],
            )

        with patch("src.model_caller._call_single_model", side_effect=mock_call):
            result = await call_with_fallback(
                "sys", "user", models=["model-a", "model-b"], api_key="fake-key"
            )
            assert result.model_used == "model-b"
            assert call_count == 2

    @pytest.mark.asyncio
    async def test_all_models_fail_raises(self):
        async def mock_fail(*args, **kwargs):
            return None

        with patch("src.model_caller._call_single_model", side_effect=mock_fail):
            with pytest.raises(RuntimeError, match="All .* models failed"):
                await call_with_fallback(
                    "sys", "user", models=["m1", "m2"], api_key="fake-key"
                )
