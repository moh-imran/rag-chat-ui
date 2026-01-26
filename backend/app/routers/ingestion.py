from fastapi import APIRouter, UploadFile, File, HTTPException
from pathlib import Path
import tempfile
import os
import logging
import httpx
from ..services.api_client import RagApiClient, _extract_error_message
from pydantic import BaseModel
from typing import Dict, Any, Optional

router = APIRouter(prefix="/ingest", tags=["ingestion"])
logger = logging.getLogger(__name__)

# Global API client instance
_api_client = None

def set_api_client(client: RagApiClient):
    global _api_client
    _api_client = client

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    chunk_size: int = 1000,
    chunk_overlap: int = 200
):
    if not _api_client:
        raise HTTPException(status_code=503, detail="API client not initialized")

    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in {'.txt', '.pdf', '.docx', '.md'}:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {file_ext}")

    tmp_path = None
    try:
        # Save upload to local temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_path = tmp_file.name

        # Proxy the upload to rag-qa-api
        result = await _api_client.upload_file(
            tmp_path, 
            file.filename, 
            chunk_size, 
            chunk_overlap
        )

        return result
    except Exception as e:
        logger.error(f"Error proxying upload: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)



class EtlIngestRequest(BaseModel):
    source_type: str
    source_params: Optional[Dict[str, Any]] = None
    chunk_size: int = 1000
    chunk_overlap: int = 200
    batch_size: int = 32
    store_in_qdrant: bool = True


@router.post('/etl/ingest')
async def etl_ingest(request: EtlIngestRequest):
    """Proxy endpoint: accepts generic ETL ingestion requests from the frontend and forwards them to rag-qa-api."""
    if not _api_client:
        raise HTTPException(status_code=503, detail="API client not initialized")

    try:
        result = await _api_client.etl_ingest(
            source_type=request.source_type,
            source_params=request.source_params,
            chunk_size=request.chunk_size,
            chunk_overlap=request.chunk_overlap,
            batch_size=request.batch_size,
            store_in_qdrant=request.store_in_qdrant
        )
        return result
    except Exception as e:
        logger.error(f"Error proxying ETL ingest: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class EtlSubmitRequest(BaseModel):
    source_type: str
    source_params: Optional[Dict[str, Any]] = None
    chunk_size: int = 1000
    chunk_overlap: int = 200
    batch_size: int = 32
    store_in_qdrant: bool = True


@router.post('/etl/submit')
async def etl_submit(request: EtlSubmitRequest):
    if not _api_client:
        raise HTTPException(status_code=503, detail="API client not initialized")

    try:
        result = await _api_client.etl_submit(
            source_type=request.source_type,
            source_params=request.source_params,
            chunk_size=request.chunk_size,
            chunk_overlap=request.chunk_overlap,
            batch_size=request.batch_size,
            store_in_qdrant=request.store_in_qdrant
        )
        return result
    except Exception as e:
        logger.error(f"Error proxying ETL submit: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/etl/status/{job_id}')
async def etl_status(job_id: str):
    if not _api_client:
        raise HTTPException(status_code=503, detail="API client not initialized")
    try:
        result = await _api_client.etl_status(job_id)
        return result
    except httpx.HTTPStatusError as e:
        # Propagate the status code from upstream
        error_msg = _extract_error_message(e)
        logger.error(f"Error proxying ETL status: {error_msg}")
        raise HTTPException(status_code=e.response.status_code, detail=error_msg)
    except Exception as e:
        error_msg = _extract_error_message(e)
        logger.error(f"Error proxying ETL status: {error_msg}")
        raise HTTPException(status_code=500, detail=error_msg)


@router.get('/etl/jobs')
async def etl_jobs(limit: int = 50, skip: int = 0, search: Optional[str] = None):
    if not _api_client:
        raise HTTPException(status_code=503, detail="API client not initialized")
    try:
        result = await _api_client.etl_list_jobs(limit=limit, skip=skip, search=search)
        return result
    except httpx.HTTPStatusError as e:
        error_msg = _extract_error_message(e)
        logger.error(f"Error proxying ETL jobs list: {error_msg}")
        raise HTTPException(status_code=e.response.status_code, detail=error_msg)
    except Exception as e:
        error_msg = _extract_error_message(e)
        logger.error(f"Error proxying ETL jobs list: {error_msg}")
        raise HTTPException(status_code=500, detail=error_msg)


@router.get('/etl/jobs/{job_id}/logs')
async def etl_job_logs(job_id: str):
    if not _api_client:
        raise HTTPException(status_code=503, detail="API client not initialized")
    try:
        result = await _api_client.etl_job_logs(job_id)
        return result
    except httpx.HTTPStatusError as e:
        error_msg = _extract_error_message(e)
        logger.error(f"Error proxying ETL job logs: {error_msg}")
        raise HTTPException(status_code=e.response.status_code, detail=error_msg)
    except Exception as e:
        error_msg = _extract_error_message(e)
        logger.error(f"Error proxying ETL job logs: {error_msg}")
        raise HTTPException(status_code=500, detail=error_msg)


# Alias routes for backwards compatibility (without /etl prefix)
@router.post('/submit')
async def ingest_submit(request: EtlSubmitRequest):
    """Alias for /etl/submit - submit an async ingestion job"""
    return await etl_submit(request)


@router.get('/status/{job_id}')
async def ingest_status(job_id: str):
    """Alias for /etl/status/{job_id}"""
    return await etl_status(job_id)


@router.get('/jobs')
async def ingest_jobs(limit: int = 50, skip: int = 0, search: Optional[str] = None):
    """Alias for /etl/jobs"""
    return await etl_jobs(limit, skip, search)


@router.delete('/jobs/{job_id}')
async def delete_ingest_job(job_id: str):
    if not _api_client:
        raise HTTPException(status_code=503, detail="API client not initialized")
    try:
        return await _api_client.delete_ingest_job(job_id)
    except Exception as e:
        logger.error(f"Error deleting ingest job proxy: {e}")
        raise HTTPException(status_code=500, detail=str(e))

