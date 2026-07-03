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
import { hashPassword, randomSalt } from "./crypto";
import type { Account } from "./types";

const ACCOUNTS_KEY = "finfree.accounts.v1";
const SESSION_KEY = "finfree.session.v1";

type AccountsByKey = Record<string, Account>;

export type AuthResult = { ok: true } | { ok: false; error: string };

interface AuthContextValue {
  username: string | null;
  hydrated: boolean;
  signup: (username: string, password: string) => Promise<AuthResult>;
  login: (username: string, password: string) => Promise<AuthResult>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadAccounts(): AccountsByKey {
  try {
    const raw = window.localStorage.getItem(ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAccounts(accounts: AccountsByKey) {
  window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [username, setUsername] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SESSION_KEY);
      if (raw) {
        const session = JSON.parse(raw);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (session?.username) setUsername(session.username);
      }
    } catch {
      // corrupted session — treat as logged out
    } finally {
      setHydrated(true);
    }
  }, []);

  const signup = useCallback(async (rawUsername: string, password: string): Promise<AuthResult> => {
    const trimmed = rawUsername.trim();
    if (trimmed.length < 3) return { ok: false, error: "Username must be at least 3 characters." };
    if (password.length < 6) return { ok: false, error: "Password must be at least 6 characters." };

    const accounts = loadAccounts();
    const key = trimmed.toLowerCase();
    if (accounts[key]) return { ok: false, error: "That username is already taken." };

    const salt = randomSalt();
    const passwordHash = await hashPassword(password, salt);
    accounts[key] = { username: trimmed, passwordHash, salt, createdAt: Date.now() };
    saveAccounts(accounts);

    window.localStorage.setItem(SESSION_KEY, JSON.stringify({ username: trimmed }));
    setUsername(trimmed);
    return { ok: true };
  }, []);

  const login = useCallback(async (rawUsername: string, password: string): Promise<AuthResult> => {
    const trimmed = rawUsername.trim();
    const accounts = loadAccounts();
    const account = accounts[trimmed.toLowerCase()];
    if (!account) return { ok: false, error: "No account found with that username." };

    const passwordHash = await hashPassword(password, account.salt);
    if (passwordHash !== account.passwordHash) return { ok: false, error: "Incorrect password." };

    window.localStorage.setItem(SESSION_KEY, JSON.stringify({ username: account.username }));
    setUsername(account.username);
    return { ok: true };
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(SESSION_KEY);
    setUsername(null);
  }, []);

  const value = useMemo(
    () => ({ username, hydrated, signup, login, logout }),
    [username, hydrated, signup, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
