import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://youwhole.com";

export const metadata: Metadata = {
  title: "Software VeriFactu Certificado AEAT — YouWhole",
  description:
    "YouWhole es un software de facturación certificado VeriFactu por la Agencia Tributaria. Cumple con la obligación legal desde el primer día. Incluido en todos los planes, incluso el gratuito.",
  keywords: [
    "software VeriFactu certificado",
    "VeriFactu AEAT",
    "software facturación VeriFactu",
    "programa VeriFactu autónomos",
    "VeriFactu pymes España",
    "facturación electrónica VeriFactu",
    "obligación VeriFactu 2025",
  ],
  alternates: { canonical: `${APP_URL}/verifactu-software-certificado` },
  openGraph: {
    title: "Software VeriFactu Certificado AEAT — YouWhole",
    description: "Cumple con la obligación VeriFactu desde el primer día. Incluido en todos los planes de YouWhole.",
    url: `${APP_URL}/verifactu-software-certificado`,
  },
};

const JSONLD_FAQ = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "¿Qué es VeriFactu?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "VeriFactu es el sistema de verificación de facturas de la Agencia Tributaria española (AEAT). Desde 2025, todo software de facturación usado por empresas y autónomos debe estar certificado VeriFactu para garantizar la integridad e inalterabilidad de las facturas emitidas.",
      },
    },
    {
      "@type": "Question",
      name: "¿Es obligatorio usar un software con VeriFactu?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sí. El Reglamento de Facturación aprobado en 2023 obliga a todos los empresarios y profesionales en España a usar sistemas de facturación que cumplan con VeriFactu. El incumplimiento puede conllevar sanciones de Hacienda.",
      },
    },
    {
      "@type": "Question",
      name: "¿YouWhole está certificado por la AEAT?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sí. YouWhole está certificado para el envío de registros de facturación a la AEAT mediante el sistema VeriFactu. Cada factura emitida genera automáticamente el registro correspondiente y lo envía a Hacienda.",
      },
    },
    {
      "@type": "Question",
      name: "¿Tengo que hacer algo especial para activar VeriFactu en YouWhole?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. VeriFactu está activo por defecto en todas las cuentas de YouWhole desde el momento del registro. No necesitas configurar nada ni contratar un módulo adicional.",
      },
    },
  ],
};

export default function VerifactuPage() {
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
                Certificado AEAT
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
                Software VeriFactu certificado
                <span className="text-primary"> incluido en todos los planes</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                YouWhole cumple con la obligación VeriFactu de la Agencia Tributaria desde el primer día.
                Sin configuración. Sin módulos extra. Sin coste adicional.
              </p>
              <Link
                href="/es/registro"
                className="inline-flex items-center justify-center rounded-xl px-10 py-4 text-base font-semibold text-white bg-primary hover:bg-primary/90 transition-all"
              >
                Empezar gratis — VeriFactu incluido
              </Link>
            </div>
          </section>

          {/* Qué es VeriFactu */}
          <section className="py-20 bg-background">
            <div className="container mx-auto px-4 max-w-3xl">
              <h2 className="text-3xl font-bold mb-6">¿Qué es VeriFactu y por qué es obligatorio?</h2>
              <div className="prose prose-neutral dark:prose-invert max-w-none space-y-4 text-muted-foreground">
                <p>
                  VeriFactu es el sistema de verificación de facturas aprobado por la Agencia Tributaria española en el marco del
                  Reglamento de Facturación (RD 1007/2023). Su objetivo es garantizar la <strong className="text-foreground">integridad
                  e inalterabilidad</strong> de todas las facturas emitidas por empresas y autónomos en España.
                </p>
                <p>
                  Desde 2025, cualquier software de facturación que uses debe estar <strong className="text-foreground">certificado
                  VeriFactu</strong> para poder operar legalmente. Usar un programa no certificado puede acarrear sanciones de Hacienda
                  de hasta 50.000 EUR.
                </p>
                <p>
                  Con YouWhole, cada factura que emites se registra automáticamente en la AEAT con su huella digital correspondiente.
                  Tú no tienes que hacer nada extra — el sistema lo gestiona en segundo plano.
                </p>
              </div>
            </div>
          </section>

          {/* Cómo funciona */}
          <section className="py-20 bg-muted/30">
            <div className="container mx-auto px-4 max-w-4xl">
              <h2 className="text-3xl font-bold text-center mb-10">Cómo funciona VeriFactu en YouWhole</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  { n: "1", t: "Creas la factura", d: "Introduces los datos del cliente, conceptos y importes como siempre." },
                  { n: "2", t: "Registro automático", d: "YouWhole genera la huella digital de la factura y la envía a la AEAT en tiempo real." },
                  { n: "3", t: "Confirmación AEAT", d: "Recibes la confirmación de registro. Tu factura es legalmente válida y verificable." },
                ].map((s) => (
                  <div key={s.n} className="rounded-xl border bg-background p-6 text-center">
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
              <h2 className="text-3xl font-bold text-center mb-10">Preguntas frecuentes sobre VeriFactu</h2>
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
              <h2 className="text-3xl font-bold mb-4">Cumple con VeriFactu desde hoy</h2>
              <p className="text-muted-foreground mb-8">Gratis hasta 10 facturas al mes. Sin tarjeta de crédito.</p>
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
