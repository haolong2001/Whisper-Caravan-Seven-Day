# Whisper Caravan v0.5 Story Spec

## 1. Design Scope

Whisper Caravan v0.5 focuses on event cards, evidence, route logic, trial scoring, and endings only. This spec is intended as a story and content design document, not an implementation plan.

The game should feel like one major event per day. The underlying scene model may support more than one scene per day, but the player-facing rhythm should remain daily: one day, one major event card, one meaningful choice.

A single playthrough lasts fourteen player-facing days. The Bear Court trial occurs after Day 14, functioning as the resolution phase rather than a normal daily event.

The target content pool is twenty-six event cards. A single playthrough uses a route-dependent subset of fourteen cards, not the entire pool.

## 2. Story Premise

### Surface Accusation

The player is accused of stealing medicine from Deer Village.

A wanted notice claims that a blue caravan broke the apothecary storeroom seal and fled with fever medicine. Deer Village sees the player as a thief. Bear Court treats the accusation as a serious trade-road crime. Fox Market sees an opportunity. Crow brokers see a story worth selling. Refugees remember who lived because medicine reached them in time.

### Hidden Truth

The medicine crisis was not a simple theft.

The royal tax officer illegally withheld medicine by holding shipments under tax authority, while Fox Market black market actors controlled the practical flow of medicine and raised prices through artificial scarcity.

The player may have taken medicine, purchased medicine, forged access, or avoided the situation depending on the Day 1 choice. The central question is not only what the player did, but whether the surviving evidence can prove that the player’s actions were justified in a corrupt system.

### Player Goal

Before the Bear Court trial after Day 14, the player must collect enough surviving records, contracts, songs, rumors, testimony, and witness traces to prove one of several possible narratives:

- The player was justified because the medicine was being illegally withheld.
- The player is no longer legally vulnerable because Fox Market has cleaned the records.
- The player is remembered by the public as a hero even if the court remains unconvinced.
- The player failed to preserve a coherent defense and is convicted.

## 3. Core Design Sentence

The player is not simply trying to erase the theft. The player is deciding what kind of evidence survives long enough to explain it.

## 4. Player-Facing Pacing

### Daily Structure

- Day 1: Accusation setup.
- Days 2–6: Investigation, survival, and route leaning.
- Day 7: First memory collapse event.
- Days 8–12: Consequences and stronger route commitment.
- Day 13: Court packet preparation.
- Day 14: Eve of Bear Court.
- Day 15: Trial and ending resolution, not a normal event card.

### Playthrough Structure

Each playthrough should include fourteen major event cards:

- Four structural anchor cards are always included.
- Ten additional cards are selected from the wider event pool based on route pressure, previous choices, evidence created, faction standings, and legal risk.

### Structural Anchor Cards

These cards should appear in every run:

1. Day 1: Deer Village Medicine Conflict
2. Day 7: First Memory Collapse Night
3. Day 13: Court Packet Sorting
4. Day 14: Eve of Bear Court

## 5. Route Overview

## Route A: Truth / Court Evidence

### Route Fantasy

I can prove the system was corrupt.

### Core Narrative

The player collects reliable legal evidence showing that the medicine shortage was engineered by the royal tax officer and enforced through Fox Market control. The player may not be morally spotless, but the evidence shows that the situation was not ordinary theft.

### Desired Evidence

- Public records
- Contracts
- Official ledgers
- Witness statements converted into durable court-readable form
- Evidence linking the royal tax officer to medicine withholding
- Evidence linking Fox Market to black market control
- Evidence proving the refugees needed medicine urgently

### Route Strengths

- Strongest route in Bear Court.
- Can produce full or partial exoneration.
- Best at exposing the hidden truth.

### Route Weaknesses

- Requires reliable evidence, not just sympathy.
- Takes time and risks retaliation from Fox Market.
- Incriminating records may still prevent full clearance.

### Ending Direction

The player receives partial or full vindication in Bear Court, but trust between Deer Village, the refugee camps, Fox Market, and Bear Court remains damaged.

## Route B: Merchant

### Route Fantasy

I can survive by making the books clean.

### Core Narrative

The player makes a deal with Fox Market to clean, settle, or redirect the official record. The player is no longer treated as a wanted criminal, but the underlying black market medicine system survives and becomes stronger.

### Desired Evidence

- Fox Market settlement contract
- Clean audit seal
- Paid debt note
- Route ledger correction
- Liability clause
- Merchant testimony

### Route Strengths

- Reliable path to personal safety.
- Does not require fully proving the hidden truth.
- Works well when the player has Fox Market favor or enough silver.

### Route Weaknesses

- Does not fix the medicine crisis.
- May strengthen black market control.
- Bear Court may accept the paperwork without understanding the full truth.

### Ending Direction

The player is no longer wanted, but Fox Market controls medicine prices more openly by the end of the run.

## Route C: Rumor

### Route Fantasy

If the court will not save me, the road will remember me.

### Core Narrative

The player uses Crow brokers, refugee songs, public sympathy, and heroic rumor to overwhelm the official wanted notice. The player may not win a clean legal victory, but the public remembers the caravan as a savior.

