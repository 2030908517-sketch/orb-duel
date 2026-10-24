## Demon: Soul Devour (2026-10-22)

The Demon extracts a translucent host-coloured soul orb. Branded souls bind the host within a maximum-75 tether; reaching its limit causes tangential circling rather than repeated reflection. Soul Loss means complete actor/CD stasis, never damage reduction. Once Arcana is ready, the next normal gate cycle guarantees shield-piercing extraction followed by a body-piercing 3s stasis, then hellfire assimilation; the world keeps running. Enemies prefer the real Demon over its servants. A servant's death causes its former host 3s stasis; servant HP, basic skills and rebirth remain unchanged. See [gate-04](docs/ai-design-knowledge/DEMON_GATE04_UPDATE.md). Run `node tests/verify-demon-gate04.cjs`; prior tests/results are historical.

# ORB DUEL — Automatic Orb Battle Simulator

## Manual skill duel (PC)

Open **[manual.html](manual.html)** or use the new mode link. Choose Ranger, Normal, Vampire, Trapper, Venom, Laser, Boomerang or Time; every orb still moves automatically. Ranger controls remain: aim with the mouse, left-click for one full attack sequence, and right-click after awakening to select sniper/scatter (full calibration is still required). At the original Arcana threshold, press both mouse buttons together to dodge toward the cursor along a legal native route. After dodging, left-click within one combat second to begin the original 1.08-second armor-piercing charge; aim with the mouse until its final 0.16-second lock. Without a click, the opportunity expires without firing. E/WASD no longer control Ranger Arcana. Existing automatic modes and combat numbers are unchanged. See [rules, isolation, backup and validation](docs/design/MANUAL_MODE.md).

Normal: left-click during a real near-miss opportunity to pursue; right-click to prepare a charged heavy hit. Vampire: left-click to hunt (or release a wave during Blood Sea), right-click for Blood Pact. Trapper: left-click places a mine at the orb itself; right-click swaps with the selected node. For these three roles, press both mouse buttons together for Arcana (Trapper toggles collision-trigger standby). Cooldowns, resources and native effects are retained. F toggles the dedicated fullscreen battle view.

| Added player | Left click | Right click | Middle click | Arcana |
| --- | --- | --- | --- | --- |
| Venom | Aim and fire poison glob | Pool at own body | — | Automatic |
| Laser | Start native cannon warning after full charge | Earned heat blade | Original short jet | Both buttons |
| Boomerang | Throw / awakened close cross | Returning-blade chase / awakened far sling | Earned catch heavy slash | Both buttons |
| Time | Aim clock after awakening | Mouse-centered domain | — | Automatic lethal rewind |

Native windups, ranges, earned opportunities and resources still apply. Laser's blade has an earned-use limit rather than an independent cooldown; its jet retains native threat/route conditions. Time's domain preview shows its real radius. Venom/Time do not use a manual Arcana chord.

## Animation review

Press **V** in any mode to pause and review roughly the last 20 seconds of displayed combat. Arrow keys step captured frames; Shift+arrows jump 10 frames. Seek with the timeline or 5/10-second buttons; play at ¼×, ½× or 1×. Space plays/pauses review; V returns to the original paused match, then Space resumes combat. Review is silent and never restores or re-simulates combat state. Restart clears the buffer. Captures are capped at 800 pixels wide with a 64 MiB image/HUD budget, so complex scenes may retain less than 20 seconds; fast simulation does not generate missing frames. See [implementation and limits](docs/design/ANIMATION_REVIEW.md).

## Boomerang Arcana: Twinblade Dance

Arcana-only, 228 HP. Awakened at ≤30% HP, once per duel: four live throw/return relays with reciprocal predictive steering, real catches, alternating approaches and a harmless final ring. Armored but vulnerable to damage; shields, immunity, reflection and blade marks retain their rules. Per-target blade budget 32, at most 10 hits, 8.2-second timeout. Classic/Team unchanged. See [design and verification](docs/design/experiments/blade-dance.md). Existing version identifiers are unchanged.

## Arcana priority (20261017-priority1)

Arcana effect protection is independent of actor armor, damage immunity and absence. Added stage-specific armor, protected forced movement and source-aware royal-shield rank reduction. Accelerator/Venom/Shield actors remain controllable. See [rules](ARCANA_PRIORITY.md); run `node tests/verify-arcana-priority.cjs`. Existing combat numbers and general rewind rules are unchanged.


## Accelerator Arcana: Kinetic Cycle (20261018-kinetic3)

Awakened at ≤30% HP, once per duel: the next awakening dash contact transfers motion into the enemy. The caster stops while the enemy ricochets along real walls at nominal speed 900, then returns and brakes before contact. A short compression hold releases both actors in opposite directions; one final enemy wall hit ends the attack, and the caster resumes cruise on its first wall. The opener reuses ordinary dash damage (18 base damage in every mode, before the existing variance, heat and defenses). Wall hits use the existing mass/normal-velocity calculation and heavy feedback, without extra fixed damage. Final wall rebound retains inertia; caster cruise reaches 365 within 0.24 seconds after its first wall. Energy flows from the braking enemy into the gap between both orbs, reaching its peak exactly at rest; a 0.12-second freeze precedes release. Shields/immunity and time slowdown retain their rules. Arcana HP remains 220; Classic stays at 108 and Team retains its existing 220. See [design and verification](docs/design/experiments/accelerator-kinetic-cycle.md). Run `node tests/verify-kinetic-cycle.cjs`.

## Current adjustment (20261017-poison2)

Venom contact poison has a separate 1.2-second world-time cooldown per enemy. Repeated contacts still deal normal damage, but do not stack or refresh poison during that interval. Pools, venom shots and existing toxin bursts keep their own rules. Pre-awakening poison is now 0.85 per layer per 0.5 seconds (weak poison 0.34); awakened poison remains 0.95. Shared across Classic, Arcana and Team.

## Current adjustment (20261017-cleanse1)

Successful Blood Pact finish cleanses harmful actor statuses and attached tethers after simultaneous hit processing. Positive buffs, resources, cooldowns, physical cages and hostile areas/projectiles remain. Later exposure may reapply debuffs. Traps and Arcana hubs no longer expire; new deployment at capacity reclaims the earliest placed node, including hubs. The 5/7 limits, spacing and ordinary removal rules remain. Time fields now slow movement by 80% while cooldown delay remains 30%. Shared ordinary rules apply in all three modes.

## Latest: Venom — Chronic Corrosion (20261017-venom1)

Arcana HP **220**; Classic/Team remain **112**. On the first crossing of 30% HP, immediate damage stops exactly at 30%, and all excess plus future health damage enters a persistent debt pool. Every 0.5 seconds, 20% of the remaining pool is paid, with a minimum of 1 and a cap at the remaining debt. An empty pool does not end conversion. This does not heal or grant invulnerability; a large pool can kill on the first payment.

Existing shields absorb before debt is booked; later shields cannot erase booked debt. Payments do not recursively defer, reflect or lifesteal. Ordinary venom projectiles, pools and toxin bursts retain their existing rules. Time rewind preserves unpaid debt alongside its existing HP and qualification rules. The passive does not own movement or the poison casting channel.

Body swelling, black-green cracks, moving internal liquid and synchronized corrosion pulses show pressure. A striped pending-damage segment overlays current HP, with explicit pool, next-payment and lethal-risk values. Focused test: `node tests/verify-venom-decay.cjs` (107 checks); native browser playback, narrow layout and render purity observed. No batch balance runs. Synth cues implemented; no subjective audio audition.

[Play Arcana](arcana.html?v=20261017-venom1) · [Design and reference](docs/design/experiments/venom-decay-01.md). Earlier records follow.

