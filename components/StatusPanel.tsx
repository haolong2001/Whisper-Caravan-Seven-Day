import { FactionState, GameResources } from "@/lib/types";

type StatusPanelProps = {
  factions: FactionState;
  resources: GameResources;
};

const factionLabels: Record<keyof FactionState, string> = {
  deerVillage: "deerVillage",
  refugees: "refugees",
  foxMarket: "foxMarket",
  crowBrokers: "crowBrokers",
  bearCourt: "bearCourt",
};

function StatChip({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.28em] text-stone-400">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

export function StatusPanel({ factions, resources }: StatusPanelProps) {
  return (
    <section className="panel panel-glow mt-6 rounded-3xl p-5 shadow-panel">
      <div className="flex flex-col gap-5">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-amber-100/70">
            Faction / Resource Status
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
            {Object.entries(factions).map(([key, value]) => (
              <StatChip
                key={key}
                label={factionLabels[key as keyof FactionState]}
                value={value}
              />
            ))}
            <StatChip label="legalRisk" value={resources.legalRisk} />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <StatChip label="silver" value={resources.silver} />
          <StatChip label="medicine" value={resources.medicine} />
          <StatChip label="provisions" value={resources.provisions} />
        </div>
      </div>
    </section>
  );
}
