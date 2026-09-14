import { createContext, useContext, type ReactNode } from "react";
import type { AuthTab } from "@/components/auth/auth-widget";

type AuthWidgetApi = {
  open: (tab?: AuthTab) => void;
  close: () => void;
};

const Ctx = createContext<AuthWidgetApi | null>(null);

function go(tab?: AuthTab) {
  window.location.assign(tab === "register" ? "/register" : "/login");
}

export function useAuthWidget(): AuthWidgetApi {
  return useContext(Ctx) ?? { open: go, close: () => undefined };
}

/** No modal overlay — login/signup are full pages. */
export function AuthWidgetProvider({ children }: { children: ReactNode }) {
  return (
    <Ctx.Provider value={{ open: go, close: () => undefined }}>
      {children}
    </Ctx.Provider>
  );
}
