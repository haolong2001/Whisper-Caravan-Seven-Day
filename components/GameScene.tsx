import { ChoiceOption, ChoiceId } from "@/lib/types";
import { ChoiceCard } from "@/components/ChoiceCard";

type GameSceneProps = {
  day: number;
  location: string;
  eventText: string;
  selectedChoice: ChoiceId | null;
  sceneStatus: string;
  options: ChoiceOption[];
  onSelectChoice: (id: ChoiceId) => void;
};

export function GameScene({
  day,
  location,
  eventText,
  selectedChoice,
  sceneStatus,
  options,
  onSelectChoice,
}: GameSceneProps) {
  return (
    <section className="panel panel-glow rounded-3xl p-6 shadow-panel">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.35em] text-amber-100/70">
          Game Scene
        </p>
        <h2 className="font-display mt-3 text-3xl text-parchment">
          Deer Village, Day {day}
        </h2>
        <p className="mt-2 text-sm uppercase tracking-[0.28em] text-emerald-200/70">
          {location}
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

      <div className="mt-6 space-y-4">
        {options.map((option) => (
          <ChoiceCard
            key={option.id}
            option={option}
            selected={selectedChoice === option.id}
            onSelect={onSelectChoice}
          />
        ))}
      </div>
    </section>
  );
}
