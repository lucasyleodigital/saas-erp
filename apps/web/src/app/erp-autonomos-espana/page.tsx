import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";
import { PricingCards } from "@/components/billing/pricing-cards";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://youwhole.com";

export const metadata: Metadata = {
  title: "ERP para Autónomos en España — YouWhole",
  description:
    "El ERP diseñado por autónomos para autónomos. Facturación con VeriFactu, IRPF automático, Modelo 130/303, contabilidad PGC y CRM. Sin permanencia. Desde 29 EUR/mes.",
  keywords: [
    "ERP autónomos España",
    "software gestión autónomos",
    "facturación autónomos España",
    "IRPF autónomos online",
    "Modelo 130 autónomos",
    "programa facturación autónomos",
    "ERP freelance España",
  ],
  alternates: { canonical: `${APP_URL}/erp-autonomos-espana` },
  openGraph: {
    title: "ERP para Autónomos en España — YouWhole",
    description: "Diseñado por autónomos para autónomos. VeriFactu, IRPF, Modelo 130/303 y CRM en una sola plataforma.",
    url: `${APP_URL}/erp-autonomos-espana`,
  },
};

const JSONLD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "YouWhole — ERP para Autónomos",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: `${APP_URL}/erp-autonomos-espana`,
  description: "ERP todo en uno diseñado específicamente para autónomos españoles: facturación VeriFactu, IRPF automático, Modelo 130/303, contabilidad y CRM.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "EUR", description: "Plan gratuito disponible" },
  availableInCountry: "ES",
  inLanguage: "es-ES",
};

const FEATURES = [
  {
    title: "VeriFactu certificado AEAT",
    desc: "Cumple con la obligación legal desde el primer día. Cada factura se registra automáticamente en la Agencia Tributaria.",
  },
  {
    title: "IRPF automático",
    desc: "Calcula y aplica la retención IRPF en cada factura según el tipo de cliente. Sin errores, sin cálculos manuales.",
  },
  {
    title: "Modelo 130 y 303 integrados",
    desc: "Genera los datos de tus declaraciones trimestrales en segundos. Menos tiempo con Hacienda, más tiempo facturando.",
  },
  {
    title: "Contabilidad PGC",
    desc: "Asientos contables automáticos según el Plan General Contable español. Sin necesidad de gestor para el día a día.",
  },
  {
    title: "CRM y presupuestos",
    desc: "Gestiona tus clientes, envía presupuestos profesionales y conviértelos en facturas con un clic.",
  },
  {
    title: "Control horario y proyectos",
    desc: "Ficha horas por proyecto, calcula rentabilidad y factura el tiempo trabajado directamente.",
  },
];

const FAQS = [
  {
    q: "¿YouWhole es adecuado para autónomos que facturan poco?",
    a: "Sí. El plan gratuito incluye hasta 5 clientes y 10 facturas al mes — más que suficiente si estás empezando. Cuando crezcas, el plan Starter desde 29 EUR/mes no tiene límites.",
  },
  {
    q: "¿Necesito saber contabilidad para usar YouWhole?",
    a: "No. La plataforma genera los asientos contables de forma automática. Tú solo introduces facturas y cobros — el sistema hace el resto.",
  },
  {
    q: "¿Puedo llevar el IRPF yo mismo sin gestor?",
    a: "Sí para el día a día. YouWhole calcula las retenciones, genera el resumen del Modelo 130 y te da todos los datos para presentarlo. Para casos complejos, siempre recomendamos revisar con un asesor.",
  },
  {
    q: "¿Funciona en móvil?",
    a: "Sí. YouWhole es una app web completamente responsive. Puedes crear facturas, consultar clientes y ver tu dashboard desde el móvil o tablet.",
  },
];

