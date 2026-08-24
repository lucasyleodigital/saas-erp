import Link from "next/link";
import { useTranslations } from "next-intl";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";
import { PricingCards } from "@/components/billing/pricing-cards";

const FEATURE_KEYS = ["f1", "f2", "f3", "f4", "f5", "f6"] as const;
const ROW_KEYS = ["r1", "r2", "r3", "r4", "r5", "r6"] as const;
const FAQ_KEYS = ["q1", "q2", "q3", "q4"] as const;

export function ErpAutonomosContent() {
  const t = useTranslations("satellite.erpAutonomos");

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

        {/* Features */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-3xl font-bold text-center mb-4">{t("features.title")}</h2>
            <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
              {t("features.subtitle")}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURE_KEYS.map((k) => (
                <div key={k} className="rounded-xl border bg-card p-6 space-y-2">
                  <h3 className="font-semibold text-lg">{t(`features.items.${k}.title`)}</h3>
                  <p className="text-sm text-muted-foreground">{t(`features.items.${k}.desc`)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparativa breve */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-3xl font-bold text-center mb-4">{t("comparison.title")}</h2>
            <p className="text-muted-foreground text-center mb-10">{t("comparison.subtitle")}</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border rounded-xl overflow-hidden">
                <thead>
                  <tr className="bg-muted text-left">
                    <th className="px-4 py-3 font-medium">{t("comparison.colFeat")}</th>
                    <th className="px-4 py-3 font-medium text-primary">{t("comparison.colYw")}</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">{t("comparison.colOther")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {ROW_KEYS.map((k) => (
                    <tr key={k} className="bg-background">
                      <td className="px-4 py-3 font-medium">{t(`comparison.rows.${k}.feat`)}</td>
                      <td className="px-4 py-3 text-primary">{t(`comparison.rows.${k}.yw`)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{t(`comparison.rows.${k}.other`)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4 max-w-2xl">
            <h2 className="text-3xl font-bold text-center mb-10">{t("faq.title")}</h2>
            <div className="space-y-6">
              {FAQ_KEYS.map((k) => (
                <div key={k} className="rounded-xl border p-6">
                  <h3 className="font-semibold mb-2">{t(`faq.items.${k}.q`)}</h3>
                  <p className="text-sm text-muted-foreground">{t(`faq.items.${k}.a`)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 max-w-5xl text-center">
            <h2 className="text-3xl font-bold mb-4">{t("pricing.title")}</h2>
            <p className="text-muted-foreground mb-12">{t("pricing.subtitle")}</p>
            <PricingCards />
          </div>
        </section>

        {/* CTA final */}
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
