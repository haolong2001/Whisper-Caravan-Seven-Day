import { useState } from "react";
import { CollapseCheckpoint, MemoryCollapsePreview, MemoryItem } from "@/lib/types";

type MemoryPanelProps = {
  memories: MemoryItem[];
  activeCount: number;
  expiredCount: number;
  preview?: MemoryCollapsePreview | null;
  checkpoint?: CollapseCheckpoint | null;
};

const typeStyles: Record<MemoryItem["type"], string> = {
  short_term: "border-sky-300/25 bg-sky-400/10 text-sky-100",
  record: "border-rose-300/25 bg-rose-400/10 text-rose-100",
  contract: "border-violet-300/25 bg-violet-400/10 text-violet-100",
  song: "border-emerald-300/25 bg-emerald-400/10 text-emerald-100",
  rumor: "border-orange-300/25 bg-orange-400/10 text-orange-100",
};

function excerpt(text: string, maxLength: number) {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

function MemorySpotlight({
  label,
  memory,
  fallback,
}: {
  label: string;
  memory: MemoryItem | null;
  fallback: string;
}) {
  return (
    <article className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
      <p className="text-[10px] uppercase tracking-[0.3em] text-amber-100/70">{label}</p>
      {memory ? (
        <>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.28em] ${typeStyles[memory.type]}`}
            >
              {memory.type.replace("_", " ")}
            </span>
            <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-stone-300">
              Day {memory.createdDay}
            </span>
            {memory.expiresOn ? (
              <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-stone-300">
                Fades Day {memory.expiresOn}
              </span>
            ) : null}
          </div>
          <h3 className="mt-3 text-base font-semibold text-white">{memory.title}</h3>
          <p className="mt-2 text-sm leading-6 text-stone-300">{excerpt(memory.text, 140)}</p>
        </>
      ) : (
        <p className="mt-3 text-sm leading-6 text-stone-400">{fallback}</p>
      )}
    </article>
  );
}

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
    <div className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
      <p className="text-sm uppercase tracking-[0.25em] text-amber-100/70">{title}</p>
      <div className="mt-3 space-y-3">
        {items.length === 0 ? (
          <p className="text-sm leading-6 text-stone-400">{emptyText}</p>
        ) : (
          items.map((item) => (
            <article
              key={item.id}
              className="rounded-[1.2rem] border border-white/10 bg-white/5 p-3"
            >
              <h3 className="text-sm font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-stone-300">{excerpt(item.text, 120)}</p>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

export function MemoryPanel({
  memories,
  activeCount,
  expiredCount,
  preview = null,
  checkpoint = null,
}: MemoryPanelProps) {
  const [showArchive, setShowArchive] = useState(false);
  const activeMemories = memories.filter((memory) => memory.active);
  const latestMemory = [...memories].sort((left, right) => right.createdDay - left.createdDay)[0] ?? null;
  const fadingSoonMemory =
    [...activeMemories]
      .filter((memory) => typeof memory.expiresOn === "number")
      .sort((left, right) => (left.expiresOn ?? Number.MAX_SAFE_INTEGER) - (right.expiresOn ?? Number.MAX_SAFE_INTEGER))[0] ?? null;

  return (
    <section className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <article className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
          <p className="text-[10px] uppercase tracking-[0.3em] text-amber-100/70">Active</p>
          <p className="font-display mt-3 text-4xl text-parchment">{activeCount}</p>
        </article>
        <article className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
          <p className="text-[10px] uppercase tracking-[0.3em] text-amber-100/70">Expired</p>
          <p className="font-display mt-3 text-4xl text-parchment">{expiredCount}</p>
        </article>
      </div>

      {preview ? (
        <article className="rounded-[1.5rem] border border-amber-200/15 bg-amber-200/10 p-4">
          <p className="text-[10px] uppercase tracking-[0.3em] text-amber-100/75">
            Collapse Near
          </p>
          <h3 className="mt-2 text-lg font-semibold text-white">
            {checkpoint?.title ?? "Memory Collapse"}
          </h3>
          <p className="mt-2 text-sm leading-6 text-stone-200">
            {preview.expiringOnNextDay.length} traces may fade when Day{" "}
            {checkpoint?.nextDay ?? "?"} begins.
          </p>
        </article>
      ) : null}

      <MemorySpotlight
        label="Latest Memory"
        memory={latestMemory}
        fallback="No memories have been written into the caravan's trail yet."
      />
      <MemorySpotlight
        label="Fading Soon"
        memory={fadingSoonMemory}
        fallback="No active short-term memory is close to fading."
      />

      <button
        type="button"
        onClick={() => setShowArchive((previous) => !previous)}
        className="text-xs uppercase tracking-[0.3em] text-amber-100/75 transition hover:text-amber-50"
      >
        {showArchive ? "Hide Memory Archive" : "View Memory Archive"}
      </button>

      {showArchive ? (
        <div className="space-y-4">
          {preview ? (
            <div className="space-y-4">
              <MiniMemoryList
                title={`Will Expire on Day ${checkpoint?.nextDay ?? "?"}`}
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
          ) : null}

          <div className="space-y-3">
            {memories.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-white/15 p-4 text-sm leading-6 text-stone-400">
                No memories captured yet.
              </div>
            ) : (
              memories.map((memory) => (
                <article
                  key={memory.id}
                  className={`rounded-[1.5rem] border p-4 ${
                    memory.active
                      ? "border-white/10 bg-white/5"
                      : "border-white/10 bg-black/20 opacity-65"
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
                  </div>

                  <h3 className="mt-3 text-base font-semibold text-white">{memory.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-stone-300">{memory.text}</p>
                  <p className="mt-3 text-xs uppercase tracking-[0.24em] text-stone-400">
                    Day {memory.createdDay}
                    {memory.expiresOn ? ` • fades Day ${memory.expiresOn}` : " • persistent"}
                    {` • ${memory.location}`}
                  </p>
                </article>
              ))
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
