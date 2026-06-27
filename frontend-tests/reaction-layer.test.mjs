import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const repoRoot = process.cwd();
const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "whisper-caravan-reaction-"));
const modulesToCompile = [
  "lib/types.ts",
  "lib/mockData.ts",
  "lib/gameLogic.ts",
  "lib/reactionAdapter.ts",
];

for (const modulePath of modulesToCompile) {
  await compileModule(modulePath);
}

const mockData = await importCompiledModule("lib/mockData.js");
const gameLogic = await importCompiledModule("lib/gameLogic.js");
const reactionAdapter = await importCompiledModule("lib/reactionAdapter.js");

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

function createRequest(npcId = "fox_ledger_master", overrides = {}) {
  return {
    npc_id: npcId,
    session_id: "test-session",
    player_input: "Show me what you know about the missing medicine.",
    day: 9,
    route: "truth",
    known_memory_ids: [],
    game_state_summary: {
      trust: {},
      legal_risk: 2,
      silver: 8,
      flags: [],
      unlocked_routes: [],
    },
    ...overrides,
  };
}

test("clamping helpers enforce slice 1 safe ranges", () => {
  assert.equal(reactionAdapter.clampTrustDelta(99), 10);
  assert.equal(reactionAdapter.clampTrustDelta(-40), -10);
  assert.equal(reactionAdapter.clampLegalRiskDelta(99), 8);
  assert.equal(reactionAdapter.clampLegalRiskDelta(-99), -8);
  assert.equal(reactionAdapter.clampPriceModifier(2), 1.25);
  assert.equal(reactionAdapter.clampPriceModifier(0.1), 0.75);
  assert.equal(reactionAdapter.clampUnitInterval(1.8), 1);
  assert.equal(reactionAdapter.clampUnitInterval(-0.5), 0);
});

test("invalid evidence entries are discarded and valid evidence is clamped", () => {
  const evidence = reactionAdapter.sanitizeEvidenceSummaries([
    {
      memory_id: "ledger_003",
      title: "Fox Ledger",
      type: "record",
      reliability: 1.4,
      relevance: -0.2,
    },
    {
      memory_id: "",
      title: "Broken",
      type: "record",
      reliability: 0.5,
      relevance: 0.5,
    },
    {
      memory_id: "bad_type",
      title: "Wrong Type",
      type: "fake",
      reliability: 0.5,
      relevance: 0.5,
    },
    {
      memory_id: "not_numeric",
      title: "Wrong Numbers",
      type: "record",
      reliability: "0.5",
      relevance: 0.5,
    },
  ]);

  assert.deepEqual(evidence, [
    {
      memory_id: "ledger_003",
      title: "Fox Ledger",
      type: "record",
      reliability: 1,
      relevance: 0,
    },
  ]);
});

test("invalid route unlocks are rejected", () => {
  assert.deepEqual(
    reactionAdapter.sanitizeRouteUnlocks(["truth", "merchant", "bad_route", "merchant", 7]),
    ["truth", "merchant"]
  );
});

test("reaction sanitization clamps numbers and filters invalid payload fields", () => {
  const request = createRequest("crow_broker");
  const sanitized = reactionAdapter.sanitizeNpcReaction(
    {
      npc_id: "crow_broker",
      dialogue: "I can work with this.",
      tone: "friendly",
      trust_delta: 99,
      legal_risk_delta: -99,
      price_modifier: 5,
      quest_available: true,
      route_unlocks: ["rumor", "bad_route"],
      evidence: [
        {
          memory_id: "broadside_001",
          title: "Crow Broadside",
          type: "rumor",
          reliability: 1.2,
          relevance: -0.1,
        },
        {
          memory_id: "",
          title: "Invalid",
          type: "rumor",
          reliability: 0.3,
          relevance: 0.4,
        },
      ],
      memory_refs: ["broadside_001", "", 2],
      flags_set: ["crow_broker_heard", "", null],
      explanation: {
        public_reason: "The crowd is ready to listen.",
      },
    },
    request
  );

  assert.equal(sanitized.trust_delta, 10);
  assert.equal(sanitized.legal_risk_delta, -8);
  assert.equal(sanitized.price_modifier, 1.25);
  assert.deepEqual(sanitized.route_unlocks, ["rumor"]);
  assert.deepEqual(sanitized.evidence, [
    {
      memory_id: "broadside_001",
      title: "Crow Broadside",
      type: "rumor",
      reliability: 1,
      relevance: 0,
    },
  ]);
  assert.deepEqual(sanitized.memory_refs, ["broadside_001"]);
  assert.deepEqual(sanitized.flags_set, ["crow_broker_heard"]);
});

