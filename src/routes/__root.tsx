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
const APP_DESC =
  "TOLS — originals casino for crash, roulette, blackjack, slots, dice, mines, keno, and hi-lo. Play-money balances.";

/** Same origin guard the injector uses for og:image / x:game:image. */
function publicHost(): string {
  const env = import.meta.env as Record<string, string | undefined>;
  const raw = String(env.VITE_PUBLIC_HOSTNAME ?? "")
    .split(",")[0]
    .trim()
    .split(":")[0]
    .toLowerCase();
  if (!raw || !/^[a-z0-9.-]+$/.test(raw) || !raw.includes(".")) return "";
  if (
    raw === "vercel.app" ||
    raw.endsWith(".vercel.app") ||
    raw === "vercel.com" ||
    raw.endsWith(".vercel.com")
  ) {
    return "";
  }
  return raw;
}

export const Route = createRootRoute({
  head: () => {
    const host = publicHost();
    const ogImage = host ? `https://${host}/og.jpg` : undefined;
    const xBanner = host ? `https://${host}/x-banner.jpg` : undefined;
    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
        { title: APP_NAME },
        { name: "theme-color", content: "#1c1c22" },
        { name: "apple-mobile-web-app-capable", content: "yes" },
        { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
        { name: "description", content: APP_DESC },
        { property: "og:type", content: "website" },
        { property: "og:site_name", content: APP_NAME },
        { property: "og:title", content: `${APP_NAME} ORIGINALS` },
        { property: "og:description", content: APP_DESC },
        ...(ogImage
          ? [
              { property: "og:image", content: ogImage },
              { property: "og:image:width", content: "1200" },
              { property: "og:image:height", content: "630" },
              { property: "og:image:alt", content: "TOLS ORIGINALS — crypto casino" },
            ]
          : []),
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: `${APP_NAME} ORIGINALS` },
        { name: "twitter:description", content: APP_DESC },
        ...(ogImage ? [{ name: "twitter:image", content: ogImage }] : []),
        ...(xBanner
          ? [
              { property: "x:game:image", content: xBanner },
              { property: "x:game:image:width", content: "1200" },
              { property: "x:game:image:height", content: "264" },
            ]
          : []),
      ],
      links: [
        { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
        { rel: "stylesheet", href: appCss },
        { rel: "manifest", href: "/__grok/manifest.webmanifest" },
        { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&family=Source+Sans+3:ital,wght@0,200..900;1,200..900&family=Tektur:wght@500;600;700&display=swap",
        },
      ],
    };
  },
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
