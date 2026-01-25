"""
ETL router - provides /etl/* routes for AdminPanel compatibility.
Proxies to the same rag-qa-api endpoints as the /ingest/etl/* routes.
"""
from fastapi import APIRouter, HTTPException
from ..services.api_client import RagApiClient
import logging

router = APIRouter(prefix="/etl", tags=["etl"])
logger = logging.getLogger(__name__)

_api_client = None

def set_api_client(client: RagApiClient):
    global _api_client
    _api_client = client


@router.get('/jobs')
async def list_etl_jobs(limit: int = 50):
    """List ETL jobs - called by AdminPanel"""
    if not _api_client:
        raise HTTPException(status_code=503, detail="API client not initialized")
    try:
        result = await _api_client.etl_list_jobs(limit=limit)
        # Return in format expected by AdminPanel
        jobs = result.get("jobs", [])
        return {"items": jobs, "jobs": jobs}
    except Exception as e:
        logger.error(f"Error listing ETL jobs: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/jobs/{job_id}/logs')
async def get_etl_job_logs(job_id: str):
    """Get logs for a specific ETL job"""
    if not _api_client:
        raise HTTPException(status_code=503, detail="API client not initialized")
    try:
        result = await _api_client.etl_job_logs(job_id)
        return result
    except Exception as e:
        logger.error(f"Error getting ETL job logs: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/status/{job_id}')
async def get_etl_status(job_id: str):
    """Get status of a specific ETL job"""
    if not _api_client:
        raise HTTPException(status_code=503, detail="API client not initialized")
    try:
        result = await _api_client.etl_status(job_id)
        return result
    except Exception as e:
        logger.error(f"Error getting ETL status: {e}")
        raise HTTPException(status_code=500, detail=str(e))
