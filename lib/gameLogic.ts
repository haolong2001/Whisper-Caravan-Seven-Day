import {
  BackendMemoryRecord,
  Choice,
  EvaluatedEvidence,
  GameEvent,
  MemoryQueryRequest,
  MemoryQueryResult,
  GameResources,
  GameState,
  MemoryCollapsePreview,
  MemoryEffect,
  MemoryItem,
  NPCProfile,
  NpcReaction,
  RetrievedEvidence,
} from "@/lib/types";
import { day8Aftermath, gameEvents, npcProfiles } from "@/lib/mockData";

function buildMemoryTags(effect: MemoryEffect, event: GameEvent, choice: Choice) {
  if (effect.tags?.length) {
    return effect.tags;
  }

  return [event.id, choice.id, effect.type, effect.visibility, effect.evidenceRole, event.location];
}

export function toRetrievedEvidence(memory: MemoryItem): RetrievedEvidence {
  return {
    memoryId: memory.id,
    title: memory.title,
    text: memory.text,
    reliability: memory.reliability,
    sourceType: memory.type,
    evidenceRole: memory.evidenceRole,
    visibility: memory.visibility,
    metadata: {
      day: memory.createdDay,
      source: memory.source,
      sourceNpcId: memory.sourceNpcId,
      location: memory.location,
      faction: memory.faction,
      active: memory.active,
      expiresOnDay: memory.expiresOn,
      tags: memory.tags,
      persistent: memory.persistent,
    },
  };
}

function compareText(left: string, right: string) {
  if (left === right) {
    return 0;
  }

  return left < right ? -1 : 1;
}

function compareEvidence(left: RetrievedEvidence, right: RetrievedEvidence) {
  return (
    right.metadata.day - left.metadata.day ||
    right.reliability - left.reliability ||
    compareText(left.title, right.title) ||
    compareText(left.metadata.source, right.metadata.source) ||
    compareText(left.memoryId, right.memoryId)
  );
}

function sortRetrievedEvidence<T extends RetrievedEvidence>(evidence: T[]) {
  return [...evidence].sort(compareEvidence);
}

export function toBackendMemoryRecord(memory: MemoryItem): BackendMemoryRecord {
  return {
    memoryId: memory.id,
    title: memory.title,
    text: memory.text,
    day: memory.createdDay,
    type: memory.type,
    source: memory.source,
    sourceNpcId: memory.sourceNpcId,
    location: memory.location,
    faction: memory.faction,
    visibility: memory.visibility,
    reliability: memory.reliability,
    active: memory.active,
    expiresOnDay: memory.expiresOn,
    tags: memory.tags,
    evidenceRole: memory.evidenceRole,
    persistent: memory.persistent,
  };
}

function createMemoryItem(
  effect: MemoryEffect,
  event: GameEvent,
  choice: Choice,
  day: number,
  index: number
): MemoryItem {
  const persistent = effect.persistent ?? effect.type !== "short_term";

  return {
    id: `${event.id}-${choice.id}-${day}-${index + 1}`,
    title: effect.title,
    text: effect.text,
    type: effect.type,
    visibility: effect.visibility,
    location: effect.location,
    source: effect.source ?? event.title,
    sourceNpcId: effect.sourceNpcId,
    faction: effect.faction,
    createdDay: day,
    expiresOn: persistent ? undefined : day + 7,
    persistent,
    active: true,
    reliability: effect.reliability,
    evidenceRole: effect.evidenceRole,
    tags: buildMemoryTags(effect, event, choice),
  };
}

function applyResourceEffects(resources: GameResources, effects?: Partial<GameResources>) {
  if (!effects) {
    return resources;
  }

  return {
    silver: resources.silver + (effects.silver ?? 0),
    medicine: resources.medicine + (effects.medicine ?? 0),
    provisions: resources.provisions + (effects.provisions ?? 0),
    legalRisk: resources.legalRisk + (effects.legalRisk ?? 0),
  };
}

export function getEventForDay(day: number) {
  return gameEvents.find((event) => event.day === day) ?? null;
}

