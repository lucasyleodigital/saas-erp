import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { MarketingFooter } from "@/components/marketing/footer";

export const metadata: Metadata = { title: "Aviso Legal — YouWhole" };

export default function AvisoLegalPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border py-4 px-6">
        <Link href="/">
          <Image src="/logo.png" alt="YouWhole" width={120} height={34} className="object-contain" />
        </Link>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2">Aviso Legal</h1>
        <p className="text-sm text-muted-foreground mb-10">Última actualización: junio de 2026</p>

        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">1. Datos identificativos del titular</h2>
            <p>
              En cumplimiento de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y del Comercio Electrónico (LSSICE), se informa:
            </p>
            <ul className="list-none mt-3 space-y-1">
              <li><strong className="text-foreground">Denominación social:</strong> [NOMBRE_EMPRESA]</li>
              <li><strong className="text-foreground">CIF:</strong> [PENDIENTE — CIF]</li>
              <li><strong className="text-foreground">Domicilio social:</strong> [PENDIENTE — DIRECCIÓN FISCAL]</li>
              <li><strong className="text-foreground">Email:</strong> legal@youwhole.es</li>
              <li><strong className="text-foreground">Sitio web:</strong> youwhole.es</li>
              <li><strong className="text-foreground">Registro Mercantil:</strong> [PENDIENTE — datos de inscripción]</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">2. Objeto y ámbito de aplicación</h2>
            <p>
              El presente Aviso Legal regula el acceso y uso del sitio web <strong className="text-foreground">youwhole.es</strong> y la plataforma SaaS YouWhole
              (en adelante, «el Sitio»), titularidad de [NOMBRE_EMPRESA].
              El acceso al Sitio implica la aceptación plena de este Aviso Legal.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">3. Condiciones de uso</h2>
            <p>El usuario se compromete a:</p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>Usar el Sitio y sus servicios de conformidad con la ley, la moral y el orden público.</li>
              <li>No realizar actividades ilícitas o contrarias a los derechos de terceros.</li>
              <li>No introducir en el Sitio virus, malware o cualquier software dañino.</li>
              <li>No reproducir, copiar o distribuir los contenidos sin autorización expresa.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">4. Propiedad intelectual e industrial</h2>
            <p>
              Todos los contenidos del Sitio (textos, imágenes, logotipos, código fuente, diseño, interfaz gráfica y demás elementos)
              son propiedad de [NOMBRE_EMPRESA] o de terceros que han autorizado su uso, y están protegidos por la legislación española
              e internacional sobre propiedad intelectual e industrial.
            </p>
            <p className="mt-2">
              Se prohíbe expresamente su reproducción, distribución, comunicación pública o transformación total o parcial sin autorización escrita del titular.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">5. Exclusión de garantías y responsabilidad</h2>
            <p>
              [NOMBRE_EMPRESA] no garantiza la disponibilidad continua del Sitio ni la ausencia de errores.
              No será responsable de los daños o perjuicios de cualquier naturaleza derivados de:
            </p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>Interrupciones, fallos o deficiencias técnicas en el Sitio.</li>
              <li>Virus o elementos dañinos introducidos por terceros.</li>
              <li>Uso ilícito, negligente o fraudulento del Sitio por parte del usuario.</li>
              <li>Contenidos de sitios web de terceros enlazados desde el Sitio.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">6. Enlaces a terceros</h2>
            <p>
              El Sitio puede contener enlaces a sitios web de terceros. Dichos enlaces se facilitan a efectos informativos.
              [NOMBRE_EMPRESA] no controla ni asume responsabilidad alguna sobre el contenido de esos sitios.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">7. Legislación aplicable y jurisdicción</h2>
            <p>
              Este Aviso Legal se rige por la legislación española. Para cualquier controversia derivada del acceso o uso del Sitio,
              las partes se someten a los Juzgados y Tribunales de <strong className="text-foreground">Barcelona</strong>,
              con renuncia expresa a cualquier otro fuero que pudiera corresponderles.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">8. Modificaciones</h2>
            <p>
              [NOMBRE_EMPRESA] se reserva el derecho de modificar el presente Aviso Legal en cualquier momento.
              Las modificaciones entrarán en vigor desde su publicación en el Sitio.
            </p>
          </section>

        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
