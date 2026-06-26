import tempfile
import unittest
from pathlib import Path

from backend.app.embeddings import embedding_provider
from backend.app.retrieval import (
    _vector_query_limit,
    build_query_text,
    build_reaction_query_text,
    candidate_resolution_debug,
    resolve_candidate_memories_for_query,
    resolve_candidate_memories_for_reaction,
)
from backend.app.rules import build_npc_reaction, query_memories
from backend.app.schemas import QueryRequest, ReactionRequest
from backend.app.store import SQLiteSessionStore
from backend.app.vector_store import build_candidate_document
from backend.tests.helpers import make_memory


class FakeVectorStore:
    def __init__(self, candidate_ids, available=True):
        self.candidate_ids = candidate_ids
        self.available = available

    def query_candidate_memory_ids(self, session_id: str, query_text: str, n_results: int):
        if not self.available:
            return []
        return self.candidate_ids[:n_results]


class RecordingVectorStore(FakeVectorStore):
    def __init__(self, candidate_ids, available=True):
        super().__init__(candidate_ids, available)
        self.query_calls = []

    def query_candidate_memory_ids(self, session_id: str, query_text: str, n_results: int):
        self.query_calls.append(
            {
                "session_id": session_id,
                "query_text": query_text,
                "n_results": n_results,
            }
        )
        return super().query_candidate_memory_ids(session_id, query_text, n_results)


def dot_product(left, right):
    return sum(left_value * right_value for left_value, right_value in zip(left, right))


class RetrievalCandidateTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.session_id = "dev-session"
        self.store = SQLiteSessionStore(db_path=Path(self.temp_dir.name) / "test.db")

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_vector_query_limit_uses_default_cap_without_explicit_limit(self):
        self.assertEqual(_vector_query_limit(0), 0)
        self.assertEqual(_vector_query_limit(5), 5)
        self.assertEqual(_vector_query_limit(12), 8)
        self.assertEqual(_vector_query_limit(20, 3), 9)
        self.assertEqual(_vector_query_limit(20, 10), 20)

    def test_query_text_is_deterministic_and_uses_request_fields(self):
        query_text = build_query_text(
            QueryRequest(
                sessionId=self.session_id,
                npcId="bearJudge",
                activeOnly=True,
                visibility=["public"],
                sourceTypes=["record", "contract"],
                minReliability=0.7,
                tags=["court", "ledger"],
            )
        )

        self.assertEqual(
            query_text,
            "memory evidence retrieval npc Bear Judge bearCourt accepted record contract active true types record contract tags court ledger visibility public minimum 70",
        )

    def test_reaction_query_text_is_deterministic_and_uses_npc_context(self):
        query_text = build_reaction_query_text(
            ReactionRequest(
                sessionId=self.session_id,
                npcId="foxMerchant",
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
        )

        self.assertEqual(
            query_text,
            "reaction evidence day 8 npc Fox Merchant foxMarket accepted record contract rumor rejected song visibility public private minimum 55",
        )

    def test_candidate_document_is_deterministic_and_uses_authoritative_fields(self):
        document = build_candidate_document(
            make_memory(
                "market-contract",
                title="Market Contract",
                memory_type="contract",
                visibility="public",
                reliability=0.83,
                active=True,
                day=6,
                source="Fox Market Ledger",
                location="Fox Market",
            )
        )

        self.assertEqual(
            document,
            "Title: Market Contract\n"
            "Body: Market Contract text\n"
            "Day: 6\n"
            "Type: contract\n"
            "Source: Fox Market Ledger\n"
            "Source NPC: none\n"
            "Location: Fox Market\n"
            "Faction: none\n"
            "Visibility: public\n"
            "Reliability: 83\n"
            "Evidence Role: neutral\n"
            "Active: true\n"
            "Persistent: true\n"
            "Tags: test, contract",
        )

    def test_query_text_can_match_useful_non_body_fields(self):
        public_memory = make_memory(
            "public-record",
            title="Quiet Record",
            memory_type="record",
            visibility="public",
            reliability=0.88,
            active=True,
            day=8,
            source="Gate Archive",
            location="Deer Village Gate",
        )
        private_memory = make_memory(
            "private-record",
            title="Quiet Record",
            memory_type="record",
            visibility="private",
            reliability=0.88,
            active=True,
            day=8,
            source="Gate Archive",
            location="Deer Village Gate",
        )
        query_text = build_query_text(
            QueryRequest(
                sessionId=self.session_id,
                activeOnly=True,
                visibility=["public"],
                sourceTypes=["record"],
            )
        )

        query_embedding = embedding_provider.embed_query(query_text)
        public_score = dot_product(
            query_embedding,
            embedding_provider.embed_texts([build_candidate_document(public_memory)])[0],
        )
        private_score = dot_product(
            query_embedding,
            embedding_provider.embed_texts([build_candidate_document(private_memory)])[0],
        )

        self.assertGreater(public_score, private_score)

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
                make_memory(
                    "unused-song",
                    title="Unused Song",
                    memory_type="song",
                    visibility="public",
                    reliability=0.8,
                    active=True,
                    evidence_role="neutral",
                    source="Retrieval Test",
                    location="Test Crossing",
                ),
                make_memory(
                    "unused-song",
                    title="Unused Song",
                    memory_type="song",
                    visibility="public",
                    reliability=0.8,
                    active=True,
                    evidence_role="neutral",
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
                make_memory(
                    "unused-song",
                    title="Unused Song",
                    memory_type="song",
                    visibility="public",
                    reliability=0.8,
                    active=True,
                    evidence_role="neutral",
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

    def test_default_query_candidate_breadth_is_narrower_than_full_session(self):
        self.store.upsert_memories(
            self.session_id,
            [
                make_memory(
                    f"memory-{index}",
                    title=f"Memory {index}",
                    memory_type="record",
                    visibility="public",
                    reliability=0.8,
                    active=True,
                    day=8,
                    source=f"Source {index}",
                    location="Test Crossing",
                )
                for index in range(12)
            ],
        )

        request = QueryRequest(sessionId=self.session_id, activeOnly=True)
        vector_store = RecordingVectorStore([f"memory-{index}" for index in range(12)])
        resolution = resolve_candidate_memories_for_query(self.store, vector_store, request)

        self.assertEqual(vector_store.query_calls[0]["n_results"], 8)
        self.assertEqual(len(resolution.candidate_ids), 8)
        self.assertEqual(len(resolution.memories), 8)

    def test_explicit_request_limit_keeps_predictable_vector_breadth(self):
        self.store.upsert_memories(
            self.session_id,
            [
                make_memory(
                    f"memory-{index}",
                    title=f"Memory {index}",
                    memory_type="record",
                    visibility="public",
                    reliability=0.8,
                    active=True,
                    day=8,
                    source=f"Source {index}",
                    location="Test Crossing",
                )
                for index in range(15)
            ],
        )

        request = QueryRequest(sessionId=self.session_id, activeOnly=True, limit=3)
        vector_store = RecordingVectorStore([f"memory-{index}" for index in range(15)])
        resolution = resolve_candidate_memories_for_query(self.store, vector_store, request)

        self.assertEqual(vector_store.query_calls[0]["n_results"], 9)
        self.assertEqual(len(resolution.candidate_ids), 9)

    def test_nonpositive_query_limit_is_safely_empty(self):
        self.store.upsert_memories(
            self.session_id,
            [
                make_memory(
                    "memory-a",
                    title="Memory A",
                    memory_type="record",
                    visibility="public",
                    reliability=0.8,
                    active=True,
                    day=8,
                ),
                make_memory(
                    "memory-b",
                    title="Memory B",
                    memory_type="record",
                    visibility="public",
                    reliability=0.8,
                    active=True,
                    day=8,
                ),
            ],
        )

        request = QueryRequest(sessionId=self.session_id, activeOnly=True, limit=0)
        vector_store = RecordingVectorStore(["memory-a", "memory-b"])
        resolution = resolve_candidate_memories_for_query(self.store, vector_store, request)
        result = query_memories(resolution.memories, request)

        self.assertEqual(vector_store.query_calls[0]["n_results"], 0)
        self.assertEqual(resolution.candidate_ids, [])
        self.assertEqual(result, [])

    def test_query_result_order_does_not_follow_vector_candidate_order(self):
        self.store.upsert_memories(
            self.session_id,
            [
                make_memory(
                    "older-strong",
                    title="Older Strong Record",
                    memory_type="record",
                    visibility="public",
                    reliability=0.95,
                    active=True,
                    day=6,
                    source="Archive Ledger",
                ),
                make_memory(
                    "newer-strong",
                    title="Newer Strong Record",
                    memory_type="record",
                    visibility="public",
                    reliability=0.91,
                    active=True,
                    day=8,
                    source="Gate Clerk",
                ),
                make_memory(
                    "newer-weak",
                    title="Newer Weak Record",
                    memory_type="record",
                    visibility="public",
                    reliability=0.72,
                    active=True,
                    day=8,
                    source="Market Board",
                ),
            ],
        )

        request = QueryRequest(sessionId=self.session_id, activeOnly=True)
        vector_store = FakeVectorStore(["older-strong", "newer-weak", "newer-strong"])
        resolution = resolve_candidate_memories_for_query(self.store, vector_store, request)
        result = query_memories(resolution.memories, request)

        self.assertEqual(
            [memory.memoryId for memory in resolution.memories],
            ["older-strong", "newer-weak", "newer-strong"],
        )
        self.assertEqual(
            [item.memoryId for item in result],
            ["newer-strong", "newer-weak", "older-strong"],
        )

    def test_reaction_evidence_order_does_not_follow_vector_candidate_order(self):
        self.store.upsert_memories(
            self.session_id,
            [
                make_memory(
                    "accepted-older",
                    title="Accepted Older",
                    memory_type="song",
                    visibility="public",
                    reliability=0.94,
                    active=True,
                    day=7,
                    source="Old Ballad",
                ),
                make_memory(
                    "accepted-newer-low",
                    title="Accepted Newer Low",
                    memory_type="rumor",
                    visibility="public",
                    reliability=0.55,
                    active=True,
                    day=8,
                    source="Street Talk",
                ),
                make_memory(
                    "accepted-newer-high",
                    title="Accepted Newer High",
                    memory_type="short_term",
                    visibility="private",
                    reliability=0.92,
                    active=True,
                    day=8,
                    source="Fresh Witness",
                ),
                make_memory(
                    "rejected-older",
                    title="Rejected Older",
                    memory_type="record",
                    visibility="public",
                    reliability=0.9,
                    active=True,
                    day=6,
                    source="Court Archive",
                ),
                make_memory(
                    "rejected-newer",
                    title="Rejected Newer",
                    memory_type="contract",
                    visibility="private",
                    reliability=0.97,
                    active=True,
                    day=8,
                    source="Private Contract",
                ),
            ],
        )

        request = ReactionRequest(
            sessionId=self.session_id,
            npcId="crowBroker",
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
        vector_store = FakeVectorStore(
            [
                "rejected-older",
                "accepted-newer-low",
                "accepted-older",
                "rejected-newer",
                "accepted-newer-high",
            ]
        )
        resolution = resolve_candidate_memories_for_reaction(
            self.store,
            vector_store,
            request,
        )
        reaction = build_npc_reaction("crowBroker", resolution.memories, {"crowBrokers": 0})

        self.assertEqual(
            [memory.memoryId for memory in resolution.memories],
            [
                "rejected-older",
                "accepted-newer-low",
                "accepted-older",
                "rejected-newer",
                "accepted-newer-high",
            ],
        )
        self.assertEqual(
            [item.memoryId for item in reaction.acceptedEvidence],
            ["accepted-newer-high", "accepted-newer-low", "accepted-older"],
        )
        self.assertEqual(
            [item.memoryId for item in reaction.rejectedEvidence],
            ["rejected-newer", "rejected-older"],
        )

    def test_unresolved_vector_candidate_ids_are_dropped_before_rules_apply(self):
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
                make_memory(
                    "unused-song",
                    title="Unused Song",
                    memory_type="song",
                    visibility="public",
                    reliability=0.8,
                    active=True,
                    evidence_role="neutral",
                    source="Retrieval Test",
                    location="Test Crossing",
                ),
            ],
        )

        request = QueryRequest(sessionId=self.session_id, npcId="bearJudge", activeOnly=True)
        vector_store = FakeVectorStore(["missing-memory", "inactive-rumor", "public-record"])
        resolution = resolve_candidate_memories_for_query(self.store, vector_store, request)
        result = query_memories(resolution.memories, request)
        debug = candidate_resolution_debug(resolution, len(result))

        self.assertEqual(debug.retrievalSource, "vector")
        self.assertEqual(debug.candidateCount, 3)
        self.assertEqual(debug.resolvedCandidateCount, 2)
        self.assertEqual([memory.memoryId for memory in resolution.memories], ["inactive-rumor", "public-record"])
        self.assertEqual([item.memoryId for item in result], ["public-record"])
        self.assertEqual(debug.filteredEvidenceCount, 1)


if __name__ == "__main__":
    unittest.main()
