import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://youwhole.com";

export const metadata: Metadata = {
  title: "Software de Nóminas para Pymes España — YouWhole",
  description:
    "Genera nóminas automáticas con IRPF y Seguridad Social calculados. Software de nóminas para pymes español integrado con control horario y contabilidad. Desde 29 EUR/mes.",
  keywords: [
    "software nóminas pymes España",
    "programa nóminas empleados",
    "gestión nóminas pymes",
    "nóminas automáticas España",
    "software RRHH nóminas",
    "calcular nóminas empleados",
    "programa nóminas autónomos con empleados",
  ],
  alternates: { canonical: `${APP_URL}/software-nominas-pymes` },
  openGraph: {
    title: "Software Nóminas Pymes — YouWhole",
    description: "Nóminas automáticas con IRPF y SS calculados. Integrado con control horario y contabilidad.",
    url: `${APP_URL}/software-nominas-pymes`,
  },
};

const FEATURES = [
  { title: "Cálculo automático de IRPF", desc: "YouWhole calcula la retención IRPF de cada empleado según su situación personal y el tramo que le corresponde." },
  { title: "Seguridad Social", desc: "Cotizaciones a la Seguridad Social calculadas automáticamente por contingencias comunes, desempleo y formación." },
  { title: "Nómina mensual en segundos", desc: "Con los datos del contrato y las horas trabajadas, la nómina de cada empleado se genera en un clic." },
  { title: "Integrado con control horario", desc: "Las horas registradas alimentan directamente la nómina. Las horas extra se calculan y aplican automáticamente." },
  { title: "Portal del empleado", desc: "Cada empleado accede a sus nóminas históricas desde su cuenta. Sin imprimir, sin enviar por email." },
  { title: "Exportación para gestor laboral", desc: "Exporta todas las nóminas en formato estándar para que tu gestor laboral las valide antes de presentarlas a la SS." },
];

export default function SoftwareNominasPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <MarketingNav />

      <main className="flex-1">
        {/* Hero */}
        <section className="py-24 bg-gradient-to-b from-background to-muted/30">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium mb-6 text-primary border-primary/30 bg-primary/5">
              Nóminas integradas con RRHH
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
              Software de nóminas para pymes
              <span className="text-primary"> sin errores de cálculo</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              YouWhole calcula automáticamente el IRPF y la Seguridad Social de cada empleado.
              Genera nóminas en segundos, integradas con el control horario y la contabilidad.
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
            <p className="text-sm text-muted-foreground mt-4">Sin permanencia · IRPF y SS automáticos · Soporte en español</p>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-3xl font-bold text-center mb-4">Nóminas sin complicaciones</h2>
            <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
              Diseñado para gestores que necesitan procesar nóminas rápido, sin ser expertos en derecho laboral.
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

        {/* Proceso */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold text-center mb-10">Cómo funciona el proceso de nóminas</h2>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
              {[
                { n: "1", t: "Configuras el contrato", d: "Introduces el salario bruto, tipo de contrato, IRPF aplicable y datos de la SS del empleado." },
                { n: "2", t: "Empleado ficha sus horas", d: "El control horario registra automáticamente las horas trabajadas cada día del mes." },
                { n: "3", t: "Generas la nómina", d: "Con un clic, YouWhole calcula la nómina completa: bruto, deducciones, IRPF, SS y neto." },
                { n: "4", t: "Empleado la consulta", d: "El empleado accede a su nómina desde el portal. Tú la exportas para el gestor laboral." },
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

        {/* CTA */}
        <section className="py-24 bg-primary/5 border-t">
          <div className="container mx-auto px-4 text-center max-w-xl">
            <h2 className="text-3xl font-bold mb-4">Nóminas listas en minutos cada mes</h2>
            <p className="text-muted-foreground mb-8">14 días gratis. Sin tarjeta. IRPF y SS calculados automáticamente.</p>
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
  );
}
