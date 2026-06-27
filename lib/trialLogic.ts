import {
  EndingId,
  EvaluatedEvidence,
  GameState,
  MemoryItem,
  RetrievedEvidence,
  RumorConflict,
  TrialResult,
  TrialScoreModifiers,
  TrialScoreThresholds,
} from "@/lib/types";
import {
  getActiveEvidence,
  getExpiredMemories,
  getNpcEvidenceEvaluations,
  getNpcProfileById,
} from "@/lib/gameLogic";
import { endingOutcomes } from "@/lib/mockData";

export const TRIAL_SCORE_THRESHOLDS: TrialScoreThresholds = {
  fullTruth: 12,
  partialTruth: 8,
  merchantSettlement: 8,
  publicSympathy: 8,
  overwhelmingFailure: 11,
  maxFailureForFullTruth: 6,
  maxFailureForPartialTruth: 8,
  maxFailureForMerchant: 8,
  maxFailureForFolkHero: 8,
};

const LEGAL_TRUTH_WEIGHTS = new Map<string, number>([
  ["Royal Tax Hold Order", 3],
  ["Tax Officer Travel Ledger", 3],
  ["Royal Tax Seal Copy", 3],
  ["Royal Seal Route Map", 3],
  ["Fox Medicine Stock Ledger", 3],
  ["Audit Gap", 3],
  ["Deer Doctor Diary", 2],
  ["Refugee Treatment Roster", 2],
  ["Protected Doctor Statement", 2],
  ["Missing Dose Table", 2],
  ["Court Intake Statement", 2],
  ["Clarified Testimony Sheet", 2],
  ["Crate Seal Date Mismatch", 1],
  ["Evidence Filing Receipt", 1],
  ["Gate Challenge Record", 1],
  ["Factual Road Notice", 1],
  ["Preserved Witness Statement", 1],
  ["Sorted Court Packet", 1],
  ["Witness Ready List", 1],
  ["Last Night Docket Note", 1],
]);

const MERCHANT_SETTLEMENT_WEIGHTS = new Map<string, number>([
  ["Market Settlement Contract", 4],
  ["Merchant Packet", 4],
  ["Fox Audit Seal", 3],
  ["Clean-Looking Route Ledger", 2],
  ["Black Market Debt Note", 1],
  ["Fox Buyer Interest", 1],
]);

const PUBLIC_SYMPATHY_WEIGHTS = new Map<string, number>([
  ["Camp Healing Song", 3],
  ["Refugee Song", 3],
  ["Nightfire Chorus", 2],
  ["Song Packet", 2],
  ["Crow Hero Broadside", 2],
  ["Village Gate Sympathy", 1],
  ["Midnight Leak Rumor", 1],
]);

const FAILURE_PRESSURE_WEIGHTS = new Map<string, number>([
  ["Wanted Notice", 4],
  ["Flight Attempt Notice", 4],
  ["Broken Storeroom Seal", 3],
  ["Guard Reads Wanted Notice", 3],
  ["Tampered Storeroom Ledger", 2],
  ["Ledger Discrepancy", 2],
  ["False Alibi Rumor", 2],
  ["Practiced Alibi Story", 2],
  ["Contradiction Sheet", 2],
  ["Public Suspicion Entry", 2],
  ["Blackmail Trace", 2],
  ["Sold Ledger Rumor", 2],
  ["Noisy Docket", 2],
  ["Late Filing Note", 1],
  ["Black Market Debt Note", 1],
  ["Whispered Bribe Story", 1],
  ["Work-for-Medicine Story", 1],
]);

const ROYAL_TAX_TITLES = new Set([
  "Royal Tax Hold Order",
  "Royal Tax Seal Copy",
  "Tax Officer Travel Ledger",
  "Royal Seal Route Map",
]);

const FOX_CONTROL_TITLES = new Set([
  "Fox Medicine Stock Ledger",
  "Audit Gap",
]);

const NECESSITY_TITLES = new Set([
  "Apothecary Receipt",
  "Refugee Treatment Roster",
  "Protected Doctor Statement",
  "Missing Dose Table",
  "Deer Doctor Diary",
]);

