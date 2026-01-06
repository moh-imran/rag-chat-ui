import httpx
import logging
import os
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

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
                        timeout=60.0
                    )
                response.raise_for_status()
                return response.json()
            except Exception as e:
                logger.error(f"Error calling upload API: {e}")
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
