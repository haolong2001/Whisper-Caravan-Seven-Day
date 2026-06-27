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
  "Day 1 begins a route-dependent fourteen-day run. Each day presents one major event card that can create evidence, shift factions, and change what survives the next collapse boundary.";

export const initialNpcResponse =
  "No retrieval query has fired yet. The v0.5 route-dependent pool still resolves as one major event per day across two loops before Bear Court evaluates the surviving evidence.";

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
  const openingScene = buildSceneForDay(gameScenes[0], 1);

  return {
    phase: "loop_one",
    currentDay: 1,
    currentSceneIndex: 0,
    scenePlan: [openingScene],
    memories: [],
    factions: { ...initialFactions },
    resources: { ...initialResources },
    npcTrust: {},
    collectedEvidence: [],
    unlockedRoutes: [],
    npcPriceModifiers: {},
    npcQuestAvailability: {},
    flags: [],
    sceneChoices: {},
    sceneStatus: initialSceneStatus,
  };
}

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

function withSelectionMeta(
  scene: StoryScene,
  {
    dayOptions,
    selectionBucket,
    isAnchor = false,
  }: {
    dayOptions: number[];
    selectionBucket: StoryScene["selectionBucket"];
    isAnchor?: boolean;
  }
): StoryScene {
  return {
    ...scene,
    dayOptions,
    selectionBucket,
    isAnchor,
  };
}

export function buildSceneForDay(template: StoryScene, day: number): StoryScene {
  return {
    ...template,
    day,
    phase: day <= 7 ? "loop_one" : "loop_two",
  };
}

const borderTollInspection: StoryScene = {
  id: "border-toll-inspection",
  phase: "loop_one",
  day: 4,
  location: "Bear Court",
  title: "Border Toll Inspection",
  description:
    "Bear officers stop the caravan at a toll checkpoint to inspect cargo, papers, passengers, and any hidden medicine.",
  involvedNpcIds: ["royalTaxOfficer", "bearJudgeAuthority", "campHealer"],
  routeTags: ["truth", "merchant", "failure"],
  choices: [
    choice({
      id: "A",
      label: "Submit to inspection",
      description: "Let the officers log what they see and move carefully through the checkpoint.",
      outcomeText:
        "The official log helps later if your route stays coherent, though every public stamp also makes your trail easier to trace.",
      memoryEffects: [
        withStorySource(
          publicRecord(
            "Border Clearance Log",
            "A Bear toll clerk records that the blue caravan passed inspection with declared cargo and passengers.",
            "Bear Court toll archive",
            0.81,
            "favorable"
          ),
          {
            source: "Border Toll Ledger",
            sourceNpcId: "bearJudgeAuthority",
            faction: "bearCourt",
            tags: ["route-pool", "truth-route", "timeline-evidence", "day-band-4-6"],
          }
        ),
      ],
      factionEffects: [{ faction: "bearCourt", delta: 1 }],
    }),
    choice({
      id: "B",
      label: "Bribe the officer",
      description: "Buy passage and trust that no one audits the stamp too closely later.",
      outcomeText:
        "The caravan passes, but the checkpoint mark now looks wrong in the sort of way clerks remember when cases turn ugly.",
      memoryEffects: [
        withStorySource(
          publicRecord(
            "Suspicious Toll Stamp",
            "A toll record carries a stamp time that does not match the checkpoint clerk rotation.",
            "Bear Court toll archive",
            0.77,
            "incriminating"
          ),
          {
            source: "Toll Gate Inspection Sheet",
            sourceNpcId: "bearJudgeAuthority",
            faction: "bearCourt",
            tags: ["route-pool", "contradiction", "day-band-4-6"],
          }
        ),
      ],
      factionEffects: [{ faction: "bearCourt", delta: -1 }],
      resourceEffects: { silver: -2, legalRisk: 1 },
    }),
    choice({
      id: "C",
      label: "Hide refugees in carts",
      description: "Protect frightened passengers by trusting fabric, shadows, and silence.",
      outcomeText:
        "The hiding works poorly. Even when the caravan escapes the stop, someone remembers the coughing.",
      memoryEffects: [
        withStorySource(
          shortTermMemory(
            "Porter Heard Coughing",
            "A porter privately remembers hearing coughing inside covered carts during the checkpoint stop.",
            "Bear Court toll road",
            0.74,
            "incriminating"
          ),
          {
            source: "Checkpoint Porter",
            faction: "bearCourt",
            tags: ["route-pool", "act-evidence", "witness", "day-band-4-6"],
          }
        ),
      ],
      factionEffects: [
        { faction: "refugees", delta: 1 },
        { faction: "bearCourt", delta: -1 },
      ],
      resourceEffects: { legalRisk: 1 },
    }),
    choice({
      id: "D",
      label: "Accuse a rival caravan",
      description: "Deflect attention by pointing Bear officers toward another route entirely.",
      outcomeText:
        "The tip buys time, but it leaves behind a strange side entry that can cut either way later.",
      memoryEffects: [
        withStorySource(
          publicRecord(
            "Checkpoint Tip Entry",
            "A checkpoint margin note records that the blue caravan redirected officer suspicion toward a rival route.",
            "Bear Court toll archive",
            0.69,
            "neutral"
          ),
          {
            source: "Toll Margin Entry",
            sourceNpcId: "bearJudgeAuthority",
            faction: "bearCourt",
            tags: ["route-pool", "timeline-evidence", "day-band-4-6"],
          }
        ),
      ],
      factionEffects: [{ faction: "bearCourt", delta: -1 }],
    }),
  ],
};

