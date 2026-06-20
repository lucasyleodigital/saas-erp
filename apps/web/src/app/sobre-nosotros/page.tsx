import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { MarketingFooter } from "@/components/marketing/footer";

export const metadata: Metadata = {
  title: "Sobre nosotros — YouWhole",
  description: "Conoce la historia detrás de YouWhole, el ERP todo en uno creado por y para pymes españolas.",
};

const VALUES = [
  {
    icon: "💡",
    title: "Nacido de la experiencia real",
    description:
      "YouWhole no lo diseñó alguien en un laboratorio. Lo construimos después de trabajar codo a codo con decenas de pymes que pagaban 5 o 6 suscripciones distintas para gestionar su negocio.",
  },
  {
    icon: "🎯",
    title: "Simplicidad ante todo",
    description:
      "Creemos que la tecnología debe simplificar, no complicar. Por eso YouWhole tiene todo lo que necesitas y nada de lo que no necesitas. Sin tecnicismos, sin curvas de aprendizaje imposibles.",
  },
  {
    icon: "🤝",
    title: "Honestidad y transparencia",
    description:
      "Sin comisiones ocultas, sin contratos de permanencia, sin letras pequeñas. Precio fijo, cancelación cuando quieras. Así de sencillo.",
  },
  {
    icon: "🚀",
    title: "Resultados medibles",
    description:
      "No vendemos promesas. Vendemos herramientas que ahorran tiempo real: menos horas en papeleo, menos errores en facturas, menos dinero perdido en apps que no se hablan entre sí.",
  },
];

const STATS = [
  { value: "1 sola app", label: "para gestionar toda tu empresa" },
  { value: "29€/mes", label: "precio de entrada, sin sorpresas" },
  { value: "99.5%", label: "de disponibilidad garantizada" },
  { value: "24h", label: "tiempo máximo de respuesta de soporte" },
];

export default function SobreNosotrosPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border py-4 px-6 flex items-center justify-between">
        <Link href="/">
          <Image src="/logo.png" alt="YouWhole" width={120} height={34} className="object-contain" />
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/contacto" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Contacto
          </Link>
          <Link
            href="/registro"
            className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Prueba gratis
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="container mx-auto px-4 py-20 max-w-4xl text-center">
          <span className="inline-block text-xs font-medium bg-primary/10 text-primary px-3 py-1 rounded-full mb-6">
            Nuestra historia
          </span>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Creado por una pyme,<br />
            <span className="text-primary">para todas las pymes</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Somos <strong className="text-foreground">Lucas y Leo Digital</strong>, una agencia de transformación
            digital con base en Barcelona. Llevamos años ayudando a pequeños negocios y pymes a ordenar su presencia
            online y su estrategia digital — y en ese camino descubrimos el problema que queríamos resolver.
          </p>
        </section>

        {/* Story */}
        <section className="bg-muted/20 border-y border-border py-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="space-y-6 text-muted-foreground leading-relaxed">
              <p className="text-base">
                Trabajando con nuestros clientes, veíamos siempre el mismo patrón:{" "}
                <strong className="text-foreground">
                  una app para facturar, otra para el CRM, otra para el inventario, otra para los empleados, otra para
                  la contabilidad…
                </strong>{" "}
                Cinco suscripciones, cinco logins, cinco bases de datos que no se hablan entre sí. Y al final del mes,
                una factura de tecnología que no le deberían deber a nadie.
              </p>
              <p className="text-base">
                La pregunta era obvia: ¿por qué no existe una sola herramienta que lo haga todo, diseñada específicamente
                para el mercado español, con VeriFactu incluido, a un precio que una pyme pueda permitirse?
              </p>
              <p className="text-base">
                Así nació <strong className="text-foreground">YouWhole</strong>. El nombre lo dice todo:{" "}
                <em>«el todo»</em>. Facturación, CRM, presupuestos, albaranes, inventario, RRHH, contabilidad y
                VeriFactu en una sola plataforma, con una sola suscripción, desde{" "}
                <strong className="text-foreground">29€ al mes</strong>.
              </p>
              <p className="text-base">
                Operamos desde <strong className="text-foreground">Barcelona</strong> y damos servicio a empresas de
                toda España. No somos una multinacional con miles de empleados — somos un equipo pequeño, con las manos
                en la masa cada día, que entiende exactamente los problemas que tiene una pyme porque los hemos vivido
                en primera persona.
              </p>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="container mx-auto px-4 py-16 max-w-4xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center p-6 border border-border rounded-xl bg-background">
                <p className="text-2xl font-bold text-primary mb-1">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Values */}
        <section className="bg-muted/20 border-y border-border py-20">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl font-bold text-center mb-12">Lo que nos define</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {VALUES.map((v) => (
                <div key={v.title} className="bg-background border border-border rounded-xl p-6">
                  <span className="text-2xl mb-3 block">{v.icon}</span>
                  <h3 className="font-semibold text-foreground mb-2">{v.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{v.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="container mx-auto px-4 py-20 max-w-3xl text-center">
          <h2 className="text-2xl font-bold mb-4">Detrás de YouWhole</h2>
          <p className="text-muted-foreground leading-relaxed mb-8">
            YouWhole es un proyecto de{" "}
            <a
              href="https://lucasyleodigital.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Lucas y Leo Digital
            </a>
            , la agencia de transformación digital con base en Barcelona especializada en ayudar a pymes a crecer de
            forma inteligente, sin tecnicismos y con resultados reales. Si quieres saber más sobre nosotros como agencia,
            visita nuestra web.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/registro"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Empieza gratis hoy
            </Link>
            <Link
              href="/contacto"
              className="inline-flex items-center justify-center rounded-lg border border-border px-6 py-3 text-sm font-medium hover:bg-muted/50 transition-colors"
            >
              Habla con nosotros
            </Link>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
