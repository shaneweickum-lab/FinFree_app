# FinFree App

A gamified financial literacy and day trading learning platform. The launch curriculum, **Building Your Financial House**, takes learners from core financial vocabulary through the three fundamental financial statements, accounting and trading terminology, and finally day trading fundamentals — earning Fin Coin along the way and unlocking a capstone Trading Floor Simulation.

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS. Progress, Fin Coin balance, and quiz mastery are persisted to `localStorage` — there is no backend yet, by design, for this skeleton.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Structure

- `src/lib/types.ts` — core data model (courses, modules, lessons, quizzes, progress, Fin Coin ledger)
- `src/lib/content.ts` — seed curriculum content for the 3 pathways / 7 modules
- `src/lib/progress-context.tsx` — client-side progress/Fin Coin state, persisted to `localStorage`
- `src/lib/adaptive.ts` — per-concept mastery tracking and the Trading Floor's adaptive-difficulty engine
- `src/lib/market.ts` — simulated market/order logic for the Trading Floor
- `src/app/` — dashboard, module, lesson, and Trading Floor Simulation routes

## Next steps

Full per-lesson content, individual mini-game implementations, larger quiz question banks, and a real backend (auth, persistence, leaderboards) are intentionally out of scope for this skeleton.
