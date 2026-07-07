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
      name: "¿YouWhole lleva la contabilidad automáticamente?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sí. Cada factura emitida y recibida genera automáticamente el asiento contable correspondiente según el Plan General Contable español. No necesitas introducir los asientos manualmente.",
      },
    },
    {
      "@type": "Question",
      name: "¿Necesito saber contabilidad para usar YouWhole?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. YouWhole genera todos los asientos contables de forma automática. Tú solo introduces las facturas y cobros, y el sistema hace el resto. Para casos complejos, puedes dar acceso a tu asesor contable.",
      },
    },
    {
      "@type": "Question",
      name: "¿Puedo dar acceso a mi gestor o asesor contable?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sí. YouWhole permite invitar a tu asesor con rol de Contable. Tendrá acceso a la contabilidad, facturas y datos fiscales sin poder modificar configuraciones sensibles de la empresa.",
      },
    },
    {
      "@type": "Question",
      name: "¿Cumple con el Plan General Contable español?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sí. YouWhole genera asientos según el PGC (Plan General Contable) español vigente, con los códigos de cuenta correspondientes para cada tipo de operación: ventas, compras, IVA, IRPF y gastos.",
      },
    },
  ],
};

export const metadata: Metadata = {
  title: "Software de Contabilidad para Pymes España — YouWhole",
  description:
    "Contabilidad automática según el PGC español. Asientos automáticos, balance, cuenta de pérdidas y ganancias, e IVA integrado con facturación. Para pymes y autónomos. Desde 29 EUR/mes.",
  keywords: [
    "software contabilidad pymes España",
    "programa contabilidad autónomos",
    "contabilidad PGC automática",
    "software contable pymes",
    "contabilidad online pymes España",
    "programa asientos contables pymes",
    "software contabilidad ERP España",
  ],
  alternates: { canonical: `${APP_URL}/software-contabilidad-pymes` },
  openGraph: {
    title: "Software Contabilidad Pymes — YouWhole",
    description: "Asientos automáticos según el PGC español. Integrado con facturación VeriFactu. Sin conocimientos contables.",
    url: `${APP_URL}/software-contabilidad-pymes`,
  },
};

export default function SoftwareContabilidadPage() {
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
                Contabilidad automática PGC
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
                Software de contabilidad para pymes
                <span className="text-primary"> que se lleva sola</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                YouWhole genera los asientos contables automáticamente según el Plan General Contable español.
                Tú emites facturas — la contabilidad se hace sola, sin errores, sin conocimientos previos.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/es/registro"
                  className="inline-flex items-center justify-center rounded-xl px-8 py-3.5 text-base font-semibold text-white bg-primary hover:bg-primary/90 transition-all"
                >
                  Probar gratis 14 días
                </Link>
                <Link
                  href="/contacto"
                  className="inline-flex items-center justify-center rounded-xl border px-8 py-3.5 text-base font-medium hover:bg-muted transition-all"
                >
                  Solicitar demo
                </Link>
              </div>
              <p className="text-sm text-muted-foreground mt-4">Sin permanencia · PGC español · Acceso para tu asesor</p>
            </div>
          </section>

          {/* Qué hace solo */}
          <section className="py-20 bg-background">
            <div className="container mx-auto px-4 max-w-5xl">
              <h2 className="text-3xl font-bold text-center mb-4">Qué hace YouWhole automáticamente</h2>
              <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
                No necesitas tocar la contabilidad. Estos procesos ocurren solos cuando usas la plataforma.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { title: "Asientos de ventas", desc: "Cada factura emitida genera el asiento de ingreso con su cuenta de IVA repercutido e IRPF retenido." },
                  { title: "Asientos de compras", desc: "Cada factura de proveedor registrada genera el asiento de gasto con IVA soportado deducible." },
                  { title: "Libro de IVA", desc: "El libro de IVA soportado y repercutido se genera automáticamente cada trimestre, listo para presentar." },
                  { title: "Balance y P&G", desc: "Consulta el balance de situación y la cuenta de pérdidas y ganancias en tiempo real, sin esperar al cierre." },
                  { title: "Conciliación bancaria", desc: "Conecta tu banco y concilia cobros y pagos con las facturas pendientes automáticamente." },
                  { title: "Acceso del asesor", desc: "Invita a tu gestor con rol Contable para que acceda a los datos sin tocar la configuración de tu empresa." },
                ].map((f) => (
                  <div key={f.title} className="rounded-xl border bg-card p-6 space-y-2">
                    <h3 className="font-semibold text-lg">{f.title}</h3>
                    <p className="text-sm text-muted-foreground">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* PGC */}
          <section className="py-20 bg-muted/30">
            <div className="container mx-auto px-4 max-w-3xl">
              <h2 className="text-3xl font-bold text-center mb-4">Cumple con el PGC español sin esfuerzo</h2>
              <p className="text-muted-foreground text-center mb-10">
                El Plan General Contable español define cómo deben registrarse las operaciones contables.
                YouWhole lo aplica automáticamente en cada operación.
              </p>
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted text-left">
                      <th className="px-5 py-4 font-medium">Operación</th>
                      <th className="px-5 py-4 font-medium">Cuenta PGC</th>
                      <th className="px-5 py-4 font-medium text-primary">Automático</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {[
                      ["Factura de venta", "700 – Ventas", "Sí"],
                      ["IVA repercutido", "477 – HP IVA repercutido", "Sí"],
                      ["IRPF retenido", "473 – HP retenciones IRPF", "Sí"],
                      ["Factura de compra", "600/620/621 – Compras y gastos", "Sí"],
                      ["IVA soportado", "472 – HP IVA soportado", "Sí"],
                      ["Cobro de cliente", "430/570 – Clientes y Tesorería", "Sí"],
                    ].map(([op, cuenta, auto]) => (
                      <tr key={op} className="bg-background">
                        <td className="px-5 py-4 font-medium">{op}</td>
                        <td className="px-5 py-4 text-muted-foreground font-mono text-xs">{cuenta}</td>
                        <td className="px-5 py-4 text-emerald-600 font-semibold">{auto}</td>
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
              <h2 className="text-3xl font-bold mb-4">La contabilidad de tu pyme, en piloto automático</h2>
              <p className="text-muted-foreground mb-8">14 días gratis. Sin tarjeta. Sin conocimientos contables necesarios.</p>
              <Link
                href="/es/registro"
                className="inline-flex items-center justify-center rounded-xl px-10 py-4 text-base font-semibold text-white bg-primary hover:bg-primary/90 transition-all"
              >
                Empezar gratis ahora
              </Link>
            </div>
          </section>
        </main>

        <MarketingFooter />
      </div>
    </>
  );
}
