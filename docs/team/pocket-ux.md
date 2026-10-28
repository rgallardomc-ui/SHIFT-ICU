# Phone-first intervention loop — design and research

October 28, 2026. New user direction supersedes CABG/controller-first entry: compact phone play, touch-drag movement, older hypotensive patient, nursing intervention mini-games. This is a design review; real-phone enjoyment is not established.

## What the sources support

- **Archero:** Habby’s [official App Store listing](https://apps.apple.com/us/app/archero/id1453651052) describes rounds, restart and varying skill combinations; Apple’s editorial note describes bite-size battles with randomized power-ups. The retrieved text does **not** establish the precise joystick gesture. Floating one-thumb movement here is Rafael’s requested adaptation. Borrow short rounds and perceptible variation; exclude death punishment, energy gates, subscriptions and grinding.
- **Mini Metro:** the developer’s [official presskit](https://dinopoloclub.com/press/mini-metro/) documents minimalist network play, evolving demand and multiple modes. **Design inference:** a small readable system can gain replay value from changing task arrangements rather than adding controls. Medical orders must remain explicit and consistent.
- **WebKit:** [safe-area guidance](https://webkit.org/blog/7929/designing-websites-for-iphone-x/) explains that full-screen content still needs inset-aware padding to avoid sensor housing and the Home indicator. Full-screen presentation alone does not prove native-app behavior or compatibility on today’s Safari.

Primary retrieval refs: `turn18view0`, `turn18view1`, `turn20view0`. No third-party gameplay claim is relied on.

## One loop worth testing

**Notice deterioration → touch bedside clues → verify prescribed support / line → perform the intervention mini-game → watch a specific setup or patient finding change → reassess → finish with one useful lesson → replay a new arrangement.**

Keep patient, pump and setup tray within roughly150 screen pixels of each other. Movement provides embodied interaction, not repeated travel. Supply pickup should become an actual held object or a filled component slot. The main loop should require no document, chart tab or Continue button.

For a390×844 portrait reference, budget44px top-safe +60HUD +56objective +580play/workspace +70thumb actions +34bottom-safe =844. The play area includes its lower thumb zone. Mini-games replace that area; never append a second screen beneath it. Insets and shorter browser viewports must resize the arena rather than cut off controls. Keep48px minimum action targets and a single-line objective.

**Gesture contract:** pointer-down anywhere in the lower playfield anchors a floating joystick; drag supplies direction/magnitude; release stops immediately. Respect pointer cancel, lost capture, blur and hiding. Ignore a second finger. A nearby contextual action appears after release/dwell, not during a pass-through; latch it until leaving the zone or changing stage. Provide tappable equivalents for precision drags and accessibility. Neither gesture nor time pressure may bypass clinical prerequisites.

## Five critiques / acceptance tests

1. **Phone density:** at390×844 and a shorter390×700 viewport, patient, objective, pause and current action fit without horizontal or page scrolling. No desktop hero/header/footer or permanent D-pad takes space.
2. **Touch response:** drag, reverse, release and cancellation visibly control the nurse without browser panning. Thumb occlusion never covers the current clinical clue or primary action.
3. **Intervention is the play:** label matching, tracing a verified line, fitting components, priming/de-airing, pressure-bag pumping and aligning a transducer visibly change their objects. No repeated modal/Continue sequence. Insertion remains assigned to the trained operator; do not reward simulated independent cannulation.
4. **Useful consequences:** show what changed and what remains pending in one line. Do not imply a call, A-line or faster tapping cures shock. Escalation and prescribed support must not wait for the A-line puzzle.
5. **Replay/mastery:** quick replay rearranges component or matching positions while keeping orders safe. Calm / optional practice pressure change pacing, not authority. No speed score or absence penalty. Test a full run, interruption/restart and the first30seconds of replay.

## Verification status

Research/design complete. Integrated phone-layout and interaction QA pending root’s preview. An iframe viewport test can verify layout geometry and browser interaction; it is not a physical iPhone, Safari, multitouch or installed-PWA test.