export function getNpcProfileById(npcId: NPCProfile["id"]) {
  return npcProfiles.find((profile) => profile.id === npcId) ?? null;
}

export function applyChoice(gameState: GameState, choice: Choice): GameState {
  if (gameState.currentDay > 7 || gameState.dayChoices[gameState.currentDay]) {
    return gameState;
  }

  const event = getEventForDay(gameState.currentDay);

  if (!event) {
    return gameState;
  }

  const newMemories = choice.memoryEffects.map((effect, index) =>
    createMemoryItem(effect, event, choice, gameState.currentDay, index)
  );

  const updatedFactions = { ...gameState.factions };

  choice.factionEffects.forEach((effect) => {
    updatedFactions[effect.faction] += effect.delta;
  });

  return {
    ...gameState,
    memories: [...gameState.memories, ...newMemories],
    factions: updatedFactions,
    resources: applyResourceEffects(gameState.resources, choice.resourceEffects),
    dayChoices: {
      ...gameState.dayChoices,
      [gameState.currentDay]: {
        eventId: event.id,
        choiceId: choice.id,
        choiceLabel: choice.label,
        outcomeText: choice.outcomeText,
      },
    },
    sceneStatus: choice.outcomeText,
  };
}

export function advanceDay(gameState: GameState): GameState {
  if (gameState.currentDay >= 8) {
    return gameState;
  }

  const nextDay = gameState.currentDay + 1;
  const nextEvent = getEventForDay(nextDay);

  return {
    ...gameState,
    currentDay: nextDay,
    sceneStatus: nextEvent
      ? `Day ${nextDay} begins at ${nextEvent.location}. Choose how the caravan responds.`
      : day8Aftermath.description,
  };
}

export function applySevenDayForgetting(memories: MemoryItem[], currentDay: number) {
  return memories.map((memory) => {
    if (memory.type === "short_term" && memory.expiresOn && currentDay >= memory.expiresOn) {
      return { ...memory, active: false };
    }

    return memory;
  });
}

export function getActiveMemories(memories: MemoryItem[]) {
  return memories.filter((memory) => memory.active);
}

export function getExpiredMemories(memories: MemoryItem[]) {
  return memories.filter((memory) => !memory.active);
}

export function getActiveEvidence(memories: MemoryItem[]): RetrievedEvidence[] {
  return sortRetrievedEvidence(memories.filter((memory) => memory.active).map(toRetrievedEvidence));
}

export function getActivePublicEvidence(memories: MemoryItem[]): RetrievedEvidence[] {
  return getActiveEvidence(memories).filter((memory) => memory.visibility === "public");
}

export function queryMemoriesLocally(
  memories: MemoryItem[],
  request: MemoryQueryRequest
): MemoryQueryResult {
  const activeOnly = request.activeOnly ?? true;
  const profile = request.npcId ? getNpcProfileById(request.npcId) : null;
  let filtered = memories.filter((memory) => (activeOnly ? memory.active : true));

  if (request.visibility?.length) {
    filtered = filtered.filter((memory) => request.visibility?.includes(memory.visibility));
  }

  if (request.sourceTypes?.length) {
    filtered = filtered.filter((memory) => request.sourceTypes?.includes(memory.type));
  }

  const minReliability = request.minReliability;

  if (typeof minReliability === "number") {
    filtered = filtered.filter((memory) => memory.reliability >= minReliability);
  }

  const tags = request.tags;

  if (tags?.length) {
    filtered = filtered.filter((memory) => tags.every((tag) => memory.tags.includes(tag)));
  }

  if (profile) {
    filtered = filtered.filter(
      (memory) =>
        profile.visibleMemoryScopes.includes(memory.visibility) &&
        memory.reliability >= profile.minReliability
    );
  }

  const evidence = sortRetrievedEvidence(filtered.map(toRetrievedEvidence));

  return {
    evidence:
      typeof request.limit === "number"
        ? request.limit <= 0
          ? []
          : evidence.slice(0, request.limit)
        : evidence,
  };
}

