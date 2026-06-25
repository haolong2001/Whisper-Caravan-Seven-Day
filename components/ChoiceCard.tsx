import { Choice } from "@/lib/types";

type ChoiceCardProps = {
  option: Choice;
  selected: boolean;
  disabled?: boolean;
  onSelect: (id: Choice["id"]) => void;
};

export function ChoiceCard({
  option,
  selected,
  disabled = false,
  onSelect,
}: ChoiceCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(option.id)}
      disabled={disabled}
      className={`w-full rounded-2xl border px-4 py-4 text-left transition duration-200 ${
        selected
          ? "border-amber-300 bg-amber-100/10 shadow-lg shadow-amber-950/30"
          : "border-white/10 bg-white/5 hover:border-amber-200/40 hover:bg-white/10"
      } ${disabled ? "cursor-not-allowed opacity-70" : ""}`}
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="font-display text-xl text-parchment">{option.id}</span>
        {selected ? (
          <span className="rounded-full border border-amber-200/30 px-2 py-1 text-[10px] uppercase tracking-[0.3em] text-amber-100">
            Chosen
          </span>
        ) : null}
      </div>
      <h3 className="text-base font-semibold text-white">{option.label}</h3>
      <p className="mt-1 text-sm leading-6 text-stone-300">{option.description}</p>
    </button>
  );
}
