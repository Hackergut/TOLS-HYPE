import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { AgeGate } from "@/components/legal/age-gate";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { skin, skinStyle } from "@/lib/operator/skin";
import appCss from "../styles.css?url";

const APP_NAME = skin.name;

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: APP_NAME },
      { name: "theme-color", content: "#1c1c22" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      {
        name: "description",
        content:
          "TOLS — originals casino for crash, roulette, blackjack, slots, dice, mines, keno, and hi-lo. Play-money balances.",
      },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <html lang="en" className="dark antialiased font-source-sans-3 font-roboto" suppressHydrationWarning>
      <head>
        <HeadContent />
        {skinStyle() ? <style dangerouslySetInnerHTML={{ __html: `html{${skinStyle()}}` }} /> : null}
      </head>
      <body className="min-h-dvh text-foreground">
        <PreviewHostBridge />
        <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark" enableSystem={false}>
          <AuthProvider>
            <TooltipProvider>
              <AgeGate>
                <Outlet />
              </AgeGate>
              <Toaster />
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  );
}
