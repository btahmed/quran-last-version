"""Tests for the n8n workflow JSON — structural validation."""

import json
from pathlib import Path

import pytest

WORKFLOW_PATH = Path(__file__).parent.parent / "n8n" / "workflow_v1.json"


@pytest.fixture
def workflow() -> dict:
    with open(WORKFLOW_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


class TestN8nWorkflow:
    def test_valid_json(self, workflow):
        assert isinstance(workflow, dict)

    def test_has_name(self, workflow):
        assert "name" in workflow
        assert len(workflow["name"]) > 5

    def test_has_nodes(self, workflow):
        assert "nodes" in workflow
        assert len(workflow["nodes"]) >= 5

    def test_has_connections(self, workflow):
        assert "connections" in workflow

    def test_trigger_node_exists(self, workflow):
        names = [n["name"] for n in workflow["nodes"]]
        assert "GitHub Issue Trigger" in names

    def test_normalize_node_exists(self, workflow):
        names = [n["name"] for n in workflow["nodes"]]
        assert "Normalize Input" in names

    def test_at_least_one_model_node(self, workflow):
        names = [n["name"] for n in workflow["nodes"]]
        model_nodes = [n for n in names if "Model" in n]
        assert len(model_nodes) >= 1

    def test_parse_node_exists(self, workflow):
        names = [n["name"] for n in workflow["nodes"]]
        assert "Parse JSON Output" in names

    def test_review_node_exists(self, workflow):
        names = [n["name"] for n in workflow["nodes"]]
        assert "Heuristic Review" in names

    def test_pr_node_exists(self, workflow):
        names = [n["name"] for n in workflow["nodes"]]
        assert "Create Draft PR" in names

    def test_email_node_exists(self, workflow):
        names = [n["name"] for n in workflow["nodes"]]
        assert "Send Notification Email" in names

    def test_no_hardcoded_api_keys(self, workflow):
        """Ensure no real API keys are present (regex patterns in code are OK)."""
        raw = json.dumps(workflow)
        # Real keys are 20+ chars after prefix; short refs in regex patterns are fine
        import re
        assert not re.search(r"sk-[A-Za-z0-9]{20,}", raw), "Real OpenAI-style key found"
        assert not re.search(r"ghp_[A-Za-z0-9]{36,}", raw), "Real GitHub PAT found"

    def test_all_nodes_have_ids(self, workflow):
        for node in workflow["nodes"]:
            assert "id" in node
            assert "name" in node

    def test_continue_on_fail_for_models(self, workflow):
        for node in workflow["nodes"]:
            if node.get("type", "") == "n8n-nodes-base.httpRequest" and "Model" in node.get("name", ""):
                assert node.get("continueOnFail") is True, (
                    f"Node '{node['name']}' should have continueOnFail=true"
                )
