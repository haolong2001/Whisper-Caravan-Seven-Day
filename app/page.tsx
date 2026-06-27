"use client";

import { useEffect, useRef, useState } from "react";
import { DayTracker } from "@/components/DayTracker";
import { EvidencePanel } from "@/components/EvidencePanel";
import { GameScene } from "@/components/GameScene";
import { MemoryCollapsePanel } from "@/components/MemoryCollapsePanel";
import { MemoryPanel } from "@/components/MemoryPanel";
import { StatusPanel } from "@/components/StatusPanel";
import { TrialPanel } from "@/components/TrialPanel";
import {
  ChoiceId,
  GameState,
  RetrievedEvidence,
  RetrievalDebug,
  TrialPreviewItem,
} from "@/lib/types";
import { createInitialGameState, initialNpcResponse } from "@/lib/mockData";
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

const PLAYTEST_BUILD_LABEL = "Whisper Caravan v0.6 Playtest - Slice 5";
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
  const pendingReactionKeyRef = useRef<string | null>(null);
  const isDeveloperMode = process.env.NODE_ENV !== "production";

  const currentScene = getCurrentScene(gameState);
  const currentChoiceRecord = getCurrentSceneChoice(gameState);
  const currentPhaseContent = getCurrentPhaseContent(gameState);
  const currentCollapseCheckpoint =
    gameState.phase === "collapse_one" || gameState.phase === "collapse_two"
      ? getCollapseCheckpoint(gameState.phase)
      : null;
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
  const headline = showsAllActiveEvidence ? "Trial Evidence Stack" : "Evidence Ledger";
  const overviewText = isCollapsePhase
    ? "A collapse boundary is approaching. Short-term traces that will expire next are separated in the collapse panel while durable public evidence remains visible."
    : showsAllActiveEvidence
      ? "The run has reached Bear Court. The evidence panel now shows the full active stack that survives into the trial and ending."
      : currentChoiceRecord
        ? "This day is resolved. The evidence ledger shows the public trail that currently survives for the road to read."
        : initialNpcResponse;
  const statusText = isLoopPhase
    ? currentChoiceRecord
      ? "Scene locked"
      : "Decision open"
    : isCollapsePhase
      ? "Collapse checkpoint active"
      : gameState.phase === "trial"
        ? `Trial verdict ${trialResult?.outcome.verdictLabel ?? "ready"}`
        : `Ending ${trialResult?.selectedEndingId ?? "ready"}`;
  const actionLabel =
    gameState.phase === "ending"
      ? undefined
      : isCollapsePhase
        ? "Apply Collapse"
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

  const handleStartNewRun = () => {
    setGameState(createInitialGameState());
    setSessionId(createSessionId());
    setHasStarted(true);
    setBackendNotice(null);
    setReactionNotice(null);
    setReactionSource(null);
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
    setBackendNotice(null);
    setReactionNotice(null);
    setReactionSource(null);
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
    setBackendNotice(null);
    setReactionNotice(null);
    setReactionSource(null);
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
      setReactionNotice(
        result.source === "backend"
          ? `${npcAvailability.name} responded using backend-assisted retrieval.`
          : `${npcAvailability.name} responded using deterministic local fallback.`
      );
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
      <main className="mx-auto flex min-h-screen max-w-[1700px] flex-col px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-white/10 bg-black/20 px-6 py-8 shadow-panel">
          <p className="text-xs uppercase tracking-[0.35em] text-amber-100/70">
            {PLAYTEST_BUILD_LABEL}
          </p>
          <h1 className="font-display mt-3 text-4xl text-parchment sm:text-5xl">
            Whisper Caravan: Seven-Day Memory
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-stone-300 sm:text-base">
            Loading the current playtest run state.
          </p>
        </div>
      </main>
    );
  }

  if (!hasStarted) {
    return (
      <main className="mx-auto flex min-h-screen max-w-[1100px] flex-col px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-white/10 bg-black/20 px-6 py-8 shadow-panel">
          <p className="text-xs uppercase tracking-[0.35em] text-amber-100/70">
            {PLAYTEST_BUILD_LABEL}
          </p>
          <h1 className="font-display mt-3 text-4xl text-parchment sm:text-5xl">
            Whisper Caravan: Seven-Day Memory
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-stone-300 sm:text-base">
            A browser playtest of the route-dependent fourteen-day beta slice. Friends
            can play from Day 1 to Day 14, reach Bear Court, see one deterministic
            ending, and send back feedback without a backend requirement.
          </p>
        </div>

        <section className="panel panel-glow mt-6 rounded-3xl p-6 shadow-panel">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.35em] text-amber-100/70">
                Playtest Run
              </p>
              <h2 className="font-display mt-3 text-3xl text-parchment">
                {hasSavedRun ? "Continue the saved caravan route" : "Start a route-dependent run"}
              </h2>
              <p className="mt-3 text-sm leading-7 text-stone-300">
                {hasSavedRun
                  ? `Saved at ${savedAtLabel ?? "an earlier time"} on Day ${currentPhaseContent.day} during ${getPhaseLabel(gameState.phase)} at ${currentPhaseContent.location}.`
                  : "One major event resolves each day. Four anchor cards stay fixed, the remaining days pull from the 26-card pool, and two collapse checkpoints lead into the Bear Court trial."}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={hasSavedRun ? handleContinueRun : handleStartNewRun}
                className="rounded-full bg-amber-500 px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-amber-400"
              >
                {hasSavedRun ? "Continue Run" : "Start Playtest"}
              </button>
              <button
                type="button"
                onClick={handleStartNewRun}
                className="rounded-full border border-white/10 bg-black/20 px-5 py-3 text-sm font-semibold text-stone-100 transition hover:bg-white/10"
              >
                Restart Run
              </button>
              {hasSavedRun ? (
                <button
                  type="button"
                  onClick={handleClearSave}
                  className="rounded-full border border-white/10 bg-black/20 px-5 py-3 text-sm font-semibold text-stone-100 transition hover:bg-white/10"
                >
                  Clear Save
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <article className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <p className="text-xs uppercase tracking-[0.28em] text-amber-100/70">
                Playable Shape
              </p>
              <p className="mt-3 text-sm leading-6 text-stone-300">
                Route-dependent 14-day story path drawn from the 26-card pool. One major event still appears per day.
              </p>
            </article>
            <article className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <p className="text-xs uppercase tracking-[0.28em] text-amber-100/70">
                Trial Payoff
              </p>
              <p className="mt-3 text-sm leading-6 text-stone-300">
                Bear Court scoring and all five endings remain deterministic.
              </p>
            </article>
            <article className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <p className="text-xs uppercase tracking-[0.28em] text-amber-100/70">
                Save Behavior
              </p>
              <p className="mt-3 text-sm leading-6 text-stone-300">
                Progress is stored in local browser storage on this device only.
              </p>
            </article>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-[1700px] flex-col px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-white/10 bg-black/20 px-6 py-8 shadow-panel">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.35em] text-amber-100/70">
              {PLAYTEST_BUILD_LABEL}
            </p>
            <h1 className="font-display mt-3 text-4xl text-parchment sm:text-5xl">
              Whisper Caravan: Seven-Day Memory
            </h1>
            <p className="mt-4 text-sm leading-7 text-stone-300 sm:text-base">
              This playtest build keeps one major event per day, two collapse
              checkpoints, and a deterministic Bear Court verdict plus ending
              resolution, but the middle of the run now pulls from a deterministic
              route-dependent 26-card pool. Backend retrieval is optional; the browser
              can complete the full run through deterministic local fallback.
            </p>
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
                {showDeveloperDetails ? "Hide Debug" : "Show Debug"}
              </button>
            ) : null}
          </div>
        </div>
        {savedAtLabel ? (
          <p className="mt-4 text-xs uppercase tracking-[0.28em] text-stone-400">
            Local save updated {savedAtLabel}
          </p>
        ) : null}
      </div>

      {isDeveloperMode && backendNotice ? (
        <div className="mt-6 rounded-3xl border border-amber-300/20 bg-amber-400/10 px-5 py-4 text-sm text-amber-100">
          {backendNotice}
        </div>
      ) : null}

      <DayTracker
        day={currentPhaseContent.day}
        location={currentPhaseContent.location}
        phaseLabel={getPhaseLabel(gameState.phase)}
        statusText={statusText}
        actionLabel={actionLabel}
        actionDisabled={actionDisabled}
        onAction={handleAdvance}
      />

      <StatusPanel factions={gameState.factions} resources={gameState.resources} />

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
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
            npcAvailability={npcAvailability}
            latestNpcReaction={gameState.latestNpcReaction ?? null}
            npcInteractionDisabled={!currentScene || npcInteractionApplied}
            npcInteractionLoading={reactionLoading}
            npcInteractionNotice={
              npcInteractionApplied
                ? "This NPC interaction has already been used for the current event."
                : reactionNotice
            }
            onInteractWithNpc={handleNpcInteraction}
            emptyStateText="This checkpoint does not take a new scene choice. Review the collapse preview and continue when ready."
            onSelectChoice={handleChoiceSelect}
          />
        )}
        <MemoryPanel
          memories={gameState.memories}
          activeCount={activeMemories.length}
          expiredCount={expiredMemories.length}
        />
        {memoryCollapsePreview ? (
          <MemoryCollapsePanel
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
    </main>
  );
}
