"""
pipeline.py — End-to-end orchestrator.

Flow:
  1. Receive issue payload
  2. (Optional) Run spec-kit
  3. Call model with fallback chain
  4. Validate output
  5. Run heuristic review
  6. Render PR body + email
  7. Return everything for n8n / GitHub Actions to consume
"""

import asyncio
import json
import logging
from dataclasses import dataclass, field, asdict
from typing import Optional

from .model_caller import call_with_fallback, ModelResponse
from .output_contract import validate_output
from .prompts import SYSTEM_PROMPT, build_user_prompt
from .review import heuristic_review, ReviewResult
from .templates import render_pr_body, render_email

logger = logging.getLogger(__name__)


@dataclass
class PipelineResult:
    success: bool
    model_used: str = ""
    pipeline_output: dict = field(default_factory=dict)
    pr_title: str = ""
    pr_body: str = ""
    email: dict = field(default_factory=dict)
    review: Optional[ReviewResult] = None
    errors: list[str] = field(default_factory=list)

    def to_json(self) -> str:
        d = {
            "success": self.success,
            "model_used": self.model_used,
            "pipeline_output": self.pipeline_output,
            "pr_title": self.pr_title,
            "pr_body": self.pr_body,
            "email": self.email,
            "review_summary": self.review.summary if self.review else "",
            "review_passed": self.review.passed if self.review else False,
            "errors": self.errors,
        }
        return json.dumps(d, indent=2, ensure_ascii=False)


async def run_pipeline(
    issue_title: str,
    issue_body: str,
    spec: str = "",
    plan: str = "",
    tasks: str = "",
    issue_url: str = "{{issue_url}}",
    api_key: str | None = None,
) -> PipelineResult:
    """
    Run the full pipeline: model call → validate → review → render.
    """
    user_prompt = build_user_prompt(issue_title, issue_body, spec, plan, tasks)

    try:
        model_resp: ModelResponse = await call_with_fallback(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=user_prompt,
            api_key=api_key,
        )
    except Exception as exc:
        return PipelineResult(success=False, errors=[str(exc)])

    output = model_resp.parsed

    # Review
    review = heuristic_review(output)

    # Render
    pr_body = render_pr_body(output, review.summary)
    email = render_email(output, issue_url=issue_url)

    return PipelineResult(
        success=True,
        model_used=model_resp.model_used,
        pipeline_output=output,
        pr_title=output.get("draft_pr_title", "Draft: untitled"),
        pr_body=pr_body,
        email=email,
        review=review,
        errors=model_resp.errors,
    )


def run_pipeline_sync(**kwargs) -> PipelineResult:
    """Synchronous wrapper for environments that can't do async."""
    return asyncio.run(run_pipeline(**kwargs))
