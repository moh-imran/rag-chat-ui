# E2E Test Suite for RAG Chat UI

This test suite provides comprehensive end-to-end testing for the complete RAG Chat UI stack:

```
Frontend (React) → Backend (FastAPI) → RAG-QA-API (FastAPI)
```

## Test Structure

```
tests/
├── conftest.py              # Shared fixtures and mock utilities
├── test_e2e_auth.py         # Authentication flow tests
├── test_e2e_chat.py         # Chat query and streaming tests
├── test_e2e_ingestion.py    # Data source ingestion tests
├── test_e2e_integrations.py # Integration CRUD tests
├── test_e2e_conversations.py # Conversation management tests
├── test_api_client.py       # API client unit tests
└── requirements-test.txt    # Test dependencies
```

## Test Coverage

### Authentication (`test_e2e_auth.py`)
- User registration (success, duplicate email, invalid email, weak password)
- User login (success, wrong password, non-existent user)
- Token validation (valid, missing, invalid, expired tokens)
- Profile management (get, update profile)
- Password reset flow

### Chat (`test_e2e_chat.py`)
- Basic chat queries
- Queries with conversation context
- Metadata filters
- Custom temperature/max_tokens
- HyDE (Hypothetical Document Embeddings)
- Streaming responses (SSE)
- Token collection from stream
- Retrieval phase events
- Error handling in streams

### Data Source Ingestion (`test_e2e_ingestion.py`)
- File upload (PDF, DOCX, TXT, MD)
- Web URL crawling
- Git repository ingestion
- Notion integration
- Database ingestion (PostgreSQL)
- Confluence ingestion (async jobs)
- SharePoint ingestion (async jobs)
- Job management (list, status, logs)

### Integrations (`test_e2e_integrations.py`)
- Create integrations (Confluence, SharePoint, Notion, Database)
- List integrations
- Delete integrations
- Use saved integrations for ingestion

### Conversations (`test_e2e_conversations.py`)
- Conversation creation
- List user conversations
- Get conversation history
- Delete conversations
- Multi-turn conversation context
- User isolation

## Running Tests

### Install Dependencies

```bash
cd backend
pip install -r tests/requirements-test.txt
```

### Run All Tests

```bash
# From backend directory
pytest tests/ -v

# With coverage
pytest tests/ --cov=app --cov-report=html

# Run specific test file
pytest tests/test_e2e_chat.py -v

# Run specific test class
pytest tests/test_e2e_chat.py::TestChatStreaming -v

# Run specific test
pytest tests/test_e2e_chat.py::TestChatQuery::test_basic_query_success -v
```

### Run with Real Services (Integration Mode)

Set environment variables to point to running services:

```bash
export RAG_QA_API_URL=http://localhost:8000
export RAG_CHAT_UI_BACKEND_URL=http://localhost:8001
export TEST_USER_EMAIL=test@example.com
export TEST_USER_PASSWORD=testpassword123

pytest tests/ -v --integration
```

### Generate HTML Report

```bash
pytest tests/ --html=report.html --self-contained-html
```

## Test Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `RAG_QA_API_URL` | `http://localhost:8000` | RAG-QA-API base URL |
| `RAG_CHAT_UI_BACKEND_URL` | `http://localhost:8001` | Backend base URL |
| `TEST_USER_EMAIL` | `test@example.com` | Test user email |
| `TEST_USER_PASSWORD` | `testpassword123` | Test user password |

### Mock Mode vs Integration Mode

- **Mock Mode (default)**: Uses `MockAsyncClient` to simulate HTTP responses
- **Integration Mode**: Calls real running services

## Test Patterns

### Using Fixtures

```python
@pytest.mark.asyncio
async def test_example(self, authenticated_headers, sample_query_request):
    """Example test using fixtures"""
    mock_responses = {
        "POST:/chat/query": MockResponse({"answer": "..."})
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
```

### Testing Streaming

```python
@pytest.mark.asyncio
async def test_streaming(self):
    """Example streaming test"""
    events = [
        'data: {"type": "token", "data": {"content": "Hello"}}',
        'data: {"type": "done", "data": {}}'
    ]

    class StreamingMockClient(MockAsyncClient):
        def stream(self, method, url, **kwargs):
            return MockStreamResponse(events)

    # ... test streaming logic
```

## Adding New Tests

1. Create test file in `tests/` directory
2. Import required fixtures from `conftest.py`
3. Use `@pytest.mark.asyncio` for async tests
4. Mock HTTP calls using `MockAsyncClient`
5. Follow naming convention: `test_<feature>_<scenario>`

## CI/CD Integration

```yaml
# Example GitHub Actions
- name: Run E2E Tests
  run: |
    cd backend
    pip install -r tests/requirements-test.txt
    pytest tests/ --cov=app --cov-report=xml

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    file: ./backend/coverage.xml
```
