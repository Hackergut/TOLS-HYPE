import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { RiCloseLine, RiLogoutBoxRLine } from "@remixicon/react";
import { toast } from "sonner";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChainSelect } from "@/components/ui/chain-select";
import { CryptoMark } from "@/components/wallet/crypto-mark";
import { ACCOUNT_ICONS } from "@/lib/account-icons";
import { ACCOUNT_NAV, type NavLink } from "@/lib/nav";
import { authEnabled, signOut } from "@/lib/auth/client";
import { hasGateSessionMarker } from "@/lib/auth/gate-session-marker";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { CURRENCIES, CURRENCY_META, type Currency } from "@/lib/games-catalog";
import { formatMoney } from "@/lib/format";
import { loadAnimOn, loadSoundOn, saveAnimOn, saveSoundOn } from "@/lib/game-prefs";
import { playSfx } from "@/lib/game-sound";
import { useNotifications } from "@/lib/notifications/client";
import {
  getNotificationPrefs,
  saveNotificationPrefs,
  type NoticePrefs,
} from "@/lib/notifications/server";
import { useTolsChain } from "@/lib/onchain/use-chain";
import { formatUsd, toUsd, useValueMode, type ValueMode } from "@/lib/value-mode";
import { useWallet } from "@/lib/wallet-context";
import { useBetHistory } from "@/lib/bet-history";
import { useRoundViewerOptional } from "@/components/games/round-dialog";
import { WalletCashier } from "@/components/wallet/wallet-cashier";
import { cn } from "cn";

export type WalletHubTab = "wallet" | "settings" | "tx" | "vault";

const HUB_TABS: Partial<Record<NavLink["icon"], WalletHubTab>> = {
  wallet: "wallet",
  settings: "settings",
  tx: "tx",
  vault: "vault",
};

type HubCtx = {
  open: boolean;
  tab: WalletHubTab;
  setOpen: (open: boolean) => void;
  openTab: (tab: WalletHubTab) => void;
};

const Ctx = createContext<HubCtx | null>(null);

export function useWalletHub() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWalletHub must be used within WalletHubProvider");
  return ctx;
}

export function WalletHubProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<WalletHubTab>("wallet");
  function openTab(next: WalletHubTab) {
    setTab(next);
    setOpen(true);
  }
  return (
    <Ctx.Provider value={{ open, tab, setOpen, openTab }}>
      {children}
      <WalletHub />
    </Ctx.Provider>
  );
}

function WalletHub() {
  const { open, tab, setOpen, openTab } = useWalletHub();
  const [mode, setMode] = useValueMode();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className={cn(
          "flex flex-col gap-0 p-0",
          tab === "wallet" ? "w-full max-w-none sm:max-w-md" : "w-[min(100%,44rem)] sm:max-w-xl md:max-w-3xl",
        )}
      >
        <SheetHeader className="flex flex-row items-center justify-between space-y-0 px-4 py-2">
          <SheetTitle className={tab === "wallet" ? "sr-only" : undefined}>Wallet</SheetTitle>
          <SheetDescription className="sr-only">Balances, cashier, and account settings</SheetDescription>
          <div className="ml-auto flex items-center gap-2">
            {tab !== "wallet" ? <ValueToggle mode={mode} onChange={setMode} /> : null}
            <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={() => setOpen(false)}>
              <RiCloseLine className="size-4" />
            </Button>
          </div>
        </SheetHeader>
        <div className="flex min-h-0 flex-1">
          {tab !== "wallet" ? <AccountRail active={tab} onTab={openTab} onNavigate={() => setOpen(false)} /> : null}
          <ScrollArea className="min-h-0 flex-1">
            <div className="p-3 md:p-5">
              {tab === "wallet" ? <WalletCashier onHistory={() => openTab("tx")} /> : null}
              {tab === "settings" ? <SettingsPane /> : null}
              {tab === "tx" ? <TxPane /> : null}
              {tab === "vault" ? <VaultPane /> : null}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ValueToggle({ mode, onChange }: { mode: ValueMode; onChange: (m: ValueMode) => void }) {
  return (
    <div className="flex rounded-lg bg-muted p-0.5">
      {(["crypto", "usd"] as const).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          className={cn(
            "h-7 rounded-md px-2.5 text-[0.7rem] font-semibold uppercase",
            mode === m ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
          )}
        >
          {m === "crypto" ? "Crypto" : "USD"}
        </button>
      ))}
    </div>
  );
}

