import {
  EvaluatedEvidence,
  NpcReaction,
  RetrievedEvidence,
  RetrievalDebug,
} from "@/lib/types";

type EvidencePanelProps = {
  headline: string;
  overviewText: string;
  retrievedEvidence: RetrievedEvidence[];
  npcReactions?: NpcReaction[] | null;
  evidenceSource: "backend" | "local";
  reactionSource?: "backend" | "local" | null;
  evidenceDebug?: RetrievalDebug | null;
  reactionDebug?: RetrievalDebug | null;
};

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
    <div className={`rounded-2xl border px-3 py-2 ${toneClasses}`}>
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
                  {memory.sourceType.replace("_", " ")}
                </span>
                <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-stone-300">
                  {memory.visibility}
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
              <dl className="mt-4 grid gap-3 text-sm text-stone-300 sm:grid-cols-2">
                <div>
                  <dt className="text-xs uppercase tracking-[0.28em] text-stone-500">Source</dt>
                  <dd className="mt-1">{memory.metadata.source}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.28em] text-stone-500">Day</dt>
                  <dd className="mt-1">Day {memory.metadata.day}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.28em] text-stone-500">
                    Location
                  </dt>
                  <dd className="mt-1">{memory.metadata.location}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.28em] text-stone-500">
                    Active
                  </dt>
                  <dd className="mt-1">{memory.metadata.active ? "true" : "false"}</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs uppercase tracking-[0.25em] text-stone-500">
                tags {memory.metadata.tags.join(" / ")}
              </p>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

function JudgmentList({
  title,
  evidence,
  emptyText,
  tone,
}: {
  title: string;
  evidence: EvaluatedEvidence[];
  emptyText: string;
  tone: "accepted" | "rejected";
}) {
  const toneClasses =
    tone === "accepted"
      ? "border-emerald-300/20 bg-emerald-400/10"
      : "border-rose-300/20 bg-rose-400/10";
  const badgeClasses =
    tone === "accepted"
      ? "border-emerald-200/20 text-emerald-100"
      : "border-rose-200/20 text-rose-100";

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p
          className={`text-xs uppercase tracking-[0.25em] ${
            tone === "accepted" ? "text-emerald-200/70" : "text-rose-200/70"
          }`}
        >
          {title}
        </p>
        <span className="text-xs uppercase tracking-[0.25em] text-stone-400">
          {evidence.length} items
        </span>
      </div>

      <div className="mt-3 space-y-3">
        {evidence.length === 0 ? (
          <p className="text-sm text-stone-400">{emptyText}</p>
        ) : (
          evidence.map((item) => (
            <article
              key={`${tone}-${item.memoryId}`}
              className={`rounded-2xl border p-4 ${toneClasses}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.28em] ${badgeClasses}`}
                >
                  {item.sourceType.replace("_", " ")}
                </span>
                <span
                  className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.28em] ${badgeClasses}`}
                >
                  {item.visibility}
                </span>
                <span
                  className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.28em] ${badgeClasses}`}
                >
                  {item.evidenceRole}
                </span>
                <span
                  className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.28em] ${badgeClasses}`}
                >
                  reliability {Math.round(item.reliability * 100)}%
                </span>
              </div>
              <h3 className="mt-3 text-base font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-stone-300">{item.text}</p>
              <dl className="mt-4 grid gap-3 text-sm text-stone-300 sm:grid-cols-2">
                <div>
                  <dt className="text-xs uppercase tracking-[0.28em] text-stone-500">Source</dt>
                  <dd className="mt-1">{item.metadata.source}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.28em] text-stone-500">Day</dt>
                  <dd className="mt-1">Day {item.metadata.day}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.28em] text-stone-500">
                    Location
                  </dt>
                  <dd className="mt-1">{item.metadata.location}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.28em] text-stone-500">
                    Active
                  </dt>
                  <dd className="mt-1">{item.metadata.active ? "true" : "false"}</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs uppercase tracking-[0.25em] text-stone-500">
                tags {item.metadata.tags.join(" / ")}
              </p>
              <p className="mt-3 text-sm leading-6 text-stone-200">{item.decisionReason}</p>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

function NpcReactionCard({ reaction }: { reaction: NpcReaction }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-black/20 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-amber-100/60">
            {reaction.profile.faction}
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-white">{reaction.profile.name}</h3>
        </div>
        <div className="text-right text-xs uppercase tracking-[0.25em] text-stone-400">
          <div>min reliability {Math.round(reaction.profile.minReliability * 100)}%</div>
          <div className="mt-1">
            scopes {reaction.profile.visibleMemoryScopes.join(" / ")}
          </div>
        </div>
      </div>

      <p className="mt-4 text-sm leading-7 text-stone-200">{reaction.dialogue}</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <JudgmentList
          title="Accepted Evidence"
          evidence={reaction.acceptedEvidence}
          emptyText="This NPC accepts nothing from the active memory stack."
          tone="accepted"
        />
        <JudgmentList
          title="Rejected Evidence"
          evidence={reaction.rejectedEvidence}
          emptyText="This NPC rejects nothing from the active memory stack."
          tone="rejected"
        />
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs uppercase tracking-[0.25em] text-amber-100/70">
          Reaction Effects
        </p>
        <dl className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-[0.28em] text-stone-500">
              trustDelta
            </dt>
            <dd className="mt-1 text-xl font-semibold text-white">
              {reaction.effects.trustDelta}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.28em] text-stone-500">
              priceModifier
            </dt>
            <dd className="mt-1 text-xl font-semibold text-white">
              x{reaction.effects.priceModifier.toFixed(2)}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.28em] text-stone-500">
              questAvailable
            </dt>
            <dd className="mt-1 text-xl font-semibold text-white">
              {reaction.effects.questAvailable ? "true" : "false"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.28em] text-stone-500">
              legalRiskDelta
            </dt>
            <dd className="mt-1 text-xl font-semibold text-white">
              {reaction.effects.legalRiskDelta}
            </dd>
          </div>
        </dl>
      </div>
    </article>
  );
}

export function EvidencePanel({
  headline,
  overviewText,
  retrievedEvidence,
  npcReactions = null,
  evidenceSource,
  reactionSource = null,
  evidenceDebug = null,
  reactionDebug = null,
}: EvidencePanelProps) {
  return (
    <section className="panel panel-glow rounded-3xl p-6 shadow-panel">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.35em] text-amber-100/70">
          NPC Access / Retrieved Evidence
        </p>
        <h2 className="font-display mt-3 text-3xl text-parchment">{headline}</h2>
      </div>

      <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-amber-100/70">Overview</p>
            <p className="mt-3 text-base leading-7 text-stone-200">{overviewText}</p>
          </div>
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
        </div>
      </div>

      <EvidenceList
        title={npcReactions ? "Active Memory Evidence" : "Retrieved Evidence"}
        evidence={retrievedEvidence}
        emptyText="No evidence is active yet."
      />

      {npcReactions ? (
        <div className="mt-6 space-y-5">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-amber-100/70">
              Day 8 NPC Reactions
            </p>
            <p className="mt-2 text-sm leading-6 text-stone-300">
              Each NPC applies its own visibility, type, and reliability rules to the
              same active memory stack.
            </p>
          </div>
          {npcReactions.map((reaction) => (
            <NpcReactionCard key={reaction.profile.id} reaction={reaction} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
