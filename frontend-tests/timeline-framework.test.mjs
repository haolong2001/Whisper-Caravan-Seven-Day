import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "whisper-caravan-timeline-"));

const modulesToCompile = ["lib/types.ts", "lib/mockData.ts", "lib/gameLogic.ts"];

for (const modulePath of modulesToCompile) {
  await compileModule(modulePath);
}

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
    assert.ok(scene, "expected active scene during loop phases");

    const choiceId = strategy(scene, state);
    const choice = scene.choices.find((option) => option.id === choiceId);

    assert.ok(choice, `expected choice ${choiceId} on scene ${scene.id}`);

    state = gameLogic.applyChoice(state, choice);
    state = gameLogic.advanceRunPhase(state);
  }

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

function countRouteTaggedScenes(state, routeTag) {
  return state.scenePlan.filter((scene) => scene.routeTags?.includes(routeTag)).length;
}

function countScenesById(state, ids) {
  const idSet = new Set(ids);
  return state.scenePlan.filter((scene) => idSet.has(scene.id)).length;
}

test("full 26-card pool is present from story spec", () => {
  assert.equal(mockData.gameScenePool.length, 26);
  assert.deepEqual(
    mockData.gameScenePool.map((scene) => scene.title),
    [
      "Deer Village Medicine Conflict",
      "Fever at River Camp",
      "Tax Seal on the Crates",
      "Fox Ledger Offer",
      "Crow Relay Framing",
      "Deer Doctor’s Hidden Diary",
      "Border Toll Inspection",
      "Rabbit Witness at Mistwood",
      "Black Market Price List",
      "Refugee Witness Circle",
      "Smuggler Debt Call",
      "First Memory Collapse Night",
      "Return to Deer Village Gate",
      "Bear Court Intake Window",
      "Fox Audit Second Pass",
      "Crow Story Backfires",
      "Deer Archivist’s Index",
      "Market Settlement Dinner",
      "Refugee Song Festival",
      "Tax Officer’s Travel Ledger",
      "Medicine Price Spike",
      "Witness Contradiction Hearing",
      "Crow Broker’s Final Spin",
      "Court Packet Sorting",
      "Final Counter-Offer",
      "Eve of Bear Court",
    ]
  );
});

test("only canonical playable locations are used across the full pool", () => {
  const locations = new Set(mockData.gameScenePool.map((scene) => scene.location));
  assert.deepEqual([...locations].sort(), [
    "Bear Court",
    "Deer Village",
    "Fox Market",
    "River Refugee Camp",
  ]);
});

test("the initial run starts with the day 1 anchor and a per-save scene plan", () => {
  const state = freshState();

  assert.equal(state.scenePlan.length, 1);
  assert.equal(state.scenePlan[0].id, "deer-village-medicine-conflict");
  assert.equal(gameLogic.getCurrentScene(state)?.id, "deer-village-medicine-conflict");
});

test("a single playthrough still selects one primary event per day across fourteen days", () => {
  const state = playRoute(truthStrategy);

  assert.equal(state.phase, "trial");
  assert.equal(state.scenePlan.length, 14);
  assert.deepEqual(
    state.scenePlan.map((scene) => scene.day),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
  );
});

test("anchor cards always appear in route-dependent runs", () => {
  for (const strategy of [truthStrategy, merchantStrategy, rumorStrategy, failureStrategy]) {
    const state = playRoute(strategy);
    const selectedIds = new Set(state.scenePlan.map((scene) => scene.id));

    assert.ok(selectedIds.has("deer-village-medicine-conflict"));
    assert.ok(selectedIds.has("first-memory-collapse-night"));
    assert.ok(selectedIds.has("court-packet-sorting"));
    assert.ok(selectedIds.has("eve-of-bear-court"));
  }
});

test("days 2 through 6 draw only early-band cards and days 8 through 12 draw only late-band cards", () => {
  const state = playRoute(truthStrategy);

  for (const scene of state.scenePlan.filter((item) => item.day >= 2 && item.day <= 6)) {
    assert.equal(scene.selectionBucket, "early");
    assert.ok(scene.dayOptions.includes(scene.day));
  }

  for (const scene of state.scenePlan.filter((item) => item.day >= 8 && item.day <= 12)) {
    assert.equal(scene.selectionBucket, "late");
    assert.ok(scene.dayOptions.includes(scene.day));
  }
});

