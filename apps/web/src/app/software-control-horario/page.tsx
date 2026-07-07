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
      name: "¿Es obligatorio el control horario en España?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sí. El Real Decreto-ley 8/2019 obliga a todas las empresas españolas a registrar la jornada laboral de sus empleados, independientemente de su tamaño. El incumplimiento puede conllevar multas de hasta 6.250 EUR por trabajador.",
      },
    },
    {
      "@type": "Question",
      name: "¿Cómo fichan los empleados con YouWhole?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Los empleados pueden fichar desde la app web en el móvil con GPS activado, desde un código QR en la oficina, o el administrador puede registrar las horas manualmente. Todas las opciones quedan registradas con timestamp.",
      },
    },
    {
      "@type": "Question",
      name: "¿Se puede exportar el registro horario?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sí. YouWhole permite exportar el registro de horas en formato Excel o CSV, filtrado por empleado, proyecto o rango de fechas. Válido para inspecciones de trabajo y para tu gestor laboral.",
      },
    },
  ],
};

export const metadata: Metadata = {
  title: "Software de Control Horario para Empresas — YouWhole",
  description:
    "Control horario obligatorio para empresas españolas. Fichaje por GPS, QR o web. Exportación para inspección de trabajo. Integrado con nóminas y proyectos. Desde 29 EUR/mes.",
  keywords: [
    "software control horario empresas",
    "control horario empleados España",
    "fichaje digital empleados",
    "registro jornada laboral obligatorio",
    "control horario GPS",
    "app control horario pymes",
    "RD 8/2019 control horario",
  ],
  alternates: { canonical: `${APP_URL}/software-control-horario` },
  openGraph: {
    title: "Software Control Horario Empresas — YouWhole",
    description: "Fichaje GPS, QR y web. Cumple el RD 8/2019 sin complicaciones. Integrado con nóminas y proyectos.",
    url: `${APP_URL}/software-control-horario`,
  },
};

export default function ControlHorarioPage() {
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
                Obligatorio desde 2019
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
                Control horario digital
                <span className="text-primary"> que cumple la ley española</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                El RD 8/2019 obliga a registrar la jornada de todos tus empleados.
                YouWhole lo hace automáticamente con GPS, QR o web — integrado con nóminas y proyectos.
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
                  Ver demo
                </Link>
              </div>
              <p className="text-sm text-muted-foreground mt-4">Sin permanencia · Cumple RD 8/2019 · Integrado con nóminas</p>
            </div>
          </section>

          {/* Métodos de fichaje */}
          <section className="py-20 bg-background">
            <div className="container mx-auto px-4 max-w-4xl">
              <h2 className="text-3xl font-bold text-center mb-4">3 formas de fichar, tú eliges</h2>
              <p className="text-muted-foreground text-center mb-12">Adaptado a oficinas, teletrabajo y trabajo en campo.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  { t: "App web con GPS", d: "El empleado abre YouWhole en el móvil y ficha. La ubicación GPS queda registrada automáticamente para trabajo en campo o teletrabajo.", badge: "Más usado" },
                  { t: "Código QR en oficina", d: "Imprime un QR en la entrada de la oficina. Los empleados lo escanean con el móvil para fichar entrada y salida sin tocar nada más.", badge: "Para oficinas" },
                  { t: "Registro manual", d: "El administrador puede registrar horas manualmente para empleados sin smartphone o para corregir fichajes erróneos.", badge: "Backup" },
                ].map((m) => (
                  <div key={m.t} className="rounded-xl border bg-card p-6 space-y-3">
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">{m.badge}</span>
                    <h3 className="font-semibold text-lg">{m.t}</h3>
                    <p className="text-sm text-muted-foreground">{m.d}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Integración */}
          <section className="py-20 bg-muted/30">
            <div className="container mx-auto px-4 max-w-4xl">
              <h2 className="text-3xl font-bold text-center mb-4">Integrado con el resto de tu empresa</h2>
              <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
                El control horario de YouWhole no es un módulo aislado. Se conecta con nóminas, proyectos y facturación.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {[
                  { t: "Horas → Nóminas", d: "Las horas registradas alimentan directamente el cálculo de nóminas. Las horas extra se calculan solas." },
                  { t: "Horas → Proyectos", d: "Asigna horas trabajadas a proyectos para calcular rentabilidad y facturar tiempo a clientes." },
                  { t: "Horas → Informes", d: "Exporta el registro de jornada por empleado, proyecto o fecha. Válido para inspecciones laborales." },
                  { t: "Alertas de incidencias", d: "Aviso automático cuando un empleado no ha fichado o cuando hay horas extra no autorizadas." },
                ].map((item) => (
                  <div key={item.t} className="rounded-xl border bg-background p-5">
                    <h3 className="font-semibold mb-1">{item.t}</h3>
                    <p className="text-sm text-muted-foreground">{item.d}</p>
                  </div>
                ))}
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
              <h2 className="text-3xl font-bold mb-4">Cumple la ley de control horario hoy</h2>
              <p className="text-muted-foreground mb-8">14 días gratis. Sin tarjeta. Activado desde el primer día.</p>
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
