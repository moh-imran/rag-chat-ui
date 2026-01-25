# RAG Chat UI

A modern full-stack web application for RAG-based document Q&A, featuring user authentication, multi-turn conversations, data source management, and real-time streaming responses. Built with React/Vite frontend and FastAPI backend.

## Features

### Frontend Features
| Feature | Description |
|---------|-------------|
| **Chat Interface** | Clean, modern UI for RAG-powered conversations |
| **Streaming Responses** | Real-time token streaming via Server-Sent Events |
| **Conversation History** | Browse, search, and manage past conversations |
| **Data Sources Modal** | Configure and manage multiple data source integrations |
| **Dark/Light Mode** | Theme toggle with system preference detection |
| **Responsive Design** | Mobile-friendly layout with Tailwind CSS |
| **Authentication** | JWT-based auth with login/register flows |
| **Text Selection** | Selectable chat messages for easy copying |
| **Error Persistence** | Error messages persist until user dismisses |
| **Smart Polling** | Exponential backoff for job status polling |

### Backend Features
| Feature | Description |
|---------|-------------|
| **User Management** | Registration, login, JWT authentication |
| **Conversation Persistence** | MongoDB storage for chat history |
| **RAG API Proxy** | Seamless integration with rag-qa-api |
| **Integration Management** | Save and manage data source credentials |
| **ETL Job Management** | Submit and monitor ingestion jobs |
| **Streaming Proxy** | Forward SSE streams from rag-qa-api |

### Supported Data Sources
| Source | Description |
|--------|-------------|
| **File Upload** | PDF, DOCX, PPTX, XLSX, TXT, MD, CSV, HTML, RTF, Images (OCR) |
| **Web Crawler** | URLs with Playwright browser support for JS-heavy sites |
| **Git Repository** | Clone and index code repositories |
| **Confluence** | Atlassian Cloud wiki pages |
| **SharePoint** | Microsoft 365 document libraries |
| **Notion** | Notion pages and databases |
| **Database** | PostgreSQL, MongoDB |
| **API** | Generic REST API connector |

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Frontend     │────▶│    Backend      │────▶│   rag-qa-api    │
│  (React/Vite)   │     │   (FastAPI)     │     │   (RAG Engine)  │
│   Port: 5173    │     │   Port: 8001    │     │   Port: 8000    │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │    MongoDB      │
                        │  (Persistence)  │
                        │   Port: 27017   │
                        └─────────────────┘
```

## Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **State Management**: React Context
- **Routing**: React Router v6

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **Database**: MongoDB with Motor (async driver)
- **Authentication**: JWT with python-jose
- **HTTP Client**: httpx (async)
- **Password Hashing**: passlib with bcrypt

## Quick Start

### Prerequisites
- Docker and Docker Compose
- [rag-qa-api](https://github.com/moh-imran/rag-qa-api) running on port 8000

### 1. Clone and Configure

```bash
git clone <repository-url>
cd rag-chat-ui
```

Create `.env` files:

**backend/.env:**
```env
MONGODB_URL=mongodb://mongodb:27017/rag_chat
RAG_API_URL=http://host.docker.internal:8000
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

**frontend/.env:**
```env
VITE_API_URL=http://localhost:8001
```

### 2. Run with Docker Compose

```bash
docker-compose up --build
```

Services will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8001
- **Backend Docs**: http://localhost:8001/docs
- **MongoDB**: localhost:27017

## API Reference

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/register` | POST | Create new user account |
| `/auth/login` | POST | Login and get JWT token |
| `/auth/me` | GET | Get current user profile |

### Chat & Conversations

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/chat/query` | POST | Single question with RAG retrieval |
| `/chat/query/stream` | POST | Streaming response with SSE |
| `/chat/conversations` | GET | List user conversations |
| `/chat/conversations` | POST | Create new conversation |
| `/chat/conversations/{id}` | GET | Get conversation with messages |
| `/chat/conversations/{id}` | DELETE | Delete conversation |
| `/chat/conversations/{id}/title` | PUT | Update conversation title |

### Data Source Ingestion

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/ingest/etl/ingest` | POST | Synchronous ETL ingestion |
| `/ingest/etl/submit` | POST | Async job submission |
| `/ingest/etl/status/{job_id}` | GET | Get job status |
| `/ingest/etl/jobs` | GET | List recent jobs |
| `/ingest/upload` | POST | Upload file for ingestion |

### Integrations Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/integrations/` | GET | List saved integrations |
| `/integrations/` | POST | Create new integration |
| `/integrations/{id}` | DELETE | Delete integration |

