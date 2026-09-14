"use client";

import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { RiChat3Fill, RiCloseLine, RiHome5Line, RiQuestionLine, RiSearchLine, RiSendPlaneFill } from "@remixicon/react";
import { TolsWordmark } from "@/components/brand/tols-mark";
import { TolsChatIcon } from "@/components/brand/tols-chat-icon";
import { cn } from "cn";

const FAQS = [
  { q: "How do I deposit?", a: "Open Wallet and credit play-money USDT, BTC, or ETH. Live deposits use a wallet you control." },
  { q: "Are games fair?", a: "Originals settle on the server at bet time. Read Provably Fair for house edge." },
  { q: "How do I set limits?", a: "Profile → Responsible play. Self-exclusion and deposit, wager, loss, and session limits are there." },
  { q: "I need to talk to someone.", a: "Use Messages here or email support@tols.fun. For gambling harm, BeGambleAware." },
];

type Tab = "home" | "messages" | "help";

export function SupportWidget() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("home");
  const [q, setQ] = useState("");
  const [draft, setDraft] = useState("");
  const [notes, setNotes] = useState<string[]>([]);
  const [article, setArticle] = useState<(typeof FAQS)[number] | null>(null);

  const hits = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return FAQS;
    return FAQS.filter((f) => f.q.toLowerCase().includes(n) || f.a.toLowerCase().includes(n));
  }, [q]);

  function send() {
    const t = draft.trim();
    if (!t) return;
    setNotes((prev) => [...prev, t]);
    setDraft("");
  }

  return (
    <div className="pointer-events-none fixed right-4 z-[60] max-md:bottom-[calc(5.25rem+env(safe-area-inset-bottom))] md:bottom-6">
      {open ? (
        <div className="pointer-events-auto flex h-[min(34rem,calc(100dvh-7.5rem))] w-[min(22.5rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-[1.35rem] border border-white/10 bg-[#0f1116] shadow-[0_24px_80px_rgb(0_0_0/0.55)]">
          <header className="relative shrink-0 bg-[linear-gradient(165deg,#904bf9_0%,#5b21b6_42%,#0f1116_100%)] px-5 pb-10 pt-4">
            <div className="flex items-center justify-between">
              <TolsWordmark className="h-6 brightness-0 invert" />
              <button
                type="button"
                aria-label="Close support"
                onClick={() => setOpen(false)}
                className="grid size-8 place-items-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"
              >
                <RiCloseLine className="size-5" />
              </button>
            </div>
            {tab === "home" && !article ? (
              <h2 className="font-heading mt-6 text-[1.55rem] leading-tight font-semibold tracking-wide text-white uppercase">
                Hey there!
                <br />
                How can we help?
              </h2>
            ) : (
              <h2 className="font-heading mt-6 text-lg font-semibold tracking-wide text-white uppercase">
                {tab === "messages" ? "Messages" : tab === "help" ? "Help" : "Support"}
              </h2>
            )}
          </header>

          <div className="-mt-6 flex min-h-0 flex-1 flex-col px-3 pb-2">
            {tab === "home" ? (
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#16171b]">
                {article ? (
                  <div className="min-h-0 flex-1 overflow-y-auto p-4">
                    <button type="button" className="mb-3 text-xs font-semibold text-lime" onClick={() => setArticle(null)}>
                      ← Back
                    </button>
                    <h3 className="font-heading text-base font-semibold uppercase">{article.q}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/65">{article.a}</p>
                  </div>
                ) : (
                  <>
                    <label className="relative mx-3 mt-3 block">
                      <span className="sr-only">Search for help</span>
                      <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search for help"
                        className="h-10 w-full rounded-xl border border-white/10 bg-[#0f1116] pl-3 pr-9 text-sm text-white outline-none placeholder:text-white/35"
                      />
                      <RiSearchLine className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-white/35" />
                    </label>
                    <ul className="min-h-0 flex-1 overflow-y-auto px-1 py-2">
                      {hits.map((f) => (
                        <li key={f.q}>
                          <button
                            type="button"
                            onClick={() => setArticle(f)}
                            className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left text-[0.82rem] text-white/80 hover:bg-white/5"
                          >
                            {f.q}
                            <span className="text-white/30">›</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            ) : null}

            {tab === "messages" ? (
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#16171b]">
                <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
                  <p className="rounded-xl bg-white/5 px-3 py-2 text-sm text-white/70">
                    TOLS Support — we reply around the clock. Include your account email.
                  </p>
                  {notes.map((n, i) => (
                    <p key={i} className="ml-8 rounded-xl bg-[#904bf9]/25 px-3 py-2 text-sm text-white">
                      {n}
                    </p>
                  ))}
                </div>
                <form
                  className="flex gap-2 border-t border-white/10 p-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    send();
                  }}
                >
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Write a message…"
                    className="h-10 min-w-0 flex-1 rounded-xl border border-white/10 bg-[#0f1116] px-3 text-sm text-white outline-none"
                  />
                  <button type="submit" aria-label="Send" className="grid size-10 place-items-center rounded-xl bg-lime text-black">
                    <RiSendPlaneFill className="size-4" />
                  </button>
                </form>
              </div>
            ) : null}

            {tab === "help" ? (
              <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto rounded-2xl border border-white/10 bg-[#16171b] p-3">
                <Link to="/help" className="rounded-xl bg-white/5 px-3 py-3 text-sm font-medium text-white hover:bg-white/8" onClick={() => setOpen(false)}>
                  Help Center
                </Link>
                <Link to="/responsible" className="rounded-xl bg-white/5 px-3 py-3 text-sm font-medium text-white hover:bg-white/8" onClick={() => setOpen(false)}>
                  Responsible play
                </Link>
                <a href="mailto:support@tols.fun" className="rounded-xl bg-white/5 px-3 py-3 text-sm font-medium text-white hover:bg-white/8">
                  Email support@tols.fun
                </a>
              </div>
            ) : null}
          </div>

          <nav className="grid shrink-0 grid-cols-3 border-t border-white/10 bg-[#0f1116] py-1">
            {(
              [
                { id: "home", label: "Home", Icon: RiHome5Line },
                { id: "messages", label: "Messages", Icon: RiChat3Fill },
                { id: "help", label: "Help", Icon: RiQuestionLine },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTab(t.id);
                  setArticle(null);
                }}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 text-[0.65rem] font-medium",
                  tab === t.id ? "text-[#c4b5fd]" : "text-white/40",
                )}
              >
                <t.Icon className="size-5" />
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      ) : (
        <button
          type="button"
          aria-label="Open live support"
          onClick={() => setOpen(true)}
          className="tols-chat-fab pointer-events-auto"
        >
          <TolsChatIcon className="size-full" />
        </button>
      )}
    </div>
  );
}
