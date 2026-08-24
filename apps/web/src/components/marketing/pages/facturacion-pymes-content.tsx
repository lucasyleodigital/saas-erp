import Link from "next/link";
import { useTranslations } from "next-intl";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";
import { PricingCards } from "@/components/billing/pricing-cards";

const MODULE_KEYS = ["m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8"] as const;

export function FacturacionPymesContent() {
  const t = useTranslations("satellite.facturacionPymes");
  const sectors = t.raw("sectors.list") as string[];

  return (
    <div className="min-h-screen flex flex-col">
      <MarketingNav />

      <main className="flex-1">
        {/* Hero */}
        <section className="py-24 bg-gradient-to-b from-background to-muted/30">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium mb-6 text-primary border-primary/30 bg-primary/5">
              {t("badge")}
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
              {t("h1Line1")}
              <span className="text-primary"> {t("h1Highlight")}</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              {t("subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/es/registro"
                className="inline-flex items-center justify-center rounded-xl px-8 py-3.5 text-base font-semibold text-white bg-primary hover:bg-primary/90 transition-all"
              >
                {t("ctaPrimary")}
              </Link>
              <Link
                href="/contacto"
                className="inline-flex items-center justify-center rounded-xl border px-8 py-3.5 text-base font-medium hover:bg-muted transition-all"
              >
                {t("ctaSecondary")}
              </Link>
            </div>
            <p className="text-sm text-muted-foreground mt-4">{t("trustLine")}</p>
          </div>
        </section>

        {/* Módulos */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-3xl font-bold text-center mb-4">{t("modules.title")}</h2>
            <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
              {t("modules.subtitle")}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {MODULE_KEYS.map((k) => (
                <div key={k} className="rounded-xl border bg-card p-5 space-y-2">
                  <h3 className="font-semibold">{t(`modules.items.${k}.title`)}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{t(`modules.items.${k}.desc`)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Para quién es */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold text-center mb-10">{t("sectors.title")}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {sectors.map((sector) => (
                <div key={sector} className="rounded-lg border bg-background px-4 py-3 text-sm font-medium text-center">
                  {sector}
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground mt-6">
              {t("sectors.footnotePre")}{" "}
              <Link href="/contacto" className="text-primary underline hover:text-primary/80">
                {t("sectors.footnoteLink")}
              </Link>
            </p>
          </div>
        </section>

        {/* Precios */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4 max-w-5xl text-center">
            <h2 className="text-3xl font-bold mb-4">{t("pricing.title")}</h2>
            <p className="text-muted-foreground mb-12">{t("pricing.subtitle")}</p>
            <PricingCards />
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 bg-primary/5 border-t">
          <div className="container mx-auto px-4 text-center max-w-xl">
            <h2 className="text-3xl font-bold mb-4">{t("finalCta.title")}</h2>
            <p className="text-muted-foreground mb-8">{t("finalCta.subtitle")}</p>
            <Link
              href="/es/registro"
              className="inline-flex items-center justify-center rounded-xl px-10 py-4 text-base font-semibold text-white bg-primary hover:bg-primary/90 transition-all"
            >
              {t("finalCta.cta")}
            </Link>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
