import {
  BackendMemoryRecord,
  Choice,
  CollapseCheckpoint,
  EvidenceSummary,
  EvaluatedEvidence,
  GameResources,
  MemoryQueryRequest,
  MemoryQueryResult,
  NPCReaction,
  ReactionRequest,
  PhaseCard,
  RouteUnlock,
  RouteTag,
  RunPhase,
  SceneChoiceRecord,
  GameState,
  MemoryCollapsePreview,
  MemoryEffect,
  MemoryItem,
  NPCProfile,
  NpcReaction,
  StructuredNpcAvailability,
  StructuredNpcId,
  TrialPreviewItem,
  RetrievedEvidence,
  StoryScene,
} from "@/lib/types";
import {
  buildSceneForDay,
  collapseCheckpoints,
  endingPlaceholder,
  gameScenePool,
  npcProfiles,
  trialPlaceholder,
} from "@/lib/mockData";

type LoopPhase = Extract<RunPhase, "loop_one" | "loop_two">;
type CollapsePhase = Extract<RunPhase, "collapse_one" | "collapse_two">;
type RoutePressure = Record<RouteTag, number>;

const SCENE_ROUTE_PRIORITY: Partial<Record<StoryScene["id"], RouteTag>> = {
  "tax-seal-on-the-crates": "truth",
  "deer-doctors-hidden-diary": "truth",
  "rabbit-witness-at-mistwood": "truth",
  "black-market-price-list": "truth",
  "bear-court-intake-window": "truth",
  "deer-archivists-index": "truth",
  "tax-officers-travel-ledger": "truth",
  "fox-ledger-offer": "merchant",
  "smuggler-debt-call": "merchant",
  "fox-audit-second-pass": "merchant",
  "market-settlement-dinner": "merchant",
  "crow-relay-framing": "rumor",
  "refugee-witness-circle": "rumor",
  "crow-story-backfires": "rumor",
  "refugee-song-festival": "rumor",
  "crow-brokers-final-spin": "rumor",
  "witness-contradiction-hearing": "failure",
};

