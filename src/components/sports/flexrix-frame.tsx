import { useEffect, useState } from "react";

export function FlexrixSportsFrame() {
  const [src, setSrc] = useState("https://sports.flexrix.com/en/sports");

  useEffect(() => {
    void fetch("/api/sportsbook/session")
      .then((r) => r.json())
      .then((j: { url?: string }) => {
        if (j.url) setSrc(j.url.replace("/tr/", "/en/"));
      })
      .catch(() => undefined);
  }, []);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
      <iframe
        title="TOLS Sportsbook"
        src={src}
        className="h-[min(85vh,52rem)] w-full"
        allow="autoplay; fullscreen"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