### Desired Evidence

- Refugee songs
- Crow broadsides
- Public hero rumors
- Festival chorus
- Roadside testimony
- Emotionally powerful but legally weak public memory

### Route Strengths

- Strong public identity.
- Can protect the caravan socially even without legal proof.
- Works well with high refugee and Crow broker reputation.

### Route Weaknesses

- Rumors can mutate.
- Songs may not satisfy Bear Court.
- Official suspicion can survive despite public admiration.

### Ending Direction

The people call the player a hero, but Bear Court and Deer Village officials remain suspicious.

## Route D: Failure

### Route Fantasy

The world remembers everything wrong.

### Core Narrative

The player reaches Bear Court with unreliable, contradictory, expired, or incriminating evidence. The court sees theft, tampering, bribery, false alibis, and rumors that fail to form a coherent defense.

### Failure Evidence

- Wanted notice remains dominant.
- Key witnesses expire or are never formalized.
- Tampered ledgers suggest guilt.
- Rumors contradict each other.
- Legal risk remains high.
- No route score reaches a viable threshold.

### Ending Direction

Bear Court finds the player guilty. The caravan is expelled, Deer Village bars its gates, and Fox Market profits from the chaos.

## 6. Evidence Families

Evidence families describe narrative function. They do not require new evidence types. Existing evidence can still be represented as records, contracts, songs, rumors, or short-term memories.

| Evidence Family | Narrative Purpose | Best Route | Examples |
|---|---|---|---|
| Act Evidence | Proves what the player did during the medicine incident | A or D | Wanted Notice, Broken Storeroom Seal, Guard Witness Memory |
| Necessity Evidence | Proves the medicine was urgently needed | A or C | Refugee Treatment Roster, Fever Camp Record, Deer Doctor Diary |
| System Evidence | Proves the royal tax officer and Fox Market controlled medicine flow | A | Royal Tax Hold Order, Fox Medicine Stock Ledger, Tax Officer Travel Ledger |
| Settlement Evidence | Proves legal exposure was cleaned, settled, or redirected | B | Market Settlement Contract, Fox Audit Seal, Paid Debt Note |
| Public Sympathy Evidence | Changes public memory of the caravan | C | Camp Healing Song, Crow Hero Broadside, Festival Witness Chorus |
| Contradiction Evidence | Damages credibility by creating inconsistency or suspicion | D | Tampered Ledger, False Alibi Rumor, Conflicting Witness Sheet |

## 7. Evidence Type Guidance

### Record

Records are durable, public, and strong in Bear Court. They are best for Route A and sometimes Route B.

Example uses:

- Official ledger
- Court filing
- Border log
- Archive index
- Written testimony
- Price record

### Contract

Contracts are durable and formal. They are strong for Route B and can support Route A when they expose market structure.

Example uses:

- Market settlement
- Audit seal
- Debt release
- Trade agreement
- Liability clause

### Song

Songs are public and durable as social memory. They are strong for Route C but weak in Bear Court unless supported by reliable records.

Example uses:

- Refugee healing song
- Nightfire chorus
- Festival song
- Roadside ballad

### Rumor

Rumors spread quickly and influence public pressure, market behavior, and Crow broker outcomes. They can help Route C but are dangerous if unsupported or contradictory.

Example uses:

- Crow whisper
- Market gossip
- Tax officer accusation
- False alibi
- Distorted hero story

### Short-Term Memory

Short-term memories are private or fragile witness traces. They are useful early but may expire unless converted into public, persistent evidence before memory collapse.

Example uses:

- Guard saw the theft
- Clerk noticed hidden payment
- Witness remembers tax wagons
- Porter heard coughing in carts

## 8. Route Logic

## Route A Logic: Truth / Court Evidence

Route A grows when the player creates reliable public records or contracts that prove the hidden truth.

### A Route Increases From

- Royal tax evidence.
- Fox Market medicine-flow evidence.
- Refugee necessity evidence.
- Court intake filings.
- Authenticated witness statements.
- Clean border or archive records.

### A Route Decreases From

- Tampered ledgers.
- False alibis.
- Unsupported conspiracy rumors.
- Destroyed evidence.
- High legal risk without legal explanation.

### A Route Required Narrative Chain

For a strong A ending, the player should ideally prove:

1. Medicine was unavailable because it was withheld or controlled.
2. The withholding was linked to the royal tax officer.
3. Fox Market profited from the shortage.
4. Refugees faced urgent medical need.
5. The player’s actions were therefore justified or partially justified.

## Route B Logic: Merchant

Route B grows when the player accepts market settlement, makes ledgers consistent, and prioritizes survivable paperwork over public truth.

### B Route Increases From

- Signing Fox Market settlement.
- Paying or resolving debt.
- Receiving Fox Audit Seal.
- Keeping Fox Market relations positive.
- Reducing direct legal exposure through contracts.

### B Route Decreases From

- Exposing Fox Market too strongly.
- Burning merchant bridges.
- Failing to pay debts.
- Creating public accusations against the market.
- Contradictory records that make settlement impossible.

