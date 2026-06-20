import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { MarketingFooter } from "@/components/marketing/footer";

export const metadata: Metadata = {
  title: "Centro de Ayuda — YouWhole",
  description:
    "Preguntas frecuentes y guías de uso de YouWhole: VeriFactu, facturación, importación de datos, suscripciones y más. Soporte en español.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://youwhole.com/ayuda" },
  openGraph: {
    title: "Centro de Ayuda — YouWhole",
    description: "Resuelve tus dudas sobre YouWhole: VeriFactu, facturación, planes y soporte técnico en español.",
    url: "https://youwhole.com/ayuda",
    type: "website",
  },
};

const FAQS = [
  {
    q: "¿Cómo empiezo a usar YouWhole?",
    a: "Crea tu cuenta gratuita en youwhole.com, configura tu empresa con tu CIF y logo, y empieza a emitir facturas. El asistente de bienvenida te guía en los primeros pasos.",
  },
  {
    q: "¿Puedo importar mis datos desde otro programa?",
    a: "Sí. YouWhole permite importar clientes, productos y facturas desde archivos CSV. Accede a Dashboard → Importación y sigue las instrucciones de cada módulo.",
  },
  {
    q: "¿YouWhole cumple con VeriFactu?",
    a: "Sí. YouWhole genera, firma y envía los registros VeriFactu a la AEAT automáticamente al emitir cada factura. No necesitas hacer nada extra.",
  },
  {
    q: "¿Cómo cancelo mi suscripción?",
    a: "Ve a Dashboard → Facturación → Gestionar suscripción. Desde ahí puedes cancelar cuando quieras. Conservas el acceso hasta el final del periodo pagado.",
  },
  {
    q: "¿Puedo cambiar de plan en cualquier momento?",
    a: "Sí, puedes subir o bajar de plan cuando quieras desde Dashboard → Facturación. El cambio se aplica en el siguiente ciclo de facturación.",
  },
  {
    q: "¿Los datos de mi empresa están seguros?",
    a: "Tus datos se almacenan en servidores europeos (Supabase / Frankfurt), cifrados en reposo y en tránsito. Tenemos copias de seguridad diarias y cumplimos el RGPD.",
  },
  {
    q: "¿Puedo tener varios usuarios en mi empresa?",
    a: "Sí. Los planes Starter, Pro y Enterprise permiten invitar a varios usuarios con roles diferenciados (Propietario, Admin, Contable, Comercial, Empleado).",
  },
  {
    q: "¿YouWhole tiene aplicación móvil?",
    a: "De momento es una aplicación web adaptada a móvil. Estamos trabajando en las apps nativas para iOS y Android.",
  },
];

export default function AyudaPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border py-4 px-6">
        <Link href="/">
          <Image src="/logo.png" alt="YouWhole" width={120} height={34} className="object-contain" />
        </Link>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2">Centro de ayuda</h1>
        <p className="text-sm text-muted-foreground mb-10">
          Respuestas a las preguntas más frecuentes. Si no encuentras lo que buscas, escríbenos.
        </p>

        {/* FAQ */}
        <section className="space-y-6 mb-16">
          {FAQS.map((faq) => (
            <div key={faq.q} className="border border-border rounded-lg p-5">
              <h2 className="text-sm font-semibold text-foreground mb-2">{faq.q}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </section>

        {/* Contact */}
        <section className="border border-border rounded-xl p-8 bg-muted/20 text-center">
          <h2 className="text-lg font-semibold mb-2">¿No has encontrado tu respuesta?</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Nuestro equipo de soporte te responde en menos de 24 horas en días laborables.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="mailto:soporte@youwhole.com"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Enviar un email
            </a>
            <a
              href="mailto:hola@youwhole.com"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium hover:bg-muted/50 transition-colors"
            >
              Consulta comercial
            </a>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Soporte técnico:{" "}
            <a href="mailto:soporte@youwhole.com" className="hover:text-foreground">
              soporte@youwhole.com
            </a>{" "}
            · Comercial:{" "}
            <a href="mailto:hola@youwhole.com" className="hover:text-foreground">
              hola@youwhole.com
            </a>
          </p>
        </section>

        <div className="mt-8 text-center">
          <Link href="/" className="text-xs text-muted-foreground hover:text-foreground">
            ← Volver a la página principal
          </Link>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
