import { useTranslations } from "next-intl";

/**
 * FAQ section of a satellite page plus its FAQPage JSON-LD, both read from
 * `satellite.<namespace>.faq` so every locale gets its own rich result.
 */
export function SatelliteFaq({ namespace }: { namespace: string }) {
  const t = useTranslations(`satellite.${namespace}.faq`);
  const keys = Object.keys(t.raw("items") as Record<string, unknown>);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: keys.map((k) => ({
      "@type": "Question",
      name: t(`items.${k}.q`),
      acceptedAnswer: { "@type": "Answer", text: t(`items.${k}.a`) },
    })),
  };

  return (
    <section className="py-20 bg-muted/30">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="container mx-auto px-4 max-w-3xl">
        <h2 className="text-3xl font-bold text-center mb-10">{t("title")}</h2>
        <div className="space-y-4">
          {keys.map((k) => (
            <div key={k} className="rounded-xl border bg-background p-6">
              <h3 className="font-semibold mb-2">{t(`items.${k}.q`)}</h3>
              <p className="text-sm text-muted-foreground">{t(`items.${k}.a`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