### B Route Required Narrative Chain

For a strong B ending, the player should prove:

1. Fox Market recognizes a settlement.
2. The caravan’s route records are now clean enough.
3. Bear Court can close the case procedurally.
4. The medicine market remains unresolved.

## Route C Logic: Rumor

Route C grows when the player creates a consistent public hero narrative through Crow brokers, refugee songs, and public sympathy.

### C Route Increases From

- Refugee songs.
- Crow broadsides.
- Public healing acts.
- Festival witness chorus.
- High refugee and Crow broker faction standing.
- Heroic public narrative that remains consistent.

### C Route Decreases From

- Rumor mutation.
- Contradictory songs.
- Public evidence of bribery or coercion.
- Anti-court rhetoric that provokes Bear Court.
- Public sympathy unsupported by any facts.

### C Route Required Narrative Chain

For a strong C ending, the public should believe:

1. The caravan saved lives.
2. Officials failed to act quickly enough.
3. Refugees personally remember the caravan as protectors.
4. The wanted notice is morally incomplete, even if legally unresolved.

## Route D Logic: Failure

Route D occurs when no other route reaches enough strength, or when contradiction and legal risk overwhelm all favorable evidence.

### D Route Increases From

- Wanted Notice remains unanswered.
- Broken Storeroom Seal is supported by other incriminating evidence.
- Tampered Ledger exists.
- False Alibi Rumor exists.
- Conflicting Witness Sheet exists.
- Key favorable witnesses expired before trial.
- High legal risk.
- Low Bear Court standing.

### D Route Required Narrative Chain

For failure, Bear Court effectively sees:

1. The caravan was accused of medicine theft.
2. The caravan left behind suspicious or forged records.
3. The defense relies on rumors or songs without legal support.
4. Witnesses contradict each other.
5. No reliable evidence proves necessity or systemic corruption.

## 9. Trial Scoring Design

The trial should resolve from four score buckets. These scores can be shown to the player in stylized narrative form or kept mostly hidden, but the underlying logic should be deterministic and explainable.

## Score Bucket 1: Legal Truth Score

Legal Truth Score measures whether the player can prove the hidden truth in court.

### Increases From

- Reliable public records.
- Reliable contracts.
- Evidence of royal tax officer medicine withholding.
- Evidence of Fox Market medicine control.
- Evidence of refugee medical necessity.
- Court filings and authenticated testimony.

### Strong Evidence Examples

- Royal Tax Hold Order
- Tax Officer Travel Ledger
- Fox Medicine Stock Ledger
- Deer Doctor Diary
- Refugee Treatment Roster
- Crate Seal Date Mismatch
- Court Intake Statement

### Suggested Weighting

- High-reliability system record: +3
- High-reliability necessity record: +2
- Supported witness statement: +2
- Neutral record that supports timeline: +1
- Unsupported rumor about system corruption: +0 or +1 only if supported by records

## Score Bucket 2: Merchant Settlement Score

Merchant Settlement Score measures whether the player can survive through cleaned paperwork and market agreement.

### Increases From

- Fox Market settlement contract.
- Audit seal.
- Paid debt note.
- Clean route ledger.
- Fox Market faction standing.
- Low contradiction count in merchant documents.

### Strong Evidence Examples

- Market Settlement Contract
- Fox Audit Seal
- Sealed Liability Clause
- Clean-Looking Route Ledger
- Debt Note Paid in Full

### Suggested Weighting

- Market Settlement Contract: +4
- Fox Audit Seal: +3
- Paid debt / release: +2
- Clean ledger: +2
- Positive Fox Market standing: +1 or +2
- Evidence exposing Fox Market publicly: -2 to Merchant Settlement Score

## Score Bucket 3: Public Sympathy Score

Public Sympathy Score measures whether the road remembers the player as a hero.

### Increases From

- Refugee songs.
- Crow broadsides.
- Public gratitude.
- Festival chorus.
- High refugee standing.
- High Crow broker standing.
- Consistent heroic narrative.

### Strong Evidence Examples

- Camp Healing Song
- Refugee Song
- Crow Hero Broadside
- Festival Witness Chorus
- Roadside Savior Rumor
- Nightfire Chorus

### Suggested Weighting

- Major refugee song: +3
- Crow broadside: +2
- Public hero rumor: +1
- High refugee standing: +2
- High Crow broker standing: +1
- Distorted or contradictory rumor: -1 or -2

## Score Bucket 4: Failure Pressure

Failure Pressure measures whether the case against the player overwhelms the defense.

### Increases From

- Wanted Notice.
- Broken Storeroom Seal.
- Tampered Ledger.
- False Alibi Rumor.
- Conflicting Witness Sheet.
- High legal risk.
- Incriminating records.
- Unsupported rumors.
- Expired favorable witnesses.

### Strong Evidence Examples

- Wanted Notice
- Broken Storeroom Seal
- Tampered Storeroom Ledger
- Ledger Discrepancy
- False Alibi Rumor
- Conflicting Witness Sheet
- Black Market Debt Note

### Suggested Weighting