const rabbitWitnessAtMistwood: StoryScene = {
  id: "rabbit-witness-at-mistwood",
  phase: "loop_one",
  day: 5,
  location: "River Refugee Camp",
  title: "Rabbit Witness at Mistwood",
  description:
    "A frightened Rabbit witness saw royal tax wagons moving medicine by night and may not survive public attention without protection.",
  involvedNpcIds: ["campHealer", "royalTaxOfficer", "crowBrokerNarrator"],
  routeTags: ["truth", "rumor"],
  choices: [
    choice({
      id: "A",
      label: "Record formal testimony",
      description: "Turn the witness memory into something Bear Court can eventually read.",
      outcomeText:
        "The statement is narrow but durable. It fixes the night wagons into the legal record before fear can erase them.",
      memoryEffects: [
        withStorySource(
          publicRecord(
            "Rabbit Testimony",
            "A sworn witness statement places royal tax wagons near medicine routes after curfew.",
            "Bear Court witness file",
            0.84,
            "favorable"
          ),
          {
            source: "Mistwood Witness Filing",
            faction: "bearCourt",
            tags: ["route-pool", "truth-route", "system-evidence", "day-band-5-6"],
          }
        ),
      ],
      factionEffects: [{ faction: "bearCourt", delta: 1 }],
    }),
    choice({
      id: "B",
      label: "Escort the witness safely",
      description: "Protect the witness first and leave a lighter paper trail for now.",
      outcomeText:
        "The witness survives the road with a cleaner conscience attached to the caravan, even if the proof stays thinner.",
      memoryEffects: [
        withStorySource(
          publicRecord(
            "Protected Witness Note",
            "A camp note records that the caravan protected a frightened witness tied to night tax wagons.",
            "River Refugee Camp ledger",
            0.79,
            "favorable"
          ),
          {
            source: "Camp Escort Record",
            sourceNpcId: "campHealer",
            faction: "refugees",
            tags: ["route-pool", "truth-route", "necessity", "day-band-5-6"],
          }
        ),
      ],
      factionEffects: [{ faction: "refugees", delta: 1 }],
    }),
    choice({
      id: "C",
      label: "Turn the story into a rumor",
      description: "Spread the night wagons fast before the court can suppress them.",
      outcomeText:
        "The story runs ahead of its proof. It may help later if the caravan can support it with records.",
      memoryEffects: [
        withStorySource(
          publicRumor(
            "Night Tax Wagon Rumor",
            "Road rumor claims royal tax wagons moved medicine through the dark while Deer Village blamed the caravan.",
            "Fox Market rumor circuit",
            0.64,
            "favorable"
          ),
          {
            source: "Crow Relay Whisper Net",
            sourceNpcId: "crowBrokerNarrator",
            faction: "crowBrokers",
            tags: ["route-pool", "rumor-route", "system-evidence", "day-band-5-6"],
          }
        ),
      ],
      factionEffects: [{ faction: "crowBrokers", delta: 1 }],
    }),
    choice({
      id: "D",
      label: "Leave the witness unprotected",
      description: "Avoid the risk and let the fragile memory fend for itself.",
      outcomeText:
        "Nothing stable is written down. The caravan leaves behind a witness trace that may fade before anyone formalizes it.",
      memoryEffects: [
        withStorySource(
          shortTermMemory(
            "Unrecorded Witness Memory",
            "A private witness trace recalls night tax wagons, but no public statement protects it.",
            "Mistwood roadside",
            0.68,
            "favorable"
          ),
          {
            source: "Mistwood Rabbit Witness",
            tags: ["route-pool", "short-term", "witness", "day-band-5-6"],
          }
        ),
      ],
      factionEffects: [{ faction: "refugees", delta: -1 }],
    }),
  ],
};

const blackMarketPriceList: StoryScene = {
  id: "black-market-price-list",
  phase: "loop_one",
  day: 5,
  location: "Fox Market",
  title: "Black Market Price List",
  description:
    "A hidden Fox Market sheet shows medicine prices rising before the theft accusation, implying planned scarcity instead of sudden panic.",
  involvedNpcIds: ["foxLedgerMaster", "royalTaxOfficer", "crowBrokerNarrator"],
  routeTags: ["truth", "merchant"],
  choices: [
    choice({
      id: "A",
      label: "Copy the price list",
      description: "Take a durable copy that can help expose medicine control later.",
      outcomeText:
        "The copy is dry, legible, and dangerous to anyone profiting from scarcity.",
      memoryEffects: [
        withStorySource(
          publicRecord(
            "Medicine Price List",
            "A copied price sheet shows Fox Market medicine values rising before Deer Village posted the wanted notice.",
            "Fox Market account room",
            0.83,
            "favorable"
          ),
          {
            source: "Fox Account Copy",
            sourceNpcId: "foxLedgerMaster",
            faction: "foxMarket",
            tags: ["route-pool", "truth-route", "system-evidence", "day-band-5-6"],
          }
        ),
      ],
      factionEffects: [{ faction: "foxMarket", delta: -1 }],
    }),
    choice({
      id: "B",
      label: "Buy the list from a clerk",
      description: "Pay for the evidence and keep the transfer quiet.",
      outcomeText:
        "The caravan keeps the proof, but now someone knows exactly what it cost to obtain.",
      memoryEffects: [
        withStorySource(
          publicRecord(
            "Fox Supply Markup",
            "A clerk-marked copy highlights price surges tied to constrained medicine supply.",
            "Fox Market account room",
            0.8,
            "favorable"
          ),
          {
            source: "Paid Clerk Copy",
            sourceNpcId: "foxLedgerMaster",
            faction: "foxMarket",
            tags: ["route-pool", "truth-route", "system-evidence", "day-band-5-6"],
          }
        ),
      ],
      factionEffects: [{ faction: "foxMarket", delta: 1 }],
      resourceEffects: { silver: -2 },
    }),
    choice({
      id: "C",
      label: "Trade it back to Fox Market",
      description: "Use the list as bargaining leverage instead of public exposure.",
      outcomeText:
        "The market remembers that the caravan can be reasoned with when ledgers start to bite.",
      memoryEffects: [
        withStorySource(
          publicRecord(
            "Buyer List Fragment",
            "A partial buyer fragment survives from the price sheet trade, useful for leverage but thin as proof.",
            "Fox Market side office",
            0.71,
            "neutral"
          ),
          {
            source: "Fox Market Quiet Trade",
            sourceNpcId: "foxLedgerMaster",
            faction: "foxMarket",
            tags: ["route-pool", "merchant-route", "timeline-evidence", "day-band-5-6"],
          }
        ),
      ],
      factionEffects: [{ faction: "foxMarket", delta: 1 }],
    }),
    choice({
      id: "D",
      label: "Destroy it for favor",
      description: "Burn the sheet and trust Fox Market to remember the gesture kindly.",
      outcomeText:
        "The destruction buys temporary favor, but a dangerous rumor survives the smoke.",
      memoryEffects: [
        withStorySource(
          publicRumor(
            "Destroyed Price Sheet Rumor",
            "Fox Market rumor claims the blue caravan destroyed price evidence instead of exposing it.",
            "Fox Market whisper lane",
            0.59,
            "incriminating"
          ),
          {
            source: "Market Whisper Circuit",
            sourceNpcId: "crowBrokerNarrator",
            faction: "crowBrokers",
            tags: ["route-pool", "contradiction", "rumor-route", "day-band-5-6"],
          }
        ),
      ],
      factionEffects: [{ faction: "foxMarket", delta: 2 }],
    }),
  ],
};

