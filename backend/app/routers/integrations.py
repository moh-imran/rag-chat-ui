from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
from ..services.api_client import RagApiClient
import logging

router = APIRouter(prefix="/integrations", tags=["integrations"])
logger = logging.getLogger(__name__)

_api_client: Optional[RagApiClient] = None

def set_api_client(client: RagApiClient):
    global _api_client
    _api_client = client


class CreateIntegrationRequest(BaseModel):
    name: str
    type: str
    config: Dict[str, Any]


@router.post('/')
async def create_integration(request: CreateIntegrationRequest):
    if not _api_client:
        raise HTTPException(status_code=503, detail="API client not initialized")
    try:
        return await _api_client.create_integration(request.dict())
    except Exception as e:
        logger.error(f"Error creating integration proxy: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/')
async def list_integrations():
    if not _api_client:
        raise HTTPException(status_code=503, detail="API client not initialized")
    try:
        return await _api_client.list_integrations()
    except Exception as e:
        logger.error(f"Error listing integrations proxy: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete('/{integration_id}')
async def delete_integration(integration_id: str):
    if not _api_client:
        raise HTTPException(status_code=503, detail="API client not initialized")
    try:
        return await _api_client.delete_integration(integration_id)
    except Exception as e:
        logger.error(f"Error deleting integration proxy: {e}")
        raise HTTPException(status_code=500, detail=str(e))
