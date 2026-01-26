import httpx
import logging
import os
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)


def _extract_error_message(e: Exception) -> str:
    """Extract a meaningful error message from an exception"""
    if isinstance(e, httpx.HTTPStatusError):
        # Try to get detail from response body
        try:
            body = e.response.json()
            if 'detail' in body and body['detail']:
                return f"API error ({e.response.status_code}): {body['detail']}"
        except:
            pass
        return f"API error ({e.response.status_code}): {e.response.text[:200] if e.response.text else 'No response body'}"
    elif isinstance(e, httpx.ConnectError):
        return f"Connection failed: Could not connect to RAG API"
    elif isinstance(e, httpx.TimeoutException):
        return f"Request timed out"
    return str(e) or f"Unknown error: {type(e).__name__}"


class RagApiClient:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url

    async def search(self, query: str, limit: int = 5, score_threshold: Optional[float] = None) -> List[Dict[str, Any]]:
        """Call the rag-qa-api /search endpoint"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{self.base_url}/search",
                    json={
                        "query": query,
                        "limit": limit,
                        "score_threshold": score_threshold
                    },
                    timeout=30.0
                )
                response.raise_for_status()
                data = response.json()
                return data.get("results", [])
            except Exception as e:
                logger.error(f"Error calling search API: {e}")
                return []

    async def upload_file(self, file_path: str, filename: str, chunk_size: int = 1000, chunk_overlap: int = 200) -> Dict[str, Any]:
        """Call the rag-qa-api /ingest/upload endpoint"""
        async with httpx.AsyncClient() as client:
            try:
                with open(file_path, "rb") as f:
                    files = {"file": (filename, f)}
                    data = {
                        "chunk_size": str(chunk_size),
                        "chunk_overlap": str(chunk_overlap)
                    }
                    response = await client.post(
                        f"{self.base_url}/ingest/upload",
                        files=files,
                        data=data,
                        timeout=300.0  # 5 minutes for large files / first-time model loading
                    )
                response.raise_for_status()
                return response.json()
            except Exception as e:
                logger.error(f"Error calling upload API: {e}")
                raise

    async def etl_ingest(self, source_type: str, source_params: Optional[Dict[str, Any]] = None, chunk_size: int = 1000, chunk_overlap: int = 200, batch_size: int = 32, store_in_qdrant: bool = True) -> Dict[str, Any]:
        """Call the rag-qa-api generic ingestion endpoint (/ingest/run)"""
        payload = {
            "source_type": source_type,
            "source_params": source_params or {},
            "chunk_size": chunk_size,
            "chunk_overlap": chunk_overlap,
            "batch_size": batch_size,
            "store_in_qdrant": store_in_qdrant
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(f"{self.base_url}/ingest/run", json=payload, timeout=300.0)
                response.raise_for_status()
                return response.json()
            except Exception as e:
                logger.error(f"Error calling etl_ingest API: {e}")
                raise

    async def etl_submit(self, source_type: str, source_params: Optional[Dict[str, Any]] = None, chunk_size: int = 1000, chunk_overlap: int = 200, batch_size: int = 32, store_in_qdrant: bool = True) -> Dict[str, Any]:
        """Submit an async ETL job to rag-qa-api (/ingest/submit)"""
        payload = {
            "source_type": source_type,
            "source_params": source_params or {},
            "chunk_size": chunk_size,
            "chunk_overlap": chunk_overlap,
            "batch_size": batch_size,
            "store_in_qdrant": store_in_qdrant
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(f"{self.base_url}/ingest/submit", json=payload, timeout=30.0)
                response.raise_for_status()
                return response.json()
            except Exception as e:
                logger.error(f"Error calling etl_submit API: {e}")
                raise

    async def etl_status(self, job_id: str) -> Dict[str, Any]:
        """Get job status from rag-qa-api (/ingest/status/{job_id})"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(f"{self.base_url}/ingest/status/{job_id}", timeout=60.0)
                response.raise_for_status()
                return response.json()
            except Exception as e:
                logger.error(f"Error calling etl_status API: {e}")
                raise

    async def etl_list_jobs(self, limit: int = 50) -> Dict[str, Any]:
        """List ingest jobs from rag-qa-api (/ingest/jobs)"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(f"{self.base_url}/ingest/jobs?limit={limit}", timeout=60.0)
                response.raise_for_status()
                return response.json()
            except Exception as e:
                logger.error(f"Error calling etl_list_jobs API: {e}")
                raise

    async def list_ingest_jobs(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Alias for etl_list_jobs - returns list of jobs for admin dashboard"""
        result = await self.etl_list_jobs(limit=limit)
        return result.get("jobs", [])

    async def create_integration(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(f"{self.base_url}/integrations/", json=payload, timeout=20.0)
                response.raise_for_status()
                return response.json()
            except Exception as e:
                logger.error(f"Error creating integration: {e}")
                raise

    async def list_integrations(self) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(f"{self.base_url}/integrations/", timeout=60.0)
                response.raise_for_status()
                return response.json()
            except Exception as e:
                logger.error(f"Error listing integrations: {e}")
                raise

    async def delete_integration(self, integration_id: str) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            try:
                response = await client.delete(f"{self.base_url}/integrations/{integration_id}", timeout=60.0)
                response.raise_for_status()
                return response.json()
            except Exception as e:
                logger.error(f"Error deleting integration: {e}")
                raise

    async def etl_job_logs(self, job_id: str) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(f"{self.base_url}/ingest/jobs/{job_id}/logs", timeout=60.0)
                response.raise_for_status()
                return response.json()
            except Exception as e:
                logger.error(f"Error calling etl_job_logs API: {e}")
                raise

    async def chat_query(
        self,
        question: str,
        top_k: int = 5,
        score_threshold: Optional[float] = None,
        system_instruction: Optional[str] = None,
        max_tokens: int = 1000,
        temperature: float = 0.7,
        return_sources: bool = True
    ) -> Dict[str, Any]:
        """Call the rag-qa-api /chat/query endpoint"""
        async with httpx.AsyncClient() as client:
            try:
                logger.info(f"calling chat/query client call")
                response = await client.post(
                    f"{self.base_url}/chat/query",
                    json={
                        "question": question,
                        "top_k": top_k,
                        "score_threshold": score_threshold,
                        "system_instruction": system_instruction,
                        "max_tokens": max_tokens,
                        "temperature": temperature,
                        "return_sources": return_sources
                    },
                    timeout=60.0
                )
                response.raise_for_status()
                return response.json()
            except Exception as e:
                logger.error(f"Error calling chat query API: {e}")
                raise
    async def chat_with_history(
        self,
        messages: List[Dict[str, str]],
        top_k: int = 5,
        max_tokens: int = 1000,
        temperature: float = 0.7,
        system_instruction: Optional[str] = None
    ) -> Dict[str, Any]:
        """Call the rag-qa-api /chat/ endpoint with history"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{self.base_url}/chat/",
                    json={
                        "messages": messages,
                        "top_k": top_k,
                        "max_tokens": max_tokens,
                        "temperature": temperature,
                        "system_instruction": system_instruction
                    },
                    timeout=60.0
                )
                response.raise_for_status()
                return response.json()
            except Exception as e:
                logger.error(f"Error calling chat history API: {e}")
                raise

    async def chat_query_stream(
        self,
        question: str,
        top_k: int = 5,
        score_threshold: Optional[float] = None,
        system_instruction: Optional[str] = None,
        max_tokens: int = 1000,
        temperature: float = 0.7
    ):
        """Stream from rag-qa-api /chat/query/stream endpoint"""
        async with httpx.AsyncClient() as client:
            try:
                async with client.stream(
                    "POST",
                    f"{self.base_url}/chat/query/stream",
                    json={
                        "question": question,
                        "top_k": top_k,
                        "score_threshold": score_threshold,
                        "system_instruction": system_instruction,
                        "max_tokens": max_tokens,
                        "temperature": temperature
                    },
                    timeout=120.0
                ) as response:
                    response.raise_for_status()
                    async for line in response.aiter_lines():
                        if line:
                            yield line
            except Exception as e:
                logger.error(f"Error streaming from chat query API: {e}")
                raise

    async def submit_feedback(
        self,
        query_id: str,
        feedback_type: str,
        rating: Optional[int] = None,
        comment: Optional[str] = None,
        correction: Optional[str] = None
    ) -> Dict[str, Any]:
        """Submit feedback to rag-qa-api /evaluation/feedback endpoint"""
        payload = {
            "query_id": query_id,
            "feedback_type": feedback_type
        }
        if rating is not None:
            payload["rating"] = rating
        if comment:
            payload["comment"] = comment
        if correction:
            payload["correction"] = correction

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{self.base_url}/evaluation/feedback",
                    json=payload,
                    timeout=60.0
                )
                response.raise_for_status()
                return response.json()
            except Exception as e:
                logger.error(f"Error submitting feedback: {e}")
                raise
