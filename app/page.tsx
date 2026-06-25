"use client";

import { useState } from "react";
import { DayTracker } from "@/components/DayTracker";
import { EvidencePanel } from "@/components/EvidencePanel";
import { GameScene } from "@/components/GameScene";
import { MemoryPanel } from "@/components/MemoryPanel";
import {
  ChoiceId,
  GameEffects,
  MemoryItem,
  RetrievedEvidence,
} from "@/lib/types";
import {
  choiceOptions,
  deerVillageEvent,
  deerVillageLocation,
  initialNpcResponse,
  initialSceneStatus,
} from "@/lib/mockData";
import {
  applySevenDayForgetting,
  getChoiceResult,
  getDeerGuardReaction,
  getActivePublicEvidence,
} from "@/lib/gameLogic";

export default function Home() {
  const [day, setDay] = useState(1);
  const [location] = useState(deerVillageLocation);
  const [selectedChoice, setSelectedChoice] = useState<ChoiceId | null>(null);
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [sceneStatus, setSceneStatus] = useState(initialSceneStatus);
  const [hasForgotten, setHasForgotten] = useState(false);
  const [npcResponse, setNpcResponse] = useState(initialNpcResponse);
  const [retrievedEvidence, setRetrievedEvidence] = useState<RetrievedEvidence[]>([]);
  const [gameEffects, setGameEffects] = useState<GameEffects | null>(null);

  const handleChoiceSelect = (choice: ChoiceId) => {
    const result = getChoiceResult(choice);

    setSelectedChoice(choice);
    setHasForgotten(false);
    setDay(1);
    setRetrievedEvidence([]);
    setGameEffects(null);
    setNpcResponse(initialNpcResponse);
    setMemories(result.memories);
    setSceneStatus(result.sceneStatus);
  };

  const handleJumpToDay8 = () => {
    const advancedDay = 8;
    const updatedMemories = applySevenDayForgetting(memories, advancedDay);
    const activePublicEvidence = getActivePublicEvidence(updatedMemories);

    setDay(advancedDay);
    setHasForgotten(true);
    setMemories(updatedMemories);

    if (selectedChoice === "B") {
      const reaction = getDeerGuardReaction(updatedMemories);

      setNpcResponse(reaction.dialogue);
      setRetrievedEvidence(reaction.evidence);
      setGameEffects(reaction.effects);
      setSceneStatus(
        "Day 8 arrives. The witness memory expires, but active public evidence still shapes how the Deer Guard reacts."
      );
      return;
    }

    setNpcResponse("No active public evidence ties your caravan to the medicine conflict.");
    setRetrievedEvidence(activePublicEvidence);
    setGameEffects({
      trustDelta: 0,
      priceModifier: 1,
      questAvailable: true,
      legalRiskDelta: 0,
    });
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
          A narrative sandbox for testing temporal forgetting: private witness memory
          decays after seven days, while public records and song stay retrievable and
          continue to shape NPC behavior.
        </p>
      </div>

      <DayTracker
        day={day}
        location={location}
        hasForgotten={hasForgotten}
        onJumpToDay8={handleJumpToDay8}
      />

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <GameScene
          day={day}
          location={location}
          eventText={deerVillageEvent}
          selectedChoice={selectedChoice}
          sceneStatus={sceneStatus}
          options={choiceOptions}
          onSelectChoice={handleChoiceSelect}
        />
        <MemoryPanel memories={memories} />
        <EvidencePanel
          hasForgotten={hasForgotten}
          npcResponse={npcResponse}
          retrievedEvidence={retrievedEvidence}
          gameEffects={gameEffects}
        />
      </div>
    </main>
  );
}
