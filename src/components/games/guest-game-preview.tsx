import { createContext, useContext, useState, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { RiFireFill, RiRecordCircleFill, RiSparkling2Fill } from "@remixicon/react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BluescreenTitle } from "@/components/brand/bluescreen-title";
import { TolsT } from "@/components/brand/tols-mark";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { GAME_LEGENDS } from "@/lib/game-legends";
import type { CatalogGame } from "@/lib/games-catalog";

type PreviewCtx = {
  open: (game: CatalogGame) => void;
  isGuest: boolean;
};

const Ctx = createContext<PreviewCtx | null>(null);

export function useGamePreview(): PreviewCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useGamePreview must be used within GamePreviewProvider");
  return ctx;
}

export function useGamePreviewOptional(): PreviewCtx | null {
  return useContext(Ctx);
}

export function isGuestPlayer(user: unknown, isPending: boolean): boolean {
  return authEnabled && !isPending && !user;
}

export function GamePreviewProvider({ children }: { children: ReactNode }) {
  const { user, isPending } = useCurrentUserState();
  const [game, setGame] = useState<CatalogGame | null>(null);
  const isGuest = isGuestPlayer(user, isPending);

  return (
    <Ctx.Provider value={{ open: setGame, isGuest }}>
      {children}
      <GuestGameDialog game={game} onOpenChange={(v) => { if (!v) setGame(null); }} />
    </Ctx.Provider>
  );
}

