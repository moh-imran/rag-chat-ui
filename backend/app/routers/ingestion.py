from fastapi import APIRouter, UploadFile, File, HTTPException
from pathlib import Path
import tempfile
import os
import logging
from ..services.api_client import RagApiClient
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
    except Exception as e:
        logger.error(f"Error proxying ETL status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/etl/jobs')
async def etl_jobs(limit: int = 50):
    if not _api_client:
        raise HTTPException(status_code=503, detail="API client not initialized")
    try:
        result = await _api_client.etl_list_jobs(limit=limit)
        return result
    except Exception as e:
        logger.error(f"Error proxying ETL jobs list: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/etl/jobs/{job_id}/logs')
async def etl_job_logs(job_id: str):
    if not _api_client:
        raise HTTPException(status_code=503, detail="API client not initialized")
    try:
        result = await _api_client.etl_job_logs(job_id)
        return result
    except Exception as e:
        logger.error(f"Error proxying ETL job logs: {e}")
        raise HTTPException(status_code=500, detail=str(e))
