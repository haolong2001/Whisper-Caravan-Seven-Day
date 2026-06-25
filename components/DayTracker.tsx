type DayTrackerProps = {
  day: number;
  location: string;
  statusText: string;
  actionLabel?: string;
  actionDisabled?: boolean;
  onAction?: () => void;
};

export function DayTracker({
  day,
  location,
  statusText,
  actionLabel,
  actionDisabled = false,
  onAction,
}: DayTrackerProps) {
  return (
    <div className="panel panel-glow rounded-3xl p-5 shadow-panel">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-amber-100/70">
            Caravan Clock
          </p>
          <div className="mt-2 flex items-end gap-3">
            <span className="font-display text-5xl leading-none text-parchment">
              Day {day}
            </span>
            <span className="pb-1 text-sm uppercase tracking-[0.25em] text-emerald-200/70">
              {location}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <div className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-stone-300">
            {statusText}
          </div>
          {actionLabel ? (
            <button
              type="button"
              onClick={onAction}
              disabled={actionDisabled}
              className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
                actionDisabled
                  ? "cursor-not-allowed bg-stone-700/70 text-stone-300"
                  : "bg-amber-500 text-stone-950 hover:bg-amber-400"
              }`}
            >
              {actionLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
