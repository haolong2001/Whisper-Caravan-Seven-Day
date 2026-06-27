import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const repoRoot = process.cwd();
const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "whisper-caravan-trial-"));
const modulesToCompile = [
  "lib/types.ts",
  "lib/mockData.ts",
  "lib/gameLogic.ts",
  "lib/trialLogic.ts",
];

for (const modulePath of modulesToCompile) {
  await compileModule(modulePath);
}

const trialLogic = await importCompiledModule("lib/trialLogic.js");
const mockData = await importCompiledModule("lib/mockData.js");
const gameLogic = await importCompiledModule("lib/gameLogic.js");

function toPosixPath(filePath) {
  return filePath.split(path.sep).join(path.posix.sep);
}

function rewriteAliasImports(sourceText, relativePath) {
  const fromDir = path.posix.dirname(toPosixPath(relativePath));

  return sourceText.replace(/from\s+["']@\/(.+?)["']/g, (_, specifier) => {
    const targetPath = `${specifier}.js`;
    const relativeTarget = path.posix.relative(fromDir, targetPath);
    const normalizedTarget = relativeTarget.startsWith(".")
      ? relativeTarget
      : `./${relativeTarget}`;

    return `from "${normalizedTarget}"`;
  });
}

async function compileModule(relativePath) {
  const sourcePath = path.join(repoRoot, relativePath);
  const sourceText = await fs.readFile(sourcePath, "utf8");
  const rewrittenSource = rewriteAliasImports(sourceText, relativePath);
  const transpiled = ts.transpileModule(rewrittenSource, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
    fileName: relativePath,
  });
  const outputPath = path.join(tempDir, relativePath.replace(/\.ts$/, ".js"));

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, transpiled.outputText, "utf8");
}

async function importCompiledModule(relativePath) {
  const fileUrl = pathToFileURL(path.join(tempDir, relativePath)).href;
  return import(fileUrl);
}

function createMemory({
  id,
  title,
  type = "record",
  visibility = "public",
  reliability = 0.88,
  evidenceRole = "favorable",
  tags = [],
  active = true,
  persistent = type !== "short_term",
  createdDay = 10,
  expiresOn,
}) {
  return {
    id,
    title,
    text: `${title} text`,
    type,
    visibility,
    location: "Bear Court",
    source: title,
    createdDay,
    expiresOn,
    persistent,
    active,
    reliability,
    evidenceRole,
    tags,
  };
}

function buildState(memories, overrides = {}) {
  return {
    phase: "trial",
    currentDay: 15,
    currentSceneIndex: null,
    memories,
    factions: {
      deerVillage: 0,
      refugees: 0,
      foxMarket: 0,
      crowBrokers: 0,
      bearCourt: 0,
      ...overrides.factions,
    },
    resources: {
      silver: 8,
      medicine: 0,
      provisions: 4,
      legalRisk: 0,
      ...overrides.resources,
    },
    sceneChoices: {},
    sceneStatus: "trial",
  };
}

function freshState() {
  return mockData.createInitialGameState();
}

function playRoute(strategy) {
  let state = freshState();

  while (state.phase !== "trial" && state.phase !== "ending") {
    if (state.phase === "collapse_one" || state.phase === "collapse_two") {
      state = gameLogic.advanceRunPhase(state);
      continue;
    }

    const scene = gameLogic.getCurrentScene(state);
    assert.ok(scene, "expected an active scene during route-dependent replay");

    const choiceId = strategy(scene, state);
    const choice = scene.choices.find((option) => option.id === choiceId);

    assert.ok(choice, `expected choice ${choiceId} on scene ${scene.id}`);

    state = gameLogic.applyChoice(state, choice);
    state = gameLogic.advanceRunPhase(state);
  }

  assert.equal(state.phase, "trial");
  assert.equal(state.currentDay, 15);

  return state;
}

