import { Choice, ChoiceId } from "@/lib/types";
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

      <div className="mt-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm uppercase tracking-[0.25em] text-amber-100/70">
            Choices
          </p>
          <span className="text-xs uppercase tracking-[0.25em] text-stone-400">
            {choicesLocked ? "One choice per day" : "Choose one action"}
          </span>
        </div>

        {options.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/15 p-5 text-sm text-stone-400">
            The event loop has closed for this prototype. Review what remains in memory.
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
