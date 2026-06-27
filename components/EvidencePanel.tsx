import { useState } from "react";
import {
  EvidenceSummary,
  NPCReaction as StructuredNpcReaction,
  RetrievedEvidence,
  RetrievalDebug,
  TrialPreviewItem,
} from "@/lib/types";

type EvidencePanelProps = {
  headline: string;
  overviewText: string;
  retrievedEvidence: RetrievedEvidence[];
  evidenceSource: "backend" | "local";
  reactionSource?: "backend" | "local" | null;
  evidenceDebug?: RetrievalDebug | null;
  reactionDebug?: RetrievalDebug | null;
  showDeveloperDetails?: boolean;
  collectedEvidence?: EvidenceSummary[];
  latestStructuredReaction?: StructuredNpcReaction | null;
  trialPreviewItems?: TrialPreviewItem[];
};

function excerpt(text: string, maxLength: number) {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

function SourceBadge({
  label,
  source,
  debug = null,
}: {
  label: string;
  source: "backend" | "local";
  debug?: RetrievalDebug | null;
}) {
  const toneClasses =
    source === "backend"
      ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-100"
      : "border-amber-300/25 bg-amber-400/10 text-amber-100";

  return (
    <div className={`rounded-[1.3rem] border px-3 py-3 ${toneClasses}`}>
      <p className="text-[10px] uppercase tracking-[0.3em]">{label}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.24em]">
        {source === "backend" ? "Backend" : "Local Fallback"}
      </p>
      {debug ? (
        <div className="mt-2 space-y-1 text-[10px] uppercase tracking-[0.2em] text-white/75">
          <div>candidate mode {debug.retrievalSource}</div>
          <div>candidate ids {debug.candidateCount ?? "n/a"}</div>
          <div>resolved rows {debug.resolvedCandidateCount ?? "n/a"}</div>
          <div>final results {debug.filteredEvidenceCount ?? "n/a"}</div>
        </div>
      ) : null}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <article className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
      <p className="text-[10px] uppercase tracking-[0.3em] text-amber-100/70">{label}</p>
      <p className="font-display mt-3 text-3xl text-parchment">{value}</p>
      {note ? <p className="mt-2 text-sm leading-6 text-stone-300">{note}</p> : null}
    </article>
  );
}

function EvidenceSpotlight({
  label,
  title,
  text,
  meta,
}: {
  label: string;
  title: string | null;
  text: string | null;
  meta: string | null;
}) {
  return (
    <article className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
      <p className="text-[10px] uppercase tracking-[0.3em] text-amber-100/70">{label}</p>
      {title && text ? (
        <>
          <h3 className="mt-3 text-base font-semibold text-white">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-stone-300">{excerpt(text, 150)}</p>
          {meta ? (
            <p className="mt-3 text-xs uppercase tracking-[0.24em] text-stone-400">{meta}</p>
          ) : null}
        </>
      ) : (
        <p className="mt-3 text-sm leading-6 text-stone-400">
          No strong evidence stands out yet.
        </p>
      )}
    </article>
  );
}

function StructuredReactionSummary({
  reaction,
}: {
  reaction: StructuredNpcReaction;
}) {
  return (
    <article className="rounded-[1.5rem] border border-emerald-200/15 bg-emerald-400/10 p-4">
      <p className="text-[10px] uppercase tracking-[0.3em] text-emerald-100/75">
        Latest NPC Reaction
      </p>
      <p className="mt-3 text-sm leading-7 text-stone-100">{reaction.dialogue}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-stone-300">
          tone {reaction.tone}
        </span>
        <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-stone-300">
          trust {reaction.trust_delta >= 0 ? "+" : ""}
          {reaction.trust_delta}
        </span>
        <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-stone-300">
          legal risk {reaction.legal_risk_delta >= 0 ? "+" : ""}
          {reaction.legal_risk_delta}
        </span>
      </div>
    </article>
  );
}

