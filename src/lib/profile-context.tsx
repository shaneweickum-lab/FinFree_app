"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useProgress } from "./progress-context";
import type { LiteracyLevel, PlacementQuizResult, UserProfile } from "./types";

const EMPTY_PROFILE: UserProfile = {
  name: "",
  birthdate: "",
  bio: "",
  selfReportedLevel: null,
  placementQuiz: null,
  onboardingBonusAwarded: false,
};

export const ONBOARDING_BONUS = 750;

interface BasicInfo {
  name: string;
  birthdate: string;
  bio: string;
  selfReportedLevel: LiteracyLevel;
}

interface ProfileContextValue {
  profile: UserProfile;
  hydrated: boolean;
  isProfileComplete: boolean;
  saveBasicInfo: (info: BasicInfo) => void;
  recordPlacementQuiz: (result: PlacementQuizResult) => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ username, children }: { username: string; children: ReactNode }) {
  const storageKey = `finfree.profile.v1.${username.toLowerCase()}`;
  const [profile, setProfile] = useState<UserProfile>(EMPTY_PROFILE);
  const [hydrated, setHydrated] = useState(false);
  const { adjustFinCoin } = useProgress();

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProfile(raw ? { ...EMPTY_PROFILE, ...JSON.parse(raw) } : EMPTY_PROFILE);
    } catch {
      setProfile(EMPTY_PROFILE);
    } finally {
      setHydrated(true);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(storageKey, JSON.stringify(profile));
  }, [profile, hydrated, storageKey]);

  const isProfileComplete = Boolean(profile.name.trim() && profile.birthdate && profile.selfReportedLevel);

  // Awarding Fin Coin touches ProgressProvider's state, so it must happen in an effect rather than
  // inside setProfile's updater — calling it there would update a different component mid-render
  // (and Strict Mode's double-invocation of updaters would double-award the bonus).
  useEffect(() => {
    if (!hydrated) return;
    if (isProfileComplete && profile.placementQuiz && !profile.onboardingBonusAwarded) {
      adjustFinCoin(ONBOARDING_BONUS, "Profile & placement quiz complete");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- guarded by onboardingBonusAwarded, so idempotent
      setProfile((prev) => ({ ...prev, onboardingBonusAwarded: true }));
    }
  }, [hydrated, isProfileComplete, profile.placementQuiz, profile.onboardingBonusAwarded, adjustFinCoin]);

  const saveBasicInfo = useCallback((info: BasicInfo) => {
    setProfile((prev) => ({ ...prev, ...info }));
  }, []);

  const recordPlacementQuiz = useCallback((result: PlacementQuizResult) => {
    setProfile((prev) => ({ ...prev, placementQuiz: result }));
  }, []);

  const value = useMemo(
    () => ({ profile, hydrated, isProfileComplete, saveBasicInfo, recordPlacementQuiz }),
    [profile, hydrated, isProfileComplete, saveBasicInfo, recordPlacementQuiz],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within a ProfileProvider");
  return ctx;
}
