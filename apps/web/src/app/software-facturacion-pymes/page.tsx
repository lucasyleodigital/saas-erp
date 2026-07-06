import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";
import { PricingCards } from "@/components/billing/pricing-cards";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://youwhole.com";

export const metadata: Metadata = {
  title: "Software de Facturación para Pymes — YouWhole",
  description:
    "Software de facturación para pymes españolas con VeriFactu certificado, contabilidad PGC, nóminas, CRM y gestión de proyectos. Todo en uno. Desde 29 EUR/mes sin permanencia.",
  keywords: [
    "software facturación pymes",
    "programa facturación España",
    "software gestión pymes",
    "ERP pymes España",
    "facturación electrónica pymes",
    "software contabilidad pymes",
    "programa nóminas pymes",
  ],
  alternates: { canonical: `${APP_URL}/software-facturacion-pymes` },
  openGraph: {
    title: "Software de Facturación para Pymes — YouWhole",
    description: "Todo lo que necesita tu pyme: facturación VeriFactu, nóminas, CRM, contabilidad PGC y más. Desde 29 EUR/mes.",
    url: `${APP_URL}/software-facturacion-pymes`,
  },
};

const MODULES = [
  { title: "Facturación con VeriFactu", desc: "Emite facturas certificadas AEAT. Incluye facturas recurrentes, multi-divisa y en varios idiomas (es, ca, eu, gl, en)." },
  { title: "Contabilidad PGC", desc: "Asientos automáticos según el Plan General Contable español. Cuadre contable en tiempo real sin conocimientos previos." },
  { title: "Nóminas y RRHH", desc: "Genera nóminas, gestiona contratos y controla el tiempo de trabajo de cada empleado por proyecto." },
  { title: "CRM y ventas", desc: "Gestiona tu pipeline de ventas con Kanban, registra oportunidades y convierte presupuestos en facturas." },
  { title: "Gestión de proyectos", desc: "Controla la rentabilidad de cada proyecto, asigna empleados y factura el tiempo trabajado." },
  { title: "Inventario y almacén", desc: "Controla el stock, gestiona proveedores y genera pedidos de compra automáticos cuando el inventario baja." },
  { title: "Banco y conciliación", desc: "Conecta tu cuenta bancaria y concilia automáticamente cobros y pagos con tus facturas." },
  { title: "Automatizaciones", desc: "Recordatorios de impago, facturas recurrentes, alertas de stock y flujos personalizados sin código." },
];

export default function SoftwareFacturacionPymesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <MarketingNav />

      <main className="flex-1">
        {/* Hero */}
        <section className="py-24 bg-gradient-to-b from-background to-muted/30">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium mb-6 text-primary border-primary/30 bg-primary/5">
              Todo en uno para pymes
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
              Software de facturación para pymes
              <span className="text-primary"> que va más allá de las facturas</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              YouWhole reúne en una sola plataforma todo lo que necesita tu pyme: facturación VeriFactu,
              contabilidad, nóminas, CRM, inventario y proyectos. Sin integraciones. Sin sorpresas.
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
                Solicitar demo para mi pyme
              </Link>
            </div>
            <p className="text-sm text-muted-foreground mt-4">Sin permanencia · Soporte en español · Migración asistida</p>
          </div>
        </section>

        {/* Módulos */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-3xl font-bold text-center mb-4">8 módulos integrados en una sola plataforma</h2>
            <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
              Olvídate de conectar 5 programas distintos. YouWhole lo tiene todo y comparte los datos entre módulos automáticamente.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {MODULES.map((m) => (
                <div key={m.title} className="rounded-xl border bg-card p-5 space-y-2">
                  <h3 className="font-semibold">{m.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Para quién es */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold text-center mb-10">¿Para qué tipo de pyme es YouWhole?</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                "Agencias y consultoras",
                "Empresas de servicios",
                "Comercios y tiendas",
                "Constructoras y reformas",
                "Hostelería y restauración",
                "Tecnología y startups",
                "Clínicas y salud",
                "Transporte y logística",
                "Educación y formación",
              ].map((sector) => (
                <div key={sector} className="rounded-lg border bg-background px-4 py-3 text-sm font-medium text-center">
                  {sector}
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground mt-6">
              ¿Tu sector no aparece?{" "}
              <Link href="/contacto" className="text-primary underline hover:text-primary/80">
                Escríbenos y te contamos cómo YouWhole se adapta a tu negocio
              </Link>
            </p>
          </div>
        </section>

        {/* Precios */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4 max-w-5xl text-center">
            <h2 className="text-3xl font-bold mb-4">Precios para pymes de cualquier tamaño</h2>
            <p className="text-muted-foreground mb-12">Sin costes ocultos. Sin permanencia. Escala cuando lo necesites.</p>
            <PricingCards />
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 bg-primary/5 border-t">
          <div className="container mx-auto px-4 text-center max-w-xl">
            <h2 className="text-3xl font-bold mb-4">¿Tu pyme lista para el siguiente nivel?</h2>
            <p className="text-muted-foreground mb-8">14 días gratis. Sin tarjeta. El equipo te ayuda con la migración.</p>
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
