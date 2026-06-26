from __future__ import annotations

import json
import os
import sqlite3
from pathlib import Path
from typing import List

from .schemas import BackendMemoryRecord


DEFAULT_SESSION_ID = "dev-session"
DEFAULT_DB_PATH = Path(__file__).resolve().parent.parent / "data" / "whisper_caravan.db"


class SQLiteSessionStore:
    def __init__(self, db_path: str | Path | None = None) -> None:
        configured_path = db_path or os.getenv("WHISPER_CARAVAN_DB_PATH") or DEFAULT_DB_PATH
        self.db_path = Path(configured_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._initialize_schema()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.db_path)
        connection.row_factory = sqlite3.Row
        return connection

    def _initialize_schema(self) -> None:
        with self._connect() as connection:
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS memories (
                    session_id TEXT NOT NULL,
                    memory_id TEXT NOT NULL,
                    title TEXT NOT NULL,
                    text TEXT NOT NULL,
                    day INTEGER NOT NULL,
                    type TEXT NOT NULL,
                    source TEXT NOT NULL,
                    source_npc_id TEXT,
                    location TEXT NOT NULL,
                    faction TEXT,
                    visibility TEXT NOT NULL,
                    reliability REAL NOT NULL,
                    active INTEGER NOT NULL,
                    expires_on_day INTEGER,
                    tags_json TEXT NOT NULL,
                    evidence_role TEXT NOT NULL,
                    persistent INTEGER NOT NULL,
                    PRIMARY KEY (session_id, memory_id)
                )
                """
            )

    def _normalize_session_id(self, session_id: str) -> str:
        return session_id or DEFAULT_SESSION_ID

    def _serialize_memory(self, session_id: str, memory: BackendMemoryRecord) -> tuple:
        return (
            session_id,
            memory.memoryId,
            memory.title,
            memory.text,
            memory.day,
            memory.type,
            memory.source,
            memory.sourceNpcId,
            memory.location,
            memory.faction,
            memory.visibility,
            memory.reliability,
            int(memory.active),
            memory.expiresOnDay,
            json.dumps(memory.tags),
            memory.evidenceRole,
            int(memory.persistent),
        )

    def _deserialize_memory(self, row: sqlite3.Row) -> BackendMemoryRecord:
        return BackendMemoryRecord(
            memoryId=row["memory_id"],
            title=row["title"],
            text=row["text"],
            day=row["day"],
            type=row["type"],
            source=row["source"],
            sourceNpcId=row["source_npc_id"],
            location=row["location"],
            faction=row["faction"],
            visibility=row["visibility"],
            reliability=row["reliability"],
            active=bool(row["active"]),
            expiresOnDay=row["expires_on_day"],
            tags=json.loads(row["tags_json"]),
            evidenceRole=row["evidence_role"],
            persistent=bool(row["persistent"]),
        )

    def upsert_memories(self, session_id: str, memories: List[BackendMemoryRecord]) -> int:
        normalized_session_id = self._normalize_session_id(session_id)
        payload = [
            self._serialize_memory(normalized_session_id, memory)
            for memory in memories
        ]

        with self._connect() as connection:
            connection.executemany(
                """
                INSERT INTO memories (
                    session_id,
                    memory_id,
                    title,
                    text,
                    day,
                    type,
                    source,
                    source_npc_id,
                    location,
                    faction,
                    visibility,
                    reliability,
                    active,
                    expires_on_day,
                    tags_json,
                    evidence_role,
                    persistent
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(session_id, memory_id) DO UPDATE SET
                    title = excluded.title,
                    text = excluded.text,
                    day = excluded.day,
                    type = excluded.type,
                    source = excluded.source,
                    source_npc_id = excluded.source_npc_id,
                    location = excluded.location,
                    faction = excluded.faction,
                    visibility = excluded.visibility,
                    reliability = excluded.reliability,
                    active = excluded.active,
                    expires_on_day = excluded.expires_on_day,
                    tags_json = excluded.tags_json,
                    evidence_role = excluded.evidence_role,
                    persistent = excluded.persistent
                """,
                payload,
            )

        return len(memories)

    def list_memories(self, session_id: str) -> List[BackendMemoryRecord]:
        normalized_session_id = self._normalize_session_id(session_id)

        with self._connect() as connection:
            rows = connection.execute(
                """
                SELECT
                    memory_id,
                    title,
                    text,
                    day,
                    type,
                    source,
                    source_npc_id,
                    location,
                    faction,
                    visibility,
                    reliability,
                    active,
                    expires_on_day,
                    tags_json,
                    evidence_role,
                    persistent
                FROM memories
                WHERE session_id = ?
                ORDER BY day ASC, memory_id ASC
                """,
                (normalized_session_id,),
            ).fetchall()

        return [self._deserialize_memory(row) for row in rows]

    def health_info(self) -> dict:
        return {
            "store": "sqlite",
            "dbPath": str(self.db_path),
        }


store = SQLiteSessionStore()
