"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { getLessonsByModule, getModule, getPathway } from "@/lib/content";
import { useProgress } from "@/lib/progress-context";
import { getLessonStatus, getModuleStatus } from "@/lib/module-status";
import { LessonTypeBadge } from "@/components/lesson-type-badge";

export default function ModulePage() {
  const params = useParams<{ moduleId: string }>();
  const mod = getModule(params.moduleId);
  const { progress, hydrated } = useProgress();

  if (!mod) return notFound();

  const pathway = getPathway(mod.pathwayId);
  const lessons = getLessonsByModule(mod.id);
  const status = hydrated ? getModuleStatus(mod.id, progress) : "locked";

  if (hydrated && status === "locked") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-4xl">🔒</p>
        <h1 className="mt-4 text-xl font-bold text-royal-purple-dark">This module is still locked</h1>
        <p className="mt-2 text-foreground/60">Complete the previous module first to unlock {mod.houseTitle}.</p>
        <Link href="/" className="mt-6 inline-block rounded-full bg-royal-purple px-5 py-2 text-sm font-semibold text-white">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link href="/" className="text-sm font-medium text-royal-purple hover:underline">
        ← Back to Dashboard
      </Link>

      <p className="mt-4 text-xs font-bold uppercase tracking-wide text-royal-purple">
        {pathway?.title} · Module {mod.number}
      </p>
      <h1 className="mt-1 text-3xl font-bold text-royal-purple-dark">{mod.houseTitle}</h1>
      <p className="text-lg text-foreground/70">{mod.subtitle}</p>

      <div className="mt-6 space-y-3 rounded-2xl bg-royal-purple/5 p-4">
        <p><span className="font-semibold text-royal-purple-dark">Purpose: </span>{mod.purpose}</p>
        <p><span className="font-semibold text-royal-purple-dark">Why it matters: </span>{mod.whyItMatters}</p>
      </div>

      <div className="mt-8 space-y-3">
        {lessons.map((lesson, i) => {
          const lessonStatus = hydrated ? getLessonStatus(lesson, progress) : i === 0 ? "available" : "locked";
          const locked = lessonStatus === "locked";
          const card = (
            <div
              className={`flex items-center gap-4 rounded-2xl border-2 bg-white p-4 shadow-sm transition ${
                locked ? "opacity-60" : "border-transparent hover:border-royal-purple/30"
              } ${lessonStatus === "complete" ? "border-money-green/40" : ""}`}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-royal-purple/10 text-sm font-bold text-royal-purple-dark">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <LessonTypeBadge type={lesson.type} />
                  {lessonStatus === "complete" && <span aria-hidden>✅</span>}
                  {locked && <span aria-hidden>🔒</span>}
                </div>
                <h3 className="mt-1 font-semibold text-royal-purple-dark">{lesson.title}</h3>
                <p className="truncate text-sm text-foreground/60">{lesson.summary}</p>
              </div>
              <span className="shrink-0 text-xs font-semibold text-rich-gold-dark">+{lesson.finCoinReward} 🪙</span>
            </div>
          );

          return locked ? (
            <div key={lesson.id} className="cursor-not-allowed">{card}</div>
          ) : (
            <Link key={lesson.id} href={`/modules/${mod.id}/lessons/${lesson.id}`} className="block">
              {card}
            </Link>
          );
        })}
      </div>

      {status === "complete" && mod.connectionToNext && (
        <div className="mt-8 rounded-2xl bg-money-green/10 p-4 text-sm text-money-green-dark">
          <span className="font-semibold">What&apos;s next: </span>
          {mod.connectionToNext}
        </div>
      )}
    </div>
  );
}
