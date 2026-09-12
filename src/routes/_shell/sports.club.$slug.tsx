import { Link, createFileRoute } from "@tanstack/react-router";
import { BluescreenTitle } from "@/components/brand/bluescreen-title";
import { TolsBreadcrumb } from "@/components/layout/tols-breadcrumb";
import { TeamCrest } from "@/components/sports/team-crest";
import { EventCard } from "@/components/sports/event-card";
import { PlayGate } from "@/components/games/play-gate";
import { entityBySlug, entityKind, type SlipPick } from "@/lib/sports-book";
import { matchDossier } from "@/lib/match-dossier";
import { clubCrest } from "@/lib/club-crests";
import { useState } from "react";

export const Route = createFileRoute("/_shell/sports/club/$slug")({
  component: ClubPage,
});

function ClubPage() {
  const { slug } = Route.useParams();
  const ent = entityBySlug(slug);
  if (!ent || entityKind(ent.sport) === "player") {
    return (
      <main className="mx-auto max-w-xl py-16 text-center">
        <p className="text-muted-foreground">Club not on the board.</p>
        <Link to="/sports" className="mt-3 inline-block text-sm text-lime">
          Back
        </Link>
      </main>
    );
  }
  return (
    <PlayGate>
      <ClubBody name={ent.name} events={ent.events} />
    </PlayGate>
  );
}

function ClubBody({ name, events }: { name: string; events: import("@/lib/sports-book").SportEvent[] }) {
  const [picks] = useState<Set<string>>(new Set());
  const next = events[0]!;
  const d = matchDossier(next);
  const home = next.home === name;
  const form = home ? d.form.home : d.form.away;
  const xi = home ? d.xi.home : d.xi.away;
  const art = clubCrest(name);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <TolsBreadcrumb items={[{ label: "Sports", to: "/sports" }, { label: name }]} />
      <header className="sb-card flex items-center gap-4 px-4 py-5">
        {art ? <img src={art} alt="" className="size-20 object-contain" /> : <TeamCrest name={name} abbr={name.slice(0, 3).toUpperCase()} className="size-20" />}
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
        <h2 className="font-sub text-[0.65rem] tracking-[0.14em] text-muted-foreground uppercase">Fixtures & live odds</h2>
        {events.map((ev) => (
          <EventCard key={ev.id} event={ev} selected={picks} format="decimal" onToggle={() => undefined} />
        ))}
      </section>
      <section className="sb-card px-3 py-3">
        <h2 className="font-sub mb-2 text-[0.65rem] tracking-[0.14em] text-muted-foreground uppercase">Squad</h2>
        <ul className="grid gap-1 text-sm">
          {xi.map((p) => (
            <li key={p.name} className="flex gap-2">
              <span className="w-6 tabular-nums text-lime">{p.num}</span>
              <span className="flex-1 truncate">{p.name}</span>
              <span className="text-[0.65rem] text-muted-foreground">{p.pos}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
