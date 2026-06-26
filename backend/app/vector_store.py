from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import List, Optional

from .embeddings import EmbeddingProvider, embedding_provider
from .schemas import BackendMemoryRecord


logger = logging.getLogger(__name__)
DEFAULT_CHROMA_PATH = Path(__file__).resolve().parent.parent / "data" / "chroma"


def build_candidate_document(memory: BackendMemoryRecord) -> str:
    tags_text = ", ".join(memory.tags)
    reliability_percent = round(memory.reliability * 100)
    source_npc_text = memory.sourceNpcId or "none"
    faction_text = memory.faction or "none"
    return (
        f"Title: {memory.title}\n"
        f"Body: {memory.text}\n"
        f"Day: {memory.day}\n"
        f"Type: {memory.type}\n"
        f"Source: {memory.source}\n"
        f"Source NPC: {source_npc_text}\n"
        f"Location: {memory.location}\n"
        f"Faction: {faction_text}\n"
        f"Visibility: {memory.visibility}\n"
        f"Reliability: {reliability_percent}\n"
        f"Evidence Role: {memory.evidenceRole}\n"
        f"Active: {'true' if memory.active else 'false'}\n"
        f"Persistent: {'true' if memory.persistent else 'false'}\n"
        f"Tags: {tags_text}"
    )


class ChromaCandidateStore:
    def __init__(
        self,
        persist_path: str | Path | None = None,
        provider: EmbeddingProvider = embedding_provider,
    ) -> None:
        self.provider = provider
        configured_path = persist_path or os.getenv("WHISPER_CARAVAN_CHROMA_PATH") or DEFAULT_CHROMA_PATH
        self.persist_path = Path(configured_path)
        self.persist_path.mkdir(parents=True, exist_ok=True)
        self._available = False
        self._last_error: Optional[str] = None
        self._collection = None
        self._disabled_by_env = os.getenv("WHISPER_CARAVAN_DISABLE_VECTOR") == "1"
        self._initialize_client()

    def _initialize_client(self) -> None:
        if self._disabled_by_env:
            self._last_error = "disabled by WHISPER_CARAVAN_DISABLE_VECTOR=1"
            return

        try:
            import chromadb
            from chromadb.config import Settings
        except ImportError as error:
            self._last_error = str(error)
            logger.warning("Chroma unavailable, using SQLite-only fallback: %s", error)
            return

        try:
            client = chromadb.PersistentClient(
                path=str(self.persist_path),
                settings=Settings(anonymized_telemetry=False),
            )
            self._collection = client.get_or_create_collection(name="memory_candidates")
            self._available = True
            self._last_error = None
        except Exception as error:  # pragma: no cover - defensive runtime path
            self._last_error = str(error)
            logger.warning("Chroma initialization failed, using SQLite-only fallback: %s", error)

    def is_available(self) -> bool:
        return self._available and self._collection is not None

    def _vector_id(self, session_id: str, memory_id: str) -> str:
        return f"{session_id}:{memory_id}"

    def upsert_memories(self, session_id: str, memories: List[BackendMemoryRecord]) -> bool:
        if not self.is_available() or not memories:
            return False

        try:
            documents = [build_candidate_document(memory) for memory in memories]
            embeddings = self.provider.embed_texts(documents)
            ids = [self._vector_id(session_id, memory.memoryId) for memory in memories]
            metadatas = [
                {
                    "session_id": session_id,
                    "memory_id": memory.memoryId,
                    "type": memory.type,
                    "location": memory.location,
                }
                for memory in memories
            ]
            self._collection.upsert(
                ids=ids,
                documents=documents,
                embeddings=embeddings,
                metadatas=metadatas,
            )
            return True
        except Exception as error:  # pragma: no cover - defensive runtime path
            self._last_error = str(error)
            logger.warning("Chroma upsert failed, using SQLite-only fallback: %s", error)
            return False

    def query_candidate_memory_ids(
        self, session_id: str, query_text: str, n_results: int
    ) -> List[str]:
        if not self.is_available() or n_results <= 0:
            return []

        try:
            results = self._collection.query(
                query_embeddings=[self.provider.embed_query(query_text)],
                n_results=n_results,
                where={"session_id": session_id},
                include=["metadatas"],
            )
        except Exception as error:  # pragma: no cover - defensive runtime path
            self._last_error = str(error)
            logger.warning("Chroma query failed, using SQLite-only fallback: %s", error)
            return []

        metadatas = results.get("metadatas") or []

        if not metadatas or not metadatas[0]:
            return []

        return [
            metadata["memory_id"]
            for metadata in metadatas[0]
            if metadata and metadata.get("memory_id")
        ]

    def health_info(self) -> dict:
        return {
            "vectorStore": "chroma" if self.is_available() else "fallback-only",
            "vectorStoreAvailable": self.is_available(),
            "vectorStorePath": str(self.persist_path),
            "vectorStoreDisabled": self._disabled_by_env,
            "vectorStoreError": self._last_error,
            **self.provider.health_info(),
        }


vector_store = ChromaCandidateStore()
