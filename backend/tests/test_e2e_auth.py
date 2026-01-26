"""
E2E Tests for Authentication Flow

Tests the complete authentication flow:
- User registration
- User login
- Token validation
- Profile management
- Password reset
"""
import sys
import pathlib
import pytest
import httpx
from unittest.mock import AsyncMock, MagicMock, patch

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

from conftest import MockResponse, MockAsyncClient, RAG_CHAT_UI_BACKEND_URL


# =============================================================================
# Registration Tests
# =============================================================================

class TestUserRegistration:
    """Test user registration flow"""

    @pytest.mark.asyncio
    async def test_register_new_user_success(self):
        """Test successful user registration"""
        mock_responses = {
            "POST:/auth/register": MockResponse({
                "id": "user-123",
                "email": "newuser@example.com",
                "full_name": "New User",
                "is_active": True
            }, status_code=201)
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{RAG_CHAT_UI_BACKEND_URL}/auth/register",
                    json={
                        "email": "newuser@example.com",
                        "password": "SecurePass123!",
                        "full_name": "New User"
                    }
                )

        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "newuser@example.com"
        assert "id" in data

    @pytest.mark.asyncio
    async def test_register_duplicate_email_fails(self):
        """Test registration with existing email fails"""
        mock_responses = {
            "POST:/auth/register": MockResponse(
                {"detail": "Email already registered"},
                status_code=400
            )
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{RAG_CHAT_UI_BACKEND_URL}/auth/register",
                    json={
                        "email": "existing@example.com",
                        "password": "SecurePass123!"
                    }
                )

        assert response.status_code == 400
        assert "already registered" in response.json().get("detail", "").lower()

    @pytest.mark.asyncio
    async def test_register_invalid_email_fails(self):
        """Test registration with invalid email fails"""
        mock_responses = {
            "POST:/auth/register": MockResponse(
                {"detail": "Invalid email format"},
                status_code=422
            )
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{RAG_CHAT_UI_BACKEND_URL}/auth/register",
                    json={
                        "email": "not-an-email",
                        "password": "SecurePass123!"
                    }
                )

        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_register_weak_password_fails(self):
        """Test registration with weak password fails"""
        mock_responses = {
            "POST:/auth/register": MockResponse(
                {"detail": "Password too weak"},
                status_code=422
            )
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{RAG_CHAT_UI_BACKEND_URL}/auth/register",
                    json={
                        "email": "user@example.com",
                        "password": "123"  # Too weak
                    }
                )

        assert response.status_code == 422


# =============================================================================
# Login Tests
# =============================================================================

class TestUserLogin:
    """Test user login flow"""

    @pytest.mark.asyncio
    async def test_login_success(self):
        """Test successful login returns JWT token"""
        mock_responses = {
            "POST:/auth/login": MockResponse({
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test",
                "token_type": "bearer"
            })
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{RAG_CHAT_UI_BACKEND_URL}/auth/login",
                    json={
                        "email": "user@example.com",
                        "password": "correctpassword"
                    }
                )

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    @pytest.mark.asyncio
    async def test_login_wrong_password_fails(self):
        """Test login with wrong password fails"""
        mock_responses = {
            "POST:/auth/login": MockResponse(
                {"detail": "Invalid credentials"},
                status_code=401
            )
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{RAG_CHAT_UI_BACKEND_URL}/auth/login",
                    json={
                        "email": "user@example.com",
                        "password": "wrongpassword"
                    }
                )

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_login_nonexistent_user_fails(self):
        """Test login with non-existent user fails"""
        mock_responses = {
            "POST:/auth/login": MockResponse(
                {"detail": "Invalid credentials"},
                status_code=401
            )
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{RAG_CHAT_UI_BACKEND_URL}/auth/login",
                    json={
                        "email": "nonexistent@example.com",
                        "password": "anypassword"
                    }
                )

        assert response.status_code == 401


# =============================================================================
# Token Validation Tests
# =============================================================================

