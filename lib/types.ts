export type ChoiceId = "A" | "B" | "C" | "D";

export type RunPhase =
  | "loop_one"
  | "collapse_one"
  | "loop_two"
  | "collapse_two"
  | "trial"
  | "ending";

export type MemoryType = "short_term" | "record" | "contract" | "song" | "rumor";

export type MemoryVisibility = "private" | "public";

export type EvidenceRole = "incriminating" | "favorable" | "neutral";

export type FactionKey =
  | "deerVillage"
  | "refugees"
  | "foxMarket"
  | "crowBrokers"
  | "bearCourt";

export type NpcId = "deerGuard" | "foxMerchant" | "crowBroker" | "bearJudge";

export type StoryNpcId =
  | "villageApothecary"
  | "campHealer"
  | "foxLedgerMaster"
  | "royalTaxOfficer"
  | "crowBrokerNarrator"
  | "bearJudgeAuthority";

export type RouteTag = "truth" | "merchant" | "rumor" | "failure";

export type EndingId = "A1" | "A2" | "B" | "C" | "D";

export type EndingRoute = "truth" | "merchant" | "rumor" | "failure";

export type FactionState = Record<FactionKey, number>;

export type GameResources = {
  silver: number;
  medicine: number;
  provisions: number;
  legalRisk: number;
};

export type MemoryEffect = {
  title: string;
  text: string;
  type: MemoryType;
  visibility: MemoryVisibility;
  location: string;
  source?: string;
  sourceNpcId?: string;
  faction?: FactionKey;
  reliability: number;
  evidenceRole: EvidenceRole;
  tags?: string[];
  persistent?: boolean;
};

export type FactionEffect = {
  faction: FactionKey;
  delta: number;
};

export type ResourceEffects = Partial<GameResources>;

export type Choice = {
  id: ChoiceId;
  label: string;
  description: string;
  outcomeText: string;
  memoryEffects: MemoryEffect[];
  factionEffects: FactionEffect[];
  resourceEffects?: ResourceEffects;
};

export type GameEvent = {
  id: string;
  day: number;
  location: string;
  title: string;
  description: string;
  choices: Choice[];
};

export type StoryScene = GameEvent & {
  phase: Extract<RunPhase, "loop_one" | "loop_two">;
  involvedNpcIds?: StoryNpcId[];
  routeTags?: RouteTag[];
  dayOptions?: number[];
  selectionBucket?: "anchor" | "early" | "late";
  isAnchor?: boolean;
};

export type MemoryItem = {
  id: string;
  title: string;
  text: string;
  type: MemoryType;
  visibility: MemoryVisibility;
  location: string;
  source: string;
  sourceNpcId?: string;
  faction?: FactionKey;
  createdDay: number;
  expiresOn?: number;
  persistent: boolean;
  active: boolean;
  reliability: number;
  evidenceRole: EvidenceRole;
  tags: string[];
};

export type GameEffects = {
  trustDelta: number;
  priceModifier: number;
  questAvailable: boolean;
  legalRiskDelta: number;
};

export type RetrievalDebug = {
  retrievalSource: "vector" | "sqlite";
  candidateCount?: number;
  resolvedCandidateCount?: number;
  filteredEvidenceCount?: number;
};

export type EvidenceMetadata = {
  day: number;
  source: string;
  sourceNpcId?: string;
  location: string;
  faction?: FactionKey;
  active: boolean;
  expiresOnDay?: number;
  tags: string[];
  persistent: boolean;
};

export type RetrievedEvidence = {
  memoryId: string;
  title: string;
  text: string;
  reliability: number;
  sourceType: MemoryType;
  evidenceRole: EvidenceRole;
  visibility: MemoryVisibility;
  metadata: EvidenceMetadata;
};

export type NPCProfile = {
  id: NpcId;
  name: string;
  faction: FactionKey;
  acceptedMemoryTypes: MemoryType[];
  rejectedMemoryTypes: MemoryType[];
  visibleMemoryScopes: MemoryVisibility[];
  minReliability: number;
};

