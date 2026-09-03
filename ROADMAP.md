# StudyBuddy — BECE Prep (Roadmap)

**One-line goal:** Help a JHS student *understand* the terms BECE questions use,
and practice answering — in plain simple language, on any device, even without
internet.

**Core principle:** The problem isn't "not scoring well" — it's not
understanding the words. So everything explains the *meaning*, never just the
right answer.

---

## Product vision

- Subjects: **Mathematics, Integrated Science, English Language, Social Studies**
  (BECE core subjects)
- Works on phone + computer, installable like an app, usable offline
- Every definition in very simple words, with an example sentence
- Progress tracked on the device (no account needed)

## Gamification (Duolingo-style — chosen features)

Borrowed from Duolingo to make studying feel like a game:

- **Hearts/lives** — 5 hearts, lose one per wrong answer
- **Streaks** — consecutive days of practice; reminder if he skips
- **XP + levels** — points per answer, level up per subject/strand
- **Repair & review** — re-test exactly what he got wrong, spaced over time
- **Varied question types** — multiple choice, match term↔definition,
  fill-in-the-blank, true/false
- **Mascot** — a friendly cat that reacts to right/wrong answers (ties in with
  the Auto Cat branding)

*Not chosen:* daily quests, badges, leagues/leaderboards.

---

## Version 1 — "The Term Fixer" (Foundation)

The minimum that directly fixes the brother's problem.

- **Subject home** — pick a subject, see its own color/identity
- **Learn** — topic-based lessons organized by strand → sub-strand → topic;
  each lesson has plain-language explanations, examples, and diagrams
- **Glossary** — searchable list of exam terms; tap a term → plain-language
  definition + example sentence
- **Quizzes** — BECE-style multiple choice, one question at a time, instant
  green/red feedback with a plain explanation of *why* the answer is right
- **Varied question types** — match term↔definition, fill-in-the-blank,
  true/false, as well as multiple choice
- **Difficulty levels** — questions split into Easy / Medium / Hard so he can
  start gentle and build up
- **XP + levels** — points per answer, level up per subject/strand
- **Mascot** — a friendly cat that reacts to right/wrong answers
- **Progress** — best quiz scores saved on the device; mark terms as "learned"
- **Offline** — works with no data after first open (service worker / PWA);
  online when data is available
- **Mobile-first** — big touch buttons, works on a cheap Android phone

**Done when:** the brother can open it on his phone, look up a term he doesn't
understand, read a simple explanation, take a quiz, and see his score — all
without internet.

---

## Version 2 — "Making It Stick" (Memory)

- **Hearts/lives** — 5 hearts, lose one per wrong answer
- **Streaks** — consecutive days of practice; "don't break your streak"
  reminder
- **Repair & review** — terms and questions he got wrong come back in future
  sessions, spaced so it actually sticks
- **Weak subject detection** — shows which subject needs the most work
- **Wrong answers bank** — re-practice only the questions he got wrong

---

## Version 3 — "Exam Readiness" (Before the exam)

- **Mock exam mode** — timed, random questions mixed across subjects, like the
  real BECE
- **Results report** — score + a short list of which topics to revise
- **Read-aloud (text-to-speech)** — hear terms and definitions, so he learns by
  listening too
- **Past Papers** — real BECE past questions (2022-2025) in a dedicated section,
  year-based, timed, exam simulation

---

## Version 4 — "Growth & Localization" (Later)

- **Home-language toggle** — explanations in Twi / Ga / his home language for
  the hardest terms
- **More subjects** — French, ICT, Ghanaian Language
- **Bigger content library** — more terms + questions every term
- **Progress export** — a simple report to show parents/teacher
- **Nice app icon + install splash** — feels like a real app

---

## Content plan (the real work — bigger than the code)

- **Source of truth:** the official BECE curriculum PDFs (NaCCA/GES) — we'll
  extract the syllabus topics per subject so the glossary and questions cover
  exactly what the exam tests, in order.
- Each subject: **80–100 core terms** in a glossary, each with:
  term → simple definition → example sentence
- **Question bank:** original BECE-style MC questions (Easy / Medium / Hard),
  each with an explanation
- **Past papers:** real BECE objective questions (2022-2025) in a separate JSON
  file, year-based, with topic tags
- Content lives in **JSON files** — adding more never touches the code

| Subject | Glossary target | Question target | Past Papers |
|---------|----------------|-----------------|-------------|
| Mathematics | 100 terms | 30 questions | TBD |
| Integrated Science | 100 terms | 30 questions | 60+ (2022-2025) |
| English Language | 80 terms | 25 questions | TBD |
| Social Studies | 90 terms | 25 questions | TBD |

---

## Tech (kept simple on purpose)

- Plain HTML/CSS/JS — no heavy framework, so it's fast on a cheap phone
- Service worker for offline + installable (PWA)
- Progress in browser storage (localStorage) — no accounts, no server
- Free hosting (Vercel or GitHub Pages)

---

## Timeline (realistic, side-project pace)

| When | Milestone |
|------|-----------|
| Week 1–2 | V1 app + **Mathematics** content (50 terms + 15 questions) |
| Week 3–4 | **Integrated Science** + **English** content |
| Week 5–6 | **Social Studies** content + polish, give to brother |
| Monthly | Use with the brother, fix what confuses him, add terms/questions |
| ~6 months before exam | V3 mock exam mode live |
| Exam month | Full library ready, mock practice weekly |

---

## Open decisions (need user input)

- [x] App name — **StudyBuddy**
- [x] Home-language explanations — **not needed**
- [x] Offline — **yes, always account for it** (online-first, offline-capable)
- [x] Difficulty — **Easy / Medium / Hard levels**
- [x] Locate the curriculum PDFs so we can extract the syllabus topics
      — **done, downloaded all 4 official NaCCA CCP PDFs into
      `curriculum/`** (math.pdf, english.pdf, science.pdf, social.pdf)
