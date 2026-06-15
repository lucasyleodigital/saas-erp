import type { Metadata } from "next";
import { Hero } from "@/components/marketing/hero";
import { StatsBar } from "@/components/marketing/stats-bar";
import { Features } from "@/components/marketing/features";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { VerifactuSection } from "@/components/marketing/verifactu-section";
import { Testimonials } from "@/components/marketing/testimonials";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";
import { PricingCards } from "@/components/billing/pricing-cards";
import { Faq } from "@/components/marketing/faq";
import { ChatWidget } from "@/components/marketing/chat-widget";
import Link from "next/link";

export const metadata: Metadata = {
  title: "YouWhole — Gestión empresarial para pymes españolas",
  description:
    "CRM, facturación electrónica, VeriFactu y contabilidad en una sola plataforma. Diseñado para el mercado español. Empieza gratis.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <MarketingNav />

      <main className="flex-1">
        {/* 1 · Hero dark fullscreen + dashboard mockup */}
        <Hero />

        {/* 2 · Animated stats */}
        <StatsBar />

        {/* 3 · Bento features grid */}
        <Features />

        {/* 4 · How it works - 3 steps */}
        <HowItWorks />

        {/* 5 · VeriFactu dark section */}
        <VerifactuSection />

        {/* 6 · Testimonials */}
        <Testimonials />

        {/* 7 · FAQ */}
        <Faq />

        {/* 8 · Pricing */}
        <section id="pricing" className="py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <div
                className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium mb-4 border"
                style={{
                  background: "rgba(13,148,136,0.08)",
                  borderColor: "rgba(13,148,136,0.25)",
                  color: "#0d9488",
                }}
              >
                Sin letra pequeña
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Precios claros y transparentes
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Sin costes ocultos ni permanencia. Empieza gratis y actualiza
                cuando lo necesites.
              </p>
            </div>
            <PricingCards />
            <p className="text-center text-xs text-muted-foreground mt-6">
              Todos los precios incluyen IVA · Cancela cuando quieras
            </p>
          </div>
        </section>

        {/* 8 · Final CTA dark */}
        <section
          className="py-28 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #040c0a 0%, #061410 60%, #080f0c 100%)",
          }}
        >
          {/* Glow */}
          <div
            aria-hidden="true"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full pointer-events-none"
            style={{ background: "radial-gradient(ellipse, rgba(13,148,136,0.2) 0%, transparent 70%)" }}
          />

          <div className="container mx-auto px-4 text-center relative z-10">
            <h2 className="text-3xl sm:text-5xl font-bold text-white mb-5 leading-tight">
              ¿Listo para llevar tu empresa
              <br />
              <span
                style={{
                  backgroundImage: "linear-gradient(135deg, #2dd4bf, #f59e0b)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                al siguiente nivel?
              </span>
            </h2>
            <p className="mb-10 max-w-md mx-auto text-lg" style={{ color: "#94a3b8" }}>
              Únete a las empresas que ya gestionan su negocio con YouWhole.
              14 días gratis, sin tarjeta de crédito.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/registro"
                className="inline-flex items-center gap-2 rounded-xl px-10 text-base font-semibold text-white transition-all hover:scale-105 active:scale-95"
                style={{
                  height: 56,
                  background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
                  boxShadow: "0 0 40px rgba(13,148,136,0.5), 0 4px 24px rgba(0,0,0,0.4)",
                }}
              >
                Crear cuenta gratis
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center rounded-xl px-8 text-base font-medium text-white transition-all hover:bg-white/10"
                style={{
                  height: 56,
                  border: "1px solid rgba(255,255,255,0.13)",
                  background: "rgba(255,255,255,0.05)",
                }}
              >
                Ya tengo cuenta
              </Link>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
      <ChatWidget />
    </div>
  );
}
