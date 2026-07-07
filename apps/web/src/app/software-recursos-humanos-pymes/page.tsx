import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://youwhole.com";

export const metadata: Metadata = {
  title: "Software de Recursos Humanos para Pymes — YouWhole",
  description:
    "Gestiona empleados, nóminas, contratos, vacaciones y control horario en una sola plataforma. Software RRHH para pymes español, sin complicaciones. Desde 29 EUR/mes.",
  keywords: [
    "software recursos humanos pymes",
    "programa nóminas pymes España",
    "gestión empleados pymes",
    "software RRHH España",
    "control horario empleados",
    "gestión vacaciones empleados",
    "software nóminas autónomos",
  ],
  alternates: { canonical: `${APP_URL}/software-recursos-humanos-pymes` },
  openGraph: {
    title: "Software RRHH para Pymes — YouWhole",
    description: "Nóminas, contratos, vacaciones y control horario integrados con tu facturación. Todo en uno.",
    url: `${APP_URL}/software-recursos-humanos-pymes`,
  },
};

const FEATURES = [
  { title: "Nóminas automáticas", desc: "Genera nóminas mensuales con retenciones IRPF, Seguridad Social y deducciones calculadas automáticamente según el contrato." },
  { title: "Control horario con GPS", desc: "Los empleados fichan entrada y salida desde el móvil. Registro con geolocalización para cumplir la normativa laboral española." },
  { title: "Gestión de contratos", desc: "Almacena y gestiona todos los contratos laborales de tu equipo. Alertas de vencimiento y renovación automática." },
  { title: "Vacaciones y ausencias", desc: "Solicitud y aprobación de vacaciones digital. Calendario de equipo para planificar ausencias sin conflictos." },
  { title: "Portal del empleado", desc: "Cada empleado accede a sus nóminas, contratos y registro de horas desde su propia cuenta sin molestar a RRHH." },
  { title: "Horas por proyecto", desc: "Asigna horas trabajadas a proyectos específicos para calcular rentabilidad y facturar tiempo a clientes." },
];

export default function SoftwareRRHHPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <MarketingNav />

      <main className="flex-1">
        {/* Hero */}
        <section className="py-24 bg-gradient-to-b from-background to-muted/30">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium mb-6 text-primary border-primary/30 bg-primary/5">
              RRHH integrado con facturación
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
              Software de recursos humanos
              <span className="text-primary"> para pymes que no quieren complicaciones</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Nóminas, contratos, control horario, vacaciones y portal del empleado integrados
              con tu facturación. Todo en YouWhole, sin necesidad de otro programa de RRHH.
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
            <p className="text-sm text-muted-foreground mt-4">Sin permanencia · Soporte en español · Cumple normativa laboral española</p>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-3xl font-bold text-center mb-4">Todo el RRHH de tu pyme en un solo lugar</h2>
            <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
              Diseñado para gestores que no son expertos en RRHH pero necesitan tenerlo todo bajo control.
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

        {/* Normativa */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-3xl font-bold text-center mb-4">Cumple la normativa laboral española sin esfuerzo</h2>
            <p className="text-muted-foreground text-center mb-10 max-w-xl mx-auto">
              El control horario es obligatorio para todas las empresas en España desde 2019. YouWhole lo gestiona automáticamente.
            </p>
            <div className="space-y-4">
              {[
                { t: "Registro horario obligatorio (RD 8/2019)", d: "Todos los empleados deben fichar entrada y salida. YouWhole registra y almacena cada fichaje con timestamp y GPS." },
                { t: "Nóminas conformes al convenio", d: "Genera nóminas con todos los conceptos laborales: salario base, complementos, IRPF y cotizaciones a la SS." },
                { t: "Exportación para el asesor", d: "Exporta todos los datos de RRHH en formato estándar para que tu gestor laboral los use directamente." },
              ].map((item) => (
                <div key={item.t} className="rounded-xl border bg-background p-5">
                  <h3 className="font-semibold mb-1">{item.t}</h3>
                  <p className="text-sm text-muted-foreground">{item.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 bg-primary/5 border-t">
          <div className="container mx-auto px-4 text-center max-w-xl">
            <h2 className="text-3xl font-bold mb-4">RRHH bajo control desde el primer día</h2>
            <p className="text-muted-foreground mb-8">14 días gratis. Sin tarjeta. El módulo RRHH incluido en todos los planes.</p>
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