export default function ErpAutonomosPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSONLD) }} />
      <div className="min-h-screen flex flex-col">
        <MarketingNav />

        <main className="flex-1">
          {/* Hero */}
          <section className="py-24 bg-gradient-to-b from-background to-muted/30">
            <div className="container mx-auto px-4 max-w-4xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium mb-6 text-primary border-primary/30 bg-primary/5">
                Creado por autónomos para autónomos
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
                El ERP que los autónomos españoles
                <span className="text-primary"> necesitaban</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                Facturación con VeriFactu, IRPF automático, Modelo 130/303, contabilidad PGC y CRM.
                Todo en una plataforma pensada para cómo trabaja un autónomo de verdad.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/es/registro"
                  className="inline-flex items-center justify-center rounded-xl px-8 py-3.5 text-base font-semibold text-white bg-primary hover:bg-primary/90 transition-all"
                >
                  Empieza gratis — 14 días sin tarjeta
                </Link>
                <Link
                  href="/contacto"
                  className="inline-flex items-center justify-center rounded-xl border px-8 py-3.5 text-base font-medium hover:bg-muted transition-all"
                >
                  Solicitar demo
                </Link>
              </div>
              <p className="text-sm text-muted-foreground mt-4">Sin permanencia · Cancela cuando quieras · Soporte en español</p>
            </div>
          </section>

          {/* Features */}
          <section className="py-20 bg-background">
            <div className="container mx-auto px-4 max-w-5xl">
              <h2 className="text-3xl font-bold text-center mb-4">Todo lo que necesita un autónomo</h2>
              <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
                Diseñado desde cero para la realidad del autónomo español: Hacienda, clientes, tiempo y dinero.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {FEATURES.map((f) => (
                  <div key={f.title} className="rounded-xl border bg-card p-6 space-y-2">
                    <h3 className="font-semibold text-lg">{f.title}</h3>
                    <p className="text-sm text-muted-foreground">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Comparativa breve */}
          <section className="py-20 bg-muted/30">
            <div className="container mx-auto px-4 max-w-3xl">
              <h2 className="text-3xl font-bold text-center mb-4">¿Por qué YouWhole y no otro ERP?</h2>
              <p className="text-muted-foreground text-center mb-10">
                Hay muchos programas de facturación. Pero muy pocos pensados para autónomos españoles de verdad.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border rounded-xl overflow-hidden">
                  <thead>
                    <tr className="bg-muted text-left">
                      <th className="px-4 py-3 font-medium">Característica</th>
                      <th className="px-4 py-3 font-medium text-primary">YouWhole</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">Otros ERPs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {[
                      ["VeriFactu certificado AEAT", "Incluido en todos los planes", "Solo en planes caros o no incluido"],
                      ["IRPF automático", "Sí, por defecto", "Manual o no disponible"],
                      ["Modelo 130/303 integrado", "Datos generados automáticamente", "Export manual o módulo extra"],
                      ["Precio base", "Gratis / 29 EUR/mes", "Desde 30-80 EUR/mes"],
                      ["Soporte en español", "Chat y email en horario español", "Ticketing internacional"],
                      ["Sin permanencia", "Sí, cancela cuando quieras", "Contratos anuales habituales"],
                    ].map(([feat, yw, other]) => (
                      <tr key={feat} className="bg-background">
                        <td className="px-4 py-3 font-medium">{feat}</td>
                        <td className="px-4 py-3 text-primary">{yw}</td>
                        <td className="px-4 py-3 text-muted-foreground">{other}</td>
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
              <h2 className="text-3xl font-bold text-center mb-10">Preguntas frecuentes</h2>
              <div className="space-y-6">
                {FAQS.map((faq) => (
                  <div key={faq.q} className="rounded-xl border p-6">
                    <h3 className="font-semibold mb-2">{faq.q}</h3>
                    <p className="text-sm text-muted-foreground">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Pricing */}
          <section className="py-20 bg-muted/30">
            <div className="container mx-auto px-4 max-w-5xl text-center">
              <h2 className="text-3xl font-bold mb-4">Precios pensados para autónomos</h2>
              <p className="text-muted-foreground mb-12">Sin letra pequeña. Empieza gratis y escala cuando lo necesites.</p>
              <PricingCards />
            </div>
          </section>

          {/* CTA final */}
          <section className="py-24 bg-primary/5 border-t">
            <div className="container mx-auto px-4 text-center max-w-xl">
              <h2 className="text-3xl font-bold mb-4">Pruébalo gratis durante 14 días</h2>
              <p className="text-muted-foreground mb-8">Sin tarjeta de crédito. Sin permanencia. Sin letra pequeña.</p>
              <Link
                href="/es/registro"
                className="inline-flex items-center justify-center rounded-xl px-10 py-4 text-base font-semibold text-white bg-primary hover:bg-primary/90 transition-all"
              >
                Crear mi cuenta gratis
              </Link>
            </div>
          </section>
        </main>

        <MarketingFooter />
      </div>
    </>
  );
}
