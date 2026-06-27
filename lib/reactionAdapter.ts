import {
  EvidenceSummary,
  NPCReaction,
  NPCReactionTone,
  ReactionRequest,
  RouteUnlock,
} from "@/lib/types";

type ReactionSource = "backend" | "local";

type ReactionResult = {
  data: NPCReaction;
  source: ReactionSource;
};

const VALID_TONES: readonly NPCReactionTone[] = [
  "friendly",
  "guarded",
  "fearful",
  "hostile",
  "sympathetic",
  "evasive",
];

const VALID_ROUTE_UNLOCKS: readonly RouteUnlock[] = [
  "truth",
  "merchant",
  "rumor",
  "failure",
];

const VALID_EVIDENCE_TYPES: readonly EvidenceSummary["type"][] = [
  "record",
  "testimony",
  "rumor",
  "contradiction",
  "receipt",
  "law",
  "inventory",
  "medical",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map((item) => asNonEmptyString(item))
        .filter((item): item is string => Boolean(item))
    )
  );
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, value));
}

export function clampTrustDelta(value: unknown) {
  return clampNumber(value, -10, 10, 0);
}

export function clampLegalRiskDelta(value: unknown) {
  return clampNumber(value, -8, 8, 0);
}

export function clampPriceModifier(value: unknown) {
  return clampNumber(value, 0.75, 1.25, 1);
}

export function clampUnitInterval(value: unknown) {
  return clampNumber(value, 0, 1, 0);
}

export function sanitizeRouteUnlocks(value: unknown): RouteUnlock[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value.filter(
        (item): item is RouteUnlock =>
          typeof item === "string" &&
          VALID_ROUTE_UNLOCKS.includes(item as RouteUnlock)
      )
    )
  );
}

export function sanitizeEvidenceSummary(value: unknown): EvidenceSummary | null {
  if (!isRecord(value)) {
    return null;
  }

  const memoryId = asNonEmptyString(value.memory_id);
  const title = asNonEmptyString(value.title);
  const evidenceType =
    typeof value.type === "string" &&
    VALID_EVIDENCE_TYPES.includes(value.type as EvidenceSummary["type"])
      ? (value.type as EvidenceSummary["type"])
      : null;

  if (!memoryId || !title || !evidenceType) {
    return null;
  }

  if (
    typeof value.reliability !== "number" ||
    !Number.isFinite(value.reliability) ||
    typeof value.relevance !== "number" ||
    !Number.isFinite(value.relevance)
  ) {
    return null;
  }

  return {
    memory_id: memoryId,
    title,
    type: evidenceType,
    reliability: clampUnitInterval(value.reliability),
    relevance: clampUnitInterval(value.relevance),
  };
}

export function sanitizeEvidenceSummaries(value: unknown): EvidenceSummary[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const evidenceById = new Map<string, EvidenceSummary>();

  for (const item of value) {
    const summary = sanitizeEvidenceSummary(item);

    if (summary) {
      evidenceById.set(summary.memory_id, summary);
    }
  }

  return Array.from(evidenceById.values());
}

function sanitizeTone(value: unknown, fallback: NPCReactionTone) {
  return typeof value === "string" && VALID_TONES.includes(value as NPCReactionTone)
    ? (value as NPCReactionTone)
    : fallback;
}

function sanitizeExplanation(value: unknown, fallback: NPCReaction["explanation"]) {
  if (!isRecord(value)) {
    return fallback;
  }

  const publicReason = asNonEmptyString(value.public_reason);

  if (!publicReason) {
    return fallback;
  }

  const debugReason = asNonEmptyString(value.debug_reason);

  return debugReason
    ? {
        public_reason: publicReason,
        debug_reason: debugReason,
      }
    : {
        public_reason: publicReason,
      };
}

function pickKnownMemoryId(request: ReactionRequest, terms: string[], fallback: string) {
  const loweredTerms = terms.map((term) => term.toLowerCase());

  return (
    request.known_memory_ids.find((memoryId) => {
      const loweredId = memoryId.toLowerCase();
      return loweredTerms.some((term) => loweredId.includes(term));
    }) ?? fallback
  );
}

function hasKnownMemory(request: ReactionRequest, terms: string[]) {
  return pickKnownMemoryId(request, terms, "") !== "";
}

function hasRouteContext(request: ReactionRequest, route: RouteUnlock) {
  return (
    request.route === route ||
    request.game_state_summary.unlocked_routes?.includes(route) === true
  );
}

function getLegalRisk(request: ReactionRequest) {
  return request.game_state_summary.legal_risk ?? 0;
}

