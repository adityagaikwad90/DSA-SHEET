# DSA Sheet — AI Project Guide

This file is the first-stop orientation guide for an AI or developer working on this repository. It describes the current app structure and data flow; source code remains authoritative when behavior changes. Read this guide first, then inspect the files named in the relevant section before editing.

## Project at a glance

DSA Sheet is a browser-based interview preparation platform built with React and Vite. It combines company-wise coding questions, interview study material, personal progress tracking, AI assistance, a tech-news reader, and a job-application tracker.

The application is a frontend-only Vite project. It uses Firebase Authentication and Firestore directly from the browser, Gemini APIs directly from the browser, and AWS S3 directly for topic PDF uploads. There is no app-owned backend API server in this repository.

The actual Git repository root is this directory (`vite-project/`), not its parent workspace directory.

## Tech stack

- React 19, Vite 7, JavaScript, React Router 7
- Firebase Authentication, Cloud Firestore, Firebase Analytics
- Gemini SDK and a Gemini REST/SDK helper
- AWS SDK for S3 uploads and deletes
- Framer Motion, Lucide icons, Recharts, Sonner, Monaco Editor, Fuse.js, Marked, DOMPurify
- Docker multi-stage build: Node builder image followed by Nginx static hosting
- Vercel SPA rewrite configuration in `vercel.json`

## Visual design system

The interface uses a dark slate foundation with a restrained violet-to-blue brand gradient. Shared palette, typography, spacing, radius, and shadow tokens live in `src/index.css`; route-specific layouts live beside each page. The landing page and navigation favor matte surfaces, readable type, and small interaction states over animated particles, magnetic hover, or glowing outlines. Preserve the reduced-motion behavior when adding motion, and use semantic green/amber/red for status feedback instead of making every element an accent color.

## Run and maintain

Run commands from the repository root (`vite-project/`):

```bash
npm install
npm run dev
npm run lint
npm run build
npm run preview
```

`npm run build` automatically invokes `prebuild`, which runs all three data generators before Vite builds the app. `npm run generate:data` runs the same generators explicitly. Individual generators can be run with `npm run generate:patterns` and `npm run generate:careers`.

The app uses Vite environment variables. `.env` is ignored by Git; never copy its values into this guide, source control, or logs. The names currently referenced in source are:

| Variable | Used for |
| --- | --- |
| `VITE_ADMIN_EMAIL` | Email address treated as admin by the client-side UI; falls back to a hard-coded default in `AuthContext.jsx`. |
| `VITE_GEMINI_API_KEY` | Gemini chat, floating copilot, and code-review flows. Some UI flows also accept a user-provided key stored in browser local storage. |
| `VITE_NEWS_API_KEY` | NewsAPI access for Tech News; a user-provided key can instead be stored locally in the browser. |
| `VITE_AWS_REGION` | AWS S3 client region. |
| `VITE_AWS_BUCKET_NAME` | S3 bucket used for topic PDFs. |
| `VITE_AWS_ACCESS_KEY_ID` | S3 credentials used by the browser SDK. |
| `VITE_AWS_SECRET_ACCESS_KEY` | S3 credentials used by the browser SDK. **Do not expose real AWS credentials in a Vite client bundle.** Move privileged S3 operations to a backend or use short-lived, narrowly scoped presigned URLs before using this in production. |

All `VITE_*` values are bundled into client-side code and must be treated as public. Firebase web configuration is also embedded in `src/firebase.js`; protect data with Firebase Authentication, Firestore Security Rules, API restrictions, and least privilege rather than relying on hidden client values. Do not paste secret contents into AI prompts or documentation.

## Routes and access

Routes are declared in `src/App.jsx`. `src/main.jsx` wraps the app in `BrowserRouter` and `AuthProvider`.

| Route | Access | Page |
| --- | --- | --- |
| `/` | Public | Home / feature overview |
| `/news`, `/tech-news` | Public | Tech News |
| `/login`, `/register` | Public | Firebase email/password authentication |
| `/questions`, `/top-100` | Login required | Company-wise questions and most repeated questions |
| `/interview-hub` | Login required | Interview Hub, default DSA tab |
| `/interview-hub/dsa` | Login required | DSA and patterns tab |
| `/interview-hub/system-design` | Login required | System Design tab |
| `/interview-hub/networking` | Login required | Networking tab |
| `/interview-hub/patterns` | Login required | DSA and patterns tab |
| `/interview-hub/patterns/:patternId`, `/patterns/:patternId` | Login required | Pattern lesson detail |
| `/sheet` | Login required | Personal Sheet and progress analytics |
| `/careers` | Login required | Company directory and application tracker |
| `/dsa-vault` | Login required | Topic notes, PDFs, and external resources |
| `/club` | Login required | Club chat, direct messages, and people directory |
| `/ask-ai` | Login required | DSA Gemini chat |

