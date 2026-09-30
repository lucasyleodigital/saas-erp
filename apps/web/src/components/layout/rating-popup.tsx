"use client";

import { useEffect, useState } from "react";
import { Star, X, Send, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

const STORAGE_KEY = "youwhole_feedback_v1";
const DELAY_MS = 25_000;

const STRENGTHS = ["Facilidad de uso", "Facturación", "VeriFactu", "CRM", "Precio", "Soporte"];
const IMPROVEMENTS = ["Más rapidez", "App móvil", "Más integraciones", "Informes", "Documentación", "Más funciones"];

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
        active
          ? "border-teal-500 bg-teal-500/10 text-teal-600 dark:text-teal-400"
          : "border-border text-muted-foreground hover:border-teal-400 hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

export function RatingPopup() {
  const [visible, setVisible] = useState(false);
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [strengths, setStrengths] = useState<string[]>([]);
  const [improvements, setImprovements] = useState<string[]>([]);
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

  function toggle(list: string[], setList: (v: string[]) => void, item: string) {
    setList(list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
  }

  async function submit() {
    if (!rating) return;
    setSending(true);
    try {
      await api.post("/contact/feedback", { rating, comment, strengths, improvements });
      setSent(true);
      try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
      setTimeout(() => setVisible(false), 2500);
    } catch {
      dismiss(true);
    } finally {
      setSending(false);
    }
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 rounded-2xl border border-border bg-background shadow-2xl">
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

      <div className="px-5 py-4">
        {sent ? (
          <div className="flex flex-col items-center gap-2 py-2 text-center">
            <CheckCircle className="h-8 w-8 text-teal-500" />
            <p className="text-sm font-semibold text-foreground">¡Gracias por tu valoración!</p>
            <p className="text-xs text-muted-foreground">Tu opinión nos ayuda a mejorar.</p>
          </div>
        ) : (
          <>
            <p className="mb-3 text-sm font-semibold text-foreground">¿Cómo valorarías YouWhole?</p>

            {/* Stars */}
            <div className="mb-4 flex gap-1">
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

            {rating > 0 && (
              <>
                {/* Strengths */}
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">¿Qué valoras más?</p>
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {STRENGTHS.map((s) => (
                    <Chip key={s} label={s} active={strengths.includes(s)} onClick={() => toggle(strengths, setStrengths, s)} />
                  ))}
                </div>

                {/* Improvements */}
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">¿Qué mejorarías?</p>
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {IMPROVEMENTS.map((s) => (
                    <Chip key={s} label={s} active={improvements.includes(s)} onClick={() => toggle(improvements, setImprovements, s)} />
                  ))}
                </div>

                {/* Optional comment */}
                <textarea
                  placeholder="Algo más que quieras contarnos... (opcional)"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={2}
                  className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </>
            )}
          </>
        )}
      </div>

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