const SETTLEMENT_TITLES = new Set([
  "Market Settlement Contract",
  "Merchant Packet",
  "Fox Audit Seal",
  "Clean-Looking Route Ledger",
]);

const HERO_TITLES = new Set([
  "Camp Healing Song",
  "Refugee Song",
  "Crow Hero Broadside",
  "Nightfire Chorus",
  "Village Gate Sympathy",
  "Song Packet",
  "Midnight Leak Rumor",
]);

function hasTag(evidence: RetrievedEvidence | EvaluatedEvidence | MemoryItem, tag: string) {
  return "metadata" in evidence ? evidence.metadata.tags.includes(tag) : evidence.tags.includes(tag);
}

function sumEvidenceWeights(
  evidence: Array<RetrievedEvidence | EvaluatedEvidence>,
  weights: Map<string, number>
) {
  return evidence.reduce((total, item) => total + (weights.get(item.title) ?? 0), 0);
}

function detectRumorConflicts(
  activeEvidence: RetrievedEvidence[],
  rejectedEvidence: EvaluatedEvidence[]
): RumorConflict[] {
  const publicNarratives = activeEvidence.filter(
    (item) => item.visibility === "public" && (item.sourceType === "rumor" || item.sourceType === "song")
  );
  const heroNarratives = publicNarratives.filter(
    (item) => hasTag(item, "public-sympathy") || HERO_TITLES.has(item.title)
  );
  const contradictionNarratives = publicNarratives.filter(
    (item) => hasTag(item, "contradiction") || item.evidenceRole === "incriminating"
  );
  const unsupportedRumors = rejectedEvidence.filter(
    (item) =>
      item.sourceType === "rumor" &&
      (hasTag(item, "contradiction") || item.evidenceRole === "incriminating")
  );
  const conflicts: RumorConflict[] = [];

  if (heroNarratives.length > 0 && contradictionNarratives.length > 0) {
    conflicts.push({
      id: "hero-vs-contradiction",
      title: "Heroic songs clash with incriminating rumors",
      reason:
        "Public sympathy exists, but at least one active rumor or song also makes the caravan look deceptive.",
      memoryIds: [...heroNarratives, ...contradictionNarratives].map((item) => item.memoryId),
    });
  }

  if (contradictionNarratives.length >= 2) {
    conflicts.push({
      id: "multiple-contradictions",
      title: "The rumor trail contradicts itself",
      reason:
        "Multiple active contradictory public narratives survive into the trial window.",
      memoryIds: contradictionNarratives.map((item) => item.memoryId),
    });
  }

  if (unsupportedRumors.length >= 2) {
    conflicts.push({
      id: "unsupported-rumor-pile",
      title: "Bear Court sees a pile of unsupported rumor",
      reason:
        "Several rumor lines remain active but fail Bear Court scrutiny, which weakens coherent defense.",
      memoryIds: unsupportedRumors.map((item) => item.memoryId),
    });
  }

  return conflicts;
}

function getTrialScoreModifiers(gameState: GameState): TrialScoreModifiers {
  const bearCourtModifier =
    gameState.factions.bearCourt >= 2 ? 2 : gameState.factions.bearCourt > 0 ? 1 : gameState.factions.bearCourt <= -2 ? -1 : 0;
  const foxMarketModifier =
    gameState.factions.foxMarket >= 2 ? 2 : gameState.factions.foxMarket > 0 ? 1 : gameState.factions.foxMarket <= -2 ? -1 : 0;
  const refugeeModifier =
    gameState.factions.refugees >= 2 ? 2 : gameState.factions.refugees > 0 ? 1 : gameState.factions.refugees <= -2 ? -1 : 0;
  const crowModifier =
    gameState.factions.crowBrokers >= 2 ? 1 : gameState.factions.crowBrokers > 0 ? 1 : gameState.factions.crowBrokers <= -2 ? -1 : 0;
  const deerVillageModifier =
    gameState.factions.deerVillage <= -2 ? 2 : gameState.factions.deerVillage < 0 ? 1 : gameState.factions.deerVillage >= 2 ? -1 : 0;
  const legalRiskModifier =
    gameState.resources.legalRisk >= 9
      ? 3
      : gameState.resources.legalRisk >= 6
        ? 2
        : gameState.resources.legalRisk >= 3
          ? 1
          : 0;

  return {
    bearCourtModifier,
    foxMarketModifier,
    refugeeModifier,
    crowModifier,
    deerVillageModifier,
    legalRiskModifier,
  };
}

