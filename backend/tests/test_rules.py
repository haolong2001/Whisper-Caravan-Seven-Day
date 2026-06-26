import unittest

from backend.app.rules import build_npc_reaction, query_memories
from backend.app.schemas import QueryRequest
from backend.tests.helpers import make_memory


class DeterministicRuleTests(unittest.TestCase):
    def test_query_returns_deterministic_evidence_order(self):
        memories = [
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
            make_memory(
                "newer-same-fields-b",
                title="Shared Title",
                memory_type="record",
                visibility="public",
                reliability=0.72,
                active=True,
                day=8,
                source="Shared Source",
            ),
            make_memory(
                "newer-same-fields-a",
                title="Shared Title",
                memory_type="record",
                visibility="public",
                reliability=0.72,
                active=True,
                day=8,
                source="Shared Source",
            ),
        ]

        result = query_memories(memories, QueryRequest(sessionId="test-session", activeOnly=True))

        self.assertEqual(
            [item.memoryId for item in result],
            [
                "newer-strong",
                "newer-weak",
                "newer-same-fields-a",
                "newer-same-fields-b",
                "older-strong",
            ],
        )

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

    def test_reaction_lists_are_sorted_within_accepted_and_rejected_groups(self):
        memories = [
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
        ]

        reaction = build_npc_reaction("crowBroker", memories, {"crowBrokers": 0})

        self.assertEqual(
            [item.memoryId for item in reaction.acceptedEvidence],
            ["accepted-newer-high", "accepted-newer-low", "accepted-older"],
        )
        self.assertEqual(
            [item.memoryId for item in reaction.rejectedEvidence],
            ["rejected-newer", "rejected-older"],
        )


if __name__ == "__main__":
    unittest.main()
