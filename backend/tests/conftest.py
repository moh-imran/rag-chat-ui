"""
E2E Test Configuration and Fixtures

This module provides shared fixtures for end-to-end testing of the
rag-chat-ui -> backend -> rag-qa-api integration.
"""
import sys
import pathlib
import os
import pytest
import asyncio
import httpx
from typing import AsyncGenerator, Generator, Dict, Any, Optional
from unittest.mock import AsyncMock, MagicMock, patch

# Ensure backend `app` package is importable
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

from app.services.api_client import RagApiClient


# =============================================================================
# Configuration
# =============================================================================

# Test server URLs - can be overridden via environment variables
RAG_QA_API_URL = os.getenv("RAG_QA_API_URL", "http://localhost:8000")
RAG_CHAT_UI_BACKEND_URL = os.getenv("RAG_CHAT_UI_BACKEND_URL", "http://localhost:8001")

# Test user credentials
TEST_USER_EMAIL = os.getenv("TEST_USER_EMAIL", "test@example.com")
TEST_USER_PASSWORD = os.getenv("TEST_USER_PASSWORD", "testpassword123")


# =============================================================================
# Mock Response Classes
# =============================================================================

class MockResponse:
    """Mock HTTP response for unit tests"""
    def __init__(
        self,
        json_data: Optional[Dict] = None,
        status_code: int = 200,
        text: str = "",
        headers: Optional[Dict] = None
    ):
        self._json = json_data or {}
        self.status_code = status_code
        self.text = text
        self.headers = headers or {}
        self.ok = 200 <= status_code < 300

    def raise_for_status(self):
        if not self.ok:
            raise httpx.HTTPStatusError(
                f"HTTP {self.status_code}",
                request=MagicMock(),
                response=self
            )

    def json(self):
        return self._json


class MockStreamResponse:
    """Mock streaming HTTP response"""
    def __init__(self, events: list):
        self._events = events
        self.status_code = 200
        self.ok = True
        self.headers = {"content-type": "text/event-stream"}

    def raise_for_status(self):
        pass

    async def aiter_lines(self):
        for event in self._events:
            yield event

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        pass


class MockAsyncClient:
    """Mock async HTTP client for isolated tests"""
    def __init__(self, responses: Optional[Dict[str, MockResponse]] = None):
        self.responses = responses or {}
        self.requests = []  # Track all requests made

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        pass

    def _get_response(self, method: str, url: str) -> MockResponse:
        key = f"{method}:{url}"
        # Try exact match first
        if key in self.responses:
            return self.responses[key]
        # Try partial match
        for pattern, response in self.responses.items():
            if pattern.split(":", 1)[1] in url:
                return response
        # Default response
        return MockResponse({"status": "ok"})

    async def post(self, url: str, **kwargs) -> MockResponse:
        self.requests.append(("POST", url, kwargs))
        return self._get_response("POST", url)

    async def get(self, url: str, **kwargs) -> MockResponse:
        self.requests.append(("GET", url, kwargs))
        return self._get_response("GET", url)

    async def delete(self, url: str, **kwargs) -> MockResponse:
        self.requests.append(("DELETE", url, kwargs))
        return self._get_response("DELETE", url)

    async def put(self, url: str, **kwargs) -> MockResponse:
        self.requests.append(("PUT", url, kwargs))
        return self._get_response("PUT", url)

    def stream(self, method: str, url: str, **kwargs):
        self.requests.append((method, url, kwargs))
        # Return a mock stream response
        events = self.responses.get(f"STREAM:{url}", [
            'data: {"type": "retrieval_start", "data": {}}',
            'data: {"type": "retrieval_complete", "data": {"num_docs": 3}}',
            'data: {"type": "generation_start", "data": {}}',
            'data: {"type": "token", "data": {"content": "Hello"}}',
            'data: {"type": "token", "data": {"content": " World"}}',
            'data: {"type": "done", "data": {}}'
        ])
        return MockStreamResponse(events)


# =============================================================================
# Pytest Fixtures
# =============================================================================

@pytest.fixture
def event_loop():
    """Create event loop for async tests"""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def mock_client() -> MockAsyncClient:
    """Provide a mock HTTP client"""
    return MockAsyncClient()


@pytest.fixture
def rag_api_client() -> RagApiClient:
    """Provide a RagApiClient instance"""
    return RagApiClient(base_url=RAG_QA_API_URL)


