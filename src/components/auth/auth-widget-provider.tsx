import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { AuthWidgetPanel, type AuthTab } from "@/components/auth/auth-widget";

type AuthWidgetApi = {
  open: (tab?: AuthTab) => void;
  close: () => void;
};

const Ctx = createContext<AuthWidgetApi | null>(null);

export function useAuthWidget(): AuthWidgetApi {
  const ctx = useContext(Ctx);
  if (!ctx) {
    return {
      open: (tab) => {
        window.location.assign(tab === "register" ? "/login?tab=register" : "/login");
      },
      close: () => undefined,
    };
  }
  return ctx;
}

export function AuthWidgetProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<AuthTab>("login");
  const api = useMemo<AuthWidgetApi>(
    () => ({
      open: (next) => {
        setTab(next ?? "login");
        setOpen(true);
      },
      close: () => setOpen(false),
    }),
    [],
  );
  const onOpenChange = useCallback((v: boolean) => setOpen(v), []);
  return (
    <Ctx.Provider value={api}>
      {children}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton
          className="tols-auth-dialog tols-auth-enter gap-0 overflow-hidden p-0 text-sm duration-500 sm:max-w-[920px]"
        >
          <DialogTitle className="sr-only">{tab === "login" ? "Login" : "Register"}</DialogTitle>
          <AuthWidgetPanel tab={tab} onTab={setTab} onDone={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </Ctx.Provider>
  );
}