const refugeeWitnessCircle: StoryScene = {
  id: "refugee-witness-circle",
  phase: "loop_one",
  day: 5,
  location: "River Refugee Camp",
  title: "Refugee Witness Circle",
  description:
    "Saved refugees gather to decide whether the caravan should receive legal testimony, public memory, anonymity, or a sharpened myth.",
  involvedNpcIds: ["campHealer", "crowBrokerNarrator", "bearJudgeAuthority"],
  routeTags: ["truth", "rumor"],
  choices: [
    choice({
      id: "A",
      label: "Take formal group testimony",
      description: "Turn gratitude into durable testimony Bear Court can count.",
      outcomeText:
        "The witness circle becomes orderly testimony rather than only grief and song.",
      memoryEffects: [
        withStorySource(
          publicRecord(
            "Group Refugee Testimony",
            "A group witness filing records that refugees received or urgently needed medicine while officials delayed.",
            "River Refugee Camp records table",
            0.85,
            "favorable"
          ),
          {
            source: "Refugee Witness Circle Record",
            sourceNpcId: "campHealer",
            faction: "refugees",
            tags: ["route-pool", "truth-route", "necessity", "day-band-5-6"],
          }
        ),
      ],
      factionEffects: [{ faction: "refugees", delta: 1 }],
    }),
    choice({
      id: "B",
      label: "Let the refugees create a song",
      description: "Trust public memory more than clerks.",
      outcomeText:
        "The camp sings the caravan into the road’s memory, even if the court will hear it as something softer than proof.",
      memoryEffects: [
        withStorySource(
          publicSong(
            "Healing Road Song",
            "A refugee chorus spreads a song of fevered shelters, delayed officials, and a blue caravan that acted first.",
            "River Refugee Camp nightfire",
            0.77,
            "favorable"
          ),
          {
            source: "Refugee Witness Circle Chorus",
            sourceNpcId: "campHealer",
            faction: "refugees",
            tags: ["route-pool", "public-sympathy", "rumor-route", "day-band-5-6"],
          }
        ),
      ],
      factionEffects: [{ faction: "refugees", delta: 2 }],
    }),
    choice({
      id: "C",
      label: "Keep their names anonymous",
      description: "Protect vulnerable refugees even if the court record gets weaker.",
      outcomeText:
        "The gratitude survives as social memory, but the names behind it remain blurred.",
      memoryEffects: [
        withStorySource(
          publicRumor(
            "Anonymous Thanks",
            "Anonymous camp testimony spreads that the caravan brought medicine when the villages stalled.",
            "River Refugee Camp shelter lane",
            0.63,
            "favorable"
          ),
          {
            source: "Anonymous Camp Circle",
            sourceNpcId: "campHealer",
            faction: "refugees",
            tags: ["route-pool", "public-sympathy", "rumor-route", "day-band-5-6"],
          }
        ),
      ],
      factionEffects: [{ faction: "refugees", delta: 1 }],
    }),
    choice({
      id: "D",
      label: "Ask them to exaggerate the story",
      description: "Push for a more heroic version and hope the court never sees the seams.",
      outcomeText:
        "The myth grows louder, but its edges begin to look staged.",
      memoryEffects: [
        withStorySource(
          publicRumor(
            "Exaggerated Rescue Story",
            "A swollen public tale claims the caravan broke a siege of fever camps in a single night.",
            "Fox Market rumor circuit",
            0.61,
            "incriminating"
          ),
          {
            source: "Crow Market Story Swap",
            sourceNpcId: "crowBrokerNarrator",
            faction: "crowBrokers",
            tags: ["route-pool", "contradiction", "rumor-route", "day-band-5-6"],
          }
        ),
      ],
      factionEffects: [
        { faction: "crowBrokers", delta: 1 },
        { faction: "bearCourt", delta: -1 },
      ],
    }),
  ],
};

const smugglerDebtCall: StoryScene = {
  id: "smuggler-debt-call",
  phase: "loop_one",
  day: 6,
  location: "Fox Market",
  title: "Smuggler Debt Call",
  description:
    "A Fox debt collector insists the caravan owes the market for medicine moved through unofficial channels.",
  involvedNpcIds: ["foxLedgerMaster", "royalTaxOfficer", "crowBrokerNarrator"],
  routeTags: ["merchant", "failure"],
  choices: [
    choice({
      id: "A",
      label: "Accept the debt and negotiate settlement",
      description: "Treat the claim as leverage and try to turn it into survivable paperwork.",
      outcomeText:
        "The debt stays dangerous, but it also becomes something Fox Market can later close on paper.",
      memoryEffects: [
        withStorySource(
          publicContract(
            "Debt Negotiation Record",
            "A Fox Market negotiation note records that the caravan entered debt talks rather than denying the claim outright.",
            "Fox Market side ledger",
            0.76,
            "neutral"
          ),
          {
            source: "Fox Debt Table",
            sourceNpcId: "foxLedgerMaster",
            faction: "foxMarket",
            tags: ["route-pool", "merchant-route", "day-band-6"],
          }
        ),
      ],
      factionEffects: [{ faction: "foxMarket", delta: 1 }],
    }),
    choice({
      id: "B",
      label: "Challenge the debt publicly",
      description: "Force the collector to defend the claim under public eyes.",
      outcomeText:
        "The claim looks shakier, but Fox Market marks the caravan as less cooperative from this point on.",
      memoryEffects: [
        withStorySource(
          publicRumor(
            "Collector Threat Rumor",
            "A market rumor spreads that Fox debt collectors threatened the caravan over medicine routes.",
            "Fox Market outer stalls",
            0.64,
            "neutral"
          ),
          {
            source: "Market Witness Chain",
            sourceNpcId: "crowBrokerNarrator",
            faction: "crowBrokers",
            tags: ["route-pool", "merchant-route", "rumor-route", "day-band-6"],
          }
        ),
      ],
      factionEffects: [
        { faction: "foxMarket", delta: -1 },
        { faction: "crowBrokers", delta: 1 },
      ],
    }),
    choice({
      id: "C",
      label: "Pay the collector quietly",
      description: "Spend silver to reduce noise and keep the debt from growing teeth.",
      outcomeText:
        "The collector takes the payment, but the route still carries the mark of having needed a payoff.",
      memoryEffects: [
        withStorySource(
          publicContract(
            "Black Market Debt Note",
            "A private-market note marks that the caravan paid against a medicine-related debt claim.",
            "Fox Market side ledger",
            0.74,
            "incriminating"
          ),
          {
            source: "Debt Collector Receipt",
            sourceNpcId: "foxLedgerMaster",
            faction: "foxMarket",
            tags: ["route-pool", "merchant-route", "legal-risk", "day-band-6"],
          }
        ),
      ],
      factionEffects: [{ faction: "foxMarket", delta: 1 }],
      resourceEffects: { silver: -2, legalRisk: 1 },
    }),
    choice({
      id: "D",
      label: "Run from the collector",
      description: "Refuse the claim entirely and accept the mark it leaves.",
      outcomeText:
        "The caravan keeps its coins, but the debt becomes a harder record instead of a negotiable one.",
      memoryEffects: [
        withStorySource(
          publicRecord(
            "Unpaid Debt Mark",
            "A Fox route note marks the caravan as having fled a medicine debt claim.",
            "Fox Market route board",
            0.79,
            "incriminating"
          ),
          {
            source: "Fox Route Debt Board",
            sourceNpcId: "foxLedgerMaster",
            faction: "foxMarket",
            tags: ["route-pool", "failure-route", "day-band-6"],
          }
        ),
      ],
      factionEffects: [{ faction: "foxMarket", delta: -2 }],
      resourceEffects: { legalRisk: 1 },
    }),
  ],
};

