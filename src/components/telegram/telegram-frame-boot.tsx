import { useEffect } from "react";
import { applyTelegramFrameClass } from "@/lib/telegram-frame";

export function TelegramFrameBoot() {
  useEffect(() => {
    applyTelegramFrameClass();
    const onResize = () => applyTelegramFrameClass();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return null;
}
