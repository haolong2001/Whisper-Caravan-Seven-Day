from __future__ import annotations

from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, Field


MemoryType = Literal["short_term", "record", "contract", "song", "rumor"]
MemoryVisibility = Literal["private", "public"]
EvidenceRole = Literal["incriminating", "favorable", "neutral"]
FactionKey = Literal["deerVillage", "refugees", "foxMarket", "crowBrokers", "bearCourt"]
NpcId = Literal["deerGuard", "foxMerchant", "crowBroker", "bearJudge"]


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