function hasSupportingLegalRecord(
  evidence: RetrievedEvidence,
  visibleEvidence: RetrievedEvidence[]
) {
  return visibleEvidence.some(
    (item) =>
      item.memoryId !== evidence.memoryId &&
      (item.sourceType === "record" || item.sourceType === "contract") &&
      item.evidenceRole === evidence.evidenceRole &&
      item.reliability >= 0.7
  );
}

function canNpcSeeEvidence(profile: NPCProfile, evidence: RetrievedEvidence) {
  return profile.visibleMemoryScopes.includes(evidence.visibility);
}

function getAcceptanceReason(profile: NPCProfile, evidence: RetrievedEvidence) {
  switch (profile.id) {
    case "deerGuard":
      return evidence.sourceType === "short_term"
        ? "Accepted as a still-active witness trace the Deer Guard can act on."
        : "Accepted as a reliable official trace the Deer Guard recognizes.";
    case "foxMerchant":
      return evidence.sourceType === "rumor"
        ? "Accepted as market gossip worth pricing into the next deal."
        : "Accepted as paperwork the Fox Market can trade on.";
    case "crowBroker":
      return evidence.sourceType === "short_term"
        ? "Accepted as fresh off-book intelligence before it cools."
        : "Accepted as story heat the Crow network can spread.";
    case "bearJudge":
      return evidence.sourceType === "record" || evidence.sourceType === "contract"
        ? "Accepted as legal evidence above the Bear Court reliability threshold."
        : `Accepted because a reliable legal record supports this ${evidence.sourceType}.`;
    default:
      return "Accepted by the current NPC access rules.";
  }
}

function getRejectedTypeReason(profile: NPCProfile, evidence: RetrievedEvidence) {
  switch (profile.id) {
    case "deerGuard":
      if (evidence.sourceType === "rumor") {
        return "Rejected because the Deer Guard does not trust road rumors.";
      }
      return `Rejected because the Deer Guard does not rely on ${evidence.sourceType} evidence.`;
    case "foxMerchant":
      if (evidence.sourceType === "song") {
        return "Rejected because the Fox Merchant will not price a deal from song alone.";
      }
      return `Rejected because the Fox Merchant does not use ${evidence.sourceType} evidence here.`;
    case "crowBroker":
      return `Rejected because the Crow Broker cannot turn this ${evidence.sourceType} into useful traffic.`;
    case "bearJudge":
      if (evidence.sourceType === "rumor") {
        return "Rejected as an unsupported rumor.";
      }
      if (evidence.sourceType === "song") {
        return "Rejected because songs need legal record support in Bear Court.";
      }
      return `Rejected because Bear Court does not rely on ${evidence.sourceType} evidence.`;
    default:
      return `Rejected because ${profile.name} does not rely on ${evidence.sourceType} evidence.`;
  }
}

function evaluateEvidenceForNpc(
  profile: NPCProfile,
  evidence: RetrievedEvidence,
  visibleEvidence: RetrievedEvidence[]
): EvaluatedEvidence {
  if (!canNpcSeeEvidence(profile, evidence)) {
    return {
      ...evidence,
      decision: "rejected",
      decisionReason: `${profile.name} cannot access ${evidence.visibility} memories.`,
    };
  }

  if (evidence.reliability < profile.minReliability) {
    return {
      ...evidence,
      decision: "rejected",
      decisionReason: `${profile.name} requires at least ${Math.round(
        profile.minReliability * 100
      )}% reliability.`,
    };
  }

  if (
    profile.id === "bearJudge" &&
    profile.rejectedMemoryTypes.includes(evidence.sourceType) &&
    evidence.evidenceRole !== "neutral" &&
    hasSupportingLegalRecord(evidence, visibleEvidence)
  ) {
    return {
      ...evidence,
      decision: "accepted",
      decisionReason: getAcceptanceReason(profile, evidence),
    };
  }

  if (profile.acceptedMemoryTypes.includes(evidence.sourceType)) {
    return {
      ...evidence,
      decision: "accepted",
      decisionReason: getAcceptanceReason(profile, evidence),
    };
  }

  return {
    ...evidence,
    decision: "rejected",
    decisionReason: getRejectedTypeReason(profile, evidence),
  };
}

