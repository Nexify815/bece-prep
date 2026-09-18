# Session Summary — StudyBuddy (BECE Prep)

Last updated: 2026-09-18. Written so a fresh opencode instance can pick up
where this session left off.

## Most recent session (2026-09-18) — 13-item effectiveness pass (guest-first, hearts, recall, backups)

Strict review of the app was delivered (UI B, Elements B+, Functionality B,
Effectiveness C+) with an options menu; the user picked 13 items. **All 13 are
implemented and `npm run build` passes (114 modules).** Everything below is
pushed to `master` (auto-deploys Vercel).

### User-locked item list (this session)
- **1A+C** cloud auto-backup + 7-day backup nudge; **2A** recall-gate learned;
  **3B+D** relabel Mixed Practice + Paper 2; **4A+C+E** past papers free +
  Practice/Challenge toggle + review never blocked; **5C** error boundaries;
  **6A+D** formula/howTo + UI; **7A+B** guest-first + auto-skip auth; **8A**
  6-digit PIN + rate limit + RTDB rules; **9A** TopBar overflow menu; **10A**
  self-host Nunito + precache; **11B** full-word fill-blank matching; **12B**
  real in-quiz matching; **13A** shorten plan copy.

### What shipped (file map)
- **Guest-first / auth (7A,7B):** `storage.js` default now `authSkipped: true`,
  plus `lastBackupAt`, `backupNudgeDismissed`, `studyMode: "practice"`. Removed
  the hard `AuthGate` return from `App.jsx`; **deleted
  `src/components/AuthGate.jsx`**. Unused `skipAuth` removed; sign-out still
  keeps guest mode (`signOutAndStayGuest`).
- **Backups (1A,1C):** new `src/components/BackupScreen.jsx` at route `/backup`
  (download `.json` via `downloadBackup`, cloud account form, restore code).
  New dismissible `backup-nudge` banner in `App.jsx` gated by `isBackupStale`
  (7 days) and `backupNudgeDismissed !== todayKey()`; "Back up" → `/backup`,
  "Later" sets the dismiss date. `markBackedUp` sets `lastBackupAt`.
- **Security (8A):** `firebase.js` `PIN_LENGTH = 6`, `validPin` requires 6,
  `pinError(raw, {signup})` (6 on signup, 4–6 on sign-in so old accounts still
  work); client throttle `authLockRemainingMs` / `recordAuthFailure` /
  `clearAuthFailures` (5 fails / 15 min, localStorage `sb_auth_fails`). Wired
  into both `BackupScreen.jsx` and `Settings.jsx`. **New `database.rules.json`**
  (progress locked to `auth.uid`, leaderboard readable + owner-write).
- **Error boundaries (5C):** `ErrorBoundary.jsx` (chunk-load auto-reload once
  per 10 s via sessionStorage, reload/home buttons, `resetKey`). Wrapped
  globally in `main.jsx` and per-route in `App.jsx`.
- **Practice/Challenge (4C):** `loseAHeart` in `App.jsx` is a no-op when
  `studyMode !== "challenge"`. Settings has a "How you practise" toggle
  (`studyMode` / `onSetStudyMode`). Hearts badge/timer unchanged.
- **Past papers free (4A):** `/past-papers` renders `<PastPapers free>` (no
  hearts gate, no heart loss; `free` also skips XP).
- **Review never blocked (4E):** Glossary "Test yourself" button no longer
  `disabled` when `hearts === 0`; ReviewMistakes still loses hearts only in
  Challenge.
- **Recall gate (2A):** `Glossary.jsx` modal "Learn it — type the meaning"
  uses `definesMatch(typed, definition)` before adding a term to the review set
  (awards `XP.perCorrect` on pass, `playRight`); "Add without the test"
  fallback retained. Definition/example are hidden during recall.
- **Real matching (12B):** rewrote `MatchQuestion` in `Quiz.jsx` — tap left
  then right, correct pairs lock green, wrong tap marks red and can be retried;
  question counts correct only with zero wrong taps; integrates XP (`perCorrect`
  + perfect bonus) and the every-3-wrongs heart rule. Removed dead
  `matchOption` state. **Note: zero `match`-type questions exist in the data,
  so this UI won't appear until match content is authored** (the stairs already
  use `MatchingGame.jsx`).
