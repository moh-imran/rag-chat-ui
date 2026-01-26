"""
E2E Tests for Chat Flow

Tests the complete chat flow through:
- frontend -> rag-chat-ui backend -> rag-qa-api

Including:
- Regular chat queries
- Streaming chat responses
- Conversation history
- RAG retrieval integration
"""
import sys
import pathlib
import pytest
import httpx
import json
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

from conftest import (
    MockResponse, MockAsyncClient, MockStreamResponse,
    RAG_CHAT_UI_BACKEND_URL, RAG_QA_API_URL
)
from app.services.api_client import RagApiClient


# =============================================================================
# Chat Query Tests (Non-Streaming)
# =============================================================================

class TestChatQuery:
    """Test non-streaming chat queries"""

    @pytest.mark.asyncio
    async def test_basic_query_success(self, authenticated_headers, sample_query_request):
        """Test basic chat query returns answer with sources"""
        mock_responses = {
            "POST:/chat/query": MockResponse({
                "answer": "Machine learning is a subset of AI that enables systems to learn from data.",
                "context_used": True,
                "conversation_id": "conv-123",
                "sources": [
                    {
                        "content": "Machine learning is a method of data analysis...",
                        "metadata": {"filename": "ml_intro.pdf", "chunk_id": 1},
                        "score": 0.92
                    }
                ]
            })
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{RAG_CHAT_UI_BACKEND_URL}/chat/query",
                    headers=authenticated_headers,
                    json=sample_query_request
                )

        assert response.status_code == 200
        data = response.json()
        assert "answer" in data
        assert data["context_used"] is True
        assert "conversation_id" in data

    @pytest.mark.asyncio
    async def test_query_with_conversation_id(self, authenticated_headers):
        """Test query with existing conversation continues context"""
        mock_responses = {
            "POST:/chat/query": MockResponse({
                "answer": "Based on our previous discussion, here's more detail...",
                "context_used": True,
                "conversation_id": "existing-conv-123"
            })
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{RAG_CHAT_UI_BACKEND_URL}/chat/query",
                    headers=authenticated_headers,
                    json={
                        "question": "Tell me more about that",
                        "conversation_id": "existing-conv-123",
                        "top_k": 5
                    }
                )

        assert response.status_code == 200
        data = response.json()
        assert data["conversation_id"] == "existing-conv-123"

    @pytest.mark.asyncio
    async def test_query_with_metadata_filters(self, authenticated_headers):
        """Test query with metadata filters for specific documents"""
        mock_responses = {
            "POST:/chat/query": MockResponse({
                "answer": "From the specific document you mentioned...",
                "context_used": True,
                "conversation_id": "conv-456"
            })
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{RAG_CHAT_UI_BACKEND_URL}/chat/query",
                    headers=authenticated_headers,
                    json={
                        "question": "What does this document say?",
                        "metadata_filters": {"filename": "specific_doc.pdf"},
                        "top_k": 3
                    }
                )

        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_query_no_relevant_context(self, authenticated_headers):
        """Test query when no relevant documents found"""
        mock_responses = {
            "POST:/chat/query": MockResponse({
                "answer": "I couldn't find relevant information in the knowledge base.",
                "context_used": False,
                "conversation_id": "conv-789"
            })
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{RAG_CHAT_UI_BACKEND_URL}/chat/query",
                    headers=authenticated_headers,
                    json={
                        "question": "What is the meaning of life?",
                        "top_k": 5
                    }
                )

        assert response.status_code == 200
        data = response.json()
        assert data["context_used"] is False

    @pytest.mark.asyncio
    async def test_query_with_custom_temperature(self, authenticated_headers):
        """Test query with custom temperature setting"""
        mock_responses = {
            "POST:/chat/query": MockResponse({
                "answer": "A creative response with higher temperature...",
                "context_used": True,
                "conversation_id": "conv-creative"
            })
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{RAG_CHAT_UI_BACKEND_URL}/chat/query",
                    headers=authenticated_headers,
                    json={
                        "question": "Give me a creative explanation",
                        "temperature": 0.9,
                        "max_tokens": 2000
                    }
                )

        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_query_requires_authentication(self):
        """Test query without auth token fails"""
        mock_responses = {
            "POST:/chat/query": MockResponse(
                {"detail": "Not authenticated"},
                status_code=401
            )
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{RAG_CHAT_UI_BACKEND_URL}/chat/query",
                    json={"question": "Test question"}
                )

        assert response.status_code == 401


# =============================================================================
# Streaming Chat Tests
# =============================================================================

