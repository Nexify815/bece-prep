# Session Summary — StudyBuddy (BECE Prep)

Last updated: 2026-08-25. Written so a fresh opencode instance can pick up
where this session left off.

## The situation (why this project exists)

The user's younger brother is in JHS (Junior High School) in Ghana and will sit
the **BECE (Basic Education Certificate Examination)** mid-next year (~2027).
He is weak at the subjects and — the core problem — **doesn't understand the
terms used in the exam questions**. The goal is a study tool that explains
meaning in plain language, not just a question bank.

- **User:** James Kissi (Nexify815). A developer-in-training who directs
  projects and relies on AI (opencode) to write code; he is deliberately
  learning to read code via his own projects. Keep code simple and explain it.
- **Other context:** this project is NOT (yet) on his portfolio. It is a gift /
  tool for his brother.

## Decisions locked in (do not re-litigate)

- **Name:** StudyBuddy
- **Subjects (V1):** Mathematics, Integrated Science, English Language, Social Studies
- **Platform:** web app, responsive, works on phone (Android) + computer
- **Offline:** online-first, but **always account for offline** — works with no
  data after first load (service worker / PWA), progress in localStorage
- **Difficulty:** Easy / Medium / Hard levels
- **Home-language translations:** NOT needed (skip V4 Twi/Ga idea)
- **Gamification (chosen from Duolingo menu):** Hearts/lives, Streaks, XP +
  levels, Repair & review, Varied question types, Mascot (a friendly cat — ties
  to the Auto Cat branding).
  **Not chosen:** daily quests, badges, leagues/leaderboards.
- **Duolingo template:** DECIDED AGAINST. Use Duolingo's *design language* as
  inspiration only (playful colors, rounded cards, hearts, streak flame, XP
  bar, cat mascot). Do NOT pull in a clone template's code — foreign code is
  unmaintainable for this user, most clones assume a backend, and the content
  (not the skin) is 90% of the work. Content structure is glossary terms +
  BECE-style quizzes with diagrams, not language-learning sentences.
- **Past papers:** Real BECE objective questions (2022-2025) allowed. Separate
  section from main quiz/glossary. Year-based, timed, exam simulation.
- **App flow:** Subject Home → Learn (topic-based lessons) + Glossary (term lookup)
  + Quiz (practice questions) + Past Papers (V3, exam simulation)

## Roadmap (full detail in `ROADMAP.md`)

- **V1 — "The Term Fixer" (foundation):** subject home, topic-based lessons
  (Learn section with explanations, examples, diagrams), searchable glossary
  (term → simple definition + example), quizzes with instant feedback +
  explanation, varied question types (MC, match term↔definition, fill-blank,
  true/false), difficulty levels, XP + levels, cat mascot, progress saved on
  device, offline PWA, mobile-first.
- **V2 — "Making It Stick":** hearts/lives (5, lose one per wrong), streaks,
  repair & review (spaced re-testing of missed terms/questions), weak subject
  detection, wrong answers bank.
- **V3 — "Exam Readiness" (before the exam):** timed mock exam mode across
  subjects, results report with topics to revise, text-to-speech read-aloud.
  Real BECE past questions (2022-2025) in a dedicated Past Papers section.
- **V4 — Growth:** more subjects (French, ICT, Ghanaian Language), bigger
  content library, progress export to show parents/teacher, app icon + splash.

## Content plan (the real work)

