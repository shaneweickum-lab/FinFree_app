"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { notFound, useParams, useSearchParams } from "next/navigation";
import { getLesson, getLessonsByModule, getModule } from "@/lib/content";
import { useProgress } from "@/lib/progress-context";
import { getLessonStatus } from "@/lib/module-status";
import { LessonTypeBadge } from "@/components/lesson-type-badge";
import { QuizRunner } from "@/components/quiz-runner";

export default function LessonPage() {
  const params = useParams<{ moduleId: string; lessonId: string }>();
  const searchParams = useSearchParams();
  const mod = getModule(params.moduleId);
  const lesson = getLesson(params.lessonId);
  const { progress, hydrated, isLessonComplete, completeLesson } = useProgress();

  const highlightParam = searchParams.get("highlight");
  const highlightIndex = highlightParam !== null && highlightParam !== "" ? Number(highlightParam) : null;

  if (!mod || !lesson || lesson.moduleId !== mod.id) return notFound();

  const status = hydrated ? getLessonStatus(lesson, progress) : "locked";
  const siblings = getLessonsByModule(mod.id);
  const nextLesson = siblings[siblings.findIndex((l) => l.id === lesson.id) + 1];
  const complete = hydrated && isLessonComplete(lesson.id);

  if (hydrated && status === "locked") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-4xl">🔒</p>
        <h1 className="mt-4 text-xl font-bold text-royal-purple-dark">This lesson isn&apos;t unlocked yet</h1>
        <p className="mt-2 text-foreground/60">Finish the earlier lessons in {mod.houseTitle} first.</p>
        <Link
          href={`/modules/${mod.id}`}
          className="mt-6 inline-block rounded-full bg-royal-purple px-5 py-2 text-sm font-semibold text-white"
        >
          Back to {mod.houseTitle}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <Link href={`/modules/${mod.id}`} className="text-sm font-medium text-royal-purple hover:underline">
        ← {mod.houseTitle}
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <LessonTypeBadge type={lesson.type} />
        {complete && <span className="text-sm font-semibold text-money-green-dark">✅ Completed</span>}
      </div>
      <h1 className="mt-1 text-2xl font-bold text-royal-purple-dark">{lesson.title}</h1>
      <p className="mt-2 text-foreground/70">{lesson.summary}</p>

      <div className="mt-6">
        {lesson.type === "quiz" ? (
          <QuizRunner lesson={lesson} />
        ) : lesson.type === "minigame" ? (
          <MiniGameBody lessonComplete={complete} onComplete={() => completeLesson(lesson)} lesson={lesson} />
        ) : (
          <ExplanatoryOrInteractiveBody
            lessonComplete={complete}
            onComplete={() => completeLesson(lesson)}
            lesson={lesson}
            highlightIndex={highlightIndex}
          />
        )}
      </div>

      {complete && (
        <div className="mt-8 flex flex-wrap gap-3">
          {nextLesson ? (
            <Link
              href={`/modules/${mod.id}/lessons/${nextLesson.id}`}
              className="rounded-full bg-royal-purple px-5 py-2 text-sm font-semibold text-white"
            >
              Next: {nextLesson.title} →
            </Link>
          ) : (
            <Link href={`/modules/${mod.id}`} className="rounded-full bg-royal-purple px-5 py-2 text-sm font-semibold text-white">
              Back to Module Overview
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function ExplanatoryOrInteractiveBody({
  lesson,
  lessonComplete,
  onComplete,
  highlightIndex,
}: {
  lesson: ReturnType<typeof getLesson>;
  lessonComplete: boolean;
  onComplete: () => void;
  highlightIndex: number | null;
}) {
  const bulletRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [pulsingIndex, setPulsingIndex] = useState<number | null>(null);

  useEffect(() => {
    if (highlightIndex === null) return;
    const el = bulletRefs.current[highlightIndex];
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setPulsingIndex(highlightIndex);
    const timeout = setTimeout(() => setPulsingIndex(null), 2500);
    return () => clearTimeout(timeout);
  }, [highlightIndex]);

  if (!lesson) return null;
  const isInteractive = lesson.type === "interactive";

  return (
    <div className="space-y-4">
      {lesson.bulletPoints.length > 0 && (
        <ul className="space-y-2 rounded-2xl bg-royal-purple/5 p-4">
          {lesson.bulletPoints.map((point, i) => (
            <li
              key={i}
              ref={(el) => {
                bulletRefs.current[i] = el;
              }}
              className={`flex gap-2 rounded-lg px-2 py-1 text-sm text-foreground/80 transition-colors duration-500 ${
                pulsingIndex === i ? "bg-rich-gold/40 ring-2 ring-rich-gold" : ""
              }`}
            >
              <span aria-hidden className="text-royal-purple">•</span>
              {point}
            </li>
          ))}
        </ul>
      )}

      {isInteractive && (
        <div className="rounded-2xl border-2 border-dashed border-royal-purple/30 p-4 text-center text-sm text-foreground/60">
          Interactive exercise placeholder — the full drag-and-drop / fill-in activity ships in the next content pass.
        </div>
      )}

      {!lessonComplete && (
        <button
          onClick={onComplete}
          className="w-full rounded-full bg-money-green px-4 py-3 font-semibold text-white"
        >
          {isInteractive ? "Complete Exercise" : "Mark as Read"} (+{lesson.finCoinReward} 🪙)
        </button>
      )}
    </div>
  );
}

function MiniGameBody({
  lesson,
  lessonComplete,
  onComplete,
}: {
  lesson: ReturnType<typeof getLesson>;
  lessonComplete: boolean;
  onComplete: () => void;
}) {
  if (!lesson?.miniGame) return null;
  const { title, description } = lesson.miniGame;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-rich-gold/10 p-4">
        <h3 className="font-bold text-rich-gold-dark">{title}</h3>
        <p className="mt-1 text-sm text-foreground/70">{description}</p>
      </div>
      <div className="rounded-2xl border-2 border-dashed border-rich-gold/40 p-8 text-center text-sm text-foreground/60">
        🎮 Mini-game canvas placeholder — full gameplay ships in the next content pass.
      </div>
      {!lessonComplete && (
        <button onClick={onComplete} className="w-full rounded-full bg-rich-gold px-4 py-3 font-semibold text-white">
          Play &amp; Complete (+{lesson.finCoinReward} 🪙)
        </button>
      )}
    </div>
  );
}
