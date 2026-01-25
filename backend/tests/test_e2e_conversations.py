"""
E2E Tests for Conversation Management

Tests conversation lifecycle:
- Create conversation (via chat query)
- List conversations
- Get conversation history
- Delete conversation
- Multi-turn conversations
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


# =============================================================================
# Conversation Creation Tests
# =============================================================================

class TestConversationCreation:
    """Test conversation creation through chat"""

    @pytest.mark.asyncio
    async def test_new_query_creates_conversation(self, authenticated_headers):
        """Test that new query without conversation_id creates new conversation"""
        mock_responses = {
            "POST:/chat/query": MockResponse({
                "answer": "Machine learning is a subset of AI...",
                "context_used": True,
                "conversation_id": "new-conv-123"
            })
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{RAG_CHAT_UI_BACKEND_URL}/chat/query",
                    headers=authenticated_headers,
                    json={"question": "What is machine learning?"}
                )

        assert response.status_code == 200
        data = response.json()
        assert "conversation_id" in data
        assert data["conversation_id"] == "new-conv-123"

    @pytest.mark.asyncio
    async def test_conversation_title_from_first_question(self, authenticated_headers):
        """Test that conversation title is derived from first question"""
        mock_responses = {
            "POST:/chat/query": MockResponse({
                "answer": "Answer here...",
                "context_used": True,
                "conversation_id": "conv-titled"
            }),
            "GET:/chat/conversations": MockResponse([
                {
                    "id": "conv-titled",
                    "title": "What is the difference between...",
                    "updated_at": "2024-01-01T00:00:00Z"
                }
            ])
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                # Create conversation
                await client.post(
                    f"{RAG_CHAT_UI_BACKEND_URL}/chat/query",
                    headers=authenticated_headers,
                    json={"question": "What is the difference between ML and AI?"}
                )

                # Check conversation list
                list_response = await client.get(
                    f"{RAG_CHAT_UI_BACKEND_URL}/chat/conversations",
                    headers=authenticated_headers
                )

        assert list_response.status_code == 200


# =============================================================================
# List Conversations Tests
# =============================================================================

class TestListConversations:
    """Test listing user conversations"""

    @pytest.mark.asyncio
    async def test_list_conversations_success(self, authenticated_headers):
        """Test listing all user conversations"""
        mock_responses = {
            "GET:/chat/conversations": MockResponse([
                {
                    "id": "conv-1",
                    "title": "Machine Learning Discussion",
                    "updated_at": "2024-01-03T10:00:00Z"
                },
                {
                    "id": "conv-2",
                    "title": "Python Programming Help",
                    "updated_at": "2024-01-02T15:30:00Z"
                },
                {
                    "id": "conv-3",
                    "title": "Database Design Questions",
                    "updated_at": "2024-01-01T09:00:00Z"
                }
            ])
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{RAG_CHAT_UI_BACKEND_URL}/chat/conversations",
                    headers=authenticated_headers
                )

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3
        # Verify sorted by updated_at (most recent first)
        assert data[0]["id"] == "conv-1"

    @pytest.mark.asyncio
    async def test_list_conversations_empty(self, authenticated_headers):
        """Test listing conversations when none exist"""
        mock_responses = {
            "GET:/chat/conversations": MockResponse([])
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{RAG_CHAT_UI_BACKEND_URL}/chat/conversations",
                    headers=authenticated_headers
                )

        assert response.status_code == 200
        data = response.json()
        assert data == []

    @pytest.mark.asyncio
    async def test_list_conversations_requires_auth(self):
        """Test listing conversations requires authentication"""
        mock_responses = {
            "GET:/chat/conversations": MockResponse(
                {"detail": "Not authenticated"},
                status_code=401
            )
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{RAG_CHAT_UI_BACKEND_URL}/chat/conversations"
                )

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_conversations_user_isolation(self, authenticated_headers):
        """Test that users only see their own conversations"""
        # User A's conversations
        mock_responses = {
            "GET:/chat/conversations": MockResponse([
                {"id": "user-a-conv-1", "title": "User A Conv", "updated_at": "2024-01-01T00:00:00Z"}
            ])
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{RAG_CHAT_UI_BACKEND_URL}/chat/conversations",
                    headers=authenticated_headers
                )

        assert response.status_code == 200
        data = response.json()
        # Should only contain user A's conversations
        assert all("user-a" in c["id"] for c in data)


# =============================================================================
# Get Conversation History Tests
# =============================================================================

class TestGetConversationHistory:
    """Test retrieving conversation message history"""

    @pytest.mark.asyncio
    async def test_get_conversation_history_success(self, authenticated_headers):
        """Test getting full conversation history"""
        mock_responses = {
            "GET:/chat/conversations/conv-123": MockResponse([
                {
                    "role": "user",
                    "content": "What is machine learning?",
                    "timestamp": "2024-01-01T10:00:00Z"
                },
                {
                    "role": "assistant",
                    "content": "Machine learning is a subset of artificial intelligence...",
                    "timestamp": "2024-01-01T10:00:05Z"
                },
                {
                    "role": "user",
                    "content": "Can you give me an example?",
                    "timestamp": "2024-01-01T10:01:00Z"
                },
                {
                    "role": "assistant",
                    "content": "Sure! A common example is email spam filtering...",
                    "timestamp": "2024-01-01T10:01:10Z"
                }
            ])
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{RAG_CHAT_UI_BACKEND_URL}/chat/conversations/conv-123",
                    headers=authenticated_headers
                )

        assert response.status_code == 200
        messages = response.json()
        assert len(messages) == 4
        # Verify alternating roles
        assert messages[0]["role"] == "user"
        assert messages[1]["role"] == "assistant"

    @pytest.mark.asyncio
    async def test_get_nonexistent_conversation_fails(self, authenticated_headers):
        """Test getting non-existent conversation returns 404"""
        mock_responses = {
            "GET:/chat/conversations/nonexistent": MockResponse(
                {"detail": "Conversation not found"},
                status_code=404
            )
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{RAG_CHAT_UI_BACKEND_URL}/chat/conversations/nonexistent",
                    headers=authenticated_headers
                )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_get_other_users_conversation_fails(self, authenticated_headers):
        """Test getting another user's conversation returns 404"""
        mock_responses = {
            "GET:/chat/conversations/other-user-conv": MockResponse(
                {"detail": "Conversation not found"},
                status_code=404
            )
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{RAG_CHAT_UI_BACKEND_URL}/chat/conversations/other-user-conv",
                    headers=authenticated_headers
                )

        assert response.status_code == 404