`PrivateRoute.jsx` redirects logged-out users to `/login` and passes the original location in router state. `Login.jsx` returns the user to the requested pathname after successful sign-in. `AuthProvider` waits for Firebase's initial auth state before rendering app children.

The navbar is in `src/Navbar.jsx` / `src/Navbar.css`. It hides authenticated navigation items while signed out. Admin-only controls are UI-gated by `isAdmin`; access control for writes must also be enforced in Firestore/S3 rules or server-side policy.

## Main features and where to edit them

### Home and site shell

- `src/pages/Home.jsx`, `Home.css`: landing page, product feature cards, top-level navigation links.
- `src/App.jsx`, `App.css`, `src/index.css`: app shell, route table, global styles.
- `src/Navbar.jsx`, `Navbar.css`: navigation and authenticated user menu.
- `src/components/ScrollToTop.jsx`, `ClickSparkEffect.jsx`, `RewardCelebration.jsx`: global interaction effects.
- `src/components/FuturisticFloatingAi.jsx`: global Gemini copilot overlay.

### Coding questions and personal progress

- `src/pages/Questions.jsx`: company selector, company question lists, filters, repeated-question view, completion and code-review flows.
- `src/components/MostRepeatedSection.jsx`, `AiCodeReviewModal.jsx`, `QuestionCompletionDialog.jsx`: question subflows.
- `src/pages/MySheet.jsx`: personal question list, manual additions, filters, spaced review, analytics, and heatmap.
- `src/utils/companyDataLoader.js`: loads static summaries and lazily fetches detailed company data from `/public/data`.
- `src/utils/userProgress.js`: local progress plus Firestore sync; emits `dsa-progress-updated` browser events.
- `src/utils/spacedRepetition.js`: due dates and review intervals.
- `src/components/DsaAnalyticsDashboard.jsx`, `ActivityHeatmap.jsx`: progress visualizations.

Question progress is stored locally per Firebase UID and synced to Firestore for authenticated users. The current Firestore collections include `progress` and `userProgress`. Local updates are designed to remain usable if Firestore sync fails.

### Interview Hub and lessons

- `src/pages/InterviewHub.jsx`: tabbed DSA patterns, core DSA, System Design, Networking, and company solution archive.
- `src/pages/PatternLesson.jsx`: pattern lesson content, progress actions, and linked problems.
- `src/utils/patternProgress.js`: local and Firestore pattern progress (`pattern_progress` collection); emits `dsa-pattern-progress-updated` events.
- `src/data/dsaPatternsData.json`, `dsaCoreData.json`, `systemDesignData.json`, `networkingData.json`, `interviewArchiveSummary.json`: bundled data used by the hub.
- `src/content/patterns/`: source Markdown lesson files.

### Careers tracker

- `src/pages/Careers.jsx`, `Careers.css`: searchable and filterable company directory, wishlist/application/interview/offer status, notes, custom companies, and CSV export.
- The Careers route now opens on a live openings view with role/location search, remote filter, direct ATS apply links, and a per-user local application tracker. The company directory remains available as a second view.
- `src/utils/jobFeedService.js` calls the authenticated `getLiveJobOpenings` Firebase callable in `us-central1`; the browser does not call external ATS feeds directly.
- `functions/src/jobBoards.js` is the allowlist of company ATS boards to import. `functions/src/index.js` refreshes those public feeds every six hours, normalizes listings into Firestore `job_openings`, marks removed postings inactive, and serves active postings to signed-in users. Supported feed providers are Greenhouse, Lever global, Lever EU, and Ashby.
- `functions/src/jobBoards.js` includes the verified OpenAI Ashby public board as a starter feed. `LIVE_JOBS_SETUP.md` explains how to add other boards, deploy the Firebase Functions, and run the initial refresh.
- Job application status is stored in browser `localStorage` under a UID-specific key; it is currently per browser/device and is not synchronized between devices. Opening an apply link does not mark a role as applied; users can do that explicitly.
- `src/data/careerCompaniesData.json`: bundled directory data imported by the page; it must remain available in a clean checkout/build.
- `scripts/generate-career-data.js`: parses the `moreThanFAANGM-main/README.md` listing from `../../moreThanFAANGM-main.zip` and writes `src/data/careerCompaniesData.json`.

Career tracker state and user-added companies are stored in browser `localStorage` under UID-specific keys. They are not currently synchronized to Firestore. CSV export quotes fields and prefixes formula-like user values so spreadsheet apps do not evaluate them as formulas.

The generator now exits successfully with a warning if its source ZIP is absent but the generated JSON already exists. If both are absent, generation fails. Include the generated JSON in the repository/deployment artifact.

### DSA Vault and notes

- `src/pages/DsaVault.jsx`: topic list, external DSA sheets, and video resources.
- `src/components/TopicNotes.jsx`: reads/writes shared notes in Firestore collection `topic_notes`; admins can upload/delete PDFs using `src/aws-config.js` and S3.

