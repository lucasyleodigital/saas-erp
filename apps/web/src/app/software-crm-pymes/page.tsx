import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://youwhole.com";

export const metadata: Metadata = {
  title: "Software CRM para Pymes España — YouWhole",
  description:
    "CRM integrado con facturación para pymes españolas. Gestiona clientes, leads, pipeline de ventas y presupuestos en una sola plataforma. Sin suscripciones extra. Desde 29 EUR/mes.",
  keywords: [
    "software CRM pymes España",
    "CRM pymes español",
    "programa CRM autónomos",
    "CRM integrado facturación",
    "gestión clientes pymes",
    "CRM ventas pymes España",
    "software ventas pymes",
  ],
  alternates: { canonical: `${APP_URL}/software-crm-pymes` },
  openGraph: {
    title: "Software CRM para Pymes — YouWhole",
    description: "Gestiona clientes, leads y ventas integrado con tu facturación. Sin herramientas externas.",
    url: `${APP_URL}/software-crm-pymes`,
  },
};

const FEATURES = [
  { title: "Gestión de clientes", desc: "Ficha completa de cada cliente con historial de facturas, presupuestos, contactos y notas. Todo en un solo lugar." },
  { title: "Pipeline de ventas Kanban", desc: "Visualiza tus oportunidades en un tablero Kanban. Arrastra deals entre etapas y cierra más ventas." },
  { title: "Leads y prospectos", desc: "Registra leads desde el primer contacto, asígnalos a un comercial y haz seguimiento hasta el cierre." },
  { title: "Presupuestos profesionales", desc: "Crea presupuestos con tu logo y conviértelos en facturas con un clic cuando el cliente diga sí." },
  { title: "Historial de comunicaciones", desc: "Registra llamadas, emails y reuniones por cliente. Nunca pierdas el hilo de una negociación." },
  { title: "Integrado con facturación", desc: "Del presupuesto a la factura VeriFactu en un clic. Sin exportar ni copiar datos entre programas." },
];

export default function SoftwareCrmPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <MarketingNav />

      <main className="flex-1">
        {/* Hero */}
        <section className="py-24 bg-gradient-to-b from-background to-muted/30">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium mb-6 text-primary border-primary/30 bg-primary/5">
              CRM integrado con facturación
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
              CRM para pymes que no quieren
              <span className="text-primary"> pagar por otra herramienta</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              YouWhole incluye un CRM completo integrado con tu facturación. Gestiona clientes,
              leads y pipeline de ventas sin salir de la plataforma — ni pagar una suscripción extra.
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
            <p className="text-sm text-muted-foreground mt-4">Sin permanencia · CRM incluido en todos los planes · Soporte en español</p>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-3xl font-bold text-center mb-4">Todo lo que necesita el CRM de tu pyme</h2>
            <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
              Sin la complejidad de Salesforce ni el precio de HubSpot. Diseñado para pymes reales.
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

        {/* Por qué integrado */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-3xl font-bold text-center mb-4">¿Por qué un CRM integrado con facturación?</h2>
            <p className="text-muted-foreground text-center mb-10 max-w-xl mx-auto">
              La mayoría de pymes usa 3-4 herramientas distintas que no se hablan entre sí. Con YouWhole todo está conectado.
            </p>
            <div className="space-y-4">
              {[
                { t: "Presupuesto → Factura en un clic", d: "Cuando el cliente acepta el presupuesto, se convierte en factura VeriFactu automáticamente. Sin copiar datos." },
                { t: "Cliente → Historial completo", d: "Desde la ficha del cliente ves todas sus facturas, presupuestos, pagos pendientes y comunicaciones anteriores." },
                { t: "Lead → Cliente → Factura", d: "El ciclo completo de venta en una sola plataforma: desde el primer contacto hasta el cobro de la factura." },
                { t: "Sin duplicar datos", d: "Los datos del cliente se comparten entre CRM, facturación, contabilidad y RRHH. Sin exportaciones ni copiar-pegar." },
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
            <h2 className="text-3xl font-bold mb-4">Empieza a vender más, desde hoy</h2>
            <p className="text-muted-foreground mb-8">CRM incluido en todos los planes. 14 días gratis sin tarjeta.</p>
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