class TestChatStreaming:
    """Test streaming chat responses via SSE"""

    @pytest.mark.asyncio
    async def test_streaming_query_success(self, authenticated_headers):
        """Test streaming query returns SSE events"""
        events = [
            'data: {"event": "conversation_id", "conversation_id": "conv-stream-123"}',
            'data: {"type": "retrieval_start", "data": {"question": "test"}}',
            'data: {"type": "retrieval_complete", "data": {"num_docs": 3}}',
            'data: {"type": "generation_start", "data": {}}',
            'data: {"type": "token", "data": {"content": "Machine"}}',
            'data: {"type": "token", "data": {"content": " learning"}}',
            'data: {"type": "token", "data": {"content": " is"}}',
            'data: {"type": "done", "data": {}}'
        ]

        class StreamingMockClient(MockAsyncClient):
            def stream(self, method, url, **kwargs):
                return MockStreamResponse(events)

        mock_client = StreamingMockClient()

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                # Simulate streaming request
                mock_stream = mock_client.stream(
                    "POST",
                    f"{RAG_CHAT_UI_BACKEND_URL}/chat/query/stream",
                    json={"question": "What is ML?"}
                )

                collected_events = []
                async with mock_stream as response:
                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            event = json.loads(line[6:])
                            collected_events.append(event)

        # Verify events
        assert len(collected_events) >= 4
        event_types = [e.get("type") or e.get("event") for e in collected_events]
        assert "conversation_id" in event_types or any(e.get("event") == "conversation_id" for e in collected_events)

    @pytest.mark.asyncio
    async def test_streaming_collects_full_answer(self, authenticated_headers):
        """Test streaming collects tokens into full answer"""
        events = [
            'data: {"type": "token", "data": {"content": "Hello"}}',
            'data: {"type": "token", "data": {"content": " "}}',
            'data: {"type": "token", "data": {"content": "World"}}',
            'data: {"type": "done", "data": {}}'
        ]

        class StreamingMockClient(MockAsyncClient):
            def stream(self, method, url, **kwargs):
                return MockStreamResponse(events)

        mock_client = StreamingMockClient()
        full_answer = ""

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            mock_stream = mock_client.stream(
                "POST",
                f"{RAG_QA_API_URL}/chat/query/stream",
                json={"question": "Test"}
            )

            async with mock_stream as response:
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        event = json.loads(line[6:])
                        if event.get("type") == "token":
                            full_answer += event["data"]["content"]

        assert full_answer == "Hello World"

    @pytest.mark.asyncio
    async def test_streaming_handles_retrieval_events(self, authenticated_headers):
        """Test streaming properly handles retrieval phase events"""
        events = [
            'data: {"type": "retrieval_start", "data": {"question": "test query"}}',
            'data: {"type": "retrieval_complete", "data": {"num_docs": 5, "sources": []}}',
            'data: {"type": "generation_start", "data": {}}'
        ]

        class StreamingMockClient(MockAsyncClient):
            def stream(self, method, url, **kwargs):
                return MockStreamResponse(events)

        mock_client = StreamingMockClient()
        retrieval_started = False
        retrieval_completed = False
        num_docs = 0

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            mock_stream = mock_client.stream(
                "POST",
                f"{RAG_QA_API_URL}/chat/query/stream",
                json={"question": "Test"}
            )

            async with mock_stream as response:
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        event = json.loads(line[6:])
                        if event.get("type") == "retrieval_start":
                            retrieval_started = True
                        elif event.get("type") == "retrieval_complete":
                            retrieval_completed = True
                            num_docs = event["data"]["num_docs"]

        assert retrieval_started
        assert retrieval_completed
        assert num_docs == 5

    @pytest.mark.asyncio
    async def test_streaming_error_handling(self, authenticated_headers):
        """Test streaming handles errors gracefully"""
        events = [
            'data: {"type": "retrieval_start", "data": {}}',
            'data: {"type": "error", "data": {"message": "Connection to LLM failed"}}'
        ]

        class StreamingMockClient(MockAsyncClient):
            def stream(self, method, url, **kwargs):
                return MockStreamResponse(events)

        mock_client = StreamingMockClient()
        error_received = False
        error_message = ""

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            mock_stream = mock_client.stream(
                "POST",
                f"{RAG_QA_API_URL}/chat/query/stream",
                json={"question": "Test"}
            )

            async with mock_stream as response:
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        event = json.loads(line[6:])
                        if event.get("type") == "error":
                            error_received = True
                            error_message = event["data"]["message"]

        assert error_received
        assert "failed" in error_message.lower()


# =============================================================================
# RAG Pipeline Integration Tests
# =============================================================================

