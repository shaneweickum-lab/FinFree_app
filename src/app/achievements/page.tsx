"use client";

import { useProgress } from "@/lib/progress-context";
import { useProfile } from "@/lib/profile-context";
import { computeAchievements, type AchievementCategory } from "@/lib/achievements";
import { ProgressBar } from "@/components/progress-bar";

const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  onboarding: "Onboarding",
  learning: "Learning",
  coins: "Fin Coin",
  trading: "Trading Floor",
};

const CATEGORY_ORDER: AchievementCategory[] = ["onboarding", "learning", "coins", "trading"];

export default function AchievementsPage() {
  const { progress, hydrated: progressHydrated } = useProgress();
  const { profile, hydrated: profileHydrated } = useProfile();

  if (!progressHydrated || !profileHydrated) return null;

  const achievements = computeAchievements({ progress, profile });
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-royal-purple-dark">Achievements</h1>
      <p className="mt-1 text-sm text-foreground/60">
        {unlockedCount} of {achievements.length} unlocked
      </p>
      <div className="mt-3 max-w-md">
        <ProgressBar fraction={unlockedCount / achievements.length} colorClass="bg-rich-gold" />
      </div>

      <div className="mt-8 space-y-8">
        {CATEGORY_ORDER.map((category) => {
          const items = achievements.filter((a) => a.category === category);
          return (
            <section key={category}>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-royal-purple">
                {CATEGORY_LABELS[category]}
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {items.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`flex items-start gap-3 rounded-2xl border-2 p-4 transition ${
                      achievement.unlocked
                        ? "border-rich-gold/40 bg-rich-gold/5"
                        : "border-black/10 bg-white opacity-60 grayscale"
                    }`}
                  >
                    <span aria-hidden className="text-2xl">
                      {achievement.icon}
                    </span>
                    <div>
                      <h3 className="font-semibold text-royal-purple-dark">{achievement.title}</h3>
                      <p className="text-sm text-foreground/60">{achievement.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
