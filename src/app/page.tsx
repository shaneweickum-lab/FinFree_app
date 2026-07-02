"use client";

import Link from "next/link";
import { COURSE, PATHWAYS, getModulesByPathway } from "@/lib/content";
import { useProgress } from "@/lib/progress-context";
import { getModuleProgressFraction, getModuleStatus, getOverallCourseProgressFraction } from "@/lib/module-status";
import { ModuleCard } from "@/components/module-card";
import { ProgressBar } from "@/components/progress-bar";

export default function DashboardPage() {
  const { progress, hydrated } = useProgress();
  const overallFraction = getOverallCourseProgressFraction(progress);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <section className="rounded-3xl bg-gradient-to-br from-royal-purple to-royal-purple-dark p-6 text-white sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-rich-gold-light">{COURSE.title}</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{COURSE.tagline}</h1>
        <div className="mt-6 max-w-md">
          <div className="mb-1 flex justify-between text-xs font-medium text-white/80">
            <span>Your financial house</span>
            <span>{hydrated ? Math.round(overallFraction * 100) : 0}% built</span>
          </div>
          <ProgressBar fraction={overallFraction} colorClass="bg-rich-gold" />
        </div>

        {hydrated && progress.tradingFloorUnlocked && (
          <Link
            href="/trading-floor"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-rich-gold px-4 py-2 text-sm font-bold text-royal-purple-dark shadow hover:bg-rich-gold-light"
          >
            🏛️ Enter the Trading Floor Simulation
          </Link>
        )}
      </section>

      <div className="mt-10 space-y-10">
        {PATHWAYS.map((pathway) => {
          const modules = getModulesByPathway(pathway.id);
          return (
            <section key={pathway.id}>
              <div className="mb-4 flex items-baseline gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-royal-purple text-xs font-bold text-white">
                  {pathway.order}
                </span>
                <h2 className="text-xl font-bold text-royal-purple-dark">
                  {pathway.title} — <span className="font-semibold text-foreground/70">{pathway.subtitle}</span>
                </h2>
              </div>
              <p className="mb-4 text-sm text-foreground/60">{pathway.description}</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {modules.map((module) => (
                  <ModuleCard
                    key={module.id}
                    module={module}
                    status={hydrated ? getModuleStatus(module.id, progress) : "locked"}
                    progressFraction={hydrated ? getModuleProgressFraction(module.id, progress) : 0}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
