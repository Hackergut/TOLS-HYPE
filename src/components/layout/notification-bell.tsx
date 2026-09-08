import { Link } from "@tanstack/react-router";
import { RiNotification3Line } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications } from "@/lib/notifications/client";
import { cn } from "cn";

const KIND_COLOR: Record<string, string> = {
  win: "text-lime",
  promo: "text-primary",
  race: "text-chart-1",
  cashier: "text-foreground",
  system: "text-muted-foreground",
};

export function NotificationBell() {
  const { notices, unread, markRead } = useNotifications();
  const latest = notices.slice(0, 6);

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open && unread) void markRead();
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative size-10" aria-label="Notifications">
          <RiNotification3Line className="size-5" />
          {unread > 0 ? (
            <span className="absolute top-1.5 right-1.5 grid min-w-4 place-items-center rounded-full bg-lime px-1 text-[0.6rem] font-bold text-black">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-2">
        <div className="flex items-center justify-between px-1 py-1">
          <p className="text-sm font-semibold">Notifications</p>
          <Link to="/alerts" className="text-xs text-primary hover:underline">
            See all
          </Link>
        </div>
        <DropdownMenuSeparator />
        {latest.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">No messages yet.</p>
        ) : (
          latest.map((n) => (
            <DropdownMenuItem key={n.id} asChild className="items-start gap-2 py-2">
              <a href={n.href ?? "/alerts"}>
                <span className={cn("mt-1 size-1.5 shrink-0 rounded-full bg-lime", n.read && "bg-muted-foreground/40")} />
                <span className="min-w-0">
                  <span className={cn("block text-sm font-medium", KIND_COLOR[n.kind])}>{n.title}</span>
                  <span className="line-clamp-2 text-xs text-muted-foreground">{n.body}</span>
                </span>
              </a>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
