import { useState } from "react";
import { RiFileCopyLine, RiInformationLine } from "@remixicon/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CryptoMark } from "@/components/wallet/crypto-mark";
import { CURRENCIES, CURRENCY_META, type Currency } from "@/lib/games-catalog";
import { mockAddressFromUserId } from "@/lib/format";
import { TOLS_CHAINS } from "@/lib/onchain/chains";
import { useTolsChain } from "@/lib/onchain/use-chain";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { useWallet } from "@/lib/wallet-context";
import { cn } from "cn";

type CashierTab = "deposit" | "withdraw" | "buy" | "tip";

const TABS: { id: CashierTab; label: string }[] = [
  { id: "deposit", label: "Deposit" },
  { id: "withdraw", label: "Withdraw" },
  { id: "buy", label: "Buy Crypto" },
  { id: "tip", label: "Tip" },
];

function networkLabel(currency: Currency, chainId: number) {
  if (currency === "BTC") return "Bitcoin";
  const chain = TOLS_CHAINS.find((c) => c.id === chainId);
  return chain?.id === 1 ? "ERC20" : chain?.name ?? "ERC20";
}

function currencyTitle(c: Currency) {
  if (c === "USDT") return "Tether (USDT)";
  if (c === "ETH") return "Ether (ETH)";
  return "Bitcoin (BTC)";
}