- Wanted Notice: +4
- High-reliability incriminating record: +3
- Tampered ledger: +2
- False alibi: +2
- Contradiction sheet: +2
- Each high legal risk threshold crossed: +1
- Expired key favorable witness: +1

## 10. Trial Outcome Priority

The trial should not simply choose the highest score. Outcome priority should reflect narrative logic.

### Priority 1: Full Truth

Triggered if Legal Truth Score is high, core system evidence exists, necessity evidence exists, and Failure Pressure is not too high.

### Priority 2: Partial Truth

Triggered if Legal Truth Score is medium-high, necessity is proven, but system evidence is incomplete or incriminating evidence remains significant.

### Priority 3: Merchant Settlement

Triggered if Merchant Settlement Score is high, Fox Market settlement evidence exists, and Legal Truth Score does not qualify for Truth endings.

### Priority 4: Folk Hero

Triggered if Public Sympathy Score is high, but Legal Truth Score and Merchant Settlement Score do not qualify for stronger legal or procedural outcomes.

### Priority 5: Guilty Exile

Triggered if no route reaches its threshold, or if Failure Pressure overwhelms the defense.

## 11. Ending Rules

## Ending A1: Full Truth / Public Justice

### Route

Route A: Truth / Court Evidence

### Trigger Conditions

- Legal Truth Score is high.
- At least one royal tax officer evidence exists.
- At least one Fox Market medicine-control evidence exists.
- At least one refugee necessity evidence exists.
- Failure Pressure is low or moderate.
- Bear Court has enough reliable public record or contract evidence to support the verdict.

### Ending Summary

Bear Court clears the caravan of simple theft and opens an inquiry into the royal tax officer and Fox Market medicine control.

### Ending Tone

Vindication, but not restoration.

### Ending Text Direction

The Bear Judge rules that the medicine incident cannot be treated as ordinary theft. Records show that shipments were withheld under royal tax authority and redirected through Fox Market channels. The caravan’s actions are judged necessary under emergency conditions.

Deer Village withdraws the wanted notice, but the apology is formal and cold. Refugees sing openly in the court square. Fox Market loses face, yet its deeper networks remain difficult to uproot. The caravan leaves cleared, but not innocent in everyone’s eyes.

## Ending A2: Partial Truth / Necessary Crime

### Route

Route A: Truth / Court Evidence

### Trigger Conditions

- Legal Truth Score is medium-high.
- Necessity evidence exists.
- Some system corruption evidence exists, but the full tax officer / Fox Market chain is incomplete.
- Incriminating act evidence remains active.
- Failure Pressure is moderate but not overwhelming.

### Ending Summary

Bear Court rules that the caravan’s actions were partially justified, but refuses to fully condemn the tax office or Fox Market.

### Ending Tone

Bittersweet compromise.

### Ending Text Direction

The court accepts that refugees needed medicine and that the village supply had been mishandled. However, the evidence does not fully prove the entire black market chain. The theft charge is reduced or amended rather than erased.

The caravan is allowed to continue under restrictions. Deer Village remains divided. Refugees remember the player as someone who acted when officials hesitated. Fox Market quietly survives the inquiry.

## Ending B: Merchant Settlement

### Route

Route B: Merchant

### Trigger Conditions

- Merchant Settlement Score is high.
- Market Settlement Contract or equivalent settlement evidence exists.
- Fox Audit Seal or clean ledger evidence exists.
- Legal Truth Score does not reach a Truth ending threshold.
- Failure Pressure is not high enough to override the settlement.

### Ending Summary

The player is no longer wanted, but Fox Market consolidates medicine control.

### Ending Tone

Personal survival, systemic loss.

### Ending Text Direction

Fox Market produces clean books, sealed clauses, and a settlement agreement that gives Bear Court a procedural exit. The wanted notice is withdrawn or quietly archived. The caravan’s name is usable again on trade roads.

By winter, medicine prices rise. Refugees learn that the caravan survived by signing papers with the very market that priced medicine beyond reach. The player is free, but the medicine road belongs more completely to Fox Market.

## Ending C: Folk Hero / Rumor Victory

### Route

Route C: Rumor

### Trigger Conditions

- Public Sympathy Score is high.
- Refugee or Crow broker standing is high.
- Public hero evidence exists.
- Legal Truth Score is insufficient for a Truth ending.
- Merchant Settlement Score is insufficient for a Merchant ending.
- Failure Pressure does not fully crush public sympathy.

### Ending Summary

The public calls the player a hero, but official suspicion remains.

### Ending Tone

Mythic but unstable.

### Ending Text Direction

Bear Court refuses full clearance. The official record remains cautious, and Deer Village still speaks of stolen medicine. But the road tells a different story.

Refugees paint blue caravan wheels on shelter doors. Crow broadsides retell the fever nights until the wanted notice sounds incomplete. The player leaves court under watch, neither cleared nor condemned in the hearts of the people.

## Ending D: Guilty Exile

### Route

Route D: Failure

### Trigger Conditions

- Legal Truth Score is low.
- Merchant Settlement Score is low.
- Public Sympathy Score is low or contradictory.
- Failure Pressure is high.
- Wanted Notice or other incriminating records remain dominant.
- Key favorable memories expired or were never formalized.

