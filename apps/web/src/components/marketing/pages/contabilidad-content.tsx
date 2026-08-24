import Link from "next/link";
import { useTranslations } from "next-intl";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";

const AUTO_KEYS = ["a1", "a2", "a3", "a4", "a5", "a6"] as const;
const PGC_ROW_KEYS = ["r1", "r2", "r3", "r4", "r5", "r6"] as const;
const FAQ_KEYS = ["q1", "q2", "q3", "q4"] as const;

export function ContabilidadContent() {
  const t = useTranslations("satellite.contabilidad");

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

        {/* Qué hace solo */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-3xl font-bold text-center mb-4">{t("automatic.title")}</h2>
            <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
              {t("automatic.subtitle")}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {AUTO_KEYS.map((k) => (
                <div key={k} className="rounded-xl border bg-card p-6 space-y-2">
                  <h3 className="font-semibold text-lg">{t(`automatic.items.${k}.title`)}</h3>
                  <p className="text-sm text-muted-foreground">{t(`automatic.items.${k}.desc`)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PGC */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-3xl font-bold text-center mb-4">{t("pgcTable.title")}</h2>
            <p className="text-muted-foreground text-center mb-10">{t("pgcTable.subtitle")}</p>
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted text-left">
                    <th className="px-5 py-4 font-medium">{t("pgcTable.colOp")}</th>
                    <th className="px-5 py-4 font-medium">{t("pgcTable.colAccount")}</th>
                    <th className="px-5 py-4 font-medium text-primary">{t("pgcTable.colAuto")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {PGC_ROW_KEYS.map((k) => (
                    <tr key={k} className="bg-background">
                      <td className="px-5 py-4 font-medium">{t(`pgcTable.rows.${k}.op`)}</td>
                      <td className="px-5 py-4 text-muted-foreground font-mono text-xs">{t(`pgcTable.rows.${k}.account`)}</td>
                      <td className="px-5 py-4 text-emerald-600 font-semibold">{t("pgcTable.yes")}</td>
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