## Current rules (20261017-rewind3)

Vampire is **absent** from liquefaction until the blood pillar and visible body appear together. It cannot be targeted, hit, or trigger traps; targeted enemy releases wait, while autonomous traps and toxic pools continue. The wavy circular pool drains with the vortex, followed immediately by the pillar, wings and a single total-heal number. Waves bank healing without restoring HP; the HP bar changes only when that number appears. Bat Hunt deals one 8-base-damage lifestealing hit.

Time has **215 HP in Arcana**, 120 in Classic/Team. Fields deal 2 base damage every 0.5 seconds; movement runs at 10%, cooldown/reload/charge at 70% (30% delay). Clock silence remains 1.2 seconds with only 1 extra second of attack delay. Time slowing and silence do not affect active enemy ultimates, except Shield and Reflector.

Ordinary fields recall an exiting enemy to the field center once per field in all three modes. The independent first-death ultimate reverses both actors along their recorded paths for up to 10 seconds, restoring only position and HP, clearing temporary states/resources/entities without rewards, preserving awakening and clearing all caster skill cooldowns while putting every enemy skill on full cooldown. Time's use is permanent; opponent uses inside the discarded window are refunded. Cage and fortress walls block projectiles and rays; fortress area is about 41%.

Targeted checks: `node tests/verify-time-presence.cjs`, `node tests/verify-time-rewind.cjs`, `node tests/verify-bloodsea-rebirth.cjs`. Earlier version records follow; this section takes precedence.

## Latest: Heat Blade and Solar Severance (20261016-lightblade1)

After each completed main shot, Laser can use one defensive 82-unit blade sweep during the gap. It costs 20% capacitor (any shortage delays equivalent future charging), deals 4 base damage and slows movement by 35% for 1.1 seconds on HP damage, without knockback. It cuts hostile physical projectiles, flying clocks and traps. This ordinary mechanic is shared by Classic, Arcana and Team.

The independent Arcana adds a four-act, mechanically driven giant blade: focusing rings, forged blade and backswing, a locked 138-degree physical sweep, then fragment return. One 18-base-damage main hit per enemy, strong knockback and entity clearing; only the first 0.14 seconds of the 0.22-second sweep protects the caster. Low-health awakening, once per match and silence exemption remain; Arcana HP is 210; Classic and Team remain at 105. The new Arcana is not added to legacy Team.

[Laser lab](tests/arcana-lab/index.html?role=laser) · [Design and inspected references](docs/design/experiments/laser-blade-01.md) · [Recording and checks](tests/arcana-lab/evidence/lightblade1/index.html). Earlier version records follow.

## Current: Blood Sea Rebirth and Trapper network (20261016-trapchain1)

Vampire gains **2 Blood Energy per effective hostile body collision**, capped at 8, in all three modes. Its independent Arcana is now **Blood Sea Rebirth**: disintegration, 3–8 wide moving tides, a converging vortex and a blood-column rebirth. A mark is no longer required; tides apply it and use better prediction against marked targets. Each tide locks its course before travelling. The 28-point base damage budget is shared across the wave count (at most 7 each), with healing limited to 80% of actual HP damage, 4 per wave and 20 overall. Liquefaction and early rebirth have brief immunity, not permanent immunity through the whole sequence.

Trapper now has **5 / 7 nodes**, reduced ordinary blast/shard damage, and conditional chains: an armed neighbour within 85 units is reserved only while a living enemy overlaps its own blast radius (including the enemy orb radius). After 0.09 seconds it checks again; an empty node cancels and keeps its original lifetime. Trapper also has an **8-second swap with the valid node farthest from its current enemy**. Node centers must be at least **70 units apart**: a ready placement waits until a separated legal position is available. Swap preserves node state and lifetime; new/rewired lines cannot invent crossing hits. Its Arcana **Substitute Incarceration** replaces one hostile body collision, teleports to a seeded safe far position, traps the enemy behind real walls for three seconds, then explodes once. The caster is blocked by the cage exterior too. A unique, disarmable hub is deployed in parallel and links to all unobstructed armed nodes while counting toward the cap. Arcana-only Trapper HP: 232; Classic/Team: 114.

**Every Arcana can begin and continue while silenced.** Ordinary skills remain interruptible and delayed; time-field slowing remains active. Team keeps its existing legacy Arcana designs; Blood Sea and Substitute are exclusive to the independent Arcana mode.

[Play Arcana](arcana.html?v=20261016-bloodsea2) · [Vampire replay](tests/arcana-lab/index.html?role=vampire&v=20261016-bloodsea2) · [Trapper replay](tests/arcana-lab/index.html?role=trapper&v=20261016-bloodsea2) · [Recording and review](tests/arcana-lab/evidence/bloodsea3/index.html) · [Design and references](docs/design/experiments/blood-sea-01.md). No build or installation is required. Scoped checks cover mechanics, three modes, obstacles, friendly fire, fixed-clock playback and actual browser interactions. Recorded audio was checked for clipping, not subjectively auditioned; this is not a roster-wide balance verdict.

## Previous: Dense Blood Bats and a readable Vampire finale (20261016-vampirefeel4)

Blood Shadow Hunt now uses nine redesigned bats with pointed ears, long skeletal wings and concave membranes. Formation spacing is 20% tighter; flight slows from 500 to 420 while retaining its maximum travel distance. Actual mark contact receives a small visual compression, brief hitstop and a dedicated cue, with no added direct damage. Shared in Classic, Arcana and Team modes.

The Vampire Arcana finale adds a 0.32-second gathering tell, stronger confirmed-bite feedback and a 1.65-second return sequence. A lethal bite retains a 1.85-second damage-free tail. Damage, healing cap and the original brief mist immunity and close-range bite windows remain unchanged. Previous fortress, debt-scar and low-health Normal changes are retained as Arcana-specific rules.

[Play](arcana.html?v=20261016-vampirefeel4) · [Recordings and replay](tests/arcana-lab/evidence/vampirefeel3/index.html) · [Design and validation](docs/design/experiments/vampire-feel-06.md). Focused checks and relevant regressions passed, including actual mark-only hunts in all three modes. Audio was captured and checked for clipping, not subjectively auditioned.

## Previous: Fortress and Debt Arcana (20261016-defense3)

**Shield — Royal Fortress** raises physical shield walls, closes the arena to about 49% of its area, holds for 4.2 seconds and restores it. A separate 24-point barrier feeds existing pressure and remaining-shield waves without resetting the ordinary cooldown. Moving walls push safely and cause no crush damage.

**Reflector — Unpaid Debt** records actual enemy HP loss not actually returned. A telegraphed travelling strike settles up to 40 debt for at most 18 base damage; only actual HP damage enables 1.35 seconds of bounded steering and one predictive defense opportunity valid for 4 seconds. Stored counters repay the ledger only on actual damage. Walls do not create debt; the existing magnetic damage-origin distinction is preserved.

These abilities are installed in **Arcana mode only**. Their mode-specific HP is **236 / 250**; Classic HP and other characters stay unchanged. All six Arcana retain the existing awakening, ≤30% HP and once-per-match rules.

[Play Arcana](arcana.html?v=20261016-defense3) · [Shield replay](tests/arcana-lab/index.html?role=shield&v=20261016-defense3) · [Reflector replay](tests/arcana-lab/index.html?role=reflector&v=20261016-defense3) · [Recordings and review](tests/arcana-lab/evidence/defense3/index.html) · [Design and references](docs/design/experiments/defense-arcana.md).

Run `node tests/verify-defense-arcana.cjs` for the scoped mechanics checks. Browser captures include real mixed audio; subjective listening and full-roster balance remain unverified. No installation/build is required.

## Previous: Vampire Blood Prison and longer lethal recovery (20261016-prison3)