function truthStrategy(scene) {
  const map = {
    "deer-village-medicine-conflict": "A",
    "fever-at-river-camp": "A",
    "tax-seal-on-the-crates": "A",
    "fox-ledger-offer": "B",
    "crow-relay-framing": "C",
    "deer-doctors-hidden-diary": "B",
    "border-toll-inspection": "A",
    "rabbit-witness-at-mistwood": "A",
    "black-market-price-list": "A",
    "refugee-witness-circle": "A",
    "smuggler-debt-call": "B",
    "first-memory-collapse-night": "A",
    "return-to-deer-village-gate": "A",
    "bear-court-intake-window": "A",
    "fox-audit-second-pass": "B",
    "crow-story-backfires": "A",
    "deer-archivists-index": "A",
    "market-settlement-dinner": "C",
    "refugee-song-festival": "B",
    "tax-officers-travel-ledger": "A",
    "medicine-price-spike": "A",
    "witness-contradiction-hearing": "A",
    "crow-brokers-final-spin": "C",
    "court-packet-sorting": "A",
    "final-counter-offer": "A",
    "eve-of-bear-court": "B",
  };

  return map[scene.id] ?? "A";
}

function merchantStrategy(scene) {
  const map = {
    "deer-village-medicine-conflict": "A",
    "fever-at-river-camp": "C",
    "tax-seal-on-the-crates": "C",
    "fox-ledger-offer": "A",
    "crow-relay-framing": "C",
    "deer-doctors-hidden-diary": "C",
    "border-toll-inspection": "A",
    "rabbit-witness-at-mistwood": "B",
    "black-market-price-list": "C",
    "refugee-witness-circle": "C",
    "smuggler-debt-call": "A",
    "first-memory-collapse-night": "C",
    "return-to-deer-village-gate": "B",
    "bear-court-intake-window": "D",
    "fox-audit-second-pass": "A",
    "crow-story-backfires": "C",
    "deer-archivists-index": "D",
    "market-settlement-dinner": "A",
    "refugee-song-festival": "D",
    "tax-officers-travel-ledger": "C",
    "medicine-price-spike": "B",
    "witness-contradiction-hearing": "D",
    "crow-brokers-final-spin": "B",
    "court-packet-sorting": "B",
    "final-counter-offer": "B",
    "eve-of-bear-court": "A",
  };

  return map[scene.id] ?? "A";
}

function rumorStrategy(scene) {
  const map = {
    "deer-village-medicine-conflict": "A",
    "fever-at-river-camp": "B",
    "tax-seal-on-the-crates": "C",
    "fox-ledger-offer": "D",
    "crow-relay-framing": "A",
    "deer-doctors-hidden-diary": "D",
    "border-toll-inspection": "D",
    "rabbit-witness-at-mistwood": "C",
    "black-market-price-list": "C",
    "refugee-witness-circle": "B",
    "smuggler-debt-call": "B",
    "first-memory-collapse-night": "B",
    "return-to-deer-village-gate": "C",
    "bear-court-intake-window": "C",
    "fox-audit-second-pass": "D",
    "crow-story-backfires": "A",
    "deer-archivists-index": "D",
    "market-settlement-dinner": "D",
    "refugee-song-festival": "A",
    "tax-officers-travel-ledger": "D",
    "medicine-price-spike": "C",
    "witness-contradiction-hearing": "D",
    "crow-brokers-final-spin": "A",
    "court-packet-sorting": "C",
    "final-counter-offer": "C",
    "eve-of-bear-court": "C",
  };

  return map[scene.id] ?? "A";
}

