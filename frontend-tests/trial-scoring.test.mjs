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
  return structuredClone(mockData.initialGameState);
}

function playFixedSpine(choiceSequence) {
  assert.equal(choiceSequence.length, 14, "expected one choice per authored day");

  let state = freshState();

  for (const choiceId of choiceSequence) {
    const scene = gameLogic.getCurrentScene(state);

    assert.ok(scene, "expected an active scene while replaying the fixed spine");

    const choice = scene.choices.find((option) => option.id === choiceId);

    assert.ok(choice, `expected choice ${choiceId} on scene ${scene.id}`);

    state = gameLogic.applyChoice(state, choice);
    state = gameLogic.advanceRunPhase(state);

    if (state.phase === "collapse_one" || state.phase === "collapse_two") {
      state = gameLogic.advanceRunPhase(state);
    }
  }

  assert.equal(state.phase, "trial");
  assert.equal(state.currentDay, 15);

  return state;
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

test("fixed-spine route simulation reaches A1 Full Truth on a real 14-day path", () => {
  const result = trialLogic.evaluateTrialResult(playFixedSpine("AAAAAAAAABAAAA"));

  assert.equal(result.selectedEndingId, "A1");
});

test("fixed-spine route simulation reaches A2 Partial Truth on a real 14-day path", () => {
  const result = trialLogic.evaluateTrialResult(playFixedSpine("AAAAAAAAAAAAAA"));

  assert.equal(result.selectedEndingId, "A2");
});

test("fixed-spine route simulation reaches B Merchant Settlement on a real 14-day path", () => {
  const result = trialLogic.evaluateTrialResult(playFixedSpine("AAAAACABDADCDC"));

  assert.equal(result.selectedEndingId, "B");
});

test("fixed-spine route simulation reaches C Folk Hero on a real 14-day path", () => {
  const result = trialLogic.evaluateTrialResult(playFixedSpine("AAAAAABCDADBDD"));

  assert.equal(result.selectedEndingId, "C");
});

test("fixed-spine route simulation reaches D Guilty Exile on a real 14-day path", () => {
  const result = trialLogic.evaluateTrialResult(playFixedSpine("AAAAAAAAAABBAD"));

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
