import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Link } from "@tanstack/react-router";
import {
  RiArrowDownSLine,
  RiCloseLine,
  RiEmotionHappyLine,
  RiQuestionLine,
  RiSendPlane2Line,
} from "@remixicon/react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { SignedIn, SignedOut } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { CURRENCIES, PROMOS } from "@/lib/games-catalog";
import { formatMoney } from "@/lib/format";
import { useWallet } from "@/lib/wallet-context";
import { shortHash, subscribeChatShare, type BetRound } from "@/lib/bet-history";
import { useRoundViewerOptional } from "@/components/games/round-dialog";
import { RoundClone } from "@/components/games/round-clone";

export type DockTab = "chat";

type DockCtx = {
  tab: DockTab | null;
  setTab: (tab: DockTab | null) => void;
  toggle: (tab: DockTab) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
};

const Ctx = createContext<DockCtx | null>(null);

export function useRightDock() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useRightDock must be used within RightDockProvider");
  return ctx;
}

export function RightDockProvider({ children }: { children: ReactNode }) {
  const [tab, setTab] = useState<DockTab | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  function toggle(next: DockTab) {
    const mobile = typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;
    if (mobile) {
      setTab(next);
      setMobileOpen(true);
      return;
    }
    setTab((cur) => (cur === next ? null : next));
  }

  return (
    <Ctx.Provider value={{ tab, setTab, toggle, mobileOpen, setMobileOpen }}>
      {children}
    </Ctx.Provider>
  );
}

