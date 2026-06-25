import {
  BearCourtPreview,
  Choice,
  GameEvent,
  GameResources,
  GameState,
  MemoryCollapsePreview,
  MemoryEffect,
  MemoryItem,
  NpcReaction,
  RetrievedEvidence,
} from "@/lib/types";
import { day8Aftermath, gameEvents } from "@/lib/mockData";

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
    createdDay: day,
    expiresOn: persistent ? undefined : day + 7,
    persistent,
    active: true,
    reliability: effect.reliability,
    evidenceRole: effect.evidenceRole,
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

export function getActivePublicEvidence(memories: MemoryItem[]): RetrievedEvidence[] {
  return memories
    .filter((memory) => memory.active && memory.visibility === "public")
    .map((memory) => ({
      memoryId: memory.id,
      title: memory.title,
      text: memory.text,
      reliability: memory.reliability,
      sourceType: memory.type as RetrievedEvidence["sourceType"],
      evidenceRole: memory.evidenceRole,
    }));
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
      "Day 8 dawns. The oldest short-term traces collapse, but public records, songs, and rumors remain in circulation.",
  };
}

export function getBearCourtPreview(memories: MemoryItem[]): BearCourtPreview {
  const evidence = getActivePublicEvidence(memories);

  return {
    acceptedEvidence: evidence.filter(
      (item) => item.reliability >= 0.7 && item.evidenceRole !== "neutral"
    ),
    rejectedEvidence: evidence.filter(
      (item) => item.reliability < 0.7 || item.evidenceRole === "neutral"
    ),
  };
}

export function getDeerGuardReaction(memories: MemoryItem[]): NpcReaction {
  const evidence = getActivePublicEvidence(memories);
  const acceptedEvidence = evidence.filter(
    (item) => item.evidenceRole === "incriminating" && item.reliability >= 0.65
  );
  const favorableEvidence = evidence.filter(
    (item) => item.evidenceRole === "favorable" && item.reliability >= 0.7
  );
  const bearCourtPreview = getBearCourtPreview(memories);
  const hasWantedNotice = acceptedEvidence.some((item) => item.title === "Wanted Notice");
  const hasPublicSongOrRumor = acceptedEvidence.some(
    (item) => item.sourceType === "song" || item.sourceType === "rumor"
  );

  if (hasWantedNotice) {
    return {
      dialogue:
        "I don't remember your face. But this wanted notice describes your blue caravan.",
      effects: {
        trustDelta: -10,
        priceModifier: 1.3,
        questAvailable: false,
        legalRiskDelta: 3,
      },
      evidence,
      bearCourtPreview,
    };
  }

  if (hasPublicSongOrRumor) {
    return {
      dialogue:
        "I cannot place your face, but the road keeps singing about a blue caravan and stolen medicine.",
      effects: {
        trustDelta: -4,
        priceModifier: 1.1,
        questAvailable: true,
        legalRiskDelta: 1,
      },
      evidence,
      bearCourtPreview,
    };
  }

  if (favorableEvidence.length > 0) {
    return {
      dialogue:
        "I have no witness left in memory. What remains in public says your caravan helped more often than it harmed.",
      effects: {
        trustDelta: 1,
        priceModifier: 1,
        questAvailable: true,
        legalRiskDelta: 0,
      },
      evidence,
      bearCourtPreview,
    };
  }

  return {
    dialogue: "No active public evidence ties your caravan to the Deer Village theft now.",
    effects: {
      trustDelta: 0,
      priceModifier: 1,
      questAvailable: true,
      legalRiskDelta: 0,
    },
    evidence,
    bearCourtPreview,
  };
}
