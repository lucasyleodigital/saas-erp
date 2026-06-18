import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { MarketingFooter } from "@/components/marketing/footer";

export const metadata: Metadata = { title: "Política de Privacidad — YouWhole" };

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border py-4 px-6">
        <Link href="/">
          <Image src="/logo.png" alt="YouWhole" width={120} height={34} className="object-contain" />
        </Link>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2">Política de Privacidad</h1>
        <p className="text-sm text-muted-foreground mb-10">Última actualización: junio de 2026</p>

        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">1. Responsable del tratamiento</h2>
            <p>
              <strong className="text-foreground">[NOMBRE_EMPRESA]</strong> (en adelante, «YouWhole» o «Responsable»)<br />
              CIF: <strong className="text-foreground">[PENDIENTE — CIF]</strong><br />
              Domicilio fiscal: <strong className="text-foreground">[PENDIENTE — DIRECCIÓN FISCAL]</strong><br />
              Email de contacto: <strong className="text-foreground">legal@youwhole.es</strong>
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">2. Datos que recogemos</h2>
            <p>Recopilamos los siguientes datos personales:</p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li><strong className="text-foreground">Datos de registro:</strong> nombre, apellidos, dirección de correo electrónico, nombre de empresa y contraseña (almacenada cifrada).</li>
              <li><strong className="text-foreground">Datos de empresa:</strong> razón social, CIF/NIF, dirección fiscal, teléfono.</li>
              <li><strong className="text-foreground">Datos de pago:</strong> procesados directamente por Stripe, Inc. YouWhole no almacena datos de tarjeta.</li>
              <li><strong className="text-foreground">Datos de uso:</strong> logs de acceso, páginas visitadas, funcionalidades utilizadas, dirección IP.</li>
              <li><strong className="text-foreground">Datos introducidos por el usuario:</strong> clientes, facturas, presupuestos, empleados y cualquier otro dato gestionado dentro de la plataforma.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">3. Finalidades y base jurídica</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse mt-2">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 text-foreground font-medium">Finalidad</th>
                    <th className="text-left py-2 text-foreground font-medium">Base jurídica</th>
                  </tr>
                </thead>
                <tbody className="space-y-2">
                  {[
                    ["Prestación del servicio SaaS", "Ejecución del contrato (art. 6.1.b RGPD)"],
                    ["Facturación y gestión de pagos", "Ejecución del contrato + obligación legal"],
                    ["Envío de comunicaciones relacionadas con el servicio", "Ejecución del contrato"],
                    ["Análisis de uso y mejora del producto", "Interés legítimo (art. 6.1.f RGPD)"],
                    ["Envío de comunicaciones comerciales", "Consentimiento (art. 6.1.a RGPD)"],
                    ["Cumplimiento de obligaciones legales y fiscales", "Obligación legal (art. 6.1.c RGPD)"],
                  ].map(([fin, base]) => (
                    <tr key={fin} className="border-b border-border/50">
                      <td className="py-2 pr-4">{fin}</td>
                      <td className="py-2">{base}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">4. Conservación de datos</h2>
            <p>
              Los datos se conservan durante la vigencia de la relación contractual y, una vez extinguida, durante los plazos legalmente exigidos:
              5 años para datos fiscales y contables (Ley General Tributaria), 3 años para datos de comunicaciones electrónicas (LSSICE).
              Los datos de clientes inactivos se eliminarán o anonimizarán transcurridos 12 meses desde la baja.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">5. Destinatarios y transferencias internacionales</h2>
            <p>Los datos pueden ser comunicados a:</p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li><strong className="text-foreground">Stripe, Inc.</strong> — procesamiento de pagos (con cláusulas contractuales tipo UE).</li>
              <li><strong className="text-foreground">Supabase / PostgreSQL</strong> — base de datos alojada en la UE.</li>
              <li><strong className="text-foreground">Vercel / Railway</strong> — infraestructura de alojamiento.</li>
              <li><strong className="text-foreground">Resend</strong> — servicio de envío de emails transaccionales.</li>
              <li><strong className="text-foreground">Administraciones públicas</strong> — cuando lo exija la normativa.</li>
            </ul>
            <p className="mt-2">No cedemos datos a terceros con fines publicitarios.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">6. Tus derechos</h2>
            <p>Conforme al RGPD y la LOPDGDD puedes ejercer los siguientes derechos dirigiéndote a <strong className="text-foreground">legal@youwhole.es</strong>:</p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li><strong className="text-foreground">Acceso:</strong> obtener confirmación de si tratamos tus datos y, en su caso, una copia.</li>
              <li><strong className="text-foreground">Rectificación:</strong> corregir datos inexactos o incompletos.</li>
              <li><strong className="text-foreground">Supresión («derecho al olvido»):</strong> solicitar la eliminación de tus datos.</li>
              <li><strong className="text-foreground">Oposición:</strong> oponerte al tratamiento basado en interés legítimo.</li>
              <li><strong className="text-foreground">Limitación:</strong> solicitar la suspensión del tratamiento en ciertos casos.</li>
              <li><strong className="text-foreground">Portabilidad:</strong> recibir tus datos en formato estructurado y legible por máquina.</li>
            </ul>
            <p className="mt-2">
              También tienes derecho a presentar una reclamación ante la{" "}
              <strong className="text-foreground">Agencia Española de Protección de Datos (AEPD)</strong> en{" "}
              <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">www.aepd.es</a>.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">7. Seguridad</h2>
            <p>
              Aplicamos medidas técnicas y organizativas adecuadas: cifrado TLS en tránsito, cifrado de contraseñas mediante bcrypt,
              Row Level Security (RLS) en base de datos, accesos con privilegio mínimo y auditorías periódicas de seguridad.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">8. Cookies</h2>
            <p>
              Utilizamos cookies propias y de terceros. Consulta nuestra{" "}
              <Link href="/cookies" className="underline hover:text-foreground">Política de Cookies</Link> para más información.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">9. Cambios en esta política</h2>
            <p>
              Podemos actualizar esta política periódicamente. Te notificaremos los cambios relevantes por email o mediante aviso en la plataforma.
              La fecha de última actualización siempre estará visible al inicio del documento.
            </p>
          </section>

        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
