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
      className={`w-full rounded-[1.6rem] border px-5 py-5 text-left transition duration-200 ${
        selected
          ? "border-amber-300/80 bg-amber-100/10 shadow-lg shadow-amber-950/25"
          : "border-white/10 bg-white/5 hover:border-amber-200/40 hover:bg-white/10"
      } ${disabled ? "cursor-not-allowed opacity-70" : ""}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <span className="font-display flex h-12 w-12 items-center justify-center rounded-full border border-amber-200/20 bg-black/20 text-2xl text-parchment">
            {option.id}
          </span>
          <div>
            <h3 className="text-lg font-semibold text-white">{option.label}</h3>
            <p className="mt-2 text-sm leading-7 text-stone-300">{option.description}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {selected ? (
            <span className="rounded-full border border-amber-200/30 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-amber-100">
              Chosen
            </span>
          ) : null}
          <span className="text-xs uppercase tracking-[0.28em] text-stone-400">Select</span>
        </div>
      </div>
    </button>
  );
}
