"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";

export function AuthScreen() {
  const { signup, login } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = mode === "signup" ? await signup(username, password) : await login(username, password);
    setSubmitting(false);
    if (!result.ok) setError(result.error);
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-sm flex-col justify-center px-4 py-12">
      <div className="text-center">
        <span aria-hidden className="text-4xl">🏠</span>
        <h1 className="mt-2 text-2xl font-bold text-royal-purple-dark">FinFree App</h1>
        <p className="mt-1 text-sm text-foreground/60">Building Your Financial House</p>
      </div>

      <div className="mt-8 flex rounded-full bg-royal-purple/10 p-1 text-sm font-semibold">
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`flex-1 rounded-full py-2 transition ${mode === "signup" ? "bg-royal-purple text-white" : "text-royal-purple-dark"}`}
        >
          Create Account
        </button>
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`flex-1 rounded-full py-2 transition ${mode === "login" ? "bg-royal-purple text-white" : "text-royal-purple-dark"}`}
        >
          Log In
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="username" className="block text-xs font-semibold text-foreground/60">
            Username
          </label>
          <input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={3}
            autoComplete="username"
            className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-xs font-semibold text-foreground/60">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
          />
        </div>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-money-green px-4 py-3 font-semibold text-white disabled:opacity-50"
        >
          {mode === "signup" ? "Create Account" : "Log In"}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-foreground/50">
        Prototype account storage: saved only in this browser, not on a server.
      </p>
    </div>
  );
}