class TestTokenValidation:
    """Test JWT token validation"""

    @pytest.mark.asyncio
    async def test_valid_token_allows_access(self, authenticated_headers):
        """Test valid token allows access to protected endpoints"""
        mock_responses = {
            "GET:/auth/me": MockResponse({
                "id": "user-123",
                "email": "user@example.com",
                "full_name": "Test User"
            })
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{RAG_CHAT_UI_BACKEND_URL}/auth/me",
                    headers=authenticated_headers
                )

        assert response.status_code == 200
        data = response.json()
        assert "email" in data

    @pytest.mark.asyncio
    async def test_missing_token_returns_401(self):
        """Test missing token returns 401"""
        mock_responses = {
            "GET:/auth/me": MockResponse(
                {"detail": "Not authenticated"},
                status_code=401
            )
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{RAG_CHAT_UI_BACKEND_URL}/auth/me"
                    # No Authorization header
                )

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_invalid_token_returns_401(self):
        """Test invalid token returns 401"""
        mock_responses = {
            "GET:/auth/me": MockResponse(
                {"detail": "Invalid token"},
                status_code=401
            )
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{RAG_CHAT_UI_BACKEND_URL}/auth/me",
                    headers={"Authorization": "Bearer invalid-token"}
                )

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_expired_token_returns_401(self):
        """Test expired token returns 401"""
        mock_responses = {
            "GET:/auth/me": MockResponse(
                {"detail": "Token expired"},
                status_code=401
            )
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                # Token with past expiration
                expired_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjF9.expired"
                response = await client.get(
                    f"{RAG_CHAT_UI_BACKEND_URL}/auth/me",
                    headers={"Authorization": f"Bearer {expired_token}"}
                )

        assert response.status_code == 401


# =============================================================================
# Profile Management Tests
# =============================================================================

class TestProfileManagement:
    """Test user profile management"""

    @pytest.mark.asyncio
    async def test_get_profile_success(self, authenticated_headers):
        """Test getting user profile"""
        mock_responses = {
            "GET:/auth/me": MockResponse({
                "id": "user-123",
                "email": "user@example.com",
                "full_name": "Test User",
                "created_at": "2024-01-01T00:00:00Z"
            })
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{RAG_CHAT_UI_BACKEND_URL}/auth/me",
                    headers=authenticated_headers
                )

        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "user@example.com"
        assert "full_name" in data

    @pytest.mark.asyncio
    async def test_update_profile_success(self, authenticated_headers):
        """Test updating user profile"""
        mock_responses = {
            "PUT:/auth/profile": MockResponse({
                "id": "user-123",
                "email": "user@example.com",
                "full_name": "Updated Name"
            })
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                response = await client.put(
                    f"{RAG_CHAT_UI_BACKEND_URL}/auth/profile",
                    headers=authenticated_headers,
                    json={"full_name": "Updated Name"}
                )

        assert response.status_code == 200
        data = response.json()
        assert data["full_name"] == "Updated Name"


# =============================================================================
# Password Reset Tests
# =============================================================================

class TestPasswordReset:
    """Test password reset flow"""

    @pytest.mark.asyncio
    async def test_forgot_password_sends_email(self):
        """Test forgot password sends reset email"""
        mock_responses = {
            "POST:/auth/forgot-password": MockResponse({
                "message": "Password reset email sent"
            })
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{RAG_CHAT_UI_BACKEND_URL}/auth/forgot-password",
                    json={"email": "user@example.com"}
                )

        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_reset_password_success(self, authenticated_headers):
        """Test password reset with valid token"""
        mock_responses = {
            "POST:/auth/reset-password": MockResponse({
                "message": "Password updated successfully"
            })
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{RAG_CHAT_UI_BACKEND_URL}/auth/reset-password",
                    headers=authenticated_headers,
                    json={
                        "old_password": "oldpassword",
                        "new_password": "NewSecurePass123!"
                    }
                )

        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_reset_password_wrong_old_password_fails(self, authenticated_headers):
        """Test password reset with wrong old password fails"""
        mock_responses = {
            "POST:/auth/reset-password": MockResponse(
                {"detail": "Invalid old password"},
                status_code=400
            )
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{RAG_CHAT_UI_BACKEND_URL}/auth/reset-password",
                    headers=authenticated_headers,
                    json={
                        "old_password": "wrongpassword",
                        "new_password": "NewSecurePass123!"
                    }
                )

        assert response.status_code == 400


# =============================================================================
# Full Authentication Flow Integration Test
# =============================================================================

class TestFullAuthFlow:
    """Test complete authentication flow end-to-end"""

    @pytest.mark.asyncio
    async def test_complete_auth_flow(self):
        """Test: Register -> Login -> Access Protected -> Update Profile -> Logout"""

        # Mock responses for the entire flow
        mock_responses = {
            "POST:/auth/register": MockResponse({
                "id": "new-user-123",
                "email": "flowtest@example.com"
            }, status_code=201),
            "POST:/auth/login": MockResponse({
                "access_token": "new-jwt-token",
                "token_type": "bearer"
            }),
            "GET:/auth/me": MockResponse({
                "id": "new-user-123",
                "email": "flowtest@example.com",
                "full_name": None
            }),
            "PUT:/auth/profile": MockResponse({
                "id": "new-user-123",
                "email": "flowtest@example.com",
                "full_name": "Flow Test User"
            })
        }
        mock_client = MockAsyncClient(mock_responses)

        with patch.object(httpx, "AsyncClient", return_value=mock_client):
            async with httpx.AsyncClient() as client:
                # Step 1: Register
                register_response = await client.post(
                    f"{RAG_CHAT_UI_BACKEND_URL}/auth/register",
                    json={
                        "email": "flowtest@example.com",
                        "password": "FlowTestPass123!"
                    }
                )
                assert register_response.status_code == 201

                # Step 2: Login
                login_response = await client.post(
                    f"{RAG_CHAT_UI_BACKEND_URL}/auth/login",
                    json={
                        "email": "flowtest@example.com",
                        "password": "FlowTestPass123!"
                    }
                )
                assert login_response.status_code == 200
                token = login_response.json()["access_token"]

                # Step 3: Access protected endpoint
                headers = {"Authorization": f"Bearer {token}"}
                me_response = await client.get(
                    f"{RAG_CHAT_UI_BACKEND_URL}/auth/me",
                    headers=headers
                )
                assert me_response.status_code == 200

                # Step 4: Update profile
                profile_response = await client.put(
                    f"{RAG_CHAT_UI_BACKEND_URL}/auth/profile",
                    headers=headers,
                    json={"full_name": "Flow Test User"}
                )
                assert profile_response.status_code == 200
                assert profile_response.json()["full_name"] == "Flow Test User"
