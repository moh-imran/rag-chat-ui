from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
import logging

router = APIRouter(prefix="/chat", tags=["chat"])
logger = logging.getLogger(__name__)

from .auth import get_current_user
from ..models import User, Conversation, Message

# Global chat service instance
_chat_service = None

def set_chat_service(service):
    global _chat_service
    _chat_service = service

class QueryRequest(BaseModel):
    question: str
    conversation_id: Optional[str] = None
    top_k: int = 5
    temperature: float = 0.7
    score_threshold: Optional[float] = None
    system_instruction: Optional[str] = None
    max_tokens: Optional[int] = 1000

class SourceMetadata(BaseModel):
    filename: Optional[str] = None
    filepath: Optional[str] = None
    type: Optional[str] = None
    chunk_id: Optional[int] = None

class Source(BaseModel):
    content: str
    metadata: SourceMetadata
    score: float

class QueryResponse(BaseModel):
    answer: str
    context_used: bool
    conversation_id: str

class ConversationResponse(BaseModel):
    id: str
    title: str
    updated_at: str

class MessageResponse(BaseModel):
    role: str
    content: str
    timestamp: str

@router.post("/query", response_model=QueryResponse)
async def query_chat(
    request: QueryRequest,
    current_user: User = Depends(get_current_user)
):
    if not _chat_service:
        raise HTTPException(status_code=503, detail="Chat service not initialized")

    try:
        result = await _chat_service.query(
            question=request.question,
            user=current_user,
            conversation_id=request.conversation_id,
            top_k=request.top_k,
            temperature=request.temperature,
            max_tokens=request.max_tokens or 1000,
            system_instruction=request.system_instruction,
            score_threshold=request.score_threshold
        )
        return result
    except Exception as e:
        logger.error(f"Error in chat query: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/query/stream")
async def query_chat_stream(
    request: QueryRequest,
    current_user: User = Depends(get_current_user)
):
    """Stream chat response with Server-Sent Events"""
    logger.info(f"Stream query from user: {current_user.email}")
    if not _chat_service:
        raise HTTPException(status_code=503, detail="Chat service not initialized")

    async def event_generator():
        try:
            async for event in _chat_service.query_stream(
                question=request.question,
                user=current_user,
                conversation_id=request.conversation_id,
                top_k=request.top_k,
                temperature=request.temperature,
                max_tokens=request.max_tokens or 1000,
                system_instruction=request.system_instruction,
                score_threshold=request.score_threshold
            ):
                yield event
        except Exception as e:
            logger.error(f"Error in streaming chat: {e}")
            yield f"data: {{'event': 'error', 'error': '{str(e)}'}}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@router.get("/conversations", response_model=List[ConversationResponse])
async def list_conversations(current_user: User = Depends(get_current_user)):
    try:
        # Strategy 1: Standard Beanie Link ID query
        conversations = await Conversation.find(
            Conversation.user.id == current_user.id
        ).sort(-Conversation.updated_at).to_list()
        
        # Strategy 2: Raw MongoDB DBRef query (fallback)
        if not conversations:
            conversations = await Conversation.find({
                "user.$id": current_user.id
            }).sort(-Conversation.updated_at).to_list()
            
        # Strategy 3: Direct User object comparison (fallback)
        if not conversations:
            conversations = await Conversation.find(
                Conversation.user == current_user
            ).sort(-Conversation.updated_at).to_list()
            
        logger.info(f"List conversations for {current_user.email} (ID: {current_user.id}): Found {len(conversations)}")
        
        return [
            ConversationResponse(
                id=str(c.id),
                title=c.title,
                updated_at=c.updated_at.isoformat()
            ) for c in conversations
        ]
    except Exception as e:
        logger.error(f"Error listing conversations: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/conversations/{conv_id}", response_model=List[MessageResponse])
async def get_conversation_history(
    conv_id: str,
    current_user: User = Depends(get_current_user)
):
    conversation = await Conversation.get(conv_id)
    if not conversation or conversation.user.ref.id != current_user.id:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    messages = await Message.find(Message.conversation.id == conversation.id).sort(Message.timestamp).to_list()
    return [
        MessageResponse(
            role=m.role,
            content=m.content,
            timestamp=m.timestamp.isoformat()
        ) for m in messages
    ]

@router.delete("/conversations/{conv_id}")
async def delete_conversation(
    conv_id: str,
    current_user: User = Depends(get_current_user)
):
    conversation = await Conversation.get(conv_id)
    if not conversation or conversation.user.ref.id != current_user.id:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Delete all messages associated with this conversation
    await Message.find(Message.conversation.id == conversation.id).delete()
    
    # Delete the conversation itself
    await conversation.delete()
    
    return {"status": "success", "message": "Conversation deleted"}
