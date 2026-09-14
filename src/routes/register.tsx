import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AuthWidgetPanel } from "@/components/auth/auth-widget";

export const Route = createFileRoute("/register")({ component: Register });

function Register() {
  const navigate = useNavigate();
  return (
    <main className="tols-auth-page">
      <div className="tols-auth-page-glow" aria-hidden />
      <div className="tols-auth-dialog tols-auth-enter w-full max-w-[920px]">
        <AuthWidgetPanel
          tab="register"
          onTab={(t) => {
            if (t === "login") void navigate({ to: "/login" });
          }}
          homeClose
        />
      </div>
    </main>
  );
}