function failureStrategy(scene) {
  const map = {
    "deer-village-medicine-conflict": "B",
    "fever-at-river-camp": "D",
    "tax-seal-on-the-crates": "B",
    "fox-ledger-offer": "C",
    "crow-relay-framing": "D",
    "deer-doctors-hidden-diary": "C",
    "border-toll-inspection": "B",
    "rabbit-witness-at-mistwood": "D",
    "black-market-price-list": "D",
    "refugee-witness-circle": "D",
    "smuggler-debt-call": "D",
    "first-memory-collapse-night": "D",
    "return-to-deer-village-gate": "D",
    "bear-court-intake-window": "D",
    "fox-audit-second-pass": "C",
    "crow-story-backfires": "B",
    "deer-archivists-index": "C",
    "market-settlement-dinner": "D",
    "refugee-song-festival": "D",
    "tax-officers-travel-ledger": "B",
    "medicine-price-spike": "D",
    "witness-contradiction-hearing": "B",
    "crow-brokers-final-spin": "D",
    "court-packet-sorting": "D",
    "final-counter-offer": "D",
    "eve-of-bear-court": "D",
  };

  return map[scene.id] ?? "A";
}

test("trial evaluator is deterministic for the same game state", () => {
  const state = buildState([
    createMemory({
      id: "1",
      title: "Royal Tax Seal Copy",
      tags: ["starter-spine", "system-evidence", "truth-route"],
    }),
    createMemory({
      id: "2",
      title: "Refugee Treatment Roster",
      tags: ["starter-spine", "necessity", "truth-route"],
    }),
    createMemory({
      id: "3",
      title: "Court Intake Statement",
      type: "contract",
      tags: ["starter-spine", "truth-route", "court-filing"],
    }),
  ]);

  assert.deepEqual(trialLogic.evaluateTrialResult(state), trialLogic.evaluateTrialResult(state));
});

test("A1 Full Truth is reachable with strong tax, Fox, and necessity evidence", () => {
  const state = buildState(
    [
      createMemory({
        id: "1",
        title: "Royal Tax Seal Copy",
        tags: ["starter-spine", "system-evidence", "truth-route"],
      }),
      createMemory({
        id: "2",
        title: "Tax Officer Travel Ledger",
        tags: ["starter-spine", "system-evidence", "truth-route"],
      }),
      createMemory({
        id: "3",
        title: "Fox Medicine Stock Ledger",
        tags: ["starter-spine", "system-evidence", "truth-route"],
      }),
      createMemory({
        id: "4",
        title: "Refugee Treatment Roster",
        tags: ["starter-spine", "necessity", "truth-route"],
      }),
      createMemory({
        id: "5",
        title: "Protected Doctor Statement",
        tags: ["starter-spine", "necessity", "truth-route"],
      }),
      createMemory({
        id: "6",
        title: "Court Intake Statement",
        type: "contract",
        tags: ["starter-spine", "truth-route", "court-filing"],
      }),
    ],
    { factions: { bearCourt: 1, refugees: 1 } }
  );

  const result = trialLogic.evaluateTrialResult(state);

  assert.equal(result.selectedEndingId, "A1");
  assert.ok(result.legalTruthScore >= result.thresholds.fullTruth);
});

test("A2 Partial Truth is reachable with necessity and incomplete system evidence", () => {
  const state = buildState([
    createMemory({
      id: "1",
      title: "Royal Tax Seal Copy",
      tags: ["starter-spine", "system-evidence", "truth-route"],
    }),
    createMemory({
      id: "2",
      title: "Refugee Treatment Roster",
      tags: ["starter-spine", "necessity", "truth-route"],
    }),
    createMemory({
      id: "3",
      title: "Protected Doctor Statement",
      tags: ["starter-spine", "necessity", "truth-route"],
    }),
    createMemory({
      id: "4",
      title: "Court Intake Statement",
      type: "contract",
      tags: ["starter-spine", "truth-route", "court-filing"],
    }),
    createMemory({
      id: "5",
      title: "Wanted Notice",
      evidenceRole: "incriminating",
      tags: ["starter-spine", "wanted-notice", "act-evidence"],
    }),
  ]);

  const result = trialLogic.evaluateTrialResult(state);

  assert.equal(result.selectedEndingId, "A2");
  assert.ok(result.legalTruthScore >= result.thresholds.partialTruth);
});

