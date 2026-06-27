import { TrialResult } from "@/lib/types";

type TrialPanelProps = {
  phase: "trial" | "ending";
  result: TrialResult;
  showDeveloperDetails?: boolean;
};

function ScoreCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "truth" | "merchant" | "sympathy" | "failure";
}) {
  const toneClasses =
    tone === "truth"
      ? "border-sky-300/20 bg-sky-400/10 text-sky-100"
      : tone === "merchant"
        ? "border-amber-300/20 bg-amber-400/10 text-amber-100"
        : tone === "sympathy"
          ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-100"
          : "border-rose-300/20 bg-rose-400/10 text-rose-100";

  return (
    <article className={`rounded-3xl border p-4 ${toneClasses}`}>
      <p className="text-[10px] uppercase tracking-[0.3em]">{label}</p>
      <p className="mt-3 font-display text-4xl">{value}</p>
    </article>
  );
}

function SimpleList({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: string[];
  emptyText: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm uppercase tracking-[0.25em] text-amber-100/70">{title}</p>
        <span className="text-xs uppercase tracking-[0.25em] text-stone-400">
          {items.length} items
        </span>
      </div>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-stone-400">{emptyText}</p>
      ) : (
        <ul className="mt-4 space-y-2 text-sm leading-6 text-stone-200">
          {items.map((item) => (
            <li key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function TrialPanel({
  phase,
  result,
  showDeveloperDetails = false,
}: TrialPanelProps) {
  const acceptedTitles = result.acceptedEvidence.map((item) => item.title).slice(0, 6);
  const rejectedTitles = result.rejectedEvidence.map((item) => item.title).slice(0, 6);
  const expiredTitles = result.expiredMemories.map((item) => item.title).slice(0, 6);
  const conflictTitles = result.rumorConflicts.map(
    (item) => `${item.title}: ${item.reason}`
  );

  return (
    <section className="panel panel-glow rounded-3xl p-6 shadow-panel">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.35em] text-amber-100/70">
          {phase === "trial" ? "Bear Court Trial" : "Ending Resolution"}
        </p>
        <h2 className="font-display mt-3 text-3xl text-parchment">{result.outcome.title}</h2>
        <p className="mt-2 text-sm uppercase tracking-[0.28em] text-emerald-200/70">
          Ending {result.selectedEndingId} • {result.outcome.verdictLabel} • route {result.endingRoute}
        </p>
        <p className="mt-4 text-sm leading-7 text-stone-200">
          {phase === "trial" ? result.outcome.summary : result.outcome.text}
        </p>
        {phase === "ending" ? (
          <p className="mt-4 rounded-2xl border border-amber-200/10 bg-amber-200/5 px-4 py-3 text-sm leading-6 text-amber-50">
            Screenshot this ending card or send your route notes and verdict to the playtest organizer.
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ScoreCard label="Legal Truth" value={result.legalTruthScore} tone="truth" />
        <ScoreCard
          label="Merchant Settlement"
          value={result.merchantSettlementScore}
          tone="merchant"
        />
        <ScoreCard
          label="Public Sympathy"
          value={result.publicSympathyScore}
          tone="sympathy"
        />
        <ScoreCard label="Failure Pressure" value={result.failurePressure} tone="failure" />
      </div>

      <div className="mt-6 grid gap-4">
        <SimpleList
          title="Accepted Evidence Considered"
          items={acceptedTitles}
          emptyText="Bear Court accepted no active evidence for this route."
        />
        <SimpleList
          title="Rejected Evidence Considered"
          items={rejectedTitles}
          emptyText="No active evidence was rejected under the current court rules."
        />
        <SimpleList
          title="Expired Memories Considered"
          items={expiredTitles}
          emptyText="No memories expired before the trial window."
        />
        <SimpleList
          title="Rumor Conflicts"
          items={conflictTitles}
          emptyText="No contradictory rumor clusters survived into the verdict."
        />
      </div>

      {showDeveloperDetails ? (
        <div className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm uppercase tracking-[0.25em] text-amber-100/70">
              Debug Explanation
            </p>
            <span className="text-xs uppercase tracking-[0.25em] text-stone-400">
              thresholds A1 {result.thresholds.fullTruth} / A2 {result.thresholds.partialTruth} / B{" "}
              {result.thresholds.merchantSettlement} / C {result.thresholds.publicSympathy}
            </span>
          </div>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-stone-200">
            {result.debugLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