function getLocalFallbackBaseReaction(request: ReactionRequest): NPCReaction {
  switch (request.npc_id) {
    case "fox_ledger_master": {
      const hasPaperTrail =
        hasKnownMemory(request, ["ledger", "receipt", "contract", "market"]) ||
        hasRouteContext(request, "merchant");
      const highRisk = getLegalRisk(request) >= 6;
      const evidenceId = pickKnownMemoryId(
        request,
        ["ledger", "receipt", "contract"],
        `fox-ledger-fallback-day-${request.day}`
      );

      return {
        npc_id: request.npc_id,
        dialogue: hasPaperTrail
          ? "Your caravan left enough paper behind that I can price the risk instead of guessing at it."
          : "Bring me a receipt, a seal, or a signed clause. I do not open my books for free on rumor alone.",
        tone: hasPaperTrail ? "guarded" : highRisk ? "evasive" : "guarded",
        trust_delta: hasPaperTrail ? 4 : -2,
        legal_risk_delta: hasPaperTrail ? -2 : 1,
        price_modifier: hasPaperTrail ? 0.9 : highRisk ? 1.15 : 1.05,
        quest_available: hasPaperTrail,
        route_unlocks: ["merchant"],
        evidence: [
          {
            memory_id: evidenceId,
            title: hasPaperTrail ? "Stamped Market Receipt" : "Ledger Gap Notice",
            type: hasPaperTrail ? "receipt" : "record",
            reliability: hasPaperTrail ? 0.88 : 0.67,
            relevance: hasPaperTrail ? 0.9 : 0.74,
          },
        ],
        memory_refs: [evidenceId],
        flags_set: ["fox_ledger_seen"],
        explanation: {
          public_reason: hasPaperTrail
            ? "The ledger-master responds to receipts and contracts more than appeals."
            : "Without paperwork, the ledger-master assumes exposure and charges for it.",
          debug_reason: "Local fallback keyed off merchant route context and paperwork-like memory ids.",
        },
      };
    }
    case "crow_broker": {
      const hasRumorTrail =
        hasKnownMemory(request, ["rumor", "song", "story", "broadside", "crow"]) ||
        hasRouteContext(request, "rumor");
      const evidenceId = pickKnownMemoryId(
        request,
        ["rumor", "song", "story", "crow"],
        `crow-broker-fallback-day-${request.day}`
      );

      return {
        npc_id: request.npc_id,
        dialogue: hasRumorTrail
          ? "The road is already talking. I can bend the story, but every louder telling raises the stakes."
          : "There is no market in silence. Give me a contradiction, a witness, or a song worth carrying.",
        tone: hasRumorTrail ? "friendly" : "guarded",
        trust_delta: hasRumorTrail ? 3 : -1,
        legal_risk_delta: hasRumorTrail ? 2 : 1,
        price_modifier: hasRumorTrail ? 0.95 : 1.1,
        quest_available: true,
        route_unlocks: ["rumor"],
        evidence: [
          {
            memory_id: evidenceId,
            title: hasRumorTrail ? "Roadside Broadside" : "Unverified Street Whisper",
            type: "rumor",
            reliability: hasRumorTrail ? 0.64 : 0.41,
            relevance: hasRumorTrail ? 0.87 : 0.68,
          },
        ],
        memory_refs: [evidenceId],
        flags_set: ["crow_broker_heard"],
        explanation: {
          public_reason: "The Crow Broker values public heat even when the source is imperfect.",
          debug_reason: "Local fallback keyed off rumor-route context and rumor-adjacent memory ids.",
        },
      };
    }
    case "camp_healer": {
      const hasMedicalTrail =
        hasKnownMemory(request, ["medical", "healer", "roster", "witness", "camp", "medicine"]) ||
        hasRouteContext(request, "truth");
      const evidenceId = pickKnownMemoryId(
        request,
        ["medical", "healer", "roster", "witness", "medicine"],
        `camp-healer-fallback-day-${request.day}`
      );

      return {
        npc_id: request.npc_id,
        dialogue: hasMedicalTrail
          ? "The camp remembers who brought medicine when the fever was worst. I will say that plainly."
          : "I know the sickness, but the court listens better when suffering is written down as testimony.",
        tone: "sympathetic",
        trust_delta: hasMedicalTrail ? 5 : 2,
        legal_risk_delta: hasMedicalTrail ? -3 : -1,
        quest_available: true,
        route_unlocks: ["truth"],
        evidence: [
          {
            memory_id: evidenceId,
            title: hasMedicalTrail ? "Refugee Treatment Testimony" : "Healer's Verbal Account",
            type: hasMedicalTrail ? "medical" : "testimony",
            reliability: hasMedicalTrail ? 0.86 : 0.72,
            relevance: hasMedicalTrail ? 0.92 : 0.79,
          },
        ],
        memory_refs: [evidenceId],
        flags_set: ["camp_healer_statement_taken"],
        explanation: {
          public_reason: "The camp healer centers necessity and witness testimony over procedure.",
          debug_reason: "Local fallback keyed off medical and witness-like memory ids.",
        },
      };
    }
    case "village_apothecary": {
      const hasInventoryTrail =
        hasKnownMemory(request, ["inventory", "apothecary", "medicine", "receipt", "ledger"]) ||
        hasRouteContext(request, "truth");
      const highRisk = getLegalRisk(request) >= 6;
      const evidenceId = pickKnownMemoryId(
        request,
        ["inventory", "apothecary", "medicine", "receipt"],
        `apothecary-fallback-day-${request.day}`
      );

      return {
        npc_id: request.npc_id,
        dialogue: hasInventoryTrail
          ? "The storehouse counts do not match the accusation. Missing stock and withheld stock are not the same thing."
          : "If you want me to contradict the accusation, I need the inventory trail kept straight and visible.",
        tone: hasInventoryTrail && !highRisk ? "sympathetic" : "guarded",
        trust_delta: hasInventoryTrail ? 4 : 1,
        legal_risk_delta: hasInventoryTrail ? -2 : 0,
        price_modifier: hasInventoryTrail ? 0.95 : 1,
        quest_available: true,
        route_unlocks: ["truth"],
        evidence: [
          {
            memory_id: evidenceId,
            title: hasInventoryTrail ? "Incomplete Medicine Inventory" : "Unsorted Storeroom Count",
            type: "inventory",
            reliability: hasInventoryTrail ? 0.89 : 0.7,
            relevance: hasInventoryTrail ? 0.94 : 0.76,
          },
        ],
        memory_refs: [evidenceId],
        flags_set: ["apothecary_inventory_seen"],
        explanation: {
          public_reason: "The apothecary reacts to stock records and medicine counts that can survive court scrutiny.",
          debug_reason: "Local fallback keyed off truth-route context and inventory-like memory ids.",
        },
      };
    }
    default:
      return {
        npc_id: request.npc_id,
        dialogue: "No local reaction script exists for this NPC yet.",
        tone: "guarded",
        trust_delta: 0,
        legal_risk_delta: 0,
        evidence: [],
        memory_refs: [],
        flags_set: [],
        explanation: {
          public_reason: "This NPC does not have a structured local fallback yet.",
        },
      };
  }
}

