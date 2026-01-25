"""
E2E Tests for Integrations Management

Tests CRUD operations for saved integrations:
- Create integration
- List integrations
- Delete integration

Supported integration types:
- Confluence
- SharePoint
- Notion
- Database
"""
import sys
import pathlib
import pytest
import httpx
from unittest.mock import patch

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

from conftest import (
    MockResponse, MockAsyncClient,
    RAG_CHAT_UI_BACKEND_URL
)
from app.services.api_client import RagApiClient


# =============================================================================
# Create Integration Tests
# =============================================================================

class TestCreateIntegration:
    """Test creating integrations"""

    @pytest.mark.asyncio
    async def test_create_confluence_integration(self, authenticated_headers):
        """Test creating Confluence integration"""
        mock_responses = {
            "POST:/integrations": MockResponse({
                "id": "int-conf-123",
                "name": "My Confluence",
                "type": "confluence",
                "config": {
                    "base_url": "https://mycompany.atlassian.net/wiki"
                },
                "created_at": "2024-01-01T00:00:00Z"
            }, status_code=201)
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{RAG_CHAT_UI_BACKEND_URL}/integrations",
                    headers=authenticated_headers,
                    json={
                        "name": "My Confluence",
                        "type": "confluence",
                        "config": {
                            "base_url": "https://mycompany.atlassian.net/wiki",
                            "email": "user@company.com",
                            "api_token": "secret-token-123"
                        }
                    }
                )

        assert response.status_code == 201
        data = response.json()
        assert data["type"] == "confluence"
        assert "id" in data

    @pytest.mark.asyncio
    async def test_create_sharepoint_integration(self, authenticated_headers):
        """Test creating SharePoint integration"""
        mock_responses = {
            "POST:/integrations": MockResponse({
                "id": "int-sp-456",
                "name": "Corporate SharePoint",
                "type": "sharepoint",
                "created_at": "2024-01-01T00:00:00Z"
            }, status_code=201)
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{RAG_CHAT_UI_BACKEND_URL}/integrations",
                    headers=authenticated_headers,
                    json={
                        "name": "Corporate SharePoint",
                        "type": "sharepoint",
                        "config": {
                            "site_id": "tenant.sharepoint.com,site-guid",
                            "client_id": "app-client-id",
                            "client_secret": "app-secret"
                        }
                    }
                )

        assert response.status_code == 201
        data = response.json()
        assert data["type"] == "sharepoint"

    @pytest.mark.asyncio
    async def test_create_notion_integration(self, authenticated_headers):
        """Test creating Notion integration"""
        mock_responses = {
            "POST:/integrations": MockResponse({
                "id": "int-notion-789",
                "name": "Team Notion",
                "type": "notion",
                "created_at": "2024-01-01T00:00:00Z"
            }, status_code=201)
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{RAG_CHAT_UI_BACKEND_URL}/integrations",
                    headers=authenticated_headers,
                    json={
                        "name": "Team Notion",
                        "type": "notion",
                        "config": {
                            "api_key": "secret_notion_integration_token"
                        }
                    }
                )

        assert response.status_code == 201
        data = response.json()
        assert data["type"] == "notion"

    @pytest.mark.asyncio
    async def test_create_database_integration(self, authenticated_headers):
        """Test creating database integration"""
        mock_responses = {
            "POST:/integrations": MockResponse({
                "id": "int-db-101",
                "name": "Production Database",
                "type": "database",
                "created_at": "2024-01-01T00:00:00Z"
            }, status_code=201)
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{RAG_CHAT_UI_BACKEND_URL}/integrations",
                    headers=authenticated_headers,
                    json={
                        "name": "Production Database",
                        "type": "database",
                        "config": {
                            "host": "db.company.com",
                            "port": 5432,
                            "database": "knowledge_base",
                            "user": "readonly_user",
                            "password": "secure_password",
                            "db_type": "postgresql"
                        }
                    }
                )

        assert response.status_code == 201
        data = response.json()
        assert data["type"] == "database"

    @pytest.mark.asyncio
    async def test_create_integration_missing_name_fails(self, authenticated_headers):
        """Test creating integration without name fails"""
        mock_responses = {
            "POST:/integrations": MockResponse(
                {"detail": "name is required"},
                status_code=422
            )
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{RAG_CHAT_UI_BACKEND_URL}/integrations",
                    headers=authenticated_headers,
                    json={
                        "type": "confluence",
                        "config": {"base_url": "https://test.atlassian.net"}
                    }
                )

        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_create_integration_invalid_type_fails(self, authenticated_headers):
        """Test creating integration with invalid type fails"""
        mock_responses = {
            "POST:/integrations": MockResponse(
                {"detail": "Invalid integration type"},
                status_code=400
            )
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{RAG_CHAT_UI_BACKEND_URL}/integrations",
                    headers=authenticated_headers,
                    json={
                        "name": "Invalid Integration",
                        "type": "unsupported_type",
                        "config": {}
                    }
                )

        assert response.status_code == 400

    @pytest.mark.asyncio
    async def test_create_integration_requires_auth(self):
        """Test creating integration requires authentication"""
        mock_responses = {
            "POST:/integrations": MockResponse(
                {"detail": "Not authenticated"},
                status_code=401
            )
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{RAG_CHAT_UI_BACKEND_URL}/integrations",
                    json={
                        "name": "Test",
                        "type": "confluence",
                        "config": {}
                    }
                )

        assert response.status_code == 401


