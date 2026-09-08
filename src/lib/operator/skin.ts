/** Restyle tokens — override TOLS lime/purple/logo without touching components. */
function vite(key: string): string | undefined {
  const env = import.meta.env as Record<string, string | undefined>;
  const v = env[key]?.trim();
  return v || undefined;
}

export const skin = {
  name: vite("VITE_OPERATOR_NAME") ?? vite("VITE_SKIN_NAME") ?? "TOLS",
  logo: vite("VITE_SKIN_LOGO") ?? "/brand/tols-t.png",
  wordmark: vite("VITE_SKIN_WORDMARK") ?? "/brand/tols-wordmark.png",
  primary: vite("VITE_SKIN_PRIMARY") ?? "",
  lime: vite("VITE_SKIN_LIME") ?? "",
  background: vite("VITE_SKIN_BACKGROUND") ?? "",
};

export function skinStyle(): string {
  const rows: string[] = [];
  if (skin.primary) {
    rows.push(`--primary: ${skin.primary}`, `--sidebar-primary: ${skin.primary}`);
  }
  if (skin.lime) {
    rows.push(`--lime-300: ${skin.lime}`, `--primary-foreground: ${skin.lime}`, `--win: ${skin.lime}`);
  }
  if (skin.background) {
    rows.push(`--background: ${skin.background}`);
  }
  return rows.join(";");
}
