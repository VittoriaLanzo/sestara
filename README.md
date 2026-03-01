<div align="center" style="background-color: #F4F1EC; padding: 40px 20px; border-radius: 12px;">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="src/assets/sestara-logo.svg" />
  <source media="(prefers-color-scheme: light)" srcset="src/assets/sestara-logo.svg" />
  <img src="src/assets/sestara-logo.svg" alt="Sestara" width="280" />
</picture>

<br /><br />

**AI-powered study roadmap builder and learning companion**

<br />

<img alt="React" src="https://img.shields.io/badge/React-18-1C3366?style=flat-square&logo=react&logoColor=CB9A2D" />
<img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-1C3366?style=flat-square&logo=typescript&logoColor=CB9A2D" />
<img alt="Vite" src="https://img.shields.io/badge/Vite-5-1C3366?style=flat-square&logo=vite&logoColor=CB9A2D" />
<img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_CSS-3-1C3366?style=flat-square&logo=tailwindcss&logoColor=CB9A2D" />
<img alt="Supabase" src="https://img.shields.io/badge/Supabase-Backend-1C3366?style=flat-square&logo=supabase&logoColor=CB9A2D" />

</div>

---

## Overview

Sestara is a web application that generates personalised study roadmaps using AI, then provides tools to track progress, take quizzes, create flashcards, manage notes, and collaborate through quiz challenges. It targets students preparing for competitive exams, university courses, certifications, programming interviews, and language learning.

---

## Features

### AI Roadmap Generation

Users select a learning goal (competitive exams, college subjects, job preparation, programming, certifications, or language learning), provide details, and the backend generates a structured roadmap of subjects and topics.

- **Frontend**: `src/components/GoalSelector.tsx`, `src/pages/Onboarding.tsx`
- **Backend**: `supabase/functions/generate-roadmap/index.ts` -- calls the Lovable AI gateway (`google/gemini-2.5-flash`) with a curriculum-design prompt and returns structured JSON
- **Database**: `roadmaps`, `subjects`, `topics` tables

### Roadmap Management

Full CRUD on roadmaps, subjects, and topics with drag-and-drop reordering, duplication, version history, and inline editing.

- **Frontend**: `src/pages/RoadmapView.tsx`, `src/components/roadmap/*`
- **Library**: `@hello-pangea/dnd` for drag-and-drop

### Topic Study View

Per-topic page with tabbed interface for notes, AI-generated explanations, quizzes, and flashcards. Progress tracking per topic with status transitions (not started, in progress, completed).

- **Frontend**: `src/pages/TopicPage.tsx`, `src/components/topic/*`

### AI-Powered Quizzes

Configurable quiz generation (MCQ, short answer, mixed) with difficulty levels, timer, navigation, review panel, scoring, and doubt reporting. Quizzes are generated server-side via the `topic-ai` edge function.

- **Frontend**: `src/components/quiz/EnhancedQuizViewer.tsx`, `src/components/quiz/QuizConfigPanel.tsx`, `src/components/quiz/QuizReviewPanel.tsx`, `src/components/quiz/QuizTimer.tsx`
- **Backend**: `supabase/functions/topic-ai/index.ts` (action: `quiz`)
- **Database**: `quiz_attempts`, `quiz_doubt_reports`
- **Scoring**: `src/lib/quizScoring.ts`, `src/lib/quizValidation.ts`

### AI Flashcards

Generate flashcards from topic content or convert quiz questions into flashcard sets. Spaced-repetition mastery tracking stored per user.

- **Frontend**: `src/components/flashcard/EnhancedFlashcardViewer.tsx`, `src/components/flashcard/FlashcardGenerator.tsx`
- **Backend**: `supabase/functions/topic-ai/index.ts` (action: `flashcards`)
- **Database**: `flashcard_sets`

### Custom Quizzes

Paste or build quiz JSON manually, save quizzes into groups, track scores across attempts.

- **Frontend**: `src/pages/CustomQuizPage.tsx`, `src/components/custom-quiz/*`
- **Database**: `custom_quizzes`, `quiz_groups`

### Quiz Challenges

Create shareable quiz challenges with unique codes. Leaderboard with best-attempt tracking. Answers are validated server-side to prevent cheating.

- **Frontend**: `src/pages/ChallengePage.tsx`, `src/components/challenge/*`
- **Backend**: Database RPCs `get_challenge_by_code` (strips answers for non-creators) and `score_challenge_attempt` (server-side scoring)
- **Database**: `quiz_challenges`, `challenge_attempts`

### Study Assistant (Experimental)

Streaming AI chatbot accessible from any authenticated page. Context-aware (receives current roadmap ID). Uses SSE streaming via the `study-assistant` edge function.

