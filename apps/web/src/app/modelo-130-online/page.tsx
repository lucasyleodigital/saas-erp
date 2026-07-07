import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://youwhole.com";

const JSONLD_FAQ = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "¿Qué es el Modelo 130?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "El Modelo 130 es la declaración trimestral del IRPF para autónomos en estimación directa. Se presenta en enero, abril, julio y octubre ante la Agencia Tributaria y sirve para liquidar los pagos fraccionados del IRPF.",
      },
    },
    {
      "@type": "Question",
      name: "¿Quién tiene que presentar el Modelo 130?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Todos los autónomos en estimación directa (normal o simplificada) que no tengan al menos el 70% de sus ingresos con retención IRPF. Si tus clientes son particulares o empresas que no te aplican retención, debes presentar el Modelo 130.",
      },
    },
    {
      "@type": "Question",
      name: "¿Cómo calcula YouWhole el Modelo 130?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "YouWhole suma automáticamente todos tus ingresos y gastos del trimestre, calcula el 20% de IRPF sobre el beneficio neto, resta las retenciones ya aplicadas y te da el importe exacto a pagar. No necesitas hacer ningún cálculo manual.",
      },
    },
    {
      "@type": "Question",
      name: "¿YouWhole presenta el Modelo 130 en la AEAT por mí?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "YouWhole genera todos los datos necesarios para presentar el Modelo 130. La presentación final ante la AEAT la realizas tú desde la Sede Electrónica o tu asesor con los datos que te proporcionamos. Estamos trabajando en la presentación directa.",
      },
    },
  ],
};

export const metadata: Metadata = {
  title: "Modelo 130 Online para Autónomos — YouWhole",
  description:
    "Calcula y prepara el Modelo 130 de forma automática con YouWhole. Suma ingresos, gastos y retenciones del trimestre sin errores. Gratis para autónomos.",
  keywords: [
    "modelo 130 online",
    "modelo 130 autónomos",
    "calcular modelo 130",
    "modelo 130 IRPF autónomos",
    "declaración trimestral autónomos",
    "pagos fraccionados IRPF autónomos",
    "modelo 130 estimación directa",
  ],
  alternates: { canonical: `${APP_URL}/modelo-130-online` },
  openGraph: {
    title: "Modelo 130 Online para Autónomos — YouWhole",
    description: "Calcula el Modelo 130 automáticamente. Sin errores, sin cálculos manuales. Incluido en todos los planes.",
    url: `${APP_URL}/modelo-130-online`,
  },
};

export default function Modelo130Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSONLD_FAQ) }} />
      <div className="min-h-screen flex flex-col">
        <MarketingNav />

        <main className="flex-1">
          {/* Hero */}
          <section className="py-24 bg-gradient-to-b from-background to-muted/30">
            <div className="container mx-auto px-4 max-w-4xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium mb-6 text-primary border-primary/30 bg-primary/5">
                IRPF trimestral autónomos
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
                Modelo 130 calculado
                <span className="text-primary"> automáticamente cada trimestre</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                YouWhole suma tus ingresos y gastos del trimestre, calcula el IRPF y te da el importe
                exacto del Modelo 130. Sin calculadora. Sin errores. Sin agobios.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/es/registro"
                  className="inline-flex items-center justify-center rounded-xl px-8 py-3.5 text-base font-semibold text-white bg-primary hover:bg-primary/90 transition-all"
                >
                  Empezar gratis — sin tarjeta
                </Link>
                <Link
                  href="/contacto"
                  className="inline-flex items-center justify-center rounded-xl border px-8 py-3.5 text-base font-medium hover:bg-muted transition-all"
                >
                  Solicitar demo
                </Link>
              </div>
              <p className="text-sm text-muted-foreground mt-4">Incluido en todos los planes · Cálculo automático · Datos listos para presentar</p>
            </div>
          </section>

          {/* Qué es el Modelo 130 */}
          <section className="py-20 bg-background">
            <div className="container mx-auto px-4 max-w-3xl">
              <h2 className="text-3xl font-bold mb-6">¿Qué es el Modelo 130 y cuándo hay que presentarlo?</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  El <strong className="text-foreground">Modelo 130</strong> es la declaración trimestral del IRPF para autónomos en
                  estimación directa. Se presenta cuatro veces al año ante la Agencia Tributaria:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-6">
                  {[
                    { t: "1T", d: "1-20 abril", p: "Enero–Marzo" },
                    { t: "2T", d: "1-20 julio", p: "Abril–Junio" },
                    { t: "3T", d: "1-20 octubre", p: "Julio–Septiembre" },
                    { t: "4T", d: "1-30 enero", p: "Octubre–Diciembre" },
                  ].map((q) => (
                    <div key={q.t} className="rounded-xl border bg-card p-4 text-center">
                      <div className="text-lg font-bold text-primary">{q.t}</div>
                      <div className="text-xs font-medium mt-1">{q.d}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{q.p}</div>
                    </div>
                  ))}
                </div>
                <p>
                  Si más del 70% de tus facturas llevan retención IRPF (porque tus clientes son empresas que te la aplican),
                  puede que estés <strong className="text-foreground">exento de presentar el Modelo 130</strong>. YouWhole detecta
                  automáticamente si cumples ese umbral.
                </p>
              </div>
            </div>
          </section>

          {/* Cómo funciona */}
          <section className="py-20 bg-muted/30">
            <div className="container mx-auto px-4 max-w-4xl">
              <h2 className="text-3xl font-bold text-center mb-10">Cómo calcula YouWhole tu Modelo 130</h2>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
                {[
                  { n: "1", t: "Registras tus facturas", d: "Cada factura emitida y recibida queda registrada automáticamente con su IRPF e IVA." },
                  { n: "2", t: "YouWhole acumula el trimestre", d: "Suma ingresos, gastos deducibles y retenciones ya aplicadas por tus clientes." },
                  { n: "3", t: "Calcula el 20%", d: "Aplica el 20% de IRPF sobre el beneficio neto del trimestre acumulado." },
                  { n: "4", t: "Te da el resultado", d: "Obtienes el importe exacto a ingresar en Hacienda listo para presentar." },
                ].map((s) => (
                  <div key={s.n} className="rounded-xl border bg-background p-5 text-center">
                    <div className="text-3xl font-bold text-primary mb-3">{s.n}</div>
                    <div className="font-semibold mb-2">{s.t}</div>
                    <div className="text-sm text-muted-foreground">{s.d}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="py-20 bg-background">
            <div className="container mx-auto px-4 max-w-2xl">
              <h2 className="text-3xl font-bold text-center mb-10">Preguntas frecuentes sobre el Modelo 130</h2>
              <div className="space-y-6">
                {JSONLD_FAQ.mainEntity.map((faq) => (
                  <div key={faq.name} className="rounded-xl border p-6">
                    <h3 className="font-semibold mb-2">{faq.name}</h3>
                    <p className="text-sm text-muted-foreground">{faq.acceptedAnswer.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="py-24 bg-primary/5 border-t">
            <div className="container mx-auto px-4 text-center max-w-xl">
              <h2 className="text-3xl font-bold mb-4">Olvídate del Modelo 130 manual</h2>
              <p className="text-muted-foreground mb-8">YouWhole lo calcula solo cada trimestre. Empieza gratis hoy.</p>
              <Link
                href="/es/registro"
                className="inline-flex items-center justify-center rounded-xl px-10 py-4 text-base font-semibold text-white bg-primary hover:bg-primary/90 transition-all"
              >
                Crear cuenta gratis
              </Link>
            </div>
          </section>
        </main>

        <MarketingFooter />
      </div>
    </>
  );
}
