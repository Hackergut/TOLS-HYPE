import { Link, createFileRoute } from "@tanstack/react-router";
import { BluescreenTitle } from "@/components/brand/bluescreen-title";
import { TolsBreadcrumb } from "@/components/layout/tols-breadcrumb";
import { TeamCrest } from "@/components/sports/team-crest";
import { EventCard } from "@/components/sports/event-card";
import { PlayGate } from "@/components/games/play-gate";
import { entityBySlug, entityKind } from "@/lib/sports-book";
import { clubCrest } from "@/lib/club-crests";
import { matchDossier } from "@/lib/match-dossier";
import { useState } from "react";

export const Route = createFileRoute("/_shell/sports/player/$slug")({
  component: PlayerPage,
});

function PlayerPage() {
  const { slug } = Route.useParams();
  const ent = entityBySlug(slug);
  if (!ent || entityKind(ent.sport) !== "player") {
    return (
      <main className="mx-auto max-w-xl py-16 text-center">
        <p className="text-muted-foreground">Player not on the board.</p>
        <Link to="/sports" className="mt-3 inline-block text-sm text-lime">
          Back
        </Link>
      </main>
    );
  }
  return (
    <PlayGate>
      <PlayerBody name={ent.name} events={ent.events} />
    </PlayGate>
  );
}

function PlayerBody({ name, events }: { name: string; events: import("@/lib/sports-book").SportEvent[] }) {
  const [picks] = useState<Set<string>>(new Set());
  const next = events[0]!;
  const d = matchDossier(next);
  const home = next.home === name;
  const form = home ? d.form.home : d.form.away;
  const shot = clubCrest(name);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <TolsBreadcrumb items={[{ label: "Sports", to: "/sports" }, { label: name }]} />
      <header className="sb-card flex items-center gap-4 px-4 py-5">
        {shot ? (
          <img src={shot} alt="" className="size-24 rounded-full object-cover ring-1 ring-border" />
        ) : (
          <TeamCrest name={name} abbr={name.slice(0, 3).toUpperCase()} className="size-24" />
        )}
        <div>
          <BluescreenTitle as="h1" className="text-2xl font-bold md:text-3xl">
            {name}
          </BluescreenTitle>
          <p className="font-sub mt-1 text-xs tracking-wide text-muted-foreground uppercase">{next.league}</p>
          <p className="mt-2 flex gap-1">
            {form.map((c, i) => (
              <span
                key={i}
                className={`grid size-6 place-items-center rounded text-[0.65rem] font-bold ${c === "W" ? "bg-lime text-black" : c === "L" ? "bg-destructive/80" : "bg-muted"}`}
              >
                {c}
              </span>
            ))}
          </p>
        </div>
      </header>
      <section className="grid gap-2">
        <h2 className="font-sub text-[0.65rem] tracking-[0.14em] text-muted-foreground uppercase">Matches & odds</h2>
        {events.map((ev) => (
          <EventCard key={ev.id} event={ev} selected={picks} format="decimal" onToggle={() => undefined} />
        ))}
      </section>
    </main>
  );
}
