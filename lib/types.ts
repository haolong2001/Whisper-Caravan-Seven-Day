export type ChoiceId = "A" | "B" | "C" | "D";

export type MemoryType = "short_term" | "record" | "song" | "rumor";

export type MemoryVisibility = "private" | "public";

export type EvidenceRole = "incriminating" | "favorable" | "neutral";

export type FactionKey =
  | "deerVillage"
  | "refugees"
  | "foxMarket"
  | "crowBrokers"
  | "bearCourt";

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
  reliability: number;
  evidenceRole: EvidenceRole;
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

export type MemoryItem = {
  id: string;
  title: string;
  text: string;
  type: MemoryType;
  visibility: MemoryVisibility;
  location: string;
  createdDay: number;
  expiresOn?: number;
  persistent: boolean;
  active: boolean;
  reliability: number;
  evidenceRole: EvidenceRole;
};

export type GameEffects = {
  trustDelta: number;
  priceModifier: number;
  questAvailable: boolean;
  legalRiskDelta: number;
};

export type RetrievedEvidence = {
  memoryId: string;
  title: string;
  text: string;
  reliability: number;
  sourceType: Exclude<MemoryType, "short_term">;
  evidenceRole: EvidenceRole;
};

export type BearCourtPreview = {
  acceptedEvidence: RetrievedEvidence[];
  rejectedEvidence: RetrievedEvidence[];
};

export type NpcReaction = {
  dialogue: string;
  effects: GameEffects;
  evidence: RetrievedEvidence[];
  bearCourtPreview?: BearCourtPreview;
};

export type DailyChoiceRecord = {
  eventId: string;
  choiceId: ChoiceId;
  choiceLabel: string;
  outcomeText: string;
};

export type GameState = {
  currentDay: number;
  memories: MemoryItem[];
  factions: FactionState;
  resources: GameResources;
  dayChoices: Partial<Record<number, DailyChoiceRecord>>;
  sceneStatus: string;
  hasAppliedDay8: boolean;
};

export type MemoryCollapsePreview = {
  expiringOnNextDay: MemoryItem[];
  persistingMemories: MemoryItem[];
  persistentPublicEvidence: RetrievedEvidence[];
};
