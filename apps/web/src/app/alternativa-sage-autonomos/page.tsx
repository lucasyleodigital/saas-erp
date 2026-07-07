import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://youwhole.com";

export const metadata: Metadata = {
  title: "Alternativa a Sage para Autónomos y Pymes — YouWhole",
  description:
    "¿Sage es demasiado caro o complejo para tu negocio? YouWhole es la alternativa moderna: VeriFactu certificado, IRPF automático, sin instalación y desde 29 EUR/mes.",
  keywords: [
    "alternativa sage autónomos",
    "alternativa sage pymes",
    "sage vs youwhole",
    "alternativa sage 50",
    "software facturación alternativa sage",
    "ERP barato alternativa sage",
  ],
  alternates: { canonical: `${APP_URL}/alternativa-sage-autonomos` },
  openGraph: {
    title: "Alternativa a Sage para Autónomos — YouWhole",
    description: "Más sencillo y asequible que Sage. VeriFactu incluido, sin instalación, desde 29 EUR/mes.",
    url: `${APP_URL}/alternativa-sage-autonomos`,
  },
};

const COMPARISON = [
  { feat: "VeriFactu certificado AEAT", yw: true, sage: false, note: "Sage requiere módulo adicional de pago" },
  { feat: "IRPF automático para autónomos", yw: true, sage: false, note: "En Sage es configuración manual" },
  { feat: "Basado en la nube (sin instalación)", yw: true, sage: false, note: "Sage 50 requiere instalación local" },
  { feat: "Plan gratuito disponible", yw: true, sage: false, note: "Sage no tiene plan gratuito" },
  { feat: "Precio base mensual", yw: "29 EUR", sage: "desde 50 EUR", note: "" },
  { feat: "Actualizaciones automáticas", yw: true, sage: false, note: "Sage requiere comprar nuevas versiones" },
  { feat: "Multi-idioma (ca, eu, gl)", yw: true, sage: false, note: "YouWhole soporta 5 idiomas peninsulares" },
  { feat: "Soporte en español", yw: true, sage: true, note: "" },
  { feat: "Sin permanencia", yw: true, sage: false, note: "Sage cobra licencias anuales" },
  { feat: "Acceso desde móvil", yw: true, sage: false, note: "Sage 50 no tiene app móvil nativa" },
];

export default function AlternativaSagePage() {
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
              La alternativa a Sage que
              <span className="text-primary"> no requiere instalación</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              YouWhole es 100% en la nube, incluye VeriFactu certificado y cuesta menos que Sage.
              Sin instalaciones, sin versiones desactualizadas, sin sorpresas.
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
            <p className="text-sm text-muted-foreground mt-4">14 días gratis · Sin tarjeta · Migración asistida desde Sage</p>
          </div>
        </section>

        {/* Por qué cambiar */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold text-center mb-4">¿Por qué los autónomos abandonan Sage?</h2>
            <p className="text-muted-foreground text-center mb-10 max-w-xl mx-auto">
              Sage lleva décadas en el mercado, pero fue diseñado para otra época. Estas son las quejas más habituales.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { t: "Instalación local", d: "Sage 50 requiere instalar software en cada ordenador. Si cambias de equipo o trabajas en remoto, tienes un problema." },
                { t: "Sin VeriFactu nativo", d: "Cumplir con la normativa AEAT 2025 requiere un módulo adicional de pago que Sage no incluye por defecto." },
                { t: "Precio de licencias", d: "Las licencias anuales de Sage se acumulan. Para una pyme pequeña, el coste es difícil de justificar." },
                { t: "Curva de aprendizaje alta", d: "Sage fue diseñado para contables profesionales. Un autónomo sin formación contable lo encuentra innecesariamente complejo." },
                { t: "Sin app móvil real", d: "Consultar una factura o registrar un gasto desde el móvil es prácticamente imposible con Sage 50." },
                { t: "Actualizaciones de pago", d: "Cada nueva versión de Sage requiere pagar la actualización. Con YouWhole, las actualizaciones son automáticas e incluidas." },
              ].map((item) => (
                <div key={item.t} className="rounded-xl border bg-card p-5 space-y-2">
                  <h3 className="font-semibold">{item.t}</h3>
                  <p className="text-sm text-muted-foreground">{item.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tabla comparativa */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold text-center mb-4">YouWhole vs Sage</h2>
            <p className="text-muted-foreground text-center mb-10">Comparativa de características para autónomos y pymes</p>
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted text-left">
                    <th className="px-5 py-4 font-medium">Característica</th>
                    <th className="px-5 py-4 font-medium text-primary">YouWhole</th>
                    <th className="px-5 py-4 font-medium text-muted-foreground">Sage</th>
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
                        {typeof row.sage === "boolean" ? (
                          row.sage ? <span className="text-emerald-600">Sí</span> : <span className="text-muted-foreground">No disponible</span>
                        ) : (
                          <span className="text-muted-foreground">{row.sage}</span>
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
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <h2 className="text-3xl font-bold mb-4">Migra desde Sage sin perder tus datos</h2>
            <p className="text-muted-foreground mb-10 max-w-xl mx-auto">
              Exporta tus clientes, productos y facturas desde Sage e impórtalos en YouWhole en minutos.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left mb-10">
              {[
                { n: "1", t: "Exporta desde Sage", d: "Exporta clientes, productos y facturas en CSV o Excel desde el panel de Sage." },
                { n: "2", t: "Importa en YouWhole", d: "Usa nuestro importador para cargar todos tus datos en minutos." },
                { n: "3", t: "Listo para facturar", d: "Tu empresa operativa en YouWhole con VeriFactu activado desde el primer día." },
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

        {/* CTA */}
        <section className="py-24 bg-primary/5 border-t">
          <div className="container mx-auto px-4 text-center max-w-xl">
            <h2 className="text-3xl font-bold mb-4">Deja Sage. Empieza gratis hoy.</h2>
            <p className="text-muted-foreground mb-8">Sin tarjeta. Sin permanencia. Con VeriFactu incluido desde el primer día.</p>
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
  );
}
