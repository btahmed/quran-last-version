"""
model_caller.py — Call OpenRouter models with automatic fallback chain.

Usage:
    from src.model_caller import call_with_fallback
    result = await call_with_fallback(system, user)
"""

import asyncio
import logging
import os
from dataclasses import dataclass, field
from typing import Optional

import httpx

from .output_contract import sanitize_raw_response, validate_output, fill_defaults

logger = logging.getLogger(__name__)

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

# Ordered fallback chain — first success wins.
DEFAULT_MODELS: list[str] = [
    "qwen/qwen3-coder-480b-a35b:free",
    "qwen/qwen3-next-80b-a3b-instruct:free",
    "deepseek/deepseek-r1-0528:free",
    "stepfun/step-3.5-flash:free",
    "arcee/trinity-mini:free",
]


@dataclass
class ModelResponse:
    model_used: str
    raw_text: str
    parsed: dict
    valid: bool
    errors: list[str] = field(default_factory=list)


async def _call_single_model(
    model: str,
    system_prompt: str,
    user_prompt: str,
    api_key: str,
    timeout: float = 120.0,
) -> Optional[ModelResponse]:
    """Call a single model on OpenRouter.  Returns None on failure."""
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/spec-kit-pipeline",
        "X-Title": "spec-kit-pipeline",
    }
    payload = {
        "model": model,
        "max_tokens": 4096,
        "temperature": 0.2,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    }

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.post(OPENROUTER_URL, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            raw_text = data["choices"][0]["message"]["content"]

            parsed = sanitize_raw_response(raw_text)
            parsed = fill_defaults(parsed)
            valid, errors = validate_output(parsed)

            return ModelResponse(
                model_used=model,
                raw_text=raw_text,
                parsed=parsed,
                valid=valid,
                errors=errors,
            )
    except Exception as exc:
        logger.warning("Model %s failed: %s", model, exc)
        return None


async def call_with_fallback(
    system_prompt: str,
    user_prompt: str,
    models: list[str] | None = None,
    api_key: str | None = None,
) -> ModelResponse:
    """
    Try each model in *models* until one returns a valid JSON response.

    Raises RuntimeError if every model fails.
    """
    api_key = api_key or os.environ.get("OPENROUTER_API_KEY", "")
    if not api_key:
        raise EnvironmentError("OPENROUTER_API_KEY not set")

    models = models or DEFAULT_MODELS

    for model in models:
        logger.info("Trying model: %s", model)
        result = await _call_single_model(model, system_prompt, user_prompt, api_key)
        if result is not None and result.valid:
            logger.info("Success with model: %s", model)
            return result
        if result is not None:
            logger.warning(
                "Model %s returned invalid JSON: %s", model, result.errors
            )

    raise RuntimeError(
        f"All {len(models)} models failed to produce a valid response."
    )
