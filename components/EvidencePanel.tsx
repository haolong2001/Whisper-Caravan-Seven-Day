import { BearCourtPreview, GameEffects, RetrievedEvidence } from "@/lib/types";

type EvidencePanelProps = {
  headline: string;
  npcResponse: string;
  retrievedEvidence: RetrievedEvidence[];
  gameEffects: GameEffects | null;
  bearCourtPreview?: BearCourtPreview | null;
};

function EvidenceList({
  title,
  evidence,
  emptyText,
}: {
  title: string;
  evidence: RetrievedEvidence[];
  emptyText: string;
}) {
  return (
    <div className="mt-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm uppercase tracking-[0.25em] text-amber-100/70">{title}</p>
        <span className="text-xs uppercase tracking-[0.25em] text-stone-400">
          {evidence.length} items
        </span>
      </div>

      <div className="mt-4 space-y-4">
        {evidence.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/15 p-5 text-sm text-stone-400">
            {emptyText}
          </div>
        ) : (
          evidence.map((memory) => (
            <article
              key={memory.memoryId}
              className="rounded-3xl border border-white/10 bg-white/5 p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-stone-300">
                  {memory.sourceType}
                </span>
                <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-stone-300">
                  {memory.evidenceRole}
                </span>
                <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-stone-300">
                  reliability {Math.round(memory.reliability * 100)}%
                </span>
              </div>
              <h3 className="mt-3 text-lg font-semibold text-white">{memory.title}</h3>
              <p className="mt-2 text-sm leading-6 text-stone-300">{memory.text}</p>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

export function EvidencePanel({
  headline,
  npcResponse,
  retrievedEvidence,
  gameEffects,
  bearCourtPreview = null,
}: EvidencePanelProps) {
  return (
    <section className="panel panel-glow rounded-3xl p-6 shadow-panel">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.35em] text-amber-100/70">
          NPC Response / Retrieved Evidence
        </p>
        <h2 className="font-display mt-3 text-3xl text-parchment">{headline}</h2>
      </div>

      <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
        <p className="text-sm uppercase tracking-[0.25em] text-amber-100/70">
          Response
        </p>
        <p className="mt-3 text-base leading-7 text-stone-200">{npcResponse}</p>
      </div>

      <EvidenceList
        title="Retrieved Evidence"
        evidence={retrievedEvidence}
        emptyText="No public evidence is active yet."
      />

      {bearCourtPreview ? (
        <div className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-5">
          <p className="text-sm uppercase tracking-[0.25em] text-amber-100/70">
            Bear Court Preview
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-emerald-200/70">
                Accepted Evidence
              </p>
              <div className="mt-3 space-y-3">
                {bearCourtPreview.acceptedEvidence.length === 0 ? (
                  <p className="text-sm text-stone-400">Nothing clears the court threshold.</p>
                ) : (
                  bearCourtPreview.acceptedEvidence.map((item) => (
                    <div
                      key={`accepted-${item.memoryId}`}
                      className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-3 text-sm text-stone-200"
                    >
                      {item.title}
                    </div>
                  ))
                )}
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-rose-200/70">
                Rejected Evidence
              </p>
              <div className="mt-3 space-y-3">
                {bearCourtPreview.rejectedEvidence.length === 0 ? (
                  <p className="text-sm text-stone-400">No weak or neutral public traces remain.</p>
                ) : (
                  bearCourtPreview.rejectedEvidence.map((item) => (
                    <div
                      key={`rejected-${item.memoryId}`}
                      className="rounded-2xl border border-rose-300/20 bg-rose-400/10 p-3 text-sm text-stone-200"
                    >
                      {item.title}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-6 rounded-3xl border border-emerald-300/15 bg-emerald-400/10 p-5">
        <p className="text-sm uppercase tracking-[0.25em] text-emerald-100/80">
          Game State Effects
        </p>
        {gameEffects ? (
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-[0.28em] text-emerald-100/60">
                trustDelta
              </dt>
              <dd className="mt-2 text-2xl font-semibold text-white">
                {gameEffects.trustDelta}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.28em] text-emerald-100/60">
                priceModifier
              </dt>
              <dd className="mt-2 text-2xl font-semibold text-white">
                x{gameEffects.priceModifier.toFixed(1)}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.28em] text-emerald-100/60">
                questAvailable
              </dt>
              <dd className="mt-2 text-2xl font-semibold text-white">
                {gameEffects.questAvailable ? "true" : "false"}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.28em] text-emerald-100/60">
                legalRiskDelta
              </dt>
              <dd className="mt-2 text-2xl font-semibold text-white">
                {gameEffects.legalRiskDelta}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="mt-3 text-sm leading-6 text-stone-200">
            Day 8 applies the guard's retrieval logic and fills in these downstream
            effects.
          </p>
        )}
      </div>
    </section>
  );
}
