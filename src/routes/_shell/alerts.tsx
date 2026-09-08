import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TolsBreadcrumb } from "@/components/layout/tols-breadcrumb";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useNotifications } from "@/lib/notifications/client";
import {
  getNotificationPrefs,
  saveNotificationPrefs,
  sendTestNotification,
  type NoticeKind,
  type NoticePrefs,
} from "@/lib/notifications/server";
import { useEffect, useState } from "react";
import { cn } from "cn";

export const Route = createFileRoute("/_shell/alerts")({
  component: AlertsPage,
  head: () => ({ meta: [{ title: "Notifications — TOLS" }] }),
});

const KIND_LABEL: Record<NoticeKind, string> = {
  win: "Win",
  promo: "Promo",
  race: "Race",
  cashier: "Wallet",
  system: "House",
};

function AlertsPage() {
  const { user, isPending } = useCurrentUserState();
  const { notices, unread, pushState, enablePush, disablePush, markRead, refresh } = useNotifications();
  const [prefs, setPrefs] = useState<NoticePrefs | null>(null);

  useEffect(() => {
    if (!user) return;
    void getNotificationPrefs().then(setPrefs).catch(() => undefined);
  }, [user]);

  async function togglePref(key: keyof NoticePrefs) {
    if (!prefs) return;
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    await saveNotificationPrefs({ data: next });
  }

  async function test() {
    await sendTestNotification();
    await refresh();
    toast.success("Test sent");
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-6">
      <TolsBreadcrumb items={[{ label: "Lobby", to: "/" }, { label: "Notifications" }]} />
      <header>
        <h1 className="font-heading text-3xl font-bold tracking-tight">Notifications</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Inbox plus browser push for wins, races, and house messages.
        </p>
      </header>

      {isPending ? <div className="h-40 animate-pulse rounded-2xl bg-muted" /> : null}

      {!isPending && !user ? (
        <div className="rounded-2xl bg-card p-6 text-center shadow-[var(--shadow-border)]">
          <p className="text-sm text-muted-foreground">Sign in to receive push and keep an inbox.</p>
          <Button asChild className="mt-4">
            <Link to="/login">Sign in</Link>
          </Button>
        </div>
      ) : null}

      {user ? (
        <>
          <section className="rounded-2xl bg-card p-4 shadow-[var(--shadow-border)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">Browser push</p>
                <p className="text-xs text-muted-foreground">
                  {pushState === "subscribed"
                    ? "This device is subscribed."
                    : pushState === "denied"
                      ? "Blocked in the browser. Allow TOLS in site settings."
                      : pushState === "unsupported"
                        ? "This browser cannot take Web Push."
                        : "Enable to get banners when you are off the table."}
                </p>
              </div>
              {pushState === "subscribed" ? (
                <Button variant="outline" size="sm" onClick={() => void disablePush()}>
                  Disable
                </Button>
              ) : (
                <Button size="sm" onClick={() => void enablePush()} disabled={pushState === "unsupported" || pushState === "denied"}>
                  Enable
                </Button>
              )}
            </div>
            <Button variant="ghost" size="sm" className="mt-3" onClick={() => void test()}>
              Send test
            </Button>
          </section>

          {prefs ? (
            <section className="rounded-2xl bg-card p-4 shadow-[var(--shadow-border)]">
              <p className="mb-3 font-medium">What to push</p>
              <ul className="grid gap-3">
                {(
                  [
                    ["wins", "Big wins"],
                    ["promos", "Promotions"],
                    ["race", "Weekly race"],
                    ["system", "Wallet & house"],
                  ] as const
                ).map(([key, label]) => (
                  <li key={key} className="flex items-center justify-between text-sm">
                    {label}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={prefs[key]}
                      onClick={() => void togglePref(key)}
                      className={cn("h-6 w-10 rounded-full transition-colors", prefs[key] ? "bg-lime" : "bg-muted")}
                    >
                      <span
                        className={cn(
                          "block size-5 rounded-full bg-black transition-transform",
                          prefs[key] ? "translate-x-4" : "translate-x-0.5",
                        )}
                      />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section>
            <div className="mb-3 flex items-center justify-between">
              <p className="font-medium">{unread ? `${unread} unread` : "Inbox"}</p>
              {unread ? (
                <button type="button" className="text-xs text-primary" onClick={() => void markRead()}>
                  Mark all read
                </button>
              ) : null}
            </div>
            <ul className="grid gap-2">
              {notices.length === 0 ? (
                <li className="rounded-2xl bg-card p-4 text-sm text-muted-foreground shadow-[var(--shadow-border)]">
                  No messages yet.
                </li>
              ) : (
                notices.map((n) => (
                  <li key={n.id}>
                    <a
                      href={n.href ?? "/alerts"}
                      className={cn(
                        "block rounded-2xl bg-card p-4 shadow-[var(--shadow-border)]",
                        !n.read && "ring-1 ring-lime/40",
                      )}
                    >
                      <p className="text-[0.65rem] font-semibold tracking-wider text-lime uppercase">
                        {KIND_LABEL[n.kind]}
                      </p>
                      <p className="mt-1 text-sm font-medium">{n.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
                    </a>
                  </li>
                ))
              )}
            </ul>
          </section>
        </>
      ) : null}
    </main>
  );
}
