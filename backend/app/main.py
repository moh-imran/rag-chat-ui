import os
import logging
from urllib.parse import quote_plus
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

from .models import User, Conversation, Message
from .services.api_client import RagApiClient
from .services.chat_service import ChatService
from .routers import chat, ingestion, auth, admin, evaluation


# Load environment variables
load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="RAG Chat Coordinator API",
    description="Lean backend for RAG Chat UI, delegating to rag-qa-api",
    version="1.0.0"
)

@app.on_event("startup")
async def startup_event():
    # Initialize Beanie
    mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017/rag_chat")
    
    # Process MONGODB_URL to escape username and password if present
    if "://" in mongodb_url and "@" in mongodb_url:
        try:
            scheme, rest = mongodb_url.split("://", 1)
            userinfo, host_rest = rest.rsplit("@", 1)
            if ":" in userinfo:
                username, password = userinfo.split(":", 1)
                mongodb_url = f"{scheme}://{quote_plus(username)}:{quote_plus(password)}@{host_rest}"
            else:
                mongodb_url = f"{scheme}://{quote_plus(userinfo)}@{host_rest}"
        except Exception as e:
            logger.warning(f"Failed to parse MONGODB_URL for escaping: {e}")

    client = AsyncIOMotorClient(mongodb_url)
    await init_beanie(
        database=client.get_default_database(),
        document_models=[User, Conversation, Message]
    )
    logger.info("Beanie initialized with MongoDB")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize API Client (pointing to rag-qa-api)
rag_api_url = os.getenv("RAG_API_URL", "http://localhost:8000")
api_client = RagApiClient(base_url=rag_api_url)

# Initialize Chat Service
chat_service = ChatService(api_client=api_client)

# Set services in routers
chat.set_chat_service(chat_service)
ingestion.set_api_client(api_client)


evaluation.set_api_client(api_client)

# Include routers
app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(ingestion.router)

app.include_router(evaluation.router)
app.include_router(admin.router)

@app.get("/")
async def root():
    return {"status": "online", "service": "RAG Chat Coordinator"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
