import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://youwhole.com";

export const metadata: Metadata = {
  title: "Alternativa a Holded para Autónomos y Pymes — YouWhole",
  description:
    "¿Buscas una alternativa a Holded más completa y asequible? YouWhole incluye VeriFactu certificado, IRPF automático, Modelo 130/303 y soporte en español. Desde 29 EUR/mes.",
  keywords: [
    "alternativa holded",
    "alternativa holded autónomos",
    "mejor que holded",
    "holded vs youwhole",
    "ERP autónomos España alternativa",
    "software facturación alternativa holded",
  ],
  alternates: { canonical: `${APP_URL}/alternativa-holded` },
  openGraph: {
    title: "Alternativa a Holded — YouWhole",
    description: "Más completo que Holded para el mercado español. VeriFactu, IRPF, Modelo 130/303 y soporte nativo en español.",
    url: `${APP_URL}/alternativa-holded`,
  },
};

const COMPARISON = [
  { feat: "VeriFactu certificado AEAT", yw: true, holded: false, note: "Holded no tiene VeriFactu nativo" },
  { feat: "IRPF automático para autónomos", yw: true, holded: false, note: "En Holded es configuración manual" },
  { feat: "Modelo 130/303 integrado", yw: true, holded: false, note: "Holded requiere módulo contable extra" },
  { feat: "Plan gratuito real", yw: true, holded: false, note: "Holded no tiene plan gratuito permanente" },
  { feat: "Precio base mensual", yw: "29 EUR", holded: "desde 49 EUR", note: "" },
  { feat: "Soporte en español nativo", yw: true, holded: true, note: "" },
  { feat: "Sin permanencia", yw: true, holded: false, note: "Holded cobra anual por defecto" },
  { feat: "Múltiples idiomas (ca, eu, gl)", yw: true, holded: false, note: "YouWhole soporta 5 idiomas peninsulares" },
  { feat: "Control horario empleados", yw: true, holded: true, note: "" },
  { feat: "Portal de empleado", yw: true, holded: true, note: "" },
];

export default function AlternativaHoldedPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <MarketingNav />

      <main className="flex-1">
        {/* Hero */}
        <section className="py-24 bg-gradient-to-b from-background to-muted/30">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium mb-6 text-primary border-primary/30 bg-primary/5">
              Comparativa honesta
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
              La alternativa a Holded que
              <span className="text-primary"> sí cumple con Hacienda</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              YouWhole incluye VeriFactu certificado, IRPF automático y Modelo 130/303 de serie.
              Sin módulos extra. Sin sorpresas en la factura.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/es/registro"
                className="inline-flex items-center justify-center rounded-xl px-8 py-3.5 text-base font-semibold text-white bg-primary hover:bg-primary/90 transition-all"
              >
                Probar YouWhole gratis
              </Link>
              <Link
                href="/contacto"
                className="inline-flex items-center justify-center rounded-xl border px-8 py-3.5 text-base font-medium hover:bg-muted transition-all"
              >
                Hablar con el equipo
              </Link>
            </div>
            <p className="text-sm text-muted-foreground mt-4">14 días gratis · Sin tarjeta · Migración asistida desde Holded</p>
          </div>
        </section>

        {/* Tabla comparativa */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold text-center mb-4">YouWhole vs Holded</h2>
            <p className="text-muted-foreground text-center mb-10">Comparativa de características para autónomos y pymes españolas</p>
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted text-left">
                    <th className="px-5 py-4 font-medium">Característica</th>
                    <th className="px-5 py-4 font-medium text-primary">YouWhole</th>
                    <th className="px-5 py-4 font-medium text-muted-foreground">Holded</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {COMPARISON.map((row) => (
                    <tr key={row.feat} className="bg-background hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-4">
                        <span className="font-medium">{row.feat}</span>
                        {row.note && <span className="block text-xs text-muted-foreground mt-0.5">{row.note}</span>}
                      </td>
                      <td className="px-5 py-4">
                        {typeof row.yw === "boolean" ? (
                          row.yw ? <span className="text-emerald-600 font-semibold">Incluido</span> : <span className="text-destructive">No</span>
                        ) : (
                          <span className="text-primary font-semibold">{row.yw}</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {typeof row.holded === "boolean" ? (
                          row.holded ? <span className="text-emerald-600">Sí</span> : <span className="text-muted-foreground">No disponible</span>
                        ) : (
                          <span className="text-muted-foreground">{row.holded}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-4">Información basada en los planes publicados. Actualizado julio 2026.</p>
          </div>
        </section>

        {/* Migración */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <h2 className="text-3xl font-bold mb-4">Migra desde Holded sin perder tus datos</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Importa tus clientes, facturas y productos desde Holded en minutos.
              Nuestro equipo te ayuda a hacer la transición sin interrupciones.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left mb-10">
              {[
                { n: "1", t: "Exporta desde Holded", d: "Descarga tus datos en CSV o Excel desde el panel de Holded." },
                { n: "2", t: "Importa en YouWhole", d: "Usa nuestro importador para cargar clientes, productos y facturas." },
                { n: "3", t: "Listo para facturar", d: "Tu empresa operativa en YouWhole en menos de 1 hora." },
              ].map((step) => (
                <div key={step.n} className="rounded-xl border bg-background p-5">
                  <div className="text-2xl font-bold text-primary mb-2">{step.n}</div>
                  <div className="font-semibold mb-1">{step.t}</div>
                  <div className="text-sm text-muted-foreground">{step.d}</div>
                </div>
              ))}
            </div>
            <Link
              href="/es/registro"
              className="inline-flex items-center justify-center rounded-xl px-10 py-4 text-base font-semibold text-white bg-primary hover:bg-primary/90 transition-all"
            >
              Empezar migración gratis
            </Link>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
