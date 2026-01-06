from fastapi import APIRouter, UploadFile, File, HTTPException
from pathlib import Path
import tempfile
import os
import logging
from ..services.api_client import RagApiClient

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
