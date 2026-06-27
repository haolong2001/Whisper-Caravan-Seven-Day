import {
  Choice,
  CollapseCheckpoint,
  EndingId,
  EndingOutcomeDefinition,
  FactionKey,
  FactionState,
  GameResources,
  GameState,
  MemoryEffect,
  NPCProfile,
  PhaseCard,
  StoryNpcId,
  StoryNpcProfile,
  StoryScene,
} from "@/lib/types";

function shortTermMemory(
  title: string,
  text: string,
  location: string,
  reliability: number,
  evidenceRole: MemoryEffect["evidenceRole"]
): MemoryEffect {
  return {
    title,
    text,
    type: "short_term",
    visibility: "private",
    location,
    reliability,
    evidenceRole,
  };
}

function publicRecord(
  title: string,
  text: string,
  location: string,
  reliability: number,
  evidenceRole: MemoryEffect["evidenceRole"]
): MemoryEffect {
  return {
    title,
    text,
    type: "record",
    visibility: "public",
    location,
    reliability,
    evidenceRole,
    persistent: true,
  };
}

function publicContract(
  title: string,
  text: string,
  location: string,
  reliability: number,
  evidenceRole: MemoryEffect["evidenceRole"]
): MemoryEffect {
  return {
    title,
    text,
    type: "contract",
    visibility: "public",
    location,
    reliability,
    evidenceRole,
    persistent: true,
  };
}

function publicSong(
  title: string,
  text: string,
  location: string,
  reliability: number,
  evidenceRole: MemoryEffect["evidenceRole"]
): MemoryEffect {
  return {
    title,
    text,
    type: "song",
    visibility: "public",
    location,
    reliability,
    evidenceRole,
    persistent: true,
  };
}

function publicRumor(
  title: string,
  text: string,
  location: string,
  reliability: number,
  evidenceRole: MemoryEffect["evidenceRole"]
): MemoryEffect {
  return {
    title,
    text,
    type: "rumor",
    visibility: "public",
    location,
    reliability,
    evidenceRole,
    persistent: true,
  };
}

function choice(config: Choice): Choice {
  return config;
}

function withStorySource(
  effect: MemoryEffect,
  {
    source,
    sourceNpcId,
    faction,
    tags,
  }: {
    source: string;
    sourceNpcId?: StoryNpcId;
    faction?: FactionKey;
    tags?: string[];
  }
): MemoryEffect {
  return {
    ...effect,
    source,
    sourceNpcId,
    faction,
    tags,
  };
}

export const initialSceneStatus =
  "Day 1 begins the fixed fourteen-card starter spine. Each day presents one major event card that can create evidence, shift factions, and change what survives the next collapse boundary.";

export const initialNpcResponse =
  "No retrieval query has fired yet. The v0.5 starter spine now follows one major event per day across two loops before Bear Court evaluates the surviving evidence.";

export const initialFactions: FactionState = {
  deerVillage: 0,
  refugees: 0,
  foxMarket: 0,
  crowBrokers: 0,
  bearCourt: 0,
};

export const initialResources: GameResources = {
  silver: 8,
  medicine: 0,
  provisions: 4,
  legalRisk: 0,
};

export function createInitialGameState(): GameState {
  return {
    phase: "loop_one",
    currentDay: 1,
    currentSceneIndex: 0,
    memories: [],
    factions: { ...initialFactions },
    resources: { ...initialResources },
    sceneChoices: {},
    sceneStatus: initialSceneStatus,
  };
}

export const initialGameState: GameState = createInitialGameState();

export const collapseCheckpoints: CollapseCheckpoint[] = [
  {
    phase: "collapse_one",
    day: 7,
    nextDay: 8,
    location: "Bear Court",
    title: "First Memory Collapse",
    description:
      "The first seven-day loop closes. Short-term traces from the opening week are about to cross the forgetting boundary before the caravan enters its second pass.",
  },
  {
    phase: "collapse_two",
    day: 14,
    nextDay: 15,
    location: "Bear Court",
    title: "Second Memory Collapse",
    description:
      "The second loop closes under Bear Court eyes. One more forgetting pass resolves what the trial can still hear as live evidence.",
  },
];

export const trialPlaceholder: PhaseCard = {
  phase: "trial",
  day: 15,
  location: "Bear Court",
  title: "Bear Court Trial",
  description:
    "Bear Court now weighs the surviving legal record, the failed witness traces, the rumor war around the caravan, and the risk left on the road.",
};

export const endingPlaceholder: PhaseCard = {
  phase: "ending",
  day: 15,
  location: "Bear Court",
  title: "Verdict Delivered",
  description:
    "The trial has resolved into one deterministic outcome for the current fourteen-day route.",
};

export const endingOutcomes: Record<EndingId, EndingOutcomeDefinition> = {
  A1: {
    id: "A1",
    route: "truth",
    title: "A1: Full Truth / Public Justice",
    verdictLabel: "Full Truth",
    summary: "Bear Court rejects the theft framing and opens a public inquiry.",
    text:
      "The Bear Judge rules that the medicine incident cannot be treated as ordinary theft. Records show that shipments were withheld under royal tax authority and redirected through Fox Market channels. The caravan's actions are judged necessary under emergency conditions.\n\nDeer Village withdraws the wanted notice, but the apology is formal and cold. Refugees sing openly in the court square. Fox Market loses face, yet its deeper networks remain difficult to uproot. The caravan leaves cleared, but not innocent in everyone's eyes.",
  },
  A2: {
    id: "A2",
    route: "truth",
    title: "A2: Partial Truth / Necessary Crime",
    verdictLabel: "Partial Truth",
    summary: "Bear Court accepts necessity, but the corruption chain remains incomplete.",
    text:
      "The court accepts that refugees needed medicine and that the village supply had been mishandled. However, the evidence does not fully prove the entire black market chain. The theft charge is reduced or amended rather than erased.\n\nThe caravan is allowed to continue under restrictions. Deer Village remains divided. Refugees remember the player as someone who acted when officials hesitated. Fox Market quietly survives the inquiry.",
  },
  B: {
    id: "B",
    route: "merchant",
    title: "B: Merchant Settlement",
    verdictLabel: "Merchant Settlement",
    summary: "The wanted case closes on paperwork, while Fox Market keeps the road.",
    text:
      "Fox Market produces clean books, sealed clauses, and a settlement agreement that gives Bear Court a procedural exit. The wanted notice is withdrawn or quietly archived. The caravan's name is usable again on trade roads.\n\nBy winter, medicine prices rise. Refugees learn that the caravan survived by signing papers with the very market that priced medicine beyond reach. The player is free, but the medicine road belongs more completely to Fox Market.",
  },
  C: {
    id: "C",
    route: "rumor",
    title: "C: Folk Hero / Rumor Victory",
    verdictLabel: "Folk Hero",
    summary: "The road remembers rescue, even while the court refuses clean vindication.",
    text:
      "Bear Court refuses full clearance. The official record remains cautious, and Deer Village still speaks of stolen medicine. But the road tells a different story.\n\nRefugees paint blue caravan wheels on shelter doors. Crow broadsides retell the fever nights until the wanted notice sounds incomplete. The player leaves court under watch, neither cleared nor condemned in the hearts of the people.",
  },
  D: {
    id: "D",
    route: "failure",
    title: "D: Guilty Exile",
    verdictLabel: "Guilty Exile",
    summary: "Bear Court finds no coherent defense and expels the caravan.",
    text:
      "The Bear Judge reads the surviving evidence: a wanted notice, a broken seal, a ledger gap, a false alibi, and songs that contradict one another. The court finds no reliable proof of necessity, no clean settlement, and no coherent defense.\n\nThe caravan is declared guilty of medicine theft and obstruction. Deer Village bars its gates. Refugee camps are warned not to shelter the caravan. Fox Market buys the abandoned routes before the dust settles.",
  },
};

export const storyNpcProfiles: StoryNpcProfile[] = [
  {
    id: "villageApothecary",
    name: "Village Apothecary",
    role: "Deer Village pharmacy witness",
    homeLocation: "Deer Village",
    faction: "deerVillage",
  },
  {
    id: "campHealer",
    name: "Camp Healer",
    role: "River Refugee Camp plague witness",
    homeLocation: "River Refugee Camp",
    faction: "refugees",
  },
  {
    id: "foxLedgerMaster",
    name: "Fox Ledger-Master",
    role: "Fox Market black-market merchant",
    homeLocation: "Fox Market",
    faction: "foxMarket",
  },
  {
    id: "royalTaxOfficer",
    name: "Royal Tax Officer",
    role: "Medicine seizure antagonist",
    homeLocation: "Bear Court",
    faction: "bearCourt",
  },
  {
    id: "crowBrokerNarrator",
    name: "Crow Broker",
    role: "Public narrative manipulator",
    homeLocation: "Fox Market",
    faction: "crowBrokers",
  },
  {
    id: "bearJudgeAuthority",
    name: "Bear Judge",
    role: "Bear Court legal authority",
    homeLocation: "Bear Court",
    faction: "bearCourt",
  },
];

