"use client";

import { motion } from "framer-motion";
import { Shield, CheckCircle, Lock, FileCheck } from "lucide-react";

const POINTS = [
  {
    icon: Shield,
    title: "Hash SHA256 en cadena",
    desc: "Cada factura firma la anterior, creando una cadena inmutable que garantiza la integridad de todos los registros.",
  },
  {
    icon: Lock,
    title: "Registro en AEAT",
    desc: "Envío directo al sistema VERI*FACTU de la Agencia Tributaria con código QR de verificación.",
  },
  {
    icon: FileCheck,
    title: "XML certificado",
    desc: "Generamos el XML según la especificación técnica de AEAT con todos los campos obligatorios.",
  },
  {
    icon: CheckCircle,
    title: "Validación automática",
    desc: "Verificamos cada registro antes de enviarlo para garantizar el cumplimiento total.",
  },
];

export function VerifactuSection() {
  return (
    <section id="verifactu" className="py-24 bg-primary/5">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-3 py-1 text-sm font-medium mb-4">
              <Shield className="h-4 w-4" />
              VeriFactu certificado
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Cumplimiento fiscal total desde el primer día
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              La ley VeriFactu (Ley Antifraude) obliga a registrar cada
              factura en la AEAT. Con nuestro sistema, esto ocurre
              automáticamente — sin configuración, sin trabajo extra.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {POINTS.map((p, i) => {
                const Icon = p.icon;
                return (
                  <motion.div
                    key={p.title}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    viewport={{ once: true }}
                    className="bg-background rounded-lg p-4 border border-border"
                  >
                    <Icon className="h-5 w-5 text-primary mb-2" />
                    <p className="font-medium text-sm mb-1">{p.title}</p>
                    <p className="text-xs text-muted-foreground">{p.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="bg-background rounded-2xl border border-border p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-yellow-400" />
                <div className="h-3 w-3 rounded-full bg-green-400" />
                <span className="text-xs text-muted-foreground ml-2 font-mono">
                  verifactu.xml
                </span>
              </div>
              <pre className="text-xs font-mono text-muted-foreground overflow-auto leading-relaxed">
{`<VERI*FACTU>
  <Cabecera>
    <NIF>B12345678</NIF>
    <NombreRazon>Mi Empresa SL</NombreRazon>
  </Cabecera>
  <RegistroFactura>
    <IDFactura>
      <NumSerieFactura>F-2025-0001</NumSerieFactura>
      <FechaExpedicion>01-01-2025</FechaExpedicion>
    </IDFactura>
    <TipoFactura>F1</TipoFactura>
    <CuotaTotal>210.00</CuotaTotal>
    <ImporteTotal>1210.00</ImporteTotal>
    <Huella>
      a3f8c2d1e9b47...
    </Huella>
  </RegistroFactura>
</VERI*FACTU>`}
              </pre>
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-xs text-emerald-600 font-medium">
                    Registrado en AEAT · {new Date().toLocaleDateString("es-ES")}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
