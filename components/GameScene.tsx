import Image from "next/image";
import { useEffect, useState } from "react";
import { Choice, ChoiceId, NPCReaction, StructuredNpcAvailability } from "@/lib/types";
import { ChoiceCard } from "@/components/ChoiceCard";

type GameSceneProps = {
  day: number;
  location: string;
  title: string;
  eventText: string;
  selectedChoice: ChoiceId | null;
  sceneStatus: string;
  options: Choice[];
  choicesLocked: boolean;
  imagePath?: string | null;
  imageAlt?: string;
  emptyStateText?: string;
  npcAvailability?: StructuredNpcAvailability | null;
  latestNpcReaction?: NPCReaction | null;
  npcInteractionDisabled?: boolean;
  npcInteractionLoading?: boolean;
  npcInteractionNotice?: string | null;
  onInteractWithNpc?: () => void;
  onSelectChoice: (id: ChoiceId) => void;
};

function excerpt(text: string, maxLength: number) {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

export function GameScene({
  day,
  location,
  title,
  eventText,
  selectedChoice,
  sceneStatus,
  options,
  choicesLocked,
  imagePath = null,
  imageAlt = "",
  emptyStateText = "This phase has no authored scene choices yet.",
  npcAvailability = null,
  latestNpcReaction = null,
  npcInteractionDisabled = false,
  npcInteractionLoading = false,
  npcInteractionNotice = null,
  onInteractWithNpc,
  onSelectChoice,
}: GameSceneProps) {
  const [imageUnavailable, setImageUnavailable] = useState(false);

  useEffect(() => {
    setImageUnavailable(false);
  }, [imagePath]);

  const showImage = Boolean(imagePath) && !imageUnavailable;

  return (
    <section className="space-y-5">
      <article className="panel panel-glow story-panel overflow-hidden rounded-[2rem] shadow-panel">
        <div className="relative aspect-[16/10] overflow-hidden rounded-[1.6rem] bg-[#201815]">
          {showImage ? (
            <Image
              src={imagePath ?? ""}
              alt={imageAlt}
              fill
              priority={day === 1}
              sizes="(max-width: 1280px) 100vw, 70vw"
              className="object-cover"
              onError={() => setImageUnavailable(true)}
            />
          ) : (
            <div className="illustration-fallback absolute inset-0 flex items-center justify-center px-8 text-center">
              <div>
                <p className="text-[11px] uppercase tracking-[0.42em] text-amber-100/70">
                  Whisper Caravan
                </p>
                <h2 className="font-display mt-4 text-4xl text-parchment sm:text-5xl">
                  {title}
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-stone-200 sm:text-base">
                  {excerpt(eventText, 220)}
                </p>
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,13,11,0.1)_0%,rgba(18,13,11,0.3)_45%,rgba(18,13,11,0.88)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
            <p className="text-[11px] uppercase tracking-[0.4em] text-amber-100/75">
              Day {day} • {location}
            </p>
            <h1 className="font-display mt-3 max-w-4xl text-4xl text-[#fff6e5] sm:text-5xl">
              {title}
            </h1>
          </div>
        </div>
      </article>

      <article className="panel panel-glow story-panel rounded-[2rem] p-6 shadow-panel sm:p-7">
        <p className="text-[11px] uppercase tracking-[0.4em] text-amber-100/70">Event</p>
        <p className="mt-4 max-w-4xl text-base leading-8 text-stone-100 sm:text-[1.05rem]">
          {eventText}
        </p>
      </article>

      {npcAvailability ? (
        <article className="panel story-panel rounded-[2rem] border border-emerald-200/15 bg-emerald-400/10 p-5 shadow-panel">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[11px] uppercase tracking-[0.35em] text-emerald-100/75">
                Contact
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h3 className="text-xl font-semibold text-white">{npcAvailability.name}</h3>
                <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-emerald-100/80">
                  {npcAvailability.roleLabel}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-stone-200">
                A witness can be approached here for a structured response, but the scene itself stays playable either way.
              </p>
            </div>
            <button
              type="button"
              disabled={npcInteractionDisabled || npcInteractionLoading || !onInteractWithNpc}
              onClick={onInteractWithNpc}
              className="rounded-full bg-emerald-300 px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:bg-emerald-100/40"
            >
              {npcInteractionLoading ? "Listening..." : npcAvailability.actionLabel}
            </button>
          </div>
          {npcInteractionNotice ? (
            <p className="mt-4 text-sm leading-6 text-stone-200">{npcInteractionNotice}</p>
          ) : null}
          {latestNpcReaction && latestNpcReaction.npc_id === npcAvailability.npcId ? (
            <div className="mt-4 rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
              <p className="text-[10px] uppercase tracking-[0.3em] text-emerald-100/75">
                Latest Response
              </p>
              <p className="mt-3 text-sm leading-7 text-stone-100">{latestNpcReaction.dialogue}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.24em] text-stone-300">
                <span className="rounded-full border border-white/10 px-3 py-1">
                  tone {latestNpcReaction.tone}
                </span>
                <span className="rounded-full border border-white/10 px-3 py-1">
                  trust {latestNpcReaction.trust_delta >= 0 ? "+" : ""}
                  {latestNpcReaction.trust_delta}
                </span>
                <span className="rounded-full border border-white/10 px-3 py-1">
                  legal risk {latestNpcReaction.legal_risk_delta >= 0 ? "+" : ""}
                  {latestNpcReaction.legal_risk_delta}
                </span>
              </div>
            </div>
          ) : null}
        </article>
      ) : null}

      <article className="panel panel-glow story-panel rounded-[2rem] p-6 shadow-panel sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.4em] text-amber-100/70">Choices</p>
            <p className="mt-2 text-sm text-stone-300">
              {choicesLocked ? "This scene is resolved." : "Choose the next step for the caravan."}
            </p>
          </div>
          <div className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs uppercase tracking-[0.28em] text-stone-300">
            {choicesLocked ? "Locked" : `${options.length} paths`}
          </div>
        </div>

        {options.length === 0 ? (
          <div className="mt-5 rounded-[1.6rem] border border-dashed border-white/15 p-5 text-sm leading-7 text-stone-400">
            {emptyStateText}
          </div>
        ) : (
          <div className="choice-stack mt-5 space-y-4">
            {options.map((option) => (
              <ChoiceCard
                key={option.id}
                option={option}
                selected={selectedChoice === option.id}
                disabled={choicesLocked}
                onSelect={onSelectChoice}
              />
            ))}
          </div>
        )}
      </article>

      <article className="panel story-panel rounded-[2rem] border border-white/10 bg-black/20 p-5 shadow-panel">
        <p className="text-[11px] uppercase tracking-[0.35em] text-amber-100/70">Current Consequence</p>
        <p className="mt-3 text-sm leading-7 text-stone-200">{sceneStatus}</p>
      </article>
    </section>
  );
}