export const npcProfiles: NPCProfile[] = [
  {
    id: "deerGuard",
    name: "Deer Guard",
    faction: "deerVillage",
    acceptedMemoryTypes: ["record", "short_term"],
    rejectedMemoryTypes: ["rumor"],
    visibleMemoryScopes: ["public"],
    minReliability: 0.65,
  },
  {
    id: "foxMerchant",
    name: "Fox Merchant",
    faction: "foxMarket",
    acceptedMemoryTypes: ["record", "contract", "rumor"],
    rejectedMemoryTypes: ["song"],
    visibleMemoryScopes: ["public", "private"],
    minReliability: 0.55,
  },
  {
    id: "crowBroker",
    name: "Crow Broker",
    faction: "crowBrokers",
    acceptedMemoryTypes: ["rumor", "song", "short_term"],
    rejectedMemoryTypes: [],
    visibleMemoryScopes: ["public", "private"],
    minReliability: 0.4,
  },
  {
    id: "bearJudge",
    name: "Bear Judge",
    faction: "bearCourt",
    acceptedMemoryTypes: ["record", "contract"],
    rejectedMemoryTypes: ["rumor", "song"],
    visibleMemoryScopes: ["public"],
    minReliability: 0.7,
  },
];

export const gameScenes: StoryScene[] = [
  {
    id: "deer-village-medicine-conflict",
    phase: "loop_one",
    day: 1,
    location: "Deer Village",
    title: "Deer Village Medicine Conflict",
    description:
      "Deer Village has sealed its medicine stock while refugee children burn with fever. A guard blocks the apothecary storeroom, and the caravan must choose whether to obey law, answer necessity, manipulate the record, or turn away.",
    involvedNpcIds: ["villageApothecary", "campHealer", "bearJudgeAuthority"],
    routeTags: ["truth", "merchant", "rumor", "failure"],
    choices: [
      choice({
        id: "A",
        label: "Buy the medicine legally",
        description:
          "Pay the full price and leave a clean public record.",
        outcomeText:
          "You secure the doses lawfully. The refugees still remember the delay, but the village cannot call the act simple theft.",
        memoryEffects: [
          withStorySource(
            publicRecord(
              "Apothecary Receipt",
              "The apothecary ledger records that a blue caravan paid full tariff for fever medicine.",
              "Deer Village records hall",
              0.94,
              "favorable"
            ),
            {
              source: "Village Apothecary Ledger",
              sourceNpcId: "villageApothecary",
              faction: "deerVillage",
              tags: ["starter-spine", "act-evidence", "necessity", "day-1"],
            }
          ),
        ],
        factionEffects: [
          { faction: "deerVillage", delta: 1 },
          { faction: "refugees", delta: 1 },
        ],
        resourceEffects: {
          silver: -3,
          medicine: 1,
        },
      }),
      choice({
        id: "B",
        label: "Steal the medicine to save refugees",
        description:
          "Break the storeroom seal and take the medicine before the fever worsens.",
        outcomeText:
          "The sick survive the night, but Deer Village frames the act as theft almost immediately.",
        memoryEffects: [
          withStorySource(
            shortTermMemory(
              "Deer Guard Saw the Theft",
              "A Deer Guard saw the caravan break the storeroom seal and flee with medicine crates.",
              "Deer Village witness memory",
              0.88,
              "incriminating"
            ),
            {
              source: "Deer Village Guard Witness",
              faction: "deerVillage",
              tags: ["starter-spine", "act-evidence", "witness", "day-1"],
            }
          ),
          withStorySource(
            publicRecord(
              "Wanted Notice",
              "A blue caravan is wanted for stealing medicine from Deer Village.",
              "Deer Village gate board",
              0.96,
              "incriminating"
            ),
            {
              source: "Deer Village Notice Board",
              faction: "deerVillage",
              tags: ["starter-spine", "wanted-notice", "act-evidence", "day-1"],
            }
          ),
          withStorySource(
            publicRecord(
              "Broken Storeroom Seal",
              "The storeroom seal was found split after the blue caravan left Deer Village with medicine crates.",
              "Deer Village storeroom file",
              0.9,
              "incriminating"
            ),
            {
              source: "Village Storeroom Registry",
              sourceNpcId: "villageApothecary",
              faction: "deerVillage",
              tags: ["starter-spine", "broken-seal", "act-evidence", "day-1"],
            }
          ),
          withStorySource(
            publicSong(
              "Refugee Song",
              "Refugees sing that the blue caravan carried medicine to fever tents before dawn.",
              "Roadside song network",
              0.68,
              "favorable"
            ),
            {
              source: "Refugee Songline",
              sourceNpcId: "campHealer",
              faction: "refugees",
              tags: ["starter-spine", "public-sympathy", "day-1"],
            }
          ),
        ],
        factionEffects: [
          { faction: "deerVillage", delta: -2 },
          { faction: "refugees", delta: 3 },
        ],
        resourceEffects: {
          medicine: 1,
          legalRisk: 2,
        },
      }),
      choice({
        id: "C",
        label: "Bribe the guard and blur the books",
        description:
          "Slip silver into the gate process and leave behind a distorted inventory trail.",
        outcomeText:
          "The medicine moves, but the record smells of tampering and the caravan leaves under a cloud.",
        memoryEffects: [
          withStorySource(
            publicRecord(
              "Tampered Storeroom Ledger",
              "The storeroom inventory no longer matches the official count after a blue caravan passed through.",
              "Deer Village records hall",
              0.74,
              "incriminating"
            ),
            {
              source: "Village Storeroom Ledger",
              sourceNpcId: "villageApothecary",
              faction: "deerVillage",
              tags: ["starter-spine", "contradiction", "day-1"],
            }
          ),
          withStorySource(
            publicRumor(
              "Whispered Bribe Story",
              "Stablehands whisper that the blue caravan paid silver to make the medicine count look cleaner than it was.",
              "Deer Village square",
              0.56,
              "incriminating"
            ),
            {
              source: "Village Stable Talk",
              faction: "deerVillage",
              tags: ["starter-spine", "legal-risk", "rumor", "day-1"],
            }
          ),
        ],
        factionEffects: [
          { faction: "deerVillage", delta: -1 },
          { faction: "refugees", delta: 2 },
        ],
        resourceEffects: {
          silver: -2,
          medicine: 1,
          legalRisk: 1,
        },
      }),
      choice({
        id: "D",
        label: "Walk away",
        description:
          "Leave the gate untouched and protect the caravan from immediate legal risk.",
        outcomeText:
          "No public accusation changes, but the refugees remember who chose distance over urgency.",
        memoryEffects: [
          withStorySource(
            shortTermMemory(
              "Quiet Aid Witness",
              "A camp healer remembers the caravan turning away while fever tents still needed medicine.",
              "River Refugee Camp healer memory",
              0.45,
              "neutral"
            ),
            {
              source: "Camp Healer Memory",
              sourceNpcId: "campHealer",
              faction: "refugees",
              tags: ["starter-spine", "necessity", "day-1"],
            }
          ),
        ],
        factionEffects: [{ faction: "refugees", delta: -2 }],
      }),
    ],
  },
  {
    id: "fever-at-river-camp",
    phase: "loop_one",
    day: 2,
    location: "River Refugee Camp",
    title: "Fever at River Camp",
    description:
      "The refugees who received or needed medicine ask whether the caravan wants public thanks, formal testimony, or silence while the fever still burns through the camp.",
    involvedNpcIds: ["campHealer", "crowBrokerNarrator"],
    routeTags: ["truth", "rumor"],
    choices: [
      choice({
        id: "A",
        label: "Record a formal treatment roster",
        description:
          "Put names, doses, and fever signs into a durable camp record.",
        outcomeText:
          "The camp healer turns necessity into something the court can someday read.",
        memoryEffects: [
          withStorySource(
            publicRecord(
              "Refugee Treatment Roster",
              "A formal camp roster records which refugees received medicine, when the fever struck, and who was treated by the caravan.",
              "River Refugee Camp registry",
              0.88,
              "favorable"
            ),
            {
              source: "Camp Healer Roster",
              sourceNpcId: "campHealer",
              faction: "refugees",
              tags: ["starter-spine", "necessity", "truth-route", "day-2"],
            }
          ),
        ],
        factionEffects: [
          { faction: "refugees", delta: 2 },
          { faction: "bearCourt", delta: 1 },
        ],
        resourceEffects: { medicine: -1 },
      }),
      choice({
        id: "B",
        label: "Treat refugees openly",
        description:
          "Treat the camp in daylight and let public memory form around the act.",
        outcomeText:
          "The camp answers with gratitude, and the road begins to remember the caravan more kindly than the wanted notice does.",
        memoryEffects: [
          withStorySource(
            publicSong(
              "Camp Healing Song",
              "Refugees sing that the blue caravan treated the fever tents in open sight while Deer Village still argued over blame.",
              "River Refugee Camp fire circles",
              0.76,
              "favorable"
            ),
            {
              source: "Camp Fire Chorus",
              sourceNpcId: "campHealer",
              faction: "refugees",
              tags: ["starter-spine", "public-sympathy", "rumor-route", "day-2"],
            }
          ),
        ],
        factionEffects: [{ faction: "refugees", delta: 2 }],
        resourceEffects: {
          medicine: -1,
          provisions: -1,
        },
      }),
      choice({
        id: "C",
        label: "Keep the treatment secret",
        description:
          "Help quietly and trust memory to stay local until something stronger can preserve it.",
        outcomeText:
          "The camp healer remembers the choice, but nothing public stands up to the wanted notice yet.",
        memoryEffects: [
          withStorySource(
            shortTermMemory(
              "Quiet Aid Witness",
              "A camp healer privately remembers that the blue caravan treated fever victims while asking the camp to stay quiet.",
              "River Refugee Camp healer memory",
              0.67,
              "favorable"
            ),
            {
              source: "Camp Healer Memory",
              sourceNpcId: "campHealer",
              faction: "refugees",
              tags: ["starter-spine", "short-term", "day-2"],
            }
          ),
        ],
        factionEffects: [{ faction: "refugees", delta: 1 }],
        resourceEffects: { medicine: -1 },
      }),
      choice({
        id: "D",
        label: "Demand labor for aid",
        description:
          "Tie medical help to labor and let necessity curdle into a story about leverage.",
        outcomeText:
          "The camp accepts because it must, but public gratitude gives way to a harder rumor by nightfall.",
        memoryEffects: [
          withStorySource(
            publicRumor(
              "Work-for-Medicine Story",
              "Boatmen say the blue caravan demanded labor before it would part with fever medicine.",
              "River Refugee Camp ferry line",
              0.6,
              "incriminating"
            ),
            {
              source: "Ferry Line Gossip",
              faction: "refugees",
              tags: ["starter-spine", "contradiction", "day-2"],
            }
          ),
        ],
        factionEffects: [
          { faction: "refugees", delta: -1 },
          { faction: "foxMarket", delta: 1 },
        ],
      }),
    ],
  },
  {
    id: "tax-seal-on-the-crates",
    phase: "loop_one",
    day: 3,
    location: "River Refugee Camp",
    title: "Tax Seal on the Crates",
    description:
      "One medicine crate bears a royal tax seal dated before the alleged theft. The seal suggests shipments were held by tax authority before Deer Village named the caravan as thief.",
    involvedNpcIds: ["campHealer", "royalTaxOfficer", "foxLedgerMaster"],
    routeTags: ["truth"],
    choices: [
      choice({
        id: "A",
        label: "Copy the seal in front of witnesses",
        description:
          "Make the dated seal public before anyone can make it disappear.",
        outcomeText:
          "A dated copy enters the world with witnesses attached, tying the medicine shortage to tax authority rather than simple loss.",
        memoryEffects: [
          withStorySource(
            publicRecord(
              "Royal Tax Seal Copy",
              "Witnesses copy a royal tax seal from a medicine crate that was dated before the Deer Village accusation.",
              "River Refugee Camp crate table",
              0.86,
              "favorable"
            ),
            {
              source: "Crate Seal Copy",
              sourceNpcId: "campHealer",
              faction: "bearCourt",
              tags: ["starter-spine", "system-evidence", "truth-route", "day-3"],
            }
          ),
          withStorySource(
            publicRecord(
              "Crate Seal Date Mismatch",
              "The copied seal date proves the medicine crate was already under royal tax control before Deer Village posted the theft charge.",
              "River Refugee Camp crate table",
              0.84,
              "favorable"
            ),
            {
              source: "Seal Date Copy",
              sourceNpcId: "campHealer",
              faction: "bearCourt",
              tags: ["starter-spine", "system-evidence", "timeline-evidence", "day-3"],
            }
          ),
        ],
        factionEffects: [{ faction: "bearCourt", delta: 1 }],
      }),
      choice({
        id: "B",
        label: "Steal the original seal tag",
        description:
          "Take the strongest proof for yourself and accept the risk of how you got it.",
        outcomeText:
          "You gain a stronger clue, but the method invites suspicion if the tag cannot be authenticated cleanly later.",
        memoryEffects: [
          withStorySource(
            publicRecord(
              "Stolen Seal Tag",
              "The caravan carries away an original royal seal tag taken from a medicine crate under suspicious circumstances.",
              "River Refugee Camp hidden satchel",
              0.73,
              "neutral"
            ),
            {
              source: "Stolen Crate Tag",
              sourceNpcId: "royalTaxOfficer",
              faction: "bearCourt",
              tags: ["starter-spine", "system-evidence", "legal-risk", "day-3"],
            }
          ),
        ],
        factionEffects: [{ faction: "bearCourt", delta: -1 }],
        resourceEffects: { legalRisk: 1 },
      }),
      choice({
        id: "C",
        label: "Sell the clue to Fox Market",
        description:
          "Let Fox Market decide whether the dated seal is worth silence or leverage.",
        outcomeText:
          "The market shows immediate interest, and the clue begins to circulate as trade information rather than public proof.",
        memoryEffects: [
          withStorySource(
            publicRumor(
              "Fox Buyer Interest",
              "Fox Market buyers suddenly take interest in dated medicine crates linked to Deer Village and tax authority.",
              "Fox Market whisper chain",
              0.62,
              "neutral"
            ),
            {
              source: "Fox Market Whisper Chain",
              sourceNpcId: "foxLedgerMaster",
              faction: "foxMarket",
              tags: ["starter-spine", "merchant-route", "day-3"],
            }
          ),
        ],
        factionEffects: [{ faction: "foxMarket", delta: 1 }],
        resourceEffects: { silver: 1 },
      }),
      choice({
        id: "D",
        label: "Ignore the seal",
        description:
          "Avoid the risk and keep moving without turning the crate into evidence.",
        outcomeText:
          "The clue stays where it was, and only a fragile memory remains that the caravan chose not to press the point.",
        memoryEffects: [
          withStorySource(
            shortTermMemory(
              "Ignored Seal Trace",
              "A caravan witness remembers finding a royal tax seal on the crates and choosing not to turn it into public proof.",
              "River Refugee Camp wagon memory",
              0.48,
              "neutral"
            ),
            {
              source: "Caravan Witness Trace",
              tags: ["starter-spine", "short-term", "day-3"],
            }
          ),
        ],
        factionEffects: [],
      }),
    ],
  },
  {
    id: "fox-ledger-offer",
    phase: "loop_one",
    day: 4,
    location: "Fox Market",
    title: "Fox Ledger Offer",
    description:
      "A Fox ledger-master offers to edit the caravan’s route history. The same books may also expose how medicine was controlled and resold through the market.",
    involvedNpcIds: ["foxLedgerMaster"],
    routeTags: ["merchant", "truth", "failure"],
    choices: [
      choice({
        id: "A",
        label: "Pay to clean the route ledger",
        description:
          "Buy procedural safety and leave with paperwork that looks tidy enough to survive scrutiny.",
        outcomeText:
          "Fox Market makes the route look cleaner than it felt on the road.",
        memoryEffects: [
          withStorySource(
            publicRecord(
              "Clean-Looking Route Ledger",
              "A Fox Market ledger presents the blue caravan’s route as orderly, taxed, and procedurally complete.",
              "Fox Market counting house",
              0.82,
              "favorable"
            ),
            {
              source: "Fox Ledger-Master Copy",
              sourceNpcId: "foxLedgerMaster",
              faction: "foxMarket",
              tags: ["starter-spine", "merchant-route", "day-4"],
            }
          ),
        ],
        factionEffects: [{ faction: "foxMarket", delta: 2 }],
        resourceEffects: { silver: -1 },
      }),
      choice({
        id: "B",
        label: "Demand to inspect the medicine stock columns",
        description:
          "Trade safety for the chance to expose how the market controlled medicine flow.",
        outcomeText:
          "The ledger-master yields just enough of the medicine column to reveal a pattern that does not fit the public theft story.",
        memoryEffects: [
          withStorySource(
            publicRecord(
              "Fox Medicine Stock Ledger",
              "A Fox Market stock column shows medicine held back, relabeled, and repriced during the shortage.",
              "Fox Market medicine columns",
              0.86,
              "favorable"
            ),
            {
              source: "Fox Stock Column Copy",
              sourceNpcId: "foxLedgerMaster",
              faction: "foxMarket",
              tags: ["starter-spine", "system-evidence", "truth-route", "day-4"],
            }
          ),
        ],
        factionEffects: [
          { faction: "foxMarket", delta: -1 },
          { faction: "bearCourt", delta: 1 },
        ],
      }),
      choice({
        id: "C",
        label: "Accept a suspicious partial edit",
        description:
          "Take the market’s help even though the revised book carries visible edges.",
        outcomeText:
          "The route looks cleaner at first glance, but the partial edit leaves behind a gap that can harden into evidence.",
        memoryEffects: [
          withStorySource(
            publicRecord(
              "Ledger Discrepancy",
              "A Fox Market ledger carries a broken sequence around the blue caravan’s stamp.",
              "Fox Market counting house",
              0.83,
              "incriminating"
            ),
            {
              source: "Fox Ledger Gap",
              sourceNpcId: "foxLedgerMaster",
              faction: "foxMarket",
              tags: ["starter-spine", "contradiction", "day-4"],
            }
          ),
        ],
        factionEffects: [{ faction: "foxMarket", delta: 1 }],
        resourceEffects: { legalRisk: 1 },
      }),
      choice({
        id: "D",
        label: "Refuse the offer",
        description:
          "Leave the books untouched and keep your hands clean of Fox Market edits.",
        outcomeText:
          "The ledger-master marks the caravan as wary, and the market keeps its deeper columns shut.",
        memoryEffects: [
          withStorySource(
            publicContract(
              "Black Market Debt Note",
              "Fox Market records a quiet debt marker against the blue caravan for refusing its settlement terms.",
              "Fox Market debt slip",
              0.71,
              "neutral"
            ),
            {
              source: "Fox Debt Marker",
              sourceNpcId: "foxLedgerMaster",
              faction: "foxMarket",
              tags: ["starter-spine", "merchant-route", "legal-risk", "day-4"],
            }
          ),
        ],
        factionEffects: [{ faction: "foxMarket", delta: -1 }],
      }),
    ],
  },
  {
    id: "crow-relay-framing",
    phase: "loop_one",
    day: 5,
    location: "Fox Market",
    title: "Crow Relay Framing",
    description:
      "Crow couriers offer to spread one version of the medicine story before the wanted notice hardens into common truth.",
    involvedNpcIds: ["crowBrokerNarrator", "royalTaxOfficer"],
    routeTags: ["rumor", "truth", "failure"],
    choices: [
      choice({
        id: "A",
        label: "Commission a hero broadside",
        description:
          "Push a public version in which the caravan saved lives while officials stalled.",
        outcomeText:
          "The road begins to carry the hero version before Deer Village can fully fix the public frame.",
        memoryEffects: [
          withStorySource(
            publicRumor(
              "Crow Hero Broadside",
              "Crow couriers spread a broadside claiming the blue caravan saved fevered refugees while officials delayed.",
              "Fox Market courier racks",
              0.72,
              "favorable"
            ),
            {
              source: "Crow Broadside",
              sourceNpcId: "crowBrokerNarrator",
              faction: "crowBrokers",
              tags: ["starter-spine", "public-sympathy", "rumor-route", "day-5"],
            }
          ),
        ],
        factionEffects: [
          { faction: "crowBrokers", delta: 2 },
          { faction: "refugees", delta: 1 },
        ],
      }),
      choice({
        id: "B",
        label: "Spread suspicion about the tax officer",
        description:
          "Push the idea that medicine was held back under royal tax authority before the theft story ever appeared.",
        outcomeText:
          "The story gains reach, but it will need real records later or Bear Court will treat it as convenient rumor.",
        memoryEffects: [
          withStorySource(
            publicRumor(
              "Tax Officer Whisper",
              "Crow couriers whisper that a royal tax officer held medicine in motion before Deer Village posted its theft notice.",
              "Fox Market whisper web",
              0.61,
              "neutral"
            ),
            {
              source: "Crow Whisper Network",
              sourceNpcId: "crowBrokerNarrator",
              faction: "crowBrokers",
              tags: ["starter-spine", "system-evidence", "rumor-route", "day-5"],
            }
          ),
        ],
        factionEffects: [{ faction: "crowBrokers", delta: 1 }],
      }),
      choice({
        id: "C",
        label: "Publish a careful factual notice",
        description:
          "Trade reach for precision and try to create something the court can read later.",
        outcomeText:
          "The note spreads more slowly than a rumor, but it fixes a cleaner public timeline around the case.",
        memoryEffects: [
          withStorySource(
            publicRecord(
              "Factual Road Notice",
              "A written road notice claims the caravan moved medicine during a fever emergency and disputes the theft framing.",
              "Fox Market notice board",
              0.69,
              "neutral"
            ),
            {
              source: "Crow Relay Notice",
              sourceNpcId: "crowBrokerNarrator",
              faction: "crowBrokers",
              tags: ["starter-spine", "timeline-evidence", "day-5"],
            }
          ),
        ],
        factionEffects: [
          { faction: "crowBrokers", delta: 1 },
          { faction: "bearCourt", delta: 1 },
        ],
      }),
      choice({
        id: "D",
        label: "Create a false alibi",
        description:
          "Give the road a simpler, cleaner lie and hope it outruns the records.",
        outcomeText:
          "The lie spreads quickly because it is easy to repeat, and that makes it dangerous if stronger evidence later disagrees.",
        memoryEffects: [
          withStorySource(
            publicRumor(
              "False Alibi Rumor",
              "Travelers repeat that the blue caravan was nowhere near Deer Village when the medicine disappeared.",
              "Fox Market courier circuit",
              0.66,
              "incriminating"
            ),
            {
              source: "Crow Alibi Circuit",
              sourceNpcId: "crowBrokerNarrator",
              faction: "crowBrokers",
              tags: ["starter-spine", "contradiction", "rumor-route", "day-5"],
            }
          ),
        ],
        factionEffects: [
          { faction: "crowBrokers", delta: -1 },
          { faction: "bearCourt", delta: -1 },
        ],
        resourceEffects: { legalRisk: 1 },
      }),
    ],
  },
  {
    id: "deer-doctors-hidden-diary",
    phase: "loop_one",
    day: 6,
    location: "Deer Village",
    title: "Deer Doctor’s Hidden Diary",
    description:
      "The Deer Doctor kept private notes showing delayed shipments, missing doses, and unexplained tax holds during the medicine shortage.",
    involvedNpcIds: ["villageApothecary", "royalTaxOfficer"],
    routeTags: ["truth"],
    choices: [
      choice({
        id: "A",
        label: "Ask the doctor to file a formal statement",
        description:
          "Convert the diary into something court-readable and durable.",
        outcomeText:
          "The doctor commits part of the hidden record to a public statement despite the personal risk.",
        memoryEffects: [
          withStorySource(
            publicRecord(
              "Protected Doctor Statement",
              "The Deer Doctor files a statement that medicine shortages and delayed shipments predated the accusation against the blue caravan.",
              "Deer Village clinic archive",
              0.87,
              "favorable"
            ),
            {
              source: "Deer Doctor Statement",
              sourceNpcId: "villageApothecary",
              faction: "deerVillage",
              tags: ["starter-spine", "necessity", "truth-route", "day-6"],
            }
          ),
        ],
        factionEffects: [
          { faction: "deerVillage", delta: 1 },
          { faction: "bearCourt", delta: 1 },
        ],
      }),
      choice({
        id: "B",
        label: "Copy the diary and protect the source",
        description:
          "Take the contents without forcing the doctor into public exposure yet.",
        outcomeText:
          "The caravan gains durable system evidence while the source remains safer for now.",
        memoryEffects: [
          withStorySource(
            publicRecord(
              "Deer Doctor Diary",
              "Copied diary pages describe medicine shortages, delayed shipments, and tax holds before Deer Village posted the wanted notice.",
              "Deer Village copied pages",
              0.85,
              "favorable"
            ),
            {
              source: "Copied Deer Doctor Diary",
              sourceNpcId: "villageApothecary",
              faction: "deerVillage",
              tags: ["starter-spine", "system-evidence", "truth-route", "day-6"],
            }
          ),
          withStorySource(
            publicRecord(
              "Missing Dose Table",
              "A table from the doctor’s notes shows medicine doses missing from local supply before the caravan touched the storeroom.",
              "Deer Village copied pages",
              0.81,
              "favorable"
            ),
            {
              source: "Doctor Dose Table",
              sourceNpcId: "villageApothecary",
              faction: "deerVillage",
              tags: ["starter-spine", "necessity", "truth-route", "day-6"],
            }
          ),
        ],
        factionEffects: [{ faction: "deerVillage", delta: 1 }],
      }),
      choice({
        id: "C",
        label: "Sell the diary to Fox Market",
        description:
          "Trade the evidence for protection or silver and let the market control its release.",
        outcomeText:
          "The caravan profits in the moment, but Fox Market gains more control over what the evidence can later mean.",
        memoryEffects: [
          withStorySource(
            publicContract(
              "Black Market Debt Note",
              "Fox Market records a private exchange around the doctor’s notes and binds the caravan more tightly to market discretion.",
              "Fox Market private ledger",
              0.74,
              "incriminating"
            ),
            {
              source: "Fox Diary Transfer Note",
              sourceNpcId: "foxLedgerMaster",
              faction: "foxMarket",
              tags: ["starter-spine", "merchant-route", "legal-risk", "day-6"],
            }
          ),
        ],
        factionEffects: [
          { faction: "foxMarket", delta: 1 },
          { faction: "deerVillage", delta: -1 },
        ],
        resourceEffects: {
          silver: 2,
          legalRisk: 1,
        },
      }),
      choice({
        id: "D",
        label: "Hide the diary",
        description:
          "Protect the source at the cost of leaving the evidence fragile and private.",
        outcomeText:
          "The truth survives only as a witness trace unless the caravan later finds a safer way to preserve it.",
        memoryEffects: [
          withStorySource(
            shortTermMemory(
              "Suppressed Medical Note",
              "A caravan witness remembers hiding the Deer Doctor’s notes rather than letting them become public evidence.",
              "Deer Village private satchel memory",
              0.58,
              "neutral"
            ),
            {
              source: "Suppressed Clinic Note",
              sourceNpcId: "villageApothecary",
              tags: ["starter-spine", "short-term", "day-6"],
            }
          ),
        ],
        factionEffects: [],
      }),
    ],
  },
  {
    id: "first-memory-collapse-night",
    phase: "loop_one",
    day: 7,
    location: "Bear Court",
    title: "First Memory Collapse Night",
    description:
      "Direct witness memories from the first week begin to fade. The caravan must decide what to preserve, amplify, destroy, or let vanish before the second loop begins.",
    involvedNpcIds: ["crowBrokerNarrator", "bearJudgeAuthority"],
    routeTags: ["truth", "merchant", "rumor", "failure"],
    choices: [
      choice({
        id: "A",
        label: "Preserve one witness statement as a public record",
        description:
          "Convert fragile human memory into durable court-facing evidence.",
        outcomeText:
          "A useful witness is pulled across the collapse boundary and fixed into the public record.",
        memoryEffects: [
          withStorySource(
            publicRecord(
              "Preserved Witness Statement",
              "A first-week witness statement is copied into a durable public record before memory collapse erases its direct trace.",
              "Bear Court roadside archive",
              0.79,
              "favorable"
            ),
            {
              source: "Preservation Copybook",
              faction: "bearCourt",
              tags: ["starter-spine", "collapse", "truth-route", "day-7"],
            }
          ),
        ],
        factionEffects: [{ faction: "bearCourt", delta: 1 }],
      }),
      choice({
        id: "B",
        label: "Amplify one public song or rumor",
        description:
          "Carry social memory forward instead of legal memory.",
        outcomeText:
          "Whatever else fades tomorrow, the road will still carry a louder version of the caravan’s week.",
        memoryEffects: [
          withStorySource(
            publicSong(
              "Nightfire Chorus",
              "The refugees spend the collapse night singing the full tale of the blue caravan’s road.",
              "Bear Court roadside campfire",
              0.74,
              "favorable"
            ),
            {
              source: "Night Camp Chorus",
              sourceNpcId: "crowBrokerNarrator",
              faction: "crowBrokers",
              tags: ["starter-spine", "collapse", "rumor-route", "day-7"],
            }
          ),
        ],
        factionEffects: [
          { faction: "refugees", delta: 1 },
          { faction: "crowBrokers", delta: 1 },
        ],
      }),
      choice({
        id: "C",
        label: "Burn private notes to reduce risk",
        description:
          "Destroy the caravan’s weaker scraps before they can become contradiction evidence later.",
        outcomeText:
          "The caravan loses detail, but some of its private liability goes with the smoke.",
        memoryEffects: [
          withStorySource(
            shortTermMemory(
              "Burned Notes Trace",
              "Only the caravan remembers how many private notes went into the collapse-night fire.",
              "Bear Court roadside firelight",
              0.33,
              "neutral"
            ),
            {
              source: "Burned Notes Memory",
              tags: ["starter-spine", "collapse", "short-term", "day-7"],
            }
          ),
        ],
        factionEffects: [],
        resourceEffects: { legalRisk: -1 },
      }),
      choice({
        id: "D",
        label: "Rehearse a cleaner but suspicious alibi",
        description:
          "Try to make the surviving story look simpler than the week really was.",
        outcomeText:
          "The story becomes easier to repeat and easier to distrust.",
        memoryEffects: [
          withStorySource(
            publicRumor(
              "Practiced Alibi Story",
              "Travelers hear the blue caravan giving the same polished answer to every question about the week.",
              "Bear Court roadside gossip",
              0.62,
              "incriminating"
            ),
            {
              source: "Roadside Alibi Gossip",
              sourceNpcId: "crowBrokerNarrator",
              faction: "crowBrokers",
              tags: ["starter-spine", "collapse", "contradiction", "day-7"],
            }
          ),
        ],
        factionEffects: [{ faction: "bearCourt", delta: -1 }],
        resourceEffects: { legalRisk: 1 },
      }),
    ],
  },
  {
    id: "return-to-deer-village-gate",
    phase: "loop_two",
    day: 8,
    location: "Deer Village",
    title: "Return to Deer Village Gate",
    description:
      "The Deer Guard no longer fully remembers the player directly, but the wanted notice still hangs in public view. The record outlives living memory.",
    involvedNpcIds: ["villageApothecary", "bearJudgeAuthority"],
    routeTags: ["truth", "failure"],
    choices: [
      choice({
        id: "A",
        label: "Confront the accusation with records",
        description:
          "Answer the wanted notice in public using the strongest records you have carried this far.",
        outcomeText:
          "The gate becomes a site of record conflict rather than a simple memory of theft.",
        memoryEffects: [
          withStorySource(
            publicRecord(
              "Gate Challenge Record",
              "A Deer Village gate clerk records that the blue caravan publicly challenged the theft accusation with surviving documents in hand.",
              "Deer Village gate log",
              0.77,
              "neutral"
            ),
            {
              source: "Village Gate Clerk",
              faction: "deerVillage",
              tags: ["starter-spine", "timeline-evidence", "day-8"],
            }
          ),
        ],
        factionEffects: [
          { faction: "deerVillage", delta: 1 },
          { faction: "bearCourt", delta: 1 },
        ],
      }),
      choice({
        id: "B",
        label: "Avoid the gate",
        description:
          "Keep moving and refuse to feed the wanted notice with another public confrontation.",
        outcomeText:
          "The record stays uncontested in public, and the silence itself begins to look like admission.",
        memoryEffects: [
          withStorySource(
            publicRecord(
              "Guard Reads Wanted Notice",
              "The Deer Guard publicly reads the wanted notice again as the blue caravan keeps its distance from the gate.",
              "Deer Village gate board",
              0.84,
              "incriminating"
            ),
            {
              source: "Deer Village Notice Board",
              faction: "deerVillage",
              tags: ["starter-spine", "act-evidence", "day-8"],
            }
          ),
        ],
        factionEffects: [{ faction: "deerVillage", delta: -1 }],
      }),
      choice({
        id: "C",
        label: "Appeal to villagers",
        description:
          "Try to shift the public feeling at the gate even if the official notice remains.",
        outcomeText:
          "Some of the village begins to doubt the clean theft story, even if the board itself does not change.",
        memoryEffects: [
          withStorySource(
            publicRumor(
              "Village Gate Sympathy",
              "Villagers whisper that the blue caravan returned to face the charge instead of disappearing like ordinary thieves.",
              "Deer Village gate crowd",
              0.65,
              "favorable"
            ),
            {
              source: "Gate Crowd Whisper",
              faction: "deerVillage",
              tags: ["starter-spine", "public-sympathy", "day-8"],
            }
          ),
        ],
        factionEffects: [
          { faction: "deerVillage", delta: 1 },
          { faction: "crowBrokers", delta: 1 },
        ],
      }),
      choice({
        id: "D",
        label: "Provoke the guard",
        description:
          "Force the gate into a harsher public scene and see if anger dislodges the truth.",
        outcomeText:
          "The confrontation leaves a fresh public mark, but it strengthens suspicion more than sympathy.",
        memoryEffects: [
          withStorySource(
            publicRecord(
              "Public Suspicion Entry",
              "A gate disturbance entry notes that the blue caravan challenged Deer Village authority in front of the wanted notice.",
              "Deer Village gate incident log",
              0.72,
              "incriminating"
            ),
            {
              source: "Village Incident Log",
              faction: "deerVillage",
              tags: ["starter-spine", "contradiction", "day-8"],
            }
          ),
        ],
        factionEffects: [
          { faction: "deerVillage", delta: -2 },
          { faction: "bearCourt", delta: -1 },
        ],
        resourceEffects: { legalRisk: 1 },
      }),
    ],
  },
  {
    id: "bear-court-intake-window",
    phase: "loop_two",
    day: 9,
    location: "Bear Court",
    title: "Bear Court Intake Window",
    description:
      "Bear Court clerks begin collecting admissible evidence before trial. The case can still be shaped before the court frames it first.",
    involvedNpcIds: ["bearJudgeAuthority", "royalTaxOfficer"],
    routeTags: ["truth"],
    choices: [
      choice({
        id: "A",
        label: "Submit verified statement",
        description:
          "Attach a narrow, factual statement to the intake file and accept the paper trail.",
        outcomeText:
          "The court receives a verified statement that can support stronger packets later.",
        memoryEffects: [
          withStorySource(
            publicContract(
              "Court Intake Statement",
              "Bear Court intake papers include a verified statement from the blue caravan before the hearing begins.",
              "Bear Court intake archive",
              0.87,
              "favorable"
            ),
            {
              source: "Bear Court Intake Clerk",
              sourceNpcId: "bearJudgeAuthority",
              faction: "bearCourt",
              tags: ["starter-spine", "truth-route", "court-filing", "day-9"],
            }
          ),
        ],
        factionEffects: [{ faction: "bearCourt", delta: 1 }],
      }),
      choice({
        id: "B",
        label: "File evidence packet",
        description:
          "Get the strongest records and copies on the docket before they can be ignored.",
        outcomeText:
          "The clerks stamp receipt of your packet, which may matter when the court decides what was timely filed.",
        memoryEffects: [
          withStorySource(
            publicRecord(
              "Evidence Filing Receipt",
              "A Bear Court receipt confirms that the blue caravan submitted evidence before the trial packet closed.",
              "Bear Court filing window",
              0.83,
              "favorable"
            ),
            {
              source: "Bear Court Filing Window",
              sourceNpcId: "bearJudgeAuthority",
              faction: "bearCourt",
              tags: ["starter-spine", "truth-route", "timeline-evidence", "day-9"],
            }
          ),
        ],
        factionEffects: [{ faction: "bearCourt", delta: 1 }],
      }),
      choice({
        id: "C",
        label: "Lean on hallway gossip",
        description:
          "Let the queue talk before the clerks settle into a formal reading of the case.",
        outcomeText:
          "The hallway starts talking faster than the docket can move, buying narrative space at the cost of cleaner proof.",
        memoryEffects: [
          withStorySource(
            publicRumor(
              "Court Queue Whisper",
              "People in the Bear Court queue whisper that the blue caravan is shaping the story before the hearing begins.",
              "Bear Court queue",
              0.57,
              "neutral"
            ),
            {
              source: "Bear Court Queue",
              sourceNpcId: "crowBrokerNarrator",
              faction: "crowBrokers",
              tags: ["starter-spine", "rumor-route", "day-9"],
            }
          ),
        ],
        factionEffects: [{ faction: "crowBrokers", delta: 1 }],
      }),
      choice({
        id: "D",
        label: "Delay the filing",
        description:
          "Hold back the packet and try to enter later with more leverage.",
        outcomeText:
          "The delay buys time, but the clerk’s note may later look like hesitation or tactical concealment.",
        memoryEffects: [
          withStorySource(
            publicRecord(
              "Late Filing Note",
              "A clerk notes that the blue caravan delayed part of its filing even after the intake window opened.",
              "Bear Court intake archive",
              0.74,
              "neutral"
            ),
            {
              source: "Late Filing Clerk Note",
              sourceNpcId: "bearJudgeAuthority",
              faction: "bearCourt",
              tags: ["starter-spine", "timeline-evidence", "legal-risk", "day-9"],
            }
          ),
        ],
        factionEffects: [{ faction: "bearCourt", delta: -1 }],
        resourceEffects: { legalRisk: 1 },
      }),
    ],
  },
  {
    id: "fox-audit-second-pass",
    phase: "loop_two",
    day: 10,
    location: "Fox Market",
    title: "Fox Audit Second Pass",
    description:
      "Fox Market offers a second audit with Bear Court scrutiny in mind. The caravan can clean the books, expose the gap, hide a weakness, or walk away.",
    involvedNpcIds: ["foxLedgerMaster"],
    routeTags: ["merchant", "truth"],
    choices: [
      choice({
        id: "A",
        label: "Pay for a clean audit",
        description:
          "Buy a court-friendly audit seal and strengthen the merchant route.",
        outcomeText:
          "The market presents the caravan as settled and internally consistent, at least on paper.",
        memoryEffects: [
          withStorySource(
            publicRecord(
              "Fox Audit Seal",
              "Fox Market auditors stamp the blue caravan’s books as internally consistent before Bear Court review.",
              "Fox Market audit table",
              0.86,
              "favorable"
            ),
            {
              source: "Fox Audit Table",
              sourceNpcId: "foxLedgerMaster",
              faction: "foxMarket",
              tags: ["starter-spine", "merchant-route", "day-10"],
            }
          ),
        ],
        factionEffects: [{ faction: "foxMarket", delta: 2 }],
        resourceEffects: { silver: -1 },
      }),
      choice({
        id: "B",
        label: "Force open the medicine columns",
        description:
          "Trade market favor for stronger proof that medicine flow was manipulated.",
        outcomeText:
          "A gap appears where the market hoped the court would never look too closely.",
        memoryEffects: [
          withStorySource(
            publicRecord(
              "Audit Gap",
              "A second-pass audit reveals a gap between recorded medicine stock and what Fox Market claims was available during the shortage.",
              "Fox Market audit table",
              0.82,
              "favorable"
            ),
            {
              source: "Fox Audit Exception",
              sourceNpcId: "foxLedgerMaster",
              faction: "foxMarket",
              tags: ["starter-spine", "system-evidence", "truth-route", "day-10"],
            }
          ),
        ],
        factionEffects: [
          { faction: "foxMarket", delta: -1 },
          { faction: "bearCourt", delta: 1 },
        ],
      }),
      choice({
        id: "C",
        label: "Hide a weak line item",
        description:
          "Protect one awkward payment and hope it stays off the formal path.",
        outcomeText:
          "A clerk notices the concealment, leaving behind a fragile but dangerous witness trace.",
        memoryEffects: [
          withStorySource(
            shortTermMemory(
              "Hidden Payment Trace",
              "A Fox Market clerk remembers the blue caravan burying one payment inside a longer column during the second audit.",
              "Fox Market counting room",
              0.72,
              "incriminating"
            ),
            {
              source: "Fox Clerk Memory",
              sourceNpcId: "foxLedgerMaster",
              faction: "foxMarket",
              tags: ["starter-spine", "short-term", "legal-risk", "day-10"],
            }
          ),
        ],
        factionEffects: [{ faction: "foxMarket", delta: -1 }],
        resourceEffects: { legalRisk: 1 },
      }),
      choice({
        id: "D",
        label: "Refuse the audit",
        description:
          "Deny the market another look at your route and leave with no new seal at all.",
        outcomeText:
          "Fox Market lets the refusal become its own story about what the caravan feared the books would show.",
        memoryEffects: [
          withStorySource(
            publicRumor(
              "Refused Audit Notice",
              "Fox Market whispers that the blue caravan refused a second audit before Bear Court review.",
              "Fox Market side board",
              0.58,
              "neutral"
            ),
            {
              source: "Fox Side Board",
              sourceNpcId: "foxLedgerMaster",
              faction: "foxMarket",
              tags: ["starter-spine", "merchant-route", "day-10"],
            }
          ),
        ],
        factionEffects: [{ faction: "foxMarket", delta: -1 }],
      }),
    ],
  },
  {
    id: "tax-officers-travel-ledger",
    phase: "loop_two",
    day: 11,
    location: "Bear Court",
    title: "Tax Officer’s Travel Ledger",
    description:
      "A travel ledger places the royal tax officer near Fox Market during the medicine shortage. The caravan can authenticate the link, exploit it, sell it, or hide it.",
    involvedNpcIds: ["royalTaxOfficer", "foxLedgerMaster"],
    routeTags: ["truth", "failure"],
    choices: [
      choice({
        id: "A",
        label: "Authenticate the ledger copy",
        description:
          "Turn the sighting into reliable court-readable system evidence.",
        outcomeText:
          "The travel path becomes a formal link between tax authority and the market routes around the shortage.",
        memoryEffects: [
          withStorySource(
            publicRecord(
              "Tax Officer Travel Ledger",
              "A copied travel ledger places the royal tax officer near Fox Market during the medicine shortage.",
              "Bear Court archive annex",
              0.88,
              "favorable"
            ),
            {
              source: "Travel Ledger Copy",
              sourceNpcId: "royalTaxOfficer",
              faction: "bearCourt",
              tags: ["starter-spine", "system-evidence", "truth-route", "day-11"],
            }
          ),
          withStorySource(
            publicRecord(
              "Royal Seal Route Map",
              "An attached route map marks the same royal seal path used by medicine wagons and tax oversight during the shortage.",
              "Bear Court archive annex",
              0.82,
              "favorable"
            ),
            {
              source: "Royal Route Map",
              sourceNpcId: "royalTaxOfficer",
              faction: "bearCourt",
              tags: ["starter-spine", "system-evidence", "truth-route", "day-11"],
            }
          ),
        ],
        factionEffects: [{ faction: "bearCourt", delta: 1 }],
      }),
      choice({
        id: "B",
        label: "Blackmail the tax officer",
        description:
          "Use the ledger for leverage instead of public proof.",
        outcomeText:
          "The pressure may buy short-term safety, but it leaves behind a story that can harm the case if it surfaces.",
        memoryEffects: [
          withStorySource(
            publicRumor(
              "Blackmail Trace",
              "Whispers spread that the blue caravan tried to use a royal travel ledger for leverage instead of filing it cleanly.",
              "Bear Court side corridor",
              0.64,
              "incriminating"
            ),
            {
              source: "Court Corridor Whisper",
              sourceNpcId: "royalTaxOfficer",
              faction: "bearCourt",
              tags: ["starter-spine", "contradiction", "day-11"],
            }
          ),
        ],
        factionEffects: [{ faction: "bearCourt", delta: -1 }],
        resourceEffects: { legalRisk: 1 },
      }),
      choice({
        id: "C",
        label: "Sell the ledger to Fox Market",
        description:
          "Trade the link away and let the market decide how visible it will become.",
        outcomeText:
          "The market takes an interest in suppressing the link, and the road hears that the caravan helped price the truth.",
        memoryEffects: [
          withStorySource(
            publicRumor(
              "Sold Ledger Rumor",
              "Fox Market whispers that the blue caravan sold tax-route evidence instead of filing it with Bear Court.",
              "Fox Market whisper chain",
              0.63,
              "incriminating"
            ),
            {
              source: "Fox Whisper Chain",
              sourceNpcId: "foxLedgerMaster",
              faction: "foxMarket",
              tags: ["starter-spine", "merchant-route", "contradiction", "day-11"],
            }
          ),
        ],
        factionEffects: [{ faction: "foxMarket", delta: 1 }],
        resourceEffects: {
          silver: 2,
          legalRisk: 1,
        },
      }),
      choice({
        id: "D",
        label: "Hide the ledger",
        description:
          "Keep the evidence off the board and hope it can still matter later.",
        outcomeText:
          "The truth survives only as a private decision not to make the record public yet.",
        memoryEffects: [
          withStorySource(
            shortTermMemory(
              "Hidden Ledger Trace",
              "A caravan witness remembers finding the tax officer’s travel ledger and choosing not to file it yet.",
              "Bear Court archive memory",
              0.52,
              "neutral"
            ),
            {
              source: "Caravan Archive Memory",
              tags: ["starter-spine", "short-term", "day-11"],
            }
          ),
        ],
        factionEffects: [],
      }),
    ],
  },
  {
    id: "witness-contradiction-hearing",
    phase: "loop_two",
    day: 12,
    location: "Bear Court",
    title: "Witness Contradiction Hearing",
    description:
      "Bear clerks compare witness statements and find contradictions. The caravan must clean the case, bury the weak parts, flood the docket, or admit uncertainty.",
    involvedNpcIds: ["bearJudgeAuthority", "crowBrokerNarrator"],
    routeTags: ["truth", "failure"],
    choices: [
      choice({
        id: "A",
        label: "Clarify contradictions honestly",
        description:
          "Reduce noise by admitting where witnesses differ and fixing the stable parts of the timeline.",
        outcomeText:
          "The packet grows cleaner, if less heroic, and the court gets a steadier sheet to read.",
        memoryEffects: [
          withStorySource(
            publicRecord(
              "Clarified Testimony Sheet",
              "A Bear Court testimony sheet records which witness points are stable and which were corrected before trial.",
              "Bear Court clerk file",
              0.81,
              "favorable"
            ),
            {
              source: "Bear Court Clerk Sheet",
              sourceNpcId: "bearJudgeAuthority",
              faction: "bearCourt",
              tags: ["starter-spine", "truth-route", "day-12"],
            }
          ),
        ],
        factionEffects: [{ faction: "bearCourt", delta: 1 }],
      }),
      choice({
        id: "B",
        label: "Remove weak witnesses from the packet",
        description:
          "Sacrifice breadth for cleaner court survival.",
        outcomeText:
          "The packet becomes narrower, but the removed voices still leave behind a visible contradiction sheet.",
        memoryEffects: [
          withStorySource(
            publicRecord(
              "Contradiction Sheet",
              "Bear Court clerks record which witness lines were removed or left unresolved before trial.",
              "Bear Court clerk file",
              0.78,
              "incriminating"
            ),
            {
              source: "Bear Court Contradiction Sheet",
              sourceNpcId: "bearJudgeAuthority",
              faction: "bearCourt",
              tags: ["starter-spine", "contradiction", "day-12"],
            }
          ),
        ],
        factionEffects: [{ faction: "bearCourt", delta: -1 }],
      }),
      choice({
        id: "C",
        label: "Flood the docket with extra testimony",
        description:
          "Bury the weak points under volume and hope the court cannot sort it cleanly.",
        outcomeText:
          "The case grows noisier and less coherent, which may help some narratives and harm others.",
        memoryEffects: [
          withStorySource(
            publicRecord(
              "Noisy Docket",
              "The hearing docket swells with overlapping witness material that makes the case harder to read cleanly.",
              "Bear Court testimony rack",
              0.66,
              "neutral"
            ),
            {
              source: "Overloaded Hearing Docket",
              sourceNpcId: "bearJudgeAuthority",
              faction: "bearCourt",
              tags: ["starter-spine", "contradiction", "day-12"],
            }
          ),
        ],
        factionEffects: [{ faction: "bearCourt", delta: -1 }],
      }),
      choice({
        id: "D",
        label: "Admit uncertainty",
        description:
          "Trade strength for honesty and let the court see where memory has limits.",
        outcomeText:
          "The note weakens the rhetorical force of the defense but can reduce the damage of later contradiction.",
        memoryEffects: [
          withStorySource(
            publicRecord(
              "Honest Uncertainty Note",
              "A formal note admits where witness memory is incomplete or inconsistent before the court packet is sorted.",
              "Bear Court clerk file",
              0.71,
              "neutral"
            ),
            {
              source: "Uncertainty Note",
              sourceNpcId: "bearJudgeAuthority",
              faction: "bearCourt",
              tags: ["starter-spine", "timeline-evidence", "day-12"],
            }
          ),
        ],
        factionEffects: [{ faction: "bearCourt", delta: 0 }],
      }),
    ],
  },
  {
    id: "court-packet-sorting",
    phase: "loop_two",
    day: 13,
    location: "Bear Court",
    title: "Court Packet Sorting",
    description:
      "The caravan chooses which evidence packet reaches Bear Court first. The court will not read everything with equal attention.",
    involvedNpcIds: ["bearJudgeAuthority", "crowBrokerNarrator", "foxLedgerMaster"],
    routeTags: ["truth", "merchant", "rumor", "failure"],
    choices: [
      choice({
        id: "A",
        label: "Lead with legal records",
        description:
          "Make the case legible through records, statements, and system evidence first.",
        outcomeText:
          "The packet becomes cleaner and stronger for a truth-facing court read.",
        memoryEffects: [
          withStorySource(
            publicRecord(
              "Sorted Court Packet",
              "Bear Court clerks assemble the blue caravan’s strongest surviving records into the first packet to be read.",
              "Bear Court records table",
              0.88,
              "favorable"
            ),
            {
              source: "Bear Court Packet Table",
              sourceNpcId: "bearJudgeAuthority",
              faction: "bearCourt",
              tags: ["starter-spine", "truth-route", "day-13"],
            }
          ),
        ],
        factionEffects: [{ faction: "bearCourt", delta: 1 }],
      }),
      choice({
        id: "B",
        label: "Lead with settlement papers",
        description:
          "Put Fox Market contracts and clean-looking books in front before anything else.",
        outcomeText:
          "The case becomes easier to close procedurally, even if the deeper truth stays behind it.",
        memoryEffects: [
          withStorySource(
            publicContract(
              "Merchant Packet",
              "Fox Market settlement papers and cleaner ledgers are bundled into the first packet prepared for Bear Court.",
              "Bear Court contract tray",
              0.8,
              "favorable"
            ),
            {
              source: "Merchant Packet Tray",
              sourceNpcId: "foxLedgerMaster",
              faction: "foxMarket",
              tags: ["starter-spine", "merchant-route", "day-13"],
            }
          ),
        ],
        factionEffects: [
          { faction: "foxMarket", delta: 1 },
          { faction: "bearCourt", delta: 0 },
        ],
      }),
      choice({
        id: "C",
        label: "Lead with songs and public sympathy",
        description:
          "Ask the court to meet the public version of the caravan before the stricter papers arrive.",
        outcomeText:
          "The packet leads with sympathy and road memory, which may resonate beyond law but will not satisfy every judge.",
        memoryEffects: [
          withStorySource(
            publicSong(
              "Song Packet",
              "A packet of songs, broadsides, and public gratitude is prepared as the first emotional frame for the case.",
              "Bear Court song tray",
              0.73,
              "favorable"
            ),
            {
              source: "Crow Song Packet",
              sourceNpcId: "crowBrokerNarrator",
              faction: "crowBrokers",
              tags: ["starter-spine", "rumor-route", "day-13"],
            }
          ),
        ],
        factionEffects: [
          { faction: "crowBrokers", delta: 1 },
          { faction: "refugees", delta: 1 },
        ],
      }),
      choice({
        id: "D",
        label: "Submit everything without sorting",
        description:
          "Trust volume over discipline and let the court confront the full chaos at once.",
        outcomeText:
          "The docket swells into noise, increasing the chance that contradiction outruns coherence.",
        memoryEffects: [
          withStorySource(
            publicRecord(
              "Noisy Docket",
              "The entire mixed record reaches Bear Court without sorting, making the case bulkier and harder to read cleanly.",
              "Bear Court records table",
              0.67,
              "incriminating"
            ),
            {
              source: "Unsorted Court Docket",
              sourceNpcId: "bearJudgeAuthority",
              faction: "bearCourt",
              tags: ["starter-spine", "contradiction", "day-13"],
            }
          ),
        ],
        factionEffects: [{ faction: "bearCourt", delta: -1 }],
        resourceEffects: { legalRisk: 1 },
      }),
    ],
  },
  {
    id: "eve-of-bear-court",
    phase: "loop_two",
    day: 14,
    location: "Bear Court",
    title: "Eve of Bear Court",
    description:
      "The caravan sleeps beside its records. By dawn, only stable evidence will matter. The final night is about guarding the truth, calming witnesses, leaking the story, or running from judgment.",
    involvedNpcIds: ["bearJudgeAuthority", "crowBrokerNarrator", "royalTaxOfficer"],
    routeTags: ["truth", "merchant", "rumor", "failure"],
    choices: [
      choice({
        id: "A",
        label: "Guard the records",
        description:
          "Stay with the strongest packet and make sure nothing vanishes before morning.",
        outcomeText:
          "The case enters dawn anchored by one more durable court-facing note.",
        memoryEffects: [
          withStorySource(
            publicRecord(
              "Last Night Docket Note",
              "A final docket note places the blue caravan beside its own records on the eve of the hearing.",
              "Bear Court night ledger",
              0.8,
              "neutral"
            ),
            {
              source: "Night Docket Ledger",
              sourceNpcId: "bearJudgeAuthority",
              faction: "bearCourt",
              tags: ["starter-spine", "eve-of-court", "day-14"],
            }
          ),
        ],
        factionEffects: [{ faction: "bearCourt", delta: 1 }],
      }),
      choice({
        id: "B",
        label: "Rehearse witnesses calmly",
        description:
          "Spend the last night preparing people rather than papers.",
        outcomeText:
          "The witnesses enter the morning steadier, with one more durable list to prove who is ready to speak.",
        memoryEffects: [
          withStorySource(
            publicRecord(
              "Witness Ready List",
              "A final readiness list records which witnesses and records the caravan expects to rely on at dawn.",
              "Bear Court night ledger",
              0.78,
              "favorable"
            ),
            {
              source: "Witness Readiness List",
              sourceNpcId: "bearJudgeAuthority",
              faction: "bearCourt",
              tags: ["starter-spine", "truth-route", "day-14"],
            }
          ),
        ],
        factionEffects: [{ faction: "bearCourt", delta: 1 }],
      }),
      choice({
        id: "C",
        label: "Leak the story to the public",
        description:
          "Give the road one final emotional frame before the court shuts the doors.",
        outcomeText:
          "The leak may help public sympathy, but it risks looking like last-minute pressure if it goes too far.",
        memoryEffects: [
          withStorySource(
            publicRumor(
              "Midnight Leak Rumor",
              "A final nighttime leak spreads through Bear Court that the blue caravan’s medicine story is bigger than simple theft.",
              "Bear Court square",
              0.69,
              "favorable"
            ),
            {
              source: "Midnight Crow Circuit",
              sourceNpcId: "crowBrokerNarrator",
              faction: "crowBrokers",
              tags: ["starter-spine", "rumor-route", "day-14"],
            }
          ),
        ],
        factionEffects: [
          { faction: "crowBrokers", delta: 1 },
          { faction: "refugees", delta: 1 },
        ],
      }),
      choice({
        id: "D",
        label: "Attempt to flee",
        description:
          "Abandon the court and trust motion more than evidence.",
        outcomeText:
          "The attempt leaves behind the kind of record no later argument can easily soften.",
        memoryEffects: [
          withStorySource(
            publicRecord(
              "Flight Attempt Notice",
              "A court-side notice records that the blue caravan tried to flee on the eve of the hearing.",
              "Bear Court gate board",
              0.92,
              "incriminating"
            ),
            {
              source: "Bear Court Gate Notice",
              sourceNpcId: "bearJudgeAuthority",
              faction: "bearCourt",
              tags: ["starter-spine", "failure-route", "day-14"],
            }
          ),
        ],
        factionEffects: [
          { faction: "bearCourt", delta: -2 },
          { faction: "deerVillage", delta: -1 },
        ],
        resourceEffects: { legalRisk: 2 },
      }),
    ],
  },
];
