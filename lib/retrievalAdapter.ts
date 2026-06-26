import { npcProfiles } from "@/lib/mockData";
import {
  getNpcProfileById,
  getNpcReaction,
  queryMemoriesLocally,
  toBackendMemoryRecord,
} from "@/lib/gameLogic";
import {
  BackendMemoryRecord,
  GameState,
  MemoryItem,
  MemoryQueryRequest,
  MemoryQueryResult,
  NpcId,
  NpcReaction,
  RetrievalDebug,
} from "@/lib/types";

type BackendSource = "backend" | "local";

type BackendResult<T> = {
  data: T;
  source: BackendSource;
};

type IngestResponse = {
  sessionId: string;
  ingestedCount: number;
};

type DebuggableNpcReaction = NpcReaction & {
  debug?: RetrievalDebug;
};

type ReactionRequest = {
  sessionId: string;
  npcId: NpcId;
  currentDay: number;
  factions: GameState["factions"];
  resources: GameState["resources"];
};

const DEFAULT_BACKEND_URL = "http://127.0.0.1:8000";

function getBackendUrl() {
  return process.env.NEXT_PUBLIC_BACKEND_URL ?? DEFAULT_BACKEND_URL;
}

async function postJson<TResponse>(path: string, body: unknown): Promise<TResponse> {
  const response = await fetch(`${getBackendUrl()}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Backend request failed for ${path} with status ${response.status}`);
  }

  return response.json() as Promise<TResponse>;
}

function serializeMemories(memories: MemoryItem[]): BackendMemoryRecord[] {
  return memories.map(toBackendMemoryRecord);
}

export async function ingestMemories(
  sessionId: string,
  memories: MemoryItem[]
): Promise<BackendResult<IngestResponse>> {
  const payload = {
    sessionId,
    memories: serializeMemories(memories),
  };

  try {
    const data = await postJson<IngestResponse>("/memories/ingest", payload);
    return { data, source: "backend" };
  } catch {
    return {
      data: {
        sessionId,
        ingestedCount: memories.length,
      },
      source: "local",
    };
  }
}

export async function queryMemories(
  sessionId: string,
  memories: MemoryItem[],
  request: MemoryQueryRequest
): Promise<BackendResult<MemoryQueryResult>> {
  try {
    const data = await postJson<MemoryQueryResult>("/memories/query", {
      sessionId,
      ...request,
    });

    return { data, source: "backend" };
  } catch {
    return {
      data: {
        ...queryMemoriesLocally(memories, request),
        debug: undefined,
      },
      source: "local",
    };
  }
}

export async function getNpcReactionFromBackend(
  sessionId: string,
  gameState: GameState,
  npcId: NpcId
): Promise<BackendResult<NpcReaction>> {
  const payload: ReactionRequest = {
    sessionId,
    npcId,
    currentDay: gameState.currentDay,
    factions: gameState.factions,
    resources: gameState.resources,
  };

  try {
    const data = await postJson<DebuggableNpcReaction>("/npc/reaction", payload);
    return { data, source: "backend" };
  } catch {
    const profile = getNpcProfileById(npcId);

    if (!profile) {
      throw new Error(`Unknown NPC profile: ${npcId}`);
    }

    return {
      data: getNpcReaction(gameState, profile),
      source: "local",
    };
  }
}

export async function getAllNpcReactions(
  sessionId: string,
  gameState: GameState
): Promise<BackendResult<NpcReaction[]>> {
  const responses = await Promise.all(
    npcProfiles.map((profile) => getNpcReactionFromBackend(sessionId, gameState, profile.id))
  );

  return {
    data: responses.map((response) => response.data),
    source: responses.every((response) => response.source === "backend")
      ? "backend"
      : "local",
  };
}

export async function getBackendHealth() {
  try {
    const response = await fetch(`${getBackendUrl()}/health`);

    if (!response.ok) {
      throw new Error(`Backend health check failed with status ${response.status}`);
    }

    return true;
  } catch {
    return false;
  }
}
