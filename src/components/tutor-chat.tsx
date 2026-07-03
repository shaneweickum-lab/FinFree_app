"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import { useProgress } from "@/lib/progress-context";
import { useProfile } from "@/lib/profile-context";
import { useTutor } from "@/lib/tutor-context";
import { createAimlBot } from "@/lib/tutor/aiml-engine";
import { TUTOR_CATEGORIES } from "@/lib/tutor/knowledge-base";

interface ChatMessage {
  id: string;
  role: "user" | "bot";
  text: string;
}

const SUGGESTED_QUESTIONS = ["What is a stop-loss?", "What's my Fin Coin balance?", "How am I doing?", "What is EBITDA?"];

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "bot",
  text: "Hi! I'm the FinFree Tutor. Ask me to define a financial or trading term, or ask about your own progress.",
};

let messageIdCounter = 0;
function nextMessageId() {
  messageIdCounter += 1;
  return `msg-${messageIdCounter}-${Math.floor(performance.now())}`;
}

const bot = createAimlBot(TUTOR_CATEGORIES);

export function TutorChat() {
  const { username } = useAuth();
  const { progress } = useProgress();
  const { profile } = useProfile();
  const { tradeCritiques } = useTutor();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [draft, setDraft] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const storageKey = `finfree.tutorChat.v1.${username?.toLowerCase()}`;

  useEffect(() => {
    if (!username) return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setMessages(JSON.parse(raw));
    } catch {
      // ignore corrupted chat history
    } finally {
      setHydrated(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated || !username) return;
    window.localStorage.setItem(storageKey, JSON.stringify(messages.slice(-100)));
  }, [messages, hydrated, username, storageKey]);

  useEffect(() => {
    if (!open) return;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  function ask(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;

    const reply = bot.respond(trimmed, { progress, profile, tradeCritiques });
    setMessages((prev) => [
      ...prev,
      { id: nextMessageId(), role: "user", text: trimmed },
      { id: nextMessageId(), role: "bot", text: reply },
    ]);
    setDraft("");
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    ask(draft);
  }

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close tutor chat" : "Open tutor chat"}
        className="fixed bottom-4 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-royal-purple text-2xl text-white shadow-lg transition hover:bg-royal-purple-dark"
      >
        {open ? "✕" : "💬"}
      </button>

      {open && (
        <div className="fixed bottom-20 right-4 z-40 flex h-[28rem] w-[calc(100%-2rem)] max-w-sm flex-col rounded-2xl border-2 border-royal-purple/20 bg-white shadow-2xl">
          <div className="rounded-t-2xl bg-royal-purple px-4 py-3">
            <p className="text-sm font-bold text-white">FinFree Tutor</p>
            <p className="text-xs text-white/70">Ask about a term, or your own progress</p>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                  m.role === "user" ? "ml-auto bg-royal-purple text-white" : "bg-royal-purple/10 text-foreground"
                }`}
              >
                {m.text}
              </div>
            ))}
          </div>

          {messages.length <= 1 && (
            <div className="flex flex-wrap gap-1.5 border-t border-black/5 p-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => ask(q)}
                  className="rounded-full bg-royal-purple/10 px-2.5 py-1 text-xs font-medium text-royal-purple-dark hover:bg-royal-purple/20"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex gap-2 border-t border-black/5 p-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ask a question…"
              className="flex-1 rounded-full border border-black/10 px-3 py-1.5 text-sm"
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              className="rounded-full bg-money-green px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-40"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