- **Mock exam honesty (3B,3D):** `MockExam.jsx` "Standard BECE" relabeled
  **"Mixed Practice"** (all four subjects in one 40-question paper); added a
  top "Paper 2 — Writing" row that navigates to `/section-b` (SectionB already
  awards `XP.essayReward`).
- **Formula/howTo (6A,6D):** new `src/components/TermExtras.jsx` (renders
  Formula + How-to cards only when present). Used in `LessonPlayer.jsx`
  (strict-recall and free-learn teach cards) and the `Glossary.jsx` modal
  (hidden during recall). Seeded `formula`/`howTo` on four math terms:
  `math-046` Circumference, `math-049` Mean, `math-050` Median, `math-051`
  Mode. `src/data/math.json` only.
- **TopBar overflow (9A):** replaced the desktop-only Shop/Settings span with a
  `⋯` (`FiMoreHorizontal`) `.topbar-more-menu` containing Shop, Settings, and
  Backup. Outside-click now closes both the hearts and more menus.
- **Self-hosted font (10A):** `public/fonts/nunito-var.woff2` (39 KB Nunito
  variable, weight 200–1000); `@font-face` at the top of `styles.css`; Google
  Fonts `<link>`/preconnects removed from `index.html`; `sw.js` cache bumped
  `studybuddy-v3` → `v4` and `./fonts/nunito-var.woff2` added to `CORE`.
- **Fill-blank matching (11B):** `answer.js` accepts a whole answer word or a
  leading fragment (`g.length >= 3 && c.startsWith(g)`), so "carb" passes for
  "carbon dioxide" but "airplane" no longer passes for "air".
- **Plan copy (13A):** `plan.js` daily-step details and `weekPlan` day notes
  shortened to ≤10 words.

### Still open / needs the user
- **`database.rules.json` must be deployed to Firebase manually** (user said
  they'll do this later). Also still unverified that Vercel's env vars match
  `.env.local`.
- **Match content:** 12B UI is live but no `match` questions exist; author a
  starter set if wanted.
- Not re-verified against the live URL this session (deploy runs on push).

### Build note
`& "C:\Program Files\nodejs\npm.cmd" run build` → 114 modules, ~19 s. Main
chunk `index-*.js` ~705 kB (gzip ~175 kB); firebase/react already split.

## Previous session (2026-09-16) — Exam Mode shipped, blank-page fix, confirmed live

Two commits, both pushed to `master` (push auto-deploys Vercel):
- `5808eae` "Exam Mode: sprint prep with countdown, coverage, blitz drills,
  weak-spot clearing, paper drill, checklist and cram sheet" (9 files,
  +1115/−7): new `src/components/ExamMode.jsx` (750 lines) + `src/lib/exam.js`
  (151 lines); touched `App.jsx`, `PastPapers.jsx`, `TopBar.jsx`, `router.js`,
  `storage.js`, `styles.css`, `.gitignore` (added `.aider*`).
- `bc75fcd` "fix: blank exam page (params not destructured from route)" — 1
  line, `src/App.jsx`.

### Exam Mode (Cram Mode) — user's locked decisions
- Entry: 36×36 corner button in TopBar (top-left), navigates to `/exam`,
  hidden on `/exam` screens. **No XP, hearts, streaks or locks** — pure
  revision. Paper/blitz/weak feed `recordExamSession` into
  `state.examMode.sessions` (capped 40) but award nothing.
