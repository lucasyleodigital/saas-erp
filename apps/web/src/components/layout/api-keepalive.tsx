"use client";

import { useEffect } from "react";
import { api } from "@/lib/api";

const INTERVAL_MS = 4 * 60 * 1000; // 4 minutes — keeps Railway from sleeping (sleeps after 5m idle on free plan)

export function ApiKeepalive() {
  useEffect(() => {
    const ping = () => api.get("/health").catch(() => {});
    const id = setInterval(ping, INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return null;
}
