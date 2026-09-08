import { useState } from "react";
import { toast } from "sonner";
import { ChevronDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AssetInput } from "@/components/ui/asset-input";
import { ChainSelect } from "@/components/ui/chain-select";
import { CURRENCIES, CURRENCY_META, type Currency } from "@/lib/games-catalog";
import {
  formatMoney,
  mockAddressFromUserId,
  shortAddress,
  explorerAddressUrl,
} from "@/lib/format";
import { getNetworkMeta } from "@/lib/onchain/config";
import { useTolsChain } from "@/lib/onchain/use-chain";
import { useWallet } from "@/lib/wallet-context";
import { useCurrentUser } from "@/lib/auth/use-current-user";

function decimalsFor(currency: Currency) {
  if (currency === "USDT") return 6;
  if (currency === "ETH") return 6;
  return 8;
}

export function CashierDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const user = useCurrentUser();
  const { currency, setCurrency, balances, deposit, withdraw } = useWallet();
  const { chainId, setChainId, chains } = useTolsChain();
  const [amount, setAmount] = useState(() => String(CURRENCY_META[currency].minBet * 10));
  const address = user ? mockAddressFromUserId(user.id) : "0x—";
  const parsed = Number(amount);
  const evm = currency !== "BTC";

  async function run(action: "deposit" | "withdraw") {
    try {
      if (!Number.isFinite(parsed) || parsed <= 0) {
        toast.error("Enter an amount");
        return;
      }
      if (action === "deposit") {
        const { loadResponsible, isSelfExcluded } = await import("@/lib/responsible");
        const s = loadResponsible();
        if (isSelfExcluded(s)) {
          toast.error("Self-exclusion is active");
          return;
        }
        if (s.depositLimit != null && parsed > s.depositLimit) {
          toast.error(`Deposit limit is ${s.depositLimit} USDT / day`);
          return;
        }
        await deposit(parsed);
      } else await withdraw(parsed);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cashier failed");
    }
  }

  const href = evm ? explorerAddressUrl(address, chainId) : null;
  const net = evm ? getNetworkMeta(chainId).name : "Bitcoin";
  const error =
    amount !== "" && (!Number.isFinite(parsed) || parsed <= 0) ? "Enter a valid amount" : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cashier</DialogTitle>
          <DialogDescription>
            Play-money only. Deposits credit instantly to this account.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-between gap-2">
          {evm ? (
            <ChainSelect
              chains={[...chains]}
              value={chainId}
              onSelect={setChainId}
              size="sm"
            />
          ) : (
            <span className="rounded-lg border border-border px-2 py-1 text-xs">Bitcoin</span>
          )}
          {href ? (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-xs text-muted-foreground hover:text-foreground"
            >
              {shortAddress(address)}
              {net ? ` · ${net}` : null}
            </a>
          ) : (
            <span className="font-mono text-xs text-muted-foreground">
              {shortAddress(address)} · {net}
            </span>
          )}
        </div>
        <Tabs defaultValue="deposit">
          <TabsList className="w-full">
            <TabsTrigger value="deposit" className="flex-1">
              Deposit
            </TabsTrigger>
            <TabsTrigger value="withdraw" className="flex-1">
              Withdraw
            </TabsTrigger>
          </TabsList>
          <TabsContent value="deposit" className="mt-4 space-y-4">
            <AssetInput
              label="Deposit"
              value={amount}
              onValueChange={setAmount}
              decimals={decimalsFor(currency)}
              inputClassName="min-w-0 text-2xl md:text-2xl"
              asset={<TokenPicker currency={currency} onSelect={setCurrency} />}
              description={net ? `On ${net}` : undefined}
              error={error}
              footer={
                <>
                  <span>
                    Balance {formatMoney(balances[currency], currency)} {currency}
                  </span>
                  <button
                    type="button"
                    className="ml-auto font-medium text-primary hover:underline"
                    onClick={() => setAmount(String(balances[currency] || 0))}
                  >
                    Max
                  </button>
                </>
              }
            />
            <Button className="h-11 w-full" onClick={() => void run("deposit")}>
              Credit {currency}
            </Button>
          </TabsContent>
          <TabsContent value="withdraw" className="mt-4 space-y-4">
            <AssetInput
              label="Withdraw"
              value={amount}
              onValueChange={setAmount}
              decimals={decimalsFor(currency)}
              inputClassName="min-w-0 text-2xl md:text-2xl"
              asset={<TokenPicker currency={currency} onSelect={setCurrency} />}
              error={error}
              footer={
                <>
                  <span>
                    Available {formatMoney(balances[currency], currency)} {currency}
                  </span>
                  <button
                    type="button"
                    className="ml-auto font-medium text-primary hover:underline"
                    onClick={() => setAmount(String(balances[currency] || 0))}
                  >
                    Max
                  </button>
                </>
              }
            />
            <Button className="h-11 w-full" variant="outline" onClick={() => void run("withdraw")}>
              Send {currency}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function TokenPicker({
  currency,
  onSelect,
}: {
  currency: Currency;
  onSelect: (c: Currency) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2 py-1 text-sm font-medium">
        <span className="flex size-6 items-center justify-center rounded-full bg-muted text-[0.65rem]">
          {CURRENCY_META[currency].symbol}
        </span>
        {currency}
        <ChevronDownIcon className="size-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-40">
        {CURRENCIES.map((c) => (
          <DropdownMenuItem key={c} onClick={() => onSelect(c)} className="justify-between gap-4">
            <span>{c}</span>
            <span className="text-muted-foreground">{CURRENCY_META[c].label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