export function RightDock() {
  const { tab, setTab, mobileOpen, setMobileOpen } = useRightDock();

  return (
    <>
      <aside className="hidden min-h-full self-stretch bg-sidebar md:flex">
        <div className="sticky top-0 flex h-svh shrink-0">
        <div
          className={cn(
            "flex h-full flex-col overflow-hidden border-l border-sidebar-border bg-sidebar transition-[width] duration-200 ease-linear",
            tab ? "w-80" : "w-0 border-l-0",
          )}
        >
          {tab ? (
            <>
              <div className="min-h-0 flex-1">
                <DockBody tab={tab} onClose={() => setTab(null)} />
              </div>
            </>
          ) : null}
        </div>
        </div>
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="right" showCloseButton={false} className="flex h-dvh w-full max-w-none flex-col p-0 md:hidden">
          <div className="min-h-0 flex-1">
            {tab ? <DockBody tab={tab} onClose={() => setMobileOpen(false)} /> : null}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function DockBody({ onClose }: { tab: DockTab; onClose: () => void }) {
  return <ChatPanel onClose={onClose} />;
}

type ChatMsg = {
  id: number;
  user: string;
  text: string;
  vip: string;
  round?: BetRound;
  tip?: { to: string; amount: string; asset: string };
};

const ROOMS = [
  { id: "en", label: "English", flag: "🇬🇧" },
  { id: "sports", label: "Sports", flag: "🏟️" },
  { id: "it", label: "Italiano", flag: "🇮🇹" },
] as const;

const VIP_COLOR: Record<string, string> = {
  Member: "#9aa3b2",
  Silver: "#c5ced9",
  Gold: "#f5c542",
  Platinum: "#e8eef6",
  Jade: "#34d399",
  Diamond: "#7dd3fc",
  Ruby: "#fb7185",
  Obsidian: "#c084fc",
};

const QUICK_EMOJI = ["😂", "🔥", "💎", "🏇", "💥", "🟢", "👑", "🍀"];

const SEED: ChatMsg[] = [
  { id: 1, user: "nova", text: "500× on dice", vip: "Gold" },
  { id: 2, user: "hex", text: "Mines 24 cleared", vip: "Silver" },
  { id: 3, user: "lido", text: "Who is running the weekly race?", vip: "Platinum" },
  { id: 4, user: "kite", text: "Horse race just paid the long one", vip: "Jade" },
  {
    id: 5,
    user: "ash",
    text: "",
    vip: "Silver",
    tip: { to: "nova", amount: "10.00", asset: "USDC" },
  },
  { id: 6, user: "yard", text: "gl", vip: "Gold" },
];

function ChatPanel({ onClose }: { onClose: () => void }) {
  const { user } = useCurrentUserState();
  const [msgs, setMsgs] = useState(SEED);
  const [text, setText] = useState("");
  const [room, setRoom] = useState<(typeof ROOMS)[number]["id"]>("en");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const viewer = useRoundViewerOptional();
  const scroller = useRef<HTMLDivElement>(null);
  const current = ROOMS.find((r) => r.id === room) ?? ROOMS[0];

  useEffect(() => {
    return subscribeChatShare((msg) => {
      setMsgs((m) => [
        ...m,
        { id: Date.now(), user: msg.user, text: msg.text, vip: "Gold", round: msg.round },
      ]);
    });
  }, []);

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs]);

  function send(e: FormEvent) {
    e.preventDefault();
    const next = text.trim();
    if (!next || !user) return;
    setMsgs((m) => [
      ...m,
      { id: Date.now(), user: user.displayName ?? "you", text: next, vip: "Member" },
    ]);
    setText("");
    setEmojiOpen(false);
  }

  return (
    <div className="flex h-full flex-col bg-[#121418]">
      <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-white/10 px-3">
        <h3 className="font-heading text-sm font-semibold text-white">Chat</h3>
        <div className="flex items-center gap-1">
          <label className="relative">
            <span className="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 text-sm">{current.flag}</span>
            <select
              aria-label="Chat room"
              value={room}
              onChange={(e) => setRoom(e.target.value as (typeof ROOMS)[number]["id"])}
              className="h-8 appearance-none rounded-md bg-white/5 pr-7 pl-8 text-xs font-medium text-white outline-none"
            >
              {ROOMS.map((r) => (
                <option key={r.id} value={r.id} className="bg-[#121418]">
                  {r.label}
                </option>
              ))}
            </select>
            <RiArrowDownSLine className="pointer-events-none absolute top-1/2 right-1.5 size-4 -translate-y-1/2 text-white/50" />
          </label>
          <Button variant="ghost" size="icon-sm" aria-label="Close chat" onClick={onClose}>
            <RiCloseLine className="size-4" />
          </Button>
        </div>
      </header>

      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
        <ul className="grid gap-1.5">
          {msgs.map((m) => (
            <li key={m.id}>
              {m.tip ? (
                <div className="rounded-lg bg-white/[0.04] px-2.5 py-2 ring-1 ring-white/10">
                  <p className="flex flex-wrap items-center gap-1 text-xs">
                    <VipMark name={m.vip} />
                    <span className="font-semibold text-white">{m.user}</span>
                    <span className="text-lime">tipped</span>
                    <span className="font-semibold text-white">{m.tip.to}</span>
                  </p>
                  <p className="mt-1 inline-flex items-center gap-1 rounded-md bg-black/40 px-2 py-1 text-xs font-semibold tabular-nums text-white">
                    <span className="grid size-4 place-items-center rounded-full bg-[#2775ca] text-[8px] font-bold">$</span>
                    ${m.tip.amount}
                    <span className="text-[10px] text-white/50">{m.tip.asset}</span>
                  </p>
                </div>
              ) : (
                <p className="text-[13px] leading-5">
                  <VipMark name={m.vip} />
                  <button type="button" className="font-semibold text-white hover:underline">
                    {m.user}
                  </button>
                  <span className="text-white/35">: </span>
                  <span className="text-white/85">{renderChatText(m.text)}</span>
                </p>
              )}
              {m.round ? (
                <button
                  type="button"
                  onClick={() => viewer?.open(m.round!)}
                  className="mt-1 w-full rounded-lg bg-white/[0.04] p-1.5 text-left ring-1 ring-white/10"
                >
                  <RoundClone view={m.round.view} win={m.round.win} label={m.round.label} size="card" />
                  <p className="mt-1 text-[0.65rem] font-semibold tabular-nums text-white/50">
                    {m.round.win ? "WIN" : "LOSE"} · {m.round.label}
                    {m.round.fair ? ` #${shortHash(m.round.fair.serverHash)}` : ""}
                  </p>
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      </div>

      <footer className="shrink-0 border-t border-white/10 px-3 pt-2 pb-3">
        <form onSubmit={send} className="relative">
          {emojiOpen ? (
            <div className="absolute right-0 bottom-12 z-10 grid grid-cols-4 gap-1 rounded-lg bg-[#1c1f27] p-2 ring-1 ring-white/10">
              {QUICK_EMOJI.map((emo) => (
                <button
                  key={emo}
                  type="button"
                  className="grid size-8 place-items-center rounded-md text-base hover:bg-white/10"
                  onClick={() => {
                    setText((t) => `${t}${emo}`);
                    setEmojiOpen(false);
                  }}
                >
                  {emo}
                </button>
              ))}
            </div>
          ) : null}
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={user ? "Your message" : "Sign in to chat"}
            disabled={!user}
            className="h-10 rounded-lg border-white/10 bg-black/30 pr-20"
          />
          <div className="absolute top-1/2 right-1 flex -translate-y-1/2 items-center">
            <button
              type="button"
              aria-label="Emoji"
              className="grid size-8 place-items-center text-white/60 hover:text-white"
              onClick={() => setEmojiOpen((v) => !v)}
            >
              <RiEmotionHappyLine className="size-4" />
            </button>
            <button
              type="submit"
              aria-label="Send"
              disabled={!user || !text.trim()}
              className="grid size-8 place-items-center text-lime disabled:text-white/25"
            >
              <RiSendPlane2Line className="size-4" />
            </button>
          </div>
        </form>
        <div className="mt-2 flex items-center justify-between text-[11px] text-white/45">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-lime" />
            {180 + msgs.length} online
          </span>
          <Link to="/terms" className="inline-flex items-center gap-1 hover:text-white">
            <RiQuestionLine className="size-3.5" />
            Chat rules
          </Link>
        </div>
      </footer>
    </div>
  );
}

function VipMark({ name }: { name: string }) {
  const color = VIP_COLOR[name] ?? VIP_COLOR.Member;
  return (
    <span
      className="mr-1 inline-block size-2 translate-y-[-1px] rounded-full align-middle"
      style={{ background: color }}
      title={name}
    />
  );
}

function renderChatText(text: string) {
  return text.split(/(\s+)/).map((part, i) =>
    part.startsWith("@") ? (
      <span key={i} className="font-semibold text-lime">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

function vipMeta(wagered: number) {
  const tiers = [
    { name: "Member", min: 0, next: 1000 },
    { name: "Gold", min: 1000, next: 5000 },
    { name: "Diamond", min: 5000, next: 25000 },
    { name: "Obsidian", min: 25000, next: 25000 },
  ];
  const cur = [...tiers].reverse().find((t) => wagered >= t.min) ?? tiers[0];
  const span = cur.next - cur.min || 1;
  const pct = cur.name === "Obsidian" ? 100 : Math.min(100, ((wagered - cur.min) / span) * 100);
  return { ...cur, pct };
}

function ProfilePanel() {
  const { user } = useCurrentUserState();
  const { balances } = useWallet();

  return (
    <ScrollArea className="h-full px-4 py-4">
      <SignedOut>
        <p className="text-sm text-muted-foreground">Sign in to see balances, VIP, and limits.</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button asChild variant="outline" className="w-full">
            <Link to="/login">Login</Link>
          </Button>
          <Button asChild className="w-full">
            <Link to="/register">Sign up</Link>
          </Button>
        </div>
      </SignedOut>
      <SignedIn>
        <p className="font-heading text-lg font-semibold">{user?.displayName ?? "Player"}</p>
        <p className="text-xs text-muted-foreground">{user?.primaryEmail}</p>
        <ul className="mt-4 grid gap-2">
          {CURRENCIES.map((c) => (
            <li key={c} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm">
              <span className="text-muted-foreground">{c}</span>
              <span className="tabular-nums">{formatMoney(balances[c], c)}</span>
            </li>
          ))}
        </ul>
        <Button asChild variant="outline" className="mt-4 w-full">
          <Link to="/profile">Open profile</Link>
        </Button>
      </SignedIn>
    </ScrollArea>
  );
}

function VipPanel() {
  const { wagered } = useWallet();
  const vip = useMemo(() => vipMeta(wagered), [wagered]);

  return (
    <ScrollArea className="h-full px-4 py-4">
      <p className="text-xs font-medium tracking-[0.18em] text-gold uppercase">{vip.name}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {formatMoney(wagered, "USDT")} wagered
      </p>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-lime" style={{ width: `${vip.pct}%` }} />
      </div>
      {vip.name !== "Obsidian" ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Next tier at {formatMoney(vip.next, "USDT")}
        </p>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">Top of the house.</p>
      )}
      <Button asChild variant="outline" className="mt-6 w-full">
        <Link to="/vip">VIP program</Link>
      </Button>
    </ScrollArea>
  );
}

function PromosPanel() {
  return (
    <ScrollArea className="h-full px-3 py-3">
      <ul className="grid gap-2">
        {PROMOS.slice(0, 6).map((p) => (
          <li key={p.id}>
            <Link
              to="/promotions"
              className="block rounded-xl bg-muted/40 p-3 transition-colors hover:bg-muted"
            >
              <p className="text-[0.65rem] font-semibold tracking-wider text-primary uppercase">
                {p.kicker}
              </p>
              <p className="mt-1 text-sm font-medium">{p.title}</p>
              <p className="text-xs text-lime">{p.badge}</p>
            </Link>
          </li>
        ))}
      </ul>
    </ScrollArea>
  );
}

function SettingsPanel() {
  const { currency, setCurrency } = useWallet();
  const [sound, setSound] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem("tols-sound") !== "off";
  });

  function toggleSound(next: boolean) {
    setSound(next);
    window.localStorage.setItem("tols-sound", next ? "on" : "off");
  }

  return (
    <ScrollArea className="h-full px-4 py-4">
      <div className="grid gap-5">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Display currency</p>
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {CURRENCIES.map((c) => (
              <Button
                key={c}
                size="sm"
                variant={currency === c ? "default" : "outline"}
                onClick={() => setCurrency(c)}
              >
                {c}
              </Button>
            ))}
          </div>
        </div>
        <label className="flex items-center justify-between gap-3 text-sm">
          Sound
        <button
          type="button"
          role="switch"
          aria-checked={sound}
          onClick={() => toggleSound(!sound)}
          className={cn(
            "h-6 w-10 rounded-full transition-colors",
            sound ? "bg-primary" : "bg-muted",
          )}
        >
          <span
            className={cn(
              "block size-5 rounded-full bg-white transition-transform",
              sound ? "translate-x-4" : "translate-x-0.5",
            )}
          />
        </button>
        </label>
        <div className="grid gap-2 text-sm">
          <Link to="/profile" className="text-foreground hover:underline">
            Responsible limits
          </Link>
          <Link to="/terms" className="text-muted-foreground hover:text-foreground">
            Terms of Service
          </Link>
          <Link to="/privacy" className="text-muted-foreground hover:text-foreground">
            Privacy Policy
          </Link>
        </div>
      </div>
    </ScrollArea>
  );
}
