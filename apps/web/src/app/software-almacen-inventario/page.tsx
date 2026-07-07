import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://youwhole.com";

export const metadata: Metadata = {
  title: "Software de Almacén e Inventario para Pymes — YouWhole",
  description:
    "Controla tu stock en tiempo real, gestiona proveedores y genera pedidos automáticos. Software de almacén e inventario integrado con facturación. Desde 29 EUR/mes.",
  keywords: [
    "software almacén pymes",
    "programa gestión inventario España",
    "control stock pymes",
    "software inventario proveedores",
    "gestión almacén ERP España",
    "programa stock pymes",
    "control inventario tiempo real",
  ],
  alternates: { canonical: `${APP_URL}/software-almacen-inventario` },
  openGraph: {
    title: "Software Almacén e Inventario Pymes — YouWhole",
    description: "Stock en tiempo real, pedidos automáticos y gestión de proveedores integrados con tu facturación.",
    url: `${APP_URL}/software-almacen-inventario`,
  },
};

const FEATURES = [
  { title: "Stock en tiempo real", desc: "Cada venta, compra o ajuste actualiza el inventario al instante. Nunca más vendas algo que no tienes." },
  { title: "Alertas de stock mínimo", desc: "Define el stock mínimo de cada producto. YouWhole te avisa automáticamente cuando toca reordenar." },
  { title: "Pedidos automáticos", desc: "Genera órdenes de compra a proveedores automáticamente cuando el stock baja del umbral que definas." },
  { title: "Gestión de proveedores", desc: "Registra precios, condiciones y plazos de cada proveedor. Compara costes y elige el mejor en cada pedido." },
  { title: "Múltiples almacenes", desc: "Gestiona varios almacenes o ubicaciones desde un solo panel. Transfiere stock entre ubicaciones con un clic." },
  { title: "Integrado con facturación", desc: "Cada factura de venta descuenta automáticamente el stock. Cada factura de compra lo incrementa." },
];

export default function SoftwareAlmacenPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <MarketingNav />

      <main className="flex-1">
        {/* Hero */}
        <section className="py-24 bg-gradient-to-b from-background to-muted/30">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium mb-6 text-primary border-primary/30 bg-primary/5">
              Inventario integrado con facturación
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
              Software de almacén e inventario
              <span className="text-primary"> que se actualiza solo</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Controla tu stock en tiempo real, gestiona proveedores y genera pedidos automáticos.
              Todo integrado con tu facturación para que nunca pierdas el control.
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
            <p className="text-sm text-muted-foreground mt-4">Sin permanencia · Soporte en español · Integrado con ventas y compras</p>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-3xl font-bold text-center mb-4">Control total de tu inventario</h2>
            <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
              Diseñado para pymes que necesitan controlar su stock sin dedicarle horas cada semana.
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

        {/* Cómo funciona integrado */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-3xl font-bold text-center mb-4">Integrado con toda tu empresa</h2>
            <p className="text-muted-foreground text-center mb-10">
              El almacén de YouWhole no funciona aislado — se conecta con ventas, compras, CRM y facturación.
            </p>
            <div className="space-y-4">
              {[
                { t: "Venta → descuento automático de stock", d: "Cuando emites una factura o albarán, el stock se reduce automáticamente. Sin ajustes manuales." },
                { t: "Compra → entrada automática al almacén", d: "Cuando registras una factura de proveedor, los productos entran al inventario con su precio de coste." },
                { t: "Presupuesto → reserva de stock", d: "Un presupuesto aprobado puede reservar unidades para que no se vendan a otro cliente mientras se confirma." },
                { t: "Valoración de inventario en tiempo real", d: "Consulta el valor de tu almacén a precio de coste en cualquier momento desde el panel de control." },
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
            <h2 className="text-3xl font-bold mb-4">Tu almacén bajo control desde hoy</h2>
            <p className="text-muted-foreground mb-8">14 días gratis. Sin tarjeta. Stock integrado con tu facturación desde el primer día.</p>
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
