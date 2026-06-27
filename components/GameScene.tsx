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
  emptyStateText?: string;
  npcAvailability?: StructuredNpcAvailability | null;
  latestNpcReaction?: NPCReaction | null;
  npcInteractionDisabled?: boolean;
  npcInteractionLoading?: boolean;
  npcInteractionNotice?: string | null;
  onInteractWithNpc?: () => void;
  onSelectChoice: (id: ChoiceId) => void;
};

export function GameScene({
  day,
  location,
  title,
  eventText,
  selectedChoice,
  sceneStatus,
  options,
  choicesLocked,
  emptyStateText = "This phase has no authored scene choices yet.",
  npcAvailability = null,
  latestNpcReaction = null,
  npcInteractionDisabled = false,
  npcInteractionLoading = false,
  npcInteractionNotice = null,
  onInteractWithNpc,
  onSelectChoice,
}: GameSceneProps) {
  return (
    <section className="panel panel-glow rounded-3xl p-6 shadow-panel">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.35em] text-amber-100/70">
          Game Scene
        </p>
        <h2 className="font-display mt-3 text-3xl text-parchment">{title}</h2>
        <p className="mt-2 text-sm uppercase tracking-[0.28em] text-emerald-200/70">
          Day {day} • {location}
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
        <p className="text-sm uppercase tracking-[0.25em] text-amber-100/70">
          Event
        </p>
        <p className="mt-3 text-base leading-7 text-stone-200">{eventText}</p>
      </div>

      <div className="mt-6 rounded-3xl border border-amber-200/10 bg-amber-200/5 p-5">
        <p className="text-sm uppercase tracking-[0.25em] text-amber-100/70">
          Current Consequence
        </p>
        <p className="mt-2 text-sm leading-7 text-stone-200">{sceneStatus}</p>
      </div>

      {npcAvailability ? (
        <div className="mt-6 rounded-3xl border border-emerald-200/15 bg-emerald-400/10 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm uppercase tracking-[0.25em] text-emerald-100/75">
                Suggested NPC Contact
              </p>
              <h3 className="mt-2 text-xl font-semibold text-white">{npcAvailability.name}</h3>
              <p className="mt-1 text-sm text-emerald-100/80">{npcAvailability.roleLabel}</p>
              <p className="mt-3 text-sm leading-6 text-stone-200">
                This event has evidence or pressure that this witness can respond to.
              </p>
            </div>
            <button
              type="button"
              disabled={npcInteractionDisabled || npcInteractionLoading || !onInteractWithNpc}
              onClick={onInteractWithNpc}
              className="rounded-full bg-emerald-300 px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:bg-emerald-100/40"
            >
              {npcInteractionLoading ? "Checking reaction..." : npcAvailability.actionLabel}
            </button>
          </div>
          {npcInteractionNotice ? (
            <p className="mt-4 text-sm leading-6 text-stone-200">{npcInteractionNotice}</p>
          ) : null}
          {latestNpcReaction && latestNpcReaction.npc_id === npcAvailability.npcId ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-emerald-100/75">
                Latest Response
              </p>
              <p className="mt-2 text-sm leading-7 text-stone-100">{latestNpcReaction.dialogue}</p>
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
        </div>
      ) : null}

      <div className="mt-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm uppercase tracking-[0.25em] text-amber-100/70">
            Choices
          </p>
          <span className="text-xs uppercase tracking-[0.25em] text-stone-400">
            {choicesLocked ? "This scene is locked" : "Choose one action"}
          </span>
        </div>

        {options.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/15 p-5 text-sm text-stone-400">
            {emptyStateText}
          </div>
        ) : (
          <div className="space-y-4">
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
      </div>
    </section>
  );
}
