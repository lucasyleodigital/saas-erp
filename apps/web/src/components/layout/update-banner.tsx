"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const POLL_INTERVAL = 5 * 60 * 1000; // 5 min

export function UpdateBanner() {
  const initialVersion = useRef<string | null>(null);
  const [outdated, setOutdated] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch("/api/version", { cache: "no-store" });
        if (!res.ok) return;
        const { version } = await res.json();
        if (!initialVersion.current) {
          initialVersion.current = version;
          return;
        }
        if (version !== initialVersion.current) {
          setOutdated(true);
        }
      } catch {
        // network error — silently ignore
      }
    }

    check();
    const id = setInterval(check, POLL_INTERVAL);
    return () => clearInterval(id);
  }, []);

  if (!outdated || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
      <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-background/95 px-4 py-3 shadow-lg backdrop-blur-sm">
        <RefreshCw className="h-4 w-4 shrink-0 text-primary animate-spin" style={{ animationDuration: "3s" }} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">Nueva versión disponible</p>
          <p className="text-xs text-muted-foreground">Recarga la página para obtener las últimas mejoras.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={() => window.location.reload()}
          >
            Recargar
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setDismissed(true)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
