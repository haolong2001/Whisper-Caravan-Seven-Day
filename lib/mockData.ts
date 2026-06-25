import { ChoiceOption, MemoryItem } from "@/lib/types";

export const deerVillageLocation = "Deer Village";

export const deerVillageEvent =
  "The village apothecary has sealed its stock after a refugee convoy begged for fever medicine. A Deer Guard blocks the storeroom and demands clean paperwork while children in the caravan burn with heat.";

export const choiceOptions: ChoiceOption[] = [
  {
    id: "A",
    title: "Buy the medicine legally",
    description: "Pay the apothecary's full price and leave a clean transaction trail.",
  },
  {
    id: "B",
    title: "Steal the medicine to save refugees",
    description: "Break the storeroom seal, take the medicine, and move before the guard can stop you.",
  },
  {
    id: "C",
    title: "Walk away",
    description: "Preserve your caravan's safety and let the village handle its own shortage.",
  },
  {
    id: "D",
    title: "Bribe the guard to forge records",
    description: "Slip silver into the guard's palm and rewrite the inventory ledger.",
  },
];

export const initialSceneStatus =
  "Choose how the caravan responds. v0.1 tracks how one decision becomes memories, how seven-day forgetting filters them, and how an NPC reacts to what remains public.";

export const initialNpcResponse =
  "The Deer Guard has not queried any active public evidence yet.";

export const theftMemories: MemoryItem[] = [
  {
    id: "m1",
    title: "Guard Witnessed the Theft",
    text: "A Deer Guard saw the caravan break the storeroom seal and flee with medicine crates.",
    type: "short_term",
    visibility: "private",
    location: "Deer Village witness memory",
    createdDay: 1,
    expiresOn: 8,
    persistent: false,
    active: true,
  },
  {
    id: "m2",
    title: "Wanted Notice",
    text: "A blue caravan is wanted for stealing medicine from Deer Village.",
    type: "record",
    visibility: "public",
    location: "Village records board",
    createdDay: 1,
    persistent: true,
    active: true,
  },
  {
    id: "m3",
    title: "Refugee Song",
    text: "Refugees sing of the blue caravan that stole medicine and kept the sick alive through the night.",
    type: "song",
    visibility: "public",
    location: "Roadside song network",
    createdDay: 1,
    persistent: true,
    active: true,
  },
];