export function getNpcEvidenceEvaluations(
  profile: NPCProfile,
  memories: MemoryItem[]
): EvaluatedEvidence[] {
  const activeEvidence = getActiveEvidence(memories);
  const visibleEvidence = activeEvidence.filter((evidence) => canNpcSeeEvidence(profile, evidence));

  return sortRetrievedEvidence(
    activeEvidence.map((evidence) => evaluateEvidenceForNpc(profile, evidence, visibleEvidence))
  );
}

function getAcceptedNpcEvidence(
  profile: NPCProfile,
  memories: MemoryItem[]
): EvaluatedEvidence[] {
  return getNpcEvidenceEvaluations(profile, memories).filter(
    (evidence) => evidence.decision === "accepted"
  );
}

function getRejectedNpcEvidence(
  profile: NPCProfile,
  memories: MemoryItem[]
): EvaluatedEvidence[] {
  return getNpcEvidenceEvaluations(profile, memories).filter(
    (evidence) => evidence.decision === "rejected"
  );
}

export function getMemoryCollapsePreview(
  memories: MemoryItem[],
  nextDay: number
): MemoryCollapsePreview {
  const expiringOnNextDay = memories.filter(
    (memory) =>
      memory.active &&
      memory.type === "short_term" &&
      Boolean(memory.expiresOn) &&
      memory.expiresOn === nextDay
  );
  const persistingMemories = memories.filter(
    (memory) => memory.active && !expiringOnNextDay.some((item) => item.id === memory.id)
  );
  const persistentPublicEvidence = getActivePublicEvidence(persistingMemories);

  return {
    expiringOnNextDay,
    persistingMemories,
    persistentPublicEvidence,
  };
}

export function applyDay8Transition(gameState: GameState): GameState {
  const advancedState = gameState.currentDay === 7 ? advanceDay(gameState) : gameState;

  if (advancedState.currentDay !== 8 || advancedState.hasAppliedDay8) {
    return advancedState;
  }

  return {
    ...advancedState,
    memories: applySevenDayForgetting(advancedState.memories, 8),
    hasAppliedDay8: true,
    sceneStatus:
      "Day 8 dawns. The oldest short-term traces collapse, but newer witness memories, records, contracts, songs, and rumors still compete to define the caravan.",
  };
}

function countEvidence(
  evidence: EvaluatedEvidence[],
  filters: Partial<Pick<EvaluatedEvidence, "evidenceRole" | "sourceType">>
) {
  return evidence.filter((item) => {
    if (filters.evidenceRole && item.evidenceRole !== filters.evidenceRole) {
      return false;
    }

    if (filters.sourceType && item.sourceType !== filters.sourceType) {
      return false;
    }

    return true;
  }).length;
}

function buildDeerGuardReaction(
  profile: NPCProfile,
  gameState: GameState,
  acceptedEvidence: EvaluatedEvidence[],
  rejectedEvidence: EvaluatedEvidence[]
): NpcReaction {
  const deerStanding = gameState.factions.deerVillage;
  const incriminatingCount = countEvidence(acceptedEvidence, { evidenceRole: "incriminating" });
  const favorableCount = countEvidence(acceptedEvidence, { evidenceRole: "favorable" });
  const hasWantedNotice = acceptedEvidence.some((item) => item.title === "Wanted Notice");
  const hiddenWitnessCount = rejectedEvidence.filter(
    (item) => item.sourceType === "short_term" && item.visibility === "private"
  ).length;

  if (hasWantedNotice) {
    return {
      profile,
      dialogue:
        "The Deer Guard follows the posted notice first. Private whispers do not save you once a record is on the board.",
      effects: {
        trustDelta: deerStanding - 6,
        priceModifier: 1.3,
        questAvailable: false,
        legalRiskDelta: 3,
      },
      acceptedEvidence,
      rejectedEvidence,
    };
  }

  if (incriminatingCount > 0) {
    return {
      profile,
      dialogue:
        "The Deer Guard sees enough official evidence to stay wary, even if some witness traces are hidden from view.",
      effects: {
        trustDelta: deerStanding - 3,
        priceModifier: 1.15,
        questAvailable: deerStanding > 0,
        legalRiskDelta: 2,
      },
      acceptedEvidence,
      rejectedEvidence,
    };
  }

  if (favorableCount > 0) {
    return {
      profile,
      dialogue:
        hiddenWitnessCount > 0
          ? "The Deer Guard can only act on the public record, and what remains visible leans in your favor."
          : "No hostile record survives the week strongly enough to outweigh the public help tied to your caravan.",
      effects: {
        trustDelta: deerStanding + 2,
        priceModifier: 0.95,
        questAvailable: true,
        legalRiskDelta: 0,
      },
      acceptedEvidence,
      rejectedEvidence,
    };
  }

  return {
    profile,
    dialogue:
      "The Deer Guard has no active evidence it trusts enough to move against you, though hidden memories may still exist elsewhere.",
    effects: {
      trustDelta: deerStanding,
      priceModifier: 1,
      questAvailable: true,
      legalRiskDelta: 0,
    },
    acceptedEvidence,
    rejectedEvidence,
  };
}

