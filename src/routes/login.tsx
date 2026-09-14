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
    <main className="tols-auth-page">
      <div className="tols-auth-page-glow" aria-hidden />
      <div className="tols-auth-dialog tols-auth-enter w-full max-w-[920px]">
        <AuthWidgetPanel tab={tab} onTab={setTab} homeClose />
      </div>
    </main>
  );
}
