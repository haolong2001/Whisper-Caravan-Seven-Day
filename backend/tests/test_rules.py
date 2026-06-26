import unittest

from backend.app.rules import build_npc_reaction, query_memories
from backend.app.schemas import BackendMemoryRecord, QueryRequest


def make_memory(
    memory_id: str,
    *,
    title: str,
    memory_type: str,
    visibility: str,
    reliability: float,
    active: bool,
    evidence_role: str = "neutral",
    source: str = "Test Source",
    day: int = 8,
    location: str = "Test Location",
):
    return BackendMemoryRecord(
        memoryId=memory_id,
        title=title,
        text=f"{title} text",
        day=day,
        type=memory_type,
        source=source,
        location=location,
        visibility=visibility,
        reliability=reliability,
        active=active,
        tags=["test", memory_type],
        evidenceRole=evidence_role,
        persistent=memory_type != "short_term",
    )


class DeterministicRuleTests(unittest.TestCase):
    def test_query_excludes_inactive_memories(self):
        memories = [
            make_memory(
                "active-record",
                title="Active Record",
                memory_type="record",
                visibility="public",
                reliability=0.9,
                active=True,
            ),
            make_memory(
                "inactive-short-term",
                title="Inactive Witness",
                memory_type="short_term",
                visibility="private",
                reliability=0.95,
                active=False,
            ),
        ]

        result = query_memories(memories, QueryRequest(sessionId="test-session", activeOnly=True))

        self.assertEqual([item.memoryId for item in result], ["active-record"])

    def test_bear_judge_rejects_unsupported_rumor_and_private_evidence(self):
        memories = [
            make_memory(
                "public-rumor",
                title="Market Rumor",
                memory_type="rumor",
                visibility="public",
                reliability=0.82,
                active=True,
                evidence_role="incriminating",
            ),
            make_memory(
                "private-witness",
                title="Hidden Witness",
                memory_type="short_term",
                visibility="private",
                reliability=0.95,
                active=True,
                evidence_role="incriminating",
            ),
            make_memory(
                "public-record",
                title="Helpful Receipt",
                memory_type="record",
                visibility="public",
                reliability=0.91,
                active=True,
                evidence_role="favorable",
            ),
        ]

        reaction = build_npc_reaction("bearJudge", memories, {"bearCourt": 0})

        accepted_ids = {item.memoryId for item in reaction.acceptedEvidence}
        rejected_reasons = {item.memoryId: item.decisionReason for item in reaction.rejectedEvidence}

        self.assertNotIn("public-rumor", accepted_ids)
        self.assertNotIn("private-witness", accepted_ids)
        self.assertIn("public-record", accepted_ids)
        self.assertEqual(rejected_reasons["public-rumor"], "Rejected as an unsupported rumor.")
        self.assertIn("cannot access private memories", rejected_reasons["private-witness"])

    def test_crow_broker_accepts_public_rumor(self):
        memories = [
            make_memory(
                "public-rumor",
                title="Road Rumor",
                memory_type="rumor",
                visibility="public",
                reliability=0.61,
                active=True,
                evidence_role="incriminating",
            )
        ]

        reaction = build_npc_reaction("crowBroker", memories, {"crowBrokers": 0})

        accepted_ids = [item.memoryId for item in reaction.acceptedEvidence]

        self.assertEqual(accepted_ids, ["public-rumor"])


if __name__ == "__main__":
    unittest.main()
