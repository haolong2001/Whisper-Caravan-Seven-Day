import json
import os
import unittest
from pathlib import Path
import tempfile

from fastapi.testclient import TestClient

import backend.app.main as main_module
import backend.app.dialogue_provider as dialogue_provider_module
from backend.app.main import app
from backend.app.store import SQLiteSessionStore
from backend.app.schemas import StructuredReactionRequest
from backend.app.structured_reaction import (
    build_fake_structured_reaction,
    build_retrieval_backed_structured_reaction,
    clamp_legal_risk_delta,
    clamp_price_modifier,
    clamp_trust_delta,
    get_accessible_reaction_memories,
    sanitize_evidence_entries,
    sanitize_route_unlocks,
    sanitize_structured_reaction,
)
from backend.tests.helpers import make_memory


class FakeVectorStore:
    def __init__(self, candidate_ids):
        self.candidate_ids = candidate_ids

    def query_candidate_memory_ids(self, session_id: str, query_text: str, n_results: int):
        return self.candidate_ids[:n_results]


class StructuredReactionTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.temp_dir = tempfile.TemporaryDirectory()
        self.original_store = main_module.store
        self.original_vector_store = main_module.vector_store
        self.original_llm_provider = os.environ.get("WHISPER_CARAVAN_LLM_PROVIDER")
        self.original_llm_stub_response = os.environ.get("WHISPER_CARAVAN_LLM_STUB_RESPONSE")
        self.original_gemini_api_key = os.environ.get("GEMINI_API_KEY")
        self.original_gemini_model = os.environ.get("WHISPER_CARAVAN_GEMINI_MODEL")
        self.original_gemini_transport = dialogue_provider_module.gemini_transport
        self.store = SQLiteSessionStore(db_path=Path(self.temp_dir.name) / "structured_reactions.db")
        main_module.store = self.store
        main_module.vector_store = FakeVectorStore([])
        os.environ.pop("WHISPER_CARAVAN_LLM_PROVIDER", None)
        os.environ.pop("WHISPER_CARAVAN_LLM_STUB_RESPONSE", None)
        os.environ.pop("GEMINI_API_KEY", None)
        os.environ.pop("WHISPER_CARAVAN_GEMINI_MODEL", None)

    def tearDown(self):
        main_module.store = self.original_store
        main_module.vector_store = self.original_vector_store
        dialogue_provider_module.gemini_transport = self.original_gemini_transport
        if self.original_llm_provider is None:
            os.environ.pop("WHISPER_CARAVAN_LLM_PROVIDER", None)
        else:
            os.environ["WHISPER_CARAVAN_LLM_PROVIDER"] = self.original_llm_provider
        if self.original_llm_stub_response is None:
            os.environ.pop("WHISPER_CARAVAN_LLM_STUB_RESPONSE", None)
        else:
            os.environ["WHISPER_CARAVAN_LLM_STUB_RESPONSE"] = self.original_llm_stub_response
        if self.original_gemini_api_key is None:
            os.environ.pop("GEMINI_API_KEY", None)
        else:
            os.environ["GEMINI_API_KEY"] = self.original_gemini_api_key
        if self.original_gemini_model is None:
            os.environ.pop("WHISPER_CARAVAN_GEMINI_MODEL", None)
        else:
            os.environ["WHISPER_CARAVAN_GEMINI_MODEL"] = self.original_gemini_model
        self.temp_dir.cleanup()

    def make_request(self, npc_id="fox_ledger_master", **overrides):
        payload = {
            "npc_id": npc_id,
            "session_id": None,
            "player_input": "Show me what you know about the medicine.",
            "day": 9,
            "route": "truth",
            "known_memory_ids": [],
            "game_state_summary": {
                "trust": {},
                "legal_risk": 2,
                "silver": 8,
                "flags": [],
                "unlocked_routes": [],
            },
        }
        payload.update(overrides)
        return payload

    def test_backend_structured_clamps_match_frontend_ranges(self):
        self.assertEqual(clamp_trust_delta(99), 10)
        self.assertEqual(clamp_trust_delta(-99), -10)
        self.assertEqual(clamp_legal_risk_delta(99), 8)
        self.assertEqual(clamp_legal_risk_delta(-99), -8)
        self.assertEqual(clamp_price_modifier(10), 1.25)
        self.assertEqual(clamp_price_modifier(0.1), 0.75)

    def test_invalid_route_unlocks_and_evidence_entries_are_rejected(self):
        self.assertEqual(
            sanitize_route_unlocks(["truth", "merchant", "bad", "truth", None]),
            ["truth", "merchant"],
        )
        self.assertEqual(
            sanitize_evidence_entries(
                [
                    {
                        "memory_id": "ledger_001",
                        "title": "Ledger",
                        "type": "record",
                        "reliability": 1.4,
                        "relevance": -0.2,
                    },
                    {
                        "memory_id": "",
                        "title": "Broken",
                        "type": "record",
                        "reliability": 0.5,
                        "relevance": 0.5,
                    },
                ]
            )[0].model_dump(),
            {
                "memory_id": "ledger_001",
                "title": "Ledger",
                "type": "record",
                "reliability": 1.0,
                "relevance": 0.0,
            },
        )

    def test_structured_sanitizer_clamps_backend_output(self):
        request = StructuredReactionRequest.model_validate(self.make_request("crow_broker"))
        reaction = sanitize_structured_reaction(
            {
                "npc_id": "crow_broker",
                "dialogue": "The road is ready.",
                "tone": "friendly",
                "trust_delta": 99,
                "legal_risk_delta": -99,
                "price_modifier": 7,
                "quest_available": True,
                "route_unlocks": ["rumor", "wrong"],
                "evidence": [
                    {
                        "memory_id": "broadside_001",
                        "title": "Crow Broadside",
                        "type": "rumor",
                        "reliability": 5,
                        "relevance": -1,
                    }
                ],
                "memory_refs": ["broadside_001", ""],
                "flags_set": ["crow_broker_heard", ""],
            },
            request,
        )

        self.assertEqual(reaction.trust_delta, 10)
        self.assertEqual(reaction.legal_risk_delta, -8)
        self.assertEqual(reaction.price_modifier, 1.25)
        self.assertEqual(reaction.route_unlocks, ["rumor"])
        self.assertEqual(reaction.evidence[0].reliability, 1.0)
        self.assertEqual(reaction.evidence[0].relevance, 0.0)

    def test_backend_endpoint_returns_structured_reaction_for_each_v06_npc(self):
        for npc_id in [
            "fox_ledger_master",
            "crow_broker",
            "camp_healer",
            "village_apothecary",
        ]:
            response = self.client.post("/npc/reaction", json=self.make_request(npc_id))

            self.assertEqual(response.status_code, 200)
            payload = response.json()
            self.assertEqual(payload["npc_id"], npc_id)
            self.assertIsInstance(payload["dialogue"], str)
            self.assertIn("tone", payload)
            self.assertIn("evidence", payload)
            self.assertIn("memory_refs", payload)

    def test_unknown_npc_uses_safe_fallback(self):
        response = self.client.post("/npc/reaction", json=self.make_request("unknown_npc"))

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["npc_id"], "unknown_npc")
        self.assertEqual(payload["trust_delta"], 0)
        self.assertEqual(payload["legal_risk_delta"], 0)
        self.assertEqual(payload["evidence"], [])

    def test_fake_backend_reaction_uses_known_memory_context(self):
        request = StructuredReactionRequest.model_validate(
            self.make_request(
                "fox_ledger_master",
                route="merchant",
                known_memory_ids=["market_ledger_003"],
            )
        )

        reaction = build_fake_structured_reaction(request)

        self.assertEqual(reaction.evidence[0].memory_id, "market_ledger_003")
        self.assertEqual(reaction.route_unlocks, ["merchant"])
        self.assertTrue(reaction.quest_available)

    def test_inactive_memories_do_not_appear_in_accessible_reaction_memories(self):
        request = StructuredReactionRequest.model_validate(self.make_request("camp_healer"))
        memories = [
            make_memory(
                "inactive_medical_note",
                title="Camp Medical Note",
                memory_type="record",
                visibility="public",
                reliability=0.9,
                active=False,
                location="River Refugee Camp",
                source="Camp Healer Ledger",
                tags=["camp", "medical", "refugee"],
            ),
            make_memory(
                "active_medical_note",
                title="Camp Medical Note",
                memory_type="record",
                visibility="public",
                reliability=0.9,
                active=True,
                location="River Refugee Camp",
                source="Camp Healer Ledger",
                tags=["camp", "medical", "refugee"],
            ),
        ]

        accessible = get_accessible_reaction_memories(request, memories)

        self.assertEqual([memory.memoryId for memory in accessible], ["active_medical_note"])

    def test_permission_filtering_rejects_out_of_scope_memories(self):
        request = StructuredReactionRequest.model_validate(self.make_request("fox_ledger_master"))
        memories = [
            make_memory(
                "fox_receipt",
                title="Fox Market Receipt",
                memory_type="record",
                visibility="public",
                reliability=0.88,
                active=True,
                location="Fox Market",
                source="Fox Ledger Office",
                tags=["fox", "market", "receipt"],
            ),
            make_memory(
                "camp_song",
                title="Camp Song",
                memory_type="song",
                visibility="public",
                reliability=0.91,
                active=True,
                location="River Refugee Camp",
                source="Night Chorus",
                tags=["camp", "song", "refugee"],
            ),
        ]

        accessible = get_accessible_reaction_memories(request, memories)

        self.assertEqual([memory.memoryId for memory in accessible], ["fox_receipt"])

    def test_evidence_conversion_and_known_npc_retrieval_behavior(self):
        request = StructuredReactionRequest.model_validate(
            self.make_request(
                "village_apothecary",
                route="truth",
                player_input="Do you have inventory proof from Deer Village?",
            )
        )
        memories = [
            make_memory(
                "inventory_002",
                title="Incomplete Medicine Inventory",
                memory_type="record",
                visibility="public",
                reliability=0.89,
                active=True,
                location="Deer Village",
                source="Village Apothecary Ledger",
                tags=["deer", "village", "inventory", "medicine"],
                evidence_role="favorable",
            ),
            make_memory(
                "gate_gossip",
                title="Gate Gossip",
                memory_type="rumor",
                visibility="public",
                reliability=0.7,
                active=True,
                location="Village Gate",
                source="Passing Traders",
                tags=["gossip"],
            ),
        ]

        reaction = build_retrieval_backed_structured_reaction(request, memories)

        self.assertEqual(reaction.evidence[0].memory_id, "inventory_002")
        self.assertEqual(reaction.evidence[0].type, "inventory")
        self.assertEqual(reaction.memory_refs, ["inventory_002"])
        self.assertEqual(reaction.route_unlocks, ["truth"])
        self.assertLess(reaction.legal_risk_delta, 1)

    def test_endpoint_uses_retrieval_backed_memories_when_session_is_available(self):
        session_id = "structured-session"
        self.store.upsert_memories(
            session_id,
            [
                make_memory(
                    "market_ledger_001",
                    title="Fox Market Receipt",
                    memory_type="record",
                    visibility="public",
                    reliability=0.91,
                    active=True,
                    location="Fox Market",
                    source="Fox Ledger Office",
                    tags=["fox", "market", "receipt", "ledger"],
                    evidence_role="favorable",
                ),
                make_memory(
                    "inactive_ledger",
                    title="Old Fox Ledger",
                    memory_type="record",
                    visibility="public",
                    reliability=0.93,
                    active=False,
                    location="Fox Market",
                    source="Fox Ledger Office",
                    tags=["fox", "market", "ledger"],
                ),
            ],
        )
        main_module.vector_store = FakeVectorStore(["market_ledger_001", "inactive_ledger"])

        response = self.client.post(
            "/npc/reaction",
            json=self.make_request(
                "fox_ledger_master",
                session_id=session_id,
                route="merchant",
                known_memory_ids=["market_ledger_001"],
                player_input="Show me the ledger or receipt.",
            ),
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["memory_refs"], ["market_ledger_001"])
        self.assertEqual(payload["evidence"][0]["memory_id"], "market_ledger_001")
        self.assertEqual(payload["route_unlocks"], ["merchant"])

    def test_endpoint_without_session_id_still_uses_safe_fallback(self):
        response = self.client.post("/npc/reaction", json=self.make_request("camp_healer"))

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["npc_id"], "camp_healer")
        self.assertTrue(len(payload["memory_refs"]) >= 1)

    def test_dialogue_generation_falls_back_without_provider_config(self):
        response = self.client.post("/npc/reaction", json=self.make_request("crow_broker"))

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["tone"], "guarded")
        self.assertIn("There is no market in silence", payload["dialogue"])

    def test_invalid_generated_tone_does_not_break_endpoint(self):
        os.environ["WHISPER_CARAVAN_LLM_PROVIDER"] = "stub"
        os.environ["WHISPER_CARAVAN_LLM_STUB_RESPONSE"] = json.dumps(
            {
                "dialogue": "Generated dialogue that should be ignored.",
                "tone": "wild",
                "public_reason": "Generated reason",
            }
        )

        response = self.client.post("/npc/reaction", json=self.make_request("camp_healer"))

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["tone"], "sympathetic")
        self.assertIn("camp remembers", payload["dialogue"])

    def test_valid_generated_dialogue_only_overrides_tone_and_dialogue(self):
        os.environ["WHISPER_CARAVAN_LLM_PROVIDER"] = "stub"
        os.environ["WHISPER_CARAVAN_LLM_STUB_RESPONSE"] = json.dumps(
            {
                "dialogue": "Generated grounded dialogue about the ledger.",
                "tone": "friendly",
                "public_reason": "Generated public reason",
            }
        )
        session_id = "llm-override-session"
        self.store.upsert_memories(
            session_id,
            [
                make_memory(
                    "market_ledger_001",
                    title="Fox Market Receipt",
                    memory_type="record",
                    visibility="public",
                    reliability=0.91,
                    active=True,
                    location="Fox Market",
                    source="Fox Ledger Office",
                    tags=["fox", "market", "receipt", "ledger"],
                    evidence_role="favorable",
                )
            ],
        )
        main_module.vector_store = FakeVectorStore(["market_ledger_001"])

        response = self.client.post(
            "/npc/reaction",
            json=self.make_request(
                "fox_ledger_master",
                session_id=session_id,
                route="merchant",
                known_memory_ids=["market_ledger_001"],
                player_input="Show me the ledger or receipt.",
            ),
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["dialogue"], "Generated grounded dialogue about the ledger.")
        self.assertEqual(payload["tone"], "friendly")
        self.assertEqual(payload["memory_refs"], ["market_ledger_001"])
        self.assertEqual(payload["route_unlocks"], ["merchant"])
        self.assertEqual(payload["trust_delta"], 3)
        self.assertEqual(payload["legal_risk_delta"], -2)
        self.assertAlmostEqual(payload["price_modifier"], 0.93, places=6)
        self.assertEqual(payload["flags_set"], ["fox_ledger_seen"])
        self.assertEqual(payload["evidence"][0]["memory_id"], "market_ledger_001")
        self.assertEqual(payload["explanation"]["public_reason"], "Generated public reason")

    def test_gemini_provider_without_api_key_falls_back_safely(self):
        os.environ["WHISPER_CARAVAN_LLM_PROVIDER"] = "gemini"

        response = self.client.post("/npc/reaction", json=self.make_request("crow_broker"))

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["tone"], "guarded")
        self.assertIn("There is no market in silence", payload["dialogue"])

    def test_gemini_provider_failure_falls_back_safely(self):
        os.environ["WHISPER_CARAVAN_LLM_PROVIDER"] = "gemini"
        os.environ["GEMINI_API_KEY"] = "test-key"

        def failing_transport(url: str, api_key: str, payload: dict):
            raise OSError("network unavailable")

        dialogue_provider_module.gemini_transport = failing_transport

        response = self.client.post("/npc/reaction", json=self.make_request("camp_healer"))

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["tone"], "sympathetic")
        self.assertIn("camp remembers", payload["dialogue"])

    def test_valid_gemini_dialogue_only_overrides_presentation_fields(self):
        os.environ["WHISPER_CARAVAN_LLM_PROVIDER"] = "gemini"
        os.environ["GEMINI_API_KEY"] = "test-key"
        os.environ["WHISPER_CARAVAN_GEMINI_MODEL"] = "gemini-test-model"
        session_id = "gemini-override-session"
        self.store.upsert_memories(
            session_id,
            [
                make_memory(
                    "market_ledger_001",
                    title="Fox Market Receipt",
                    memory_type="record",
                    visibility="public",
                    reliability=0.91,
                    active=True,
                    location="Fox Market",
                    source="Fox Ledger Office",
                    tags=["fox", "market", "receipt", "ledger"],
                    evidence_role="favorable",
                )
            ],
        )
        main_module.vector_store = FakeVectorStore(["market_ledger_001"])
        captured = {}

        def fake_transport(url: str, api_key: str, payload: dict):
            captured["url"] = url
            captured["api_key"] = api_key
            captured["payload"] = payload
            return {
                "candidates": [
                    {
                        "content": {
                            "parts": [
                                {
                                    "text": json.dumps(
                                        {
                                            "dialogue": "The receipt holds. I can speak to that without flinching.",
                                            "tone": "friendly",
                                            "public_reason": "The ledger now supports your claim.",
                                            "trust_delta": 99,
                                        }
                                    )
                                }
                            ]
                        }
                    }
                ]
            }

        dialogue_provider_module.gemini_transport = fake_transport

        response = self.client.post(
            "/npc/reaction",
            json=self.make_request(
                "fox_ledger_master",
                session_id=session_id,
                route="merchant",
                known_memory_ids=["market_ledger_001"],
                player_input="Show me the ledger or receipt.",
            ),
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertIn("gemini-test-model:generateContent", captured["url"])
        self.assertEqual(captured["api_key"], "test-key")
        self.assertEqual(
            captured["payload"]["generationConfig"]["responseMimeType"], "application/json"
        )
        self.assertEqual(payload["dialogue"], "The receipt holds. I can speak to that without flinching.")
        self.assertEqual(payload["tone"], "friendly")
        self.assertEqual(payload["memory_refs"], ["market_ledger_001"])
        self.assertEqual(payload["route_unlocks"], ["merchant"])
        self.assertEqual(payload["trust_delta"], 3)
        self.assertEqual(payload["legal_risk_delta"], -2)
        self.assertAlmostEqual(payload["price_modifier"], 0.93, places=6)
        self.assertEqual(payload["flags_set"], ["fox_ledger_seen"])
        self.assertEqual(payload["evidence"][0]["memory_id"], "market_ledger_001")
        self.assertEqual(payload["explanation"]["public_reason"], "The ledger now supports your claim.")


if __name__ == "__main__":
    unittest.main()