const crowStoryBackfires: StoryScene = {
  id: "crow-story-backfires",
  phase: "loop_two",
  day: 9,
  location: "Fox Market",
  title: "Crow Story Backfires",
  description:
    "A heroic Crow story mutates into a harsher claim that the caravan stole medicine for fame rather than necessity.",
  involvedNpcIds: ["crowBrokerNarrator", "foxLedgerMaster", "campHealer"],
  routeTags: ["rumor", "failure"],
  choices: [
    choice({
      id: "A",
      label: "Correct the story through Crow channels",
      description: "Spend influence to pull the public version back toward something consistent.",
      outcomeText:
        "The correction is imperfect, but it keeps the road from hardening around the ugliest version.",
      memoryEffects: [
        withStorySource(
          publicRumor(
            "Corrected Crow Broadside",
            "A revised broadside re-centers the caravan’s story on fever, delay, and public need rather than vanity.",
            "Fox Market broadside wall",
            0.7,
            "favorable"
          ),
          {
            source: "Crow Correction Sheet",
            sourceNpcId: "crowBrokerNarrator",
            faction: "crowBrokers",
            tags: ["route-pool", "public-sympathy", "rumor-route", "day-band-9-11"],
          }
        ),
      ],
      factionEffects: [{ faction: "crowBrokers", delta: 1 }],
    }),
    choice({
      id: "B",
      label: "Double down on the heroic myth",
      description: "Trust that bigger stories drown smaller doubts.",
      outcomeText:
        "The myth grows, but so does the gap between what the court can prove and what the road wants to believe.",
      memoryEffects: [
        withStorySource(
          publicRumor(
            "Distorted Hero Rumor",
            "A hero story spreads that the caravan staged danger so the rescue would travel farther.",
            "Fox Market broadside wall",
            0.67,
            "incriminating"
          ),
          {
            source: "Crow Market Broadside",
            sourceNpcId: "crowBrokerNarrator",
            faction: "crowBrokers",
            tags: ["route-pool", "contradiction", "rumor-route", "day-band-9-11"],
          }
        ),
      ],
      factionEffects: [{ faction: "crowBrokers", delta: 1 }],
    }),
    choice({
      id: "C",
      label: "Blame Fox Market",
      description: "Push public attention toward the merchants who profited from scarcity.",
      outcomeText:
        "The whisper helps only if later records can keep up with it.",
      memoryEffects: [
        withStorySource(
          publicRumor(
            "Market Blame Whisper",
            "A Crow whisper claims Fox Market turned fever into a price ladder before the caravan was blamed.",
            "Fox Market rumor circuit",
            0.63,
            "neutral"
          ),
          {
            source: "Crow Counterstory",
            sourceNpcId: "crowBrokerNarrator",
            faction: "crowBrokers",
            tags: ["route-pool", "system-evidence", "rumor-route", "day-band-9-11"],
          }
        ),
      ],
      factionEffects: [
        { faction: "crowBrokers", delta: 1 },
        { faction: "foxMarket", delta: -1 },
      ],
    }),
    choice({
      id: "D",
      label: "Silence the couriers",
      description: "Trade reach for control and accept the stain that leaves behind.",
      outcomeText:
        "The rumor slows, but the method becomes part of the story too.",
      memoryEffects: [
        withStorySource(
          publicRumor(
            "Silenced Courier Story",
            "A public story claims the caravan leaned on couriers to suppress an inconvenient version of events.",
            "Fox Market rumor lane",
            0.66,
            "incriminating"
          ),
          {
            source: "Courier Complaint Chain",
            sourceNpcId: "crowBrokerNarrator",
            faction: "crowBrokers",
            tags: ["route-pool", "contradiction", "rumor-route", "day-band-9-11"],
          }
        ),
      ],
      factionEffects: [
        { faction: "crowBrokers", delta: -2 },
        { faction: "bearCourt", delta: -1 },
      ],
    }),
  ],
};

