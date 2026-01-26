# RAG Chat UI — Admin

This is a minimal admin frontend app to manage integrations and view ingestion jobs.

Quick start (requires Node.js 18+):

```bash
cd rag-chat-ui/admin-frontend
npm install
npm run dev
```

Set `VITE_API_URL` to point at the `rag-chat-ui` backend (default `http://localhost:8001`).

The app provides a small UI to list/create/delete integrations and view job logs.