### Ending Summary

Bear Court finds the player guilty and expels the caravan.

### Ending Tone

Condemnation and loss.

### Ending Text Direction

The Bear Judge reads the surviving evidence: a wanted notice, a broken seal, a ledger gap, a false alibi, and songs that contradict one another. The court finds no reliable proof of necessity, no clean settlement, and no coherent defense.

The caravan is declared guilty of medicine theft and obstruction. Deer Village bars its gates. Refugee camps are warned not to shelter the caravan. Fox Market buys the abandoned routes before the dust settles.

## 12. Full 26 Event Card Pool

The following pool contains twenty-six event cards. A single playthrough should select fourteen cards from this pool, including the required anchor cards.

## Card 1: Deer Village Medicine Conflict

### Day Band

Day 1, mandatory.

### Route Lean

All routes.

### Premise

Deer Village has sealed its medicine stock while refugee children burn with fever. A Deer Guard blocks the apothecary storeroom. The player must decide whether to obey law, save lives, manipulate records, or leave.

### Main Tension

Lawful order versus urgent necessity.

### Possible Choices

- Buy medicine legally and create an apothecary receipt.
- Steal medicine to save refugees and create a wanted notice.
- Bribe the guard and create a tampered ledger.
- Walk away and create a private memory of abandonment.

### Possible Evidence

- Apothecary Receipt: record, favorable.
- Wanted Notice: record, incriminating.
- Broken Storeroom Seal: record, incriminating.
- Refugee Song: song, favorable or incriminating depending on framing.
- Tampered Storeroom Ledger: record, incriminating.

## Card 2: Fever at River Camp

### Day Band

Days 2–3.

### Route Lean

A / C.

### Premise

The refugees who received or needed medicine ask whether the caravan wants public thanks, formal testimony, or silence.

### Main Tension

Human need versus legal exposure.

### Possible Choices

- Treat refugees openly.
- Record a formal treatment roster.
- Keep the treatment secret.
- Demand labor or payment for aid.

### Possible Evidence

- Refugee Treatment Roster: record, favorable.
- Camp Healing Song: song, favorable.
- Quiet Aid Witness: short-term memory, favorable.
- Work-for-Medicine Story: rumor, neutral or incriminating.

## Card 3: Tax Seal on the Crates

### Day Band

Days 2–4.

### Route Lean

A.

### Premise

A medicine crate bears a royal tax seal dated before the alleged theft. The seal suggests that shipments were held by tax authority before Deer Village accused the player.

### Main Tension

Copy the truth legally, steal stronger proof, or trade the clue.

### Possible Choices

- Copy the seal in front of witnesses.
- Steal the original seal tag.
- Sell the clue to Fox Market.
- Ignore the seal to avoid risk.

### Possible Evidence

- Royal Tax Seal Copy: record, favorable.
- Crate Seal Date Mismatch: record, favorable.
- Stolen Seal Tag: record, neutral or incriminating.
- Fox Buyer Interest: rumor, neutral.

## Card 4: Fox Ledger Offer

### Day Band

Days 3–5.

### Route Lean

B / A / D.

### Premise

A Fox ledger-master offers to edit the caravan’s route history. The same ledger may also reveal medicine stock manipulation.

### Main Tension

Buy safety, expose fraud, or walk away.

### Possible Choices

- Pay to clean the route ledger.
- Demand to inspect the medicine stock columns.
- Refuse the offer.
- Accept a suspicious partial edit.

### Possible Evidence

- Clean-Looking Route Ledger: record, favorable for B.
- Ledger Discrepancy: record, incriminating.
- Fox Medicine Stock Ledger: record, favorable for A.
- Black Market Debt Note: contract, neutral or incriminating.

## Card 5: Crow Relay Framing

### Day Band

Days 3–5.

### Route Lean

C.

### Premise

Crow couriers offer to spread one version of the medicine story before the wanted notice hardens.

### Main Tension

Public story versus legal truth.

### Possible Choices

- Commission a hero broadside.
- Spread suspicion about the tax officer.
- Publish a careful factual notice.
- Create a false alibi.

### Possible Evidence

- Crow Hero Broadside: rumor, favorable.
- Tax Officer Whisper: rumor, neutral or favorable if later supported.
- Factual Road Notice: record, neutral.
- False Alibi Rumor: rumor, incriminating.

## Card 6: Deer Doctor’s Hidden Diary

### Day Band

Days 4–6.

### Route Lean

A.

### Premise

The Deer Doctor kept private notes showing medicine shortages, delayed shipments, and unexplained tax holds.

### Main Tension

Protect the doctor, publish the diary, or trade it away.

### Possible Choices

- Ask the doctor to file a formal statement.
- Copy the diary and protect the source.
- Sell the diary to Fox Market.
- Hide the diary to avoid retaliation.

### Possible Evidence

- Deer Doctor Diary: record, favorable.
- Missing Dose Table: record, favorable.
- Protected Doctor Statement: record, favorable.
- Suppressed Medical Note: short-term memory, neutral.