const deerArchivistsIndex: StoryScene = {
  id: "deer-archivists-index",
  phase: "loop_two",
  day: 10,
  location: "Deer Village",
  title: "Deer Archivist’s Index",
  description:
    "A Deer archivist can compare old medicine ledgers with current tax orders and make the missing pattern official.",
  involvedNpcIds: ["villageApothecary", "royalTaxOfficer", "bearJudgeAuthority"],
  routeTags: ["truth", "failure"],
  choices: [
    choice({
      id: "A",
      label: "Request an official copy",
      description: "Ask for a clean record that links archive entries to the shortage.",
      outcomeText:
        "The official copy is dry and hard to dispute. It turns suspicion into something legible to court clerks.",
      memoryEffects: [
        withStorySource(
          publicRecord(
            "Archive Index Match",
            "An archive comparison shows that missing medicine entries line up with later tax hold references.",
            "Deer Village archive desk",
            0.86,
            "favorable"
          ),
          {
            source: "Deer Archive Copy",
            sourceNpcId: "villageApothecary",
            faction: "deerVillage",
            tags: ["route-pool", "truth-route", "system-evidence", "day-band-10-11"],
          }
        ),
      ],
      factionEffects: [{ faction: "deerVillage", delta: 1 }],
    }),
    choice({
      id: "B",
      label: "Ask the archivist to testify",
      description: "Push the archive from paper into a living witness line.",
      outcomeText:
        "The archivist resists politics, but the testimony note still strengthens the chain around missing medicine.",
      memoryEffects: [
        withStorySource(
          publicRecord(
            "Missing Medicine Entry",
            "An archivist note identifies a missing medicine entry later mirrored in tax paperwork.",
            "Deer Village archive desk",
            0.82,
            "favorable"
          ),
          {
            source: "Archivist Testimony Note",
            sourceNpcId: "villageApothecary",
            faction: "deerVillage",
            tags: ["route-pool", "truth-route", "system-evidence", "day-band-10-11"],
          }
        ),
      ],
      factionEffects: [{ faction: "deerVillage", delta: 1 }],
    }),
    choice({
      id: "C",
      label: "Steal the index page",
      description: "Take the proof fast and trust that the theft will not overshadow the contents.",
      outcomeText:
        "The page leaves the archive, but the method gives Deer Village one more reason to distrust the caravan.",
      memoryEffects: [
        withStorySource(
          publicRecord(
            "Stolen Archive Page",
            "A Deer archive notice records that a key medicine index page disappeared after the caravan’s visit.",
            "Deer Village archive door",
            0.78,
            "incriminating"
          ),
          {
            source: "Archive Loss Notice",
            sourceNpcId: "villageApothecary",
            faction: "deerVillage",
            tags: ["route-pool", "contradiction", "day-band-10-11"],
          }
        ),
      ],
      factionEffects: [{ faction: "deerVillage", delta: -2 }],
      resourceEffects: { legalRisk: 1 },
    }),
    choice({
      id: "D",
      label: "Leave the archive alone",
      description: "Avoid risk and settle for a smaller pattern instead of a full copy.",
      outcomeText:
        "The caravan leaves with a thinner pattern note rather than a dramatic theft or testimony.",
      memoryEffects: [
        withStorySource(
          publicRecord(
            "Tax Hold Pattern",
            "A brief archive summary notes that several tax holds cluster around the same medicine routes.",
            "Deer Village archive desk",
            0.78,
            "favorable"
          ),
          {
            source: "Archivist Pattern Summary",
            sourceNpcId: "villageApothecary",
            faction: "deerVillage",
            tags: ["route-pool", "truth-route", "system-evidence", "day-band-10-11"],
          }
        ),
      ],
      factionEffects: [{ faction: "deerVillage", delta: 0 }],
    }),
  ],
};

const marketSettlementDinner: StoryScene = {
  id: "market-settlement-dinner",
  phase: "loop_two",
  day: 10,
  location: "Fox Market",
  title: "Market Settlement Dinner",
  description:
    "Fox Market offers a private settlement that could clean the caravan’s name while leaving the medicine monopoly intact.",
  involvedNpcIds: ["foxLedgerMaster", "royalTaxOfficer", "bearJudgeAuthority"],
  routeTags: ["merchant", "truth", "failure"],
  choices: [
    choice({
      id: "A",
      label: "Sign the settlement",
      description: "Take the market’s protection and accept the deeper price later.",
      outcomeText:
        "The paperwork is clean enough to matter. Fox Market now expects the caravan to stop digging.",
      memoryEffects: [
        withStorySource(
          publicContract(
            "Market Settlement Contract",
            "A sealed Fox Market contract recognizes a procedural settlement around the medicine accusation.",
            "Fox Market private dining ledger",
            0.86,
            "favorable"
          ),
          {
            source: "Fox Settlement Table",
            sourceNpcId: "foxLedgerMaster",
            faction: "foxMarket",
            tags: ["route-pool", "merchant-route", "day-band-10-12"],
          }
        ),
      ],
      factionEffects: [{ faction: "foxMarket", delta: 2 }],
    }),
    choice({
      id: "B",
      label: "Negotiate better terms",
      description: "Push for protections without fully exposing the market.",
      outcomeText:
        "The terms remain cautious, but the caravan gets language it may later use as leverage.",
      memoryEffects: [
        withStorySource(
          publicContract(
            "Sealed Liability Clause",
            "A sealed clause limits caravan liability without naming the larger medicine structure directly.",
            "Fox Market private dining ledger",
            0.79,
            "neutral"
          ),
          {
            source: "Fox Settlement Clause",
            sourceNpcId: "foxLedgerMaster",
            faction: "foxMarket",
            tags: ["route-pool", "merchant-route", "day-band-10-12"],
          }
        ),
      ],
      factionEffects: [{ faction: "foxMarket", delta: 1 }],
    }),
    choice({
      id: "C",
      label: "Secretly copy the price-control clause",
      description: "Accept the dinner but leave with evidence the court could later turn on the market.",
      outcomeText:
        "The clause is the sort of clean paper Bear Court respects if the caravan can survive long enough to show it.",
      memoryEffects: [
        withStorySource(
          publicContract(
            "Price Control Clause",
            "A copied settlement clause shows Fox Market discussing medicine price control during the shortage window.",
            "Fox Market private dining ledger",
            0.82,
            "favorable"
          ),
          {
            source: "Copied Settlement Clause",
            sourceNpcId: "foxLedgerMaster",
            faction: "foxMarket",
            tags: ["route-pool", "truth-route", "system-evidence", "day-band-10-12"],
          }
        ),
      ],
      factionEffects: [
        { faction: "foxMarket", delta: -1 },
        { faction: "bearCourt", delta: 1 },
      ],
    }),
    choice({
      id: "D",
      label: "Reject the dinner",
      description: "Refuse the settlement and leave the market to tell its own story about the refusal.",
      outcomeText:
        "The market loses patience and the road learns that the caravan walked away from a quiet exit.",
      memoryEffects: [
        withStorySource(
          publicRumor(
            "Rejected Settlement Rumor",
            "Fox Market rumor says the caravan rejected a clean settlement and chose risk instead.",
            "Fox Market dinner circuit",
            0.62,
            "neutral"
          ),
          {
            source: "Dinner Service Whisper",
            sourceNpcId: "crowBrokerNarrator",
            faction: "crowBrokers",
            tags: ["route-pool", "merchant-route", "rumor-route", "day-band-10-12"],
          }
        ),
      ],
      factionEffects: [{ faction: "foxMarket", delta: -2 }],
    }),
  ],
};