### Search & Collection

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/search` | POST | Semantic search (proxy to rag-qa-api) |
| `/collection/info` | GET | Get collection info |

### System

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/` | GET | API info |

## Project Structure

```
rag-chat-ui/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Chat.tsx              # Main chat interface
│   │   │   ├── ChatHistory.tsx       # Conversation sidebar
│   │   │   ├── DataSourcesModal.tsx  # Data source configuration
│   │   │   ├── Header.tsx            # App header with navigation
│   │   │   ├── Login.tsx             # Login form
│   │   │   ├── Register.tsx          # Registration form
│   │   │   └── ProtectedRoute.tsx    # Auth route wrapper
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx       # Authentication state
│   │   ├── utils/
│   │   │   └── api.ts                # API client functions
│   │   ├── App.tsx                   # Main app component
│   │   └── main.tsx                  # Entry point
│   ├── Dockerfile
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── main.py                   # FastAPI application
│   │   ├── config.py                 # Configuration settings
│   │   ├── database.py               # MongoDB connection
│   │   ├── models/
│   │   │   ├── user.py               # User model
│   │   │   ├── conversation.py       # Conversation model
│   │   │   └── integration.py        # Integration model
│   │   ├── routers/
│   │   │   ├── auth.py               # Authentication endpoints
│   │   │   ├── chat.py               # Chat endpoints
│   │   │   ├── ingestion.py          # ETL proxy endpoints
│   │   │   ├── integrations.py       # Integration management
│   │   │   ├── search.py             # Search proxy
│   │   │   └── collection.py         # Collection management
│   │   └── services/
│   │       ├── api_client.py         # RAG API client
│   │       ├── chat_service.py       # Chat business logic
│   │       └── auth_service.py       # Authentication logic
│   ├── tests/
│   │   ├── conftest.py               # Test fixtures
│   │   ├── test_e2e_auth.py          # Authentication tests
│   │   ├── test_e2e_chat.py          # Chat & streaming tests
│   │   ├── test_e2e_ingestion.py     # Data source tests
│   │   ├── test_e2e_integrations.py  # Integration CRUD tests
│   │   ├── test_e2e_conversations.py # Conversation tests
│   │   └── README.md                 # Test documentation
│   ├── Dockerfile
│   └── requirements.txt
└── docker-compose.yml
```

## Configuration

### Environment Variables

**Backend:**

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGODB_URL` | Required | MongoDB connection string |
| `RAG_API_URL` | Required | URL to rag-qa-api service |
| `SECRET_KEY` | Required | JWT signing key |
| `ALGORITHM` | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | Token expiration (24h) |

**Frontend:**

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | Required | Backend API URL |

## Development

### Backend (Local)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Start MongoDB
docker-compose up mongodb -d

# Run backend
uvicorn app.main:app --reload --port 8001
```

### Frontend (Local)

```bash
cd frontend
npm install
npm run dev
```

## Testing

The project includes comprehensive E2E tests covering all features.

```bash
cd backend

# Install test dependencies
pip install -r tests/requirements-test.txt

# Run all tests
pytest tests/ -v

# Run specific test file
pytest tests/test_e2e_chat.py -v

# Run with coverage
pytest tests/ --cov=app --cov-report=html
```

### Test Coverage

| Test Suite | Coverage |
|------------|----------|
| Authentication | Login, register, token validation |
| Chat | Query, streaming, conversation context |
| Conversations | CRUD operations, message history |
| Integrations | Create, list, delete integrations |
| Ingestion | All 8 data sources, job management |

## Streaming Flow

```
1. User sends message (frontend)
       │
       ▼
2. POST /chat/query/stream (backend)
       │
       ▼
3. Backend proxies to rag-qa-api
       │
       ▼
4. SSE Events streamed back:
   - conversation_id: New/existing conversation ID
   - retrieval_start: Query processing begins
   - retrieval_complete: Documents retrieved
   - generation_start: LLM generation begins
   - token: Individual response tokens
   - done: Stream complete
       │
       ▼
5. Frontend displays tokens in real-time
       │
       ▼
6. Backend saves message to MongoDB
```

## License

MIT License