test("applyNpcReaction updates trust, legal risk, evidence, routes, flags, and latest reaction", () => {
  const state = mockData.createInitialGameState();
  const reaction = {
    npc_id: "village_apothecary",
    dialogue: "The counts do not match the charge.",
    tone: "sympathetic",
    trust_delta: 4,
    legal_risk_delta: -2,
    price_modifier: 0.95,
    quest_available: true,
    route_unlocks: ["truth"],
    evidence: [
      {
        memory_id: "inventory_002",
        title: "Incomplete Medicine Inventory",
        type: "inventory",
        reliability: 0.88,
        relevance: 0.94,
      },
    ],
    memory_refs: ["inventory_002"],
    flags_set: ["apothecary_inventory_seen"],
  };

  const updated = gameLogic.applyNpcReaction(state, reaction);

  assert.equal(updated.resources.legalRisk, state.resources.legalRisk - 2);
  assert.equal(updated.npcTrust.village_apothecary, 4);
  assert.deepEqual(updated.unlockedRoutes, ["truth"]);
  assert.deepEqual(updated.flags, ["apothecary_inventory_seen"]);
  assert.deepEqual(updated.collectedEvidence, reaction.evidence);
  assert.equal(updated.npcPriceModifiers.village_apothecary, 0.95);
  assert.equal(updated.npcQuestAvailability.village_apothecary, true);
  assert.deepEqual(updated.latestNpcReaction, reaction);

  const appliedTwice = gameLogic.applyNpcReaction(updated, {
    ...reaction,
    trust_delta: 2,
    evidence: [
      {
        memory_id: "inventory_002",
        title: "Incomplete Medicine Inventory",
        type: "inventory",
        reliability: 0.9,
        relevance: 0.95,
      },
    ],
    flags_set: ["apothecary_inventory_seen", "court_copy_requested"],
  });

  assert.equal(appliedTwice.npcTrust.village_apothecary, 6);
  assert.deepEqual(appliedTwice.unlockedRoutes, ["truth"]);
  assert.deepEqual(appliedTwice.flags, [
    "apothecary_inventory_seen",
    "court_copy_requested",
  ]);
  assert.deepEqual(appliedTwice.collectedEvidence, [
    {
      memory_id: "inventory_002",
      title: "Incomplete Medicine Inventory",
      type: "inventory",
      reliability: 0.9,
      relevance: 0.95,
    },
  ]);
});

test("backend absence falls back to deterministic local reactions for v0.6 NPCs", async () => {
  const previousBackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  delete process.env.NEXT_PUBLIC_BACKEND_URL;

  try {
    for (const npcId of [
      "fox_ledger_master",
      "crow_broker",
      "camp_healer",
      "village_apothecary",
    ]) {
      const reaction = await reactionAdapter.getNpcReaction(createRequest(npcId));

      assert.equal(reaction.npc_id, npcId);
      assert.equal(typeof reaction.dialogue, "string");
      assert.ok(reaction.dialogue.length > 0);
      assert.ok(Array.isArray(reaction.evidence));
      assert.ok(Array.isArray(reaction.memory_refs));
    }
  } finally {
    if (previousBackendUrl === undefined) {
      delete process.env.NEXT_PUBLIC_BACKEND_URL;
    } else {
      process.env.NEXT_PUBLIC_BACKEND_URL = previousBackendUrl;
    }
  }
});

test("backend-configured adapter calls /npc/reaction with structured request body and sanitizes response", async () => {
  const previousBackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  const previousFetch = globalThis.fetch;
  process.env.NEXT_PUBLIC_BACKEND_URL = "http://127.0.0.1:8000";

  const request = createRequest("fox_ledger_master", {
    session_id: "structured-session",
    known_memory_ids: ["market_ledger_001"],
  });

  let capturedUrl = null;
  let capturedBody = null;

  globalThis.fetch = async (url, options) => {
    capturedUrl = url;
    capturedBody = JSON.parse(options.body);

    return {
      ok: true,
      json: async () => ({
        npc_id: "fox_ledger_master",
        dialogue: "Backend dialogue",
        tone: "guarded",
        trust_delta: 99,
        legal_risk_delta: -99,
        price_modifier: 2,
        quest_available: true,
        route_unlocks: ["merchant", "bad_route"],
        evidence: [
          {
            memory_id: "market_ledger_001",
            title: "Fox Market Receipt",
            type: "receipt",
            reliability: 1.5,
            relevance: -0.5,
          },
        ],
        memory_refs: ["market_ledger_001"],
        flags_set: ["fox_ledger_seen"],
        explanation: {
          public_reason: "Backend reason",
          debug_reason: "Backend debug",
        },
      }),
    };
  };

  try {
    const reaction = await reactionAdapter.getNpcReaction(request);

    assert.equal(capturedUrl, "http://127.0.0.1:8000/npc/reaction");
    assert.deepEqual(capturedBody, request);
    assert.equal(reaction.trust_delta, 10);
    assert.equal(reaction.legal_risk_delta, -8);
    assert.equal(reaction.price_modifier, 1.25);
    assert.deepEqual(reaction.route_unlocks, ["merchant"]);
    assert.deepEqual(reaction.evidence, [
      {
        memory_id: "market_ledger_001",
        title: "Fox Market Receipt",
        type: "receipt",
        reliability: 1,
        relevance: 0,
      },
    ]);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousBackendUrl === undefined) {
      delete process.env.NEXT_PUBLIC_BACKEND_URL;
    } else {
      process.env.NEXT_PUBLIC_BACKEND_URL = previousBackendUrl;
    }
  }
});

test("backend-configured adapter falls back locally when backend request fails", async () => {
  const previousBackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  const previousFetch = globalThis.fetch;
  process.env.NEXT_PUBLIC_BACKEND_URL = "http://127.0.0.1:8000";

  globalThis.fetch = async () => {
    throw new Error("backend unreachable");
  };

  try {
    const reaction = await reactionAdapter.getNpcReaction(
      createRequest("camp_healer", {
        known_memory_ids: ["camp_medical_note"],
      })
    );

    assert.equal(reaction.npc_id, "camp_healer");
    assert.equal(reaction.tone, "sympathetic");
    assert.ok(reaction.memory_refs.length > 0);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousBackendUrl === undefined) {
      delete process.env.NEXT_PUBLIC_BACKEND_URL;
    } else {
      process.env.NEXT_PUBLIC_BACKEND_URL = previousBackendUrl;
    }
  }
});
