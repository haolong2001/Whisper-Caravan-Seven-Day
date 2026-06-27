export type SceneIllustration = {
  src: string;
  alt: string;
};

export const sceneIllustrations: Record<string, SceneIllustration> = {
  "deer-village-medicine-conflict": {
    src: "/images/scenes/event_01_deer_village_medicine_conflict.png",
    alt: "Deer Village medicine conflict at the caravan gates.",
  },
  "fever-at-river-camp": {
    src: "/images/scenes/event_02_fever_at_river_camp.png",
    alt: "A fever outbreak spreading through the River Refugee Camp.",
  },
  "tax-seal-on-the-crates": {
    src: "/images/scenes/event_03_tax_seal_on_the_crates.png",
    alt: "Tax-sealed medicine crates waiting under suspicion.",
  },
  "fox-ledger-offer": {
    src: "/images/scenes/event_04_fox_ledger_offer.png",
    alt: "A fox merchant presenting a ledger offer in the market.",
  },
  "crow-relay-framing": {
    src: "/images/scenes/event_05_crow_relay_framing.png",
    alt: "Crow brokers shaping the public story around the caravan.",
  },
  "deer-doctors-hidden-diary": {
    src: "/images/scenes/event_06_deer_doctors_hidden_diary.png",
    alt: "A hidden diary discovered among Deer Village records.",
  },
  "first-memory-collapse-night": {
    src: "/images/scenes/event_07_first_memory_collapse_night.png",
    alt: "The first memory collapse night settling over Bear Court.",
  },
  "return-to-deer-village-gate": {
    src: "/images/scenes/event_08_return_to_deer_village_gate.png",
    alt: "The caravan returning to the Deer Village gate.",
  },
  "bear-court-intake-window": {
    src: "/images/scenes/event_09_bear_court_intake_window.png",
    alt: "Bear Court clerks receiving papers at the intake window.",
  },
  "fox-audit-second-pass": {
    src: "/images/scenes/event_10_fox_audit_second_pass.png",
    alt: "A second audit pass unfolding in Fox Market.",
  },
  "tax-officers-travel-ledger": {
    src: "/images/scenes/event_11_tax_officers_travel_ledger.png",
    alt: "A tax officer travel ledger opened for inspection.",
  },
  "witness-contradiction-hearing": {
    src: "/images/scenes/event_12_witness_contradiction_hearing.png",
    alt: "A witness contradiction hearing inside Bear Court.",
  },
  "court-packet-sorting": {
    src: "/images/scenes/event_13_court_packet_sorting.png",
    alt: "Court packets being sorted ahead of the verdict.",
  },
  "eve-of-bear-court": {
    src: "/images/scenes/event_14_eve_of_bear_court.png",
    alt: "The tense eve of Bear Court before judgment.",
  },
  "border-toll-inspection": {
    src: "/images/scenes/event_15_border_toll_inspection.png",
    alt: "A border toll inspection stopping the caravan on the road.",
  },
  "rabbit-witness-at-mistwood": {
    src: "/images/scenes/event_16_rabbit_witness_at_mistwood.png",
    alt: "A rabbit witness speaking near Mistwood.",
  },
  "black-market-price-list": {
    src: "/images/scenes/event_17_black_market_price_list.png",
    alt: "A black-market price list tied to the medicine trade.",
  },
  "refugee-witness-circle": {
    src: "/images/scenes/event_18_refugee_witness_circle.png",
    alt: "Refugees gathering in a witness circle to remember events.",
  },
  "smuggler-debt-call": {
    src: "/images/scenes/event_19_smuggler_debt_call.png",
    alt: "A smuggler debt call tightening around the caravan.",
  },
  "crow-story-backfires": {
    src: "/images/scenes/event_20_crow_story_backfires.png",
    alt: "A crow broker story turning back against its maker.",
  },
  "deer-archivists-index": {
    src: "/images/scenes/event_21_deer_archivists_index.png",
    alt: "A Deer archivist's index opened for cross-reference.",
  },
  "market-settlement-dinner": {
    src: "/images/scenes/event_22_market_settlement_dinner.png",
    alt: "A quiet market settlement dinner with hidden terms.",
  },
  "refugee-song-festival": {
    src: "/images/scenes/event_23_refugee_song_festival.png",
    alt: "A refugee song festival carrying the caravan's story.",
  },
  "medicine-price-spike": {
    src: "/images/scenes/event_24_medicine_price_spike.png",
    alt: "Medicine prices spiking across Deer Village stalls.",
  },
  "crow-brokers-final-spin": {
    src: "/images/scenes/event_25_crow_brokers_final_spin.png",
    alt: "Crow brokers making a final attempt to spin the verdict.",
  },
  "final-counter-offer": {
    src: "/images/scenes/event_26_final_counter_offer.png",
    alt: "A final counter-offer placed before Bear Court closes the case.",
  },
};

export function getSceneIllustration(sceneId: string | null | undefined) {
  if (!sceneId) {
    return null;
  }

  return sceneIllustrations[sceneId] ?? null;
}
