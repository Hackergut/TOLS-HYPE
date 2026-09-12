import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { CURRENCIES, emptyBalances, type Currency } from "./games-catalog";
import { cashier, getWallet, type WalletSnapshot } from "./casino-api";

type WalletContextValue = {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  balances: Record<Currency, number>;
  wagered: number;
  transactions: WalletSnapshot["transactions"];
  loading: boolean;
  refresh: () => Promise<void>;
  applyBalances: (balances: Record<Currency, number>) => void;
  deposit: (amount: number) => Promise<void>;
  withdraw: (amount: number) => Promise<void>;
};

const WalletContext = createContext<WalletContextValue | null>(null);

const EMPTY: Record<Currency, number> = emptyBalances();

export function WalletProvider({ children }: { children: ReactNode }) {
  const { user, isPending } = useCurrentUserState();
  const [currency, setCurrency] = useState<Currency>("SOL");
  const [snapshot, setSnapshot] = useState<WalletSnapshot | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setSnapshot(null);
      return;
    }
    setLoading(true);
    try {
      const next = await getWallet();
      setSnapshot(next);
    } catch {
      /* signed out or network */
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isPending) return;
    void refresh();
  }, [isPending, refresh]);

  const applyBalances = useCallback((balances: Record<Currency, number>) => {
    setSnapshot((prev) =>
      prev
        ? { ...prev, balances }
        : { balances, wagered: 0, transactions: [] },
    );
  }, []);

  const runCashier = useCallback(
    async (action: "deposit" | "withdraw", amount: number) => {
      const result = await cashier({ data: { action, currency, amount } });
      applyBalances(result.balances);
      toast.success(action === "deposit" ? "Deposit credited" : "Withdrawal sent");
      void refresh();
    },
    [applyBalances, currency, refresh],
  );

  const value = useMemo<WalletContextValue>(
    () => ({
      currency,
      setCurrency,
      balances: snapshot?.balances ?? EMPTY,
      wagered: snapshot?.wagered ?? 0,
      transactions: snapshot?.transactions ?? [],
      loading: loading || isPending,
      refresh,
      applyBalances,
      deposit: (amount) => runCashier("deposit", amount),
      withdraw: (amount) => runCashier("withdraw", amount),
    }),
    [applyBalances, currency, isPending, loading, refresh, runCashier, snapshot],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}

export { CURRENCIES };