export function getLocalFallbackNpcReaction(request: ReactionRequest): NPCReaction {
  return getLocalFallbackBaseReaction(request);
}

export function sanitizeNpcReaction(
  value: unknown,
  request: ReactionRequest
): NPCReaction {
  const fallback = getLocalFallbackBaseReaction(request);

  if (!isRecord(value)) {
    return fallback;
  }

  const candidateNpcId = asNonEmptyString(value.npc_id);
  const dialogue = asNonEmptyString(value.dialogue);

  return {
    npc_id: candidateNpcId === request.npc_id ? candidateNpcId : fallback.npc_id,
    dialogue: dialogue ?? fallback.dialogue,
    tone: sanitizeTone(value.tone, fallback.tone),
    trust_delta:
      value.trust_delta === undefined
        ? fallback.trust_delta
        : clampTrustDelta(value.trust_delta),
    legal_risk_delta:
      value.legal_risk_delta === undefined
        ? fallback.legal_risk_delta
        : clampLegalRiskDelta(value.legal_risk_delta),
    price_modifier:
      value.price_modifier === undefined
        ? fallback.price_modifier
        : clampPriceModifier(value.price_modifier),
    quest_available:
      typeof value.quest_available === "boolean"
        ? value.quest_available
        : fallback.quest_available,
    route_unlocks:
      value.route_unlocks === undefined
        ? fallback.route_unlocks
        : sanitizeRouteUnlocks(value.route_unlocks),
    evidence:
      value.evidence === undefined
        ? fallback.evidence
        : sanitizeEvidenceSummaries(value.evidence),
    memory_refs:
      value.memory_refs === undefined ? fallback.memory_refs : asStringArray(value.memory_refs),
    flags_set: value.flags_set === undefined ? fallback.flags_set : asStringArray(value.flags_set),
    explanation: sanitizeExplanation(value.explanation, fallback.explanation),
  };
}

function getReactionBackendUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.trim();
  return configuredUrl && configuredUrl.length > 0 ? configuredUrl : null;
}

async function postJson<TResponse>(path: string, body: unknown): Promise<TResponse> {
  const backendUrl = getReactionBackendUrl();

  if (!backendUrl) {
    throw new Error("Structured reaction backend is not configured.");
  }

  const response = await fetch(`${backendUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Backend request failed for ${path} with status ${response.status}`);
  }

  return response.json() as Promise<TResponse>;
}

export function hasReactionBackendConfig() {
  return getReactionBackendUrl() !== null;
}

export async function getNpcReactionResult(request: ReactionRequest): Promise<ReactionResult> {
  if (!hasReactionBackendConfig()) {
    return {
      data: getLocalFallbackNpcReaction(request),
      source: "local",
    };
  }

  try {
    const response = await postJson<unknown>("/npc/reaction", request);
    return {
      data: sanitizeNpcReaction(response, request),
      source: "backend",
    };
  } catch {
    return {
      data: getLocalFallbackNpcReaction(request),
      source: "local",
    };
  }
}

export async function getNpcReaction(request: ReactionRequest): Promise<NPCReaction> {
  const result = await getNpcReactionResult(request);
  return result.data;
}
