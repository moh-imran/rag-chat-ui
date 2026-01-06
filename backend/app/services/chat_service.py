from typing import List, Dict, Any, Optional
import logging
from .api_client import RagApiClient

logger = logging.getLogger(__name__)

class ChatService:
    def __init__(
        self,
        api_client: RagApiClient,
        **kwargs  # Accept and ignore legacy args like openai_api_key, model_name
    ):
        self.api_client = api_client

    async def query(
        self,
        question: str,
        user: Any,
        conversation_id: Optional[str] = None,
        top_k: int = 5,
        temperature: float = 0.7,
        max_tokens: int = 1000,
        system_instruction: Optional[str] = None,
        score_threshold: Optional[float] = None
    ) -> Dict[str, Any]:
        """Process chat query by delegating to rag-qa-api and saving history"""
        from ..models import Conversation, Message
        from datetime import datetime
        
        try:
            # 1. Handle Conversation
            if conversation_id:
                conversation = await Conversation.get(conversation_id)
                if not conversation or conversation.user.ref.id != user.id:
                    raise ValueError("Conversation not found")
                conversation.updated_at = datetime.utcnow()
                await conversation.save()
            else:
                # Use first few words of question as title
                title = (question[:50] + '...') if len(question) > 50 else question
                conversation = Conversation(title=title, user=user)
                await conversation.insert()
            
            # 2. Save User Message
            user_msg = Message(
                conversation=conversation,
                role="user",
                content=question
            )
            await user_msg.insert()

            # 3. Fetch History for Context
            history_messages = []
            if conversation:
                # Get last 10 messages for context
                past_msgs = await Message.find(
                    Message.conversation.id == conversation.id
                ).sort(-Message.timestamp).limit(11).to_list() # 11 to account for the one we just saved
                
                # Reverse to get chronological order and exclude the current message (it's already in the list)
                # Actually, let's just fetch BEFORE saving the new one next time, but for now:
                past_msgs.reverse()
                history_messages = [
                    {"role": m.role, "content": m.content} 
                    for m in past_msgs if m.id != user_msg.id
                ]
            
            # Add current question
            history_messages.append({"role": "user", "content": question})

            # 4. Call RAG API with History
            result = await self.api_client.chat_with_history(
                messages=history_messages,
                top_k=top_k,
                temperature=temperature,
                max_tokens=max_tokens,
                system_instruction=system_instruction
            )

            # 4. Save Assistant Message
            assistant_msg = Message(
                conversation=conversation,
                role="assistant",
                content=result["answer"]
            )
            await assistant_msg.insert()

            # 5. Return result with conversation_id
            return {
                **result,
                "conversation_id": str(conversation.id)
            }
        except Exception as e:
            logger.error(f"Error in ChatService.query: {e}")
            raise
