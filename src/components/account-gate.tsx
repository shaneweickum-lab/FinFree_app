"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { ProgressProvider } from "@/lib/progress-context";
import { ProfileProvider } from "@/lib/profile-context";
import { AuthScreen } from "./auth-screen";

export function AccountGate({ children }: { children: ReactNode }) {
  const { username, hydrated } = useAuth();

  if (!hydrated) return null;
  if (!username) return <AuthScreen />;

  return (
    <ProgressProvider key={username} username={username}>
      <ProfileProvider key={username} username={username}>
        {children}
      </ProfileProvider>
    </ProgressProvider>
  );
}
