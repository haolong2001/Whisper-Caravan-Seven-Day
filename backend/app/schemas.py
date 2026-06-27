from __future__ import annotations

from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, Field


MemoryType = Literal["short_term", "record", "contract", "song", "rumor"]
MemoryVisibility = Literal["private", "public"]
EvidenceRole = Literal["incriminating", "favorable", "neutral"]
FactionKey = Literal["deerVillage", "refugees", "foxMarket", "crowBrokers", "bearCourt"]
NpcId = Literal["deerGuard", "foxMerchant", "crowBroker", "bearJudge"]
RouteUnlock = Literal["truth", "merchant", "rumor", "failure"]
NPCReactionTone = Literal[
    "friendly",
    "guarded",
    "fearful",
    "hostile",
    "sympathetic",
    "evasive",
]
EvidenceSummaryType = Literal[
    "record",
    "testimony",
    "rumor",
    "contradiction",
    "receipt",
    "law",
    "inventory",
    "medical",
]


class EvidenceMetadata(BaseModel):
    day: int
    source: str
    sourceNpcId: Optional[str] = None
    location: str
    faction: Optional[FactionKey] = None
    active: bool
    expiresOnDay: Optional[int] = None
    tags: List[str] = Field(default_factory=list)
    persistent: bool


class BackendMemoryRecord(BaseModel):
    memoryId: str
    title: str
    text: str
    day: int
    type: MemoryType
    source: str
    sourceNpcId: Optional[str] = None
    location: str
    faction: Optional[FactionKey] = None
    visibility: MemoryVisibility
    reliability: float
    active: bool
    expiresOnDay: Optional[int] = None
    tags: List[str] = Field(default_factory=list)
    evidenceRole: EvidenceRole
    persistent: bool


class RetrievedEvidence(BaseModel):
    memoryId: str
    title: str
    text: str
    reliability: float
    sourceType: MemoryType
    evidenceRole: EvidenceRole
    visibility: MemoryVisibility
    metadata: EvidenceMetadata


class EvaluatedEvidence(RetrievedEvidence):
    decision: Literal["accepted", "rejected"]
    decisionReason: str


class NPCProfile(BaseModel):
    id: NpcId
    name: str
    faction: FactionKey
    acceptedMemoryTypes: List[MemoryType]
    rejectedMemoryTypes: List[MemoryType]
    visibleMemoryScopes: List[MemoryVisibility]
    minReliability: float


class GameEffects(BaseModel):
    trustDelta: int
    priceModifier: float
    questAvailable: bool
    legalRiskDelta: int


class RetrievalDebug(BaseModel):
    retrievalSource: Literal["vector", "sqlite"]
    candidateCount: Optional[int] = None
    resolvedCandidateCount: Optional[int] = None
    filteredEvidenceCount: Optional[int] = None


class NpcReaction(BaseModel):
    profile: NPCProfile
    dialogue: str
    effects: GameEffects
    acceptedEvidence: List[EvaluatedEvidence]
    rejectedEvidence: List[EvaluatedEvidence]
    debug: Optional[RetrievalDebug] = None


class IngestRequest(BaseModel):
    sessionId: str
    memories: List[BackendMemoryRecord]


class IngestResponse(BaseModel):
    sessionId: str
    ingestedCount: int


class QueryRequest(BaseModel):
    sessionId: str
    npcId: Optional[NpcId] = None
    activeOnly: bool = True
    visibility: Optional[List[MemoryVisibility]] = None
    sourceTypes: Optional[List[MemoryType]] = None
    minReliability: Optional[float] = None
    tags: Optional[List[str]] = None
    limit: Optional[int] = None


class QueryResponse(BaseModel):
    evidence: List[RetrievedEvidence]
    debug: Optional[RetrievalDebug] = None


class ReactionRequest(BaseModel):
    sessionId: str
    npcId: NpcId
    currentDay: int
    factions: Dict[FactionKey, int]
    resources: Dict[str, int]


class ReactionGameStateSummary(BaseModel):
    trust: Optional[Dict[str, int]] = None
    legal_risk: Optional[int] = None
    silver: Optional[int] = None
    flags: List[str] = Field(default_factory=list)
    unlocked_routes: List[str] = Field(default_factory=list)


class StructuredReactionRequest(BaseModel):
    npc_id: str
    session_id: Optional[str] = None
    player_input: str
    day: int
    route: Optional[str] = None
    known_memory_ids: List[str] = Field(default_factory=list)
    game_state_summary: ReactionGameStateSummary = Field(default_factory=ReactionGameStateSummary)


class EvidenceSummary(BaseModel):
    memory_id: str
    title: str
    type: EvidenceSummaryType
    reliability: float
    relevance: float


class StructuredReactionExplanation(BaseModel):
    public_reason: str
    debug_reason: Optional[str] = None


class StructuredNpcReaction(BaseModel):
    npc_id: str
    dialogue: str
    tone: NPCReactionTone
    trust_delta: int
    legal_risk_delta: int
    price_modifier: Optional[float] = None
    quest_available: Optional[bool] = None
    route_unlocks: List[RouteUnlock] = Field(default_factory=list)
    evidence: List[EvidenceSummary] = Field(default_factory=list)
    memory_refs: List[str] = Field(default_factory=list)
    flags_set: List[str] = Field(default_factory=list)
    explanation: Optional[StructuredReactionExplanation] = None
