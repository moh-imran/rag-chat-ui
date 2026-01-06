# RAG Chat UI

A modern web interface for RAG-based chat applications, featuring a FastAPI backend and a React/Vite frontend.

## Project Structure

- `frontend/`: React application built with Vite and Tailwind CSS.
- `backend/`: FastAPI application for handling chat logic and MongoDB integration.
- `docker-compose.yml`: Orchestration for backend, frontend, and MongoDB services.

## Prerequisites

- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- [RAG QA API](https://github.com/moh-imran/rag-qa-api) (Running locally or accessible via URL)

## Getting Started

### 1. Configuration

Create `.env` files in both `frontend` and `backend` directories. You can use the `.env.example` files as templates.

**Backend (.env):**
```env
MONGODB_URL=mongodb://mongodb:27017/rag_chat
RAG_API_URL=http://host.docker.internal:8000
```

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:8001
```

### 2. Running with Docker Compose

To start the entire stack:

```bash
docker-compose up --build
```

The application will be available at:
- Frontend: `http://localhost:5173`
- Backend API Docs: `http://localhost:8001/docs`

## Features

- **Chat Interface**: Clean and intuitive UI for interacting with RAG services.
- **Service Integration**: Seamlessly connects to the RAG QA API for document-based retrieval and generation.
- **Chat History**: Persists conversations in MongoDB.
- **Modern Tech Stack**: Built with contemporary tools for performance and developer experience.

## Development

### Backend
To run the backend locally without Docker:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

### Frontend
To run the frontend locally without Docker:
```bash
cd frontend
npm install
npm run dev
```
