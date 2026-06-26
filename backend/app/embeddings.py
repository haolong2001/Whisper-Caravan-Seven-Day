from __future__ import annotations

import hashlib
import math
import re
from typing import List, Protocol


TOKEN_PATTERN = re.compile(r"[a-z0-9_]+")


class EmbeddingProvider(Protocol):
    @property
    def name(self) -> str:
        ...

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        ...

    def embed_query(self, text: str) -> List[float]:
        ...

    def health_info(self) -> dict:
        ...


class DeterministicEmbeddingProvider:
    def __init__(self, dimensions: int = 64) -> None:
        self.dimensions = dimensions

    @property
    def name(self) -> str:
        return "deterministic-hash"

    def _tokenize(self, text: str) -> List[str]:
        tokens = TOKEN_PATTERN.findall(text.lower())
        return tokens or ["empty"]

    def _embed_text(self, text: str) -> List[float]:
        vector = [0.0] * self.dimensions

        for token in self._tokenize(text):
            digest = hashlib.blake2b(token.encode("utf-8"), digest_size=8).digest()
            index = int.from_bytes(digest[:4], "big") % self.dimensions
            sign = 1.0 if digest[4] % 2 == 0 else -1.0
            weight = 1.0 + (digest[5] / 255.0)
            vector[index] += sign * weight

        magnitude = math.sqrt(sum(component * component for component in vector))

        if magnitude == 0:
            return vector

        return [component / magnitude for component in vector]

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        return [self._embed_text(text) for text in texts]

    def embed_query(self, text: str) -> List[float]:
        return self._embed_text(text)

    def health_info(self) -> dict:
        return {
            "embeddings": self.name,
            "embeddingDimensions": self.dimensions,
        }


embedding_provider: EmbeddingProvider = DeterministicEmbeddingProvider()
