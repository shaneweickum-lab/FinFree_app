import type { LessonType } from "@/lib/types";

const LABELS: Record<LessonType, { label: string; icon: string }> = {
  explanatory: { label: "Lesson", icon: "📖" },
  interactive: { label: "Interactive", icon: "🛠️" },
  quiz: { label: "Quiz", icon: "📝" },
  minigame: { label: "Mini-Game", icon: "🎮" },
};

export function LessonTypeBadge({ type }: { type: LessonType }) {
  const { label, icon } = LABELS[type];
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-royal-purple/10 px-2 py-0.5 text-xs font-semibold text-royal-purple-dark">
      <span aria-hidden>{icon}</span>
      {label}
    </span>
  );
}