test("B Merchant Settlement is reachable with settlement and audit paperwork", () => {
  const state = buildState(
    [
      createMemory({
        id: "1",
        title: "Merchant Packet",
        type: "contract",
        tags: ["starter-spine", "merchant-route"],
      }),
      createMemory({
        id: "2",
        title: "Fox Audit Seal",
        tags: ["starter-spine", "merchant-route"],
      }),
      createMemory({
        id: "3",
        title: "Clean-Looking Route Ledger",
        tags: ["starter-spine", "merchant-route"],
      }),
    ],
    { factions: { foxMarket: 1 } }
  );

  const result = trialLogic.evaluateTrialResult(state);

  assert.equal(result.selectedEndingId, "B");
  assert.ok(result.merchantSettlementScore >= result.thresholds.merchantSettlement);
});

test("C Folk Hero is reachable with strong public songs, rumor, and sympathy", () => {
  const state = buildState(
    [
      createMemory({
        id: "1",
        title: "Camp Healing Song",
        type: "song",
        reliability: 0.76,
        tags: ["starter-spine", "public-sympathy", "rumor-route"],
      }),
      createMemory({
        id: "2",
        title: "Crow Hero Broadside",
        type: "rumor",
        reliability: 0.72,
        tags: ["starter-spine", "public-sympathy", "rumor-route"],
      }),
      createMemory({
        id: "3",
        title: "Nightfire Chorus",
        type: "song",
        reliability: 0.74,
        tags: ["starter-spine", "collapse", "rumor-route", "public-sympathy"],
      }),
      createMemory({
        id: "4",
        title: "Village Gate Sympathy",
        type: "rumor",
        reliability: 0.65,
        tags: ["starter-spine", "public-sympathy"],
      }),
    ],
    { factions: { refugees: 2, crowBrokers: 1 } }
  );

  const result = trialLogic.evaluateTrialResult(state);

  assert.equal(result.selectedEndingId, "C");
  assert.ok(result.publicSympathyScore >= result.thresholds.publicSympathy);
});

test("D Guilty Exile happens when failure pressure overwhelms the defense", () => {
  const state = buildState(
    [
      createMemory({
        id: "1",
        title: "Wanted Notice",
        evidenceRole: "incriminating",
        tags: ["starter-spine", "wanted-notice", "act-evidence"],
      }),
      createMemory({
        id: "2",
        title: "Broken Storeroom Seal",
        evidenceRole: "incriminating",
        tags: ["starter-spine", "broken-seal", "act-evidence"],
      }),
      createMemory({
        id: "3",
        title: "Tampered Storeroom Ledger",
        evidenceRole: "incriminating",
        tags: ["starter-spine", "contradiction"],
      }),
      createMemory({
        id: "4",
        title: "False Alibi Rumor",
        type: "rumor",
        reliability: 0.66,
        evidenceRole: "incriminating",
        tags: ["starter-spine", "contradiction", "rumor-route"],
      }),
      createMemory({
        id: "5",
        title: "Contradiction Sheet",
        evidenceRole: "incriminating",
        reliability: 0.78,
        tags: ["starter-spine", "contradiction"],
      }),
      createMemory({
        id: "6",
        title: "Quiet Aid Witness",
        type: "short_term",
        visibility: "private",
        reliability: 0.67,
        active: false,
        persistent: false,
        expiresOn: 8,
        evidenceRole: "favorable",
        tags: ["starter-spine", "necessity", "witness"],
        createdDay: 1,
      }),
    ],
    { resources: { legalRisk: 8 }, factions: { deerVillage: -2, bearCourt: -1 } }
  );

  const result = trialLogic.evaluateTrialResult(state);

  assert.equal(result.selectedEndingId, "D");
  assert.ok(result.failurePressure >= result.thresholds.overwhelmingFailure);
});

test("route-dependent truth simulation resolves a real 14-day path", () => {
  const result = trialLogic.evaluateTrialResult(playRoute(truthStrategy));

  assert.ok(["A1", "A2"].includes(result.selectedEndingId));
});