- Screens (all in `src/components/ExamMode.jsx`):
  - **SetupScreen** when no `examMode.date` (or "Change setup"): date picker
    (min = today) + subject chips (empty selection = all four).
  - **Dashboard** (default export): countdown (`daysUntil`), coverage %
    (`known`+`unsure` = covered), weakest topics (top 3 of current subject's
    wrongAnswers via `questionTopic`), high-yield topics, "next up"
    recommendation (`recommendNext`), 1–5 confidence chips, recent sessions.
  - **Paper drill** (`ExamPaper`): reuses `<PastPapers free scope={[k]}
    onResult={...}>` — no hearts/XP, filtered to the current subject.
  - **Blitz** (`ExamBlitz`/`BlitzRun`): 20 tap-only questions (subject MC+TF +
    past-paper), 5-min timer; wrong → `onWrongAnswer`; restart via keyed remount.
  - **Weak-spot** (`ExamWeak`/`WeakRun`): pool = current subject's
    wrongAnswers; right 3× in a row clears from the mistakes bank; empty pool
    shows a CTA instead.
  - **Checklist** (`ExamChecklist`): per-topic Know it / Shaky / Not covered →
    `examMode.syllabus[subject][topic]`, drives coverage + "next up".
  - **Cram sheet** (`ExamCram`): every glossary term grouped by subStrand;
    filters All / Needs work / Shaky.
- Routes: `/exam` + `/exam/paper|blitz|weak|checklist|cram?subject=<key>` (the
  query param comes from `route.params`). `goBack`: sub-screens → `/exam`,
  exam home → `/`.
- Helpers (`src/lib/exam.js`): `subjectTopics`, `questionTopic`, `coverageFor`,
  `highYieldTopics`, `weakTopics`, `recommendNext`, `daysUntil`, `blitzPool`,
  `shuffle`, `activeSubject`, `subjectLabel`, `EXAM_STATUS`. All data-derived
  from the shipped glossaries + past papers — nothing custom to maintain.
- Storage: `state.examMode = { date, subjects, syllabus, confidence, sessions }`
  (default shape = `defaultExam` in App.jsx; sessions capped 40).

### Deployment / live status
- Vercel project linked: `projectName bece-prep` (`prj_RDNOxI3tXFOEsAzSO802LgiPqXcS`,
  org `team_8D5h2fyEz3GJ38ahcKTzArLb`). Push to master auto-builds → promotes.
- User-facing URL: **https://bece-prep.vercel.app** — currently serving
  `index-Dc-b13sl.js` = the `bc75fcd` build (verified by matching the hash in
  the served `index.html` to the last `npm run build`). Latest deployment
  alias: `bece-prep-5ll0zskkc-...` (Ready).
- The `bece-prep-<hash>-kissijames42-2760s-projects.vercel.app` deployment URLs
  are **team-locked** (return a Vercel login page) — verify via the alias
  instead. `/exam` is white ONLY until the app is hard-refreshed (PWA SW caches),
  and a broken state `params` ReferenceError is permanent once cached.

### CRITICAL bug found & fixed (why `/exam` was a blank white page)
- `parseHash()` in `router.js` returns `{ parts, params }`. `App.jsx` had only
  `const { parts } = route;` but the `/exam` branch referenced `params.subject`
  (App.jsx:1003) → `ReferenceError` on every exam render → React unmounts the
  whole tree (no error boundary) → blank white page on all `/exam*` routes.
- **Fix:** `const { parts, params } = route;` (App.jsx:100). Verified: all
  `src/lib/exam.js` exports exist; `PastPapers` accepts `free|scope|onResult`;
  build passes (113 modules; ExamMode chunk `ExamMode-EaCP8l4j.js` 16.46 kB /
  gzip 4.96).
- Lesson: a prior smoke test hit only `/` over HTTP — a client-side
  ReferenceError in a lazy route can't be caught without rendering the route
  in a real browser.

### Online-question import — completed, ZERO imports (deliberate)
- Fetched `ghanaeducation.org` 2023 + 2024 BECE Integrated Science Q&A pages:
  every question already in the banks → importing would duplicate.
- Bank sizes confirmed: science_past.json 91+ (2023:40, 2024:30, 2025:21+),
  math_past.json 102+ (2023:35, 2024:32, 2025:35+), english_past.json 108+
  (2021, 2023:15, 2024:40, 2025:40), social_past.json 88+ (2023:40, 2024:48+).
  All `lastUpdated: "2026-09-08"`. Schema:
  `{ id, year, source, question, options A–D, correctAnswer, topic, explanation }`.

### Tooling notes (this machine)
- `glob()`/grep tools throw `EUNKNOWN (uv_spawn)` — use
  `Get-ChildItem`/`Select-String` via bash or the read tool.
