import {
  Choice,
  FactionState,
  GameEvent,
  GameResources,
  GameState,
  MemoryEffect,
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

export const initialSceneStatus =
  "Day 1 begins in Deer Village. Each choice can create memories, shift factions, and change what survives the seven-day forgetting boundary.";

export const initialNpcResponse =
  "No NPC has queried the memory trail yet. Public evidence will accumulate as the caravan moves through the week.";

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

export const initialGameState: GameState = {
  currentDay: 1,
  memories: [],
  factions: initialFactions,
  resources: initialResources,
  dayChoices: {},
  sceneStatus: initialSceneStatus,
  hasAppliedDay8: false,
};

export const day8Aftermath = {
  location: "Deer Village Gate",
  title: "Day 8 Aftermath",
  description:
    "Seven days have passed. The oldest short-term traces are gone, but public records, songs, and rumors still travel faster than a caravan can hide.",
};

export const gameEvents: GameEvent[] = [
  {
    id: "deer-village-medicine-conflict",
    day: 1,
    location: "Deer Village",
    title: "Deer Village Medicine Conflict",
    description:
      "The village apothecary has sealed its stock after a refugee convoy begged for fever medicine. A Deer Guard blocks the storeroom while children in the caravan burn with heat.",
    choices: [
      choice({
        id: "A",
        label: "Buy the medicine legally",
        description:
          "Pay the apothecary's full price and leave a clean, public paper trail.",
        outcomeText:
          "You pay in silver and leave with medicine under a lawful receipt. The village notes the transaction, and the refugees remember that you chose order over speed.",
        memoryEffects: [
          publicRecord(
            "Apothecary Receipt",
            "The apothecary ledger records that a blue caravan paid full tariff for fever medicine.",
            "Deer Village records hall",
            0.94,
            "favorable"
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
          "Break the storeroom seal, take the medicine, and outrun the guard's shout.",
        outcomeText:
          "You steal the medicine and keep the sick alive through the night. The act leaves three traces behind: a witness memory, a wanted notice, and a song that refuses to stay quiet.",
        memoryEffects: [
          shortTermMemory(
            "Deer Guard Saw the Theft",
            "A Deer Guard saw the caravan break the storeroom seal and flee with medicine crates.",
            "Deer Village witness memory",
            0.88,
            "incriminating"
          ),
          publicRecord(
            "Wanted Notice",
            "A blue caravan is wanted for stealing medicine from Deer Village.",
            "Village records board",
            0.96,
            "incriminating"
          ),
          publicSong(
            "Refugee Song",
            "Refugees sing of the blue caravan that stole medicine and kept the sick alive through the night.",
            "Roadside song network",
            0.68,
            "incriminating"
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
        label: "Walk away",
        description:
          "Protect the caravan's position and leave the village to its own laws.",
        outcomeText:
          "You leave the gate untouched. No public scandal follows, but the camp remembers who turned away when fever took hold.",
        memoryEffects: [
          shortTermMemory(
            "Children Watched You Leave",
            "The refugee children saw the blue caravan turn away from the sealed storeroom.",
            "Refugee camp memory",
            0.42,
            "neutral"
          ),
        ],
        factionEffects: [{ faction: "refugees", delta: -2 }],
      }),
      choice({
        id: "D",
        label: "Bribe the guard to forge records",
        description:
          "Slip silver into the guard's palm and rewrite the inventory count.",
        outcomeText:
          "The guard accepts your silver and muddies the ledger, but the mismatch itself becomes a trace. The village may not know the whole truth, yet it can smell tampering.",
        memoryEffects: [
          publicRecord(
            "Tampered Storeroom Ledger",
            "The storeroom inventory no longer matches the official count after a blue caravan passed through.",
            "Deer Village records hall",
            0.74,
            "incriminating"
          ),
          publicRumor(
            "Whispered Bribe Story",
            "Stablehands whisper that a blue caravan paid silver to quiet a guard.",
            "Village square gossip",
            0.56,
            "incriminating"
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
    ],
  },
  {
    id: "river-refugee-camp",
    day: 2,
    location: "River Refugee Camp",
    title: "River Refugee Camp",
    description:
      "The caravan reaches a flooded camp where ferrymen sell passage by the blanket. The refugees need medicine, warmth, and a way across before the current rises.",
    choices: [
      choice({
        id: "A",
        label: "Share medicine openly",
        description:
          "Treat the fevered in daylight and let the camp see where the doses came from.",
        outcomeText:
          "The camp gathers around your wagon without fear. The open treatment becomes a story almost immediately, and the refugees begin singing about the blue caravan again.",
        memoryEffects: [
          publicSong(
            "Camp Blessing Song",
            "At the river camp, refugees sing that the blue caravan shared medicine in open sight.",
            "River camp fire circles",
            0.73,
            "favorable"
          ),
        ],
        factionEffects: [{ faction: "refugees", delta: 2 }],
        resourceEffects: {
          medicine: -1,
          provisions: -1,
        },
      }),
      choice({
        id: "B",
        label: "Demand labor for aid",
        description:
          "Offer doses only to those who unload the caravan and work the rope bridge.",
        outcomeText:
          "The camp accepts because it must, but the bargain curdles into gossip before nightfall. The refugees remember the price you named.",
        memoryEffects: [
          publicRumor(
            "Work-for-Medicine Story",
            "Boatmen say the blue caravan demanded labor before it would part with medicine.",
            "River trading line",
            0.58,
            "neutral"
          ),
        ],
        factionEffects: [
          { faction: "refugees", delta: -1 },
          { faction: "foxMarket", delta: 1 },
        ],
        resourceEffects: {
          provisions: 1,
        },
      }),
      choice({
        id: "C",
        label: "Hide the sick in reed boats",
        description:
          "Cover the weakest refugees and slip them past the ferry toll in silence.",
        outcomeText:
          "You get the families across, but a river scout notices the hidden stretchers. The memory may fade, yet for now it points straight at your route.",
        memoryEffects: [
          shortTermMemory(
            "River Scout Saw the Stretchers",
            "A river scout saw covered stretchers loaded into reed boats beside your caravan.",
            "River patrol memory",
            0.71,
            "incriminating"
          ),
        ],
        factionEffects: [
          { faction: "refugees", delta: 1 },
          { faction: "bearCourt", delta: -1 },
        ],
        resourceEffects: {
          provisions: -1,
          legalRisk: 1,
        },
      }),
      choice({
        id: "D",
        label: "Trade passage to a ferryman",
        description:
          "Buy a legal crossing and let the ferryman log your caravan in his manifest.",
        outcomeText:
          "You secure a clean crossing, but the manifest pins your movements to the river. It is not hostile evidence, yet it becomes part of the world all the same.",
        memoryEffects: [
          publicRecord(
            "Ferry Crossing Manifest",
            "A river manifest lists the passage of a blue caravan with refugees and sealed crates.",
            "Ferryman ledger",
            0.77,
            "neutral"
          ),
        ],
        factionEffects: [{ faction: "foxMarket", delta: 1 }],
        resourceEffects: {
          silver: -1,
          provisions: 1,
        },
      }),
    ],
  },
  {
    id: "fox-market-ledger-deal",
    day: 3,
    location: "Fox Market",
    title: "Fox Market Ledger Deal",
    description:
      "In Fox Market, every favor is priced twice: once in coin, once in paperwork. A ledger-master offers to fix your route history if you deal on his terms.",
    choices: [
      choice({
        id: "A",
        label: "Sign the honest contract",
        description:
          "Accept fair weights, clean taxes, and an official trade record.",
        outcomeText:
          "You take the honest deal. The market records your caravan as a lawful buyer, and the fox merchants nod at a player willing to stay on the page.",
        memoryEffects: [
          publicRecord(
            "Fox Market Contract",
            "The Fox Market ledger records the blue caravan as a lawful buyer operating on honest weights.",
            "Fox Market counting house",
            0.89,
            "favorable"
          ),
        ],
        factionEffects: [{ faction: "foxMarket", delta: 2 }],
        resourceEffects: {
          silver: 2,
        },
      }),
      choice({
        id: "B",
        label: "Buy silence and edit the ledger",
        description:
          "Pay to erase awkward lines and blur the movement of your wagon.",
        outcomeText:
          "The ledger is altered, but altered books always leave edges. The market may smile at your silver, yet the discrepancy becomes its own record.",
        memoryEffects: [
          publicRecord(
            "Ledger Discrepancy",
            "A Fox Market ledger carries a broken sequence around the blue caravan's stamp.",
            "Fox Market counting house",
            0.83,
            "incriminating"
          ),
        ],
        factionEffects: [{ faction: "foxMarket", delta: 1 }],
        resourceEffects: {
          silver: -1,
          legalRisk: 1,
        },
      }),
      choice({
        id: "C",
        label: "Sell the refugee roster",
        description:
          "Trade names and camp counts to brokers who prize foreknowledge over mercy.",
        outcomeText:
          "The market pays quickly, but the decision stains every future introduction. The refugees lose faith, and the copied roster begins to circulate.",
        memoryEffects: [
          publicRecord(
            "Copied Refugee Roster",
            "A copied roster from the river camp appears in Fox Market hands after your caravan's visit.",
            "Broker archive",
            0.79,
            "incriminating"
          ),
        ],
        factionEffects: [
          { faction: "refugees", delta: -2 },
          { faction: "foxMarket", delta: 1 },
          { faction: "bearCourt", delta: 1 },
        ],
        resourceEffects: {
          silver: 1,
          legalRisk: 1,
        },
      }),
      choice({
        id: "D",
        label: "Refuse the deal",
        description:
          "Keep your hands clean and leave the counting house empty-handed.",
        outcomeText:
          "You walk out before the ink dries. The market calls you cautious, perhaps unreliable, and the missed opportunity lingers only in private memory.",
        memoryEffects: [
          shortTermMemory(
            "Fox Broker Marked You as Wary",
            "A fox broker privately marked the blue caravan as too cautious for flexible deals.",
            "Fox broker memory",
            0.47,
            "neutral"
          ),
        ],
        factionEffects: [{ faction: "foxMarket", delta: -1 }],
      }),
    ],
  },
  {
    id: "crow-relay-station",
    day: 4,
    location: "Crow Relay Station",
    title: "Crow Relay Station",
    description:
      "Every message that crosses the uplands touches a Crow relay at least once. Tonight, dispatches about border searches and refugee movement hang on drying lines in the station loft.",
    choices: [
      choice({
        id: "A",
        label: "Pay couriers to spread your version",
        description:
          "Commission a flattering account of the caravan's week before hostile stories harden.",
        outcomeText:
          "The crows sell you reach and speed. By nightfall, your version of the week has become a traveler song moving ahead of the wagon.",
        memoryEffects: [
          publicSong(
            "Relay Station Ballad",
            "Crow couriers pass along a ballad claiming the blue caravan saved lives where officials stalled.",
            "Crow relay songline",
            0.7,
            "favorable"
          ),
        ],
        factionEffects: [{ faction: "crowBrokers", delta: 2 }],
        resourceEffects: {
          silver: -1,
        },
      }),
      choice({
        id: "B",
        label: "Intercept a hostile dispatch",
        description:
          "Break a seal, read the message, and keep it from leaving the station.",
        outcomeText:
          "You stop the dispatch, but the act itself is seen. The Crows may not know the contents you feared, yet they know whose hands were on the paper.",
        memoryEffects: [
          shortTermMemory(
            "Crow Runner Saw the Broken Seal",
            "A Crow runner saw the blue caravan handling a dispatch with its seal broken.",
            "Crow runner memory",
            0.76,
            "incriminating"
          ),
        ],
        factionEffects: [{ faction: "crowBrokers", delta: -2 }],
        resourceEffects: {
          legalRisk: 1,
        },
      }),
      choice({
        id: "C",
        label: "Ask for secret routes",
        description:
          "Trade discretion for side-road intelligence and off-book crossings.",
        outcomeText:
          "The brokers name side roads for a price. No formal record is filed, but rumors now tie your caravan to paths used by people avoiding scrutiny.",
        memoryEffects: [
          publicRumor(
            "Side-Road Whisper",
            "Crow brokers whisper that the blue caravan prefers routes no magistrate can easily follow.",
            "Crow broker network",
            0.62,
            "neutral"
          ),
        ],
        factionEffects: [
          { faction: "crowBrokers", delta: 1 },
          { faction: "bearCourt", delta: -1 },
        ],
        resourceEffects: {
          silver: -1,
          provisions: 1,
        },
      }),
      choice({
        id: "D",
        label: "Leave no trace",
        description:
          "Keep the lantern low, say little, and move out before anyone marks your destination.",
        outcomeText:
          "You avoid the station's public channels, but a clerk still remembers the wagon at dusk. The trace is weak and private, yet not entirely absent.",
        memoryEffects: [
          shortTermMemory(
            "Silent Blue Caravan at Dusk",
            "A relay clerk remembers a blue caravan leaving the station without sending a single message.",
            "Crow relay clerk memory",
            0.4,
            "neutral"
          ),
        ],
        factionEffects: [{ faction: "crowBrokers", delta: -1 }],
      }),
    ],
  },
  {
    id: "bear-border-checkpoint",
    day: 5,
    location: "Bear Border Checkpoint",
    title: "Bear Border Checkpoint",
    description:
      "The mountain road narrows at a Bear Court checkpoint where every axle, crate, and passenger is counted against the toll book. Magistrates are checking for smugglers and missing medicine.",
    choices: [
      choice({
        id: "A",
        label: "Submit to inspection",
        description:
          "Let the court search the caravan and enter you into the border log.",
        outcomeText:
          "The inspection is slow but clean. A border record now exists in your favor, and the Bear Court has less reason to guess at your cargo.",
        memoryEffects: [
          publicRecord(
            "Border Log Clearance",
            "The Bear Court border log clears the blue caravan after a full inspection.",
            "Border archive",
            0.91,
            "favorable"
          ),
        ],
        factionEffects: [
          { faction: "bearCourt", delta: 2 },
          { faction: "deerVillage", delta: 1 },
        ],
        resourceEffects: {
          provisions: -1,
        },
      }),
      choice({
        id: "B",
        label: "Bribe the magistrate",
        description:
          "Trade silver for a quick stamp and a magistrate willing not to look too closely.",
        outcomeText:
          "The stamp is real, but the manner of getting it is not invisible. The court whispers long after a bribe is paid, especially at a border line.",
        memoryEffects: [
          publicRumor(
            "Checkpoint Bribe Story",
            "Border workers whisper that silver changed hands before the blue caravan received its stamp.",
            "Checkpoint rumor chain",
            0.63,
            "incriminating"
          ),
        ],
        factionEffects: [{ faction: "bearCourt", delta: -2 }],
        resourceEffects: {
          silver: -2,
          legalRisk: 2,
        },
      }),
      choice({
        id: "C",
        label: "Smuggle refugees through grain carts",
        description:
          "Hide families beneath empty sacks and trust the checkpoint to count badly.",
        outcomeText:
          "The families pass, but someone hears coughing from the sealed carts. The clue is private for now, yet it points toward a charge if it survives long enough.",
        memoryEffects: [
          shortTermMemory(
            "Checkpoint Porter Heard Coughing",
            "A checkpoint porter heard coughing inside the grain carts pulled by the blue caravan.",
            "Bear Court porter memory",
            0.79,
            "incriminating"
          ),
        ],
        factionEffects: [
          { faction: "refugees", delta: 2 },
          { faction: "bearCourt", delta: -2 },
        ],
        resourceEffects: {
          provisions: -1,
          legalRisk: 2,
        },
      }),
      choice({
        id: "D",
        label: "Accuse a rival caravan",
        description:
          "Offer the court a better target and let another wagon absorb the scrutiny.",
        outcomeText:
          "The court records your tip and shifts its attention elsewhere. You buy breathing room, but Fox Market will hear about the tactic before long.",
        memoryEffects: [
          publicRecord(
            "Checkpoint Tip Entry",
            "A Bear Court report notes that the blue caravan provided a smuggling tip about a rival wagon.",
            "Border archive",
            0.75,
            "neutral"
          ),
        ],
        factionEffects: [
          { faction: "bearCourt", delta: 1 },
          { faction: "foxMarket", delta: -1 },
        ],
      }),
    ],
  },
  {
    id: "fog-forest-witness",
    day: 6,
    location: "Fog Forest Witness",
    title: "Fog Forest Witness",
    description:
      "In the Fog Forest, an old hermit claims to have seen the Deer Village theft from the hillside. The witness can help, hurt, or complicate your story depending on how you handle the encounter.",
    choices: [
      choice({
        id: "A",
        label: "Ask the witness to testify for you",
        description:
          "Invite the hermit to tell the court why the medicine was taken and who it saved.",
        outcomeText:
          "The hermit agrees to speak. The testimony is slow and imperfect, but it places your choice in moral rather than purely criminal terms.",
        memoryEffects: [
          publicRecord(
            "Hermit Testimony",
            "A forest hermit states that the blue caravan carried medicine to fevered children after Deer Village refused aid.",
            "Traveling witness statement",
            0.86,
            "favorable"
          ),
        ],
        factionEffects: [
          { faction: "bearCourt", delta: 1 },
          { faction: "deerVillage", delta: 1 },
        ],
      }),
      choice({
        id: "B",
        label: "Threaten the witness into silence",
        description:
          "End the testimony before it can travel and trust fear to do the rest.",
        outcomeText:
          "The hermit falls silent, but fear leaves its own shadow. By dawn, the forest already carries a darker version of the meeting.",
        memoryEffects: [
          publicRumor(
            "Vanished Hermit Story",
            "Travelers whisper that a forest hermit went silent after speaking with the blue caravan.",
            "Fog Forest rumor path",
            0.67,
            "incriminating"
          ),
        ],
        factionEffects: [
          { faction: "bearCourt", delta: -2 },
          { faction: "refugees", delta: -1 },
        ],
        resourceEffects: {
          legalRisk: 2,
        },
      }),
      choice({
        id: "C",
        label: "Pay for silence",
        description:
          "Buy the hermit's quiet and leave before the story has a shape.",
        outcomeText:
          "The witness takes your silver and lowers their eyes. The moment never becomes public, but the private memory is not one you control forever.",
        memoryEffects: [
          shortTermMemory(
            "Witness Took Your Silver",
            "The hermit remembers taking silver from the blue caravan and saying nothing more.",
            "Fog Forest witness memory",
            0.61,
            "incriminating"
          ),
        ],
        factionEffects: [{ faction: "bearCourt", delta: -1 }],
        resourceEffects: {
          silver: -2,
          legalRisk: 1,
        },
      }),
      choice({
        id: "D",
        label: "Escort the witness safely onward",
        description:
          "Protect the hermit from the road and let the gesture become the message.",
        outcomeText:
          "You give up speed to keep the hermit safe. Travelers remember the scene more kindly than any prepared statement could manage.",
        memoryEffects: [
          publicSong(
            "Fog Road Escort Song",
            "Travelers hum about the blue caravan guarding an old hermit through the fog.",
            "Upland songline",
            0.72,
            "favorable"
          ),
        ],
        factionEffects: [
          { faction: "bearCourt", delta: 1 },
          { faction: "refugees", delta: 1 },
        ],
        resourceEffects: {
          provisions: -1,
        },
      }),
    ],
  },
  {
    id: "memory-collapse-night",
    day: 7,
    location: "Memory Collapse Night",
    title: "Memory Collapse Night",
    description:
      "The caravan camps under a sky with no moon. By dawn, Day 1's short-term witness traces will fall away, leaving only what became public enough to endure.",
    choices: [
      choice({
        id: "A",
        label: "Catalogue the week in a public journal",
        description:
          "Write your version of the journey and let the pages circulate where they may.",
        outcomeText:
          "You choose preservation through publication. The journal becomes one more public record entering the world before morning.",
        memoryEffects: [
          publicRecord(
            "Caravan Night Journal",
            "A public journal claims the blue caravan acted under necessity throughout the week.",
            "Night market copybook",
            0.81,
            "favorable"
          ),
        ],
        factionEffects: [{ faction: "crowBrokers", delta: 1 }],
      }),
      choice({
        id: "B",
        label: "Let the refugees sing the whole road",
        description:
          "Encourage every saved family to turn the week into a song before dawn.",
        outcomeText:
          "The campfire turns memory into chorus. Whatever else fades tomorrow, the road will still carry a melody about your caravan.",
        memoryEffects: [
          publicSong(
            "Nightfire Chorus",
            "The refugees spend the collapse night singing the full tale of the blue caravan's road.",
            "Night camp songline",
            0.74,
            "favorable"
          ),
        ],
        factionEffects: [{ faction: "refugees", delta: 1 }],
      }),
      choice({
        id: "C",
        label: "Burn the private notes",
        description:
          "Destroy loose notes, coded marks, and anything that could renew a witness trail later.",
        outcomeText:
          "You feed the fire with every private scrap you can spare. The choice does not erase public stories, but it lowers the caravan's own risk appetite before dawn.",
        memoryEffects: [
          shortTermMemory(
            "Ash on the Dawn Wind",
            "Only the caravan remembers how many private notes went into the collapse-night fire.",
            "Caravan firelight memory",
            0.33,
            "neutral"
          ),
        ],
        factionEffects: [],
        resourceEffects: {
          legalRisk: -1,
        },
      }),
      choice({
        id: "D",
        label: "Rehearse a false alibi",
        description:
          "Make every voice in the camp repeat the same cleaner version of the week.",
        outcomeText:
          "The alibi spreads too evenly to sound natural. By morning it has become a rumor in its own right, and not one that helps much.",
        memoryEffects: [
          publicRumor(
            "Practiced Alibi Story",
            "Travelers hear the blue caravan giving the same polished answer to every question about the week.",
            "Night road gossip",
            0.62,
            "incriminating"
          ),
        ],
        factionEffects: [{ faction: "bearCourt", delta: -1 }],
        resourceEffects: {
          legalRisk: 1,
        },
      }),
    ],
  },
];
