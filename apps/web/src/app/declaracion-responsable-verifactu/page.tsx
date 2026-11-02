import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { MarketingFooter } from "@/components/marketing/footer";
import { VERIFACTU_DECLARATION as D } from "@/lib/verifactu-declaration";

export const metadata: Metadata = {
  title: { absolute: "Declaración responsable del sistema informático de facturación — YouWhole" },
  description: `Declaración responsable de ${D.nombreSistema} ${D.version} según el artículo 15 de la Orden HAC/1177/2024 (VERI*FACTU).`,
};

// El orden y los textos de cada dato siguen las letras a) a l) del artículo 15.1 de la orden
const DATA: [string, string][] = [
  ["a) Nombre del sistema informático", D.nombreSistema],
  ["b) Código identificador del sistema informático", D.idSistema],
  ["c) Identificador completo de la versión", D.version],
  [
    "d) Componentes, hardware y software, y descripción del sistema",
    "Aplicación web en la nube (software como servicio) a la que se accede con un navegador. Software: interfaz web, servidor de aplicación y base de datos PostgreSQL alojados en servidores de la Unión Europea. No incluye ni requiere hardware específico. Permite emitir facturas, presupuestos y albaranes, llevar la contabilidad, los modelos tributarios, las nóminas y los gastos de empleados, y genera para cada factura su registro de facturación encadenado, que remite automáticamente a la Agencia Tributaria.",
  ],
  [
    "e) Si el sistema solo puede funcionar exclusivamente como «VERI*FACTU»",
    D.soloVerifactu ? "Sí. Solo funciona como sistema de emisión de facturas verificables (VERI*FACTU)." : "No.",
  ],
  [
    "f) Si permite ser usado por varios obligados tributarios",
    D.multiplesObligados
      ? "Sí. Cada empresa o profesional usa su propia instalación, con su propia cadena de registros de facturación."
      : "No.",
  ],
  [
    "g) Tipos de firma utilizados cuando no se usa como «VERI*FACTU»",
    "No aplica: el sistema solo funciona como «VERI*FACTU».",
  ],
  ["h) Nombre y apellidos o razón social de la persona o entidad productora", D.productor],
  ["i) NIF de la persona o entidad productora", D.nif],
  ["j) Dirección postal completa de contacto de la persona o entidad productora", D.direccion],
];

export default function DeclaracionResponsablePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border py-4 px-6">
        <Link href="/">
          <Image src="/logo.png" alt="YouWhole" width={120} height={34} className="object-contain" />
        </Link>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">DECLARACIÓN RESPONSABLE DEL SISTEMA INFORMÁTICO DE FACTURACIÓN</h1>
        <p className="text-sm text-muted-foreground mb-10">
          {D.nombreSistema}, versión {D.version}
        </p>

        <div className="space-y-6 text-sm leading-relaxed">
          <dl className="space-y-5">
            {DATA.map(([label, value]) => (
              <div key={label}>
                <dt className="font-semibold text-foreground">{label}:</dt>
                <dd className="text-muted-foreground mt-1">{value}</dd>
              </div>
            ))}
            <div>
              <dt className="font-semibold text-foreground">k) Declaración de cumplimiento:</dt>
              <dd className="text-muted-foreground mt-1">
                {D.productor}, como productor del sistema informático {D.nombreSistema}, declara que dicho sistema, en la
                versión {D.version} indicada en esta declaración, cumple con lo dispuesto en el artículo 29.2.j) de la
                Ley 58/2003, de 17 de diciembre, General Tributaria; en el Reglamento que establece los requisitos que
                deben adoptar los sistemas y programas informáticos o electrónicos que soporten los procesos de
                facturación de empresarios y profesionales, y la estandarización de formatos de los registros de
                facturación, aprobado por el Real Decreto 1007/2023, de 5 de diciembre; en la Orden HAC/1177/2024, de
                17 de octubre; y en la sede electrónica de la Agencia Estatal de Administración Tributaria para todo
                aquello que complete las especificaciones de dicha orden.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-foreground">l) Fecha y lugar de suscripción:</dt>
              <dd className="text-muted-foreground mt-1">{D.fecha}, en {D.lugar}.</dd>
            </div>
          </dl>

          <section className="border-t border-border pt-8">
            <h2 className="text-base font-semibold text-foreground mb-3">Anexo: información adicional</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <strong className="text-foreground">Otras formas de contacto:</strong>{" "}
                <a href={`mailto:${D.email}`} className="text-primary hover:underline">{D.email}</a>
              </li>
              <li>
                <strong className="text-foreground">Dirección de Internet:</strong>{" "}
                <a href={D.web} className="text-primary hover:underline">{D.web.replace("https://", "")}</a>
              </li>
              <li>
                <strong className="text-foreground">Cómo cumple el sistema las especificaciones:</strong> cada factura
                emitida genera un registro de facturación de alta, y cada factura anulada un registro de anulación. Cada
                registro incluye su huella SHA-256 y la del registro anterior, de modo que forman una cadena por empresa.
                Los registros se remiten automáticamente al servicio web VERI*FACTU de la Agencia Tributaria
                respetando el tiempo de espera entre envíos que esta indica; si el servicio no responde, se reintenta
                el envío y se marca la incidencia. Los registros rechazados se subsanan con un nuevo registro que
                conserva el original. Las facturas incluyen el código QR tributario y la mención «VERI*FACTU».
              </li>
            </ul>
          </section>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
