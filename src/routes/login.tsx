import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AuthWidgetPanel, type AuthTab } from "@/components/auth/auth-widget";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const [tab, setTab] = useState<AuthTab>("login");

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("tab") === "register") setTab("register");
    const google = sp.get("google");
    if (google) {
      sp.delete("google");
      sp.delete("reason");
      const qs = sp.toString();
      window.history.replaceState(null, "", qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
    }
  }, []);

  return (
    <main className="grid min-h-dvh place-items-center bg-background px-3 py-6">
      <div className="tols-auth-dialog w-full max-w-[920px] overflow-hidden rounded-2xl shadow-[0_24px_80px_rgb(0_0_0/0.55)]">
        <AuthWidgetPanel tab={tab} onTab={setTab} homeClose />
      </div>
    </main>
  );
}