# =============================================================================
# List Integrations Tests
# =============================================================================

class TestListIntegrations:
    """Test listing integrations"""

    @pytest.mark.asyncio
    async def test_list_integrations_success(self, authenticated_headers):
        """Test listing all integrations"""
        mock_responses = {
            "GET:/integrations": MockResponse({
                "integrations": [
                    {
                        "id": "int-1",
                        "name": "Confluence Docs",
                        "type": "confluence",
                        "created_at": "2024-01-01T00:00:00Z"
                    },
                    {
                        "id": "int-2",
                        "name": "SharePoint Files",
                        "type": "sharepoint",
                        "created_at": "2024-01-02T00:00:00Z"
                    },
                    {
                        "id": "int-3",
                        "name": "Team Notion",
                        "type": "notion",
                        "created_at": "2024-01-03T00:00:00Z"
                    }
                ]
            })
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{RAG_CHAT_UI_BACKEND_URL}/integrations",
                    headers=authenticated_headers
                )

        assert response.status_code == 200
        data = response.json()
        assert "integrations" in data
        assert len(data["integrations"]) == 3

    @pytest.mark.asyncio
    async def test_list_integrations_empty(self, authenticated_headers):
        """Test listing integrations when none exist"""
        mock_responses = {
            "GET:/integrations": MockResponse({
                "integrations": []
            })
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{RAG_CHAT_UI_BACKEND_URL}/integrations",
                    headers=authenticated_headers
                )

        assert response.status_code == 200
        data = response.json()
        assert data["integrations"] == []

    @pytest.mark.asyncio
    async def test_list_integrations_filters_by_type(self, authenticated_headers):
        """Test listing integrations filtered by type"""
        mock_responses = {
            "GET:/integrations": MockResponse({
                "integrations": [
                    {"id": "int-1", "name": "Confluence 1", "type": "confluence"},
                    {"id": "int-2", "name": "Confluence 2", "type": "confluence"}
                ]
            })
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{RAG_CHAT_UI_BACKEND_URL}/integrations?type=confluence",
                    headers=authenticated_headers
                )

        assert response.status_code == 200
        data = response.json()
        assert all(i["type"] == "confluence" for i in data["integrations"])


# =============================================================================
# Delete Integration Tests
# =============================================================================

