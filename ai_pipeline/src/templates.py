"""
templates.py — Render draft PR body and email from pipeline output.
"""


def render_pr_body(output: dict, review_summary: str = "") -> str:
    """Render a standardised Draft PR markdown body."""
    tasks_md = "\n".join(f"- [ ] {t}" for t in output.get("tasks", []))
    files_md = "\n".join(f"- `{f}`" for f in output.get("files_to_edit", []))
    tests_md = "\n".join(f"- `{t}`" for t in output.get("tests_to_add_or_run", []))
    risks_md = "\n".join(f"- {r}" for r in output.get("risk_notes", [])) or "_None identified._"

    sections = [
        f"## Context\n\n{output.get('problem_summary', 'N/A')}",
        f"## Implementation Plan\n\n" + "\n".join(
            f"{i+1}. {s}" for i, s in enumerate(output.get("implementation_plan", []))
        ),
        f"## Files Touched\n\n{files_md}",
        f"## Tests\n\n{tests_md}",
        f"## Risks\n\n{risks_md}",
        f"## Checklist\n\n{tasks_md}",
    ]

    if review_summary:
        sections.append(f"## Automated Review\n\n```\n{review_summary}\n```")

    return "\n\n".join(sections)


def render_email(
    output: dict,
    issue_url: str = "{{issue_url}}",
    pr_url: str = "{{pr_url}}",
    ci_status: str = "{{ci_status}}",
) -> dict[str, str]:
    """
    Render an email dict with 'subject' and 'body'.
    Replaces placeholders if concrete URLs are provided.
    """
    subject = output.get("draft_email_subject", "[Draft PR] untitled")
    body = output.get("draft_email_body", "")

    # Replace placeholders
    body = body.replace("{{issue_url}}", issue_url)
    body = body.replace("{{pr_url}}", pr_url)
    body = body.replace("{{ci_status}}", ci_status)

    # Fallback body
    if len(body.strip()) < 10:
        body = (
            f"A Draft PR has been created for: {output.get('draft_pr_title', 'N/A')}\n\n"
            f"Issue: {issue_url}\n"
            f"PR:    {pr_url}\n"
            f"CI:    {ci_status}\n\n"
            f"Summary: {output.get('problem_summary', 'N/A')}"
        )

    return {"subject": subject, "body": body}
