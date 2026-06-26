import tempfile
import unittest
from pathlib import Path

from backend.app.schemas import BackendMemoryRecord
from backend.app.store import SQLiteSessionStore


def make_memory(memory_id: str, *, active: bool = True) -> BackendMemoryRecord:
    return BackendMemoryRecord(
        memoryId=memory_id,
        title=f"Memory {memory_id}",
        text=f"Memory {memory_id} text",
        day=4,
        type="record",
        source="Persistence Test",
        location="Test Archive",
        visibility="public",
        reliability=0.93,
        active=active,
        expiresOnDay=None,
        tags=["persistence", memory_id],
        evidenceRole="favorable",
        persistent=True,
    )


class SQLiteStoreTests(unittest.TestCase):
    def test_memories_persist_across_store_reopen(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            db_path = Path(temp_dir) / "whisper_caravan_test.db"
            session_id = "dev-session"
            initial_store = SQLiteSessionStore(db_path=db_path)

            initial_store.upsert_memories(
                session_id,
                [make_memory("memory-a"), make_memory("memory-b", active=False)],
            )

            reopened_store = SQLiteSessionStore(db_path=db_path)
            memories = reopened_store.list_memories(session_id)

            self.assertEqual([memory.memoryId for memory in memories], ["memory-a", "memory-b"])
            self.assertTrue(memories[0].active)
            self.assertFalse(memories[1].active)
            self.assertEqual(memories[0].tags, ["persistence", "memory-a"])


if __name__ == "__main__":
    unittest.main()
