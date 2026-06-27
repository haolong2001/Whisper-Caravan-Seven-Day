import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const repoRoot = process.cwd();
const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "whisper-caravan-structured-ui-"));
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
    const normalizedTarget = relativeTarget.startsWith(".") ? relativeTarget : `./${relativeTarget}`;

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
  return import(pathToFileURL(path.join(tempDir, relativePath)).href);
}

function findScene(id) {
  const scene = mockData.gameScenePool.find((item) => item.id === id);
  assert.ok(scene, `expected scene ${id}`);
  return scene;
}

test("fox events map to fox_ledger_master", () => {
  const availability = gameLogic.getStructuredNpcAvailabilityForScene(findScene("fox-ledger-offer"));
  assert.equal(availability?.npcId, "fox_ledger_master");
});

test("crow rumor events map to crow_broker", () => {
  const availability = gameLogic.getStructuredNpcAvailabilityForScene(findScene("crow-relay-framing"));
  assert.equal(availability?.npcId, "crow_broker");
});

test("refugee medical events map to camp_healer", () => {
  const availability = gameLogic.getStructuredNpcAvailabilityForScene(findScene("fever-at-river-camp"));
  assert.equal(availability?.npcId, "camp_healer");
});

test("deer medicine truth events map to village_apothecary", () => {
  const availability = gameLogic.getStructuredNpcAvailabilityForScene(
    findScene("deer-doctors-hidden-diary")
  );
  assert.equal(availability?.npcId, "village_apothecary");
});

test("unrelated synthetic events show no structured NPC", () => {
  const scene = {
    id: "plain-road-night",
    phase: "loop_one",
    day: 3,
    location: "Open Road",
    title: "Quiet Road Camp",
    description: "The caravan rests in silence with no market lead, no road gossip, and no medicine record to pursue.",
    choices: [],
  };

  const availability = gameLogic.getStructuredNpcAvailabilityForScene(scene);
  assert.equal(availability, null);
});

test("structured reaction request builder includes sessionId and current run summary", () => {
  const state = mockData.createInitialGameState();
  state.resources.legalRisk = 3;
  state.flags = ["deer_gate_seen"];
  state.unlockedRoutes = ["truth"];
  state.npcTrust = { village_apothecary: 4 };

  const scene = findScene("deer-doctors-hidden-diary");
  const availability = gameLogic.getStructuredNpcAvailabilityForScene(scene);
  assert.ok(availability);

  const request = gameLogic.buildStructuredNpcReactionRequest(
    state,
    scene,
    "session-123",
    availability
  );

  assert.equal(request.session_id, "session-123");
  assert.equal(request.npc_id, "village_apothecary");
  assert.equal(request.day, scene.day);
  assert.equal(request.route, "truth");
  assert.deepEqual(request.game_state_summary.flags, ["deer_gate_seen"]);
  assert.deepEqual(request.game_state_summary.unlocked_routes, ["truth"]);
});

test("duplicate reaction application guard is deterministic", () => {
  const state = mockData.createInitialGameState();
  const nextState = gameLogic.markStructuredNpcReactionApplied(
    state,
    "fox-ledger-offer",
    "fox_ledger_master"
  );

  assert.equal(
    gameLogic.hasAppliedStructuredNpcReaction(nextState, "fox-ledger-offer", "fox_ledger_master"),
    true
  );

  const stableState = gameLogic.markStructuredNpcReactionApplied(
    nextState,
    "fox-ledger-offer",
    "fox_ledger_master"
  );

  assert.deepEqual(stableState.appliedNpcReactionKeys, nextState.appliedNpcReactionKeys);
});

test("trial preview classification is deterministic and resilient", () => {
  const preview = gameLogic.classifyCollectedEvidenceForTrialPreview([
    {
      memory_id: "ledger_001",
      title: "Fox Ledger",
      type: "record",
      reliability: 0.9,
      relevance: 0.8,
    },
    {
      memory_id: "healer_001",
      title: "Camp Testimony",
      type: "medical",
      reliability: 0.82,
      relevance: 0.91,
    },
    {
      memory_id: "rumor_001",
      title: "Road Rumor",
      type: "rumor",
      reliability: 0.55,
      relevance: 0.66,
    },
  ]);

  assert.deepEqual(
    preview.map((item) => [item.memory_id, item.bucket, item.label]),
    [
      ["ledger_001", "strong_record", "Strong record"],
      ["healer_001", "necessity_testimony", "Necessity testimony"],
      ["rumor_001", "rumor_needs_support", "Rumor; needs support"],
    ]
  );
});