test("route-dependent merchant simulation resolves a real 14-day path", () => {
  const result = trialLogic.evaluateTrialResult(playRoute(merchantStrategy));

  assert.ok(["B", "A2"].includes(result.selectedEndingId));
});

test("route-dependent rumor simulation resolves a real 14-day path", () => {
  const result = trialLogic.evaluateTrialResult(playRoute(rumorStrategy));

  assert.ok(["C", "A2"].includes(result.selectedEndingId));
});

test("route-dependent failure simulation resolves a real 14-day path", () => {
  const result = trialLogic.evaluateTrialResult(playRoute(failureStrategy));

  assert.equal(result.selectedEndingId, "D");
});

test("ending priority prefers truth over rumor when both are strong", () => {
  const state = buildState(
    [
      createMemory({
        id: "1",
        title: "Royal Tax Seal Copy",
        tags: ["starter-spine", "system-evidence", "truth-route"],
      }),
      createMemory({
        id: "2",
        title: "Tax Officer Travel Ledger",
        tags: ["starter-spine", "system-evidence", "truth-route"],
      }),
      createMemory({
        id: "3",
        title: "Fox Medicine Stock Ledger",
        tags: ["starter-spine", "system-evidence", "truth-route"],
      }),
      createMemory({
        id: "4",
        title: "Refugee Treatment Roster",
        tags: ["starter-spine", "necessity", "truth-route"],
      }),
      createMemory({
        id: "5",
        title: "Court Intake Statement",
        type: "contract",
        tags: ["starter-spine", "truth-route", "court-filing"],
      }),
      createMemory({
        id: "6",
        title: "Camp Healing Song",
        type: "song",
        reliability: 0.76,
        tags: ["starter-spine", "public-sympathy", "rumor-route"],
      }),
      createMemory({
        id: "7",
        title: "Crow Hero Broadside",
        type: "rumor",
        reliability: 0.72,
        tags: ["starter-spine", "public-sympathy", "rumor-route"],
      }),
    ]
  );

  const result = trialLogic.evaluateTrialResult(state);

  assert.equal(result.selectedEndingId, "A1");
});

test("expired memories and rumor conflicts change scoring pressure", () => {
  const calmState = buildState(
    [
      createMemory({
        id: "1",
        title: "Camp Healing Song",
        type: "song",
        reliability: 0.76,
        tags: ["starter-spine", "public-sympathy", "rumor-route"],
      }),
      createMemory({
        id: "2",
        title: "Crow Hero Broadside",
        type: "rumor",
        reliability: 0.72,
        tags: ["starter-spine", "public-sympathy", "rumor-route"],
      }),
    ],
    { factions: { refugees: 1, crowBrokers: 1 } }
  );
  const conflictedState = buildState(
    [
      ...calmState.memories,
      createMemory({
        id: "3",
        title: "False Alibi Rumor",
        type: "rumor",
        reliability: 0.66,
        evidenceRole: "incriminating",
        tags: ["starter-spine", "contradiction", "rumor-route"],
      }),
      createMemory({
        id: "4",
        title: "Work-for-Medicine Story",
        type: "rumor",
        reliability: 0.6,
        evidenceRole: "incriminating",
        tags: ["starter-spine", "contradiction"],
      }),
      createMemory({
        id: "5",
        title: "Quiet Aid Witness",
        type: "short_term",
        visibility: "private",
        reliability: 0.67,
        active: false,
        persistent: false,
        expiresOn: 8,
        evidenceRole: "favorable",
        tags: ["starter-spine", "necessity", "witness"],
        createdDay: 1,
      }),
    ],
    { factions: { refugees: 1, crowBrokers: 1 } }
  );

  const calmResult = trialLogic.evaluateTrialResult(calmState);
  const conflictedResult = trialLogic.evaluateTrialResult(conflictedState);

  assert.ok(conflictedResult.failurePressure > calmResult.failurePressure);
  assert.ok(conflictedResult.publicSympathyScore < calmResult.publicSympathyScore);
  assert.ok(conflictedResult.rumorConflicts.length > 0);
});