@pytest.fixture
def mock_rag_api_client(monkeypatch) -> RagApiClient:
    """Provide a RagApiClient with mocked HTTP calls"""
    mock = MockAsyncClient({
        "POST:/chat/query": MockResponse({
            "answer": "This is a test answer.",
            "context_used": True,
            "sources": [{"content": "test", "score": 0.9}]
        }),
        "POST:/chat/query/stream": MockResponse({}),
        "POST:/ingest/submit": MockResponse({
            "job_id": "test-job-123",
            "status": "running"
        }),
        "GET:/ingest/status": MockResponse({
            "job_id": "test-job-123",
            "status": "completed",
            "progress": 100
        }),
        "GET:/ingest/jobs": MockResponse({
            "jobs": [{"job_id": "job-1", "status": "completed"}]
        }),
        "POST:/integrations/": MockResponse({
            "id": "int-123",
            "name": "test",
            "type": "confluence"
        }),
        "GET:/integrations/": MockResponse({
            "integrations": []
        }),
        "DELETE:/integrations/": MockResponse({
            "status": "deleted"
        }),
        "GET:/health": MockResponse({
            "status": "healthy"
        }),
        "POST:/search": MockResponse({
            "results": [{"content": "test", "score": 0.85}]
        })
    })
    monkeypatch.setattr(httpx, "AsyncClient", lambda **kwargs: mock)
    return RagApiClient(base_url="http://mock-server")


@pytest.fixture
def auth_token() -> str:
    """Provide a mock JWT token for authenticated requests"""
    return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiZXhwIjoxOTk5OTk5OTk5fQ.mock_signature"


@pytest.fixture
def authenticated_headers(auth_token: str) -> Dict[str, str]:
    """Provide headers with authentication token"""
    return {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }


# =============================================================================
# Sample Test Data Fixtures
# =============================================================================

@pytest.fixture
def sample_query_request() -> Dict[str, Any]:
    """Sample chat query request"""
    return {
        "question": "What is machine learning?",
        "top_k": 5,
        "temperature": 0.7,
        "max_tokens": 1000,
        "return_sources": True
    }


@pytest.fixture
def sample_file_content() -> bytes:
    """Sample file content for upload tests"""
    return b"This is a test document for RAG ingestion. It contains information about machine learning and AI."


@pytest.fixture
def sample_web_ingest_request() -> Dict[str, Any]:
    """Sample web ingestion request"""
    return {
        "url": "https://docs.example.com",
        "max_depth": 2
    }


@pytest.fixture
def sample_git_ingest_request() -> Dict[str, Any]:
    """Sample git ingestion request"""
    return {
        "repo_url": "https://github.com/test/repo",
        "branch": "main"
    }


@pytest.fixture
def sample_confluence_ingest_request() -> Dict[str, Any]:
    """Sample Confluence ingestion request"""
    return {
        "base_url": "https://test.atlassian.net/wiki",
        "email": "user@example.com",
        "api_token": "test-token-123"
    }


@pytest.fixture
def sample_sharepoint_ingest_request() -> Dict[str, Any]:
    """Sample SharePoint ingestion request"""
    return {
        "site_id": "test-tenant.sharepoint.com,site-id",
        "access_token": "oauth-token-123"
    }


@pytest.fixture
def sample_notion_ingest_request() -> Dict[str, Any]:
    """Sample Notion ingestion request"""
    return {
        "api_key": "secret_notion_key",
        "database_id": "db-123"
    }


@pytest.fixture
def sample_database_ingest_request() -> Dict[str, Any]:
    """Sample database ingestion request"""
    return {
        "host": "localhost",
        "port": 5432,
        "database": "testdb",
        "user": "testuser",
        "password": "testpass",
        "db_type": "postgresql"
    }


@pytest.fixture
def sample_integration_payload() -> Dict[str, Any]:
    """Sample integration creation payload"""
    return {
        "name": "Test Confluence Integration",
        "type": "confluence",
        "config": {
            "base_url": "https://test.atlassian.net/wiki",
            "email": "user@example.com",
            "api_token": "test-token"
        }
    }


# =============================================================================
# Helper Functions
# =============================================================================

def assert_valid_response(response: Dict[str, Any], required_keys: list):
    """Assert response contains required keys"""
    for key in required_keys:
        assert key in response, f"Response missing required key: {key}"


def assert_error_response(response: Dict[str, Any]):
    """Assert response is an error response"""
    assert "detail" in response or "error" in response


async def wait_for_job_completion(
    client: RagApiClient,
    job_id: str,
    max_wait_seconds: int = 60,
    poll_interval: float = 2.0
) -> Dict[str, Any]:
    """Wait for an async job to complete"""
    import time
    start_time = time.time()

    while time.time() - start_time < max_wait_seconds:
        status = await client.etl_status(job_id)
        if status.get("status") in ["completed", "failed"]:
            return status
        await asyncio.sleep(poll_interval)

    raise TimeoutError(f"Job {job_id} did not complete within {max_wait_seconds} seconds")
