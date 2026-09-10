# Session Summary — StudyBuddy (BECE Prep)

Last updated: 2026-09-10. Written so a fresh opencode instance can pick up
where this session left off.

## Most recent session (2026-09-10) — "Flaws & Agreed Solutions" pass, per user's locked decisions

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
- After a deploy, the user should refresh twice ~1 min apart so the old SW
  swaps out.

## Build/verify commands
- Build: `& "C:\Program Files\nodejs\npm.cmd" run build` (108 modules; watch
  for icon names missing from `react-icons/fi`).
- Smoke: `npm run preview` then `Invoke-WebRequest http://localhost:4173/`.