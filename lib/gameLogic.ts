import { ChoiceId, ChoiceResult, MemoryItem, NpcReaction, RetrievedEvidence } from "@/lib/types";
import { theftMemories } from "@/lib/mockData";

export function getChoiceResult(choice: ChoiceId): ChoiceResult {
  if (choice === "B") {
    return {
      sceneStatus:
        "You steal the medicine and the refugees survive the night. The act writes three traces into the world: witness memory, public record, and song.",
      memories: theftMemories,
    };
  }

  if (choice === "A") {
    return {
      sceneStatus:
        "You pay the apothecary's brutal price. No hostile memory trace is created, but the caravan loses precious coin.",
      memories: [],
    };
  }

  if (choice === "C") {
    return {
      sceneStatus:
        "You walk away. The village remains tense, and no durable memory trace is created for this slice.",
      memories: [],
    };
  }

  return {
    sceneStatus:
      "The guard accepts your bribe and falsifies the ledger. The scene quiets down, but this v0.1 slice does not create the tracked memory set.",
    memories: [],
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

export function getActivePublicEvidence(memories: MemoryItem[]): RetrievedEvidence[] {
  return memories
    .filter((memory) => memory.active && memory.visibility === "public")
    .map((memory) => ({
      memoryId: memory.id,
      title: memory.title,
      text: memory.text,
      reliability: memory.type === "record" ? 0.9 : 0.65,
      sourceType: memory.type as "record" | "song",
    }));
}

export function getDeerGuardReaction(memories: MemoryItem[]): NpcReaction {
  const evidence = getActivePublicEvidence(memories);
  const hasWantedNotice = evidence.some((item) => item.sourceType === "record");
  const hasSong = evidence.some((item) => item.sourceType === "song");

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
    };
  }

  if (hasSong) {
    return {
      dialogue:
        "I cannot place your face, but I've heard the refugee song about a blue caravan and stolen medicine.",
      effects: {
        trustDelta: -4,
        priceModifier: 1.1,
        questAvailable: true,
        legalRiskDelta: 1,
      },
      evidence,
    };
  }

  return {
    dialogue: "No. Nothing active in the village record ties you to that night anymore.",
    effects: {
      trustDelta: 0,
      priceModifier: 1,
      questAvailable: true,
      legalRiskDelta: 0,
    },
    evidence,
  };
}