### AI and Tech News

- `src/pages/AiChat.jsx`: direct Gemini chat page.
- `src/components/FuturisticFloatingAi.jsx`, `src/utils/geminiClient.js`: shared floating copilot and Gemini API/model handling.
- `src/utils/dsaAgentEngine.js`, `src/components/AiCodeReviewModal.jsx`: DSA assistant personas and code-review workflow.
- `src/pages/TechNews.jsx`, `src/utils/techNewsService.js`: news search, category filters, bookmarks, API key settings, caching, and fallback/demo content.
- Vite dev server proxies `/api/news/*` to NewsAPI in `vite.config.js`; production calls may use the NewsAPI URL directly.
- News API key and bookmarks are stored in browser local storage; response cache uses session storage.

### Auth and shared components

- `src/context/AuthContext.jsx`: Firebase auth listener, current user, sign-out, and client-side admin identity.
- `src/firebase.js`: Firebase app/auth/Firestore/Analytics initialization.
- `src/pages/Login.jsx`, `Register.jsx`: email/password login and registration; user profile docs live in Firestore collection `users`.
- `src/components/TopicNotes.jsx`: shared admin-authored topic note editor.
- `src/components/SafeMarkdownRenderer.jsx`: sanitized Markdown display.
- `src/components/TodoList.jsx`: browser-local todo list.
- `src/utils/fuzzySearch.js`: reusable fuzzy filtering.

## Data files and generators

The app bundles smaller content datasets under `src/data/` and serves larger question data under `public/data/`.

- `scripts/generate-company-data.js`: reads CSV company folders from `leetcode-company-wise-problems-main/`; writes company summaries and question JSON files under `public/data/`, plus related indexes/summaries under `src/data/`.
- `scripts/generate-patterns-data.js`: parses `src/content/patterns/` and creates `src/data/dsaPatternsData.json`. It also tries to index Java files from a sibling `../interviews` directory. If source folders are missing, generated JSON may not reflect current content; inspect the script's configured paths before regenerating.
- `scripts/generate-career-data.js`: reads the external ZIP described above, or keeps an existing generated JSON when the ZIP is unavailable.

Generated files are runtime inputs, not disposable build caches. Before changing generators, confirm the checked-in/generated data still satisfies imports and runtime fetch paths. Do not replace a generated JSON with a partial or empty result unless that is intended.

## Backend/data model summary

There is no general-purpose API server. Current cloud services are accessed from frontend modules, with a small Cloud Functions backend for the Careers feed:

- Firebase Auth: email/password authentication.
- Firebase Cloud Functions: scheduled public ATS feed sync and authenticated callable for cached job openings (`functions/`). Scheduled Functions require Blaze billing / Cloud Scheduler.
- Firestore: `users`, `progress`, `userProgress`, `pattern_progress`, `topic_notes`, `user_chats`, `clubs`, and `direct_messages` are referenced by source.
- AWS S3: topic-note PDF uploads and deletes.
- Gemini: chat, floating assistant, and code review.
- NewsAPI: technology news retrieval.

When adding or changing cloud writes, review Firestore Security Rules, S3 bucket policy/CORS, API key restrictions, and client exposure. The frontend's `isAdmin` check is not a security boundary by itself.

## Deployment notes and known constraints

- `vercel.json` rewrites all paths to `/index.html` for React Router deep links.
- `Dockerfile` uses Node 18 for the builder and Nginx for static hosting. The installed Vite 7 package declares a Node engine of `^20.19.0 || >=22.12.0`; update the Docker builder image to a supported Node version before relying on Docker builds.
- The app build runs source generators. Company CSV inputs are in this repository. Career source ZIP may not be present in clean deployment contexts, so the generated `src/data/careerCompaniesData.json` must be committed/included. Pattern generation also depends on its source directories.
- `.env` is ignored by Git. For local setup, use a private `.env.local` / deployment environment variables and never commit credentials.
- The project includes a large `node_modules/` and generated `dist/` locally, but those are ignored build artifacts; do not treat them as source of truth.

## Guidance for future AI work

1. Start with this guide, then inspect only the relevant page, utility, data file, and generator listed above.
2. Keep route access declarations in `src/App.jsx` consistent with navbar visibility and the intended auth policy.
3. For progress/data changes, follow existing local-first patterns and maintain Firestore synchronization semantics where applicable.
4. If changing a dataset, determine whether it is authored, generated, or fetched at runtime before editing it.
5. Keep browser-exposed credentials out of source, commits, logs, and this document. Never add privileged AWS credentials to a client bundle.
6. After changing routes or build inputs, inspect the Vercel rewrite, Docker build context, and generator input paths.
7. Update this guide when architecture, routes, environment variable names, or persistence behavior changes.