export function EvidencePanel({
  headline,
  overviewText,
  retrievedEvidence,
  evidenceSource,
  reactionSource = null,
  evidenceDebug = null,
  reactionDebug = null,
  showDeveloperDetails = false,
  collectedEvidence = [],
  latestStructuredReaction = null,
  trialPreviewItems = [],
}: EvidencePanelProps) {
  const [showArchive, setShowArchive] = useState(false);

  const newestEvidence =
    [...retrievedEvidence].sort((left, right) => {
      const dayDelta = right.metadata.day - left.metadata.day;
      if (dayDelta !== 0) {
        return dayDelta;
      }

      return right.reliability - left.reliability;
    })[0] ?? null;
  const strongestEvidence =
    [...retrievedEvidence].sort((left, right) => right.reliability - left.reliability)[0] ?? null;
  const strongestStructuredEvidence =
    [...collectedEvidence].sort((left, right) => right.reliability - left.reliability)[0] ?? null;

  return (
    <section className="space-y-4">
      <article className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
        <p className="text-[10px] uppercase tracking-[0.3em] text-amber-100/70">Overview</p>
        <h3 className="font-display mt-3 text-3xl text-parchment">{headline}</h3>
        <p className="mt-3 text-sm leading-7 text-stone-200">{overviewText}</p>
      </article>

      <div className="grid gap-3 sm:grid-cols-2">
        <SummaryCard
          label="Retrieved"
          value={`${retrievedEvidence.length}`}
          note="Active evidence in the current stack."
        />
        <SummaryCard
          label="Structured"
          value={`${collectedEvidence.length}`}
          note="NPC evidence summaries collected so far."
        />
      </div>

      <EvidenceSpotlight
        label="Newest Evidence"
        title={newestEvidence?.title ?? null}
        text={newestEvidence?.text ?? null}
        meta={
          newestEvidence
            ? `Day ${newestEvidence.metadata.day} • ${newestEvidence.metadata.location}`
            : null
        }
      />
      <EvidenceSpotlight
        label="Strongest Evidence"
        title={strongestEvidence?.title ?? strongestStructuredEvidence?.title ?? null}
        text={
          strongestEvidence?.text ??
          (strongestStructuredEvidence
            ? `Reliability ${Math.round(strongestStructuredEvidence.reliability * 100)}% • relevance ${Math.round(strongestStructuredEvidence.relevance * 100)}%.`
            : null)
        }
        meta={
          strongestEvidence
            ? `Reliability ${Math.round(strongestEvidence.reliability * 100)}%`
            : strongestStructuredEvidence
              ? strongestStructuredEvidence.type
              : null
        }
      />

      {latestStructuredReaction ? (
        <StructuredReactionSummary reaction={latestStructuredReaction} />
      ) : null}

      <button
        type="button"
        onClick={() => setShowArchive((previous) => !previous)}
        className="text-xs uppercase tracking-[0.3em] text-amber-100/75 transition hover:text-amber-50"
      >
        {showArchive ? "Hide Evidence Archive" : "View Evidence Archive"}
      </button>

      {showArchive ? (
        <div className="space-y-4">
          {showDeveloperDetails ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <SourceBadge
                label="Evidence Source"
                source={evidenceSource}
                debug={evidenceSource === "backend" ? evidenceDebug : null}
              />
              {reactionSource ? (
                <SourceBadge
                  label="Reaction Source"
                  source={reactionSource}
                  debug={reactionSource === "backend" ? reactionDebug : null}
                />
              ) : null}
            </div>
          ) : null}

          <div className="space-y-3">
            {retrievedEvidence.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-white/15 p-4 text-sm leading-6 text-stone-400">
                No evidence is active yet.
              </div>
            ) : (
              retrievedEvidence.map((memory) => (
                <article
                  key={memory.memoryId}
                  className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-stone-300">
                      {memory.sourceType.replace("_", " ")}
                    </span>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-stone-300">
                      reliability {Math.round(memory.reliability * 100)}%
                    </span>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-stone-300">
                      {memory.visibility}
                    </span>
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-white">{memory.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-stone-300">{memory.text}</p>
                  <p className="mt-3 text-xs uppercase tracking-[0.24em] text-stone-400">
                    Day {memory.metadata.day} • {memory.metadata.location}
                  </p>
                </article>
              ))
            )}
          </div>

          <div className="space-y-3">
            {collectedEvidence.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-white/15 p-4 text-sm leading-6 text-stone-400">
                No structured evidence collected from NPC reactions yet.
              </div>
            ) : (
              collectedEvidence.map((item) => {
                const preview = trialPreviewItems.find(
                  (previewItem) => previewItem.memory_id === item.memory_id
                );

                return (
                  <article
                    key={item.memory_id}
                    className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-stone-300">
                        {item.type}
                      </span>
                      <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-stone-300">
                        reliability {Math.round(item.reliability * 100)}%
                      </span>
                      <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-stone-300">
                        relevance {Math.round(item.relevance * 100)}%
                      </span>
                    </div>
                    <h3 className="mt-3 text-base font-semibold text-white">{item.title}</h3>
                    <p className="mt-3 text-xs uppercase tracking-[0.24em] text-stone-400">
                      {item.memory_id}
                    </p>
                    {preview ? (
                      <p className="mt-2 text-sm leading-6 text-stone-300">{preview.label}</p>
                    ) : null}
                  </article>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
