"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { href: "#features", label: "Funcionalidades" },
  { href: "#verifactu", label: "VeriFactu" },
  { href: "#pricing", label: "Precios" },
];

export function MarketingNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-border bg-background/90 backdrop-blur-md shadow-sm"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.png"
            alt="YouWhole"
            width={130}
            height={36}
            className={cn("object-contain transition-all duration-300", !scrolled && "brightness-0 invert")}
            priority
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={cn(
                "transition-colors hover:opacity-80",
                scrolled ? "text-muted-foreground hover:text-foreground" : "text-white/70 hover:text-white"
              )}
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          {scrolled ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Iniciar sesión</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/registro">Empezar gratis</Link>
              </Button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-white/70 hover:text-white transition-colors px-3 py-1.5"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/registro"
                className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all hover:scale-105"
                style={{
                  background: "linear-gradient(135deg, #0d9488, #0f766e)",
                  boxShadow: "0 0 20px rgba(13,148,136,0.4)",
                }}
              >
                Empezar gratis
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className={cn(
            "md:hidden p-2 transition-colors",
            scrolled ? "text-muted-foreground hover:text-foreground" : "text-white/70 hover:text-white"
          )}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-md">
          <div className="container mx-auto px-4 py-4 space-y-3">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="block text-sm text-muted-foreground hover:text-foreground py-1 transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {l.label}
              </a>
            ))}
            <div className="pt-3 border-t border-border flex flex-col gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/login" onClick={() => setMobileOpen(false)}>
                  Iniciar sesión
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/registro" onClick={() => setMobileOpen(false)}>
                  Empezar gratis
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
