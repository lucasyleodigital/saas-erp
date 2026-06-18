"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const STORAGE_KEY = "yw-cookie-consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setVisible(false);
  }

  function reject() {
    localStorage.setItem(STORAGE_KEY, "essential");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-sm shadow-lg">
      <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground max-w-2xl">
          Usamos cookies propias y de terceros para mejorar tu experiencia y analizar el tráfico.
          Puedes aceptarlas todas o solo las esenciales.{" "}
          <Link href="/cookies" className="underline hover:text-foreground transition-colors">
            Política de cookies
          </Link>
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={reject}
            className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"
          >
            Solo esenciales
          </button>
          <button
            onClick={accept}
            className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
          >
            Aceptar todas
          </button>
        </div>
      </div>
    </div>
  );
}
