"use client";

import { useState } from "react";
import Link from "next/link";
import { useTutor } from "@/lib/tutor-context";
import { useProgress } from "@/lib/progress-context";
import { findPopQuizQuestion } from "@/lib/tutor/content-lookup";
import { getModule } from "@/lib/content";

const ENCOURAGEMENT_MESSAGES = [
  "You're making real progress — keep it up!",
  "Every lesson you finish compounds. Nice work.",
  "Consistency beats intensity. You've got this.",
];

export function TutorNudge() {
  const { pendingNudge, tradeCritiques, engageNudge, dismissNudge } = useTutor();
  const { recordAdHocQuizAnswer } = useProgress();
  const [answered, setAnswered] = useState<number | null>(null);

  if (!pendingNudge) return null;

  const handleClose = () => {
    setAnswered(null);
    dismissNudge();
  };

  const handleEngage = () => {
    setAnswered(null);
    engageNudge();
  };

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2">
      <div className="rounded-2xl border-2 border-royal-purple/20 bg-white p-4 shadow-xl">
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wide text-royal-purple">FinFree Tutor</span>
          <button onClick={handleClose} aria-label="Dismiss" className="text-foreground/40 hover:text-foreground">
            ✕
          </button>
        </div>

        {pendingNudge.action === "encouragement" && (
          <EncouragementBody onEngage={handleEngage} />
        )}

        {pendingNudge.action === "suggest-a-break" && (
          <div className="mt-2">
            <p className="text-sm text-foreground/80">
              You&apos;ve been at this a while. A short break can help the material stick.
            </p>
            <button onClick={handleEngage} className="mt-3 rounded-full bg-royal-purple px-4 py-2 text-sm font-semibold text-white">
              Take a break
            </button>
          </div>
        )}

        {pendingNudge.action === "micro-pop-quiz" && pendingNudge.quizConcept && (
          <PopQuizBody
            concept={pendingNudge.quizConcept}
            answered={answered}
            onAnswer={(index, question, sourceLessonId, sourceModuleId) => {
              setAnswered(index);
              recordAdHocQuizAnswer(pendingNudge.quizConcept!, index === question.correctIndex, {
                lessonId: sourceLessonId,
                moduleId: sourceModuleId,
                quizId: "tutor-pop-quiz",
              });
            }}
            onDone={handleEngage}
          />
        )}

        {pendingNudge.action === "suggest-lesson-review" && pendingNudge.reviewLessonId && pendingNudge.reviewModuleId && (
          <ReviewLessonBody
            moduleId={pendingNudge.reviewModuleId}
            lessonId={pendingNudge.reviewLessonId}
            onEngage={handleEngage}
          />
        )}

        {pendingNudge.action === "trade-critique" && pendingNudge.tradeCritiqueId && tradeCritiques[pendingNudge.tradeCritiqueId] && (
          <TradeCritiqueBody critique={tradeCritiques[pendingNudge.tradeCritiqueId]} onEngage={handleEngage} />
        )}
      </div>
    </div>
  );
}

function EncouragementBody({ onEngage }: { onEngage: () => void }) {
  const [message] = useState(() => ENCOURAGEMENT_MESSAGES[Math.floor(Math.random() * ENCOURAGEMENT_MESSAGES.length)]);
  return (
    <div className="mt-2">
      <p className="text-sm text-foreground/80">{message}</p>
      <button onClick={onEngage} className="mt-3 rounded-full bg-money-green px-4 py-2 text-sm font-semibold text-white">
        Thanks!
      </button>
    </div>
  );
}

function PopQuizBody({
  concept,
  answered,
  onAnswer,
  onDone,
}: {
  concept: string;
  answered: number | null;
  onAnswer: (
    index: number,
    question: NonNullable<ReturnType<typeof findPopQuizQuestion>>["question"],
    lessonId: string,
    moduleId: string,
  ) => void;
  onDone: () => void;
}) {
  const pick = findPopQuizQuestion(concept);
  if (!pick) return null;
  const { question, lessonId, moduleId } = pick;

  return (
    <div className="mt-2">
      <p className="text-xs font-semibold text-foreground/50">Quick check: {concept.replace(/-/g, " ")}</p>
      <p className="mt-1 text-sm font-medium text-royal-purple-dark">{question.prompt}</p>
      <div className="mt-2 space-y-1.5">
        {question.choices.map((choice, i) => {
          const isAnswered = answered !== null;
          const isCorrect = i === question.correctIndex;
          return (
            <button
              key={i}
              disabled={isAnswered}
              onClick={() => onAnswer(i, question, lessonId, moduleId)}
              className={`block w-full rounded-lg border px-3 py-1.5 text-left text-sm ${
                isAnswered && i === answered
                  ? isCorrect
                    ? "border-money-green bg-money-green/10"
                    : "border-red-400 bg-red-50"
                  : isAnswered && isCorrect
                    ? "border-money-green bg-money-green/10"
                    : "border-black/10"
              }`}
            >
              {choice}
            </button>
          );
        })}
      </div>
      {answered !== null && (
        <button onClick={onDone} className="mt-3 rounded-full bg-royal-purple px-4 py-2 text-sm font-semibold text-white">
          Continue
        </button>
      )}
    </div>
  );
}

function ReviewLessonBody({ moduleId, lessonId, onEngage }: { moduleId: string; lessonId: string; onEngage: () => void }) {
  const mod = getModule(moduleId);
  return (
    <div className="mt-2">
      <p className="text-sm text-foreground/80">Want to revisit a lesson while it&apos;s fresh?</p>
      {mod && <p className="mt-1 text-xs text-foreground/50">{mod.houseTitle}</p>}
      <Link
        href={`/modules/${moduleId}/lessons/${lessonId}`}
        onClick={onEngage}
        className="mt-3 inline-block rounded-full bg-royal-purple px-4 py-2 text-sm font-semibold text-white"
      >
        Go to lesson
      </Link>
    </div>
  );
}

function TradeCritiqueBody({
  critique,
  onEngage,
}: {
  critique: ReturnType<typeof useTutor>["tradeCritiques"][string];
  onEngage: () => void;
}) {
  const verdictColor =
    critique.verdict === "Excellent" || critique.verdict === "Sound" ? "text-money-green-dark" : "text-rich-gold-dark";

  return (
    <div className="mt-2">
      <p className="text-xs font-semibold text-foreground/50">Trade Critique</p>
      <p className={`mt-0.5 text-lg font-bold ${verdictColor}`}>{critique.verdict}</p>
      <ul className="mt-2 space-y-1.5">
        {critique.factors.map((f) => (
          <li key={f.key} className="text-sm text-foreground/80">
            <span className="font-semibold">{f.contribution < 0 ? "⚠" : "✓"}</span> {f.detail}
          </li>
        ))}
      </ul>
      <p className="mt-2 rounded-lg bg-royal-purple/5 p-2 text-sm italic text-royal-purple-dark">{critique.suggestedReframe}</p>
      <button onClick={onEngage} className="mt-3 rounded-full bg-royal-purple px-4 py-2 text-sm font-semibold text-white">
        Got it
      </button>
    </div>
  );
}