export function WalletCashier({ onHistory }: { onHistory: () => void }) {
  const user = useCurrentUser();
  const { currency, setCurrency, balances, deposit, withdraw } = useWallet();
  const { chainId, setChainId, chains } = useTolsChain();
  const [tab, setTab] = useState<CashierTab>("deposit");
  const [curOpen, setCurOpen] = useState(false);
  const [netOpen, setNetOpen] = useState(false);
  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [tipTo, setTipTo] = useState("");

  const address = user ? mockAddressFromUserId(user.id) : "0x—";
  const net = networkLabel(currency, chainId);
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&bgcolor=0f1116&color=ffffff&data=${encodeURIComponent(address)}`;

  async function copyAddr() {
    try {
      await navigator.clipboard.writeText(address);
      toast.success("Address copied");
    } catch {
      toast.error("Could not copy");
    }
  }

  async function runWithdraw() {
    const n = Number(amount);
    if (!toAddress.trim()) {
      toast.error("Enter a destination address");
      return;
    }
    if (!Number.isFinite(n) || n <= 0) {
      toast.error("Enter an amount");
      return;
    }
    try {
      await withdraw(n);
      toast.success("Withdrawal requested");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Withdraw failed");
    }
  }

  async function runDepositCredit() {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return;
    try {
      await deposit(n);
      toast.success("Play-money credited");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Deposit failed");
    }
  }

  const field =
    "flex h-10 w-full items-center rounded-lg border border-white/10 bg-[#12141a] px-2.5 text-xs text-white md:h-12 md:rounded-xl md:px-3 md:text-sm";

  return (
    <div className="grid gap-3 md:gap-5">
      <div className="relative flex items-end gap-0 border-b border-white/10">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "relative h-8 flex-1 px-0.5 text-[0.65rem] font-semibold md:h-10 md:text-[0.82rem]",
              tab === t.id ? "text-[#c4b5fd]" : "text-white/45",
            )}
          >
            <span className="md:hidden">{t.id === "buy" ? "Buy" : t.label}</span>
            <span className="hidden md:inline">{t.label}</span>
            {tab === t.id ? <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[#904bf9]" /> : null}
          </button>
        ))}
      </div>

      <label className="grid gap-1.5">
        <span className="text-[0.7rem] font-medium text-white/55 md:text-[0.78rem]">Currency</span>
        <div className="relative">
          <button type="button" className={cn(field, "justify-between gap-3")} onClick={() => setCurOpen((v) => !v)}>
            <span className="flex min-w-0 items-center gap-2.5">
              <CryptoMark currency={currency} className="size-5 md:size-6" />
              <span className="truncate font-medium">{currencyTitle(currency)}</span>
            </span>
            <span className="flex shrink-0 items-center gap-2 tabular-nums text-white/50">
              {balances[currency].toFixed(currency === "USDT" ? 2 : 8)}
              <span className="text-white/35">▾</span>
            </span>
          </button>
          {curOpen ? (
            <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-white/10 bg-[#12141a] py-1 shadow-xl">
              {CURRENCIES.map((c) => (
                <li key={c}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-white/5"
                    onClick={() => {
                      setCurrency(c);
                      setCurOpen(false);
                    }}
                  >
                    <CryptoMark currency={c} className="size-5" />
                    <span className="flex-1">{currencyTitle(c)}</span>
                    <span className="tabular-nums text-white/45">{balances[c]}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </label>

      {tab === "deposit" || tab === "withdraw" ? (
        <label className="grid gap-1.5">
          <span className="text-[0.7rem] font-medium text-white/55 md:text-[0.78rem]">Network*</span>
          <div className="relative">
            <button type="button" className={cn(field, "justify-between")} onClick={() => setNetOpen((v) => !v)}>
              {net}
              <span className="text-white/35">▾</span>
            </button>
            {netOpen && currency !== "BTC" ? (
              <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-white/10 bg-[#12141a] py-1 shadow-xl">
                {chains.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      className="w-full px-3 py-2.5 text-left text-sm hover:bg-white/5"
                      onClick={() => {
                        setChainId(c.id);
                        setNetOpen(false);
                      }}
                    >
                      {c.id === 1 ? "ERC20" : c.name}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </label>
      ) : null}

      {tab === "deposit" ? (
        <>
          <label className="grid gap-1.5">
            <span className="text-[0.7rem] font-medium text-white/55 md:text-[0.78rem]">
              {CURRENCY_META[currency].label} ({net}) Address
            </span>
            <div className={cn(field, "justify-between gap-2 font-mono text-[0.65rem] md:text-[0.72rem]")}>
              <span className="min-w-0 truncate">{address}</span>
              <button type="button" aria-label="Copy address" onClick={() => void copyAddr()} className="shrink-0 text-white/50 hover:text-white">
                <RiFileCopyLine className="size-4" />
              </button>
            </div>
          </label>
          <p className="flex items-start gap-1.5 text-[0.65rem] leading-snug text-[#ff6b3d] md:text-[0.75rem]">
            <RiInformationLine className="mt-0.5 size-3.5 shrink-0 md:size-4" />
            Your deposit must be sent on the {currency === "BTC" ? "Bitcoin" : `${net}`} network to be processed.
          </p>
          <div className="grid place-items-center py-0 md:py-2">
            <img src={qr} alt="Deposit QR" width={128} height={128} className="size-32 rounded-md bg-white p-1.5 md:size-[200px] md:rounded-lg md:p-2" />
          </div>
          <button type="button" onClick={onHistory} className="text-center text-xs font-medium text-white underline md:text-sm">
            Deposit history
          </button>
          <p className="hidden text-center text-[0.7rem] text-white/35 md:block">Play-money preview. Live chain credit needs the HYPE pooler.</p>
        </>
      ) : null}

      {tab === "withdraw" ? (
        <>
          <label className="grid gap-1.5">
            <span className="text-[0.78rem] font-medium text-white/55">Destination address</span>
            <input value={toAddress} onChange={(e) => setToAddress(e.target.value)} className={field} placeholder="0x…" />
          </label>
          <label className="grid gap-1.5">
            <span className="text-[0.78rem] font-medium text-white/55">Amount</span>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" className={cn(field, "tabular-nums")} />
          </label>
          <Button className="h-10 w-full rounded-lg bg-[#904bf9] text-sm font-bold text-white hover:bg-[#7c3aed] md:h-12 md:rounded-xl" onClick={() => void runWithdraw()}>
            Withdraw
          </Button>
        </>
      ) : null}

      {tab === "buy" ? (
        <div className="grid gap-3">
          <p className="text-sm text-white/55">Buy crypto with card. MoonPay keys go on the Vercel project.</p>
          <label className="grid gap-1.5">
            <span className="text-[0.78rem] font-medium text-white/55">Amount (USD)</span>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" className={cn(field, "tabular-nums")} />
          </label>
          <Button className="h-10 w-full rounded-lg bg-[#904bf9] text-sm font-bold text-white md:h-12 md:rounded-xl" disabled>
            Buy {currency}
          </Button>
        </div>
      ) : null}

      {tab === "tip" ? (
        <div className="grid gap-3">
          <label className="grid gap-1.5">
            <span className="text-[0.78rem] font-medium text-white/55">Player</span>
            <input value={tipTo} onChange={(e) => setTipTo(e.target.value)} className={field} placeholder="username" />
          </label>
          <label className="grid gap-1.5">
            <span className="text-[0.78rem] font-medium text-white/55">Amount</span>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" className={cn(field, "tabular-nums")} />
          </label>
          <Button
            className="h-10 w-full rounded-lg bg-[#904bf9] text-sm font-bold text-white md:h-12 md:rounded-xl"
            onClick={() => {
              const n = Number(amount);
              if (!tipTo.trim() || !Number.isFinite(n) || n <= 0) {
                toast.error("Enter player and amount");
                return;
              }
              void withdraw(n)
                .then(() => toast.success(`Tipped ${n} ${currency}`))
                .catch((err) => toast.error(err instanceof Error ? err.message : "Tip failed"));
            }}
          >
            Send tip
          </Button>
        </div>
      ) : null}

      {tab === "deposit" && amount ? (
        <button type="button" className="text-center text-xs text-white/30" onClick={() => void runDepositCredit()}>
          Credit play-money {amount} {currency}
        </button>
      ) : null}
    </div>
  );
}

export { networkLabel };
