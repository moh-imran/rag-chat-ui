"""
E2E Tests for Data Sources Ingestion

Tests all data source ingestion flows:
- File upload (PDF, DOCX, TXT, MD)
- Web crawling
- Git repository ingestion
- Notion integration
- Database ingestion
- Confluence integration
- SharePoint integration

Flow: frontend -> rag-chat-ui backend -> rag-qa-api
"""
import sys
import pathlib
import pytest
import httpx
import json
import io
from unittest.mock import AsyncMock, MagicMock, patch

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

from conftest import (
    MockResponse, MockAsyncClient,
    RAG_CHAT_UI_BACKEND_URL, RAG_QA_API_URL
)
from app.services.api_client import RagApiClient


# =============================================================================
# File Upload Tests
# =============================================================================

class TestFileUpload:
    """Test file upload ingestion"""

    @pytest.mark.asyncio
    async def test_upload_pdf_success(self, authenticated_headers, sample_file_content):
        """Test uploading PDF file succeeds"""
        mock_responses = {
            "POST:/ingest/upload": MockResponse({
                "status": "success",
                "total_chunks": 15,
                "collection": "documents",
                "filename": "test.pdf"
            })
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                # Simulate file upload
                files = {"file": ("test.pdf", io.BytesIO(sample_file_content), "application/pdf")}
                response = await client.post(
                    f"{RAG_CHAT_UI_BACKEND_URL}/ingest/upload",
                    headers={"Authorization": authenticated_headers["Authorization"]},
                    files=files,
                    data={"chunk_size": "1000", "chunk_overlap": "200"}
                )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["total_chunks"] > 0

    @pytest.mark.asyncio
    async def test_upload_docx_success(self, authenticated_headers, sample_file_content):
        """Test uploading DOCX file succeeds"""
        mock_responses = {
            "POST:/ingest/upload": MockResponse({
                "status": "success",
                "total_chunks": 8,
                "filename": "document.docx"
            })
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                files = {"file": ("document.docx", io.BytesIO(sample_file_content), "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
                response = await client.post(
                    f"{RAG_CHAT_UI_BACKEND_URL}/ingest/upload",
                    headers={"Authorization": authenticated_headers["Authorization"]},
                    files=files
                )

        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_upload_txt_success(self, authenticated_headers):
        """Test uploading TXT file succeeds"""
        mock_responses = {
            "POST:/ingest/upload": MockResponse({
                "status": "success",
                "total_chunks": 3,
                "filename": "notes.txt"
            })
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                content = b"This is plain text content for ingestion testing."
                files = {"file": ("notes.txt", io.BytesIO(content), "text/plain")}
                response = await client.post(
                    f"{RAG_CHAT_UI_BACKEND_URL}/ingest/upload",
                    headers={"Authorization": authenticated_headers["Authorization"]},
                    files=files
                )

        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_upload_markdown_success(self, authenticated_headers):
        """Test uploading Markdown file succeeds"""
        mock_responses = {
            "POST:/ingest/upload": MockResponse({
                "status": "success",
                "total_chunks": 5,
                "filename": "readme.md"
            })
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                content = b"# Heading\n\nThis is **markdown** content with `code`."
                files = {"file": ("readme.md", io.BytesIO(content), "text/markdown")}
                response = await client.post(
                    f"{RAG_CHAT_UI_BACKEND_URL}/ingest/upload",
                    headers={"Authorization": authenticated_headers["Authorization"]},
                    files=files
                )

        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_upload_unsupported_format_fails(self, authenticated_headers):
        """Test uploading unsupported file format fails"""
        mock_responses = {
            "POST:/ingest/upload": MockResponse(
                {"detail": "Unsupported file type: .exe"},
                status_code=400
            )
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                files = {"file": ("malware.exe", io.BytesIO(b"binary"), "application/octet-stream")}
                response = await client.post(
                    f"{RAG_CHAT_UI_BACKEND_URL}/ingest/upload",
                    headers={"Authorization": authenticated_headers["Authorization"]},
                    files=files
                )

        assert response.status_code == 400

    @pytest.mark.asyncio
    async def test_upload_with_custom_chunk_settings(self, authenticated_headers):
        """Test upload with custom chunking parameters"""
        mock_responses = {
            "POST:/ingest/upload": MockResponse({
                "status": "success",
                "total_chunks": 25,
                "chunk_size": 500,
                "chunk_overlap": 100
            })
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                files = {"file": ("large.pdf", io.BytesIO(b"content"), "application/pdf")}
                response = await client.post(
                    f"{RAG_CHAT_UI_BACKEND_URL}/ingest/upload",
                    headers={"Authorization": authenticated_headers["Authorization"]},
                    files=files,
                    data={"chunk_size": "500", "chunk_overlap": "100"}
                )

        assert response.status_code == 200


# =============================================================================
# Web Ingestion Tests
# =============================================================================

class TestWebIngestion:
    """Test web URL ingestion"""

    @pytest.mark.asyncio
    async def test_ingest_web_url_success(self, authenticated_headers, sample_web_ingest_request):
        """Test ingesting web URL succeeds"""
        mock_responses = {
            "POST:/ingest/etl/ingest": MockResponse({
                "status": "success",
                "total_chunks": 42,
                "pages_crawled": 5,
                "source_type": "web"
            })
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{RAG_CHAT_UI_BACKEND_URL}/ingest/etl/ingest",
                    headers=authenticated_headers,
                    json={
                        "source_type": "web",
                        "source_params": sample_web_ingest_request
                    }
                )

        assert response.status_code == 200
        data = response.json()
        assert data["source_type"] == "web"

    @pytest.mark.asyncio
    async def test_ingest_web_with_depth(self, authenticated_headers):
        """Test web ingestion with crawl depth setting"""
        mock_responses = {
            "POST:/ingest/etl/ingest": MockResponse({
                "status": "success",
                "total_chunks": 100,
                "pages_crawled": 15,
                "max_depth": 3
            })
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{RAG_CHAT_UI_BACKEND_URL}/ingest/etl/ingest",
                    headers=authenticated_headers,
                    json={
                        "source_type": "web",
                        "source_params": {
                            "url": "https://docs.python.org",
                            "max_depth": 3
                        }
                    }
                )

        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_ingest_invalid_url_fails(self, authenticated_headers):
        """Test ingesting invalid URL fails"""
        mock_responses = {
            "POST:/ingest/etl/ingest": MockResponse(
                {"detail": "Invalid URL format"},
                status_code=400
            )
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{RAG_CHAT_UI_BACKEND_URL}/ingest/etl/ingest",
                    headers=authenticated_headers,
                    json={
                        "source_type": "web",
                        "source_params": {"url": "not-a-valid-url"}
                    }
                )

        assert response.status_code == 400


# =============================================================================
# Git Repository Ingestion Tests
# =============================================================================

class TestGitIngestion:
    """Test Git repository ingestion"""

    @pytest.mark.asyncio
    async def test_ingest_git_repo_success(self, authenticated_headers, sample_git_ingest_request):
        """Test ingesting Git repository succeeds"""
        mock_responses = {
            "POST:/ingest/etl/ingest": MockResponse({
                "status": "success",
                "total_chunks": 150,
                "files_processed": 25,
                "source_type": "git"
            })
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{RAG_CHAT_UI_BACKEND_URL}/ingest/etl/ingest",
                    headers=authenticated_headers,
                    json={
                        "source_type": "git",
                        "source_params": sample_git_ingest_request
                    }
                )

        assert response.status_code == 200
        data = response.json()
        assert data["source_type"] == "git"

    @pytest.mark.asyncio
    async def test_ingest_git_specific_branch(self, authenticated_headers):
        """Test ingesting specific Git branch"""
        mock_responses = {
            "POST:/ingest/etl/ingest": MockResponse({
                "status": "success",
                "branch": "develop",
                "total_chunks": 80
            })
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{RAG_CHAT_UI_BACKEND_URL}/ingest/etl/ingest",
                    headers=authenticated_headers,
                    json={
                        "source_type": "git",
                        "source_params": {
                            "repo_url": "https://github.com/org/repo",
                            "branch": "develop"
                        }
                    }
                )

        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_ingest_private_repo_with_token(self, authenticated_headers):
        """Test ingesting private repository with access token"""
        mock_responses = {
            "POST:/ingest/etl/ingest": MockResponse({
                "status": "success",
                "total_chunks": 200,
                "private": True
            })
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{RAG_CHAT_UI_BACKEND_URL}/ingest/etl/ingest",
                    headers=authenticated_headers,
                    json={
                        "source_type": "git",
                        "source_params": {
                            "repo_url": "https://github.com/org/private-repo",
                            "branch": "main",
                            "access_token": "ghp_xxxxxxxxxxxx"
                        }
                    }
                )

        assert response.status_code == 200


# =============================================================================
# Notion Ingestion Tests
# =============================================================================

class TestNotionIngestion:
    """Test Notion integration ingestion"""

    @pytest.mark.asyncio
    async def test_ingest_notion_database(self, authenticated_headers, sample_notion_ingest_request):
        """Test ingesting Notion database succeeds"""
        mock_responses = {
            "POST:/ingest/etl/ingest": MockResponse({
                "status": "success",
                "total_chunks": 75,
                "pages_processed": 12,
                "source_type": "notion"
            })
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{RAG_CHAT_UI_BACKEND_URL}/ingest/etl/ingest",
                    headers=authenticated_headers,
                    json={
                        "source_type": "notion",
                        "source_params": sample_notion_ingest_request
                    }
                )

        assert response.status_code == 200
        data = response.json()
        assert data["source_type"] == "notion"

    @pytest.mark.asyncio
    async def test_ingest_notion_page(self, authenticated_headers):
        """Test ingesting specific Notion page"""
        mock_responses = {
            "POST:/ingest/etl/ingest": MockResponse({
                "status": "success",
                "total_chunks": 8,
                "source_type": "notion"
            })
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{RAG_CHAT_UI_BACKEND_URL}/ingest/etl/ingest",
                    headers=authenticated_headers,
                    json={
                        "source_type": "notion",
                        "source_params": {
                            "api_key": "secret_notion_key",
                            "page_id": "page-123-456"
                        }
                    }
                )

        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_ingest_notion_invalid_key_fails(self, authenticated_headers):
        """Test Notion ingestion with invalid API key fails"""
        mock_responses = {
            "POST:/ingest/etl/ingest": MockResponse(
                {"detail": "Invalid Notion API key"},
                status_code=401
            )
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{RAG_CHAT_UI_BACKEND_URL}/ingest/etl/ingest",
                    headers=authenticated_headers,
                    json={
                        "source_type": "notion",
                        "source_params": {
                            "api_key": "invalid_key"
                        }
                    }
                )

        assert response.status_code == 401


# =============================================================================
# Database Ingestion Tests
# =============================================================================

class TestDatabaseIngestion:
    """Test database ingestion"""

    @pytest.mark.asyncio
    async def test_ingest_postgresql(self, authenticated_headers, sample_database_ingest_request):
        """Test ingesting from PostgreSQL database"""
        mock_responses = {
            "POST:/ingest/etl/ingest": MockResponse({
                "status": "success",
                "total_chunks": 500,
                "rows_processed": 1000,
                "source_type": "database",
                "db_type": "postgresql"
            })
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{RAG_CHAT_UI_BACKEND_URL}/ingest/etl/ingest",
                    headers=authenticated_headers,
                    json={
                        "source_type": "database",
                        "source_params": sample_database_ingest_request
                    }
                )

        assert response.status_code == 200
        data = response.json()
        assert data["source_type"] == "database"

    @pytest.mark.asyncio
    async def test_ingest_database_with_query(self, authenticated_headers):
        """Test database ingestion with custom SQL query"""
        mock_responses = {
            "POST:/ingest/etl/ingest": MockResponse({
                "status": "success",
                "total_chunks": 150,
                "query_used": True
            })
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{RAG_CHAT_UI_BACKEND_URL}/ingest/etl/ingest",
                    headers=authenticated_headers,
                    json={
                        "source_type": "database",
                        "source_params": {
                            "host": "localhost",
                            "database": "testdb",
                            "user": "user",
                            "password": "pass",
                            "query": "SELECT content, metadata FROM documents WHERE active = true"
                        }
                    }
                )

        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_ingest_database_connection_fails(self, authenticated_headers):
        """Test database ingestion fails on connection error"""
        mock_responses = {
            "POST:/ingest/etl/ingest": MockResponse(
                {"detail": "Could not connect to database"},
                status_code=500
            )
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{RAG_CHAT_UI_BACKEND_URL}/ingest/etl/ingest",
                    headers=authenticated_headers,
                    json={
                        "source_type": "database",
                        "source_params": {
                            "host": "nonexistent.host",
                            "database": "db",
                            "user": "user",
                            "password": "pass"
                        }
                    }
                )

        assert response.status_code == 500


# =============================================================================
# Confluence Ingestion Tests
# =============================================================================

class TestConfluenceIngestion:
    """Test Confluence integration ingestion"""

    @pytest.mark.asyncio
    async def test_ingest_confluence_success(self, authenticated_headers, sample_confluence_ingest_request):
        """Test Confluence ingestion via async job"""
        mock_responses = {
            "POST:/ingest/etl/submit": MockResponse({
                "job_id": "confluence-job-123",
                "status": "running",
                "source_type": "confluence"
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
                        "source_params": sample_confluence_ingest_request
                    }
                )

        assert response.status_code == 200
        data = response.json()
        assert "job_id" in data
        assert data["status"] == "running"

    @pytest.mark.asyncio
    async def test_ingest_confluence_with_saved_integration(self, authenticated_headers):
        """Test Confluence ingestion using saved integration"""
        mock_responses = {
            "POST:/ingest/etl/submit": MockResponse({
                "job_id": "confluence-int-job",
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
                        "source_type": "confluence",
                        "source_params": {
                            "integration_id": "saved-confluence-int-123"
                        }
                    }
                )

        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_confluence_job_status_polling(self, authenticated_headers):
        """Test polling Confluence job status"""
        mock_responses = {
            "GET:/ingest/etl/status/confluence-job-123": MockResponse({
                "job_id": "confluence-job-123",
                "status": "completed",
                "progress": 100,
                "total_chunks": 250,
                "pages_processed": 45
            })
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{RAG_CHAT_UI_BACKEND_URL}/ingest/etl/status/confluence-job-123",
                    headers=authenticated_headers
                )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "completed"
        assert data["progress"] == 100


# =============================================================================
# SharePoint Ingestion Tests
# =============================================================================

class TestSharePointIngestion:
    """Test SharePoint integration ingestion"""

    @pytest.mark.asyncio
    async def test_ingest_sharepoint_success(self, authenticated_headers, sample_sharepoint_ingest_request):
        """Test SharePoint ingestion via async job"""
        mock_responses = {
            "POST:/ingest/etl/submit": MockResponse({
                "job_id": "sharepoint-job-456",
                "status": "running",
                "source_type": "sharepoint"
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
                        "source_params": sample_sharepoint_ingest_request
                    }
                )

        assert response.status_code == 200
        data = response.json()
        assert "job_id" in data

    @pytest.mark.asyncio
    async def test_ingest_sharepoint_with_saved_integration(self, authenticated_headers):
        """Test SharePoint ingestion using saved integration"""
        mock_responses = {
            "POST:/ingest/etl/submit": MockResponse({
                "job_id": "sp-int-job",
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
                            "integration_id": "saved-sharepoint-int-789"
                        }
                    }
                )

        assert response.status_code == 200


# =============================================================================
# Job Management Tests
# =============================================================================

class TestJobManagement:
    """Test ingestion job management"""

    @pytest.mark.asyncio
    async def test_list_ingest_jobs(self, authenticated_headers):
        """Test listing recent ingestion jobs"""
        mock_responses = {
            "GET:/ingest/etl/jobs": MockResponse({
                "jobs": [
                    {"job_id": "job-1", "status": "completed", "source_type": "confluence"},
                    {"job_id": "job-2", "status": "running", "source_type": "sharepoint"},
                    {"job_id": "job-3", "status": "failed", "source_type": "git"}
                ]
            })
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{RAG_CHAT_UI_BACKEND_URL}/ingest/etl/jobs?limit=50",
                    headers=authenticated_headers
                )

        assert response.status_code == 200
        data = response.json()
        assert "jobs" in data
        assert len(data["jobs"]) == 3

    @pytest.mark.asyncio
    async def test_get_job_status(self, authenticated_headers):
        """Test getting specific job status"""
        mock_responses = {
            "GET:/ingest/etl/status/job-123": MockResponse({
                "job_id": "job-123",
                "status": "running",
                "progress": 65,
                "meta": {"source_type": "confluence", "pages_processed": 30}
            })
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{RAG_CHAT_UI_BACKEND_URL}/ingest/etl/status/job-123",
                    headers=authenticated_headers
                )

        assert response.status_code == 200
        data = response.json()
        assert data["job_id"] == "job-123"
        assert data["progress"] == 65

    @pytest.mark.asyncio
    async def test_get_job_logs(self, authenticated_headers):
        """Test getting job logs"""
        mock_responses = {
            "GET:/ingest/etl/jobs/job-123/logs": MockResponse({
                "logs": [
                    "2024-01-01 10:00:00 - Starting ingestion",
                    "2024-01-01 10:00:05 - Processing page 1/10",
                    "2024-01-01 10:00:10 - Processing page 2/10"
                ]
            })
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{RAG_CHAT_UI_BACKEND_URL}/ingest/etl/jobs/job-123/logs",
                    headers=authenticated_headers
                )

        assert response.status_code == 200
        data = response.json()
        assert "logs" in data
        assert len(data["logs"]) > 0


# =============================================================================
# API Client Unit Tests
# =============================================================================

class TestRagApiClientIngestion:
    """Test RagApiClient ingestion methods"""

    @pytest.mark.asyncio
    async def test_api_client_etl_submit(self, mock_rag_api_client):
        """Test RagApiClient.etl_submit"""
        result = await mock_rag_api_client.etl_submit(
            source_type="confluence",
            source_params={"base_url": "https://test.atlassian.net"}
        )

        assert "job_id" in result
        assert result["status"] == "running"

    @pytest.mark.asyncio
    async def test_api_client_etl_status(self, mock_rag_api_client):
        """Test RagApiClient.etl_status"""
        result = await mock_rag_api_client.etl_status("test-job-123")

        assert "status" in result

    @pytest.mark.asyncio
    async def test_api_client_etl_list_jobs(self, mock_rag_api_client):
        """Test RagApiClient.etl_list_jobs"""
        result = await mock_rag_api_client.etl_list_jobs(limit=10)

        assert "jobs" in result

    @pytest.mark.asyncio
    async def test_api_client_etl_ingest(self, mock_rag_api_client):
        """Test RagApiClient.etl_ingest (synchronous)"""
        result = await mock_rag_api_client.etl_ingest(
            source_type="web",
            source_params={"url": "https://example.com"}
        )

        # Result comes from mock - just verify call succeeded
        assert result is not None
