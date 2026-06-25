"use client";

import { useState } from "react";
import { DayTracker } from "@/components/DayTracker";
import { EvidencePanel } from "@/components/EvidencePanel";
import { GameScene } from "@/components/GameScene";
import { MemoryCollapsePanel } from "@/components/MemoryCollapsePanel";
import { MemoryPanel } from "@/components/MemoryPanel";
import { StatusPanel } from "@/components/StatusPanel";
import { ChoiceId } from "@/lib/types";
import {
  day8Aftermath,
  initialGameState,
  initialNpcResponse,
} from "@/lib/mockData";
import {
  applyChoice,
  applyDay8Transition,
  advanceDay,
  getActiveMemories,
  getActivePublicEvidence,
  getDeerGuardReaction,
  getEventForDay,
  getExpiredMemories,
  getMemoryCollapsePreview,
} from "@/lib/gameLogic";

export default function Home() {
  const [gameState, setGameState] = useState(initialGameState);

  const currentEvent = getEventForDay(gameState.currentDay);
  const currentChoiceRecord = gameState.dayChoices[gameState.currentDay];
  const hasChosenToday = Boolean(currentChoiceRecord);
  const isDay7Collapse =
    gameState.currentDay === 7 && hasChosenToday && !gameState.hasAppliedDay8;
  const isDay8Aftermath = gameState.currentDay === 8 && gameState.hasAppliedDay8;
  const activeMemories = getActiveMemories(gameState.memories);
  const expiredMemories = getExpiredMemories(gameState.memories);
  const activePublicEvidence = getActivePublicEvidence(gameState.memories);
  const memoryCollapsePreview = isDay7Collapse
    ? getMemoryCollapsePreview(gameState.memories, 8)
    : null;
  const deerGuardReaction = isDay8Aftermath
    ? getDeerGuardReaction(gameState.memories)
    : null;

  const headline = isDay8Aftermath ? "Deer Guard Aftermath Query" : "Evidence Preview";
  const npcResponse = deerGuardReaction
    ? deerGuardReaction.dialogue
    : isDay7Collapse
      ? "The caravan counts what will vanish at dawn and what the public world will keep."
      : hasChosenToday
        ? "No guard query has fired yet. The right panel is showing the active public evidence trail you have created so far."
        : initialNpcResponse;
  const retrievedEvidence = deerGuardReaction
    ? deerGuardReaction.evidence
    : activePublicEvidence;
  const gameEffects = deerGuardReaction ? deerGuardReaction.effects : null;
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
          v0.2 expands the single incident demo into a seven-day loop: daily events
          create memories, Day 7 previews the collapse boundary, and Day 8 reveals
          what public evidence still has the power to move an NPC.
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
            npcResponse={npcResponse}
            retrievedEvidence={retrievedEvidence}
            gameEffects={gameEffects}
            bearCourtPreview={deerGuardReaction?.bearCourtPreview ?? null}
          />
        )}
      </div>
    </main>
  );
}