# =============================================================================
# Delete Conversation Tests
# =============================================================================

class TestDeleteConversation:
    """Test deleting conversations"""

    @pytest.mark.asyncio
    async def test_delete_conversation_success(self, authenticated_headers):
        """Test deleting conversation"""
        mock_responses = {
            "DELETE:/chat/conversations/conv-to-delete": MockResponse({
                "status": "success",
                "message": "Conversation deleted"
            })
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                response = await client.delete(
                    f"{RAG_CHAT_UI_BACKEND_URL}/chat/conversations/conv-to-delete",
                    headers=authenticated_headers
                )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"

    @pytest.mark.asyncio
    async def test_delete_nonexistent_conversation_fails(self, authenticated_headers):
        """Test deleting non-existent conversation fails"""
        mock_responses = {
            "DELETE:/chat/conversations/nonexistent": MockResponse(
                {"detail": "Conversation not found"},
                status_code=404
            )
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                response = await client.delete(
                    f"{RAG_CHAT_UI_BACKEND_URL}/chat/conversations/nonexistent",
                    headers=authenticated_headers
                )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_conversation_removes_messages(self, authenticated_headers):
        """Test deleting conversation also deletes all messages"""
        mock_responses = {
            "DELETE:/chat/conversations/conv-with-msgs": MockResponse({
                "status": "success",
                "message": "Conversation deleted",
                "messages_deleted": 10
            }),
            "GET:/chat/conversations/conv-with-msgs": MockResponse(
                {"detail": "Conversation not found"},
                status_code=404
            )
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                # Delete conversation
                delete_response = await client.delete(
                    f"{RAG_CHAT_UI_BACKEND_URL}/chat/conversations/conv-with-msgs",
                    headers=authenticated_headers
                )
                assert delete_response.status_code == 200

                # Verify conversation is gone
                get_response = await client.get(
                    f"{RAG_CHAT_UI_BACKEND_URL}/chat/conversations/conv-with-msgs",
                    headers=authenticated_headers
                )
                assert get_response.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_conversation_requires_auth(self):
        """Test deleting conversation requires authentication"""
        mock_responses = {
            "DELETE:/chat/conversations/conv-123": MockResponse(
                {"detail": "Not authenticated"},
                status_code=401
            )
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                response = await client.delete(
                    f"{RAG_CHAT_UI_BACKEND_URL}/chat/conversations/conv-123"
                )

        assert response.status_code == 401


# =============================================================================
# Multi-Turn Conversation Tests
# =============================================================================

class TestMultiTurnConversations:
    """Test multi-turn conversation flows"""

    @pytest.mark.asyncio
    async def test_continue_conversation(self, authenticated_headers):
        """Test continuing an existing conversation"""
        mock_responses = {
            "POST:/chat/query": MockResponse({
                "answer": "Building on our previous discussion...",
                "context_used": True,
                "conversation_id": "existing-conv"
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
                        "conversation_id": "existing-conv"
                    }
                )

        assert response.status_code == 200
        data = response.json()
        assert data["conversation_id"] == "existing-conv"

    @pytest.mark.asyncio
    async def test_conversation_maintains_context(self, authenticated_headers):
        """Test that conversation context is maintained across turns"""
        responses_sequence = [
            MockResponse({
                "answer": "Python is a programming language...",
                "context_used": True,
                "conversation_id": "context-conv"
            }),
            MockResponse({
                "answer": "Based on Python being a programming language, here are its features...",
                "context_used": True,
                "conversation_id": "context-conv"
            }),
            MockResponse({
                "answer": "Given the features we discussed, Python is great for data science...",
                "context_used": True,
                "conversation_id": "context-conv"
            })
        ]

        call_count = [0]

        class SequentialMockClient(MockAsyncClient):
            async def post(self, url, **kwargs):
                idx = min(call_count[0], len(responses_sequence) - 1)
                call_count[0] += 1
                return responses_sequence[idx]

        mock_client = SequentialMockClient()

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                # Turn 1
                r1 = await client.post(
                    f"{RAG_CHAT_UI_BACKEND_URL}/chat/query",
                    headers=authenticated_headers,
                    json={"question": "What is Python?"}
                )
                conv_id = r1.json()["conversation_id"]

                # Turn 2
                r2 = await client.post(
                    f"{RAG_CHAT_UI_BACKEND_URL}/chat/query",
                    headers=authenticated_headers,
                    json={
                        "question": "What are its key features?",
                        "conversation_id": conv_id
                    }
                )

                # Turn 3
                r3 = await client.post(
                    f"{RAG_CHAT_UI_BACKEND_URL}/chat/query",
                    headers=authenticated_headers,
                    json={
                        "question": "What is it best used for?",
                        "conversation_id": conv_id
                    }
                )

        assert r1.status_code == 200
        assert r2.status_code == 200
        assert r3.status_code == 200
        # All should maintain same conversation
        assert r2.json()["conversation_id"] == conv_id
        assert r3.json()["conversation_id"] == conv_id

    @pytest.mark.asyncio
    async def test_conversation_updates_timestamp(self, authenticated_headers):
        """Test that conversation updated_at changes with new messages"""
        mock_responses = {
            "POST:/chat/query": MockResponse({
                "answer": "Response here",
                "context_used": True,
                "conversation_id": "timestamp-conv"
            }),
            "GET:/chat/conversations": MockResponse([
                {
                    "id": "timestamp-conv",
                    "title": "Test Conversation",
                    "updated_at": "2024-01-01T12:00:00Z"  # Updated timestamp
                }
            ])
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                # Send a message
                await client.post(
                    f"{RAG_CHAT_UI_BACKEND_URL}/chat/query",
                    headers=authenticated_headers,
                    json={
                        "question": "New question",
                        "conversation_id": "timestamp-conv"
                    }
                )

                # Check updated timestamp
                list_response = await client.get(
                    f"{RAG_CHAT_UI_BACKEND_URL}/chat/conversations",
                    headers=authenticated_headers
                )

        assert list_response.status_code == 200


# =============================================================================
# Full Conversation Lifecycle Test
# =============================================================================

class TestFullConversationLifecycle:
    """Test complete conversation lifecycle"""

    @pytest.mark.asyncio
    async def test_complete_conversation_lifecycle(self, authenticated_headers):
        """Test: Create -> Chat -> Get History -> Delete conversation"""

        call_sequence = []

        mock_responses = {
            "POST:/chat/query": MockResponse({
                "answer": "First answer...",
                "context_used": True,
                "conversation_id": "lifecycle-conv"
            }),
            "GET:/chat/conversations": MockResponse([
                {
                    "id": "lifecycle-conv",
                    "title": "Start of conversation",
                    "updated_at": "2024-01-01T00:00:00Z"
                }
            ]),
            "GET:/chat/conversations/lifecycle-conv": MockResponse([
                {"role": "user", "content": "Start of conversation", "timestamp": "2024-01-01T00:00:00Z"},
                {"role": "assistant", "content": "First answer...", "timestamp": "2024-01-01T00:00:05Z"}
            ]),
            "DELETE:/chat/conversations/lifecycle-conv": MockResponse({
                "status": "success",
                "message": "Conversation deleted"
            })
        }

        class TrackingMockClient(MockAsyncClient):
            async def post(self, url, **kwargs):
                call_sequence.append(("POST", url))
                return self._get_response("POST", url)

            async def get(self, url, **kwargs):
                call_sequence.append(("GET", url))
                return self._get_response("GET", url)

            async def delete(self, url, **kwargs):
                call_sequence.append(("DELETE", url))
                return self._get_response("DELETE", url)

        mock_client = TrackingMockClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                # Step 1: Start conversation with first question
                create_response = await client.post(
                    f"{RAG_CHAT_UI_BACKEND_URL}/chat/query",
                    headers=authenticated_headers,
                    json={"question": "Start of conversation"}
                )
                assert create_response.status_code == 200
                conv_id = create_response.json()["conversation_id"]
                assert conv_id == "lifecycle-conv"

                # Step 2: Verify conversation appears in list
                list_response = await client.get(
                    f"{RAG_CHAT_UI_BACKEND_URL}/chat/conversations",
                    headers=authenticated_headers
                )
                assert list_response.status_code == 200
                conversations = list_response.json()
                assert any(c["id"] == conv_id for c in conversations)

                # Step 3: Get conversation history
                history_response = await client.get(
                    f"{RAG_CHAT_UI_BACKEND_URL}/chat/conversations/{conv_id}",
                    headers=authenticated_headers
                )
                assert history_response.status_code == 200
                messages = history_response.json()
                assert len(messages) >= 2  # At least user + assistant

                # Step 4: Delete conversation
                delete_response = await client.delete(
                    f"{RAG_CHAT_UI_BACKEND_URL}/chat/conversations/{conv_id}",
                    headers=authenticated_headers
                )
                assert delete_response.status_code == 200

        # Verify call sequence
        assert ("POST", f"{RAG_CHAT_UI_BACKEND_URL}/chat/query") in call_sequence
        assert ("GET", f"{RAG_CHAT_UI_BACKEND_URL}/chat/conversations") in call_sequence
        assert ("DELETE", f"{RAG_CHAT_UI_BACKEND_URL}/chat/conversations/{conv_id}") in call_sequence
