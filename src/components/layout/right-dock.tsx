import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Link } from "@tanstack/react-router";
import {
  RiChat3Line,
  RiCloseLine,
  RiGiftLine,
  RiSendPlane2Line,
  RiSettings3Line,
  RiUser3Line,
  RiStarLine,
} from "@remixicon/react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SignedIn, SignedOut } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { CURRENCIES, PROMOS } from "@/lib/games-catalog";
import { formatMoney } from "@/lib/format";
import { useWallet } from "@/lib/wallet-context";
import { shortHash, subscribeChatShare, type BetRound } from "@/lib/bet-history";
import { useRoundViewerOptional } from "@/components/games/round-dialog";
import { RoundClone } from "@/components/games/round-clone";
import { PlayerShot } from "@/components/players/player-shot";

export type DockTab = "chat";

const TABS: { id: DockTab; label: string; icon: typeof RiChat3Line }[] = [
  { id: "chat", label: "Chat", icon: RiChat3Line },
];

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
  const { tab, toggle, setTab, mobileOpen, setMobileOpen } = useRightDock();
  const active = TABS.find((t) => t.id === tab);

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
              <header className="flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border px-4">
                <p className="font-sub text-sm font-medium">{active?.label}</p>
                <Button variant="ghost" size="icon-sm" aria-label="Collapse" onClick={() => setTab(null)}>
                  <RiCloseLine className="size-4" />
                </Button>
              </header>
              <div className="min-h-0 flex-1">
                <DockBody tab={tab} />
              </div>
            </>
          ) : null}
        </div>
        </div>
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="right" showCloseButton={false} className="flex h-dvh w-full max-w-none flex-col p-0 md:hidden">
          <SheetHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border px-4 py-3">
            <SheetTitle>{active?.label ?? "Chat"}</SheetTitle>
            <SheetDescription className="sr-only">Live chat</SheetDescription>
            <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={() => setMobileOpen(false)}>
              <RiCloseLine className="size-4" />
            </Button>
          </SheetHeader>
          <div className="flex gap-1 overflow-x-auto border-b border-border px-2 py-2">
            {TABS.map((item) => {
              const Icon = item.icon;
              const on = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={cn(
                    "grid size-10 shrink-0 place-items-center rounded-lg",
                    on ? "bg-muted text-lime" : "text-muted-foreground",
                  )}
                  aria-label={item.label}
                >
                  <Icon className="size-5" />
                </button>
              );
            })}
          </div>
          <div className="min-h-0 flex-1">
            {tab ? <DockBody tab={tab} /> : null}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function DockBody({ tab }: { tab: DockTab }) {
  return <ChatPanel />;
}

type ChatMsg = { id: number; user: string; text: string; vip: string; round?: BetRound };

const SEED: ChatMsg[] = [
  { id: 1, user: "nova", text: "500× on dice", vip: "Diamond" },
  { id: 2, user: "hex", text: "Mines 24 cleared", vip: "Gold" },
  { id: 3, user: "lido", text: "Who is running the weekly race?", vip: "Member" },
  { id: 4, user: "kite", text: "Hi-Lo streak is cooked", vip: "Obsidian" },
  { id: 5, user: "ash", text: "greened the last 8 rolls", vip: "Gold" },
];

function ChatPanel() {
  const { user } = useCurrentUserState();
  const [msgs, setMsgs] = useState(SEED);
  const [text, setText] = useState("");
  const viewer = useRoundViewerOptional();

  useEffect(() => {
    return subscribeChatShare((msg) => {
      setMsgs((m) => [
        ...m,
        { id: Date.now(), user: msg.user, text: msg.text, vip: "Member", round: msg.round },
      ]);
    });
  }, []);

  function send(e: FormEvent) {
    e.preventDefault();
    const next = text.trim();
    if (!next) return;
    setMsgs((m) => [
      ...m,
      {
        id: Date.now(),
        user: user?.displayName ?? "you",
        text: next,
        vip: "Member",
      },
    ]);
    setText("");
  }

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="min-h-0 flex-1 px-3 py-3">
        <ul className="grid gap-2.5">
          {msgs.map((m) => (
            <li key={m.id} className="flex gap-2 text-sm">
              <PlayerShot handle={m.user} className="mt-0.5 size-8 shrink-0 rounded-md" />
              <div className="min-w-0 flex-1">
              <span className="text-[0.65rem] font-semibold tracking-wider text-primary uppercase">
                {m.vip}
              </span>{" "}
              <span className="font-medium text-foreground">{m.user}</span>
              <p className="text-muted-foreground">{m.text}</p>
              {m.round ? (
                <button
                  type="button"
                  onClick={() => viewer?.open(m.round!)}
                  className="mt-1 w-full rounded-lg bg-muted/70 p-1.5 text-left"
                >
                  <RoundClone view={m.round.view} win={m.round.win} label={m.round.label} size="card" />
                  <p className="mt-1 text-[0.65rem] font-semibold tabular-nums text-muted-foreground">
                    {m.round.win ? "WIN" : "LOSE"} · {m.round.label}
                    {m.round.fair ? ` #${shortHash(m.round.fair.serverHash)}` : ""}
                  </p>
                </button>
              ) : null}
              </div>
            </li>
          ))}
        </ul>
      </ScrollArea>
      <form onSubmit={send} className="flex gap-2 border-t border-sidebar-border p-3">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={user ? "Say something…" : "Sign in to chat"}
          disabled={!user}
          className="h-10"
        />
        <Button type="submit" size="icon" className="size-10 shrink-0" disabled={!user || !text.trim()}>
          <RiSendPlane2Line className="size-4" />
        </Button>
      </form>
    </div>
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