## Card 7: Border Toll Inspection

### Day Band

Days 4–6.

### Route Lean

A / B / D.

### Premise

Bear officers stop the caravan at a toll checkpoint and inspect cargo, route stamps, passengers, and medicine crates.

### Main Tension

Submit to law, bribe the law, or evade the law.

### Possible Choices

- Submit to inspection.
- Bribe the officer.
- Hide refugees in carts.
- Accuse a rival caravan.

### Possible Evidence

- Border Clearance Log: record, favorable.
- Suspicious Toll Stamp: record, incriminating.
- Porter Heard Coughing: short-term memory, incriminating.
- Checkpoint Tip Entry: record, neutral.

## Card 8: Rabbit Witness at Mistwood

### Day Band

Days 5–6.

### Route Lean

A / C.

### Premise

A Rabbit witness saw royal tax wagons moving medicine at night. The witness is afraid to speak publicly.

### Main Tension

Convert fragile memory into durable evidence before collapse.

### Possible Choices

- Record formal testimony.
- Escort the witness safely.
- Turn the story into a rumor.
- Leave the witness unprotected.

### Possible Evidence

- Rabbit Testimony: record, favorable.
- Night Tax Wagon Rumor: rumor, favorable if supported.
- Protected Witness Note: record, favorable.
- Unrecorded Witness Memory: short-term memory, favorable but fragile.

## Card 9: Black Market Price List

### Day Band

Days 5–6.

### Route Lean

A / B.

### Premise

A hidden price sheet shows that medicine prices rose before the alleged theft, suggesting planned scarcity.

### Main Tension

Expose market control or use the evidence for leverage.

### Possible Choices

- Copy the price list.
- Buy the list from a clerk.
- Trade it back to Fox Market.
- Destroy it for favor.

### Possible Evidence

- Medicine Price List: record, favorable.
- Fox Supply Markup: record, favorable.
- Buyer List Fragment: record, neutral.
- Destroyed Price Sheet Rumor: rumor, incriminating.

## Card 10: Refugee Witness Circle

### Day Band

Days 5–6.

### Route Lean

A / C.

### Premise

Saved refugees gather and offer to speak, sing, or remain anonymous.

### Main Tension

Legal testimony versus public memory versus witness safety.

### Possible Choices

- Take formal group testimony.
- Let the refugees create a song.
- Keep their names anonymous.
- Ask them to exaggerate the story.

### Possible Evidence

- Group Refugee Testimony: record, favorable.
- Healing Road Song: song, favorable.
- Anonymous Thanks: rumor, favorable but weak.
- Exaggerated Rescue Story: rumor, contradictory.

## Card 11: Smuggler Debt Call

### Day Band

Day 6.

### Route Lean

B / D.

### Premise

A Fox debt collector claims the caravan owes the market for moving medicine through unofficial channels.

### Main Tension

Settlement leverage versus black market implication.

### Possible Choices

- Accept the debt and negotiate settlement.
- Challenge the debt publicly.
- Pay the collector quietly.
- Run from the collector.

### Possible Evidence

- Black Market Debt Note: contract, incriminating or neutral.
- Debt Negotiation Record: contract, neutral.
- Collector Threat Rumor: rumor, neutral.
- Unpaid Debt Mark: record, incriminating.

## Card 12: First Memory Collapse Night

### Day Band

Day 7, mandatory.

### Route Lean

All routes.

### Premise

Direct witness memories from the first week begin to fade. The caravan must decide what to preserve, amplify, destroy, or let vanish.

### Main Tension

What survives into the second week?

### Possible Choices

- Preserve one witness statement as a public record.
- Amplify one public song or rumor.
- Burn private notes to reduce risk.
- Rehearse a cleaner but suspicious alibi.

### Possible Evidence

- Preserved Witness Statement: record, favorable.
- Nightfire Chorus: song, favorable.
- Burned Notes Trace: short-term memory, neutral.
- Practiced Alibi Story: rumor, incriminating.

## Card 13: Return to Deer Village Gate

### Day Band

Day 8 or high-priority after first collapse.

### Route Lean

A / D.

### Premise

The Deer Guard no longer fully remembers the player directly, but the wanted notice remains public.

### Main Tension

The public record outlives living memory.

### Possible Choices

- Confront the accusation with records.
- Avoid the gate.
- Appeal to villagers.
- Provoke the guard.

### Possible Evidence

- Gate Challenge Record: record, neutral.
- Guard Reads Wanted Notice: record, incriminating.
- Village Gate Sympathy: rumor, favorable.
- Public Suspicion Entry: record, incriminating.

## Card 14: Bear Court Intake Window

### Day Band

Days 8–9.

### Route Lean

A.

### Premise

Bear Court clerks begin collecting admissible evidence before trial.

### Main Tension

Shape the case before the court frames it first.

### Possible Choices

- Submit verified statement.
- File evidence packet.
- Lean on hallway gossip.
- Delay the filing.

### Possible Evidence

- Court Intake Statement: contract, favorable.
- Evidence Filing Receipt: record, favorable.
- Court Queue Whisper: rumor, neutral.
- Late Filing Note: record, neutral or incriminating.