function getExpiredFavorableWitnessPressure(expiredMemories: MemoryItem[]) {
  return expiredMemories.filter(
    (item) =>
      item.type === "short_term" &&
      item.evidenceRole !== "incriminating" &&
      (item.tags.includes("necessity") || item.tags.includes("truth-route") || item.tags.includes("witness"))
  ).length;
}

function selectEndingId(
  legalTruthScore: number,
  merchantSettlementScore: number,
  publicSympathyScore: number,
  failurePressure: number,
  flags: {
    hasRoyalTaxEvidence: boolean;
    hasFoxControlEvidence: boolean;
    hasSystemEvidence: boolean;
    hasNecessityEvidence: boolean;
    hasSettlementEvidence: boolean;
    hasPublicHeroEvidence: boolean;
  }
): EndingId {
  const failureOverwhelmsDefense =
    failurePressure >= TRIAL_SCORE_THRESHOLDS.overwhelmingFailure &&
    failurePressure > legalTruthScore &&
    failurePressure > merchantSettlementScore &&
    failurePressure > publicSympathyScore;

  if (
    !failureOverwhelmsDefense &&
    legalTruthScore >= TRIAL_SCORE_THRESHOLDS.fullTruth &&
    flags.hasRoyalTaxEvidence &&
    flags.hasFoxControlEvidence &&
    flags.hasNecessityEvidence &&
    failurePressure <= TRIAL_SCORE_THRESHOLDS.maxFailureForFullTruth
  ) {
    return "A1";
  }

  if (
    !failureOverwhelmsDefense &&
    legalTruthScore >= TRIAL_SCORE_THRESHOLDS.partialTruth &&
    flags.hasNecessityEvidence &&
    flags.hasSystemEvidence &&
    failurePressure <= TRIAL_SCORE_THRESHOLDS.maxFailureForPartialTruth
  ) {
    return "A2";
  }

  if (
    !failureOverwhelmsDefense &&
    merchantSettlementScore >= TRIAL_SCORE_THRESHOLDS.merchantSettlement &&
    flags.hasSettlementEvidence &&
    failurePressure <= TRIAL_SCORE_THRESHOLDS.maxFailureForMerchant
  ) {
    return "B";
  }

  if (
    !failureOverwhelmsDefense &&
    publicSympathyScore >= TRIAL_SCORE_THRESHOLDS.publicSympathy &&
    flags.hasPublicHeroEvidence &&
    failurePressure <= TRIAL_SCORE_THRESHOLDS.maxFailureForFolkHero
  ) {
    return "C";
  }

  return "D";
}

