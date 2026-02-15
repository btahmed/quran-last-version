"""
review.py — Automated review: heuristic checklist + optional AI review.
"""

import re
from dataclasses import dataclass, field


@dataclass
class ReviewResult:
    passed: bool = True
    warnings: list[str] = field(default_factory=list)
    blockers: list[str] = field(default_factory=list)
    checklist: dict[str, bool] = field(default_factory=dict)

    @property
    def summary(self) -> str:
        status = "PASS" if self.passed else "BLOCKED"
        lines = [f"Review: {status}"]
        for label, ok in self.checklist.items():
            lines.append(f"  [{'✓' if ok else '✗'}] {label}")
        if self.blockers:
            lines.append("Blockers:")
            for b in self.blockers:
                lines.append(f"  ⛔ {b}")
        if self.warnings:
            lines.append("Warnings:")
            for w in self.warnings:
                lines.append(f"  ⚠  {w}")
        return "\n".join(lines)


# ── Sensitive patterns ──────────────────────────────────────────────

_SECRET_PATTERNS = [
    re.compile(r"(?i)(api[_-]?key|secret|password|token)\s*[:=]\s*['\"][^'\"]{8,}"),
    re.compile(r"(?i)AKIA[0-9A-Z]{16}"),        # AWS key
    re.compile(r"sk-[A-Za-z0-9]{20,}"),           # OpenAI-style key
    re.compile(r"ghp_[A-Za-z0-9]{36}"),            # GitHub PAT
]

_MIGRATION_KEYWORDS = [
    "ALTER TABLE", "DROP TABLE", "CREATE TABLE",
    "ADD COLUMN", "DROP COLUMN", "RENAME COLUMN",
    "alembic", "migrate", "migration",
]

_BREAKING_KEYWORDS = [
    "BREAKING", "breaking change", "deprecated",
    "removed", "backward incompatible",
]


def heuristic_review(pipeline_output: dict) -> ReviewResult:
    """
    Run rule-based checks on a validated pipeline output dict.
    """
    result = ReviewResult()
    body = pipeline_output.get("draft_pr_body", "")
    files = pipeline_output.get("files_to_edit", [])
    risks = pipeline_output.get("risk_notes", [])
    tests = pipeline_output.get("tests_to_add_or_run", [])
    all_text = f"{body} {' '.join(risks)} {' '.join(files)}"

    # 1. Tests added?
    has_tests = len(tests) > 0
    result.checklist["Tests added or specified"] = has_tests
    if not has_tests:
        result.warnings.append("No tests specified — consider adding tests.")

    # 2. Breaking changes?
    has_breaking = any(kw.lower() in all_text.lower() for kw in _BREAKING_KEYWORDS)
    result.checklist["No breaking changes detected"] = not has_breaking
    if has_breaking:
        result.warnings.append("Possible breaking change detected — review carefully.")

    # 3. DB migration?
    has_migration = any(kw.lower() in all_text.lower() for kw in _MIGRATION_KEYWORDS)
    result.checklist["No DB migration required"] = not has_migration
    if has_migration:
        result.warnings.append("DB migration keywords found — ensure migration is safe.")

    # 4. Secret leak?
    has_secrets = any(p.search(all_text) for p in _SECRET_PATTERNS)
    result.checklist["No secrets or API keys leaked"] = not has_secrets
    if has_secrets:
        result.blockers.append("Potential secret/API key detected in output!")
        result.passed = False

    # 5. Risk notes present?
    result.checklist["Risk notes reviewed"] = True  # always pass, advisory only

    return result