Vampire’s Arcana now forms a three-blade prison, performs crossing slashes and a heavy downward cut, then turns the caster into mist for a close-range bite. Real swept cuts deal 6/8/10 base damage; the bite deals 12. Only actual bite damage enables 80% recovery from the combined valid damage, capped at 20 healing. Mist is invulnerable for 0.14 s; bite anticipation is vulnerable. The prison is not a solid wall or an unconditional hit.

All modes add 0.3 simulation seconds to lethal recovery before displaying the result. No extra attacks or late damage are resolved during recovery. Classic and legacy team abilities retain their existing implementation.

[Replay](tests/arcana-lab/index.html?role=vampire&v=20261016-prison3) · [Recording and review](tests/arcana-lab/evidence/prison3/index.html) · [Design and references](docs/design/experiments/vampire-arcana-05.md). The new synthesized mix was captured and measured; subjective audition remains pending.


## Previous: Arcana defense rules and lethal recovery (20261016-ranger4)

In Arcana mode, blood blades and the piercing round retain physical hit tests but ignore existing mirrors and magnetic redirection. The piercing round bypasses and shatters shields; the pressure ring bypasses without shattering. Ranger’s 0.16 s dodge is invulnerable and can pass through orbs/attacks, prioritizing a safe landing; its subsequent 1.08 s charge remains vulnerable.

All modes now finish the lethal fixed-step batch, including reflection and healing, then play a bounded recovery before freezing and showing the result. Other attacks cannot deal further damage or create a late draw. Pause, speed and restart remain available. [Replay fixtures](tests/arcana-lab/index.html?role=ranger) · [Recovery checks](tests/verify-attack-ending.cjs).


## Previous: Ranger counter Arcana, captions and 30% eligibility (20261016-ranger1)

In **[Arcana mode](arcana.html)**, Normal, Accelerator, Vampire and Ranger now become eligible at **30% HP or below**, after awakening and their own conditions. A compact arena-edge caption identifies the caster and the committed Arcana. Cancelled preparation does not display a successful-cast caption. Classic 1v1 and the legacy 2v2 implementation retain their existing rules.

**Ranger — Dead Line: Countershot** reacts to an approaching physical projectile, body collision or locked laser. It chooses a legal side-step, moves physically without invulnerability, then braces for **1.08 s**, locking aim for the final **0.16 s**. Its **1350-speed, 28-base-damage** projectile pierces shields without shattering them, can miss, and remains subject to mirrors and magnetism. Silence interrupts an un-fired counter; a released round remains independent. A real hit restores calibration. Ranger has **224 HP in Arcana mode** (Classic remains **112**); no new full-roster balance claim is made.

[Replay the four Arcana](tests/arcana-lab/index.html?role=ranger) · [Ranger design and references](docs/design/experiments/ranger-arcana-01.md) · [New checks](tests/verify-ranger-arcana.cjs). No installation or build step is required; open `arcana.html` in a Windows browser. The earlier sections below are version history.

## Previous: separate Arcana mode and two redesigned ultimates (20261015-pair4)

Open **[arcana.html](arcana.html)** for the extended-health Arcana mode. Classic **[index.html](index.html)** restores Normal / Accelerator / Vampire to **126 / 108 / 112 HP**, with no Arcana. Existing 2v2 combat is kept on its legacy Arcana implementation.

**Accelerator** curves into a fast orbit, tracks briefly, locks the area, then exits tangentially while an actual pressure front collapses inward and shatters shields on contact. **Vampire** forms three approved code-art blades and releases them at staggered times; each takes its own lead and never homes after launch. Actual healing alone drives blood return. Neither shares Normal's primary impact shape.

[Replay and recordings](tests/arcana-lab/evidence/pair4-final/index.html) · [Accelerator brief](docs/design/experiments/accelerator-arcana-04.md) · [Vampire brief](docs/design/experiments/vampire-arcana-04.md). Current scoped check: `node tests/verify-arcana-mode.cjs`. Earlier Arcana result files below describe their historical versions.


A personal browser game for watching automatic 1v1 battles. Pick two orbs, start a match, and watch their movement, collisions, abilities, and awakenings decide the winner.

Author: Shenghao Ye. Developed with extensive AI assistance through Codex, including implementation, iterative mechanics design, balance simulations, testing, and documentation, guided by the author's design direction and feedback.

[中文说明](README.zh-CN.md)

## Presentation design and tooling

The reusable [design guide](docs/design/README.md) covers visual/audio language, purposeful action timing, semantic presentation events and evidence-based review. Open [Feel Lab](tests/presentation-lab.html) for seeded fixtures, cosmetic sliders, frame stepping, PNG/JSON export and local video/audio capture. This tooling update preserves existing character rules and does not bulk-migrate their effects. See [review instructions](docs/design/REVIEW.md) and [current validation](VALIDATION.md).

## Previous: Arcana spectacle overhaul (20261015-arcana2)

The three Arcana now have much larger, longer and distinct presentations. **Normal** holds its blinked punch for **0.68 real seconds**, then freezes a confirmed impact for **0.34 seconds**, with huge fist silhouettes and directional shock rings. **Vampire** materializes three giant blades around its target before a slower, one-time-led convergence, with an enlarged real blade body and blood return. **Accelerator** tears through compressed air and releases thick sonic fronts, air shards and multiple lingering pressure rings.

Twelve dedicated synthesized cues give these attacks their own charge, body and long decay. An independent Arcana bus briefly ducks ordinary combat sounds; pause and reset clear it. Damage values, the three HP values and the 40% once-per-match eligibility remain. Checks and matches still use only Normal, Accelerator and Vampire. [Rules and visual/audio references](ARCANA_DESIGN.md) · [Current checks](VALIDATION.md).

## Previous: Low-health Arcana for three orbs (20261015-arcana1)

Normal, Accelerator and Vampire now have one-use **Arcana**, available only at **40% HP or below**, with their own resource conditions and defense-aware preparation. There is no match-time unlock. Normal blinks into a long hit-stop punch; Accelerator brakes into a real expanding sonic cone that bypasses and shatters shields; Vampire converges three physical blood blades and heals only from actual health damage. The original awakening conditions remain.

Only these three HP values changed: **Normal 280, Accelerator 220, Vampire 198**. Other orb parameters are preserved. A fresh 180-match sample, using only these three roles, averages **62.4 simulation seconds** (median **57.4**). Individual matchups vary: Vampire mirrors remain longer and Accelerator still has an advantage over Vampire; this is not a full-roster balance pass. Same-tick draws remain possible.

Checks are limited to these three selected roles: mechanism and fixed-clock boundaries, 108 duel / 18 team integrity matches, six browser viewport/mode checks, ten skill scenes and eleven new audio waveforms. [Exact rules and sample limits](ARCANA_DESIGN.md) · [Validation](VALIDATION.md).

## Previous: Charge and Stellar (20261015-conductor1)

Both modes now offer **eighteen orbs**. **Charge** is a separate new character: wall collisions store charge, real currents travel along the perimeter and arc to nearby enemies, contact marks conductors, and their next wall impact creates a fixed grounding discharge. Awakening transforms the actual body into fast wall-following lightning before it condenses back into the arena. Thunderstorm retains its existing rules.

**Stellar** replaces the former Orbital design. Three persistent satellite identities gain orbital energy, launch real bouncing comets, return and recharge. Distinct hits can resonate. Awakening recalls and collapses those satellites into a core, releases a genuinely expanding shockwave, and ejects three rebirth comets. Automatic satellite shielding, guard energy, star marks and binary rays are removed.

