import Link from "next/link";
import { useTranslations } from "next-intl";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";

const STEP_KEYS = ["s1", "s2", "s3"] as const;
const FAQ_KEYS = ["q1", "q2", "q3", "q4"] as const;

export function VerifactuContent() {
  const t = useTranslations("satellite.verifactu");

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
            <Link
              href="/es/registro"
              className="inline-flex items-center justify-center rounded-xl px-10 py-4 text-base font-semibold text-white bg-primary hover:bg-primary/90 transition-all"
            >
              {t("cta")}
            </Link>
          </div>
        </section>

        {/* Qué es VeriFactu */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-3xl font-bold mb-6">{t("intro.title")}</h2>
            <div className="prose prose-neutral dark:prose-invert max-w-none space-y-4 text-muted-foreground">
              <p>
                {t("intro.p1Pre")} <strong className="text-foreground">{t("intro.p1Strong")}</strong> {t("intro.p1Post")}
              </p>
              <p>
                {t("intro.p2Pre")} <strong className="text-foreground">{t("intro.p2Strong")}</strong> {t("intro.p2Post")}
              </p>
              <p>{t("intro.p3")}</p>
            </div>
          </div>
        </section>

        {/* Cómo funciona */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold text-center mb-10">{t("howItWorks.title")}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {STEP_KEYS.map((k, i) => (
                <div key={k} className="rounded-xl border bg-background p-6 text-center">
                  <div className="text-3xl font-bold text-primary mb-3">{i + 1}</div>
                  <div className="font-semibold mb-2">{t(`howItWorks.steps.${k}.t`)}</div>
                  <div className="text-sm text-muted-foreground">{t(`howItWorks.steps.${k}.d`)}</div>
                </div>
              ))}
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
