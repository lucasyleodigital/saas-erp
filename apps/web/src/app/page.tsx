import type { Metadata } from "next";
import { Hero } from "@/components/marketing/hero";
import { StatsBar } from "@/components/marketing/stats-bar";
import { Features } from "@/components/marketing/features";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { VerifactuSection } from "@/components/marketing/verifactu-section";
import { Testimonials } from "@/components/marketing/testimonials";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";
import { PricingCards } from "@/components/billing/pricing-cards";
import { DemoSection } from "@/components/marketing/demo-section";
import { Faq } from "@/components/marketing/faq";
import { ChatWidget } from "@/components/marketing/chat-widget";
import Link from "next/link";

export const metadata: Metadata = {
  title: "YouWhole — ERP para autonomos y pymes españolas",
  description:
    "ERP creado por autonomos para autonomos y pymes. Facturacion con VeriFactu, IRPF automatico, Modelo 130/303, CRM, contabilidad y nominas. 14 dias gratis, sin tarjeta.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://youwhole.com" },
  openGraph: {
    title: "YouWhole — ERP para autonomos y pymes españolas",
    description:
      "Creado por autonomos para autonomos y pymes. VeriFactu, IRPF, Modelo 130/303, CRM y contabilidad. Desde 29 EUR/mes.",
    url: "https://youwhole.com",
    type: "website",
  },
};

const JSONLD_ORGANIZATION = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "YouWhole",
  url: "https://youwhole.com",
  logo: "https://youwhole.com/logo.png",
  description:
    "YouWhole es un ERP creado por autonomos para autonomos y pymes españolas. Facturacion con VeriFactu, IRPF automatico, Modelo 130/303/347, CRM, contabilidad PGC y nominas.",
  founder: { "@type": "Organization", name: "Lucas y Leo Digital", url: "https://lucasyleodigital.com" },
  foundingLocation: { "@type": "Place", addressLocality: "Barcelona", addressCountry: "ES" },
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+34-624-029-617",
    email: "hola@youwhole.com",
    contactType: "customer service",
    availableLanguage: "Spanish",
    hoursAvailable: "Mo-Fr 09:00-18:00",
  },
  sameAs: ["https://lucasyleodigital.com"],
};

const JSONLD_SOFTWARE = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "YouWhole",
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "ERP",
  operatingSystem: "Web, iOS, Android",
  url: "https://youwhole.com",
  description:
    "ERP para autonomos y pymes: facturacion con VeriFactu, IRPF automatico, Modelo 130/303/347, CRM, contabilidad PGC, nominas e inventario.",
  featureList: [
    "Facturacion electronica con VeriFactu certificado AEAT",
    "CRM integrado con pipeline Kanban",
    "Contabilidad segun Plan General Contable espanol (PGC)",
    "Gestion de nominas y RRHH",
    "Control de inventario y almacen",
    "Presupuestos y albaranes",
    "Automatizaciones y facturas recurrentes",
    "IRPF automatico para autonomos",
    "Modelo 130, 303 y 347 integrados",
    "Dashboard en tiempo real",
    "Importacion y exportacion Excel/CSV",
    "Multi-usuario con control de roles",
    "Recordatorios automaticos de impago",
    "Conciliacion bancaria automatica",
    "Proyectos con control de rentabilidad",
    "Control horario por empleado y proyecto",
    "Facturacion multi-divisa con tipos de cambio BCE",
    "Interfaz y PDFs en castellano, catalan, euskera, gallego e ingles",
    "Campos personalizados por entidad",
    "Backup descargable completo",
    "Registro de auditoria",
    "Calendario integrado",
  ],
  offers: [
    {
      "@type": "Offer",
      name: "Plan Gratuito",
      price: "0",
      priceCurrency: "EUR",
      description: "5 clientes, 10 facturas/mes, 1 usuario, VeriFactu incluido.",
    },
    {
      "@type": "Offer",
      name: "Plan Starter",
      price: "29",
      priceCurrency: "EUR",
      priceSpecification: { "@type": "UnitPriceSpecification", billingIncrement: 1, unitCode: "MON" },
      description: "3 usuarios, clientes y facturas ilimitadas, CRM, contabilidad basica, control horario.",
    },
    {
      "@type": "Offer",
      name: "Plan Pro",
      price: "79",
      priceCurrency: "EUR",
      priceSpecification: { "@type": "UnitPriceSpecification", billingIncrement: 1, unitCode: "MON" },
      description: "10 usuarios, nominas, portal empleado, automatizaciones ilimitadas, API, soporte prioritario.",
    },
    {
      "@type": "Offer",
      name: "Plan Enterprise",
      price: "199",
      priceCurrency: "EUR",
      priceSpecification: { "@type": "UnitPriceSpecification", billingIncrement: 1, unitCode: "MON" },
      description: "Usuarios ilimitados, multi-empresa, SLA 99.5%, soporte dedicado, onboarding personalizado.",
    },
  ],
  author: { "@type": "Organization", name: "Lucas y Leo Digital", url: "https://lucasyleodigital.com" },
  inLanguage: "es-ES",
  availableInCountry: "ES",
};

