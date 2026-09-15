import { useState } from "react";
import { BetSlip, type SlipMode } from "@/components/sports/bet-slip";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { OddsFormat } from "@/lib/odds";
import type { SlipPick } from "@/lib/sports-book";
import type { Currency } from "@/lib/games-catalog";

type Props = {
  picks: SlipPick[];
  amount: number;
  currency: Currency;
  busy: boolean;
  mode: SlipMode;
  systemK: number;
  format: OddsFormat;
  onMode: (m: SlipMode) => void;
  onSystemK: (k: number) => void;
  onAmount: (n: number) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onPlace: () => void;
};

export function SlipDock(props: Props) {
  const [open, setOpen] = useState(false);
  const n = props.picks.length;

  return (
    <>
      <div className="hidden lg:block">
        <BetSlip {...props} />
      </div>
      {n ? (
        <div
          className="fixed inset-x-0 z-30 px-3 lg:hidden"
          style={{ bottom: "calc(3.75rem + env(safe-area-inset-bottom))" }}
        >
          <button
            type="button"
            className="flex h-12 w-full items-center justify-between rounded-xl bg-lime px-4 text-sm font-bold text-black"
            onClick={() => setOpen(true)}
          >
            <span>
              {n} pick{n === 1 ? "" : "s"}
            </span>
            <span>Bet slip</span>
          </button>
        </div>
      ) : null}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-h-[80dvh] rounded-t-2xl bg-card p-0 pb-[env(safe-area-inset-bottom)]">
          <SheetHeader className="sr-only">
            <SheetTitle>Bet slip</SheetTitle>
            <SheetDescription>Stake and place</SheetDescription>
          </SheetHeader>
          <div className="overflow-y-auto p-3">
            <BetSlip {...props} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
