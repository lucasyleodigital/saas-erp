import type { Metadata } from "next";
import { Hero } from "@/components/marketing/hero";
import { Features } from "@/components/marketing/features";
import { VerifactuSection } from "@/components/marketing/verifactu-section";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";
import { PricingCards } from "@/components/billing/pricing-cards";

export const metadata: Metadata = {
  title: "ERP SaaS — Gestión empresarial para pymes españolas",
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
        <Hero />
        <Features />
        <VerifactuSection />

        {/* Pricing section */}
        <section id="pricing" className="py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Precios claros y transparentes
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Sin costes ocultos ni letra pequeña. Empieza gratis y actualiza
                cuando lo necesites.
              </p>
            </div>
            <PricingCards />
            <p className="text-center text-xs text-muted-foreground mt-6">
              Todos los precios incluyen IVA · Cancela cuando quieras
            </p>
          </div>
        </section>

        {/* CTA section */}
        <section className="py-24 bg-primary">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground mb-4">
              ¿Listo para modernizar tu empresa?
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-md mx-auto">
              Únete a las empresas que ya gestionan su negocio con ERP SaaS.
              Sin tarjeta de crédito.
            </p>
            <a
              href="/registro"
              className="inline-flex items-center justify-center rounded-lg bg-background text-foreground font-semibold px-8 h-12 hover:bg-background/90 transition-colors"
            >
              Crear cuenta gratis
            </a>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