const refugeeSongFestival: StoryScene = {
  id: "refugee-song-festival",
  phase: "loop_two",
  day: 10,
  location: "River Refugee Camp",
  title: "Refugee Song Festival",
  description:
    "Refugees prepare a public festival that could fix the caravan as savior in road memory while irritating every official watching.",
  involvedNpcIds: ["campHealer", "crowBrokerNarrator", "bearJudgeAuthority"],
  routeTags: ["rumor", "truth"],
  choices: [
    choice({
      id: "A",
      label: "Encourage the festival",
      description: "Let gratitude become a public chorus that travels farther than any single clerk.",
      outcomeText:
        "The song becomes impossible to ignore. Bear Court may not trust it as law, but the road will remember.",
      memoryEffects: [
        withStorySource(
          publicSong(
            "Festival Witness Chorus",
            "A public festival chorus names the blue caravan as the one that answered fever when official routes did not.",
            "River Refugee Camp square",
            0.79,
            "favorable"
          ),
          {
            source: "Festival Chorus Sheet",
            sourceNpcId: "campHealer",
            faction: "refugees",
            tags: ["route-pool", "public-sympathy", "rumor-route", "day-band-10-12"],
          }
        ),
      ],
      factionEffects: [{ faction: "refugees", delta: 2 }],
    }),
    choice({
      id: "B",
      label: "Make the song legally precise",
      description: "Trade a little warmth for a version less likely to collapse under scrutiny.",
      outcomeText:
        "The ballad loses some mythic power, but it gains enough precision to help rather than merely glow.",
      memoryEffects: [
        withStorySource(
          publicSong(
            "Precise Healing Ballad",
            "A carefully edited refugee song names dates, camp conditions, and missing medicine with unusual precision.",
            "River Refugee Camp square",
            0.8,
            "favorable"
          ),
          {
            source: "Edited Festival Ballad",
            sourceNpcId: "campHealer",
            faction: "refugees",
            tags: ["route-pool", "public-sympathy", "truth-route", "day-band-10-12"],
          }
        ),
      ],
      factionEffects: [
        { faction: "refugees", delta: 1 },
        { faction: "bearCourt", delta: 1 },
      ],
    }),
    choice({
      id: "C",
      label: "Keep names anonymous",
      description: "Protect vulnerable singers while keeping the festival alive.",
      outcomeText:
        "The song still travels, though the court will hear the missing names as caution rather than strength.",
      memoryEffects: [
        withStorySource(
          publicSong(
            "Anonymous Shelter Song",
            "A shelter song praises the caravan without naming the most vulnerable witnesses behind it.",
            "River Refugee Camp square",
            0.7,
            "favorable"
          ),
          {
            source: "Anonymous Festival Chorus",
            sourceNpcId: "campHealer",
            faction: "refugees",
            tags: ["route-pool", "public-sympathy", "rumor-route", "day-band-10-12"],
          }
        ),
      ],
      factionEffects: [{ faction: "refugees", delta: 1 }],
    }),
    choice({
      id: "D",
      label: "Cancel the festival",
      description: "Reduce irritation and noise before court, at the cost of public momentum.",
      outcomeText:
        "The silence calms officials, but it also leaves a rumor that the caravan feared public memory more than it trusted it.",
      memoryEffects: [
        withStorySource(
          publicRumor(
            "Cancelled Festival Rumor",
            "A rumor spreads that the caravan suppressed a refugee festival on the eve of court attention.",
            "River Refugee Camp rumor lane",
            0.58,
            "neutral"
          ),
          {
            source: "Camp Stall Whisper",
            sourceNpcId: "crowBrokerNarrator",
            faction: "crowBrokers",
            tags: ["route-pool", "rumor-route", "day-band-10-12"],
          }
        ),
      ],
      factionEffects: [{ faction: "refugees", delta: -1 }],
    }),
  ],
};