- **Frontend**: `src/components/assistant/StudyAssistant.tsx`
- **Backend**: `supabase/functions/study-assistant/index.ts`

### Notebook / Notes

Rich-text note editor per topic using TipTap, with drawing canvas support via Fabric.js. Multi-page notebooks with pinning, colour tags, and icons.

- **Frontend**: `src/components/notes/NotebookView.tsx`, `src/components/notes/RichTextEditor.tsx`, `src/components/notes/DrawingCanvas.tsx`
- **Database**: `topic_notes`, `note_pages`, `note_drawings`, `note_attachments`

### To-do Management

Task management with priorities, categories, due dates/times, estimated minutes, recurring tasks, sub-tasks, and tagging. Linked to roadmaps and topics.

- **Frontend**: `src/pages/TodosPage.tsx`, `src/components/todos/*`
- **Database**: `todos`

### Reminders

Date-based reminders linked to roadmaps or topics.

- **Frontend**: `src/components/reminders/*`
- **Database**: `reminders`

### Resource Library

Organise YouTube videos and other links into groups per roadmap. Auto-fetches video metadata (title, thumbnail, duration) via the `youtube-metadata` edge function. Playlist import support.

- **Frontend**: `src/pages/ResourcesPage.tsx`, `src/components/resources/*`
- **Backend**: `supabase/functions/youtube-metadata/index.ts`
- **Database**: `roadmap_resources`, `resource_groups`

### Study Streaks and Progress

Daily activity tracking with streak counters (current and longest). Dashboard displays per-roadmap progress, topic completion stats, and study time tracking.

- **Frontend**: `src/components/StreakWidget.tsx`, `src/components/progress/*`, `src/components/Dashboard.tsx`
- **Hooks**: `src/hooks/useStreak.ts`, `src/hooks/useStudyTime.ts`
- **Database**: `user_streaks`, `study_activities`

### Internationalisation

22 languages supported via `react-i18next`. Language detection from browser. User-selectable language stored in profile.

- **Config**: `src/i18n.ts`
- **Locales**: `src/locales/*.json` (en, hi, bn, ta, te, mr, gu, kn, ml, pa, ur, es, fr, de, pt, zh, ja, ko, ar, ru, it, nl)
- **Switcher**: `src/components/LanguageSwitcher.tsx`

### Authentication

Email/password authentication with Supabase Auth. Protected routes redirect unauthenticated users. User profiles with display name and avatar.

- **Frontend**: `src/pages/Auth.tsx`, `src/hooks/useAuth.tsx`
- **Database**: `profiles`

### Global Search

Cross-roadmap search from the navbar.

- **Frontend**: `src/components/GlobalSearch.tsx`

---

## Architecture

### Frontend

Single-page React application built with Vite. UI components from shadcn/ui (Radix primitives + Tailwind CSS). Client-side routing via React Router v6. State management through React Query for server state and React hooks for local state. Animations with Framer Motion.

### Backend (Edge Functions)

Four Deno-based edge functions deployed on Supabase:

| Function | Purpose |
|---|---|
| `generate-roadmap` | AI curriculum generation |
| `topic-ai` | Explanations, quizzes, flashcards, write-assist, math conversion |
| `study-assistant` | Streaming AI chat |
| `youtube-metadata` | YouTube oEmbed metadata and playlist extraction |

All AI functions route through the Lovable AI gateway (`ai.gateway.lovable.dev`) using `google/gemini-2.5-flash`. Authentication is enforced via JWT validation on every request.

### Database

PostgreSQL via Supabase with Row Level Security (RLS) policies on all tables. Key tables: `roadmaps`, `subjects`, `topics`, `quiz_attempts`, `flashcard_sets`, `custom_quizzes`, `quiz_challenges`, `challenge_attempts`, `topic_notes`, `note_pages`, `todos`, `reminders`, `roadmap_resources`, `resource_groups`, `user_streaks`, `study_activities`, `profiles`.

### Deployment

Frontend deployed via Lovable's publish flow. Backend edge functions deploy automatically on push.

---

## Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Start the development server
npm run dev
```

The development server starts at `http://localhost:8080`.

### Build for Production

```sh
npm run build
```

---

## Contribution Activity

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/harshitIIITD/harshitIIITD/output/github-snake-dark.svg" />
  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/harshitIIITD/harshitIIITD/output/github-snake.svg" />
  <img alt="github-snake" src="https://raw.githubusercontent.com/harshitIIITD/harshitIIITD/output/github-snake-dark.svg" />
</picture>

---

## Credits

**Vittoria Lanzo** -- Frontend Development, Branding, Graphic Design, Pitch Development, Brand Story Ideation

**Harshit Singh** -- Backend Development, AI Integration, Demo Video Production

---

## License

License is currently not defined for this project.