const JSONLD_FAQ = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "¿Qué es VeriFactu y por qué lo necesito?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "VeriFactu es el sistema de verificación de facturas de la Agencia Tributaria española. Desde 2025, toda empresa que use un software de facturación está obligada a usar sistemas certificados VeriFactu. YouWhole lo incluye de serie — no necesitas hacer nada extra para cumplir la ley.",
      },
    },
    {
      "@type": "Question",
      name: "¿Qué pasa cuando termina el período de prueba de 14 días?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Si no introduces ningún método de pago, tu cuenta pasa automáticamente al plan Gratuito (hasta 5 clientes y 10 facturas al mes). No se te cobra nada ni se cancela tu cuenta. Tú decides cuándo y si quieres hacer upgrade.",
      },
    },
    {
      "@type": "Question",
      name: "¿Puedo importar mis datos desde otro programa o Excel?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sí. Puedes importar clientes, productos y facturas históricas desde archivos Excel o CSV. También contamos con asistencia de migración desde los programas de facturación más habituales en España.",
      },
    },
    {
      "@type": "Question",
      name: "¿Cuántos usuarios puede tener mi empresa?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "El plan Gratuito incluye 1 usuario. El plan Starter incluye 3 usuarios, el Pro hasta 10 y el Enterprise permite usuarios ilimitados con control de roles y permisos por departamento.",
      },
    },
    {
      "@type": "Question",
      name: "¿Es seguro guardar mis facturas y datos de empresa en YouWhole?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sí. Todos tus datos se almacenan cifrados en servidores europeos con cumplimiento RGPD, backups diarios automáticos y acceso protegido mediante autenticación de doble factor (2FA). Jamás compartimos tus datos con terceros.",
      },
    },
    {
      "@type": "Question",
      name: "¿Puedo cancelar mi suscripción cuando quiera?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sí, sin permanencia ni penalizaciones. Si cancelas, sigues teniendo acceso hasta el final del período ya pagado. Después, tu cuenta pasa al plan Gratuito y conservas todos tus datos.",
      },
    },
    {
      "@type": "Question",
      name: "¿YouWhole funciona para cualquier tipo de empresa española?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Está diseñado para autónomos y pymes de cualquier sector: servicios, comercio, construcción, tecnología, hostelería... Si tienes necesidades específicas de gran empresa o franquicia, escríbenos y preparamos una demo personalizada.",
      },
    },
    {
      "@type": "Question",
      name: "¿Tienen soporte técnico en español?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sí, siempre. Contamos con soporte por chat y email en español, de lunes a viernes de 9:00 a 18:00 (hora española). Los clientes Pro y Enterprise también tienen acceso a soporte prioritario.",
      },
    },
  ],
};

const JSONLD_WEBSITE = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "YouWhole",
  url: "https://youwhole.com",
  description: "ERP todo en uno para pymes españolas",
  inLanguage: "es-ES",
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: "https://youwhole.com/ayuda?q={search_term_string}" },
    "query-input": "required name=search_term_string",
  },
};

export default function LandingPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSONLD_ORGANIZATION) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSONLD_SOFTWARE) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSONLD_FAQ) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSONLD_WEBSITE) }} />
    <div className="min-h-screen flex flex-col">
      <MarketingNav />

      <main className="flex-1">
        {/* 1 · Hero dark fullscreen + dashboard mockup */}
        <Hero />

        {/* 2 · Animated app demo */}
        <DemoSection />

        {/* 3 · Animated stats */}
        <StatsBar />

        {/* 3 · Bento features grid */}
        <Features />

        {/* 4 · How it works - 3 steps */}
        <HowItWorks />

        {/* 5 · VeriFactu dark section */}
        <VerifactuSection />

        {/* 6 · Testimonials */}
        <Testimonials />

        {/* 7 · FAQ */}
        <Faq />

        {/* 8 · Pricing */}
        <section id="pricing" className="py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <div
                className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium mb-4 border"
                style={{
                  background: "rgba(13,148,136,0.08)",
                  borderColor: "rgba(13,148,136,0.25)",
                  color: "#0d9488",
                }}
              >
                Sin letra pequeña
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Precios claros y transparentes
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Sin costes ocultos ni permanencia. Empieza gratis y actualiza
                cuando lo necesites.
              </p>
            </div>
            <PricingCards />
            <p className="text-center text-xs text-muted-foreground mt-6">
              Todos los precios incluyen IVA · Cancela cuando quieras
            </p>
          </div>
        </section>

        {/* 8 · Final CTA dark */}
        <section
          className="py-28 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #040c0a 0%, #061410 60%, #080f0c 100%)",
          }}
        >
          {/* Glow */}
          <div
            aria-hidden="true"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full pointer-events-none"
            style={{ background: "radial-gradient(ellipse, rgba(13,148,136,0.2) 0%, transparent 70%)" }}
          />

          <div className="container mx-auto px-4 text-center relative z-10">
            <h2 className="text-3xl sm:text-5xl font-bold text-white mb-5 leading-tight">
              ¿Listo para llevar tu empresa
              <br />
              <span
                style={{
                  backgroundImage: "linear-gradient(135deg, #2dd4bf, #f59e0b)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                al siguiente nivel?
              </span>
            </h2>
            <p className="mb-10 max-w-md mx-auto text-lg" style={{ color: "#94a3b8" }}>
              Únete a las empresas que ya gestionan su negocio con YouWhole.
              14 días gratis, sin tarjeta de crédito.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/registro"
                className="inline-flex items-center gap-2 rounded-xl px-10 text-base font-semibold text-white transition-all hover:scale-105 active:scale-95"
                style={{
                  height: 56,
                  background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
                  boxShadow: "0 0 40px rgba(13,148,136,0.5), 0 4px 24px rgba(0,0,0,0.4)",
                }}
              >
                Crear cuenta gratis
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center rounded-xl px-8 text-base font-medium text-white transition-all hover:bg-white/10"
                style={{
                  height: 56,
                  border: "1px solid rgba(255,255,255,0.13)",
                  background: "rgba(255,255,255,0.05)",
                }}
              >
                Ya tengo cuenta
              </Link>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
      <ChatWidget />
    </div>
    </>
  );
}