export function evaluateTrialResult(gameState: GameState): TrialResult {
  const bearJudge = getNpcProfileById("bearJudge");

  if (!bearJudge) {
    throw new Error("Missing bearJudge profile for trial evaluation.");
  }

  const activeEvidence = getActiveEvidence(gameState.memories);
  const evaluations = getNpcEvidenceEvaluations(bearJudge, gameState.memories);
  const acceptedEvidence = evaluations.filter((item) => item.decision === "accepted");
  const rejectedEvidence = evaluations.filter((item) => item.decision === "rejected");
  const expiredMemories = getExpiredMemories(gameState.memories);
  const rumorConflicts = detectRumorConflicts(activeEvidence, rejectedEvidence);
  const modifiers = getTrialScoreModifiers(gameState);

  const systemAcceptedEvidence = acceptedEvidence.filter(
    (item) => hasTag(item, "system-evidence") || ROYAL_TAX_TITLES.has(item.title) || FOX_CONTROL_TITLES.has(item.title)
  );
  const necessityAcceptedEvidence = acceptedEvidence.filter(
    (item) => hasTag(item, "necessity") || NECESSITY_TITLES.has(item.title)
  );
  const settlementAcceptedEvidence = acceptedEvidence.filter(
    (item) => hasTag(item, "merchant-route") || SETTLEMENT_TITLES.has(item.title)
  );
  const publicHeroEvidence = activeEvidence.filter(
    (item) =>
      item.visibility === "public" &&
      (hasTag(item, "public-sympathy") || HERO_TITLES.has(item.title))
  );

  let legalTruthScore =
    sumEvidenceWeights(acceptedEvidence, LEGAL_TRUTH_WEIGHTS) +
    modifiers.bearCourtModifier +
    (systemAcceptedEvidence.length >= 3 ? 1 : 0);

  let merchantSettlementScore =
    sumEvidenceWeights(acceptedEvidence, MERCHANT_SETTLEMENT_WEIGHTS) +
    modifiers.foxMarketModifier;

  if (systemAcceptedEvidence.some((item) => FOX_CONTROL_TITLES.has(item.title))) {
    merchantSettlementScore -= 2;
  }

  let publicSympathyScore =
    sumEvidenceWeights(publicHeroEvidence, PUBLIC_SYMPATHY_WEIGHTS) +
    modifiers.refugeeModifier +
    modifiers.crowModifier -
    rumorConflicts.length * 2;

  const rejectedRumorPenalty = rejectedEvidence.filter(
    (item) =>
      item.sourceType === "rumor" &&
      (hasTag(item, "contradiction") || item.evidenceRole === "incriminating")
  ).length;
  const expiredFavorableWitnessPressure = getExpiredFavorableWitnessPressure(expiredMemories);

  let failurePressure =
    sumEvidenceWeights(acceptedEvidence, FAILURE_PRESSURE_WEIGHTS) +
    rejectedRumorPenalty +
    expiredFavorableWitnessPressure +
    rumorConflicts.length * 2 +
    modifiers.deerVillageModifier +
    modifiers.legalRiskModifier;

  if (gameState.factions.bearCourt < 0) {
    failurePressure += 1;
  }

  legalTruthScore = Math.max(0, legalTruthScore);
  merchantSettlementScore = Math.max(0, merchantSettlementScore);
  publicSympathyScore = Math.max(0, publicSympathyScore);
  failurePressure = Math.max(0, failurePressure);

  const flags = {
    hasRoyalTaxEvidence: acceptedEvidence.some((item) => ROYAL_TAX_TITLES.has(item.title)),
    hasFoxControlEvidence: acceptedEvidence.some((item) => FOX_CONTROL_TITLES.has(item.title)),
    hasSystemEvidence: systemAcceptedEvidence.length > 0,
    hasNecessityEvidence: necessityAcceptedEvidence.length > 0,
    hasSettlementEvidence: settlementAcceptedEvidence.length > 0,
    hasPublicHeroEvidence: publicHeroEvidence.length > 0,
  };
  const selectedEndingId = selectEndingId(
    legalTruthScore,
    merchantSettlementScore,
    publicSympathyScore,
    failurePressure,
    flags
  );
  const outcome = endingOutcomes[selectedEndingId];
  const debugLines = [
    `Legal Truth ${legalTruthScore} comes from ${acceptedEvidence.length} Bear Court-accepted items, with ${systemAcceptedEvidence.length} system links and ${necessityAcceptedEvidence.length} necessity links.`,
    `Merchant Settlement ${merchantSettlementScore} weighs accepted settlement papers against any public Fox Market exposure.`,
    `Public Sympathy ${publicSympathyScore} tracks public songs, broadsides, and refugee memory after ${rumorConflicts.length} rumor conflict penalties.`,
    `Failure Pressure ${failurePressure} includes incriminating records, unsupported rumor, ${expiredFavorableWitnessPressure} expired favorable witness traces, and legal risk ${gameState.resources.legalRisk}.`,
    `Selected ending ${outcome.title} by priority after checking Full Truth, Partial Truth, Merchant Settlement, Folk Hero, then Guilty Exile.`,
  ];

  return {
    legalTruthScore,
    merchantSettlementScore,
    publicSympathyScore,
    failurePressure,
    selectedEndingId,
    endingRoute: outcome.route,
    outcome,
    acceptedEvidence,
    rejectedEvidence,
    expiredMemories,
    rumorConflicts,
    thresholds: TRIAL_SCORE_THRESHOLDS,
    modifiers,
    debugLines,
  };
}