## Card 15: Fox Audit Second Pass

### Day Band

Days 9–10.

### Route Lean

B / A.

### Premise

Fox Market offers a second audit with Bear Court scrutiny in mind.

### Main Tension

Clean the books or expose the gap.

### Possible Choices

- Pay for a clean audit.
- Force open the medicine columns.
- Hide a weak line item.
- Refuse the audit.

### Possible Evidence

- Fox Audit Seal: record, favorable for B.
- Audit Gap: record, favorable for A.
- Hidden Payment Trace: short-term memory, incriminating.
- Refused Audit Notice: rumor, neutral.

## Card 16: Crow Story Backfires

### Day Band

Days 9–11.

### Route Lean

C / D.

### Premise

A heroic rumor mutates into a damaging story that the caravan stole medicine for fame.

### Main Tension

Rumor reach versus rumor control.

### Possible Choices

- Correct the story through Crow channels.
- Double down on the heroic myth.
- Blame Fox Market.
- Silence the couriers.

### Possible Evidence

- Corrected Crow Broadside: rumor, favorable.
- Distorted Hero Rumor: rumor, incriminating.
- Market Blame Whisper: rumor, neutral.
- Silenced Courier Story: rumor, incriminating.

## Card 17: Deer Archivist’s Index

### Day Band

Days 10–11.

### Route Lean

A.

### Premise

A Deer archivist can compare old medicine ledgers with current tax orders.

### Main Tension

Make the hidden pattern official.

### Possible Choices

- Request an official copy.
- Ask the archivist to testify.
- Steal the index page.
- Leave the archive alone.

### Possible Evidence

- Archive Index Match: record, favorable.
- Missing Medicine Entry: record, favorable.
- Tax Hold Pattern: record, favorable.
- Stolen Archive Page: record, incriminating.

## Card 18: Market Settlement Dinner

### Day Band

Days 10–12.

### Route Lean

B.

### Premise

Fox Market offers a private settlement: the caravan’s name cleaned, the medicine monopoly untouched.

### Main Tension

Personal safety versus systemic corruption.

### Possible Choices

- Sign the settlement.
- Negotiate better terms.
- Secretly copy the price-control clause.
- Reject the dinner.

### Possible Evidence

- Market Settlement Contract: contract, favorable for B.
- Sealed Liability Clause: contract, neutral.
- Price Control Clause: contract, favorable for A if exposed.
- Rejected Settlement Rumor: rumor, neutral.

## Card 19: Refugee Song Festival

### Day Band

Days 10–12.

### Route Lean

C.

### Premise

Refugees prepare a public song festival naming the caravan as savior.

### Main Tension

Public gratitude versus official irritation.

### Possible Choices

- Encourage the festival.
- Make the song legally precise.
- Keep names anonymous.
- Cancel the festival.

### Possible Evidence

- Festival Witness Chorus: song, favorable.
- Precise Healing Ballad: song, favorable and slightly court-useful.
- Anonymous Shelter Song: song, favorable but weak.
- Cancelled Festival Rumor: rumor, neutral.

## Card 20: Tax Officer’s Travel Ledger

### Day Band

Days 11–12.

### Route Lean

A.

### Premise

A travel ledger places the royal tax officer near Fox Market during the medicine shortage.

### Main Tension

Authenticate the link or use it for leverage.

### Possible Choices

- Authenticate the ledger copy.
- Blackmail the tax officer.
- Sell the ledger to Fox Market.
- Hide the ledger.

### Possible Evidence

- Tax Officer Travel Ledger: record, favorable.
- Royal Seal Route Map: record, favorable.
- Blackmail Trace: rumor, incriminating.
- Sold Ledger Rumor: rumor, incriminating.

## Card 21: Medicine Price Spike

### Day Band

Days 11–12.

### Route Lean

A / B / C.

### Premise

Villagers discover medicine prices doubled after the accusation.

### Main Tension

Use price data as evidence, leverage, or public outrage.

### Possible Choices

- Publish the price spike record.
- Use it in Fox settlement talks.
- Turn it into a Crow story.
- Ignore it as too indirect.

### Possible Evidence

- Price Spike Record: record, favorable.
- Settlement Leverage Note: contract, favorable for B.
- Market Control Rumor: rumor, favorable for C if supported.
- Ignored Price Trace: short-term memory, neutral.

## Card 22: Witness Contradiction Hearing

### Day Band

Days 12–13.

### Route Lean

A / D.

### Premise

Bear clerks compare witness statements and find contradictions.

### Main Tension

Clean the case or bury the weak parts.

### Possible Choices

- Clarify contradictions honestly.
- Remove weak witnesses from the packet.
- Flood the docket with extra testimony.
- Admit uncertainty.

### Possible Evidence

- Clarified Testimony Sheet: record, favorable.
- Contradiction Sheet: record, incriminating.
- Noisy Docket: record, neutral or incriminating.
- Honest Uncertainty Note: record, neutral.

## Card 23: Crow Broker’s Final Spin

### Day Band