Current checks: **1,134 mechanic checks**, **324 ordered 1v1 matchups**, **150 team matches**, six browser viewport/mode interactions, nine rendered skill scenes and **159 audio waveform profiles**. Six Thunderstorm battles match pre-change snapshots and events exactly. A fresh 204-match sample gives Charge / Stellar approximately **51% / 52%** win/draw scores; this is an initial sample, not a full balance verdict. [Rules, limits and references](CONDUCTOR_STELLAR_DESIGN.md) · [Validation](VALIDATION.md).

## Previous: Thunderstorm, Orbital and split cooldown time (20261014-cosmic1)

Both modes now have **seventeen orbs**. **Thunderstorm** stores wall-contact charge, spends it on charged lightning, builds conductive marks through real hits, and awakens into three separately warned, locked relay strikes. **Orbital** switches between orbiting satellites and detached star rounds, spends satellites to absorb incoming physical flyers, stores star energy for later shots, and awakens into a stationary binary-star field with rotating arms and three crossing pulses. Rays and lightning remain nonphysical; mirrors and magnetic forces can affect detached stars.

- Accelerator and Magnet kinetic **wall damage is 25% lower**, preserving momentum and knockback. Pre-heat wall caps are now 9, 13.5 and 5.25 for dash follow-ups, magnetic repulsion and light attraction-wall hits. Direct attraction contacts retain their previous damage budget.
- Time zones keep **90% movement slow**, while **cooldowns, reloads and capacitor charging slow by 50% independently**. Active cast windups retain the previous slow; overlap never multiplies either rate.
- Venom uses living tendrils, leaping concentrated globs and converging green mist. Real contact precedes invasion; all sources share the toxin application cooldown. Old automatic detonations and resonance droplets are removed.

Fresh checks passed **183 new mechanic boundaries**, **289 ordered 1v1 matchups**, **147 team matches**, current timing/character regressions, **six real-browser viewport/mode checks**, six skill-render scenes and **141 synthesized audio waveform profiles**. An initial fresh three-seed, both-side sample gave Thunderstorm and Orbital approximately 59.4% and 50.5% win/draw scores; this is a small functional balance sample, not a roster-wide verdict. [Full rules, limits and visual/audio references](COSMIC_DESIGN.md) · [Validation](VALIDATION.md).

## Previous: Bounded miss recovery and delayed defenses (20261014-adaptive1)

Miss recovery now evaluates complete skill rounds, including released bullets, returning blades, leftover pools, echoes and light columns. Damage absorption, reflection, disarming and actual control count as useful outcomes. Interrupted unreleased casts cannot farm rewards. Gains are capped, reset after useful rounds, and shown in the existing stable status rows.

- **Defenses:** Shield and Reflector first activate at **1.5 simulation seconds**. Empty Shield windows extend the next window by 0.25 seconds, capped at 0.5; empty Reflector stances add 0.2, capped at 0.4. Neither advances cooldown or grants more shield HP. Predictive stances do not stack the duration bonus.
- **Accelerator:** an empty dash returns at most **10 lost cruise speed**, and refunds **2 seconds of the next dash cooldown**. A full-speed empty dash recovers to at most 295; a hit or interruption still recovers to at most 285.
- **Ranged/control:** missed Ranger magazines modestly improve ordinary aim tracking without granting calibration or shorter reloads. Venom's entire projectile-and-pool miss reduces its next spread, retaining random error. Repeated misses can let suitable skills wait at most 1.2 personal-time seconds for an invulnerable target, before starting their normal warning.
- **Other roles:** failed mine captures modestly extend that surviving node's next pull; an empty caught blade round receives a small extra return; unused Ghost phases shift their next cycle later; empty Holy fields bias legal random positions and empty judgements receive bounded recovery. Existing melee drought, blood-chain and magnetic-pull compensation remain.
- **Time/UI:** enemy local time rate is **10% (90% slow)** and clock base damage is **12**. Ranger's small protruding emblem line is removed; sniper telegraphs, original motion tails and recorded Soul Paths remain.

Fresh verification passed **451 focused checks**, **225 ordered 1v1 matchups**, **141 team matches across three maps**, related character regressions and **six real-browser mode/viewport checks**. A matched-seed Demon/Ghost sample improved actual claw hits from 69 to 97 across 24 matches; this is targeted counterplay evidence, not a roster-wide balance claim. [Exact per-role rules](ADAPTIVE_DESIGN.md) · [Verification](VALIDATION.md).

## Previous: Finite aim tracking and the Demon orb (20261014-demon2)

Both modes now include fifteen orbs. Ranged aiming turns at a finite speed and observes movement at fixed 60 Hz, while physics remains at 240 Hz. Ordinary lead prediction is capped at 0.5 seconds; sniper and laser retain better tracking and longer finite lead, with their existing final direction locks. Full calibration removes random spread; sudden rebounds, speed changes and fast transverse movement can still defeat tracking.

Accelerator gains **+5 cruise speed per wall contact** and **+18 per enemy contact**, capped at 365. Dash speed still decays independently. Every dash completion, including silence, reduces cruise speed to **82%, capped at 285 and floored at 205**, so it must build speed again.

**Demon** brands enemies through contact and summons telegraphed, extending claws. Branded claw hits attach a **3.2-second physical chain**; a later effective attack executes once, and the chain remains until its original deadline. Awakening adds opposing boundary gates: two captures wind up for **one second**, then trigger one dual execution. The second chain cannot extend control, and skill damage stays within a **22-base per-target cast budget**. Silence, phasing and death release control without free terminal damage. New claw, chain and execution visuals use nine dedicated synthesized cues, damage-scaled push and hit-stop.

The controlled moving-target check measured ordinary full-calibration hits against a 365-speed transverse target at **69.2%**, compared with the previous predictor's 100%. This is a controlled aim comparison, not a universal live-match hit rate. A fresh five-seed, both-side Demon sample scored **50.7% across 140 duels**; it is an initial check, not proof of roster-wide balance. See [exact rules and references](AIM_DEMON_DESIGN.md) and [current verification](VALIDATION.md).

## Previous: Ranger downtime and synchronized Holy fields (20261014-sync1)

Ranger reloads in **5.2 seconds before awakening**, with **4 seconds** retained afterward. An already-started reload keeps its deadline. Wounded sniper aim now uses a **±21°** zero-calibration cone; sniper spread at levels 0–3 is ±21/14/7/0°, while ordinary shots and the undamaged full-calibration sniper remain unchanged.