test("route-heavy paths bias selected cards toward their pressure lanes", () => {
  const truthState = playRoute(truthStrategy);
  const merchantState = playRoute(merchantStrategy);
  const rumorState = playRoute(rumorStrategy);
  const failureState = playRoute(failureStrategy);

  assert.ok(
    countScenesById(truthState, [
      "deer-doctors-hidden-diary",
      "rabbit-witness-at-mistwood",
      "black-market-price-list",
      "deer-archivists-index",
      "tax-officers-travel-ledger",
    ]) >
      countScenesById(merchantState, [
        "deer-doctors-hidden-diary",
        "rabbit-witness-at-mistwood",
        "black-market-price-list",
        "deer-archivists-index",
        "tax-officers-travel-ledger",
      ])
  );
  assert.ok(
    countScenesById(merchantState, [
      "fox-ledger-offer",
      "smuggler-debt-call",
      "fox-audit-second-pass",
      "market-settlement-dinner",
    ]) >
      countScenesById(truthState, [
        "fox-ledger-offer",
        "smuggler-debt-call",
        "fox-audit-second-pass",
        "market-settlement-dinner",
      ])
  );
  assert.ok(
    countScenesById(rumorState, [
      "crow-relay-framing",
      "crow-story-backfires",
      "refugee-song-festival",
      "crow-brokers-final-spin",
    ]) >
      countScenesById(truthState, [
        "crow-relay-framing",
        "crow-story-backfires",
        "refugee-song-festival",
        "crow-brokers-final-spin",
      ])
  );
  assert.ok(
    countScenesById(failureState, [
      "border-toll-inspection",
      "return-to-deer-village-gate",
      "smuggler-debt-call",
      "crow-story-backfires",
      "witness-contradiction-hearing",
    ]) >
      countScenesById(truthState, [
        "border-toll-inspection",
        "return-to-deer-village-gate",
        "smuggler-debt-call",
        "crow-story-backfires",
        "witness-contradiction-hearing",
      ])
  );
});

test("phase progression still reaches collapse one, loop two, collapse two, trial, and ending", () => {
  let state = playRoute(truthStrategy);

  assert.equal(state.phase, "trial");
  assert.equal(state.currentDay, 15);

  state = gameLogic.advanceRunPhase(state);

  assert.equal(state.phase, "ending");
  assert.equal(state.currentDay, 15);
});

test("first collapse preview and transition can expire week-one short-term memories in route-dependent runs", () => {
  let state = freshState();

  state = gameLogic.applyChoice(state, gameLogic.getCurrentScene(state).choices.find((choice) => choice.id === "B"));
  state = gameLogic.advanceRunPhase(state);

  while (state.phase !== "collapse_one") {
    const scene = gameLogic.getCurrentScene(state);
    const choice = scene.choices.find((option) => option.id === "A");
    state = gameLogic.applyChoice(state, choice);
    state = gameLogic.advanceRunPhase(state);
  }

  const checkpoint = gameLogic.getCollapseCheckpoint("collapse_one");
  const preview = gameLogic.getMemoryCollapsePreview(state.memories, checkpoint.nextDay);

  assert.ok(preview.expiringOnNextDay.some((memory) => memory.title === "Deer Guard Saw the Theft"));

  state = gameLogic.advanceRunPhase(state);
  assert.equal(state.phase, "loop_two");
  assert.equal(
    state.memories.find((memory) => memory.title === "Deer Guard Saw the Theft")?.active,
    false
  );
});

test("deterministic evidence ordering is preserved", () => {
  const memories = [
    {
      id: "older-strong",
      title: "Older Strong Record",
      text: "Older Strong Record text",
      type: "record",
      visibility: "public",
      location: "Archive",
      source: "Archive Ledger",
      createdDay: 6,
      persistent: true,
      active: true,
      reliability: 0.95,
      evidenceRole: "neutral",
      tags: ["test"],
    },
    {
      id: "newer-strong",
      title: "Newer Strong Record",
      text: "Newer Strong Record text",
      type: "record",
      visibility: "public",
      location: "Gate",
      source: "Gate Clerk",
      createdDay: 8,
      persistent: true,
      active: true,
      reliability: 0.91,
      evidenceRole: "neutral",
      tags: ["test"],
    },
    {
      id: "newer-weak",
      title: "Newer Weak Record",
      text: "Newer Weak Record text",
      type: "record",
      visibility: "public",
      location: "Market",
      source: "Market Board",
      createdDay: 8,
      persistent: true,
      active: true,
      reliability: 0.72,
      evidenceRole: "neutral",
      tags: ["test"],
    },
  ];

  const result = gameLogic.queryMemoriesLocally(memories, {
    activeOnly: true,
  });

  assert.deepEqual(
    result.evidence.map((item) => item.memoryId),
    ["newer-strong", "newer-weak", "older-strong"]
  );
});
