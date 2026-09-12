import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  dropPushSubscription,
  getPushPublicKey,
  listNotifications,
  markNotificationsRead,
  savePushSubscription,
  seedWelcomeNotification,
  type Notice,
} from "@/lib/notifications/server";

type PushState = "unknown" | "unsupported" | "denied" | "default" | "granted" | "subscribed";

type Ctx = {
  notices: Notice[];
  unread: number;
  pushState: PushState;
  refresh: () => Promise<void>;
  markRead: (ids?: number[]) => Promise<void>;
  enablePush: () => Promise<boolean>;
  disablePush: () => Promise<void>;
};

const C = createContext<Ctx | null>(null);

export function useNotifications() {
  const ctx = useContext(C);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}

function urlBase64ToUint8Array(base64: string) {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

async function getRegistration() {
  if (!("serviceWorker" in navigator)) return null;
  const existing = await navigator.serviceWorker.getRegistration("/");
  if (existing) return existing;
  return navigator.serviceWorker.register("/sw.js", { scope: "/" });
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user, isPending } = useCurrentUserState();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [unread, setUnread] = useState(0);
  const [pushState, setPushState] = useState<PushState>("unknown");
  const seen = useRef<Set<number>>(new Set());
  const primed = useRef(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setNotices([]);
      setUnread(0);
      return;
    }
    try {
      const res = await listNotifications();
      const fresh = res.notices.filter((n) => !seen.current.has(n.id) && !n.read);
      if (primed.current) {
        for (const n of fresh.slice(0, 3)) {
          toast(n.title, { description: n.body });
          if (typeof document !== "undefined" && document.hidden && Notification.permission === "granted") {
            const reg = await getRegistration().catch(() => null);
            void (reg
              ? reg.showNotification(n.title, {
                  body: n.body,
                  icon: "/brand/tols-t.png",
                  tag: `inapp-${n.id}`,
                  data: { href: n.href ?? "/alerts" },
                })
              : new Notification(n.title, { body: n.body, icon: "/brand/tols-t.png" }));
          }
        }
      }
      for (const n of res.notices) seen.current.add(n.id);
      primed.current = true;
      setNotices(res.notices);
      setUnread(res.unread);
    } catch {
      /* signed out */
    }
  }, [user]);

  useEffect(() => {
    if (isPending) return;
    if (!user) {
      setNotices([]);
      setUnread(0);
      primed.current = false;
      seen.current = new Set();
      return;
    }
    void seedWelcomeNotification().then(() => refresh()).catch(() => void refresh());
    let t = 0;
    function loop() {
      window.clearInterval(t);
      if (document.hidden) return;
      t = window.setInterval(() => void refresh(), 20000);
    }
    loop();
    document.addEventListener("visibilitychange", loop);
    return () => {
      window.clearInterval(t);
      document.removeEventListener("visibilitychange", loop);
    };
  }, [user, isPending, refresh]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setPushState("unsupported");
      return;
    }
    setPushState(Notification.permission);
    void getRegistration()
      .then(async (reg) => {
        const sub = await reg?.pushManager.getSubscription();
        if (sub && Notification.permission === "granted") setPushState("subscribed");
      })
      .catch(() => undefined);
  }, []);

  const markRead = useCallback(async (ids?: number[]) => {
    await markNotificationsRead({ data: { ids } });
    setNotices((cur) =>
      cur.map((n) => (ids && !ids.includes(n.id) ? n : { ...n, read: true })),
    );
    setUnread((n) => (ids ? Math.max(0, n - ids.length) : 0));
  }, []);

  const enablePush = useCallback(async () => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setPushState("unsupported");
      toast.message("This browser cannot take push");
      return false;
    }
    const perm = await Notification.requestPermission();
    if (perm !== "granted") {
      setPushState(perm);
      toast.message("Notifications blocked");
      return false;
    }
    try {
      const reg = await getRegistration();
      if (!reg) throw new Error("No service worker");
      const key = await getPushPublicKey();
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      });
      const json = sub.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) throw new Error("Bad subscription");
      await savePushSubscription({
        data: {
          endpoint: json.endpoint,
          keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
        },
      });
      setPushState("subscribed");
      toast.success("Push enabled");
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not subscribe");
      setPushState("granted");
      return false;
    }
  }, []);

  const disablePush = useCallback(async () => {
    try {
      const reg = await getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      const endpoint = sub?.endpoint;
      await sub?.unsubscribe();
      await dropPushSubscription({ data: { endpoint } });
    } catch {
      /* ignore */
    }
    setPushState(Notification.permission === "granted" ? "granted" : "default");
    toast.message("Push off");
  }, []);

  const value = useMemo(
    () => ({ notices, unread, pushState, refresh, markRead, enablePush, disablePush }),
    [notices, unread, pushState, refresh, markRead, enablePush, disablePush],
  );

  return <C.Provider value={value}>{children}</C.Provider>;
}
