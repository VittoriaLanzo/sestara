# Sestara — Hackathon Demo Script (~5 minutes)

---

## 1. Opening Hook

Hi everyone.

Let me tell you about Chiara.

Chiara is a student from southern Italy. She studied nine hours a day for six months to prepare for Italy's medical entrance exam. One attempt. One day. Everything on the line.

She failed by four points.

Not because she wasn't smart. Not because she didn't try. But because no one told her she was spending three weeks on a topic worth two questions — and skipping one worth fifteen.

She had no feedback. No structure. No system saying, "This is where you're weak. Focus here."

She had textbooks and willpower. That's it.

---

## 2. The Global Problem

Chiara isn't alone.

According to UNESCO, 244 million children and youth worldwide are out of school entirely. But even among those *in* school, the gap is massive.

The World Bank estimates that 70% of children in low- and middle-income countries experience learning poverty — they cannot read a simple text by age ten. The OECD consistently finds that students with access to private tutoring outperform those without, not because of talent, but because of infrastructure.

This is an equity problem.

When your exam outcome depends on whether your family can afford coaching, that breaks SDG 16 — Peace, Justice, and Strong Institutions. Education institutions are supposed to be equalizers, not gatekeepers.

And when professional access is determined by exam access, entire communities lose mobility. That undermines SDG 11 — Sustainable Cities and Communities. You can't build inclusive cities if the path into medicine, engineering, and law is locked behind expensive prep courses.

---

## 3. Introducing Sestara

That's why we built Sestara.

Sestara is a study platform that turns any exam goal into a structured, trackable learning journey. Think of it as the tutor Chiara never had — but available to anyone with a browser.

The name comes from "sextant," the navigation tool sailors used to find their position by the stars. That's what Sestara does for students: it tells you exactly where you are and where you need to go.

Let me show you.

---

## 4. Live Walkthrough

### Home Page

This is Sestara's landing page. Clean, simple. A student signs up, picks their exam goal, and gets started. No onboarding maze. No credit card.

### Roadmap & Curriculum Engine

When a student enters their goal — say, a medical entrance exam — Sestara generates a full curriculum. Not a vague plan. The actual exam structure broken into subjects, subtopics, estimated hours, and completion status.

So instead of guessing what to study, you see exactly what exists, how long each part takes, and where you currently stand.

### Topic Page

Inside each topic, students see their progress percentage and estimated time remaining. Every topic is self-contained — notes, quizzes, flashcards, all in one place.

### Built-in Quiz

Students can generate quizzes instantly. Multiple choice, short answer, configurable difficulty. Every question comes with a full explanation — not just "correct" or "wrong," but *why*.

### Flashcards

Each topic auto-generates flashcards. Students flip through them, mark what they know and what they don't. Hard cards come back more often. Easy ones fade. It's efficient revision, not random review.

### StudyBuddy & Wolfram Integration

This is StudyBuddy, our built-in AI assistant. Students can ask it to explain a concept, simplify a proof, or walk through a problem step by step.

Here's what makes it different.

When a student asks a math or science question — say, "What is the integral of x squared from 0 to 5?" — StudyBuddy silently classifies the query. If it involves computation, the system calls the **Wolfram Alpha API** in the background to get a verified result. That result is injected as ground truth before the AI generates its explanation.

The student never sees this. There's no extra loading screen, no attribution banner. They just get a correct, computationally verified answer.

This matters because in STEM exams, a wrong derivative or a miscalculated equilibrium constant costs real points. Most AI chatbots hallucinate math confidently. Sestara doesn't, because Wolfram is doing the actual computation underneath.

### Custom Quiz Studio

Students can also build custom quizzes. Sestara generates a structured prompt. The student pastes it into any AI — ChatGPT, Gemini, Claude — gets back a JSON quiz, and loads it directly into Sestara's quiz engine. This keeps the platform AI-agnostic. No one is locked out because they can't afford a specific tool.

### Streaks & Progress Tracking

Finally, progress. Students see daily streaks, weekly study time, topic completion percentages. Everything is measurable and visible. When progress is concrete, motivation stays concrete too.

---

## 5. Technical Stack

Sestara is built with React and TypeScript on Vite. Styling is Tailwind CSS with a custom design system. The backend runs on Lovable Cloud with a full database, authentication, and edge functions. Math rendering uses KaTeX. The quiz engine supports configurable scoring and timed sessions. And Wolfram Alpha's API provides silent computational verification for STEM accuracy.

The platform is multilingual, GDPR-aligned, and fully functional today. Not a prototype. Not a mockup.

---

## 6. SDG Connection

Education is the foundation.

If exam preparation is unequal, professional access is unequal. If professional access is unequal, communities can't grow inclusively.

Sestara directly supports **SDG 16** by reducing institutional inequity — giving every student the same structured preparation that private coaching provides. And it supports **SDG 11** by opening professional pathways that build stronger, more inclusive communities.

---

## 7. Closing

Chiara is retaking her exam this year.

This time, she knows exactly which topics matter, exactly where she's weak, and exactly how much time she has left.

She doesn't need to guess anymore.

She has Sestara.

Thank you.
