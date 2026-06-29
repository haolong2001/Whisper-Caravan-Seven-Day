"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { EvidencePanel } from "@/components/EvidencePanel";
import { GameScene } from "@/components/GameScene";
import { MemoryPanel } from "@/components/MemoryPanel";
import { StatusPanel } from "@/components/StatusPanel";
import { TrialPanel } from "@/components/TrialPanel";
import { createInitialGameState } from "@/lib/mockData";
import { getSceneIllustration } from "@/lib/sceneImages";
import {
  ChoiceId,
  GameState,
  RetrievedEvidence,
  RetrievalDebug,
  TrialPreviewItem,
} from "@/lib/types";
import {
  advanceRunPhase,
  applyChoice,
  applyNpcReaction,
  buildStructuredNpcReactionRequest,
  classifyCollectedEvidenceForTrialPreview,
  getActiveEvidence,
  getActiveMemories,
  getActivePublicEvidence,
  getCollapseCheckpoint,
  getCurrentPhaseContent,
  getCurrentScene,
  getCurrentSceneChoice,
  getExpiredMemories,
  getMemoryCollapsePreview,
  getPhaseLabel,
  getStructuredNpcAvailabilityForScene,
  getStructuredNpcReactionKey,
  hasAppliedStructuredNpcReaction,
  markStructuredNpcReactionApplied,
} from "@/lib/gameLogic";
import { getNpcReactionResult } from "@/lib/reactionAdapter";
import { ingestMemories, queryMemories } from "@/lib/retrievalAdapter";
import { evaluateTrialResult } from "@/lib/trialLogic";

const PLAYTEST_BUILD_LABEL = "Whisper Caravan v0.6 Playtest - Slice 6";
const PLAYTEST_SAVE_KEY = "whisper-caravan-v0.5-playtest-save";
const PLAYTEST_SAVE_VERSION = 2;

type SavedRunState = {
  version: number;
  sessionId: string;
  gameState: GameState;
  savedAt: string;
};

function createSessionId() {
  return globalThis.crypto?.randomUUID?.() ?? "whisper-caravan-local-session";
}

function isGameState(value: unknown): value is GameState {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<GameState>;

  return (
    typeof candidate.phase === "string" &&
    typeof candidate.currentDay === "number" &&
    (typeof candidate.currentSceneIndex === "number" || candidate.currentSceneIndex === null) &&
    Array.isArray(candidate.scenePlan) &&
    Array.isArray(candidate.memories) &&
    Boolean(candidate.factions) &&
    Boolean(candidate.resources) &&
    Boolean(candidate.sceneChoices) &&
    typeof candidate.sceneStatus === "string"
  );
}

function readSavedRun(): SavedRunState | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(PLAYTEST_SAVE_KEY);

    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue) as Partial<SavedRunState>;

    if (
      parsed.version !== PLAYTEST_SAVE_VERSION ||
      typeof parsed.sessionId !== "string" ||
      typeof parsed.savedAt !== "string" ||
      !isGameState(parsed.gameState)
    ) {
      window.localStorage.removeItem(PLAYTEST_SAVE_KEY);
      return null;
    }

    return parsed as SavedRunState;
  } catch {
    window.localStorage.removeItem(PLAYTEST_SAVE_KEY);
    return null;
  }
}

function formatSavedAt(savedAt: string | null) {
  if (!savedAt) {
    return null;
  }

  return new Date(savedAt).toLocaleString();
}

type RailTab = "memory" | "evidence";

