import Link from "next/link";
import type { Module } from "@/lib/types";
import type { ModuleStatus } from "@/lib/module-status";
import { ProgressBar } from "./progress-bar";

const STATUS_STYLES: Record<ModuleStatus, string> = {
  locked: "opacity-60 grayscale",
  "in-progress": "border-royal-purple/30 hover:border-royal-purple",
  complete: "border-money-green/40",
};

export function ModuleCard({
  module,
  status,
  progressFraction,
}: {
  module: Module;
  status: ModuleStatus;
  progressFraction: number;
}) {
  const content = (
    <div
      className={`flex h-full flex-col gap-2 rounded-2xl border-2 bg-white p-4 shadow-sm transition ${STATUS_STYLES[status]}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wide text-royal-purple">
          Module {module.number}
        </span>
        {status === "complete" && <span aria-hidden title="Complete">✅</span>}
        {status === "locked" && <span aria-hidden title="Locked">🔒</span>}
      </div>
      <h3 className="text-lg font-bold text-royal-purple-dark">{module.houseTitle}</h3>
      <p className="text-sm text-foreground/70">{module.subtitle}</p>
      <div className="mt-auto pt-2">
        <ProgressBar fraction={progressFraction} />
      </div>
    </div>
  );

  if (status === "locked") {
    return <div className="cursor-not-allowed">{content}</div>;
  }

  return (
    <Link href={`/modules/${module.id}`} className="block h-full">
      {content}
    </Link>
  );
}