- **Source of truth:** official NaCCA **Common Core Programme (CCP)** curricula
  for B7–B9. All 4 PDFs downloaded into
  `C:\Users\Nexify\Desktop\PROJECTS\bece-prep\curriculum\`:
  - `math.pdf` (5.6 MB, 259 pages) — strands: **Number, Algebra, Geometry &
    Measurement, Handling Data**
  - `english.pdf` (1.5 MB, 124 pages) — strands: **Oral Language, Reading,
    Grammar Usage, Writing, Literature**
  - `science.pdf` (2.7 MB, 205 pages)
  - `social.pdf` (1.8 MB, 129 pages)
- **IMPORTANT — model limitation:** opencode's model (big-pickle, a
  Claude-family model) **cannot view PDFs or images as attachments**. Workaround
  that WORKS: extract text with `pypdf` (available in the Auto Cat venv:
  `C:\Users\Nexify\Desktop\PROJECTS\Auto Cat\.venv\Scripts\python.exe`). All 4
  already extracted to text in
  `C:\Users\Nexify\AppData\Local\Temp\opencode\curriculum_{math,english,science,social}.txt`
  (temp — may be cleaned up; re-run the extraction script if needed).
- **Content targets per subject:** ~80–100 glossary terms + 25–30 quiz
  questions (Easy/Medium/Hard), each with a plain explanation. Content lives in
  JSON files so it can grow without touching code. We write original content
  modeled on the curriculum.
- **Past papers:** Real BECE objective questions (2022-2025) in a separate JSON
  file (`science_past.json`), year-based, with topic tags. Currently 60 questions.
- **Diagrams:** math (and some science) questions may need visuals. The
  curriculum's own diagrams are NOT needed (teaching illustrations only). For
  quiz questions, generate our own crisp **SVG diagrams** in-app (shapes,
  number lines, coordinate planes, bar/line charts). Caveat: the model can't
  visually verify images — the user should eyeball anything visual on-device.

## Design system (done)

- **DESIGN.md** written with full Duolingo-inspired design language:
  - Colors: brand green (#58CC02), gamification palette (orange/red/gold/purple)
  - Subject colors: Math=Blue, Science=Green, English=Orange, Social=Purple
  - Typography: Nunito font, bold/rounded, warm gray text
  - Buttons: chunky 3D lip shadow, rounded
  - Cards: white, 2px borders, subtle depth
  - Badges/pills: streak orange, XP gold, hearts red
  - Spacing: 4px grid system

## Curriculum extractions (done)

- Math curriculum structured extraction: `curriculum_structured.md`
- Science, English, Social Studies extracted in agent memory (not saved to files)

## Tech (kept simple on purpose)

- **React (Vite** + React 18, plain JavaScript) — single-page app. Chosen by the
  user during the V1 build (2026-09-02), replacing the original
  "no-framework plain HTML/CSS/JS" plan. Node at
  `C:\Program Files\nodejs\node.exe`; npm at `C:\Program Files\nodejs\npm.cmd`.
- Hash-based routing (robust on static hosts, no server needed) — see
  `src/lib/router.js`.
- PWA: service worker (`public/sw.js`) + `manifest.json` + generated cat icons
  (`public/icons/icon-192.png` / `icon-512.png`, made with PIL) for offline +
  install. Registered in `src/main.jsx` (only in production builds).
- Progress + gamification state in `localStorage` — see `src/lib/storage.js`.
- Free hosting: Vercel or GitHub Pages (user has both workflows already).
- **esbuild note:** npm's allow-scripts guard blocks esbuild's postinstall; run
  `npm approve-scripts esbuild` (or `npm rebuild esbuild`) after a fresh
  install, otherwise `vite build` fails to find the binary.

## Proposed file layout (BUILT — V1 scaffold done)

```
bece-prep/                       (now a Vite + React project)
├── package.json / vite.config.js / .gitignore
├── index.html                   (root entry, loads /src/main.jsx)
├── public/                      (copied verbatim to dist root)
│   ├── manifest.json
│   ├── sw.js
│   └── icons/icon-192.png, icon-512.png
├── src/
│   ├── main.jsx                 (React root + SW registration)
│   ├── App.jsx                  (hash router + progress state)
│   ├── styles.css               (Duolingo-inspired design system from DESIGN.md)
│   ├── lib/router.js            (useHashRoute, navigate)
│   ├── lib/storage.js           (localStorage: XP, streak, learned, scores)
│   ├── components/Home.jsx, SubjectHome.jsx, Learn.jsx, Glossary.jsx,
│   │   Quiz.jsx, PastPapers.jsx, TopBar.jsx, Snackbar.jsx
│   └── data/index.js            (subject registry + JSON loader)
│       math.json, science.json, english.json, social.json, science_past.json
│       (science.json + science_past.json are seeded; the other 3 are empty stubs)
│
│  Also still present (from earlier sessions): ROADMAP.md, DESIGN.md,
│  curriculum_structured.md, curriculum/ (4 NaCCA PDFs)
```

**Build/run:** `npm run dev` (dev server), `npm run build` (→ `dist/`),
`npm run preview` (serves built app). Science content (glossary + BECE past
papers) is seeded and fully working in-app.

**Not yet built / next:** Math content is an empty stub; English + Social empty
stubs. "Match" question type, hearts/lives (V2), and best-score tracking are
stubbed/incomplete. Best per-difficulty score tracking should pass the aggregate
from Quiz at the end of a run.

## Timeline (side-project pace, from ROADMAP.md)

- Week 1–2: V1 app scaffold + Mathematics content (50 terms + 15 questions)
- Week 3–4: Integrated Science + English content
- Week 5–6: Social Studies content + polish, give to brother
- Monthly: iterate with the brother, fix what confuses him, add content
- ~6 months before exam: V3 mock exam mode + past papers integration
- Exam month: full library ready, weekly mock practice

## Next steps (in order)

1. ~~Build V1 app scaffold~~ **DONE (2026-09-02)** — now a Vite + React project
   (see Tech + file layout above). Science content already works in-app. Verify
   for yourself: `npm run dev`, open on phone/desktop, eyeball the visuals
   (the model can't see rendered screens).
2. Extract strand/sub-strand topic lists from the 4 extracted curriculum texts
   (via grep on `curriculum_*.txt`) to drive content structure.
3. Seed **Mathematics** content first (50 terms + 15 questions) into
   `src/data/math.json`, then English + Social. This is the priority real work.
4. Validate: JSON parse via the Auto Cat venv Python; `npm run build`; then
   `npm run preview` and eyeball.
5. Host on Vercel/GitHub Pages when V1 is usable (output is `dist/`).

## App flow (locked)

**Subject Home** → 4 options:
1. **Learn** — study topics (strand → sub-strand → topic → lesson)
2. **Glossary** — look up any term (search + browse)
3. **Quiz** — test what you learned (Easy/Medium/Hard, instant feedback + explanation)
4. **Past Papers** — BECE exam practice (V3, year-based, timed)

## Also from this session (portfolio work — DONE and pushed)

Unrelated but done earlier today: the portfolio repo `Nexify815/Portfolio` got
SEO fixes (canonical/og:url → https://portfolio-3r17-wheat.vercel.app/,
generated social-card.jpg, clean auto-cat.png, reverted a live-demo link on the
Chef Jhamin POS card because that URL is the restaurant's **production** site).
A general fix backlog lives in `C:\Users\Nexify\Desktop\PROJECTS\FIXES.md`
(projects: POS monolith server.js, default creds, LAN exam version-control
discipline, etc.).
