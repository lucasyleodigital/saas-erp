import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { MarketingFooter } from "@/components/marketing/footer";

export const metadata: Metadata = { title: "Términos y Condiciones — YouWhole" };

export default function TerminosPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border py-4 px-6">
        <Link href="/">
          <Image src="/logo.png" alt="YouWhole" width={120} height={34} className="object-contain" />
        </Link>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2">Términos y Condiciones de Uso</h1>
        <p className="text-sm text-muted-foreground mb-10">Última actualización: junio de 2026</p>

        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">1. Partes del contrato</h2>
            <p>
              Estos Términos y Condiciones regulan la relación entre{" "}
              <strong className="text-foreground">[NOMBRE_EMPRESA]</strong> (CIF: [PENDIENTE], domicilio: [PENDIENTE]),
              titular de la plataforma YouWhole (en adelante, «Prestador»), y el usuario que se registra y hace uso de los servicios
              (en adelante, «Cliente»).
            </p>
            <p className="mt-2">
              El acceso y uso de YouWhole implica la aceptación expresa de estos Términos.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">2. Descripción del servicio</h2>
            <p>
              YouWhole es una plataforma SaaS de gestión empresarial (ERP) que incluye, según el plan contratado:
              CRM, facturación electrónica con VeriFactu, contabilidad, nóminas, gestión de inventario, presupuestos,
              albaranes, gestión de proveedores y herramientas de automatización.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">3. Alta y cuenta de usuario</h2>
            <ul className="list-disc ml-5 space-y-1">
              <li>Para acceder a YouWhole es necesario crear una cuenta con datos verídicos.</li>
              <li>El Cliente es responsable de mantener la confidencialidad de sus credenciales.</li>
              <li>Cada cuenta está vinculada a una empresa. No se permite el uso compartido de credenciales entre empresas distintas.</li>
              <li>YouWhole se reserva el derecho de suspender cuentas con actividad fraudulenta o contraria a estos Términos.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">4. Planes y precios</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse mt-2">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 text-foreground font-medium">Plan</th>
                    <th className="text-left py-2 pr-4 text-foreground font-medium">Precio (IVA incl.)</th>
                    <th className="text-left py-2 text-foreground font-medium">Modalidad</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Gratuito", "0 €/mes", "Sin compromiso"],
                    ["Starter", "29 €/mes", "Suscripción mensual"],
                    ["Pro", "79 €/mes", "Suscripción mensual"],
                    ["Enterprise", "199 €/mes", "Suscripción mensual"],
                  ].map(([plan, precio, mod]) => (
                    <tr key={plan} className="border-b border-border/50">
                      <td className="py-2 pr-4 font-medium text-foreground">{plan}</td>
                      <td className="py-2 pr-4">{precio}</td>
                      <td className="py-2">{mod}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3">
              Los precios pueden modificarse con un preaviso de 30 días. El cambio no afectará al período ya facturado.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">5. Facturación y pago</h2>
            <ul className="list-disc ml-5 space-y-1">
              <li>El pago se realiza mediante tarjeta de crédito/débito a través de Stripe, Inc.</li>
              <li>La suscripción se renueva automáticamente cada mes en la fecha de alta.</li>
              <li>En caso de impago, el acceso a las funciones de pago se suspenderá hasta que la deuda sea saldada.</li>
              <li>Las facturas se emiten electrónicamente y están disponibles en el panel de control.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">6. Cancelación y derecho de desistimiento</h2>
            <ul className="list-disc ml-5 space-y-1">
              <li>El Cliente puede cancelar su suscripción en cualquier momento desde el panel de control («Billing → Gestionar suscripción»).</li>
              <li>La cancelación surte efecto al final del período mensual en curso. No se realizan reembolsos prorrateados.</li>
              <li>
                <strong className="text-foreground">Derecho de desistimiento:</strong> los consumidores (personas físicas) disponen de 14 días naturales desde la contratación para desistir del contrato,
                salvo que el servicio haya comenzado a prestarse con el consentimiento expreso del usuario antes de ese plazo.
              </li>
              <li>Para ejercer el desistimiento, contacta con <strong className="text-foreground">legal@youwhole.com</strong>.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">7. Acuerdo de Nivel de Servicio (SLA)</h2>
            <ul className="list-disc ml-5 space-y-1">
              <li>YouWhole garantiza una disponibilidad mensual del <strong className="text-foreground">99,5%</strong> para planes de pago.</li>
              <li>El plan Gratuito no incluye garantía de disponibilidad.</li>
              <li>En caso de incumplimiento del SLA, el Cliente tendrá derecho a un descuento proporcional en la siguiente factura.</li>
              <li>Se excluyen del cómputo las interrupciones por mantenimiento programado y causas de fuerza mayor.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">8. Propiedad de los datos</h2>
            <p>
              Los datos introducidos por el Cliente en la plataforma son de su exclusiva propiedad.
              YouWhole actúa como Encargado del Tratamiento conforme al RGPD.
              Tras la baja, el Cliente puede solicitar la exportación de sus datos en formato estándar en un plazo de 30 días.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">9. Uso aceptable</h2>
            <p>Queda expresamente prohibido:</p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>Usar YouWhole para actividades ilícitas o fraudulentas.</li>
              <li>Intentar acceder a datos de otros usuarios o vulnerar la seguridad de la plataforma.</li>
              <li>Realizar ingeniería inversa del software.</li>
              <li>Revender o sublicenciar el acceso a terceros sin autorización.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">10. Limitación de responsabilidad</h2>
            <p>
              La responsabilidad máxima de YouWhole frente al Cliente no superará el importe de las cuotas abonadas en los últimos 3 meses.
              YouWhole no responde de daños indirectos, lucro cesante, pérdida de datos por uso indebido ni interrupciones ajenas a su control.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">11. Modificaciones del servicio</h2>
            <p>
              YouWhole puede modificar o discontinuar funcionalidades con un preaviso de 30 días.
              Los cambios sustanciales en el precio o condiciones se comunicarán por email con 30 días de antelación,
              dando derecho al Cliente a cancelar sin penalización.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">12. Ley aplicable y jurisdicción</h2>
            <p>
              Estos Términos se rigen por la legislación española. Para cualquier controversia, las partes se someten a los
              Juzgados y Tribunales de <strong className="text-foreground">Barcelona</strong>,
              con renuncia expresa a cualquier otro fuero.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">13. Contacto</h2>
            <p>
              Para cualquier consulta sobre estos Términos: <strong className="text-foreground">legal@youwhole.com</strong>
            </p>
          </section>

        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
