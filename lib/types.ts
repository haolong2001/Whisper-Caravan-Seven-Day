export type ChoiceId = "A" | "B" | "C" | "D";

export type MemoryType = "short_term" | "record" | "song";

export type MemoryItem = {
  id: string;
  title: string;
  text: string;
  type: MemoryType;
  visibility: "private" | "public";
  location: string;
  createdDay: number;
  expiresOn?: number;
  persistent: boolean;
  active: boolean;
};

export type GameEffects = {
  trustDelta: number;
  priceModifier: number;
  questAvailable: boolean;
  legalRiskDelta: number;
};

export type ChoiceOption = {
  id: ChoiceId;
  title: string;
  description: string;
};

export type RetrievedEvidence = {
  memoryId: string;
  title: string;
  text: string;
  reliability: number;
  sourceType: Exclude<MemoryType, "short_term">;
};

export type NpcReaction = {
  dialogue: string;
  effects: GameEffects;
  evidence: RetrievedEvidence[];
};

export type ChoiceResult = {
  sceneStatus: string;
  memories: MemoryItem[];
};
