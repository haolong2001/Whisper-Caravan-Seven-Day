import tempfile
import unittest
from pathlib import Path

from backend.app.retrieval import (
    candidate_resolution_debug,
    resolve_candidate_memories_for_query,
    resolve_candidate_memories_for_reaction,
)
from backend.app.rules import build_npc_reaction, query_memories
from backend.app.schemas import QueryRequest, ReactionRequest
from backend.app.store import SQLiteSessionStore
from backend.tests.helpers import make_memory


class FakeVectorStore:
    def __init__(self, candidate_ids, available=True):
        self.candidate_ids = candidate_ids
        self.available = available

    def query_candidate_memory_ids(self, session_id: str, query_text: str, n_results: int):
        if not self.available:
            return []
        return self.candidate_ids[:n_results]


class RetrievalCandidateTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.session_id = "dev-session"
        self.store = SQLiteSessionStore(db_path=Path(self.temp_dir.name) / "test.db")

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_query_candidates_still_respect_authoritative_filters(self):
        self.store.upsert_memories(
            self.session_id,
            [
                make_memory(
                    "inactive-rumor",
                    title="Inactive Rumor",
                    memory_type="rumor",
                    visibility="public",
                    reliability=0.9,
                    active=False,
                    evidence_role="incriminating",
                ),
                make_memory(
                    "private-witness",
                    title="Private Witness",
                    memory_type="short_term",
                    visibility="private",
                    reliability=0.95,
                    active=True,
                    evidence_role="incriminating",
                ),
                make_memory(
                    "public-record",
                    title="Public Record",
                    memory_type="record",
                    visibility="public",
                    reliability=0.91,
                    active=True,
                    evidence_role="favorable",
                    source="Retrieval Test",
                    location="Test Crossing",
                ),
            ],
        )

        request = QueryRequest(sessionId=self.session_id, npcId="bearJudge", activeOnly=True)
        vector_store = FakeVectorStore(["inactive-rumor", "private-witness", "public-record"])
        resolution = resolve_candidate_memories_for_query(self.store, vector_store, request)
        memories = resolution.memories
        result = query_memories(
            memories,
            request,
        )
        debug = candidate_resolution_debug(resolution, len(result))

        self.assertEqual([item.memoryId for item in result], ["public-record"])
        self.assertEqual(debug.retrievalSource, "vector")
        self.assertEqual(debug.candidateCount, 3)
        self.assertEqual(debug.resolvedCandidateCount, 3)
        self.assertEqual(debug.filteredEvidenceCount, 1)

    def test_reaction_candidates_still_respect_bear_judge_rules(self):
        self.store.upsert_memories(
            self.session_id,
            [
                make_memory(
                    "public-rumor",
                    title="Public Rumor",
                    memory_type="rumor",
                    visibility="public",
                    reliability=0.82,
                    active=True,
                    evidence_role="incriminating",
                ),
                make_memory(
                    "private-witness",
                    title="Private Witness",
                    memory_type="short_term",
                    visibility="private",
                    reliability=0.95,
                    active=True,
                    evidence_role="incriminating",
                ),
                make_memory(
                    "public-record",
                    title="Public Record",
                    memory_type="record",
                    visibility="public",
                    reliability=0.91,
                    active=True,
                    evidence_role="favorable",
                    source="Retrieval Test",
                    location="Test Crossing",
                ),
            ],
        )

        request = ReactionRequest(
            sessionId=self.session_id,
            npcId="bearJudge",
            currentDay=8,
            factions={
                "deerVillage": 0,
                "refugees": 0,
                "foxMarket": 0,
                "crowBrokers": 0,
                "bearCourt": 0,
            },
            resources={"silver": 0, "medicine": 0, "provisions": 0, "legalRisk": 0},
        )
        vector_store = FakeVectorStore(["public-rumor", "private-witness", "public-record"])
        resolution = resolve_candidate_memories_for_reaction(
            self.store,
            vector_store,
            request,
        )
        memories = resolution.memories
        reaction = build_npc_reaction("bearJudge", memories, {"bearCourt": 0})
        debug = candidate_resolution_debug(
            resolution,
            len(reaction.acceptedEvidence) + len(reaction.rejectedEvidence),
        )

        accepted_ids = {item.memoryId for item in reaction.acceptedEvidence}
        rejected_ids = {item.memoryId for item in reaction.rejectedEvidence}

        self.assertIn("public-record", accepted_ids)
        self.assertIn("public-rumor", rejected_ids)
        self.assertIn("private-witness", rejected_ids)
        self.assertEqual(debug.retrievalSource, "vector")
        self.assertEqual(debug.candidateCount, 3)

    def test_query_falls_back_to_sqlite_when_vector_returns_no_candidates(self):
        self.store.upsert_memories(
            self.session_id,
            [
                make_memory(
                    "public-record",
                    title="Public Record",
                    memory_type="record",
                    visibility="public",
                    reliability=0.91,
                    active=True,
                    source="Retrieval Test",
                    location="Test Crossing",
                )
            ],
        )

        request = QueryRequest(sessionId=self.session_id, activeOnly=True)
        vector_store = FakeVectorStore([])
        resolution = resolve_candidate_memories_for_query(self.store, vector_store, request)
        memories = resolution.memories
        debug = candidate_resolution_debug(resolution, len(memories))

        self.assertEqual([memory.memoryId for memory in memories], ["public-record"])
        self.assertEqual(debug.retrievalSource, "sqlite")
        self.assertEqual(debug.candidateCount, 0)
        self.assertEqual(debug.resolvedCandidateCount, 1)

    def test_query_falls_back_to_sqlite_when_vector_store_is_unavailable(self):
        self.store.upsert_memories(
            self.session_id,
            [
                make_memory(
                    "public-record",
                    title="Public Record",
                    memory_type="record",
                    visibility="public",
                    reliability=0.91,
                    active=True,
                    source="Retrieval Test",
                    location="Test Crossing",
                )
            ],
        )

        request = QueryRequest(sessionId=self.session_id, activeOnly=True)
        vector_store = FakeVectorStore(["public-record"], available=False)
        resolution = resolve_candidate_memories_for_query(self.store, vector_store, request)
        memories = resolution.memories
        debug = candidate_resolution_debug(resolution, len(memories))

        self.assertEqual([memory.memoryId for memory in memories], ["public-record"])
        self.assertEqual(debug.retrievalSource, "sqlite")
        self.assertEqual(debug.candidateCount, 0)


if __name__ == "__main__":
    unittest.main()
