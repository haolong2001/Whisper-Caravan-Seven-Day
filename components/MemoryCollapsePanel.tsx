import { MemoryCollapsePreview } from "@/lib/types";

type MemoryCollapsePanelProps = {
  preview: MemoryCollapsePreview;
};

function MiniMemoryList({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: Array<{ id: string; title: string; text: string }>;
  emptyText: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
      <p className="text-sm uppercase tracking-[0.25em] text-amber-100/70">{title}</p>
      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-stone-400">{emptyText}</p>
        ) : (
          items.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-4"
            >
              <h3 className="text-base font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-stone-300">{item.text}</p>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

export function MemoryCollapsePanel({ preview }: MemoryCollapsePanelProps) {
  return (
    <section className="panel panel-glow rounded-3xl p-6 shadow-panel">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.35em] text-amber-100/70">
          Memory Collapse View
        </p>
        <h2 className="font-display mt-3 text-3xl text-parchment">
          Night Before Day 8
        </h2>
        <p className="mt-2 text-sm leading-6 text-stone-300">
          These are the traces about to cross the seven-day boundary. Only public
          evidence and newer private memories remain active after dawn.
        </p>
      </div>

      <div className="space-y-4">
        <MiniMemoryList
          title="Will Expire on Day 8"
          items={preview.expiringOnNextDay}
          emptyText="No short-term memories are set to expire at dawn."
        />
        <MiniMemoryList
          title="Will Persist"
          items={preview.persistingMemories}
          emptyText="Nothing remains beyond the collapse boundary."
        />
        <MiniMemoryList
          title="Public Evidence Still Active"
          items={preview.persistentPublicEvidence.map((item) => ({
            id: item.memoryId,
            title: item.title,
            text: item.text,
          }))}
          emptyText="No public record, contract, song, or rumor survives into Day 8."
        />
      </div>
    </section>
  );
}
