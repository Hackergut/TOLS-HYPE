import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RiExternalLinkLine, RiRadarLine } from "@remixicon/react";
import { BluescreenTitle } from "@/components/brand/bluescreen-title";
import { TolsBreadcrumb } from "@/components/layout/tols-breadcrumb";
import { Button } from "@/components/ui/button";
import { operator } from "@/lib/operator/config";

const TOWER = operator.governanceUrl || "https://gov.tols.fun";

export const Route = createFileRoute("/_shell/governance")({
  component: GovernanceHandoff,
  head: () => ({ meta: [{ title: "Governance — TOLS" }] }),
});

/** Operator desk lives on Tower. Casino only syncs money / presence / commands. */
function GovernanceHandoff() {
  useEffect(() => {
    window.location.replace(TOWER);
  }, []);

  return (
    <main className="mx-auto w-full max-w-lg">
      <TolsBreadcrumb items={[{ label: "Lobby", to: "/" }, { label: "Governance" }]} />
      <div className="mt-8 rounded-2xl border border-white/10 bg-card/50 p-8 text-center">
        <RiRadarLine className="mx-auto size-8 text-primary" aria-hidden />
        <BluescreenTitle className="mt-4 text-2xl text-foreground">TOWER</BluescreenTitle>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Live governance runs on its own platform. Wallets, bets, welcome bonus
          and player sessions stay synced from this casino — operator controls
          live on Tower.
        </p>
        <Button
          asChild
          className="mt-6 bg-primary text-white hover:bg-primary/90"
        >
          <a href={TOWER} rel="noreferrer">
            Open gov.tols.fun
            <RiExternalLinkLine />
          </a>
        </Button>
      </div>
    </main>
  );
}
