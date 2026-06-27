import { useState } from "react";
import { FactionState, GameResources } from "@/lib/types";

type StatusPanelProps = {
  day: number;
  location: string;
  phaseLabel: string;
  statusText: string;
  actionLabel?: string;
  actionDisabled?: boolean;
  onAction?: () => void;
  factions: FactionState;
  resources: GameResources;
};

const factionLabels: Record<keyof FactionState, string> = {
  deerVillage: "Deer Village",
  refugees: "Refugees",
  foxMarket: "Fox Market",
  crowBrokers: "Crow Brokers",
  bearCourt: "Bear Court",
};

function StatChip({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number | string;
  tone?: "default" | "alert";
}) {
  return (
    <div
      className={`rounded-[1.3rem] border px-3 py-3 ${
        tone === "alert"
          ? "border-rose-300/20 bg-rose-400/10"
          : "border-white/10 bg-black/20"
      }`}
    >
      <p className="text-[10px] uppercase tracking-[0.28em] text-stone-400">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

export function StatusPanel({
  day,
  location,
  phaseLabel,
  statusText,
  actionLabel,
  actionDisabled = false,
  onAction,
  factions,
  resources,
}: StatusPanelProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <section className="panel panel-glow story-panel rounded-[2rem] p-5 shadow-panel">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.4em] text-amber-100/70">Daybook</p>
          <div className="mt-3 flex items-end gap-3">
            <span className="font-display text-5xl leading-none text-parchment">Day {day}</span>
            <span className="pb-1 text-xs uppercase tracking-[0.28em] text-emerald-200/70">
              {location}
            </span>
          </div>
          <p className="mt-3 text-xs uppercase tracking-[0.3em] text-stone-400">{phaseLabel}</p>
        </div>
        {actionLabel ? (
          <button
            type="button"
            onClick={onAction}
            disabled={actionDisabled}
            className={`rounded-full px-4 py-3 text-sm font-semibold transition ${
              actionDisabled
                ? "cursor-not-allowed bg-stone-700/70 text-stone-300"
                : "bg-amber-500 text-stone-950 hover:bg-amber-400"
            }`}
          >
            {actionLabel}
          </button>
        ) : null}
      </div>

      <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-stone-200">
        {statusText}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <StatChip label="Legal Risk" value={resources.legalRisk} tone="alert" />
        <StatChip label="Silver" value={resources.silver} />
        <StatChip label="Medicine" value={resources.medicine} />
        <StatChip label="Provisions" value={resources.provisions} />
      </div>

      <button
        type="button"
        onClick={() => setShowDetails((previous) => !previous)}
        className="mt-5 text-xs uppercase tracking-[0.3em] text-amber-100/75 transition hover:text-amber-50"
      >
        {showDetails ? "Hide Faction Details" : "Show Faction Details"}
      </button>

      {showDetails ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {Object.entries(factions).map(([key, value]) => (
            <StatChip
              key={key}
              label={factionLabels[key as keyof FactionState]}
              value={value}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
