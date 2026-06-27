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
  return structuredClone(mockData.initialGameState);
}

function chooseSceneOption(state, choiceId) {
  const scene = gameLogic.getCurrentScene(state);
  assert.ok(scene, "expected an active scene");
  const choice = scene.choices.find((option) => option.id === choiceId);

  assert.ok(choice, `expected choice ${choiceId} on scene ${scene.id}`);
  return gameLogic.applyChoice(state, choice);
}

function advanceAfterChoice(state, choiceId = "A") {
  return gameLogic.advanceRunPhase(chooseSceneOption(state, choiceId));
}

test("fixed 14-card starter spine is present in the authored order", () => {
  assert.deepEqual(
    mockData.gameScenes.map((scene) => scene.title),
    [
      "Deer Village Medicine Conflict",
      "Fever at River Camp",
      "Tax Seal on the Crates",
      "Fox Ledger Offer",
      "Crow Relay Framing",
      "Deer Doctor’s Hidden Diary",
      "First Memory Collapse Night",
      "Return to Deer Village Gate",
      "Bear Court Intake Window",
      "Fox Audit Second Pass",
      "Tax Officer’s Travel Ledger",
      "Witness Contradiction Hearing",
      "Court Packet Sorting",
      "Eve of Bear Court",
    ]
  );
});

test("the game uses one primary playable event per day for days 1 through 14", () => {
  assert.equal(mockData.gameScenes.length, 14);
  assert.deepEqual(
    mockData.gameScenes.map((scene) => scene.day),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
  );
  assert.deepEqual(
    mockData.gameScenes.filter((scene) => scene.phase === "loop_one").map((scene) => scene.day),
    [1, 2, 3, 4, 5, 6, 7]
  );
  assert.deepEqual(
    mockData.gameScenes.filter((scene) => scene.phase === "loop_two").map((scene) => scene.day),
    [8, 9, 10, 11, 12, 13, 14]
  );
});

test("only canonical playable locations are used in the fixed starter spine", () => {
  const locations = new Set(mockData.gameScenes.map((scene) => scene.location));
  assert.deepEqual([...locations].sort(), [
    "Bear Court",
    "Deer Village",
    "Fox Market",
    "River Refugee Camp",
  ]);
});

test("six important story NPC functions exist in the content metadata", () => {
  assert.deepEqual(
    mockData.storyNpcProfiles.map((npc) => npc.id),
    [
      "villageApothecary",
      "campHealer",
      "foxLedgerMaster",
      "royalTaxOfficer",
      "crowBrokerNarrator",
      "bearJudgeAuthority",
    ]
  );
});

test("phase progression still reaches collapse one, loop two, collapse two, trial, and ending", () => {
  let state = freshState();

  for (let day = 1; day <= 7; day += 1) {
    state = advanceAfterChoice(state, "A");
  }

  assert.equal(state.phase, "collapse_one");
  assert.equal(state.currentDay, 7);

  state = gameLogic.advanceRunPhase(state);

  assert.equal(state.phase, "loop_two");
  assert.equal(state.currentDay, 8);
  assert.equal(gameLogic.getCurrentScene(state)?.id, "return-to-deer-village-gate");

  for (let day = 8; day <= 14; day += 1) {
    state = advanceAfterChoice(state, "A");
  }

  assert.equal(state.phase, "collapse_two");
  assert.equal(state.currentDay, 14);

  state = gameLogic.advanceRunPhase(state);
  assert.equal(state.phase, "trial");
  assert.equal(state.currentDay, 15);

  state = gameLogic.advanceRunPhase(state);
  assert.equal(state.phase, "ending");
});

test("first collapse preview and transition expire week-one short-term memories", () => {
  let state = freshState();

  state = advanceAfterChoice(state, "B");
  state = advanceAfterChoice(state, "C");
  state = advanceAfterChoice(state, "D");
  state = advanceAfterChoice(state, "C");
  state = advanceAfterChoice(state, "D");
  state = advanceAfterChoice(state, "D");
  state = advanceAfterChoice(state, "A");

  assert.equal(state.phase, "collapse_one");

  const checkpoint = gameLogic.getCollapseCheckpoint("collapse_one");
  assert.ok(checkpoint);

  const preview = gameLogic.getMemoryCollapsePreview(state.memories, checkpoint.nextDay);
  assert.deepEqual(
    preview.expiringOnNextDay.map((memory) => memory.title),
    ["Deer Guard Saw the Theft"]
  );

  state = gameLogic.advanceRunPhase(state);

  assert.equal(state.phase, "loop_two");
  assert.equal(
    state.memories.find((memory) => memory.title === "Deer Guard Saw the Theft")?.active,
    false
  );
  assert.equal(
    state.memories.find((memory) => memory.title === "Ignored Seal Trace")?.active,
    true
  );
});

test("second collapse preview and transition expire week-two short-term memories before trial", () => {
  let state = freshState();

  for (let day = 1; day <= 7; day += 1) {
    state = advanceAfterChoice(state, "A");
  }

  state = gameLogic.advanceRunPhase(state);

  state = advanceAfterChoice(state, "A");
  state = advanceAfterChoice(state, "A");
  state = advanceAfterChoice(state, "C");
  state = advanceAfterChoice(state, "D");
  state = advanceAfterChoice(state, "C");
  state = advanceAfterChoice(state, "A");
  state = advanceAfterChoice(state, "A");

  assert.equal(state.phase, "collapse_two");

  const checkpoint = gameLogic.getCollapseCheckpoint("collapse_two");
  assert.ok(checkpoint);

  const preview = gameLogic.getMemoryCollapsePreview(state.memories, checkpoint.nextDay);
  assert.deepEqual(preview.expiringOnNextDay.map((memory) => memory.title), []);

  state = gameLogic.advanceRunPhase(state);

  assert.equal(state.phase, "trial");
  assert.equal(
    state.memories.find((memory) => memory.title === "Hidden Payment Trace")?.active,
    true
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
