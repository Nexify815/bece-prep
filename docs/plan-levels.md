# Plan — Levels (fixed steps, reduced volume), ~6-term Stair steps, learn-first days

> Status: parked. Agreed with user on 2026-11-15; not yet scheduled.
> Related discussion: docs/journey.md (user-view flow).

## Decisions locked

1. **Streak (Duolingo-style):** any *qualifying task* in a day keeps the streak.
   Qualifying = any XP-earning action **except** first-time glossary "learned" taps.
2. **Auto-level both ways:** ± thresholds; students can override manually in Settings.
3. **Stair steps:** split to **~6 terms** (short final chunks merge upward if <4).
4. **Minutes:** display hint only ("Level 2 · ~40 min"); tasks are the real unit.

## A. Stairs split to ~6 terms (global)

- `buildPath()` (src/data/index.js) chunks each subStrand's terms into steps of ≤6.
- Split strand keys: `${sub}#1..#n`, shown as "Number & Numeration (2/5)".
  Strands fitting in one chunk keep legacy `${sub}` key.
- Legacy `${sub}` completion counts as completing ALL its chunks (no migration).
- Questions attach by `termId`; zero-question chunks merge with a neighbor.
- Summit mega-quiz, failed-step 1-heart lock, Match It checkpoints: unchanged.
- Roughly: math ~24 steps, science ~39, english ~20, social ~17.

## B. Steps fixed at every level; Level scales only volume

Weekday plan, always, in order:

> Learn → Stairs (same chunk) → Glossary → Quiz → Final

| | L1 Starter | L2 Regular | L3 Committed | L4 Serious | L5 Exam |
|---|---|---|---|---|---|
| Hint | ~30 min | ~40 min | ~50 min | ~75 min | ~1 h 45 |
| Learn + Stairs (6-term chunk) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Glossary new terms | 2 | 3 | 5 | 6 | 7 |
| Quiz run | 8 q | 10 q | 15 q | 15 q | 20 q |
| Final step | ≤5 mistakes | ≤8 mistakes | full bank | bank + Past Paper | bank + Mock Exam |

- Learn and Stairs share the same next chunk (buildPath order): teach, then strict attempt
  (typed recall → quiz → Match It).
- Glossary step ticks only via "learned" taps (Level 1 = just 2 taps).
- Quiz difficulty stays least-attempted-first (Easy for new users); pass mark 60% unchanged.
- Sunday stays a light review day at all levels.
- XPs unchanged; no Level multiplier.
- New `taskLog: { date: true }` required — "any task counts" streak rule.

## C. Streaks

- `toggleLearned` no longer calls `markPractice`.
- Everything else (lessons, stairs, quizzes, review, papers, mocks, sprints,
  Section B, QotD) keeps streak via addXp → markPractice.

## D. Auto-level both ways

- New state: `levelMomentum` (int, clamped), `levelEvalDate`.
- First app open of a new day evaluates yesterday:
  - all yesterday's planned steps done → momentum +1
  - zero qualifying tasks → momentum −1
  - momentum ≥ 3 → level up (max 5), reset, snack "Leveled up to Level N!"
  - momentum ≤ −2 → level down (min 1), reset, snack "Eased down…"
- Light days evaluate normally.
- Manual override in Settings resets momentum.

## E. Minutes → level + hint

- Remove `goalSecs`, `sanitizeGoal`, `DAILY_GOAL_MIN`, `scaleStepsToGoal`, `goalMinutes`.
- New `studyLevel` (default 1) + `LEVEL_META` (label, ~min hint) in plan.js.
- Migration: existing goalSecs 30→1, 60→3, 90→4, 120→5 (current default user → L3).
- `usageSecs` still tracked silently for report stats.
- Home ring → task ring (steps done/total); chip: "Level 2 · ~40 min".
- DailyUsage, Schedule, ProgressReport switch from minute-goal to tasks + level.

## F. Welcome / onboarding

- "Daily study goal" picker → "Pick your pace": 5 level cards (hint + one-line
  "what a day looks like"), Level 1 preselected.
- `startOnboarding(name, level)`; `initialGoalSecs` → `initialLevel`.

## G. State / sync / backup

- defaultState gains `studyLevel`, `levelMomentum`, `levelEvalDate`, `taskLog`.
- Backup `SB1.` stays valid (missing fields take defaults).
- Firebase merge: `studyLevel` = highest, `taskLog` = union,
  momentum newest by `levelEvalDate`.

## H. Files to change

plan.js, storage.js, data/index.js, App.jsx, WelcomeScreen.jsx (pace picker),
Settings.jsx (level row), Home.jsx (task ring), DailyUsage.jsx, Schedule.jsx,
ProgressReport.jsx, Staircase.jsx (chunk labels + legacy completion check),
Learn.jsx (optional: wire self-mark → SRS — NOT confirmed by user yet).

## I. Verification

Browser pass of: onboarding → plan day → stairs chunk → auto-level snack;
npm run build + npm run smoke. No JSON content changes; progress maps untouched.

## Open

- Learn "I remembered it"/"Didn't know it" → wire to SRS (user hasn't confirmed).
- Tune L1 knobs once running.