Every triangle-field wave now reserves one shared warning and landing time. Columns descend, land and expire together, with one landing cue for the wave. When spacing cannot be respected, that slot is omitted instead of staggering a pillar. Existing 51-unit spacing, the 1.1-second wave interval, pillar damage and lifetime, and awakened diagonal bands remain. Audio timing was reviewed against [event synchronization and grouped sound requests](https://www.gamedeveloper.com/audio/producing-audio-for-halo).

The new 195-boundary suite, existing Holy/ward/Time checks, 196 ordered engine matchups and 138 team matches passed. Six actual browser viewport/mode checks verified reload and spread labels, synchronized columns/effects/audio events, pause/reset and readable panels. No new Demon orb is implemented in this build; its proposed capture-and-execute design is being reviewed.

## Previous: Soul Echo and Ranger tuning (20261014-echo3)

Ghost records the complete actual phase path, including all three awakened lunges. Materializing creates an intangible echo that follows the same positions at the same speed, with the same 2.1-base fear damage and independent 0.25-second hit intervals. An awakened echo repeats the original exit burst once. Echo hits do not charge a later body burst; echoes never spawn more echoes and disappear when their owner dies. Wall teleportation was removed: the phased body still rebounds normally and its echo reproduces those rebounds.

The recorded soul path uses a continuous, soft, wide mist band fixed to the arena with a few anchored ghost silhouettes. It fades smoothly near the end of playback. Original orb motion tails are restored exactly; rendering does not move stamps or replace trail samples each frame. References were reviewed before the final effect changes. Shape/spacing inspiration: [Saltmire afterimages](https://github.com/saltmire/saltmire-trail); fade/width controls: [Unity trail documentation](https://docs.unity.cn/2022.3/Documentation/Manual/class-TrailRenderer.html).

Ranger moves at **210**, has **6** base contact attack and **21** base sniper damage. Injured sniper aim uses a **±15°** zero-calibration cone; ordinary shots retain ±9/6/3/0° and an undamaged full-calibration sniper remains precise. Scatter pays calibration at deployment, then each actual projectile hit restores one layer; misses do not subtract recovered layers, and completion preserves them for the next reload decision.

Both modes include the changes. New echo and Ranger boundaries, 196 ordered matchups, 138 team matches and desktop/mobile browser interactions passed. Sound is still synthesized: two dedicated echo cues bring the technical waveform checks to 119 profiles; subjective listening is left to playtesting. This update does not claim a new win-rate balance assessment.

![Soul Echo, original motion tails and fixed recorded paths](preview-echo.png)

[Echo rules and limits](ECHO_DESIGN.md) · [Current checks](VALIDATION.md)

## Previous: Ranger fire modes and defensive progression (20261014-salvo1)

- **Calibration:** ordinary projectile hits add one layer, up to three. Spread is exactly ±9° / ±6° / ±3° / 0°. Existing one-layer miss loss and six-second expiry remain.
- **Awakened Ranger:** each reload completion selects a fixed magazine mode: burst below full calibration, sniper at full calibration and distance ≥180, or scatter when closer. Every mode reloads for four seconds. Sniper pre-aims for 0.5 seconds, locks for 0.15 seconds, then releases one 800-speed physical round with 19 base damage, no homing and no bounce. Actual HP damage during aim or lock does not cancel it: that shot uses zero-calibration spread even if an older bullet subsequently adds a layer. Actual sniper contact restores all three layers; a miss clears them. Selection waits for the released round's result. Scatter retains two fan volleys and the heavy shell; hits grant no layers and completion clears calibration.
- **Reflector:** banking 25% of eligible actual enemy damage and releasing the counter round is now a base ability. Empty-stance prediction unlocks only after awakening; source restrictions and non-recursive reflection remain.
- **Trapper:** after the 0.3-second physical pull, explode only when the captured target is inside the actual blast-hit radius (45 plus its radius). Otherwise keep the node and allow another wire capture after 0.6 seconds. Direct node contact still detonates immediately.
- **Numbers:** Venom spit cooldown is nine seconds; Holy's base contact attack is 7.5.

Sniper feedback adds a fine predictive line, a lock cue, a distinct heavy report, recoil, hit-stop and damage-scaled knockback. Both 1v1 and 2v2 include the changes. New mechanism tests, 196 ordered matchups, 192 controlled moving-target cases, nine browser scenes, desktop/mobile interaction checks and 117 audio waveform profiles passed. Waveforms verify technical output; subjective sound quality requires playtesting. These are functional checks, not a new balance verdict.

![Ranger fire modes and impact feedback](preview-salvo.png)

[Exact rules and limits](SALVO_DESIGN.md) · [Current verification](VALIDATION.md)

## Previous: Predictive mirrors and wider trap networks

An entire Reflector stance with **zero health loss** earns one pending prediction. It waits for an approaching collision, an aimed attack warning about to finish, or an incoming physical flyer; then it opens the normal finite stance immediately, bypassing cooldown and the usual opening warning. Silence blocks activation. Actual HP loss from any source removes the empty-stance benefit; full shield/mirror absorption still qualifies. Interrupted stances do not grant a free prediction. The HUD shows pending prediction and an active predictive stance.

Reflection and awakened storage now use the actual damage origin. Enemy bullets, spells and Magnet repulsion damage can return damage to their owner. Attraction-induced wall hits and Accelerator wall follow-ups still damage the Reflector, but neither reflect to the pushing orb nor fill counter storage. Detached returned weapons retain their existing nonrecursive rule.

Traps connect all unobstructed node pairs within **180 units**, including multiple links per node. Current base capacity is five; awakening permits **seven**. The moving wire always selects the **farthest available armed node**, switching as the caster moves or nodes become unavailable. Cover can block wires. The existing 0.3-second capture, fixed-position blast, fragments and disarming remain.

The focused mechanism checks, resource regression, 196 ordered-pair physics checks with frame-rate/speed reproduction, and six actual browser viewport/mode checks passed. See [verification records](VALIDATION.md). Prior balance results below belong to the preceding version; they do not measure these new rules.

## Previous: Character tactics and stronger feedback

- **Normal:** a near miss can trigger a brief vulnerable turn-and-chase, with its own seven-second cooldown.
- **Venom:** every twelve seconds fires a predictive liquid projectile with mild aim error. A hit deals damage and adds poison; a miss creates a pool at a wall, cover or maximum range. Both pool sources share the two-pool limit. Spray poison lasts one second at 40% potency; miss pools last 2.5 seconds at the same reduced potency. Contact damage is 6.5 to budget for the new ranged option.
- **Ranger:** ordinary shots start with distance-dependent spread. Effective main-round hits improve six-step calibration, misses remove one step, and full calibration removes spread. Charged volleys, heavy rounds and lasers keep precise prediction.
- **Reflector:** mirrors return all detached physical flyers, including counter rounds, curved blades, clocks, venom and fragments, preserving their abilities at 55% damage. Rays, light columns and waves are excluded; returned entities cannot recurse.
- **Trapper:** direct node contact detonates immediately; crossing a sensor wire starts a 0.3-second physical pull followed by a blast at the node. Blasts push hard, briefly stop the action and release four low-damage fragments. Awakening adds a moving wire to the farthest available armed node. Base permits five nodes; awakening permits seven; disarming cancels captures.
- **Holy audio:** landings and hits now have a short pressure attack and deeper impact body; the awakening charge bell is louder. Shared wave sounds and voice limits prevent a bell on every column.

![Current skill-feedback frames](preview-tactics.png)

The 7,200-shot controlled aim check measured Ranger accuracy at a 240-unit starting distance as **71.3% / 85% / 94% / 100% / 100% / 100% / 100%** for calibration levels 0 through 6; Venom hit 50.7%, with a pool on every miss. Only level six removes actual spread; reliable close-range hits at lower levels do not imply zero error. These are stationary-shooter, moving-target tests with wall bounces, not a live-match balance verdict. New mechanism checks, current regression suites, nine browser skill scenes, ten viewport/mode interactions and 113 audio waveform checks passed. Audio checks verify technical output; subjective listening still needs user review. [Design and exact limits](UPGRADE_DESIGN.md) · [Validation](VALIDATION.md).

Five held-out seeds against thirteen other types, from both starting sides, give the five upgraded roles win/draw scores of roughly **42–58%** after the requested parameter changes. This is an initial check, not proof of equal strength.

## Previous: Holy orb and clearer light effects

Holy now uses a near-white orb with a centered halo emblem and white cylindrical light pillars with a rounded elliptical base, a fast descending head, a landing flash and expanding ground shock. The halo is horizontal. Each pillar is **35 units wide** (damage radius 17.5) and remains for **0.9 seconds**: landing deals 6 damage in triangle fields or 4.2 in the awakening sweep; later contact deals 1.2 / 0.9 damage every 0.35 seconds. Same-caster contact damage does not stack. Each awakening cast allows at most three landing hits and four contact ticks per enemy. Larger triangle fields still schedule more drops, at 1.1-second intervals; random pillars and warnings maintain 51 units of spacing; awakening bands use fixed synchronized grid positions. The diagonal sweep now drops each entire diagonal band simultaneously every 0.5 seconds, and another sweep cannot begin while the previous one remains. After three continuous personal seconds outside its own triangle circle, Holy gains a 5-point ward lasting five seconds, on a ten-second cooldown. No active circle counts as outside; entering its own circle resets the charge. Enemy contact with the ward inflicts a three-second sacred burn (0.5 damage every 0.5 seconds); repeated same-caster contact refreshes duration without stacking. Only the initial landing hit from a light pillar extends an existing burn by two seconds; subsequent contact damage does not. Holy-water stains stay fixed, retain reflections and fade independently after 4.5 seconds; each caster supports one active triangle. Sound now uses a shared soft air/choir bed for each wave, a short bass impact for actual hits, and a quiet contact cue. Stronger bass landings with an audible midrange attack add weight without a bell per column. A bell is reserved for awakening charge instead of every pillar. Effective landing hits retain knockback, squash, hit-stop and ground shock. Both modes include all fourteen orbs, with the battle clock shown as `00:00.00`.

![Holy water, triangle fields and diagonal light sweep](preview-holy.png)

See [Holy rules and limits](HOLY_DESIGN.md). This update passed 311 focused ward/burn checks, 106 offline audio waveform checks and nine browser skill scenes. Landing audio measured about +5.3 dB relative to the previous cue, with no clipping; consecutive diagonal rows now each emit a landing cue. The prior holy10 build passed 112 focused duels, 36 team matches and ten viewport/mode checks; these are historical functional checks, not a fresh balance verdict for this update. [Verification records](VALIDATION.md).

## New: 2v2 team mode

Open **`team.html`**, or use **2v2 团队** in the original page header. Pick two orbs for each team from the full eighteen-orb roster. Team mode uses the same character rules; its larger map and team adapter are isolated from 1v1.

Team mode uses a larger **640×440** arena with three presets: open arena, twin pillars, and staggered cover. Teammates bounce off each other without friendly fire; ranged attacks, control and area damage affect enemies only. Physical objects reflect or stop at pillars, beams are occluded, and phased Ghosts can pass through cover. A team loses when both members are eliminated; simultaneous team wipes draw.

On desktop, Blue's two stat cards sit on the left and Pink's on the right, leaving a larger arena in the center. Orb selectors use bright, larger text that remains readable when locked during a match. Narrow layouts show the arena first, with both teams below. Persistent status slots and overlays keep the arena stable through pauses and results. Mode switching returns to the selected mode's preparation page. Local file playback, seeded reproduction, pause, reset and 1×/2×/4×/8× speeds remain supported.

Combat labels such as Attack, Speed and skill resources use larger, brighter text in both modes. Team rails now sit near the outer page edges, and the arena scales to the width between them instead of centering a narrow three-column block. The page can scroll vertically; the arena and orb proportions remain unchanged. The latest UI checks are recorded in `tests/labels-layout-results.json`.

![Actual 2v2 browser view](preview-teams.png)

See [team rules and isolation boundaries](TEAM_DESIGN.md). Run `node tests/verify-teams.cjs` for team mechanics and complete matches, and `node tests/verify-duel-isolation.cjs` for exact comparisons with 49 unchanged historical 1v1 snapshots (explicitly upgraded characters are excluded; their current behavior has dedicated checks). These are functional checks; team-specific balance tuning is not claimed.

## Gameplay preview

![Ten roles and a generic high-damage impact from the browser](preview-unified.png)

Actual browser frames of all ten roles and the generic high-damage impact, generated by the real simulation modules. The interface is in Simplified Chinese; this README provides an English overview and setup guide.

![Time fields, flying clocks, silence and shield-integrity waves](preview-time.png)

The Time orb adds local slow-time zones and predictive clock bombs. [Temporal and impact rules](TIME_DESIGN.md) describe the precise silence boundaries.

![Magnetic pulls, wall slams, redirected flyers and time erosion](preview-magnet.png)

Current rules: the Time orb slows enemies by **90% (10% time rate)** and erodes them inside its zones. Its collision damage is reduced to 6. Clock silence adds two seconds to charging or waiting attacks. The new Magnet orb pulls distant enemies, repels nearby enemies, redirects physical flyers, and awakens into a capture-and-launch polarity reversal. See [magnetic and time rules](MAGNET_DESIGN.md).

![Ghost phasing, fear, triple lunges and magnetic miss recovery](preview-ghost.png)

The Ghost orb periodically phases through bodies and physical attacks while immune to damage, with wall bounds preserved. Contact inflicts timed fear; its awakening adds three predictive lunges and an exit soul burst. Failed magnetic captures now grant a bounded stronger and better-aligned next pull; pull-wall hits deal a light energy-based follow-up. [Current rules and boundaries](GHOST_DESIGN.md).

## Features

- Seventeen orb types, including mirror matches, with distinct melee, ranged, defensive, and area-control mechanics.
- Automatic movement in a compact rectangular arena. Walls reflect motion; orb collisions exchange momentum along the contact normal.
- One awakening per orb after **15 simulation seconds or at 50% health or below**, whichever happens first.
- Health bars, attack and speed values, ability resources, cooldowns, status effects, battle time, and a winner or draw result.
- Pause/resume, full reset, reproducible random seeds, and 1× / 2× / 4× / 8× simulation speed.
- Distinct wall and orb collision sounds, synthesized skill audio, particles, impact flashes, trails, and stronger awakening feedback.
- A responsive dark layout with stable status slots and an arena that keeps its size when a battle ends.
- Fully local gameplay: no account, network connection, backend, installation, or build step required.

## Orb roster

| Orb | Combat identity | Awakening |
| --- | --- | --- |
| Normal | Builds fist momentum from health damage and partial shield contact; three charges arm the next effective collision as a heavy strike. A collision drought builds a capped damage bonus; a close near miss can trigger a short turn-and-chase. | Heals up to 8 HP, gains permanent collision damage, and heavy strikes add knockback, a brief impact stop, and a short directional fist wave. |
| Vampire | Restores 38% of actual attack damage, leaves a five-second blood mark, and stores blood energy from effective contacts. | Waits for range before spending blood energy on a seven-pulse tether; a complete channel consumes the mark for a finisher, while distance hysteresis and a short grace period prevent edge flicker. An interrupted chain refunds up to 1.2 seconds; a captured mark survives expiration during a complete channel. |
| Accelerator | Builds cruise speed over time, +5 per wall and +18 per enemy, capped at 365; strong impacts transfer momentum and cause a follow-up wall hit. | Invulnerable, decaying ricochet dash; ends on enemy contact, then cruise falls to 82%, capped at 285, before rebuilding; an empty natural dash returns up to 10 lost cruise speed, with a 2-second refund of the next dash cooldown. |
| Thunderstorm | Wall charge strengthens predictive lightning; actual contact and bolt hits build conductive marks with a finite third-hit discharge. | Three separately warned relay strikes, finite tracking and final locks. |
| Charge | Wall charge, traveling perimeter currents, conductive contact marks and fixed grounding discharge. | The body turns into finite wall-following lightning, arcs to nearby enemies, then reforms inward. |
| Stellar | Three persistent, energy-building satellites launch actual bouncing comets, resonate on distinct hits, then return. | Recall, spiral collapse, compressed core, expanding supernova ring and three rebirth comets. |
| Demon | Contact brands, telegraphed extending claws and 3.2-second physical chains; a separate follow-up executes once while preserving the original restraint deadline. | Opposing gates; two captures tighten for one second and execute once, with shared cast damage and control limits. |
| Reflector | Finite defensive stances; one mirror returns detached flyers at 55% damage. Eligible actual damage banks a bounded counter round, released after a short pre-aim. | Two mirrors, 60% immediate reflection; an entire empty stance earns one predictive opening that bypasses cooldown when a real threat approaches. |
| Shield | Periodically gains a short shield window. Actual absorbed damage becomes pressure that can be spent on a stronger collision and finite shove. | Gains a stronger shield; when it breaks or expires, remaining shield HP and unspent pressure power a telegraphed enemy-facing expanding wave that pushes on contact. |
| Ranger | 5.2-second base reload; three ordinary rounds, three calibration layers, ±9/6/3/0° spread; hits build layers, misses lose one. | Each four-second reload selects burst, far-range entity sniper or near-range fan scatter; injured aim uses zero-layer error, sniper hit restores full layers, scatter pays them on deployment and restores a layer per hit. |
| Trapper | Places armed nodes that connect into short sensor wires. Node contact explodes immediately; wire crossing starts a 0.3-second physical capture. Failed captures retain the node; successful blasts push and releases four weak fragments; disarming cuts the capture. | Connects a moving sensor wire to its farthest available armed node, reconnecting after detonation; retains the five-node base / seven-node awakening limit. |
| Boomerang | Throws a curved outbound-and-returning blade. Outbound hits mark enemies, returning hits consume the mark, and a complete catch empowers melee. | Keeps a full-strength main blade and adds a lighter second blade. Partial recovery grants a smaller melee reward; returning finishers and catch strikes have distinct strong feedback. |
| Laser | Charges a visible capacitor, tracks briefly, locks a direction, telegraphs, and fires. Collisions can disrupt charging on a cooldown, but cannot move a locked line. | Keeps a predictive primary cannon, then adds a 0.65-second bounded sweep with finite follow-up damage and push. The sweep no longer replaces the reliable primary hit. |
| Ghost | Periodic phasing passes through bodies, projectiles and trap wires while immune to damage and new control; touching enemies inflicts timed fear. Walls still reflect movement; a post-phase echo replays the actual path and fear damage. | An eight-second cycle with three separately pre-aimed phase lunges, followed by a short-range soul burst when materializing, repeated once by the echo at the end of replay. Overlapping bodies are safely separated without an artificial contact hit. |
| Holy | Real water loops form triangle fields; staying outside its own circle charges a small ward whose enemy contacts inflict sacred burn. Pillar hits extend active burns. | A telegraphed diagonal sweep with 0.9-second pillars, capped at three landing hits and four contact ticks per enemy per cast; first landing hits provide strong feedback. |
| Magnet | Pulls distant enemies and forcefully repels nearby enemies. Attraction contacts and repulsion wall hits deal one kinetic-energy follow-up; an attraction wall hit gives a lighter fallback, and a failed capture improves the next pull up to 36%; pulses bend physical bullets, blades, and clocks, while lasers remain unchanged. | Anchors itself, captures the enemy, then reverses polarity into a powerful launch. Released flyers respond to both phases and curved blades subsequently resume recall. |
| Time | Periodically places short-lived zones under enemies, slowing movement and active casts to 10%, with cooldowns and charging at 50% and dealing periodic erosion damage while its own clock stays normal. | Predictive clocks explode on contact, maximum range, or walls; actual blast hits deal damage and silence for 1.2 seconds, interrupting active casts and adding two seconds to charging or waiting attacks. Each blast leaves the same slow-time zone; misses do not silence. |
| Venom | Erosion and paralysis share four slots (three per kind). Living pools, globs and green mist capture before infection. | Existing erosion calls liquid binding; existing paralysis calls attached hunting mist. Both share normal toxin cooldowns. |

![Actual frames of the Accelerator's decaying dash and wall follow-up](preview-decay-dash.png)

Detailed numbers, recovery rules, and interactions are documented in the [Chinese guide](README.zh-CN.md). Balance is preliminary and preserves distinct matchups rather than guaranteeing a 50% win rate for every pairing.

## Run locally

1. Use **Code → Download ZIP** on GitHub and extract the entire archive, or clone this repository.
2. Open the extracted project folder, usually `orb-duel-main`.
3. Double-click **`index.html`** and open it in a modern Edge, Chrome, or Firefox browser.

Keep the folder structure intact. Node.js and Python are **not needed to play**. Sound starts after interacting with the page, subject to the browser's audio policy.

For an optional local server, run this from the project folder if Python is installed:

```sh
python -m http.server 8799
```

Then open [http://127.0.0.1:8799/](http://127.0.0.1:8799/). Some browser test pages need this same-origin HTTP setup.

### Controls

| Control | Action |
| --- | --- |
| Left/right selectors | Choose orb types before a match. |
| F / Esc | F cycles landscape recording → portrait recording → exit before or during combat; Esc exits immediately. Portrait panels sit above the arena; the compact composition scales to available height without distorting the arena (the content crop is not fixed at 9:16). Only live combat panels and the arena remain. In this view, Space starts/pauses/resumes and R restarts. If browser fullscreen is unavailable, a clean viewport layout is used. |
| Main button / Space | Start, pause, or resume. Space works when a form control does not have focus. |
| Reset button / R | Reset all state with the same seed. |
| New-seed action | Generate a fresh seed and start another match. |
| 1× / 2× / 4× / 8× | Change the rate of simulation time. |
| Speaker button | Toggle sound. |

Configuration is locked during a match. Opening the rules or switching to a background tab pauses the game.

## Simulation rules

Physics and combat use a fixed **1/240-second timestep**. Rendering rate does not change the rules, and speed controls advance simulation time. Collision separation and contact cooldowns prevent repeated damage from a single touch. Pausing freezes movement, skills, damage, entities, and effects; ending a match freezes combat.

Attacks in the same step resolve together: shields absorb damage first, health damage is allocated fairly, reflection happens once, and surviving vampires heal afterward. Simultaneous deaths produce a draw. Most impact and projectile damage varies by a seeded ±20%; tether and poison ticks use fixed damage. The same orb choices and seed reproduce a match within this version; rule updates may change old results.

There is no trajectory correction after a long collision drought. Late-match damage increases from 60 seconds; unavoidable health loss begins at 150 seconds to end exceptional stalemates without steering the orbs.

## Project structure

Plain HTML, CSS, and JavaScript, using Canvas 2D and Web Audio. There are no runtime packages or generated bundles.

| File | Responsibility |
| --- | --- |
| `index.html`, `styles.css` | Interface, controls, and responsive layout. |
| `js/config.js` | Orb definitions, constants, and seeded randomness. |
| `js/physics.js` | Movement, wall reflection, momentum exchange, and separation. |
| `js/skills.js` | Skill hooks and simultaneous damage resolution. |
| `js/world.js` | Projectiles, blades, beams, traps, and poison pools. |
| `js/aim.js`, `js/flyers.js` | Seeded aim error, physical flyer identity and ability-preserving returns. |
| `js/mines.js`, `js/pursuit.js`, `js/tactics-render.js` | Capture networks, near-miss chase and their dedicated visual feedback. |
| `js/characters.js` | Poison, impact, and curved-blade resource loops. |
| `js/roles.js` | Character loops for fist momentum, blood energy, shield pressure, magazines, capacitors, mirrors, and trap networks. |
| `js/awakening.js` | Awakening triggers and empowered abilities. |
| `js/holy.js` / `js/holy-render.js` | Real-path holy water, circumcircle geometry, light scheduling and dedicated rendering. |
| `js/ghost.js` | Phase immunity, intangible contacts, timed fear, triple lunges and safe materialization. |
| `js/magnet.js` | Magnetic pulses, kinetic follow-ups, physical flyer deflection, and polarity collapse. |
| `js/temporal.js` | Actor-local slowdown, clock bombs, silence, and cast interruption. |
| `js/engine.js` | Fixed stepping, lifecycle, simulation clock, and effect events. |
| `js/charge.js`, `js/charge-render.js` | Charge, conductors, moving wall currents and actual lightning form. |
| `js/stellar.js`, `js/stellar-render.js` | Three real satellite identities, comets, resonance and supernova stages. |
| `js/audio.js`, `js/spectacle.js` | Synthesized audio and ability feedback. |
| `js/renderer.js`, `js/app.js` | Canvas rendering, UI updates, and animation loop. |
| `tests/` | Logic checks, browser checks, and recorded reports. |

Both 1v1 and 2v2 use the same role modules, with team-specific dimensions and adapters. New orb types can reuse the existing configuration and skill modules without replacing the physics engine.

## Development checks

These checks require Node.js, but use built-in modules and need no package installation. Run them from the project folder:

```sh
node tests/verify-arcana.cjs
node tests/verify-arcana-matches.cjs
# Earlier suites below cover historical or broader roster assumptions.
node tests/verify-conductor-stellar.cjs
node tests/verify-cosmic.cjs
node tests/verify-adaptive.cjs
node tests/verify-mirror-network.cjs
node tests/verify-salvo.cjs
node tests/verify-echo.cjs
node tests/verify-sync.cjs
node tests/verify-tactics.cjs
node tests/measure-aim.cjs
node tests/verify-engine.cjs --quick
node tests/verify-holy-seals.cjs # current Holy independent Arcana, 31 focused checks
node tests/verify-holy.cjs
node tests/verify-holy-ward.cjs
node tests/verify-ghost.cjs
node tests/verify-magnet.cjs
node tests/verify-time.cjs
node tests/verify-unified.cjs
node tests/verify-power.cjs
node tests/verify-dash.cjs
node tests/verify-characters.cjs
node tests/verify-roster.cjs
node tests/verify-awakening.cjs
node tests/verify-recovery.cjs
node tests/verify-world.cjs
node tests/verify-mechanics.cjs
```

For broader simulation checks, use `node tests/verify-engine.cjs`; audio and visual isolation checks are in `verify-feedback.cjs` and `verify-spectacle.cjs`. `measure-balance.cjs` generates balance samples. The full simulation checks are more expensive than the focused checks above.

Browser checks include `tests/theatre-ui.html`, `tests/compact-ui.html`, and `tests/status-stability.html` for layout and interaction, plus `tests/roster.html`, `tests/dash.html`, `tests/characters.html`, and `tests/audio.html` for real skill frames and sound.

The preceding ten-role iteration combines practical pre-aiming, named heavy attacks, and generic impacts for a single attack dealing at least 15 actual HP damage. It passed the full engine checks, 192 moving-target comparison cases, two independent balance sets totaling 3,200 matches, 75 offline-synthesized sound checks, and six browser viewport checks. The moving-target scenarios show both Ranger and Laser awakenings delivering more damage than their base forms. These controlled scenarios are not guarantees for every matchup.

The preceding eleven-orb Time update passed 4,840 complete engine matches, 132 focused Time matchups, 192 moving-target cases, 81 offline audio waveforms, and five browser viewport checks. Named heavy attacks now scale extra impulse with actual HP damage and retain longer decaying inertia. An independent 1,452-match sample gave Time a 46.7% non-mirror score; this is preliminary balance evidence, not a guarantee for every matchup. See [current validation](VALIDATION.md).

Open `tests/magnet.html` for current magnetic and erosion frames. Open `tests/time.html` for actual Time-orb and shield-integrity frames. Open `tests/unified.html` for a live demonstration of all ten roles and generic high-damage feedback. The [validation record](VALIDATION.md) distinguishes current results from preserved historical records.

The historical [validation record](VALIDATION.md) describes the preceding roster version's test runs, including 411,746 role assertions, 4,000 engine matches, 8,000 balance matches across acceptance and holdout seeds, synthesized-audio checks, nine real role frames, and arena stability checks at 11 viewport sizes. The engine matches overlap the balance acceptance set; these counts do not represent 12,000 independent matches.


## Preceding magnetic and erosion validation

The preceding twelve-orb build passed 5,760 full engine matches, 120 focused Magnet matchups, 144 focused Time matchups, 192 moving-target cases, eight real browser skill frames, five viewport checks, and 88 offline audio waveforms. An independent 1,728-match sample gave Magnet a 55.5% non-mirror score and Time 48.3%. These are preliminary matchup samples, not a guarantee of complete balance. Current raw records and precise coverage are in [VALIDATION.md](VALIDATION.md); earlier records are preserved as history.


## Preceding ghost and magnetic recovery validation

The thirteen-orb build passed 6,760 full engine matches, 130 focused Ghost matchups, 192 moving-target cases, eight real mechanism frames, five browser viewport checks, live magnetic-recovery values at two narrow widths, and 97 offline audio waveforms. Controlled attraction contact improved from 13/24 to 24/24 with the maximum bounded compensation; this is not a guarantee for arbitrary matches. Triple-lunge awakening delivered more real damage in the controlled Ghost moving-target cases. An independent 2,028-match sample gave Ghost and Magnet 56.3% non-mirror scores; matchups still vary. See [current validation](VALIDATION.md). Open `tests/ghost.html` for current mechanics.

活体毒液参数与专项检查：`js/living-venom.js`、`js/living-venom-art.js`、`node tests/verify-living-venom.cjs`；规则见 `docs/design/VENOM_V2.md`。

Venom awakening evolution: successful same-toxin resonance grants +2% to that toxin for the match, independently capped at +20%. One reward per field visit; mist must actually attach. See `docs/design/VENOM_V2.md`; implementation: `js/venom-evolution.js`.


### 2026-10-18 — Laser evasion and damage reduction
Awakened Laser predicts approaching hostile bodies with a 0.12s horizon and a 20-unit safety margin. A 0.16s lateral light burst (520 nominal speed, 8s cooldown, 6% capacitor) precedes the existing real heat-blade counter (8% capacitor when awakened, 15% before awakening). Bullets/clocks/traps trigger only the blade. The burst is physical movement with wall/obstacle checks and no invulnerability; silence cancels it, and temporal slowing still applies. Main-beam firing remains uninterrupted; an urgent burst may cancel aiming while retaining capacitor.
“免伤” is a reusable 30% incoming-damage reduction, applied once before shield settlement, including piercing, reflected and periodic damage. Laser Arcana has it throughout, preserving its existing brief sweep invulnerability. Normal completion resets the burst cooldown and grants one free burst; the following blade still costs capacitor. Vampire Hunt is available before awakening as well, retaining the 6s mark-absence requirement and 10s cooldown. These ordinary changes apply to Classic, Arcana and Team; Laser Arcana stays mode-specific.
Targeted checks: `node tests/verify-laser-jet.cjs`, `node tests/verify-laser-blade.cjs --quick`, `node tests/verify-blood-hunt.cjs --quick`. Quick Hunt skips its obsolete historical snapshot comparison and full-match replay; quick Laser skips its two long natural matches. See [design brief](docs/design/experiments/laser-evasion.md).


### Boomerang hunt / twin-blade cooperation

The ordinary Boomerang kit now uses single-blade return pursuit before awakening, crossing twin returns at close range after awakening, and a real blade rendezvous launching one non-returning blade at long range. Actual catches grant an 8-second single/twin weapon slash rather than a body-contact multiplier. Tuning is centralized in `js/boomerang-hunt.js`; see [mechanics and review](docs/design/experiments/boomerang-hunt.md). All three production entries share this ordinary kit; Arcana dance remains separate. Focused check: `node tests/verify-boomerang-hunt.cjs`.