function buildMemoryTags(effect: MemoryEffect, scene: StoryScene, choice: Choice) {
  if (effect.tags?.length) {
    return effect.tags;
  }

  return [scene.id, choice.id, effect.type, effect.visibility, effect.evidenceRole, scene.location];
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

function isLoopPhase(phase: RunPhase): phase is LoopPhase {
  return phase === "loop_one" || phase === "loop_two";
}

function isCollapsePhase(phase: RunPhase): phase is CollapsePhase {
  return phase === "collapse_one" || phase === "collapse_two";
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
  scene: StoryScene,
  choice: Choice,
  day: number,
  index: number
): MemoryItem {
  const persistent = effect.persistent ?? effect.type !== "short_term";

  return {
    id: `${scene.id}-${choice.id}-${day}-${index + 1}`,
    title: effect.title,
    text: effect.text,
    type: effect.type,
    visibility: effect.visibility,
    location: effect.location,
    source: effect.source ?? scene.title,
    sourceNpcId: effect.sourceNpcId,
    faction: effect.faction,
    createdDay: day,
    expiresOn: persistent ? undefined : day + 7,
    persistent,
    active: true,
    reliability: effect.reliability,
    evidenceRole: effect.evidenceRole,
    tags: buildMemoryTags(effect, scene, choice),
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

function getScenePhaseForDay(day: number): LoopPhase {
  return day <= 7 ? "loop_one" : "loop_two";
}

function compareSceneSelection(left: StoryScene, right: StoryScene) {
  return compareText(left.title, right.title) || compareText(left.id, right.id);
}

function getAnchorSceneForDay(day: number) {
  return (
    gameScenePool.find(
      (scene) => scene.isAnchor && scene.dayOptions?.includes(day)
    ) ?? null
  );
}

export function getRoutePressures(gameState: GameState): RoutePressure {
  const scores: RoutePressure = {
    truth: 0,
    merchant: 0,
    rumor: 0,
    failure: 0,
  };

  for (const memory of gameState.memories) {
    if (memory.tags.includes("truth-route")) {
      scores.truth += 2;
    }

    if (memory.tags.includes("system-evidence")) {
      scores.truth += 3;
    }

    if (memory.tags.includes("necessity")) {
      scores.truth += 2;
    }

    if (memory.tags.includes("court-filing")) {
      scores.truth += 2;
    }

    if (memory.type === "record" || memory.type === "contract") {
      scores.truth += memory.evidenceRole === "incriminating" ? 0 : 1;
    }

    if (memory.tags.includes("merchant-route")) {
      scores.merchant += 2;
    }

    if (memory.type === "contract") {
      scores.merchant += 2;
    }

    if (memory.tags.includes("public-sympathy")) {
      scores.rumor += 2;
    }

    if (memory.tags.includes("rumor-route")) {
      scores.rumor += 1;
    }

    if (memory.type === "song" || memory.type === "rumor") {
      scores.rumor += 1;
    }

    if (
      memory.evidenceRole === "incriminating" ||
      memory.tags.includes("contradiction") ||
      memory.tags.includes("failure-route") ||
      memory.tags.includes("wanted-notice")
    ) {
      scores.failure += 2;
    }

    if (!memory.active && memory.type === "short_term" && memory.evidenceRole !== "incriminating") {
      scores.failure += 1;
    }
  }

  scores.truth += Math.max(gameState.factions.bearCourt, 0);
  scores.truth += Math.max(gameState.factions.refugees, 0);
  scores.merchant += Math.max(gameState.factions.foxMarket, 0);
  scores.rumor += Math.max(gameState.factions.crowBrokers, 0);
  scores.rumor += Math.max(gameState.factions.refugees, 0);
  scores.failure += Math.max(-gameState.factions.deerVillage, 0);
  scores.failure += Math.max(-gameState.factions.bearCourt, 0);
  scores.failure += gameState.resources.legalRisk;

  return scores;
}

function scoreSceneTemplateForState(
  scene: StoryScene,
  gameState: GameState,
  routePressures: RoutePressure,
  day: number
) {
  let score = 0;
  const leadRouteTag = scene.routeTags?.[0];

  if (leadRouteTag) {
    score += routePressures[leadRouteTag] * 6;
  }

  const prioritizedRoute = SCENE_ROUTE_PRIORITY[scene.id];

  if (prioritizedRoute) {
    score += routePressures[prioritizedRoute] * 5;
  }

  for (const routeTag of scene.routeTags ?? []) {
    score += routePressures[routeTag] * 3;
  }

  score -= Math.abs(scene.day - day) * 2;

  if (scene.routeTags?.includes("truth")) {
    score += gameState.factions.bearCourt + gameState.factions.refugees;
  }

  if (scene.routeTags?.includes("merchant")) {
    score += gameState.factions.foxMarket;
  }

  if (scene.routeTags?.includes("rumor")) {
    score += gameState.factions.crowBrokers + gameState.factions.refugees;
  }

  if (scene.routeTags?.includes("failure")) {
    score += routePressures.failure * 2;
  }

  if (scene.id === "return-to-deer-village-gate") {
    score += routePressures.truth + routePressures.failure;
  }

  if (scene.id === "final-counter-offer") {
    score += Math.max(routePressures.truth, routePressures.merchant, routePressures.rumor);
  }

  return score;
}

function selectSceneTemplateForDay(gameState: GameState, day: number) {
  const anchorScene = getAnchorSceneForDay(day);

  if (anchorScene) {
    return anchorScene;
  }

  const seenSceneIds = new Set(gameState.scenePlan.map((scene) => scene.id));
  const routePressures = getRoutePressures(gameState);
  const matchingCandidates = gameScenePool.filter(
    (scene) =>
      !scene.isAnchor &&
      !seenSceneIds.has(scene.id) &&
      scene.dayOptions?.includes(day) &&
      scene.selectionBucket === (day <= 7 ? "early" : "late")
  );

  const candidates =
    matchingCandidates.length > 0
      ? matchingCandidates
      : gameScenePool.filter(
          (scene) =>
            !scene.isAnchor &&
            !seenSceneIds.has(scene.id) &&
            scene.selectionBucket === (day <= 7 ? "early" : "late")
        );

  if (candidates.length === 0) {
    throw new Error(`No selectable scene template available for day ${day}.`);
  }

  return [...candidates].sort((left, right) => {
    const scoreDelta =
      scoreSceneTemplateForState(right, gameState, routePressures, day) -
      scoreSceneTemplateForState(left, gameState, routePressures, day);

    return scoreDelta || compareSceneSelection(left, right);
  })[0];
}

function ensurePlannedSceneForDay(gameState: GameState, day: number) {
  const plannedIndex = gameState.scenePlan.findIndex((scene) => scene.day === day);

  if (plannedIndex >= 0) {
    return {
      scenePlan: gameState.scenePlan,
      sceneIndex: plannedIndex,
      scene: gameState.scenePlan[plannedIndex],
    };
  }

  const template = selectSceneTemplateForDay(gameState, day);
  const nextScene = buildSceneForDay(template, day);

  return {
    scenePlan: [...gameState.scenePlan, nextScene],
    sceneIndex: gameState.scenePlan.length,
    scene: nextScene,
  };
}

function getLoopPhaseLabel(phase: LoopPhase) {
  return phase === "loop_one" ? "Loop One" : "Loop Two";
}

function getNextRunPhase(phase: RunPhase): RunPhase | null {
  switch (phase) {
    case "loop_one":
      return "collapse_one";
    case "collapse_one":
      return "loop_two";
    case "loop_two":
      return "collapse_two";
    case "collapse_two":
      return "trial";
    case "trial":
      return "ending";
    case "ending":
      return null;
    default:
      return null;
  }
}

function buildSceneIntro(scene: StoryScene, previousScene?: StoryScene | null) {
  if (!previousScene || scene.day > previousScene.day) {
    return `Day ${scene.day} begins at ${scene.location}. Choose how the caravan responds.`;
  }

  return `Later on Day ${scene.day}, the caravan reaches ${scene.location}. Choose how the caravan responds.`;
}

export function getCurrentScene(gameState: GameState) {
  if (!isLoopPhase(gameState.phase) || gameState.currentSceneIndex === null) {
    return null;
  }

  return gameState.scenePlan[gameState.currentSceneIndex] ?? null;
}

export function getSceneChoiceRecord(gameState: GameState, sceneId: string): SceneChoiceRecord | null {
  return gameState.sceneChoices[sceneId] ?? null;
}

export function getCurrentSceneChoice(gameState: GameState) {
  const scene = getCurrentScene(gameState);

  if (!scene) {
    return null;
  }

  return getSceneChoiceRecord(gameState, scene.id);
}

export function getCollapseCheckpoint(phase: CollapsePhase): CollapseCheckpoint | null {
  return collapseCheckpoints.find((checkpoint) => checkpoint.phase === phase) ?? null;
}

export function getPhaseCard(phase: Extract<RunPhase, "trial" | "ending">): PhaseCard {
  return phase === "trial" ? trialPlaceholder : endingPlaceholder;
}

export function getPhaseLabel(phase: RunPhase) {
  switch (phase) {
    case "loop_one":
    case "loop_two":
      return getLoopPhaseLabel(phase);
    case "collapse_one":
      return "Collapse One";
    case "collapse_two":
      return "Collapse Two";
    case "trial":
      return "Trial";
    case "ending":
      return "Ending";
    default:
      return "Run";
  }
}

export function getCurrentPhaseContent(gameState: GameState) {
  const scene = getCurrentScene(gameState);

  if (scene) {
    return {
      day: scene.day,
      location: scene.location,
      title: scene.title,
      description: scene.description,
    };
  }

  if (isCollapsePhase(gameState.phase)) {
    const checkpoint = getCollapseCheckpoint(gameState.phase);

    if (checkpoint) {
      return {
        day: checkpoint.day,
        location: checkpoint.location,
        title: checkpoint.title,
        description: checkpoint.description,
      };
    }
  }

  const phaseCard = getPhaseCard(
    gameState.phase === "trial" || gameState.phase === "ending" ? gameState.phase : "trial"
  );

  return {
    day: phaseCard.day,
    location: phaseCard.location,
    title: phaseCard.title,
    description: phaseCard.description,
  };
}

export function getNpcProfileById(npcId: NPCProfile["id"]) {
  return npcProfiles.find((profile) => profile.id === npcId) ?? null;
}

export function applyChoice(gameState: GameState, choice: Choice): GameState {
  if (!isLoopPhase(gameState.phase)) {
    return gameState;
  }

  const scene = getCurrentScene(gameState);

  if (!scene || gameState.sceneChoices[scene.id]) {
    return gameState;
  }

  const newMemories = choice.memoryEffects.map((effect, index) =>
    createMemoryItem(effect, scene, choice, scene.day, index)
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
    sceneChoices: {
      ...gameState.sceneChoices,
      [scene.id]: {
        sceneId: scene.id,
        choiceId: choice.id,
        choiceLabel: choice.label,
        outcomeText: choice.outcomeText,
      },
    },
    sceneStatus: choice.outcomeText,
  };
}

function advanceLoopScene(gameState: GameState): GameState {
  const scene = getCurrentScene(gameState);
  const currentIndex = gameState.currentSceneIndex;

  if (!scene || currentIndex === null || !gameState.sceneChoices[scene.id]) {
    return gameState;
  }

  const nextPhase = getNextRunPhase(gameState.phase);
  const nextDay = scene.day + 1;

  if (
    nextDay <= (gameState.phase === "loop_one" ? 7 : 14) &&
    !(gameState.phase === "loop_one" && nextDay === 8)
  ) {
    const { scenePlan, sceneIndex, scene: nextScene } = ensurePlannedSceneForDay(gameState, nextDay);

    return {
      ...gameState,
      currentDay: nextScene.day,
      currentSceneIndex: sceneIndex,
      scenePlan,
      sceneStatus: buildSceneIntro(nextScene, scene),
    };
  }

  if (!nextPhase || !isCollapsePhase(nextPhase)) {
    return gameState;
  }

  const checkpoint = getCollapseCheckpoint(nextPhase);

  if (!checkpoint) {
    return gameState;
  }

  return {
    ...gameState,
    phase: nextPhase,
    currentDay: checkpoint.day,
    currentSceneIndex: null,
    sceneStatus: checkpoint.description,
  };
}

function advanceCollapsePhase(gameState: GameState): GameState {
  if (!isCollapsePhase(gameState.phase)) {
    return gameState;
  }

  const checkpoint = getCollapseCheckpoint(gameState.phase);
  const nextPhase = getNextRunPhase(gameState.phase);

  if (!checkpoint || !nextPhase) {
    return gameState;
  }

  const nextMemories = applySevenDayForgetting(gameState.memories, checkpoint.nextDay);

  if (nextPhase === "loop_two") {
    const postCollapseState = {
      ...gameState,
      memories: nextMemories,
    };
    const { scenePlan, sceneIndex, scene: nextScene } = ensurePlannedSceneForDay(
      postCollapseState,
      checkpoint.nextDay
    );

    return {
      ...gameState,
      phase: nextPhase,
      currentDay: nextScene.day,
      currentSceneIndex: sceneIndex,
      scenePlan,
      memories: nextMemories,
      sceneStatus: buildSceneIntro(nextScene),
    };
  }

  const phaseCard =
    nextPhase === "trial" || nextPhase === "ending" ? getPhaseCard(nextPhase) : null;

  if (!phaseCard) {
    return gameState;
  }

  return {
    ...gameState,
    phase: nextPhase,
    currentDay: phaseCard.day,
    currentSceneIndex: null,
    memories: nextMemories,
    sceneStatus: phaseCard.description,
  };
}

function advanceStaticPhase(gameState: GameState): GameState {
  if (gameState.phase === "trial") {
    return {
      ...gameState,
      phase: "ending",
      currentDay: endingPlaceholder.day,
      currentSceneIndex: null,
      sceneStatus: endingPlaceholder.description,
    };
  }

  return gameState;
}

export function advanceRunPhase(gameState: GameState): GameState {
  if (isLoopPhase(gameState.phase)) {
    return advanceLoopScene(gameState);
  }

  if (isCollapsePhase(gameState.phase)) {
    return advanceCollapsePhase(gameState);
  }

  return advanceStaticPhase(gameState);
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

export function getAllNpcReactionsLocally(gameState: GameState): NpcReaction[] {
  return npcProfiles.map((profile) => getNpcReaction(gameState, profile));
}

function mergeUniqueStrings(existing: string[] | undefined, next: string[] | undefined) {
  return Array.from(
    new Set([
      ...(existing ?? []).filter((item) => item.trim().length > 0),
      ...((next ?? []).filter((item) => item.trim().length > 0) as string[]),
    ])
  );
}

function mergeUniqueRouteUnlocks(
  existing: RouteUnlock[] | undefined,
  next: RouteUnlock[] | undefined
) {
  return Array.from(new Set([...(existing ?? []), ...(next ?? [])]));
}

function mergeCollectedEvidence(
  existing: EvidenceSummary[] | undefined,
  next: EvidenceSummary[] | undefined
) {
  const evidenceById = new Map<string, EvidenceSummary>();

  for (const item of existing ?? []) {
    evidenceById.set(item.memory_id, item);
  }

  for (const item of next ?? []) {
    evidenceById.set(item.memory_id, item);
  }

  return Array.from(evidenceById.values());
}

export function applyNpcReaction(gameState: GameState, reaction: NPCReaction): GameState {
  const currentTrust = gameState.npcTrust?.[reaction.npc_id] ?? 0;
  const npcTrust = {
    ...(gameState.npcTrust ?? {}),
    [reaction.npc_id]: currentTrust + reaction.trust_delta,
  };
  const npcPriceModifiers =
    reaction.price_modifier === undefined
      ? { ...(gameState.npcPriceModifiers ?? {}) }
      : {
          ...(gameState.npcPriceModifiers ?? {}),
          [reaction.npc_id]: reaction.price_modifier,
        };
  const npcQuestAvailability =
    typeof reaction.quest_available === "boolean"
      ? {
          ...(gameState.npcQuestAvailability ?? {}),
          [reaction.npc_id]: reaction.quest_available,
        }
      : { ...(gameState.npcQuestAvailability ?? {}) };

  return {
    ...gameState,
    resources: {
      ...gameState.resources,
      legalRisk: gameState.resources.legalRisk + reaction.legal_risk_delta,
    },
    npcTrust,
    collectedEvidence: mergeCollectedEvidence(gameState.collectedEvidence, reaction.evidence),
    unlockedRoutes: mergeUniqueRouteUnlocks(gameState.unlockedRoutes, reaction.route_unlocks),
    npcPriceModifiers,
    npcQuestAvailability,
    flags: mergeUniqueStrings(gameState.flags, reaction.flags_set),
    latestNpcReaction: reaction,
  };
}

const STRUCTURED_NPC_AVAILABILITY: Record<StructuredNpcId, StructuredNpcAvailability> = {
  fox_ledger_master: {
    npcId: "fox_ledger_master",
    name: "Fox Ledger-Master",
    roleLabel: "Fox Market record keeper",
    actionLabel: "Ask about evidence",
  },
  crow_broker: {
    npcId: "crow_broker",
    name: "Crow Broker",
    roleLabel: "Public narrative broker",
    actionLabel: "Ask what they remember",
  },
  camp_healer: {
    npcId: "camp_healer",
    name: "Camp Healer",
    roleLabel: "Refugee camp witness",
    actionLabel: "Talk to witness",
  },
  village_apothecary: {
    npcId: "village_apothecary",
    name: "Village Apothecary",
    roleLabel: "Village medicine witness",
    actionLabel: "Ask about records",
  },
};

function scoreStructuredNpcForScene(scene: StoryScene, npcId: StructuredNpcId) {
  const text = [scene.title, scene.description, scene.location, ...(scene.routeTags ?? []), ...(scene.involvedNpcIds ?? [])]
    .join(" ")
    .toLowerCase();
  const routeTags = new Set(scene.routeTags ?? []);
  const involvedNpcIds = new Set(scene.involvedNpcIds ?? []);

  switch (npcId) {
    case "fox_ledger_master":
      return (
        (scene.location === "Fox Market" ? 5 : 0) +
        (routeTags.has("merchant") ? 4 : 0) +
        (involvedNpcIds.has("foxLedgerMaster") ? 5 : 0) +
        (text.includes("fox") ? 2 : 0) +
        (text.includes("ledger") ? 3 : 0) +
        (text.includes("contract") ? 3 : 0) +
        (text.includes("receipt") ? 3 : 0) +
        (text.includes("merchant") ? 2 : 0)
      );
    case "crow_broker":
      return (
        (routeTags.has("rumor") ? 4 : 0) +
        (involvedNpcIds.has("crowBrokerNarrator") ? 5 : 0) +
        (text.includes("crow") ? 3 : 0) +
        (text.includes("rumor") ? 3 : 0) +
        (text.includes("song") ? 2 : 0) +
        (text.includes("public") ? 2 : 0) +
        (text.includes("narrative") ? 2 : 0)
      );
    case "camp_healer":
      return (
        (scene.location === "River Refugee Camp" ? 5 : 0) +
        (routeTags.has("truth") ? 1 : 0) +
        (routeTags.has("rumor") ? 1 : 0) +
        (involvedNpcIds.has("campHealer") ? 5 : 0) +
        (text.includes("refugee") ? 3 : 0) +
        (text.includes("camp") ? 3 : 0) +
        (text.includes("medical") ? 3 : 0) +
        (text.includes("fever") ? 3 : 0) +
        (text.includes("necessity") ? 2 : 0) +
        (text.includes("witness") ? 2 : 0)
      );
    case "village_apothecary":
      return (
        (scene.location === "Deer Village" ? 5 : 0) +
        (routeTags.has("truth") ? 3 : 0) +
        (involvedNpcIds.has("villageApothecary") ? 5 : 0) +
        (text.includes("deer") ? 2 : 0) +
        (text.includes("village") ? 2 : 0) +
        (text.includes("medicine") ? 3 : 0) +
        (text.includes("inventory") ? 3 : 0) +
        (text.includes("apothecary") ? 3 : 0) +
        (text.includes("truth") ? 1 : 0)
      );
    default:
      return 0;
  }
}

export function getStructuredNpcAvailabilityForScene(
  scene: StoryScene | null
): StructuredNpcAvailability | null {
  if (!scene) {
    return null;
  }

  const ranked = (Object.keys(STRUCTURED_NPC_AVAILABILITY) as StructuredNpcId[])
    .map((npcId) => ({
      npcId,
      score: scoreStructuredNpcForScene(scene, npcId),
    }))
    .filter((candidate) => candidate.score >= 5)
    .sort((left, right) => right.score - left.score || compareText(left.npcId, right.npcId));

  if (ranked.length === 0) {
    return null;
  }

  return STRUCTURED_NPC_AVAILABILITY[ranked[0].npcId];
}

export function getStructuredNpcReactionKey(sceneId: string, npcId: StructuredNpcId) {
  return `${sceneId}:${npcId}`;
}

export function hasAppliedStructuredNpcReaction(
  gameState: GameState,
  sceneId: string,
  npcId: StructuredNpcId
) {
  const key = getStructuredNpcReactionKey(sceneId, npcId);
  return gameState.appliedNpcReactionKeys?.includes(key) ?? false;
}

export function markStructuredNpcReactionApplied(
  gameState: GameState,
  sceneId: string,
  npcId: StructuredNpcId
) {
  const key = getStructuredNpcReactionKey(sceneId, npcId);

  if (gameState.appliedNpcReactionKeys?.includes(key)) {
    return gameState;
  }

  return {
    ...gameState,
    appliedNpcReactionKeys: [...(gameState.appliedNpcReactionKeys ?? []), key],
  };
}

export function getRouteHintForScene(
  gameState: GameState,
  scene: StoryScene | null
): RouteUnlock | undefined {
  const sceneRoute = scene?.routeTags?.find(
    (tag): tag is RouteUnlock =>
      tag === "truth" || tag === "merchant" || tag === "rumor" || tag === "failure"
  );

  if (sceneRoute) {
    return sceneRoute;
  }

  return gameState.unlockedRoutes?.[gameState.unlockedRoutes.length - 1];
}

export function buildStructuredNpcReactionRequest(
  gameState: GameState,
  scene: StoryScene,
  sessionId: string,
  availability: StructuredNpcAvailability
): ReactionRequest {
  const route = getRouteHintForScene(gameState, scene);

  return {
    npc_id: availability.npcId,
    session_id: sessionId,
    player_input: `${availability.actionLabel}: ${scene.title} at ${scene.location}. ${scene.description}`,
    day: scene.day,
    route,
    known_memory_ids: gameState.memories.map((memory) => memory.id),
    game_state_summary: {
      trust: gameState.npcTrust,
      legal_risk: gameState.resources.legalRisk,
      silver: gameState.resources.silver,
      flags: gameState.flags ?? [],
      unlocked_routes: gameState.unlockedRoutes ?? [],
    },
  };
}

export function classifyCollectedEvidenceForTrialPreview(
  evidence: EvidenceSummary[] | undefined
): TrialPreviewItem[] {
  return (evidence ?? []).map((item) => {
    switch (item.type) {
      case "record":
      case "receipt":
      case "inventory":
        return {
          ...item,
          bucket: "strong_record",
          label: "Strong record",
        };
      case "law":
        return {
          ...item,
          bucket: "court_support",
          label: "Likely useful in court",
        };
      case "medical":
      case "testimony":
        return {
          ...item,
          bucket: "necessity_testimony",
          label: "Necessity testimony",
        };
      case "rumor":
      case "contradiction":
      default:
        return {
          ...item,
          bucket: "rumor_needs_support",
          label: "Rumor; needs support",
        };
    }
  });
}
