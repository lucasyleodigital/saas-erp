import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { MarketingFooter } from "@/components/marketing/footer";

export const metadata: Metadata = { title: "Política de Cookies — YouWhole" };

export default function CookiesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border py-4 px-6">
        <Link href="/">
          <Image src="/logo.png" alt="YouWhole" width={120} height={34} className="object-contain" />
        </Link>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2">Política de Cookies</h1>
        <p className="text-sm text-muted-foreground mb-10">Última actualización: junio de 2026</p>

        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">1. ¿Qué son las cookies?</h2>
            <p>
              Las cookies son pequeños archivos de texto que los sitios web almacenan en tu dispositivo al visitarlos.
              Se utilizan ampliamente para hacer que los sitios funcionen correctamente, mejorar la eficiencia
              y proporcionar información a los propietarios del sitio.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">2. Cookies que utilizamos</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse mt-2">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-3 text-foreground font-medium">Cookie</th>
                    <th className="text-left py-2 pr-3 text-foreground font-medium">Tipo</th>
                    <th className="text-left py-2 pr-3 text-foreground font-medium">Duración</th>
                    <th className="text-left py-2 text-foreground font-medium">Finalidad</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["auth", "Esencial", "Sesión", "Mantiene la sesión del usuario autenticado"],
                    ["yw-cookie-consent", "Esencial", "1 año", "Almacena tu preferencia de consentimiento de cookies"],
                    ["__stripe_mid", "Terceros (Stripe)", "1 año", "Prevención del fraude en pagos"],
                    ["__stripe_sid", "Terceros (Stripe)", "30 min", "Prevención del fraude en pagos"],
                    ["_vercel_*", "Técnica", "Sesión", "Funcionalidad de la plataforma de hosting"],
                  ].map(([name, tipo, dur, fin]) => (
                    <tr key={name} className="border-b border-border/50">
                      <td className="py-2 pr-3 font-mono">{name}</td>
                      <td className="py-2 pr-3">{tipo}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">{dur}</td>
                      <td className="py-2">{fin}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">3. Clasificación por tipo</h2>
            <div className="space-y-3">
              <div>
                <p className="font-medium text-foreground">Cookies esenciales (necesarias)</p>
                <p className="mt-1">
                  Imprescindibles para el funcionamiento básico del sitio. No requieren consentimiento.
                  Sin ellas no puedes iniciar sesión ni usar la plataforma.
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">Cookies de terceros</p>
                <p className="mt-1">
                  Instaladas por proveedores externos (Stripe) para gestionar pagos seguros y prevenir el fraude.
                  Al usar el servicio de pago, aceptas las cookies de Stripe según su{" "}
                  <a href="https://stripe.com/es/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                    política de privacidad
                  </a>.
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">Cookies analíticas (opcionales)</p>
                <p className="mt-1">
                  Usadas para entender cómo los usuarios interactúan con el sitio. Solo se activan si has aceptado todas las cookies.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">4. Gestión de tu consentimiento</h2>
            <p>
              Al entrar en YouWhole te mostramos un banner de cookies. Puedes elegir entre:
            </p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li><strong className="text-foreground">Aceptar todas:</strong> se instalan cookies esenciales y analíticas.</li>
              <li><strong className="text-foreground">Solo esenciales:</strong> solo se instalan las cookies estrictamente necesarias.</li>
            </ul>
            <p className="mt-3">
              Puedes cambiar tu preferencia en cualquier momento borrando las cookies de tu navegador o contactando con nosotros.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">5. Cómo desactivar las cookies en tu navegador</h2>
            <p>Puedes configurar tu navegador para rechazar o eliminar cookies:</p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li><strong className="text-foreground">Chrome:</strong> Configuración → Privacidad y seguridad → Cookies</li>
              <li><strong className="text-foreground">Firefox:</strong> Opciones → Privacidad y seguridad → Cookies</li>
              <li><strong className="text-foreground">Safari:</strong> Preferencias → Privacidad → Cookies</li>
              <li><strong className="text-foreground">Edge:</strong> Configuración → Privacidad → Cookies</li>
            </ul>
            <p className="mt-2">
              Ten en cuenta que deshabilitar ciertas cookies puede afectar al funcionamiento de la plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">6. Contacto</h2>
            <p>
              Para cualquier consulta sobre nuestra política de cookies:{" "}
              <strong className="text-foreground">legal@youwhole.es</strong>
            </p>
            <p className="mt-2">
              Más información en nuestra{" "}
              <Link href="/privacidad" className="underline hover:text-foreground">Política de Privacidad</Link>.
            </p>
          </section>

        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