class TestDeleteIntegration:
    """Test deleting integrations"""

    @pytest.mark.asyncio
    async def test_delete_integration_success(self, authenticated_headers):
        """Test deleting integration"""
        mock_responses = {
            "DELETE:/integrations/int-123": MockResponse({
                "status": "deleted",
                "id": "int-123"
            })
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                response = await client.delete(
                    f"{RAG_CHAT_UI_BACKEND_URL}/integrations/int-123",
                    headers=authenticated_headers
                )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "deleted"

    @pytest.mark.asyncio
    async def test_delete_nonexistent_integration_fails(self, authenticated_headers):
        """Test deleting non-existent integration fails"""
        mock_responses = {
            "DELETE:/integrations/nonexistent": MockResponse(
                {"detail": "Integration not found"},
                status_code=404
            )
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                response = await client.delete(
                    f"{RAG_CHAT_UI_BACKEND_URL}/integrations/nonexistent",
                    headers=authenticated_headers
                )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_integration_requires_auth(self):
        """Test deleting integration requires authentication"""
        mock_responses = {
            "DELETE:/integrations/int-123": MockResponse(
                {"detail": "Not authenticated"},
                status_code=401
            )
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                response = await client.delete(
                    f"{RAG_CHAT_UI_BACKEND_URL}/integrations/int-123"
                )

        assert response.status_code == 401


# =============================================================================
# Integration with Ingestion Tests
# =============================================================================

class TestIntegrationWithIngestion:
    """Test using saved integrations with ingestion"""

    @pytest.mark.asyncio
    async def test_use_saved_confluence_integration(self, authenticated_headers):
        """Test using saved Confluence integration for ingestion"""
        mock_responses = {
            "POST:/ingest/etl/submit": MockResponse({
                "job_id": "job-with-integration",
                "status": "running",
                "integration_used": "int-conf-123"
            })
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{RAG_CHAT_UI_BACKEND_URL}/ingest/etl/submit",
                    headers=authenticated_headers,
                    json={
                        "source_type": "confluence",
                        "source_params": {
                            "integration_id": "int-conf-123"
                        }
                    }
                )

        assert response.status_code == 200
        data = response.json()
        assert "job_id" in data

    @pytest.mark.asyncio
    async def test_use_saved_sharepoint_integration(self, authenticated_headers):
        """Test using saved SharePoint integration for ingestion"""
        mock_responses = {
            "POST:/ingest/etl/submit": MockResponse({
                "job_id": "sp-job-with-integration",
                "status": "running"
            })
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{RAG_CHAT_UI_BACKEND_URL}/ingest/etl/submit",
                    headers=authenticated_headers,
                    json={
                        "source_type": "sharepoint",
                        "source_params": {
                            "integration_id": "int-sp-456"
                        }
                    }
                )

        assert response.status_code == 200


# =============================================================================
# API Client Unit Tests
# =============================================================================

class TestRagApiClientIntegrations:
    """Test RagApiClient integration methods"""

    @pytest.mark.asyncio
    async def test_api_client_create_integration(self, mock_rag_api_client):
        """Test RagApiClient.create_integration"""
        result = await mock_rag_api_client.create_integration({
            "name": "Test Integration",
            "type": "confluence",
            "config": {"base_url": "https://test.atlassian.net"}
        })

        assert "id" in result

    @pytest.mark.asyncio
    async def test_api_client_list_integrations(self, mock_rag_api_client):
        """Test RagApiClient.list_integrations"""
        result = await mock_rag_api_client.list_integrations()

        assert "integrations" in result

    @pytest.mark.asyncio
    async def test_api_client_delete_integration(self, mock_rag_api_client):
        """Test RagApiClient.delete_integration"""
        result = await mock_rag_api_client.delete_integration("int-123")

        assert result is not None


# =============================================================================
# Full Integration Flow Tests
# =============================================================================

class TestFullIntegrationFlow:
    """Test complete integration lifecycle"""

    @pytest.mark.asyncio
    async def test_create_use_delete_integration_flow(self, authenticated_headers):
        """Test: Create -> Use for ingestion -> Delete integration"""
        mock_responses = {
            "POST:/integrations": MockResponse({
                "id": "flow-int-123",
                "name": "Flow Test Integration",
                "type": "confluence"
            }, status_code=201),
            "POST:/ingest/etl/submit": MockResponse({
                "job_id": "flow-job",
                "status": "running"
            }),
            "DELETE:/integrations/flow-int-123": MockResponse({
                "status": "deleted"
            })
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                # Step 1: Create integration
                create_response = await client.post(
                    f"{RAG_CHAT_UI_BACKEND_URL}/integrations",
                    headers=authenticated_headers,
                    json={
                        "name": "Flow Test Integration",
                        "type": "confluence",
                        "config": {
                            "base_url": "https://test.atlassian.net",
                            "email": "test@example.com",
                            "api_token": "token"
                        }
                    }
                )
                assert create_response.status_code == 201
                integration_id = create_response.json()["id"]

                # Step 2: Use for ingestion
                ingest_response = await client.post(
                    f"{RAG_CHAT_UI_BACKEND_URL}/ingest/etl/submit",
                    headers=authenticated_headers,
                    json={
                        "source_type": "confluence",
                        "source_params": {"integration_id": integration_id}
                    }
                )
                assert ingest_response.status_code == 200
                assert "job_id" in ingest_response.json()

                # Step 3: Delete integration
                delete_response = await client.delete(
                    f"{RAG_CHAT_UI_BACKEND_URL}/integrations/{integration_id}",
                    headers=authenticated_headers
                )
                assert delete_response.status_code == 200