function TitleCard({
  hasSavedRun,
  savedAtLabel,
  day,
  phaseLabel,
  location,
  onPrimaryAction,
  onSecondaryAction,
  onClearSave,
}: {
  hasSavedRun: boolean;
  savedAtLabel: string | null;
  day: number;
  phaseLabel: string;
  location: string;
  onPrimaryAction: () => void;
  onSecondaryAction: () => void;
  onClearSave: () => void;
}) {
  return (
    <main className="story-shell px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1240px] page-rise">
        <section className="panel panel-glow story-panel overflow-hidden rounded-[2.4rem] shadow-panel">
          <div className="grid gap-0 xl:grid-cols-[1.15fr_minmax(0,0.85fr)]">
            <div className="relative min-h-[340px] xl:min-h-[620px]">
              <Image
                src="/images/scenes/event_01_deer_village_medicine_conflict.png"
                alt="Whisper Caravan approaching Deer Village with contested medicine."
                fill
                priority
                sizes="(max-width: 1280px) 100vw, 55vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(27,17,11,0.12)_0%,rgba(27,17,11,0.4)_50%,rgba(16,11,8,0.92)_100%)]" />
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                <p className="text-[11px] uppercase tracking-[0.42em] text-amber-100/80">
                  Some memories fade. Some become evidence.
                </p>
                <h1 className="font-display mt-4 max-w-2xl text-4xl text-[#fff5e1] sm:text-6xl">
                  Whisper Caravan
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-200 sm:text-base">
                  Seven-Day Memory
                </p>
              </div>
            </div>

            <div className="flex flex-col justify-between p-6 sm:p-8">
              <div>
                <h2 className="font-display mt-4 text-3xl text-parchment sm:text-4xl">
                  {hasSavedRun ? "Continue the road already taken" : "What Will They Remember You As"}
                </h2>
                {hasSavedRun ? (
                  <p className="mt-4 text-sm leading-7 text-stone-300 sm:text-base">
                    Saved {savedAtLabel ?? "earlier"} on Day {day} during {phaseLabel} at {location}.
                  </p>
                ) : (
                  <div className="mt-4 text-sm leading-7 text-stone-300 sm:text-base">
                    <p>
                      An unnamed hero? A criminal? A merchant? Or just an ordinary traveler?
                    </p>
                    <p className="mt-4">
                      Make your choices in a cursed world where memory fades. The evidence, rumors, and songs you leave behind will decide how people remember you after the trial.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-8 space-y-4">
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={onPrimaryAction}
                    className="rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-stone-950 transition hover:bg-amber-400"
                  >
                    {hasSavedRun ? "Continue" : "Start Journey"}
                  </button>
                  <button
                    type="button"
                    onClick={onSecondaryAction}
                    className="rounded-full border border-white/10 bg-black/20 px-6 py-3 text-sm font-semibold text-stone-100 transition hover:bg-white/10"
                  >
                    {hasSavedRun ? "Restart Run" : "Start Fresh"}
                  </button>
                  {hasSavedRun ? (
                    <button
                      type="button"
                      onClick={onClearSave}
                      className="rounded-full border border-white/10 bg-black/20 px-6 py-3 text-sm font-semibold text-stone-100 transition hover:bg-white/10"
                    >
                      Clear Save
                    </button>
                  ) : null}
                </div>
                <p className="text-xs uppercase tracking-[0.28em] text-stone-400">
                  Progress saves locally on this browser.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function Home() {
  const [gameState, setGameState] = useState<GameState>(() => createInitialGameState());
  const [sessionId, setSessionId] = useState(createSessionId);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [hasSavedRun, setHasSavedRun] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [retrievedEvidence, setRetrievedEvidence] = useState<RetrievedEvidence[]>([]);
  const [evidenceSource, setEvidenceSource] = useState<"backend" | "local">("local");
  const [evidenceDebug, setEvidenceDebug] = useState<RetrievalDebug | null>(null);
  const [backendNotice, setBackendNotice] = useState<string | null>(null);
  const [reactionNotice, setReactionNotice] = useState<string | null>(null);
  const [reactionSource, setReactionSource] = useState<"backend" | "local" | null>(null);
  const [reactionLoading, setReactionLoading] = useState(false);
  const [showDeveloperDetails, setShowDeveloperDetails] = useState(false);
  const [activeRailTab, setActiveRailTab] = useState<RailTab>("memory");
  const pendingReactionKeyRef = useRef<string | null>(null);
  const isDeveloperMode = process.env.NODE_ENV !== "production";

  const currentScene = getCurrentScene(gameState);
  const currentChoiceRecord = getCurrentSceneChoice(gameState);
  const currentPhaseContent = getCurrentPhaseContent(gameState);
  const currentCollapseCheckpoint =
    gameState.phase === "collapse_one" || gameState.phase === "collapse_two"
      ? getCollapseCheckpoint(gameState.phase)
      : null;
  const currentIllustration = getSceneIllustration(currentScene?.id ?? null);
  const isLoopPhase = gameState.phase === "loop_one" || gameState.phase === "loop_two";
  const isCollapsePhase = Boolean(currentCollapseCheckpoint);
  const showsAllActiveEvidence = gameState.phase === "trial" || gameState.phase === "ending";
  const activeMemories = getActiveMemories(gameState.memories);
  const expiredMemories = getExpiredMemories(gameState.memories);
  const memoryCollapsePreview = currentCollapseCheckpoint
    ? getMemoryCollapsePreview(gameState.memories, currentCollapseCheckpoint.nextDay)
    : null;
  const trialResult =
    gameState.phase === "trial" || gameState.phase === "ending"
      ? evaluateTrialResult(gameState)
      : null;
  const resolutionPhase = gameState.phase === "trial" ? "trial" : "ending";
  const headline = showsAllActiveEvidence ? "Trial Record" : "Evidence Ledger";
  const overviewText = isCollapsePhase
    ? "The caravan is approaching a forgetting boundary. Only what still holds shape will remain easy to prove."
    : showsAllActiveEvidence
      ? "Bear Court can now see the full surviving evidence stack, including what the road kept alive long enough to matter."
      : currentChoiceRecord
        ? "The day has settled. This panel tracks the public trail and witness proof still available to the road."
        : "The road is still thin with proof. Evidence gathered here will decide what survives memory loss and what reaches Bear Court.";
  const statusText = isLoopPhase
    ? currentChoiceRecord
      ? "The day's choice is sealed."
      : "A decision is waiting."
    : isCollapsePhase
      ? "A memory collapse is underway."
      : gameState.phase === "trial"
        ? `Bear Court is ready to weigh ${trialResult?.outcome.verdictLabel ?? "the case"}.`
        : `${trialResult?.outcome.verdictLabel ?? "The verdict"} has been delivered.`;
  const actionLabel =
    gameState.phase === "ending"
      ? undefined
      : isCollapsePhase
        ? "Pass the Night"
        : gameState.phase === "trial"
          ? "Read Ending"
          : "Continue";
  const actionDisabled = isLoopPhase ? !currentChoiceRecord : false;
  const savedAtLabel = formatSavedAt(lastSavedAt);
  const npcAvailability = isLoopPhase ? getStructuredNpcAvailabilityForScene(currentScene) : null;
  const npcInteractionApplied =
    currentScene && npcAvailability
      ? hasAppliedStructuredNpcReaction(gameState, currentScene.id, npcAvailability.npcId)
      : false;
  const trialPreviewItems: TrialPreviewItem[] = classifyCollectedEvidenceForTrialPreview(
    gameState.collectedEvidence
  );

  useEffect(() => {
    const savedRun = readSavedRun();

    if (savedRun) {
      setGameState(savedRun.gameState);
      setSessionId(savedRun.sessionId);
      setHasSavedRun(true);
      setLastSavedAt(savedRun.savedAt);
    }

    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (!hasHydrated || !hasStarted || typeof window === "undefined") {
      return;
    }

    const savedAt = new Date().toISOString();
    const payload: SavedRunState = {
      version: PLAYTEST_SAVE_VERSION,
      sessionId,
      gameState,
      savedAt,
    };

    window.localStorage.setItem(PLAYTEST_SAVE_KEY, JSON.stringify(payload));
    setHasSavedRun(true);
    setLastSavedAt(savedAt);
  }, [gameState, hasHydrated, hasStarted, sessionId]);

  useEffect(() => {
    const localEvidence = showsAllActiveEvidence
      ? getActiveEvidence(gameState.memories)
      : getActivePublicEvidence(gameState.memories);

    setRetrievedEvidence(localEvidence);
    setEvidenceSource("local");
    setEvidenceDebug(null);

    if (!hasHydrated || !hasStarted) {
      return;
    }

    let cancelled = false;

    async function syncRetrieval() {
      await ingestMemories(sessionId, gameState.memories);

      if (cancelled) {
        return;
      }

      const evidenceResult = await queryMemories(sessionId, gameState.memories, {
        activeOnly: true,
        visibility: showsAllActiveEvidence ? undefined : ["public"],
      });

      if (cancelled) {
        return;
      }

      setRetrievedEvidence(evidenceResult.data.evidence);
      setEvidenceSource(evidenceResult.source);
      setEvidenceDebug(
        evidenceResult.source === "backend" ? evidenceResult.data.debug ?? null : null
      );
      setBackendNotice(
        evidenceResult.source === "local"
          ? "Backend unavailable or not configured. Using deterministic local fallback."
          : null
      );

      if (!isDeveloperMode) {
        return;
      }

      const evidenceRetrieval =
        evidenceResult.source === "backend"
          ? evidenceResult.data.debug?.retrievalSource ?? "n/a"
          : "n/a";

      console.info(
        `[Whisper Caravan] retrieval sync phase=${gameState.phase} day=${gameState.currentDay} evidenceSource=${evidenceResult.source} evidenceMode=${evidenceRetrieval} evidenceCandidates=${evidenceResult.data.debug?.candidateCount ?? "n/a"} evidenceResolved=${evidenceResult.data.debug?.resolvedCandidateCount ?? "n/a"} evidenceFinal=${evidenceResult.data.debug?.filteredEvidenceCount ?? "n/a"} session=${sessionId}`
      );
    }

    void syncRetrieval();

    return () => {
      cancelled = true;
    };
  }, [
    gameState.currentDay,
    gameState.currentSceneIndex,
    gameState.factions,
    gameState.memories,
    gameState.phase,
    gameState.resources,
    hasHydrated,
    hasStarted,
    isDeveloperMode,
    sessionId,
    showsAllActiveEvidence,
  ]);

  useEffect(() => {
    if (gameState.phase === "trial" || gameState.phase === "ending") {
      setActiveRailTab("evidence");
    }
  }, [gameState.phase]);

  const handleChoiceSelect = (choiceId: ChoiceId) => {
    if (!currentScene || currentChoiceRecord) {
      return;
    }

    const choice = currentScene.choices.find((item) => item.id === choiceId);

    if (!choice) {
      return;
    }

    setGameState((previousState) => applyChoice(previousState, choice));
  };

  const handleAdvance = () => {
    setGameState((previousState) => advanceRunPhase(previousState));
  };

  const resetRunPresentation = () => {
    setBackendNotice(null);
    setReactionNotice(null);
    setReactionSource(null);
    setActiveRailTab("memory");
  };

  const handleStartNewRun = () => {
    setGameState(createInitialGameState());
    setSessionId(createSessionId());
    setHasStarted(true);
    resetRunPresentation();
  };

  const handleContinueRun = () => {
    setHasStarted(true);
  };

  const handleReturnToTitle = () => {
    setHasStarted(false);
  };

  const handleRestartRun = () => {
    setGameState(createInitialGameState());
    setSessionId(createSessionId());
    setHasStarted(true);
    resetRunPresentation();
  };

  const handleClearSave = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(PLAYTEST_SAVE_KEY);
    }

    setGameState(createInitialGameState());
    setSessionId(createSessionId());
    setHasSavedRun(false);
    setLastSavedAt(null);
    setHasStarted(false);
    resetRunPresentation();
  };

  const handleNpcInteraction = async () => {
    if (!currentScene || !npcAvailability || reactionLoading || npcInteractionApplied) {
      return;
    }

    const reactionKey = getStructuredNpcReactionKey(currentScene.id, npcAvailability.npcId);

    if (pendingReactionKeyRef.current === reactionKey) {
      return;
    }

    pendingReactionKeyRef.current = reactionKey;
    setReactionLoading(true);
    setReactionNotice(null);

    try {
      const request = buildStructuredNpcReactionRequest(
        gameState,
        currentScene,
        sessionId,
        npcAvailability
      );
      const result = await getNpcReactionResult(request);

      setReactionSource(result.source);
      setReactionNotice(`${npcAvailability.name} answered, and the road shifts around what they revealed.`);
      setGameState((previousState) =>
        markStructuredNpcReactionApplied(
          applyNpcReaction(previousState, result.data),
          currentScene.id,
          npcAvailability.npcId
        )
      );
    } catch {
      setReactionNotice("The witness could not be reached safely. The current scene remains playable.");
    } finally {
      pendingReactionKeyRef.current = null;
      setReactionLoading(false);
    }
  };

  if (!hasHydrated) {
    return (
      <main className="story-shell px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1200px] page-rise">
          <section className="panel panel-glow story-panel rounded-[2.2rem] p-8 shadow-panel">
            <p className="text-[11px] uppercase tracking-[0.42em] text-amber-100/80">
              Whisper Caravan
            </p>
            <h1 className="font-display mt-4 text-4xl text-parchment sm:text-5xl">
              Seven-Day Memory
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-300 sm:text-base">
              Opening the caravan ledger.
            </p>
          </section>
        </div>
      </main>
    );
  }

  if (!hasStarted) {
    return (
      <TitleCard
        hasSavedRun={hasSavedRun}
        savedAtLabel={savedAtLabel}
        day={currentPhaseContent.day}
        phaseLabel={getPhaseLabel(gameState.phase)}
        location={currentPhaseContent.location}
        onPrimaryAction={hasSavedRun ? handleContinueRun : handleStartNewRun}
        onSecondaryAction={handleStartNewRun}
        onClearSave={handleClearSave}
      />
    );
  }

  return (
    <main className="story-shell px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1540px] page-rise">
        <header className="panel panel-glow story-panel rounded-[2.2rem] p-6 shadow-panel sm:p-7">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <p className="text-[11px] uppercase tracking-[0.42em] text-amber-100/80">
                Whisper Caravan
              </p>
              <h1 className="font-display mt-4 text-4xl text-parchment sm:text-5xl">
                Seven-Day Memory
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-300 sm:text-base">
                Hold together what the road remembers before Bear Court turns memory into judgment.
              </p>
              {savedAtLabel ? (
                <p className="mt-4 text-xs uppercase tracking-[0.28em] text-stone-400">
                  Local save updated {savedAtLabel}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleReturnToTitle}
                className="rounded-full border border-white/10 bg-black/20 px-5 py-3 text-sm font-semibold text-stone-100 transition hover:bg-white/10"
              >
                Title Screen
              </button>
              <button
                type="button"
                onClick={handleRestartRun}
                className="rounded-full border border-white/10 bg-black/20 px-5 py-3 text-sm font-semibold text-stone-100 transition hover:bg-white/10"
              >
                Restart Run
              </button>
              {isDeveloperMode ? (
                <button
                  type="button"
                  onClick={() => setShowDeveloperDetails((previous) => !previous)}
                  className="rounded-full border border-white/10 bg-black/20 px-5 py-3 text-sm font-semibold text-stone-100 transition hover:bg-white/10"
                >
                  {showDeveloperDetails ? "Hide Debug" : "Debug"}
                </button>
              ) : null}
            </div>
          </div>

          {showDeveloperDetails ? (
            <div className="mt-6 rounded-[1.6rem] border border-white/10 bg-black/20 p-5">
              <p className="text-[11px] uppercase tracking-[0.35em] text-amber-100/70">
                Developer Details
              </p>
              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                <div className="rounded-[1.3rem] border border-white/10 bg-white/5 p-4 text-sm leading-6 text-stone-300">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-stone-400">
                    Build
                  </p>
                  <p className="mt-2">{PLAYTEST_BUILD_LABEL}</p>
                </div>
                <div className="rounded-[1.3rem] border border-white/10 bg-white/5 p-4 text-sm leading-6 text-stone-300">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-stone-400">
                    Retrieval
                  </p>
                  <p className="mt-2">{backendNotice ?? "Backend notice hidden until needed."}</p>
                  {reactionNotice ? <p className="mt-2">{reactionNotice}</p> : null}
                </div>
              </div>
            </div>
          ) : null}
        </header>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0">
            {trialResult ? (
              <TrialPanel
                phase={resolutionPhase}
                result={trialResult}
                showDeveloperDetails={showDeveloperDetails}
              />
            ) : (
              <GameScene
                day={currentPhaseContent.day}
                location={currentPhaseContent.location}
                title={currentPhaseContent.title}
                eventText={currentPhaseContent.description}
                selectedChoice={currentChoiceRecord?.choiceId ?? null}
                sceneStatus={gameState.sceneStatus}
                options={currentScene?.choices ?? []}
                choicesLocked={Boolean(currentChoiceRecord) || !currentScene}
                imagePath={currentIllustration?.src ?? null}
                imageAlt={currentIllustration?.alt ?? currentPhaseContent.title}
                npcAvailability={npcAvailability}
                latestNpcReaction={gameState.latestNpcReaction ?? null}
                npcInteractionDisabled={!currentScene || npcInteractionApplied}
                npcInteractionLoading={reactionLoading}
                npcInteractionNotice={
                  npcInteractionApplied
                    ? "This witness has already been approached for the current event."
                    : reactionNotice
                }
                onInteractWithNpc={handleNpcInteraction}
                emptyStateText="This phase does not take a new scene choice. Read the state of the road, then continue when ready."
                onSelectChoice={handleChoiceSelect}
              />
            )}
          </div>

          <aside className="min-w-0 xl:sticky xl:top-6 xl:self-start">
            <div className="space-y-6">
              <StatusPanel
                day={currentPhaseContent.day}
                location={currentPhaseContent.location}
                phaseLabel={getPhaseLabel(gameState.phase)}
                statusText={statusText}
                actionLabel={actionLabel}
                actionDisabled={actionDisabled}
                onAction={handleAdvance}
                factions={gameState.factions}
                resources={gameState.resources}
              />

              <section className="panel panel-glow story-panel rounded-[2rem] p-5 shadow-panel">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.4em] text-amber-100/70">
                      Journal
                    </p>
                    <p className="mt-2 text-sm text-stone-300">
                      Choose what to keep in view.
                    </p>
                  </div>
                  <div className="inline-flex rounded-full border border-white/10 bg-black/20 p-1">
                    <button
                      type="button"
                      onClick={() => setActiveRailTab("memory")}
                      className={`rounded-full px-4 py-2 text-xs uppercase tracking-[0.28em] transition ${activeRailTab === "memory"
                        ? "bg-amber-500 text-stone-950"
                        : "text-stone-300 hover:text-white"
                        }`}
                    >
                      Memory
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveRailTab("evidence")}
                      className={`rounded-full px-4 py-2 text-xs uppercase tracking-[0.28em] transition ${activeRailTab === "evidence"
                        ? "bg-amber-500 text-stone-950"
                        : "text-stone-300 hover:text-white"
                        }`}
                    >
                      Evidence
                    </button>
                  </div>
                </div>

                <div className="mt-5">
                  {activeRailTab === "memory" ? (
                    <MemoryPanel
                      memories={gameState.memories}
                      activeCount={activeMemories.length}
                      expiredCount={expiredMemories.length}
                      preview={memoryCollapsePreview}
                      checkpoint={currentCollapseCheckpoint}
                    />
                  ) : (
                    <EvidencePanel
                      headline={headline}
                      overviewText={overviewText}
                      retrievedEvidence={retrievedEvidence}
                      evidenceSource={evidenceSource}
                      evidenceDebug={evidenceDebug}
                      collectedEvidence={gameState.collectedEvidence ?? []}
                      latestStructuredReaction={gameState.latestNpcReaction ?? null}
                      trialPreviewItems={trialPreviewItems}
                      reactionSource={reactionSource}
                      showDeveloperDetails={showDeveloperDetails}
                    />
                  )}
                </div>
              </section>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
