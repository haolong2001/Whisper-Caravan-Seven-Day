import { GameEffects, RetrievedEvidence } from "@/lib/types";

type EvidencePanelProps = {
  hasForgotten: boolean;
  npcResponse: string;
  retrievedEvidence: RetrievedEvidence[];
  gameEffects: GameEffects | null;
};

export function EvidencePanel({
  hasForgotten,
  npcResponse,
  retrievedEvidence,
  gameEffects,
}: EvidencePanelProps) {
  return (
    <section className="panel panel-glow rounded-3xl p-6 shadow-panel">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.35em] text-amber-100/70">
          NPC Response / Retrieved Evidence
        </p>
        <h2 className="font-display mt-3 text-3xl text-parchment">
          Deer Guard Query
        </h2>
      </div>

      <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
        <p className="text-sm uppercase tracking-[0.25em] text-amber-100/70">
          Mock Response
        </p>
        <p className="mt-3 text-base leading-7 text-stone-200">{npcResponse}</p>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm uppercase tracking-[0.25em] text-amber-100/70">
            Retrieved Evidence
          </p>
          <span className="text-xs uppercase tracking-[0.25em] text-stone-400">
            {hasForgotten ? `${retrievedEvidence.length} memories matched` : "Awaiting query"}
          </span>
        </div>

        <div className="mt-4 space-y-4">
          {retrievedEvidence.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/15 p-5 text-sm text-stone-400">
              Jump forward in time after a choice to inspect what the guard can still
              retrieve.
            </div>
          ) : (
            retrievedEvidence.map((memory) => (
              <article
                key={memory.memoryId}
                className="rounded-3xl border border-white/10 bg-white/5 p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-stone-300">
                    {memory.sourceType}
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
            No downstream state shifts yet. Advance to Day 8 to inspect how retrieved
            memory changes the guard encounter.
          </p>
        )}
      </div>
    </section>
  );
}
