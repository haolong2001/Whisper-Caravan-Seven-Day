import { CollapseCheckpoint, MemoryCollapsePreview } from "@/lib/types";

type MemoryCollapsePanelProps = {
  preview: MemoryCollapsePreview;
  checkpoint: CollapseCheckpoint | null;
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

export function MemoryCollapsePanel({ preview, checkpoint }: MemoryCollapsePanelProps) {
  const title = checkpoint?.title ?? "Memory Collapse";
  const description =
    checkpoint?.description ??
    "These are the traces about to cross the seven-day boundary. Only durable evidence and newer private memories remain active after the checkpoint.";
  const nextDayLabel = checkpoint?.nextDay ?? 0;

  return (
    <section className="panel panel-glow rounded-3xl p-6 shadow-panel">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.35em] text-amber-100/70">
          Memory Collapse View
        </p>
        <h2 className="font-display mt-3 text-3xl text-parchment">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-stone-300">{description}</p>
      </div>

      <div className="space-y-4">
        <MiniMemoryList
          title={`Will Expire on Day ${nextDayLabel}`}
          items={preview.expiringOnNextDay}
          emptyText="No short-term memories are set to expire at this checkpoint."
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
          emptyText="No public record, contract, song, or rumor survives into the next phase."
        />
      </div>
    </section>
  );
}
