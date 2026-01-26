"""
Evaluation router - proxies feedback requests to rag-qa-api.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from ..services.api_client import RagApiClient
import logging

router = APIRouter(prefix="/evaluation", tags=["evaluation"])
logger = logging.getLogger(__name__)

_api_client: Optional[RagApiClient] = None


def set_api_client(client: RagApiClient):
    global _api_client
    _api_client = client


class FeedbackRequest(BaseModel):
    query_id: str = Field(..., description="Query identifier")
    feedback_type: str = Field(..., description="thumbs_up, thumbs_down, or correction")
    rating: Optional[int] = Field(None, description="1-5 rating", ge=1, le=5)
    comment: Optional[str] = Field(None, description="Optional comment")
    correction: Optional[str] = Field(None, description="Corrected answer")


@router.post('/feedback')
async def submit_feedback(request: FeedbackRequest):
    """Submit user feedback for a query - proxies to rag-qa-api"""
    if not _api_client:
        raise HTTPException(status_code=503, detail="API client not initialized")

    try:
        result = await _api_client.submit_feedback(
            query_id=request.query_id,
            feedback_type=request.feedback_type,
            rating=request.rating,
            comment=request.comment,
            correction=request.correction
        )
        return result
    except Exception as e:
        logger.error(f"Error submitting feedback: {e}")
@router.get('/feedback')
async def get_feedback():
    """Get all user feedback - proxies to rag-qa-api"""
    if not _api_client:
        raise HTTPException(status_code=503, detail="API client not initialized")

    try:
        return await _api_client.get_all_feedback()
    except Exception as e:
        logger.error(f"Error fetching feedback: {e}")
        raise HTTPException(status_code=500, detail=str(e))