Days 12–13.

### Route Lean

C / B.

### Premise

A Crow broker offers one final region-wide story before court.

### Main Tension

Choose the last public frame.

### Possible Choices

- Spread the hero narrative.
- Spread a merchant-friendly settlement story.
- Spread an anti-tax officer story.
- Refuse final spin.

### Possible Evidence

- Final Hero Broadside: rumor, favorable.
- Merchant-Friendly Rumor: rumor, favorable for B.
- Anti-Tax Officer Rumor: rumor, favorable if supported, dangerous if unsupported.
- Refused Spin Memory: short-term memory, neutral.

## Card 24: Court Packet Sorting

### Day Band

Day 13, mandatory.

### Route Lean

All routes.

### Premise

The player chooses which evidence packet reaches Bear Court first.

### Main Tension

The court will not read everything with equal attention.

### Possible Choices

- Lead with legal records.
- Lead with settlement papers.
- Lead with songs and public sympathy.
- Submit everything without sorting.

### Possible Evidence

- Sorted Court Packet: record, favorable for A.
- Merchant Packet: contract, favorable for B.
- Song Packet: song, favorable for C.
- Noisy Docket: record, incriminating or neutral.

## Card 25: Final Counter-Offer

### Day Band

Days 13–14.

### Route Lean

A / B / C.

### Premise

On the courthouse steps, three factions offer incompatible help.

### Main Tension

Choose who gets to define the final version of the story.

### Possible Choices

- Accept Deer/Bear legal compromise.
- Accept Fox sealed release.
- Accept Crow hero oath.
- Reject all offers.

### Possible Evidence

- Deer Apology Draft: record, favorable for A partial truth.
- Fox Sealed Release: contract, favorable for B.
- Crow Hero Oath: song, favorable for C.
- Rejected Offers Note: record, neutral.

## Card 26: Eve of Bear Court

### Day Band

Day 14, mandatory.

### Route Lean

All routes.

### Premise

The caravan sleeps beside its records. By dawn, only stable evidence will matter.

### Main Tension

Guard the truth, leak the story, trust the settlement, or flee.

### Possible Choices

- Guard the records.
- Rehearse witnesses calmly.
- Leak the story to the public.
- Attempt to flee.

### Possible Evidence

- Last Night Docket Note: record, favorable or neutral.
- Witness Ready List: record, favorable.
- Midnight Leak Rumor: rumor, favorable for C or incriminating if reckless.
- Flight Attempt Notice: record, incriminating.

## 13. Recommended 14-Card Starter Spine

Before implementing route-dependent event selection, a stable v0.5 vertical slice can use this fixed fourteen-card sequence:

| Day | Event Card |
|---:|---|
| 1 | Deer Village Medicine Conflict |
| 2 | Fever at River Camp |
| 3 | Tax Seal on the Crates |
| 4 | Fox Ledger Offer |
| 5 | Crow Relay Framing |
| 6 | Deer Doctor’s Hidden Diary |
| 7 | First Memory Collapse Night |
| 8 | Return to Deer Village Gate |
| 9 | Bear Court Intake Window |
| 10 | Fox Audit Second Pass |
| 11 | Tax Officer’s Travel Ledger |
| 12 | Witness Contradiction Hearing |
| 13 | Court Packet Sorting |
| 14 | Eve of Bear Court |

This fixed spine allows the full story to be playable before adding the full route-dependent card selection system.

## 14. Route-Dependent Event Selection Design

Once the fixed spine is stable, the wider twenty-six-card pool can drive replayability.

### Selection Principles

- Day 1, Day 7, Day 13, and Day 14 are always anchored.
- Days 2–6 draw early investigation and route-leaning cards.
- Days 8–12 draw consequence and commitment cards.
- Route weights should respond to previous choices, evidence, faction standings, and legal risk.

### Route Weight Inputs

Route A weight increases when the player creates reliable public records, contracts, court filings, authenticated testimony, tax officer evidence, Fox Market control evidence, or necessity evidence.

Route B weight increases when the player signs Fox contracts, pays debts, accepts audits, improves Fox Market standing, or cleans route ledgers.

Route C weight increases when the player creates songs, rumors, Crow broadsides, refugee gratitude, or public sympathy.

Route D pressure increases when the player creates incriminating records, false alibis, tampered ledgers, contradiction evidence, high legal risk, or lets favorable short-term memories expire.

### Event Selection Goal

The game should feel responsive without becoming unpredictable. Players should understand that the world is reacting to the kind of evidence they leave behind.

## 15. Design Notes for Tone

The story should avoid a simple innocent-versus-guilty binary.

The player may have stolen medicine. The deeper issue is whether the law was already corrupted by tax authority and market control. A strong ending should not make the world feel fully healed. Even successful routes should leave scars:

- Route A reveals truth but cannot fully restore trust.
- Route B saves the player but worsens medicine inequality.
- Route C creates a hero myth but leaves official doubt alive.
- Route D shows how fragile truth becomes when only bad records survive.

## 16. Final Design Promise

Every run should ask the same question in a different way:

When memory fades, who owns the surviving story?