function buildFoxMerchantReaction(
  profile: NPCProfile,
  gameState: GameState,
  acceptedEvidence: EvaluatedEvidence[],
  rejectedEvidence: EvaluatedEvidence[]
): NpcReaction {
  const foxStanding = gameState.factions.foxMarket;
  const acceptedContracts = countEvidence(acceptedEvidence, { sourceType: "contract" });
  const acceptedRumors = countEvidence(acceptedEvidence, { sourceType: "rumor" });
  const incriminatingCount = countEvidence(acceptedEvidence, { evidenceRole: "incriminating" });
  const privateAcceptedCount = acceptedEvidence.filter((item) => item.visibility === "private").length;

  if (acceptedContracts > 0 && incriminatingCount === 0) {
    return {
      profile,
      dialogue:
        privateAcceptedCount > 0
          ? "The Fox Market values your off-book discipline and the contract that proves you can still close clean business."
          : "The Fox Market sees enough reliable paperwork to offer fair terms.",
      effects: {
        trustDelta: foxStanding + 3,
        priceModifier: 0.9,
        questAvailable: true,
        legalRiskDelta: 0,
      },
      acceptedEvidence,
      rejectedEvidence,
    };
  }

  if (acceptedRumors > 0 || incriminatingCount > 0) {
    return {
      profile,
      dialogue:
        "The Fox Market can still trade with you, but the price now includes every rumor and discrepancy attached to your route.",
      effects: {
        trustDelta: foxStanding - 1,
        priceModifier: 1.2,
        questAvailable: true,
        legalRiskDelta: 1,
      },
      acceptedEvidence,
      rejectedEvidence,
    };
  }

  return {
    profile,
    dialogue:
      rejectedEvidence.length > 0
        ? "The Fox Market hears traces of your week, but too little of it converts into reliable profit."
        : "No trade-relevant evidence stands out strongly enough for the Fox Market to change its offer.",
    effects: {
      trustDelta: foxStanding,
      priceModifier: 1,
      questAvailable: foxStanding >= 0,
      legalRiskDelta: 0,
    },
    acceptedEvidence,
    rejectedEvidence,
  };
}

