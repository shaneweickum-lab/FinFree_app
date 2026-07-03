"use client";

import { useState } from "react";
import { PLACEMENT_QUIZ_QUESTIONS, scoreToLiteracyLevel } from "@/lib/placement-quiz";
import { LITERACY_LEVEL_LABELS } from "@/lib/types";
import type { PlacementQuizResult } from "@/lib/types";

export function PlacementQuizRunner({
  onComplete,
  onCancel,
  onDone,
}: {
  onComplete: (result: PlacementQuizResult) => void;
  onCancel: () => void;
  onDone: () => void;
}) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<PlacementQuizResult | null>(null);

  const allAnswered = PLACEMENT_QUIZ_QUESTIONS.every((q) => answers[q.id] !== undefined);

  function handleSubmit() {
    const correctCount = PLACEMENT_QUIZ_QUESTIONS.filter((q) => answers[q.id] === q.correctIndex).length;
    const computedResult: PlacementQuizResult = {
      score: correctCount,
      totalCount: PLACEMENT_QUIZ_QUESTIONS.length,
      computedLevel: scoreToLiteracyLevel(correctCount),
      completedAt: Date.now(),
    };
    setResult(computedResult);
    onComplete(computedResult);
  }

  if (result) {
    return (
      <div className="rounded-2xl bg-money-green/10 p-6 text-center">
        <p className="text-3xl">🎉</p>
        <h3 className="mt-2 text-lg font-bold text-money-green-dark">Placement Quiz Complete</h3>
        <p className="mt-1 text-sm text-foreground/70">
          You scored {result.score}/{result.totalCount}. FinFree App places you at:
        </p>
        <p className="mt-2 text-xl font-bold text-royal-purple-dark">{LITERACY_LEVEL_LABELS[result.computedLevel]}</p>
        <button
          onClick={onDone}
          className="mt-4 rounded-full bg-royal-purple px-5 py-2 text-sm font-semibold text-white"
        >
          Back to Profile
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-royal-purple-dark">Financial Literacy Placement Quiz</h3>
        <button onClick={onCancel} className="text-xs font-semibold text-foreground/50 hover:text-foreground">
          Cancel
        </button>
      </div>

      {PLACEMENT_QUIZ_QUESTIONS.map((q, i) => (
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
        Submit Placement Quiz
      </button>
    </div>
  );
}
