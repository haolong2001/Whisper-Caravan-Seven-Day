import { MemoryItem } from "@/lib/types";

type MemoryPanelProps = {
  memories: MemoryItem[];
  activeCount: number;
  expiredCount: number;
};

const typeStyles: Record<MemoryItem["type"], string> = {
  short_term: "border-sky-300/25 bg-sky-400/10 text-sky-100",
  record: "border-rose-300/25 bg-rose-400/10 text-rose-100",
  contract: "border-violet-300/25 bg-violet-400/10 text-violet-100",
  song: "border-emerald-300/25 bg-emerald-400/10 text-emerald-100",
  rumor: "border-orange-300/25 bg-orange-400/10 text-orange-100",
};

export function MemoryPanel({ memories, activeCount, expiredCount }: MemoryPanelProps) {
  return (
    <section className="panel panel-glow rounded-3xl p-6 shadow-panel">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.35em] text-amber-100/70">
          Memory Inspector
        </p>
        <div className="mt-3 flex items-end justify-between gap-3">
          <h2 className="font-display text-3xl text-parchment">Memory Stack</h2>
          <div className="text-right text-xs uppercase tracking-[0.25em] text-stone-400">
            <div>{activeCount} active</div>
            <div className="mt-1">{expiredCount} expired</div>
          </div>
        </div>
        <p className="mt-2 text-sm leading-6 text-stone-300">
          Short-term memories expire seven days after creation. Records, contracts,
          songs, rumors, and fresher witness traces may still matter on Day 8
          depending on who is allowed to know them.
        </p>
      </div>

      <div className="space-y-4">
        {memories.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/15 p-5 text-sm text-stone-400">
            No memories captured yet. Each day choice can write new traces into the
            caravan's world-state.
          </div>
        ) : (
          memories.map((memory) => (
            <article
              key={memory.id}
              className={`rounded-3xl border p-4 transition ${
                memory.active
                  ? "border-white/10 bg-white/5"
                  : "border-white/10 bg-black/20 opacity-60"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.28em] ${typeStyles[memory.type]}`}
                >
                  {memory.type.replace("_", " ")}
                </span>
                <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-stone-300">
                  {memory.visibility}
                </span>
                <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-stone-300">
                  {memory.active ? "active" : "expired"}
                </span>
                <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-stone-300">
                  {memory.evidenceRole}
                </span>
              </div>

              <h3 className="mt-4 text-lg font-semibold text-white">{memory.title}</h3>
              <p className="mt-2 text-sm leading-6 text-stone-300">{memory.text}</p>

              <dl className="mt-4 grid gap-3 text-sm text-stone-300 sm:grid-cols-2">
                <div>
                  <dt className="text-xs uppercase tracking-[0.28em] text-stone-500">
                    Created
                  </dt>
                  <dd className="mt-1">Day {memory.createdDay}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.28em] text-stone-500">
                    Expiration
                  </dt>
                  <dd className="mt-1">
                    {memory.expiresOn ? `Day ${memory.expiresOn}` : "Persistent"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.28em] text-stone-500">
                    Scope
                  </dt>
                  <dd className="mt-1">{memory.location}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.28em] text-stone-500">
                    Reliability
                  </dt>
                  <dd className="mt-1">{Math.round(memory.reliability * 100)}%</dd>
                </div>
              </dl>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
