import { useEffect, useState, type ReactNode } from "react";
import { AgeDisclaimerCard } from "@/components/legal/age-disclaimer-card";

const KEY = "tols-18";

function readStatus(): "ok" | "ask" | "no" | "boot" {
  if (typeof window === "undefined") return "boot";
  try {
    const v = window.localStorage.getItem(KEY);
    if (v === "yes") return "ok";
    if (v === "no") return "no";
  } catch {
    /* private mode */
  }
  return "ask";
}

export function AgeGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<"ok" | "ask" | "no" | "boot">(readStatus);

  useEffect(() => {
    if (status !== "boot") return;
    setStatus(readStatus() === "boot" ? "ask" : readStatus());
  }, [status]);

  if (status === "ok" || status === "boot") return <>{children}</>;

  return (
    <>
      {children}
      <div className="fixed inset-0 z-[80] grid place-items-center bg-black/70 p-4">
        <AgeDisclaimerCard
          onAccept={() => {
            window.localStorage.setItem(KEY, "yes");
            setStatus("ok");
          }}
          onDecline={
            status === "ask"
              ? () => {
                  window.localStorage.setItem(KEY, "no");
                  setStatus("no");
                }
              : undefined
          }
        />
        {status === "no" ? (
          <p className="absolute bottom-8 max-w-sm text-center text-sm text-muted-foreground">
            TOLS is 18+ only. You declined the age check.
          </p>
        ) : null}
      </div>
    </>
  );
}
