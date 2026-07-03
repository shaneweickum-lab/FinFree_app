"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import { useProfile } from "@/lib/profile-context";
import { LITERACY_LEVEL_LABELS, type LiteracyLevel, type PlacementQuizResult } from "@/lib/types";
import { PlacementQuizRunner } from "@/components/placement-quiz-runner";
import { ONBOARDING_BONUS } from "@/lib/profile-context";

const LITERACY_OPTIONS = Object.entries(LITERACY_LEVEL_LABELS) as [LiteracyLevel, string][];

export default function ProfilePage() {
  const { username } = useAuth();
  const { profile, hydrated, isProfileComplete, saveBasicInfo, recordPlacementQuiz } = useProfile();

  const [name, setName] = useState(profile.name);
  const [birthdate, setBirthdate] = useState(profile.birthdate);
  const [bio, setBio] = useState(profile.bio);
  const [selfReportedLevel, setSelfReportedLevel] = useState<LiteracyLevel | "">(profile.selfReportedLevel ?? "");
  const [taking, setTaking] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!hydrated) return null;

  function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!selfReportedLevel) return;
    saveBasicInfo({ name, birthdate, bio, selfReportedLevel });
    setSaved(true);
  }

  function handleQuizComplete(result: PlacementQuizResult) {
    recordPlacementQuiz(result);
  }

  const bonusJustUnlocked = isProfileComplete && profile.placementQuiz && profile.onboardingBonusAwarded;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-royal-purple-dark">Your Profile</h1>
      <p className="mt-1 text-sm text-foreground/60">Logged in as {username}</p>

      {bonusJustUnlocked && (
        <div className="mt-4 rounded-2xl bg-rich-gold/10 p-4 text-sm font-semibold text-rich-gold-dark">
          🎉 You&apos;ve earned the {ONBOARDING_BONUS} Fin Coin onboarding bonus!
        </div>
      )}

      {!taking ? (
        <>
          <form onSubmit={handleSave} className="mt-6 space-y-4">
            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-foreground/60">
                Name
              </label>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="birthdate" className="block text-xs font-semibold text-foreground/60">
                Birthdate
              </label>
              <input
                id="birthdate"
                type="date"
                value={birthdate}
                onChange={(e) => setBirthdate(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="bio" className="block text-xs font-semibold text-foreground/60">
                Bio
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="literacy" className="block text-xs font-semibold text-foreground/60">
                Financial Literacy Level
              </label>
              <select
                id="literacy"
                value={selfReportedLevel}
                onChange={(e) => setSelfReportedLevel(e.target.value as LiteracyLevel)}
                required
                className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
              >
                <option value="" disabled>
                  Select a level…
                </option>
                {LITERACY_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" className="w-full rounded-full bg-royal-purple px-4 py-3 font-semibold text-white">
              Save Profile
            </button>
            {saved && <p className="text-center text-sm font-medium text-money-green-dark">Profile saved.</p>}
          </form>

          <div className="mt-8 rounded-2xl border-2 border-royal-purple/15 bg-white p-4">
            <h2 className="font-bold text-royal-purple-dark">Placement Quiz</h2>
            {profile.placementQuiz ? (
              <p className="mt-1 text-sm text-foreground/70">
                Last result: {profile.placementQuiz.score}/{profile.placementQuiz.totalCount} —{" "}
                <span className="font-semibold text-royal-purple-dark">
                  {LITERACY_LEVEL_LABELS[profile.placementQuiz.computedLevel]}
                </span>
              </p>
            ) : (
              <p className="mt-1 text-sm text-foreground/60">
                Take this 15-question quiz so FinFree App can place you at the right starting level.
              </p>
            )}
            <button
              onClick={() => setTaking(true)}
              className="mt-3 rounded-full bg-money-green px-4 py-2 text-sm font-semibold text-white"
            >
              {profile.placementQuiz ? "Retake Placement Quiz" : "Take Placement Quiz"}
            </button>
            {!isProfileComplete || !profile.placementQuiz ? (
              <p className="mt-2 text-xs text-foreground/50">
                Complete your profile and this quiz together to earn {ONBOARDING_BONUS} Fin Coin.
              </p>
            ) : null}
          </div>
        </>
      ) : (
        <div className="mt-6">
          <PlacementQuizRunner
            onComplete={handleQuizComplete}
            onCancel={() => setTaking(false)}
            onDone={() => setTaking(false)}
          />
        </div>
      )}
    </div>
  );
}
