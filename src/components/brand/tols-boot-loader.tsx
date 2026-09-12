"use client";

import { useEffect, useState } from "react";
import { VideoLoader } from "@/components/brand/video-loader";

export function TolsBootLoader() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);
  return <VideoLoader ready={ready} />;
}
