"use client";

import { useEffect, useState } from "react";
import { DayTracker } from "@/components/DayTracker";
import { EvidencePanel } from "@/components/EvidencePanel";
import { GameScene } from "@/components/GameScene";
import { MemoryCollapsePanel } from "@/components/MemoryCollapsePanel";
import { MemoryPanel } from "@/components/MemoryPanel";
import { StatusPanel } from "@/components/StatusPanel";
import { ChoiceId, NpcReaction, RetrievedEvidence, RetrievalDebug } from "@/lib/types";
import {
  day8Aftermath,
  initialGameState,
  initialNpcResponse,
} from "@/lib/mockData";
import {
  applyChoice,
  getActiveEvidence,
  advanceDay,
  applyDay8Transition,
  getActiveMemories,
  getActivePublicEvidence,
  getDay8NpcReactions,
  getEventForDay,
  getExpiredMemories,
  getMemoryCollapsePreview,
} from "@/lib/gameLogic";
import { getAllNpcReactions, ingestMemories, queryMemories } from "@/lib/retrievalAdapter";

export default function Home() {
  const [gameState, setGameState] = useState(initialGameState);
  const [sessionId] = useState(
    () => globalThis.crypto?.randomUUID?.() ?? "whisper-caravan-local-session"
  );

  const currentEvent = getEventForDay(gameState.currentDay);
  const currentChoiceRecord = gameState.dayChoices[gameState.currentDay];
  const hasChosenToday = Boolean(currentChoiceRecord);
  const isDay7Collapse =
    gameState.currentDay === 7 && hasChosenToday && !gameState.hasAppliedDay8;
  const isDay8Aftermath = gameState.currentDay === 8 && gameState.hasAppliedDay8;
  const activeMemories = getActiveMemories(gameState.memories);
  const activeEvidence = getActiveEvidence(gameState.memories);
  const expiredMemories = getExpiredMemories(gameState.memories);
  const activePublicEvidence = getActivePublicEvidence(gameState.memories);
  const memoryCollapsePreview = isDay7Collapse
    ? getMemoryCollapsePreview(gameState.memories, 8)
    : null;
  const [retrievedEvidence, setRetrievedEvidence] = useState<RetrievedEvidence[]>(
    activePublicEvidence
  );
  const [npcReactions, setNpcReactions] = useState<NpcReaction[] | null>(null);
  const [evidenceSource, setEvidenceSource] = useState<"backend" | "local">("local");
  const [reactionSource, setReactionSource] = useState<"backend" | "local">("local");
  const [evidenceDebug, setEvidenceDebug] = useState<RetrievalDebug | null>(null);
  const [reactionDebug, setReactionDebug] = useState<RetrievalDebug | null>(null);

  useEffect(() => {
    const localEvidence = isDay8Aftermath ? activeEvidence : activePublicEvidence;
    const localReactions = isDay8Aftermath ? getDay8NpcReactions(gameState) : null;

    setRetrievedEvidence(localEvidence);
    setNpcReactions(localReactions);
    setEvidenceSource("local");
    setReactionSource("local");
    setEvidenceDebug(null);
    setReactionDebug(null);

    let cancelled = false;

    async function syncRetrieval() {
      await ingestMemories(sessionId, gameState.memories);

      if (cancelled) {
        return;
      }

      const evidenceResult = await queryMemories(sessionId, gameState.memories, {
        activeOnly: true,
        visibility: isDay8Aftermath ? undefined : ["public"],
      });

      if (cancelled) {
        return;
      }

      let nextEvidenceSource = evidenceResult.source;
      let nextReactionSource: "backend" | "local" = "local";
      let nextNpcReactions: NpcReaction[] | null = null;
      const nextEvidenceDebug = evidenceResult.source === "backend" ? evidenceResult.data.debug ?? null : null;
      let nextReactionDebug: RetrievalDebug | null = null;

      if (isDay8Aftermath) {
        const reactionsResult = await getAllNpcReactions(sessionId, gameState);

        if (cancelled) {
          return;
        }

        nextNpcReactions = reactionsResult.data;
        nextReactionSource = reactionsResult.source;
        nextReactionDebug =
          reactionsResult.source === "backend"
            ? reactionsResult.data.find((reaction) => reaction.debug)?.debug ?? null
            : null;
      }

      setRetrievedEvidence(evidenceResult.data.evidence);
      setNpcReactions(nextNpcReactions);
      setEvidenceSource(nextEvidenceSource);
      setReactionSource(nextReactionSource);
      setEvidenceDebug(nextEvidenceDebug);
      setReactionDebug(nextReactionDebug);

      const reactionStatus = isDay8Aftermath ? nextReactionSource : "not-requested";
      const evidenceRetrieval = nextEvidenceDebug?.retrievalSource ?? "n/a";
      const reactionRetrieval = isDay8Aftermath
        ? nextReactionDebug?.retrievalSource ?? "n/a"
        : "not-requested";

      console.info(
        `[Whisper Caravan] retrieval sync day=${gameState.currentDay} evidence=${nextEvidenceSource}/${evidenceRetrieval} candidates=${nextEvidenceDebug?.candidateCount ?? "n/a"} resolved=${nextEvidenceDebug?.resolvedCandidateCount ?? "n/a"} filtered=${nextEvidenceDebug?.filteredEvidenceCount ?? "n/a"} reactions=${reactionStatus}/${reactionRetrieval} reactionFiltered=${nextReactionDebug?.filteredEvidenceCount ?? "n/a"} session=${sessionId}`
      );
    }

    void syncRetrieval();

    return () => {
      cancelled = true;
    };
  }, [
    gameState.currentDay,
    gameState.factions,
    gameState.hasAppliedDay8,
    gameState.memories,
    gameState.resources,
    isDay8Aftermath,
    sessionId,
  ]);

  const headline = isDay8Aftermath ? "Day 8 NPC Access Board" : "Evidence Preview";
  const overviewText = isDay8Aftermath
    ? "Seven-day forgetting has fired. Each NPC now filters the surviving active memories through its own access profile."
    : isDay7Collapse
      ? "The caravan counts what will vanish at dawn and what the public world will keep."
      : hasChosenToday
        ? "No guard query has fired yet. The right panel is showing the active public evidence trail you have created so far."
        : initialNpcResponse;
  const location = currentEvent?.location ?? day8Aftermath.location;
  const title = currentEvent?.title ?? day8Aftermath.title;
  const description = currentEvent?.description ?? day8Aftermath.description;
  const statusText = isDay8Aftermath
    ? "Seven-day forgetting applied"
    : isDay7Collapse
      ? "Collapse preview active"
      : hasChosenToday
        ? "Choice locked for the day"
        : "Fresh decision window";
  const actionLabel = isDay8Aftermath
    ? undefined
    : gameState.currentDay === 7
      ? "Advance to Day 8"
      : `Advance to Day ${gameState.currentDay + 1}`;
  const actionDisabled = !hasChosenToday;

  const handleChoiceSelect = (choiceId: ChoiceId) => {
    if (!currentEvent || hasChosenToday) {
      return;
    }

    const choice = currentEvent.choices.find((item) => item.id === choiceId);

    if (!choice) {
      return;
    }

    setGameState((previousState) => applyChoice(previousState, choice));
  };

  const handleAdvance = () => {
    setGameState((previousState) =>
      previousState.currentDay === 7
        ? applyDay8Transition(previousState)
        : advanceDay(previousState)
    );
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-[1700px] flex-col px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 rounded-[2rem] border border-white/10 bg-black/20 px-6 py-8 shadow-panel">
        <p className="text-xs uppercase tracking-[0.35em] text-amber-100/70">
          Game-Oriented RAG Memory Demo
        </p>
        <h1 className="font-display mt-3 text-4xl text-parchment sm:text-5xl">
          Whisper Caravan: Seven-Day Memory
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-stone-300 sm:text-base">
          v0.4 starts the real RAG backend transition with a deterministic slice:
          the frontend still owns the authored game loop, but evidence retrieval and
          Day 8 NPC reactions can now flow through a minimal backend adapter.
        </p>
      </div>

      <DayTracker
        day={gameState.currentDay}
        location={location}
        statusText={statusText}
        actionLabel={actionLabel}
        actionDisabled={actionDisabled}
        onAction={handleAdvance}
      />

      <StatusPanel factions={gameState.factions} resources={gameState.resources} />

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <GameScene
          day={gameState.currentDay}
          location={location}
          title={title}
          eventText={description}
          selectedChoice={currentChoiceRecord?.choiceId ?? null}
          sceneStatus={gameState.sceneStatus}
          options={currentEvent?.choices ?? []}
          choicesLocked={hasChosenToday || isDay8Aftermath}
          onSelectChoice={handleChoiceSelect}
        />
        <MemoryPanel
          memories={gameState.memories}
          activeCount={activeMemories.length}
          expiredCount={expiredMemories.length}
        />
        {memoryCollapsePreview ? (
          <MemoryCollapsePanel preview={memoryCollapsePreview} />
        ) : (
          <EvidencePanel
            headline={headline}
            overviewText={overviewText}
            retrievedEvidence={retrievedEvidence}
            npcReactions={npcReactions}
            evidenceSource={evidenceSource}
            reactionSource={isDay8Aftermath ? reactionSource : null}
            evidenceDebug={evidenceDebug}
            reactionDebug={isDay8Aftermath ? reactionDebug : null}
          />
        )}
      </div>
    </main>
  );
}
