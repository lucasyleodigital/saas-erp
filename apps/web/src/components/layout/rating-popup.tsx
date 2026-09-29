"use client";

import { useEffect, useState } from "react";
import { Star, X, Send, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";

const STORAGE_KEY = "youwhole_feedback_v1";
const DELAY_MS = 25_000;

export function RatingPopup() {
  const [visible, setVisible] = useState(false);
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

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

  async function submit() {
    if (!rating) return;
    setSending(true);
    try {
      await api.post("/contact/feedback", { rating, comment });
      setSent(true);
      try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
      setTimeout(() => setVisible(false), 2500);
    } catch {
      // fail silently — don't block the user
      dismiss(true);
    } finally {
      setSending(false);
    }
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 rounded-2xl border border-border bg-background shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-teal-600 to-teal-500 px-4 py-3">
        <span className="text-sm font-semibold text-white">YouWhole</span>
        <button
          onClick={() => dismiss(true)}
          className="text-white/70 hover:text-white transition-colors"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="px-5 py-4">
        {sent ? (
          <div className="flex flex-col items-center gap-2 py-2 text-center">
            <CheckCircle className="h-8 w-8 text-teal-500" />
            <p className="text-sm font-semibold text-foreground">¡Gracias por tu valoración!</p>
            <p className="text-xs text-muted-foreground">Tu opinión nos ayuda a mejorar.</p>
          </div>
        ) : (
          <>
            <p className="mb-3 text-sm font-semibold text-foreground">
              ¿Cómo valorarías YouWhole?
            </p>

            {/* Stars */}
            <div className="mb-3 flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setRating(i)}
                  className="transition-transform hover:scale-110"
                  aria-label={`${i} estrellas`}
                >
                  <Star
                    className="h-7 w-7 transition-colors"
                    fill={(hovered || rating) >= i ? "#f59e0b" : "transparent"}
                    stroke={(hovered || rating) >= i ? "#f59e0b" : "#d1d5db"}
                  />
                </button>
              ))}
            </div>

            {/* Comment */}
            {rating > 0 && (
              <Textarea
                placeholder="Cuéntanos qué te parece o qué mejorarías... (opcional)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="mb-3 resize-none text-xs"
              />
            )}
          </>
        )}
      </div>

      {/* Actions */}
      {!sent && (
        <div className="flex gap-2 border-t border-border px-5 py-3">
          <Button
            size="sm"
            className="flex-1 gap-1.5 bg-teal-600 hover:bg-teal-700 text-white"
            onClick={submit}
            disabled={!rating || sending}
          >
            <Send className="h-3.5 w-3.5" />
            {sending ? "Enviando..." : "Enviar"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="flex-1 text-muted-foreground"
            onClick={() => dismiss(true)}
          >
            Ahora no
          </Button>
        </div>
      )}
    </div>
  );
}
