"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { RiChat3Fill, RiCloseLine, RiHome5Line, RiQuestionLine, RiSearchLine, RiSendPlaneFill } from "@remixicon/react";
import { TolsWordmark } from "@/components/brand/tols-mark";
import { TolsChatIcon } from "@/components/brand/tols-chat-icon";
import { useRightDock } from "@/components/layout/right-dock";
import { supportInbox, supportSend, type SupportMessage } from "@/lib/governance/support";
import { cn } from "cn";

const FAQS = [
  { q: "How do I deposit?", a: "Open Wallet and credit play-money USDT, BTC, or ETH. Live deposits use a wallet you control." },
  { q: "Are games fair?", a: "Originals settle on the server at bet time. Read Provably Fair for house edge." },
  { q: "How do I set limits?", a: "Profile → Responsible play. Self-exclusion and deposit, wager, loss, and session limits are there." },
  { q: "I need to talk to someone.", a: "Use Messages here or email support@tols.fun. For gambling harm, BeGambleAware." },
];

type Tab = "home" | "messages" | "help";

type DeskStatus = "ai" | "live" | "closed";

export function SupportWidget() {
  const { tab: dockTab, mobileOpen } = useRightDock();
  const chatOpen = dockTab === "chat";
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("home");
  const [q, setQ] = useState("");
  const [draft, setDraft] = useState("");
  const [article, setArticle] = useState<(typeof FAQS)[number] | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [status, setStatus] = useState<DeskStatus>("ai");
  const [agentName, setAgentName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const busyRef = useRef(false);

  useEffect(() => {
    function openFromNav() {
      setOpen(true);
      setTab("messages");
    }
    window.addEventListener("tols-support-open", openFromNav);
    return () => window.removeEventListener("tols-support-open", openFromNav);
  }, []);

  useEffect(() => {
    if (!open || tab !== "messages") return;
    let stop = false;
    async function pull() {
      try {
        const view = await supportInbox({ data: {} });
        if (stop || busyRef.current) return;
        setMessages(view.messages);
        setStatus(view.status);
        setAgentName(view.agentName);
      } catch {
        /* keep the thread on screen if a poll fails */
      }
    }
    void pull();
    const id = window.setInterval(() => void pull(), 5000);
    return () => {
      stop = true;
      window.clearInterval(id);
    };
  }, [open, tab]);

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, busy]);

  const hits = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return FAQS;
    return FAQS.filter((f) => f.q.toLowerCase().includes(n) || f.a.toLowerCase().includes(n));
  }, [q]);

  async function send(handoff = false) {
    const t = handoff ? draft.trim() || "I need a live agent." : draft.trim();
    if (!t || busy) return;
    setBusy(true);
    busyRef.current = true;
    setError(null);
    setDraft("");
    try {
      const view = await supportSend({ data: { text: t, handoff } });
      setMessages(view.messages);
      setStatus(view.status);
      setAgentName(view.agentName);
      if (!view.ok && view.error) setError(view.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't send");
      setDraft(t);
    } finally {
      setBusy(false);
      busyRef.current = false;
    }
  }

  return (
    <div
      className={cn(
        "pointer-events-none fixed z-[60] transition-[right] duration-200 max-md:bottom-[calc(4.6rem+env(safe-area-inset-bottom))] md:bottom-5",
        mobileOpen && "max-md:hidden",
        chatOpen ? "right-3 md:right-[calc(20rem+1.25rem)]" : "right-3 md:right-5",
      )}
    >
      {open ? (
        <div className="pointer-events-auto flex h-[min(26rem,calc(100dvh-8.25rem))] w-[min(19rem,calc(100vw-1.25rem))] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0f1116] shadow-[0_16px_48px_rgb(0_0_0/0.5)] md:h-[min(30rem,calc(100dvh-5.5rem))] md:w-80">
          <header className="relative shrink-0 bg-[linear-gradient(165deg,#904bf9_0%,#5b21b6_42%,#0f1116_100%)] px-4 pt-3 pb-7">
            <div className="flex items-center justify-between">
              <TolsWordmark className="h-5 brightness-0 invert" />
              <button
                type="button"
                aria-label="Close support"
                onClick={() => setOpen(false)}
                className="grid size-7 place-items-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"
              >
                <RiCloseLine className="size-4" />
              </button>
            </div>
            {tab === "home" && !article ? (
              <h2 className="font-heading mt-4 text-xl leading-tight font-semibold tracking-wide text-white uppercase">
                Hey there!
                <br />
                How can we help?
              </h2>
            ) : (
              <h2 className="font-heading mt-4 text-base font-semibold tracking-wide text-white uppercase">
                {tab === "messages" ? "Messages" : tab === "help" ? "Help" : "Support"}
              </h2>
            )}
          </header>

          <div className="-mt-5 flex min-h-0 flex-1 flex-col px-2.5 pb-2">
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
                            className="flex w-full items-center justify-between gap-2 px-2.5 py-2 text-left text-[0.78rem] text-white/80 hover:bg-white/5"
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
                <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
                  <p className="text-[0.68rem] font-semibold tracking-wide text-white/70 uppercase">
                    {status === "live" ? agentName || "Live agent" : status === "closed" ? "Closed" : "TOLS AI"}
                  </p>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[0.6rem] font-semibold",
                      status === "live" ? "bg-lime/15 text-lime" : "bg-white/8 text-white/45",
                    )}
                  >
                    {status === "live" ? "Governance desk" : status === "closed" ? "Closed" : "AI"}
                  </span>
                </div>
                <div ref={scroller} className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
                  {messages.length === 0 ? (
                    <p className="rounded-xl bg-white/5 px-3 py-2 text-sm text-white/70">
                      Ask about deposits, fairness, or limits. If a person has to act, this chat calls a live agent on the governance desk.
                    </p>
                  ) : null}
                  {messages.map((m) => (
                    <p
                      key={m.id}
                      className={cn(
                        "rounded-xl px-3 py-2 text-sm",
                        m.role === "user" && "ml-8 bg-[#904bf9]/25 text-white",
                        m.role === "assistant" && "mr-6 bg-white/5 text-white/80",
                        m.role === "agent" && "mr-4 border border-lime/30 bg-lime/10 text-white",
                        m.role === "system" && "text-center text-[0.7rem] text-white/45",
                      )}
                    >
                      {m.role === "agent" ? <span className="mb-0.5 block text-[0.62rem] font-semibold text-lime">Live agent</span> : null}
                      {m.body}
                    </p>
                  ))}
                  {busy ? <p className="text-[0.7rem] text-white/40">Replying…</p> : null}
                  {error ? <p className="text-[0.7rem] text-rose-300">{error}</p> : null}
                </div>
                {status !== "live" ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void send(true)}
                    className="mx-2 mb-1 rounded-lg border border-white/10 px-2 py-1.5 text-[0.68rem] font-semibold text-white/70 hover:bg-white/5 disabled:opacity-50"
                  >
                    Talk to a live agent
                  </button>
                ) : null}
                <form
                  className="flex gap-2 border-t border-white/10 p-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void send(false);
                  }}
                >
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={status === "live" ? "Message the agent…" : "Write a message…"}
                    className="h-10 min-w-0 flex-1 rounded-xl border border-white/10 bg-[#0f1116] px-3 text-sm text-white outline-none"
                  />
                  <button type="submit" aria-label="Send" disabled={busy} className="grid size-10 place-items-center rounded-xl bg-lime text-black disabled:opacity-50">
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

          <nav className="grid shrink-0 grid-cols-3 border-t border-white/10 bg-[#0f1116]">
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
                  "flex flex-col items-center gap-0.5 py-1.5 text-[0.6rem] font-medium",
                  tab === t.id ? "text-[#c4b5fd]" : "text-white/40",
                )}
              >
                <t.Icon className="size-4" />
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