export function GuestGameDialog({
  game,
  onOpenChange,
}: {
  game: CatalogGame | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={Boolean(game)} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[90vh] w-[calc(100%-2rem)] flex-col overflow-hidden p-0 sm:max-w-3xl"
        showCloseButton
      >
        {game ? (
          <>
            <DialogHeader className="sr-only">
              <DialogTitle>{game.title}</DialogTitle>
              <DialogDescription>
                {game.provider}. Sign in or create an account to play.
              </DialogDescription>
            </DialogHeader>
            <GuestGamePanel game={game} />
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export function GuestGamePanel({ game }: { game: CatalogGame }) {
  const copy = GAME_LEGENDS[game.kind];
  return (
    <ScrollArea className="max-h-[90vh]">
      <div className="grid items-start gap-5 p-4 sm:grid-cols-[9.5rem_1fr] md:p-5">
        <GameInfoCard game={game} />
        <div className="min-w-0">
          <BluescreenTitle as="h2" className="text-xl font-bold md:text-2xl">
            {game.title}
          </BluescreenTitle>
          <p className="mt-1 text-sm text-muted-foreground">{game.provider}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {game.original ? (
              <span className="inline-flex items-center rounded-md bg-black/60 px-1 py-0.5">
                <TolsT className="size-4" />
                <span className="sr-only">TOLS Original</span>
              </span>
            ) : null}
            {game.live ? <Badge variant="destructive">LIVE</Badge> : null}
            <Badge variant="secondary">{game.rtp}% RTP</Badge>
            <Badge variant="outline">{(game.edge * 100).toFixed(2)}% edge</Badge>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{copy.summary}</p>
          <div className="mt-4">
            <p className="font-sub text-sm font-medium">How to play</p>
            <ul className="mt-1.5 list-disc space-y-1 pl-4 text-sm text-muted-foreground">
              {copy.how.slice(0, 4).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
          <div className="mt-4">
            <p className="font-sub text-sm font-medium">Payouts</p>
            <ul className="mt-1.5 grid gap-1 text-sm">
              {copy.payouts.slice(0, 5).map((p) => (
                <li key={p.label} className="flex justify-between gap-3">
                  <span className="text-muted-foreground">{p.label}</span>
                  <span className="tabular-nums text-lime">{p.value}</span>
                </li>
              ))}
            </ul>
          </div>
          <GuestAuthForm nextPath={`/games/${game.id}`} />
        </div>
      </div>
    </ScrollArea>
  );
}

function GameInfoCard({ game }: { game: CatalogGame }) {
  return (
    <article className="mx-auto w-36 overflow-hidden rounded-2xl bg-card ring-1 ring-border sm:mx-0 sm:w-full">
      <div className="relative">
        <AspectRatio ratio={9 / 16} className="overflow-hidden bg-muted">
          <img src={game.cover} alt="" className="size-full object-cover" />
        </AspectRatio>
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-primary/90 via-black/10 to-transparent" />
        <div className="absolute top-2 left-2 right-2 flex justify-between gap-1.5">
          {game.original ? (
            <span className="grid size-7 place-items-center rounded-md bg-black/55" title="TOLS Original">
              <TolsT className="size-5" />
            </span>
          ) : game.live ? (
            <Badge className="size-6 justify-center border-0 bg-destructive p-0 text-white">
              <RiRecordCircleFill className="size-3.5" />
            </Badge>
          ) : (
            <span />
          )}
          {game.hot ? (
            <Badge className="size-6 justify-center border-0 bg-black/80 p-0 text-orange-400">
              <RiFireFill className="size-3.5" />
            </Badge>
          ) : game.isNew ? (
            <Badge className="size-6 justify-center border-0 bg-black/80 p-0 text-lime">
              <RiSparkling2Fill className="size-3.5" />
            </Badge>
          ) : null}
        </div>
        <div className="absolute inset-x-0 bottom-0 p-3">
          <h3 className="font-bluescreens text-sm tracking-wide text-white uppercase">{game.title}</h3>
          <p className="text-[0.7rem] text-white/65">{game.provider}</p>
        </div>
        <span className="absolute inset-x-0 bottom-0 h-1 bg-lime" />
      </div>
    </article>
  );
}

function GuestAuthForm({ nextPath }: { nextPath: string }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onEmail(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "");
    const password = String(fd.get("password") ?? "");
    const name = String(fd.get("name") ?? "Player");
    setPending(true);
    try {
      if (mode === "up") {
        const { error: err } = await authClient.signUp.email({ email, password, name });
        if (err) throw new Error(err.message);
      } else {
        const { error: err } = await authClient.signIn.email({ email, password });
        if (err) throw new Error(err.message);
      }
      window.location.href = nextPath;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
      setPending(false);
    }
  }

  return (
    <div className="mt-5 rounded-2xl bg-muted/40 p-4 ring-1 ring-border">
      <p className="font-sub text-sm font-medium">Sign in to play</p>
      <p className="mt-0.5 text-xs text-muted-foreground">Create an account or log in to launch this table.</p>
      <Tabs value={mode} onValueChange={(v) => setMode(v as "in" | "up")} className="mt-3">
        <TabsList className="h-9 w-full">
          <TabsTrigger value="in" className="flex-1">
            Login
          </TabsTrigger>
          <TabsTrigger value="up" className="flex-1">
            Sign up
          </TabsTrigger>
        </TabsList>
        <TabsContent value={mode} className="mt-3">
          {authEnabled ? (
            <div className="grid gap-2">
              {GROK_PROVIDERS.map((p) => (
                <Button
                  key={p.providerId}
                  type="button"
                  variant="outline"
                  className="h-10 w-full"
                  disabled={pending}
                  onClick={() => void signIn(p.providerId, { callbackURL: nextPath })}
                >
                  Continue with {p.label}
                </Button>
              ))}
              <p className="py-1 text-center text-[0.65rem] text-muted-foreground">or email</p>
              <form className="grid gap-2" onSubmit={(e) => void onEmail(e)}>
                {mode === "up" ? (
                  <div className="grid gap-1">
                    <Label htmlFor="guest-name">Name</Label>
                    <Input id="guest-name" name="name" className="h-10" required />
                  </div>
                ) : null}
                <div className="grid gap-1">
                  <Label htmlFor="guest-email">Email</Label>
                  <Input id="guest-email" name="email" type="email" className="h-10" required />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="guest-password">Password</Label>
                  <Input id="guest-password" name="password" type="password" className="h-10" required minLength={8} />
                </div>
                {error ? <p className="text-sm text-destructive">{error}</p> : null}
                <Button type="submit" className="h-10" disabled={pending}>
                  {mode === "in" ? "Login" : "Create account"}
                </Button>
              </form>
            </div>
          ) : (
            <Button className="h-10 w-full" onClick={() => void navigate({ to: nextPath })}>
              Play
            </Button>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