const medicinePriceSpike: StoryScene = {
  id: "medicine-price-spike",
  phase: "loop_two",
  day: 11,
  location: "Deer Village",
  title: "Medicine Price Spike",
  description:
    "Villagers discover medicine prices doubled after the accusation, opening a chance to turn public anger into proof, leverage, or rumor.",
  involvedNpcIds: ["villageApothecary", "foxLedgerMaster", "crowBrokerNarrator"],
  routeTags: ["truth", "merchant", "rumor"],
  choices: [
    choice({
      id: "A",
      label: "Publish the price spike record",
      description: "Make the price surge visible as something measurable rather than whispered.",
      outcomeText:
        "The record is plain enough for court and sharp enough for villagers to understand instantly.",
      memoryEffects: [
        withStorySource(
          publicRecord(
            "Price Spike Record",
            "A village price sheet shows medicine costs doubling after the theft accusation hardened.",
            "Deer Village market board",
            0.81,
            "favorable"
          ),
          {
            source: "Village Price Board",
            sourceNpcId: "villageApothecary",
            faction: "deerVillage",
            tags: ["route-pool", "truth-route", "system-evidence", "day-band-11-12"],
          }
        ),
      ],
      factionEffects: [
        { faction: "deerVillage", delta: -1 },
        { faction: "bearCourt", delta: 1 },
      ],
    }),
    choice({
      id: "B",
      label: "Use it in Fox settlement talks",
      description: "Treat the data as leverage for a cleaner personal outcome.",
      outcomeText:
        "The number becomes a bargaining chip rather than a public accusation.",
      memoryEffects: [
        withStorySource(
          publicContract(
            "Settlement Leverage Note",
            "A settlement note records that medicine price inflation became part of the caravan’s negotiation leverage.",
            "Fox Market settlement ledger",
            0.77,
            "favorable"
          ),
          {
            source: "Fox Settlement Margin Note",
            sourceNpcId: "foxLedgerMaster",
            faction: "foxMarket",
            tags: ["route-pool", "merchant-route", "day-band-11-12"],
          }
        ),
      ],
      factionEffects: [{ faction: "foxMarket", delta: 1 }],
    }),
    choice({
      id: "C",
      label: "Turn it into a Crow story",
      description: "Let the public outrage travel faster than any audit can move.",
      outcomeText:
        "The story catches because the price pain is fresh and easy for people to recognize.",
      memoryEffects: [
        withStorySource(
          publicRumor(
            "Market Control Rumor",
            "A public rumor links the price spike to deliberate market control around the medicine shortage.",
            "Fox Market rumor circuit",
            0.68,
            "favorable"
          ),
          {
            source: "Crow Price Whisper",
            sourceNpcId: "crowBrokerNarrator",
            faction: "crowBrokers",
            tags: ["route-pool", "public-sympathy", "rumor-route", "system-evidence", "day-band-11-12"],
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
      label: "Ignore it as too indirect",
      description: "Leave the pattern alone and focus on more immediate problems.",
      outcomeText:
        "The chance passes into a fragile trace instead of a stable accusation.",
      memoryEffects: [
        withStorySource(
          shortTermMemory(
            "Ignored Price Trace",
            "A private trace notes that the caravan saw the price spike and let it pass unrecorded.",
            "Deer Village market lane",
            0.46,
            "neutral"
          ),
          {
            source: "Caravan Clerk Memory",
            tags: ["route-pool", "short-term", "day-band-11-12"],
          }
        ),
      ],
      factionEffects: [{ faction: "deerVillage", delta: 0 }],
    }),
  ],
};

const crowBrokersFinalSpin: StoryScene = {
  id: "crow-brokers-final-spin",
  phase: "loop_two",
  day: 12,
  location: "Fox Market",
  title: "Crow Broker’s Final Spin",
  description:
    "A Crow broker offers one last region-wide frame before Bear Court closes the doors and freezes the public story.",
  involvedNpcIds: ["crowBrokerNarrator", "foxLedgerMaster", "bearJudgeAuthority"],
  routeTags: ["rumor", "merchant", "truth"],
  choices: [
    choice({
      id: "A",
      label: "Spread the hero narrative",
      description: "Leave the road with one final story of rescue rather than theft.",
      outcomeText:
        "The broadside moves quickly and gives public sympathy one last surge before court dawn.",
      memoryEffects: [
        withStorySource(
          publicRumor(
            "Final Hero Broadside",
            "A final Crow broadside frames the blue caravan as the road’s last honest answer to fever and delay.",
            "Fox Market broadside wall",
            0.73,
            "favorable"
          ),
          {
            source: "Final Crow Sheet",
            sourceNpcId: "crowBrokerNarrator",
            faction: "crowBrokers",
            tags: ["route-pool", "public-sympathy", "rumor-route", "day-band-12"],
          }
        ),
      ],
      factionEffects: [{ faction: "crowBrokers", delta: 1 }],
    }),
    choice({
      id: "B",
      label: "Spread a merchant-friendly settlement story",
      description: "Prepare the public to accept a quiet procedural close.",
      outcomeText:
        "The road hears that the case is becoming paperwork rather than scandal.",
      memoryEffects: [
        withStorySource(
          publicRumor(
            "Merchant-Friendly Rumor",
            "A final rumor claims the caravan and Fox Market are nearing a clean settlement that will calm the roads.",
            "Fox Market broadside wall",
            0.7,
            "favorable"
          ),
          {
            source: "Fox-Friendly Crow Sheet",
            sourceNpcId: "crowBrokerNarrator",
            faction: "crowBrokers",
            tags: ["route-pool", "merchant-route", "rumor-route", "day-band-12"],
          }
        ),
      ],
      factionEffects: [
        { faction: "crowBrokers", delta: 1 },
        { faction: "foxMarket", delta: 1 },
      ],
    }),
    choice({
      id: "C",
      label: "Spread an anti-tax officer story",
      description: "Push blame upward and hope later records can carry it the rest of the way.",
      outcomeText:
        "The story is sharp and risky. Without support, it could sound like desperation rather than exposure.",
      memoryEffects: [
        withStorySource(
          publicRumor(
            "Anti-Tax Officer Rumor",
            "A final regional story claims the royal tax officer engineered the medicine shortage and framed the caravan.",
            "Fox Market broadside wall",
            0.66,
            "favorable"
          ),
          {
            source: "Crow Anti-Tax Sheet",
            sourceNpcId: "crowBrokerNarrator",
            faction: "crowBrokers",
            tags: ["route-pool", "system-evidence", "rumor-route", "day-band-12"],
          }
        ),
      ],
      factionEffects: [{ faction: "crowBrokers", delta: 1 }],
    }),
    choice({
      id: "D",
      label: "Refuse final spin",
      description: "Decline one more public frame and rely on the quieter record instead.",
      outcomeText:
        "The choice leaves no stable story behind, only a fading trace that the caravan walked away from one last chance to define itself.",
      memoryEffects: [
        withStorySource(
          shortTermMemory(
            "Refused Spin Memory",
            "A private memory recalls that the caravan declined a final public spin before court.",
            "Fox Market side room",
            0.52,
            "neutral"
          ),
          {
            source: "Crow Broker Meeting",
            tags: ["route-pool", "short-term", "day-band-12"],
          }
        ),
      ],
      factionEffects: [{ faction: "crowBrokers", delta: -1 }],
    }),
  ],
};

const finalCounterOffer: StoryScene = {
  id: "final-counter-offer",
  phase: "loop_two",
  day: 12,
  location: "Bear Court",
  title: "Final Counter-Offer",
  description:
    "On the courthouse steps, Deer/Bear legalists, Fox merchants, and Crow brokers each offer one incompatible way to frame the final story.",
  involvedNpcIds: ["bearJudgeAuthority", "foxLedgerMaster", "crowBrokerNarrator"],
  routeTags: ["truth", "merchant", "rumor"],
  choices: [
    choice({
      id: "A",
      label: "Accept Deer/Bear legal compromise",
      description: "Trade a cleaner legal path for a smaller truth.",
      outcomeText:
        "The compromise does not expose everything, but it gives the court a language for partial justification.",
      memoryEffects: [
        withStorySource(
          publicRecord(
            "Deer Apology Draft",
            "A draft compromise notes that Deer Village may soften its accusation if the court frames the case as emergency misconduct rather than simple theft.",
            "Bear Court courthouse steps",
            0.78,
            "favorable"
          ),
          {
            source: "Deer-Bear Courthouse Draft",
            sourceNpcId: "bearJudgeAuthority",
            faction: "bearCourt",
            tags: ["route-pool", "truth-route", "day-band-12"],
          }
        ),
      ],
      factionEffects: [
        { faction: "bearCourt", delta: 1 },
        { faction: "deerVillage", delta: 1 },
      ],
    }),
    choice({
      id: "B",
      label: "Accept Fox sealed release",
      description: "Take the market’s clean exit and let the deeper road stay rotten.",
      outcomeText:
        "The release is the sort of paper that closes cases even when it solves nothing underneath.",
      memoryEffects: [
        withStorySource(
          publicContract(
            "Fox Sealed Release",
            "A sealed Fox release offers to close liability around the caravan if the market framing remains intact.",
            "Bear Court courthouse steps",
            0.82,
            "favorable"
          ),
          {
            source: "Fox Courthouse Release",
            sourceNpcId: "foxLedgerMaster",
            faction: "foxMarket",
            tags: ["route-pool", "merchant-route", "day-band-12"],
          }
        ),
      ],
      factionEffects: [{ faction: "foxMarket", delta: 2 }],
    }),
    choice({
      id: "C",
      label: "Accept Crow hero oath",
      description: "Let the public frame outrun the court by binding it to one last promise.",
      outcomeText:
        "The oath is emotionally powerful, and that may matter more than procedural caution once the road takes hold of it.",
      memoryEffects: [
        withStorySource(
          publicSong(
            "Crow Hero Oath",
            "A public oath-song binds the blue caravan to the story of saving lives when officials failed.",
            "Bear Court courthouse steps",
            0.75,
            "favorable"
          ),
          {
            source: "Crow Oath Performance",
            sourceNpcId: "crowBrokerNarrator",
            faction: "crowBrokers",
            tags: ["route-pool", "public-sympathy", "rumor-route", "day-band-12"],
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
      label: "Reject all offers",
      description: "Keep the final story entirely in the caravan’s own hands.",
      outcomeText:
        "The refusal preserves independence, but it also leaves behind a thin record that every faction offered help the caravan would not take.",
      memoryEffects: [
        withStorySource(
          publicRecord(
            "Rejected Offers Note",
            "A courthouse note records that the caravan rejected legal, merchant, and public-frame help on the eve of the hearing.",
            "Bear Court courthouse steps",
            0.74,
            "neutral"
          ),
          {
            source: "Courthouse Offer Ledger",
            sourceNpcId: "bearJudgeAuthority",
            faction: "bearCourt",
            tags: ["route-pool", "timeline-evidence", "day-band-12"],
          }
        ),
      ],
      factionEffects: [{ faction: "bearCourt", delta: -1 }],
    }),
  ],
};

export const gameScenePool: StoryScene[] = [
  withSelectionMeta(gameScenes[0], { dayOptions: [1], selectionBucket: "anchor", isAnchor: true }),
  withSelectionMeta(gameScenes[1], { dayOptions: [2, 3], selectionBucket: "early" }),
  withSelectionMeta(gameScenes[2], { dayOptions: [2, 3, 4], selectionBucket: "early" }),
  withSelectionMeta(gameScenes[3], { dayOptions: [3, 4, 5], selectionBucket: "early" }),
  withSelectionMeta(gameScenes[4], { dayOptions: [3, 4, 5], selectionBucket: "early" }),
  withSelectionMeta(gameScenes[5], { dayOptions: [4, 5, 6], selectionBucket: "early" }),
  withSelectionMeta(borderTollInspection, { dayOptions: [4, 5, 6], selectionBucket: "early" }),
  withSelectionMeta(rabbitWitnessAtMistwood, { dayOptions: [5, 6], selectionBucket: "early" }),
  withSelectionMeta(blackMarketPriceList, { dayOptions: [5, 6], selectionBucket: "early" }),
  withSelectionMeta(refugeeWitnessCircle, { dayOptions: [5, 6], selectionBucket: "early" }),
  withSelectionMeta(smugglerDebtCall, { dayOptions: [6], selectionBucket: "early" }),
  withSelectionMeta(gameScenes[6], { dayOptions: [7], selectionBucket: "anchor", isAnchor: true }),
  withSelectionMeta(gameScenes[7], { dayOptions: [8], selectionBucket: "late" }),
  withSelectionMeta(gameScenes[8], { dayOptions: [8, 9], selectionBucket: "late" }),
  withSelectionMeta(gameScenes[9], { dayOptions: [9, 10], selectionBucket: "late" }),
  withSelectionMeta(crowStoryBackfires, { dayOptions: [9, 10, 11], selectionBucket: "late" }),
  withSelectionMeta(deerArchivistsIndex, { dayOptions: [10, 11], selectionBucket: "late" }),
  withSelectionMeta(marketSettlementDinner, { dayOptions: [10, 11, 12], selectionBucket: "late" }),
  withSelectionMeta(refugeeSongFestival, { dayOptions: [10, 11, 12], selectionBucket: "late" }),
  withSelectionMeta(gameScenes[10], { dayOptions: [11, 12], selectionBucket: "late" }),
  withSelectionMeta(medicinePriceSpike, { dayOptions: [11, 12], selectionBucket: "late" }),
  withSelectionMeta(gameScenes[11], { dayOptions: [12], selectionBucket: "late" }),
  withSelectionMeta(crowBrokersFinalSpin, { dayOptions: [12], selectionBucket: "late" }),
  withSelectionMeta(gameScenes[12], { dayOptions: [13], selectionBucket: "anchor", isAnchor: true }),
  withSelectionMeta(finalCounterOffer, { dayOptions: [12], selectionBucket: "late" }),
  withSelectionMeta(gameScenes[13], { dayOptions: [14], selectionBucket: "anchor", isAnchor: true }),
];

export const anchorSceneIds = new Set([
  "deer-village-medicine-conflict",
  "first-memory-collapse-night",
  "court-packet-sorting",
  "eve-of-bear-court",
]);

export function getSceneTemplateById(sceneId: string) {
  return gameScenePool.find((scene) => scene.id === sceneId) ?? null;
}

export const initialGameState: GameState = createInitialGameState();
