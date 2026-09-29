"use client";

import { useEffect, useState } from "react";
import { Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "youwhole_rating_v1";
const DELAY_MS = 20_000; // show after 20s on the dashboard
const REVIEW_URL = "https://g.page/r/YOUR_GOOGLE_PLACE_ID/review"; // cambiar por tu enlace real de Google

export function RatingPopup() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {
      return;
    }

    const t = setTimeout(() => setVisible(true), DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  function dismiss(permanent: boolean) {
    setVisible(false);
    if (permanent) {
      try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
    }
  }

  function openReview() {
    dismiss(true);
    window.open(REVIEW_URL, "_blank", "noopener,noreferrer");
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 rounded-2xl border border-border bg-background shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-teal-600 to-teal-500 px-4 py-3">
        <span className="text-sm font-semibold text-white">YouWhole</span>
        <button
          onClick={() => dismiss(false)}
          className="text-white/70 hover:text-white transition-colors"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="px-5 py-4">
        <div className="mb-3 flex gap-0.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
          ))}
        </div>
        <p className="mb-1 text-sm font-semibold text-foreground">
          ¿Te está ayudando YouWhole?
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Una valoración en Google nos ayuda a llegar a más autónomos y pymes como tú. Solo te lleva 30 segundos.
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 border-t border-border px-5 py-3">
        <Button size="sm" className="flex-1 bg-teal-600 hover:bg-teal-700 text-white" onClick={openReview}>
          Valorar ahora
        </Button>
        <Button size="sm" variant="ghost" className="flex-1 text-muted-foreground" onClick={() => dismiss(true)}>
          No, gracias
        </Button>
      </div>
    </div>
  );
}
