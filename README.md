# StudyBuddy — BECE Prep

Understand the terms of your BECE exams in plain language, then practice.

StudyBuddy is a free, offline-first web app that helps JHS students in Ghana
prepare for the Basic Education Certificate Examination (BECE). It explains
exam vocabulary in simple language, then drills it with quizzes, lessons and
real past-paper questions.

**Live app:** https://bece-prep.vercel.app

<video src="./demo_video.mp4" controls width="100%"></video>

## Features

- **7 subjects** — Mathematics, Integrated Science, English Language, Social
  Studies, French, ICT, Ghanaian Language (Akan)
- **513 glossary terms** — searchable, every term with a plain-language
  definition, example and difficulty level
- **Stairs learning path** — a step-by-step path per subject, each lesson ends
  with a mini-quiz and a summit mega-quiz
- **Quizzes** — Easy / Medium / Hard levels, instant feedback + explanation,
  and varied question types (multiple choice, true/false, fill-blank, match)
- **Real BECE past-papers** (2023–2025) — 80 objective questions per subject,
  year selection and timed practice
- **Offline PWA** — installable, works with no internet after the first load;
  progress is saved on the device
- **Gamification** — XP + levels, daily streaks, hearts (lives), a store with
  skins/themes/boosts, and a progress report you can print or save

## Subjects & content

| Subject | Terms | Quiz questions |
|---------|-------|----------------|
| Mathematics | 142 | 127 |
| Integrated Science | 233 | 150 |
| English Language | 52 | 15 |
| Social Studies | 50 | 15 |
| French | 12 | 10 |
| ICT | 12 | 12 |
| Ghanaian Language (Akan) | 12 | 10 |

Content lives in JSON files under `src/data/` so it can grow without touching
code. It is modeled on the official NaCCA Common Core Programme (CCP)
curricula for B7–B9 (PDFs in `curriculum/`).

## Tech

- **React (Vite + React 18)**, plain JavaScript — single-page app
- Hash-based routing (robust on static hosts, no server needed)
- PWA: service worker + manifest for offline + install
- Progress + gamification state in `localStorage` (per device)
- Hosting: Vercel, auto-deploys on push to `master`

## Run locally

```bash
npm install        # if Vite fails to find esbuild, run: npm rebuild esbuild
npm run dev        # dev server on http://localhost:5173
npm run build      # production build -> dist/
npm run preview    # serve the built app locally
```

## Project layout

```
src/
├── main.jsx                 # React root + service-worker registration
├── App.jsx                  # hash router + progress state + offline detection
├── styles.css               # Duolingo-inspired design system
├── lib/                     # router, storage, XP values, TTS, store catalog
├── components/              # screens (Home, Glossary, Quiz, Stairs, MockExam,
│                            #   PastPapers, Store, ProgressReport, ...)
└── data/                    # subject JSON files + index registry
    math.json, science.json, english.json, social.json,
    french.json, ict.json, ghanaian.json
    *_past.json              # BECE past-paper question banks (2023-2025)
```

## Design

Duolingo-inspired design language (see `DESIGN.md`): brand green `#58CC02`,
rounded cards, chunky buttons, Nunito typeface, subject accent colors. Themes:
Day, Night, Berry and Ocean (earnable in the store).