function AccountRail({
  active,
  onTab,
  onNavigate,
}: {
  active: WalletHubTab;
  onTab: (tab: WalletHubTab) => void;
  onNavigate: () => void;
}) {
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);
  const gateSession = useSyncExternalStore(
    () => () => {},
    hasGateSessionMarker,
    () => false,
  );
  const canSignOut = authEnabled && !gateSession;

  return (
    <nav className="flex w-14 shrink-0 flex-col gap-0.5 border-r border-border py-2 md:w-48">
      {ACCOUNT_NAV.map((item) => {
        const Icon = ACCOUNT_ICONS[item.icon];
        const hub = HUB_TABS[item.icon];
        const on = hub === active;
        return (
          <button
            key={item.title}
            type="button"
            className={cn(
              "flex h-10 items-center gap-3 px-3 text-left text-sm",
              on ? "bg-muted text-lime" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
            onClick={() => {
              if (hub) onTab(hub);
              else {
                onNavigate();
                void navigate({ to: item.to });
              }
            }}
          >
            <Icon className="size-4 shrink-0 text-lime" />
            <span className="hidden truncate md:inline">{item.title}</span>
          </button>
        );
      })}
      {canSignOut ? (
        <button
          type="button"
          disabled={signingOut}
          className="mt-auto flex h-10 items-center gap-3 px-3 text-left text-sm text-destructive"
          onClick={() => {
            setSigningOut(true);
            void signOut().catch(() => setSigningOut(false));
          }}
        >
          <RiLogoutBoxRLine className="size-4" />
          <span className="hidden md:inline">{signingOut ? "Signing out…" : "Sign out"}</span>
        </button>
      ) : null}
    </nav>
  );
}

function display(amount: number, currency: Currency, mode: ValueMode) {
  return mode === "usd" ? formatUsd(toUsd(amount, currency)) : `${formatMoney(amount, currency)} ${currency}`;
}

function WalletPane() {
  const { currency, setCurrency, balances, deposit, withdraw } = useWallet();
  const [mode] = useValueMode();
  const { chainId, setChainId, chains } = useTolsChain();
  const [amount, setAmount] = useState(String(CURRENCY_META[currency].minBet * 10));
  const parsed = Number(amount);
  const totalUsd = CURRENCIES.reduce((s, c) => s + toUsd(balances[c], c), 0);

  async function run(action: "deposit" | "withdraw") {
    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast.error("Enter an amount");
      return;
    }
    try {
      if (action === "deposit") await deposit(parsed);
      else await withdraw(parsed);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cashier failed");
    }
  }

  return (
    <div className="grid gap-4">
      <div>
        <p className="text-xs text-muted-foreground">Total</p>
        <p className="font-heading text-2xl font-bold tabular-nums">
          {mode === "usd" ? formatUsd(totalUsd) : display(balances[currency], currency, mode)}
        </p>
      </div>
      <ul className="grid gap-1.5">
        {CURRENCIES.map((c) => {
          const on = currency === c;
          return (
            <li key={c}>
              <button
                type="button"
                onClick={() => setCurrency(c)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left",
                  on ? "bg-muted ring-1 ring-lime/40" : "hover:bg-muted/50",
                )}
              >
                <CryptoMark currency={c} className="size-9" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{c}</span>
                  <span className="block text-xs text-muted-foreground">{CURRENCY_META[c].label}</span>
                </span>
                <span className="text-right">
                  <span className="block text-sm font-semibold tabular-nums">{display(balances[c], c, mode)}</span>
                  {mode === "crypto" ? (
                    <span className="block text-[0.65rem] text-muted-foreground">{formatUsd(toUsd(balances[c], c))}</span>
                  ) : (
                    <span className="block text-[0.65rem] text-muted-foreground">
                      {formatMoney(balances[c], c)} {c}
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <ChainSelect chains={[...chains]} value={chainId} onSelect={setChainId} size="sm" />
      <Input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="h-11 tabular-nums"
        aria-label="Amount"
      />
      <div className="grid grid-cols-2 gap-2">
        <Button className="h-11" onClick={() => void run("deposit")}>
          Deposit
        </Button>
        <Button variant="outline" className="h-11" onClick={() => void run("withdraw")}>
          Withdraw
        </Button>
      </div>
    </div>
  );
}

function SettingsPane() {
  const { currency, setCurrency } = useWallet();
  const [mode, setMode] = useValueMode();
  const { chainId, setChainId, chains } = useTolsChain();
  const { pushState, enablePush, disablePush } = useNotifications();
  const [sound, setSound] = useState(loadSoundOn);
  const [anim, setAnim] = useState(loadAnimOn);
  const [prefs, setPrefs] = useState<NoticePrefs | null>(null);

  useEffect(() => {
    void getNotificationPrefs().then(setPrefs).catch(() => undefined);
  }, []);

  return (
    <div className="grid gap-5">
      <section>
        <p className="mb-2 text-xs font-medium text-muted-foreground">Value</p>
        <ValueToggle mode={mode} onChange={setMode} />
      </section>
      <section>
        <p className="mb-2 text-xs font-medium text-muted-foreground">Display currency</p>
        <div className="grid grid-cols-3 gap-1.5">
          {CURRENCIES.map((c) => (
            <Button key={c} size="sm" variant={currency === c ? "default" : "outline"} onClick={() => setCurrency(c)}>
              <CryptoMark currency={c} className="size-4" />
              {c}
            </Button>
          ))}
        </div>
      </section>
      <section>
        <p className="mb-2 text-xs font-medium text-muted-foreground">Network</p>
        <ChainSelect chains={[...chains]} value={chainId} onSelect={setChainId} size="sm" />
      </section>
      <ToggleRow
        label="Sound"
        on={sound}
        onChange={(v) => {
          saveSoundOn(v);
          setSound(v);
          if (v) playSfx("click");
        }}
      />
      <ToggleRow
        label="Animations"
        on={anim}
        onChange={(v) => {
          saveAnimOn(v);
          setAnim(v);
        }}
      />
      <ToggleRow
        label="Browser push"
        on={pushState === "subscribed"}
        onChange={(v) => {
          if (v) void enablePush();
          else void disablePush();
        }}
      />
      {prefs
        ? (
            [
              ["wins", "Big wins"] as const,
              ["promos", "Promotions"] as const,
              ["race", "Weekly race"] as const,
              ["system", "Wallet & house"] as const,
            ]
          ).map(([key, label]) => (
            <ToggleRow
              key={key}
              label={label}
              on={prefs[key]}
              onChange={(v) => {
                const next = { ...prefs, [key]: v };
                setPrefs(next);
                void saveNotificationPrefs({ data: next });
              }}
            />
          ))
        : null}
    </div>
  );
}

function ToggleRow({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm">
      {label}
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => onChange(!on)}
        className={cn("h-6 w-10 rounded-full transition-colors", on ? "bg-lime" : "bg-muted")}
      >
        <span className={cn("block size-5 rounded-full bg-black transition-transform", on ? "translate-x-4" : "translate-x-0.5")} />
      </button>
    </label>
  );
}

function TxPane() {
  const { transactions } = useWallet();
  const [mode] = useValueMode();
  const bets = useBetHistory();
  const viewer = useRoundViewerOptional();
  return (
    <div className="grid gap-4">
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">Rounds</p>
        <ul className="grid gap-1.5">
          {bets.length === 0 ? (
            <li className="text-sm text-muted-foreground">No rounds yet.</li>
          ) : (
            bets.slice(0, 16).map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => viewer?.open(r)}
                  className="flex w-full items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-left text-sm"
                >
                  <span>
                    <span className={r.win ? "text-lime" : "text-muted-foreground"}>{r.win ? "W" : "L"}</span>
                    {" "}
                    {r.title}
                    <span className="ml-1 text-xs text-muted-foreground">{r.label}</span>
                  </span>
                  <span className="tabular-nums">{r.multiplier ? `${r.multiplier.toFixed(2)}×` : "0×"}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
      <ul className="grid gap-2">
        {transactions.length === 0 ? (
          <li className="text-sm text-muted-foreground">No ledger yet.</li>
        ) : (
          transactions.slice(0, 20).map((t) => (
            <li key={t.id} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm">
              <span className="capitalize text-muted-foreground">{t.type}</span>
              <span className="tabular-nums">
                {t.type === "bet" || t.type === "withdrawal" ? "−" : "+"}
                {display(t.amount, t.currency, mode)}
              </span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

function VaultPane() {
  const { currency, balances } = useWallet();
  const [mode] = useValueMode();
  const [locked, setLocked] = useState(0);
  const [amount, setAmount] = useState(0);
  return (
    <div className="grid gap-3">
      <p className="text-sm text-muted-foreground">Park play-money so it is harder to stake on tilt.</p>
      <p className="font-heading text-xl font-bold tabular-nums">{display(locked, currency, mode)} locked</p>
      <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="h-11 tabular-nums" />
      <Button
        className="h-11"
        onClick={() => {
          const n = Math.min(balances[currency], Math.max(0, amount));
          setLocked((v) => v + n);
          toast.success(`Locked ${display(n, currency, mode)}`);
        }}
      >
        Lock
      </Button>
    </div>
  );
}

export function WalletChip() {
  const { currency, balances } = useWallet();
  const [mode] = useValueMode();
  const { openTab } = useWalletHub();
  return (
    <Button
      variant="outline"
      className="h-9 min-w-0 gap-1.5 rounded-lg px-2 md:h-10 md:px-3"
      onClick={() => openTab("wallet")}
    >
      <CryptoMark currency={currency} className="size-5" />
      <span className="max-w-24 truncate text-xs tabular-nums md:max-w-none md:text-sm">
        {display(balances[currency], currency, mode)}
      </span>
    </Button>
  );
}
