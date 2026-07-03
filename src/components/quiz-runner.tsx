"use client";

import { useState } from "react";
import Link from "next/link";
import type { Lesson } from "@/lib/types";
import { useProgress } from "@/lib/progress-context";
import { getLessonsByModule } from "@/lib/content";

export function QuizRunner({ lesson }: { lesson: Lesson }) {
  const quiz = lesson.quiz;
  const { submitQuiz } = useProgress();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{ score: number; passed: boolean; correctCount: number; totalCount: number } | null>(
    null,
  );

  if (!quiz) return null;

  const allAnswered = quiz.questions.every((q) => answers[q.id] !== undefined);
  const remediationLesson = getLessonsByModule(lesson.moduleId).find((l) => l.type === "explanatory") ?? null;

  function handleSubmit() {
    if (!quiz) return;
    const ordered = quiz.questions.map((q) => answers[q.id] ?? -1);
    setResult(submitQuiz(lesson, ordered));
  }

  if (result) {
    return (
      <div className="space-y-4">
        <div
          className={`rounded-2xl p-4 text-center font-semibold ${
            result.passed ? "bg-money-green/10 text-money-green-dark" : "bg-rich-gold/10 text-rich-gold-dark"
          }`}
        >
          {result.passed ? "🎉 Passed! " : "Not quite there yet. "}
          You scored {result.correctCount}/{result.totalCount} ({Math.round(result.score * 100)}%).
        </div>

        <div className="space-y-3">
          {quiz.questions.map((q) => {
            const chosen = answers[q.id];
            const correct = chosen === q.correctIndex;
            return (
              <div key={q.id} className={`rounded-xl border p-3 text-sm ${correct ? "border-money-green/30" : "border-rich-gold/40"}`}>
                <p className="font-medium">{q.prompt}</p>
                <p className="mt-1 text-foreground/70">
                  Your answer: {q.choices[chosen] ?? "—"} {correct ? "✅" : "❌"}
                </p>
                {!correct && <p className="text-foreground/70">Correct answer: {q.choices[q.correctIndex]}</p>}
                <p className="mt-1 text-foreground/60">{q.explanation}</p>
              </div>
            );
          })}
        </div>

        {!result.passed && remediationLesson && (
          <div className="rounded-2xl bg-royal-purple/5 p-4 text-sm">
            <p className="font-semibold text-royal-purple-dark">Let&apos;s reinforce this before moving on.</p>
            <p className="mt-1 text-foreground/70">
              Review the lesson below, then come back and retake the quiz.
            </p>
            <Link
              href={`/modules/${lesson.moduleId}/lessons/${remediationLesson.id}`}
              className="mt-3 inline-block rounded-full bg-royal-purple px-4 py-2 text-xs font-semibold text-white"
            >
              Review: {remediationLesson.title}
            </Link>
          </div>
        )}

        {!result.passed && (
          <button
            onClick={() => {
              setAnswers({});
              setResult(null);
            }}
            className="w-full rounded-full border-2 border-royal-purple px-4 py-2 text-sm font-semibold text-royal-purple"
          >
            Retake Quiz
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {quiz.questions.map((q, i) => (
        <fieldset key={q.id} className="rounded-2xl border border-royal-purple/15 p-4">
          <legend className="px-1 text-sm font-semibold text-royal-purple-dark">
            {i + 1}. {q.prompt}
          </legend>
          <div className="mt-2 space-y-2">
            {q.choices.map((choice, choiceIndex) => (
              <label
                key={choiceIndex}
                className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                  answers[q.id] === choiceIndex ? "border-royal-purple bg-royal-purple/5" : "border-black/10"
                }`}
              >
                <input
                  type="radio"
                  name={q.id}
                  className="accent-[var(--color-royal-purple)]"
                  checked={answers[q.id] === choiceIndex}
                  onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: choiceIndex }))}
                />
                {choice}
              </label>
            ))}
          </div>
        </fieldset>
      ))}

      <button
        disabled={!allAnswered}
        onClick={handleSubmit}
        className="w-full rounded-full bg-money-green px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        Submit Quiz
      </button>
    </div>
  );
}