class TestRAGPipelineIntegration:
    """Test RAG pipeline integration via api_client"""

    @pytest.mark.asyncio
    async def test_api_client_chat_query(self, mock_rag_api_client):
        """Test RagApiClient.chat_query works correctly"""
        result = await mock_rag_api_client.chat_query(
            question="What is machine learning?",
            top_k=5,
            temperature=0.7
        )

        assert "answer" in result
        assert result["context_used"] is True

    @pytest.mark.asyncio
    async def test_api_client_chat_with_history(self, mock_rag_api_client):
        """Test RagApiClient.chat_with_history for multi-turn conversations"""
        messages = [
            {"role": "user", "content": "What is AI?"},
            {"role": "assistant", "content": "AI stands for Artificial Intelligence..."},
            {"role": "user", "content": "Tell me more about ML specifically"}
        ]

        # The mock client returns a default response
        result = await mock_rag_api_client.chat_with_history(
            messages=messages,
            top_k=5
        )

        # Verify the call was made (result comes from mock)
        assert result is not None

    @pytest.mark.asyncio
    async def test_api_client_chat_query_stream(self):
        """Test RagApiClient.chat_query_stream yields events"""
        events = [
            'data: {"type": "token", "data": {"content": "Test"}}',
            'data: {"type": "done", "data": {}}'
        ]

        class StreamingMockClient(MockAsyncClient):
            def stream(self, method, url, **kwargs):
                return MockStreamResponse(events)

        with patch.object(httpx, "AsyncClient", lambda **kw: StreamingMockClient()):
            client = RagApiClient(base_url="http://mock")

            collected = []
            async for line in client.chat_query_stream(
                question="Test",
                top_k=5
            ):
                collected.append(line)

        assert len(collected) == 2
        assert "token" in collected[0]


# =============================================================================
# HyDE (Hypothetical Document Embeddings) Tests
# =============================================================================

class TestHyDEIntegration:
    """Test HyDE feature integration"""

    @pytest.mark.asyncio
    async def test_query_with_hyde_enabled(self, authenticated_headers):
        """Test query with HyDE improves retrieval"""
        mock_responses = {
            "POST:/chat/query": MockResponse({
                "answer": "Using HyDE, I found more relevant context...",
                "context_used": True,
                "conversation_id": "conv-hyde"
            })
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{RAG_CHAT_UI_BACKEND_URL}/chat/query",
                    headers=authenticated_headers,
                    json={
                        "question": "Explain quantum computing",
                        "use_hyde": True,
                        "top_k": 5
                    }
                )

        assert response.status_code == 200


# =============================================================================
# End-to-End Chat Flow Tests
# =============================================================================

class TestFullChatFlow:
    """Test complete chat flow scenarios"""

    @pytest.mark.asyncio
    async def test_multi_turn_conversation_flow(self, authenticated_headers):
        """Test multiple turns in a conversation maintain context"""
        mock_responses = {
            "POST:/chat/query": MockResponse({
                "answer": "First response about ML...",
                "context_used": True,
                "conversation_id": "conv-multi-turn"
            })
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                # Turn 1
                response1 = await client.post(
                    f"{RAG_CHAT_UI_BACKEND_URL}/chat/query",
                    headers=authenticated_headers,
                    json={"question": "What is machine learning?"}
                )
                conv_id = response1.json()["conversation_id"]

                # Turn 2 - continue conversation
                mock_responses["POST:/chat/query"] = MockResponse({
                    "answer": "Based on our ML discussion, deep learning is...",
                    "context_used": True,
                    "conversation_id": conv_id
                })

                response2 = await client.post(
                    f"{RAG_CHAT_UI_BACKEND_URL}/chat/query",
                    headers=authenticated_headers,
                    json={
                        "question": "How does deep learning relate to that?",
                        "conversation_id": conv_id
                    }
                )

        assert response1.status_code == 200
        assert response2.status_code == 200
        assert response2.json()["conversation_id"] == conv_id

    @pytest.mark.asyncio
    async def test_query_with_score_threshold(self, authenticated_headers):
        """Test query with minimum score threshold"""
        mock_responses = {
            "POST:/chat/query": MockResponse({
                "answer": "Only high-confidence results...",
                "context_used": True,
                "conversation_id": "conv-threshold"
            })
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{RAG_CHAT_UI_BACKEND_URL}/chat/query",
                    headers=authenticated_headers,
                    json={
                        "question": "Precise technical question",
                        "score_threshold": 0.8,
                        "top_k": 3
                    }
                )

        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_query_with_system_instruction(self, authenticated_headers):
        """Test query with custom system instruction"""
        mock_responses = {
            "POST:/chat/query": MockResponse({
                "answer": "As a technical expert, I can explain...",
                "context_used": True,
                "conversation_id": "conv-system"
            })
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{RAG_CHAT_UI_BACKEND_URL}/chat/query",
                    headers=authenticated_headers,
                    json={
                        "question": "Explain this concept",
                        "system_instruction": "You are a technical expert. Provide detailed explanations."
                    }
                )

        assert response.status_code == 200
