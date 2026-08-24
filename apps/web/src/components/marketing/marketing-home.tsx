import { Hero } from "@/components/marketing/hero";
import { StatsBar } from "@/components/marketing/stats-bar";
import { Features } from "@/components/marketing/features";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { VerifactuSection } from "@/components/marketing/verifactu-section";
import { Testimonials } from "@/components/marketing/testimonials";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";
import { PricingCards } from "@/components/billing/pricing-cards";
import { DemoSection } from "@/components/marketing/demo-section";
import { Faq } from "@/components/marketing/faq";
import { ChatWidget } from "@/components/marketing/chat-widget";
import Link from "next/link";
import { useTranslations } from "next-intl";

export function MarketingHomeContent() {
  const t = useTranslations("marketing");

  return (
    <div className="min-h-screen flex flex-col">
      <MarketingNav />

      <main className="flex-1">
        {/* 1 · Hero dark fullscreen + dashboard mockup */}
        <Hero />

        {/* 2 · Animated app demo */}
        <DemoSection />

        {/* 3 · Animated stats */}
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
                {t("pricingSection.badge")}
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                {t("pricingSection.title")}
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                {t("pricingSection.subtitle")}
              </p>
            </div>
            <PricingCards />
            <p className="text-center text-xs text-muted-foreground mt-6">
              {t("pricingSection.footnote")}
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
              {t("finalCta.titleLine1")}
              <br />
              <span
                style={{
                  backgroundImage: "linear-gradient(135deg, #2dd4bf, #f59e0b)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {t("finalCta.titleHighlight")}
              </span>
            </h2>
            <p className="mb-10 max-w-md mx-auto text-lg" style={{ color: "#94a3b8" }}>
              {t("finalCta.subtitle")}
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
                {t("finalCta.ctaPrimary")}
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
                {t("finalCta.ctaSecondary")}
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
