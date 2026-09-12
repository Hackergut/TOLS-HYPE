import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TolsBreadcrumb } from "@/components/layout/tols-breadcrumb";
import { operator } from "@/lib/operator/config";

export const Route = createFileRoute("/_shell/connect")({ component: ConnectPage });

const SOCIAL = [
  { label: "Telegram", href: "https://t.me/tolsfun" },
  { label: "X", href: "https://x.com/tolsfun" },
  { label: "Instagram", href: "https://instagram.com/tolsfun" },
];

function ConnectPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <TolsBreadcrumb items={[{ label: "Lobby", to: "/" }, { label: "Connect" }]} />
      <header>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Connect</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Support, community, and your {operator.name} account. 18+ only.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 text-sm">
          <Link to="/profile" className="rounded-lg bg-lime px-4 py-2 font-semibold text-black">
            Sign in
          </Link>
          <Link to="/profile" className="rounded-lg bg-muted px-4 py-2 font-medium">
            Wallet
          </Link>
          <Link to="/help" className="rounded-lg bg-muted px-4 py-2 font-medium">
            Help Center
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Community</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 text-sm">
          {SOCIAL.map((s) => (
            <a
              key={s.label}
              href={s.href}
              rel="noreferrer"
              target="_blank"
              className="text-lime hover:underline"
            >
              {s.label}
            </a>
          ))}
        </CardContent>
      </Card>
    </main>
  );
}
