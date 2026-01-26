import sys
import pathlib

# Ensure backend `app` package is importable when running tests from the tests folder
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

import pytest
import asyncio
import httpx

from app.services.api_client import RagApiClient


class DummyResponse:
    def __init__(self, json_data=None):
        self._json = json_data or {}

    def raise_for_status(self):
        return None

    def json(self):
        return self._json


class DummyAsyncClient:
    def __init__(self, *args, **kwargs):
        pass

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return False

    async def post(self, url, json=None, files=None, data=None, timeout=None):
        return DummyResponse({"url": url, "json": json})

    async def get(self, url, timeout=None):
        return DummyResponse({"url": url})
    
    async def delete(self, url, timeout=None):
        return DummyResponse({"url": url})


@pytest.mark.asyncio
async def test_etl_submit_and_status_and_jobs(monkeypatch):
    # Patch httpx.AsyncClient to avoid real HTTP calls
    monkeypatch.setattr(httpx, "AsyncClient", DummyAsyncClient)

    client = RagApiClient(base_url="http://test-server")

    # etl_submit
    res = await client.etl_submit("notion", {"fake": "param"})
    assert "ingest/submit" in res["url"]
    assert res["json"]["source_type"] == "notion"

    # etl_status
    status = await client.etl_status("job-123")
    assert "ingest/status/job-123" in status["url"]

    # etl_list_jobs
    jobs = await client.etl_list_jobs(limit=10)
    assert "ingest/jobs" in jobs["url"]


@pytest.mark.asyncio
async def test_integration_endpoints_and_job_logs(monkeypatch):
    monkeypatch.setattr(httpx, "AsyncClient", DummyAsyncClient)
    client = RagApiClient(base_url="http://test-server")

    payload = {"name": "test-integration", "type": "confluence", "config": {"api_token": "x"}}
    created = await client.create_integration(payload)
    assert "/integrations/" in created["url"]
    assert created["json"]["name"] == "test-integration"

    listed = await client.list_integrations()
    assert "/integrations/" in listed["url"]

    deleted = await client.delete_integration("int-1")
    assert "/integrations/int-1" in deleted["url"]

    logs = await client.etl_job_logs("job-1")
    assert "/ingest/jobs/job-1/logs" in logs["url"]