- npm: `& "C:\Program Files\nodejs\npm.cmd" <args>` (PowerShell blocks `npm.ps1`).
- Vercel CLI: `& "$env:APPDATA\npm\vercel.cmd" <args>` (same .ps1 block), authed
  as `kissijames42-2760` (CLI 59.11.2). `vercel ls bece-prep` lists deployments.
- `git` emits harmless LF→CRLF warnings on this box.

## Earlier session (2026-09-10) — "Flaws & Agreed Solutions" pass, per user's locked decisions

Committed + pushed + **deployed to https://bece-prep.vercel.app** as `b89a7eb`
(42 files, +1255/−1544; includes pre-existing uncommitted install-prompt
removal + sprint redesign). Build passes (`npm run build`), preview serves
HTTP 200. Earlier live commit: `ca18455`.

### User overrides locked this session (IMPORTANT — do not re-argue)
- **Flashcards unlock per completed stair STEP** (not after finishing all
  stairs): checkpoint flashcard round right after passing the lesson plus a
  replay button on each done step. Subject-wide deck at
  `/subject/:key/flashcards` stays **summit-gated** (original item 12).
- **Streak freeze costs 300 XP** (user re-overrode the "final" table's 50).
- **Final XP economy (user's "last one" table, all applied in `src/lib/XP.js`):**
  perCorrect 5, perfectBonus 15, perTermLearned 10, lessonComplete 50,
  summitPass 100, qotd 15, sprint10 20, sprint15 35, challengeReward 100,
  essayReward 20. Spending: 1 heart 25 (`XP.heartCost`), 3-hearts pack 60
  (`HEARTS_PACK`, unchanged), **xp2x boost 100**, streak freeze 300, worked
  solution 30 (`XP.solutionCost`), hint 15 (`XP.hintCost`, used by Quiz).
- **Subjects:** only math/science/english/social on screen. French/ICT data
  files are kept but disconnected (`src/data/index.js` repeats the re-enable
  recipe); `src/data/ghanaian.json` deleted. Used CSS vars
  `--subj-french/--subj-ict/--subj-ghanaian` still present (harmless).
- **Skins/mascots are gone.** `Mascot.jsx` is a static cat (🐱 sad, 😸 happy),
  NO store context. Removed `SKINS`/`SKIN_MAP`/`getSkin` from `store.js`,
  `ownedSkins`/`skin` from storage default, and buy/equip skin paths from App.
  Store has only: hearts pack, xp2x, streak freeze.
- **Strict stairs (LessonPlayer `strict === true`, used only by Staircase):**
  teach phase requires **typing** the meaning; `definesMatch` accepts ≥3
  tokens with ≥60% of key definition words; quiz pass = ≥60% correct AND
  `wrongTotal < 5` (forgot + wrong-in-run, `MAX_WRONG = 5`). Failing locks the
  step (`state.failedLessons`); retry costs 1 heart, offered on the failure
  screen and when reopening the locked step from the stairs. Learn.jsx stays
  strict=false → free retry, no lock.
- **Plan is the landing page** at `/` (Schedule with `home` prop + big
  "Your next step" card). Old Home moved to `/home`; BottomNav tabs:
  Home=`/home`, Plan=`/`, Shop=/store, Progress=/progress, Settings=/settings.
- **Settings back** returns to the previous screen: `router.navigate()`
  records module-level `fromHash`; `router.previousHash()`; App `handleBack`
  uses it when `parts[0] === "settings"` (falls back to `goBack()`).
- **PowerShell constraint:** this shell blocks `npm.ps1` — always run
  `& "C:\Program Files\nodejs\npm.cmd" <args>` (install/build/dev).
- The `grep` tool currently throws `EUNKNOWN (uv_spawn)`; use
  `Select-String` via bash instead.

### What changed (all verified: zero leftover `ownedSkins|getSkin|SKIN_MAP|buySkin|equipSkin|SKINS|LIFE_COST_XP`; only `/schedule` ref is the lazy import)
- `XP.js`, `store.js`, `storage.js`: economy + skins removal + new state
  (`failedLessons:{}`, `customTerms:[]`).
- `answer.js`: new `definesMatch(typed, definition)`.
- `router.js`: `fromHash` + `previousHash()`, used by settings-back.
- `App.jsx`: fail/clear-fail lessons, `completeLesson` clears the fail lock,
  `addCustomTerm`/`removeCustomTerm`, flashcards route → `SubjectFlashcards`
  (summit-gated), Glossary passes customTerms, landing = `<Schedule home>`,
  `/home` → Home, settings-back via previousHash, `<LevelUpWatcher>`.
- `LessonPlayer.jsx` (rewrite): strict teach/quiz/failed/flashcards/done
  phases; heart retry; free Learn mode; flashcards checkpoint.
- `Flashcards.jsx` (new): flip deck, self-rate → `onSRS(subjectKey:id, known)`,
  summary, compact mode. Used by LessonPlayer (checkpoint) and Staircase
  (replay).
- `SubjectFlashcards.jsx` (new): summit-gated full-subject deck.
- `Staircase.jsx`: heart retry on failed steps, flashcard replay per step.
- `SubjectHome.jsx`: Feather icons; Flashcards row locked until summit.
- `Glossary.jsx`: custom terms merged ("mine" pill), add form, delete.
- `Schedule.jsx`: `home` landing hero + next-step card.
- `Home.jsx` / `BottomNav.jsx` / `TopBar.jsx`: icons + new tab layout +
  streak-fire classes (≥3 pulse, ≥7 hot) + sprint countdown badge.
- `LevelUpWatcher.jsx` (new): one-shot level-up snack.
- Icon pass everywhere: ReadButton, QuestionOfDay, DailyUsage, ChallengeCard,
  Leaderboard, Drill, ReviewMistakes, WorkedSolution, MockExam, ProgressReport,
  Settings, MegaQuiz (mascot component), SprintScreen, SectionB (chevrons kept).
- `InstallPrompt.jsx` deleted; `main.jsx` BIP listener removed.
- `react-icons` added (`^5.7.0`). Note: **Feather has no Fl**ame/​**Trophy** —
  streak fire uses `LuFlame` from lucide (`react-icons/lu`), trophy uses
  `LuTrophy`. All other icons are `Fi*`.
- `styles.css`: read-btn de-emphasized, streak fire animation, flashcards,
  next-step card, stair-flash, add-term-card/field-label, mascot-result.

### Remaining nits (optional, not blocking)
- Bundle: main `index-*.js` ~676 kB (gzip 165 kB) — mostly the 4 subjects'
  question data. firebase + react already split via manualChunks; the big
  chunk is the data, so lazy-loading the data files would be the real win.
- `npm audit`: 2 warnings (1 moderate, 1 high) + `allow-scripts` notices —
  non-blocking.
- Section B rubric step (16-item item 5) and performance item 7 were judged
  no-code-needed; per-step Flashcards replaced the old "after all stairs"
  flashcard decision.

## Repo facts
- Path: `C:\Users\Nexify\Desktop\PROJECTS\bece-prep` (git master, remote
  GitHub `Nexify815/bece-prep`; push to master auto-deploys Vercel).
- Stack: Vite 5 + React 18 + Firebase RTDB (accounts/leaderboard), PWA SW
  (`updateViaCache: "none"`), local plan + XP gamification.
- Vercel: linked project (`bece-prep`, `prj_RDNOxI3tXFOEsAzSO802LgiPqXcS`,
  org `team_8D5h2fyEz3GJ38ahcKTzArLb`); live at `https://bece-prep.vercel.app`.
- After a deploy, the user should refresh twice ~1 min apart so the old SW
  swaps out.

## Build/verify commands
- Build: `& "C:\Program Files\nodejs\npm.cmd" run build` (114 modules, ~7–19s;
  watch for icon names missing from `react-icons/fi`).
- Smoke: `npm run preview` then `Invoke-WebRequest http://localhost:4173/`
  (HTTP 200 confirms bundle, not route logic).
- Route-level check after a deploy: fetch `https://bece-prep.vercel.app/` and
  match the `index-*.js` hash to the latest build output.
- Lazy routes (incl. Exam Mode) only execute in a browser — a
  client-side crash like the `params` bug must be checked by actually opening
  the route, or statically.