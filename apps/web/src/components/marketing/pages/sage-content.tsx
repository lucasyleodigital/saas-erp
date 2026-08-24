import Link from "next/link";
import { useTranslations } from "next-intl";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";

const REASON_KEYS = ["r1", "r2", "r3", "r4", "r5", "r6"] as const;
const ROW_KEYS = ["r1", "r2", "r3", "r4", "r5", "r6", "r7", "r8", "r9", "r10"] as const;
const STEP_KEYS = ["s1", "s2", "s3"] as const;

export function SageContent() {
  const t = useTranslations("satellite.sage");

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

        {/* Por qué cambiar */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold text-center mb-4">{t("reasons.title")}</h2>
            <p className="text-muted-foreground text-center mb-10 max-w-xl mx-auto">{t("reasons.subtitle")}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {REASON_KEYS.map((k) => (
                <div key={k} className="rounded-xl border bg-card p-5 space-y-2">
                  <h3 className="font-semibold">{t(`reasons.items.${k}.t`)}</h3>
                  <p className="text-sm text-muted-foreground">{t(`reasons.items.${k}.d`)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tabla comparativa */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold text-center mb-4">{t("comparison.title")}</h2>
            <p className="text-muted-foreground text-center mb-10">{t("comparison.subtitle")}</p>
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted text-left">
                    <th className="px-5 py-4 font-medium">{t("comparison.colFeat")}</th>
                    <th className="px-5 py-4 font-medium text-primary">YouWhole</th>
                    <th className="px-5 py-4 font-medium text-muted-foreground">{t("comparison.colOther")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {ROW_KEYS.map((k) => {
                    const yw = t.raw(`comparison.rows.${k}.yw`) as boolean | string;
                    const other = t.raw(`comparison.rows.${k}.other`) as boolean | string;
                    const note = t(`comparison.rows.${k}.note`);
                    return (
                      <tr key={k} className="bg-background hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-4">
                          <span className="font-medium">{t(`comparison.rows.${k}.feat`)}</span>
                          {note && <span className="block text-xs text-muted-foreground mt-0.5">{note}</span>}
                        </td>
                        <td className="px-5 py-4">
                          {typeof yw === "boolean" ? (
                            yw ? <span className="text-emerald-600 font-semibold">{t("comparison.included")}</span> : <span className="text-destructive">{t("comparison.no")}</span>
                          ) : (
                            <span className="text-primary font-semibold">{yw}</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {typeof other === "boolean" ? (
                            other ? <span className="text-emerald-600">{t("comparison.yes")}</span> : <span className="text-muted-foreground">{t("comparison.notAvailable")}</span>
                          ) : (
                            <span className="text-muted-foreground">{other}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-4">{t("comparison.footnote")}</p>
          </div>
        </section>

        {/* Migración */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <h2 className="text-3xl font-bold mb-4">{t("migration.title")}</h2>
            <p className="text-muted-foreground mb-10 max-w-xl mx-auto">{t("migration.subtitle")}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left mb-10">
              {STEP_KEYS.map((k, i) => (
                <div key={k} className="rounded-xl border bg-background p-5">
                  <div className="text-2xl font-bold text-primary mb-2">{i + 1}</div>
                  <div className="font-semibold mb-1">{t(`migration.steps.${k}.t`)}</div>
                  <div className="text-sm text-muted-foreground">{t(`migration.steps.${k}.d`)}</div>
                </div>
              ))}
            </div>
            <Link
              href="/es/registro"
              className="inline-flex items-center justify-center rounded-xl px-10 py-4 text-base font-semibold text-white bg-primary hover:bg-primary/90 transition-all"
            >
              {t("migration.cta")}
            </Link>
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