function buildCrowBrokerReaction(
  profile: NPCProfile,
  gameState: GameState,
  acceptedEvidence: EvaluatedEvidence[],
  rejectedEvidence: EvaluatedEvidence[]
): NpcReaction {
  const crowStanding = gameState.factions.crowBrokers;
  const rumorHeat =
    countEvidence(acceptedEvidence, { sourceType: "rumor" }) +
    countEvidence(acceptedEvidence, { sourceType: "song" }) +
    countEvidence(acceptedEvidence, { sourceType: "short_term" });
  const incriminatingCount = countEvidence(acceptedEvidence, { evidenceRole: "incriminating" });
  const privateAcceptedCount = acceptedEvidence.filter((item) => item.visibility === "private").length;

  if (rumorHeat > 0) {
    return {
      profile,
      dialogue:
        privateAcceptedCount > 0
          ? "The Crow Broker has both public noise and fresh private scraps to resell. Your week is becoming traffic."
          : "The Crow Broker sees enough heat in songs and rumors to move your name ahead of the caravan.",
      effects: {
        trustDelta: crowStanding + 2,
        priceModifier: 0.95,
        questAvailable: true,
        legalRiskDelta: incriminatingCount > 0 ? 1 : 0,
      },
      acceptedEvidence,
      rejectedEvidence,
    };
  }

  return {
    profile,
    dialogue:
      "The Crow Broker lacks enough live gossip to make you worth broadcasting. For now, your trail is cooling.",
    effects: {
      trustDelta: crowStanding,
      priceModifier: 1,
      questAvailable: crowStanding > 0,
      legalRiskDelta: 0,
    },
    acceptedEvidence,
    rejectedEvidence,
  };
}

function buildBearJudgeReaction(
  profile: NPCProfile,
  gameState: GameState,
  acceptedEvidence: EvaluatedEvidence[],
  rejectedEvidence: EvaluatedEvidence[]
): NpcReaction {
  const bearStanding = gameState.factions.bearCourt;
  const incriminatingCount = countEvidence(acceptedEvidence, { evidenceRole: "incriminating" });
  const favorableCount = countEvidence(acceptedEvidence, { evidenceRole: "favorable" });
  const supportedSongOrRumor = acceptedEvidence.some(
    (item) => item.sourceType === "song" || item.sourceType === "rumor"
  );

  if (incriminatingCount > favorableCount) {
    return {
      profile,
      dialogue:
        supportedSongOrRumor
          ? "The Bear Judge still leans on legal records first, but supported songs and rumors now reinforce the case against you."
          : "The Bear Judge sees enough legal evidence to treat your caravan as a credible risk.",
      effects: {
        trustDelta: bearStanding - 4,
        priceModifier: 1.25,
        questAvailable: false,
        legalRiskDelta: 3,
      },
      acceptedEvidence,
      rejectedEvidence,
    };
  }

  if (favorableCount > 0) {
    return {
      profile,
      dialogue:
        "The Bear Judge finds enough records in your favor to keep the road open, even if weaker stories are discarded.",
      effects: {
        trustDelta: bearStanding + 2,
        priceModifier: 1,
        questAvailable: true,
        legalRiskDelta: 0,
      },
      acceptedEvidence,
      rejectedEvidence,
    };
  }

  return {
    profile,
    dialogue:
      "The Bear Judge rejects most of what still circulates about your caravan and reserves judgment until stronger records appear.",
    effects: {
      trustDelta: bearStanding,
      priceModifier: 1.05,
      questAvailable: bearStanding >= 0,
      legalRiskDelta: 1,
    },
    acceptedEvidence,
    rejectedEvidence,
  };
}

export function getNpcReaction(gameState: GameState, profile: NPCProfile): NpcReaction {
  const acceptedEvidence = getAcceptedNpcEvidence(profile, gameState.memories);
  const rejectedEvidence = getRejectedNpcEvidence(profile, gameState.memories);

  switch (profile.id) {
    case "deerGuard":
      return buildDeerGuardReaction(profile, gameState, acceptedEvidence, rejectedEvidence);
    case "foxMerchant":
      return buildFoxMerchantReaction(profile, gameState, acceptedEvidence, rejectedEvidence);
    case "crowBroker":
      return buildCrowBrokerReaction(profile, gameState, acceptedEvidence, rejectedEvidence);
    case "bearJudge":
      return buildBearJudgeReaction(profile, gameState, acceptedEvidence, rejectedEvidence);
    default:
      return {
        profile,
        dialogue: "No reaction is available for this NPC profile.",
        effects: {
          trustDelta: 0,
          priceModifier: 1,
          questAvailable: false,
          legalRiskDelta: 0,
        },
        acceptedEvidence,
        rejectedEvidence,
      };
  }
}

export function getDay8NpcReactions(gameState: GameState): NpcReaction[] {
  return npcProfiles.map((profile) => getNpcReaction(gameState, profile));
}