export type StoryNpcProfile = {
  id: StoryNpcId;
  name: string;
  role: string;
  homeLocation: string;
  faction?: FactionKey;
};

export type EvaluatedEvidence = RetrievedEvidence & {
  decision: "accepted" | "rejected";
  decisionReason: string;
};

export type NpcReaction = {
  profile: NPCProfile;
  dialogue: string;
  effects: GameEffects;
  acceptedEvidence: EvaluatedEvidence[];
  rejectedEvidence: EvaluatedEvidence[];
  debug?: RetrievalDebug;
};

export type BackendMemoryRecord = {
  memoryId: string;
  title: string;
  text: string;
  day: number;
  type: MemoryType;
  source: string;
  sourceNpcId?: string;
  location: string;
  faction?: FactionKey;
  visibility: MemoryVisibility;
  reliability: number;
  active: boolean;
  expiresOnDay?: number;
  tags: string[];
  evidenceRole: EvidenceRole;
  persistent: boolean;
};

export type MemoryQueryRequest = {
  npcId?: NpcId;
  activeOnly?: boolean;
  visibility?: MemoryVisibility[];
  sourceTypes?: MemoryType[];
  minReliability?: number;
  tags?: string[];
  limit?: number;
};

export type MemoryQueryResult = {
  evidence: RetrievedEvidence[];
  debug?: RetrievalDebug;
};

export type SceneChoiceRecord = {
  sceneId: string;
  choiceId: ChoiceId;
  choiceLabel: string;
  outcomeText: string;
};

export type CollapseCheckpoint = {
  phase: Extract<RunPhase, "collapse_one" | "collapse_two">;
  day: number;
  nextDay: number;
  location: string;
  title: string;
  description: string;
};

export type PhaseCard = {
  phase: Extract<RunPhase, "trial" | "ending">;
  day: number;
  location: string;
  title: string;
  description: string;
};

export type EndingOutcomeDefinition = {
  id: EndingId;
  route: EndingRoute;
  title: string;
  verdictLabel: string;
  summary: string;
  text: string;
};

export type RumorConflict = {
  id: string;
  title: string;
  reason: string;
  memoryIds: string[];
};

export type TrialScoreThresholds = {
  fullTruth: number;
  partialTruth: number;
  merchantSettlement: number;
  publicSympathy: number;
  overwhelmingFailure: number;
  maxFailureForFullTruth: number;
  maxFailureForPartialTruth: number;
  maxFailureForMerchant: number;
  maxFailureForFolkHero: number;
};

export type TrialScoreModifiers = {
  bearCourtModifier: number;
  foxMarketModifier: number;
  refugeeModifier: number;
  crowModifier: number;
  deerVillageModifier: number;
  legalRiskModifier: number;
};

export type TrialResult = {
  legalTruthScore: number;
  merchantSettlementScore: number;
  publicSympathyScore: number;
  failurePressure: number;
  selectedEndingId: EndingId;
  endingRoute: EndingRoute;
  outcome: EndingOutcomeDefinition;
  acceptedEvidence: EvaluatedEvidence[];
  rejectedEvidence: EvaluatedEvidence[];
  expiredMemories: MemoryItem[];
  rumorConflicts: RumorConflict[];
  thresholds: TrialScoreThresholds;
  modifiers: TrialScoreModifiers;
  debugLines: string[];
};

export type GameState = {
  phase: RunPhase;
  currentDay: number;
  currentSceneIndex: number | null;
  scenePlan: StoryScene[];
  memories: MemoryItem[];
  factions: FactionState;
  resources: GameResources;
  sceneChoices: Partial<Record<string, SceneChoiceRecord>>;
  sceneStatus: string;
};

export type MemoryCollapsePreview = {
  expiringOnNextDay: MemoryItem[];
  persistingMemories: MemoryItem[];
  persistentPublicEvidence: RetrievedEvidence[];
};
