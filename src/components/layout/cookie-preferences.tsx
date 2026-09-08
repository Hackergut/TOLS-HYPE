import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const KEY = "tols-cookies";

export function CookiePreferences({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    if (!open) return;
    try {
      const raw = window.localStorage.getItem(KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { analytics?: boolean; marketing?: boolean };
      setAnalytics(Boolean(parsed.analytics));
      setMarketing(Boolean(parsed.marketing));
    } catch {
      /* ignore */
    }
  }, [open]);

  function save(next: { analytics: boolean; marketing: boolean }) {
    window.localStorage.setItem(KEY, JSON.stringify({ essential: true, ...next }));
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Customise cookies</DialogTitle>
          <DialogDescription>
            Essential cookies keep you signed in. Analytics and marketing are optional.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <p className="rounded-xl bg-muted px-3 py-2">Essential — always on</p>
          <label className="flex items-center justify-between rounded-xl bg-muted px-3 py-2">
            Analytics
            <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} />
          </label>
          <label className="flex items-center justify-between rounded-xl bg-muted px-3 py-2">
            Marketing
            <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} />
          </label>
        </div>
        <div className="mt-2 flex gap-2">
          <Button variant="outline" className="h-10 flex-1" onClick={() => save({ analytics: false, marketing: false })}>
            Essential only
          </Button>
          <Button className="h-10 flex-1" onClick={() => save({ analytics, marketing })}>
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
