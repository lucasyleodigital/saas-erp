"use client";

import { motion } from "framer-motion";
import { Shield, Lock, FileCheck, CheckCircle } from "lucide-react";

const POINTS = [
  {
    icon: Shield,
    title: "Hash SHA256 en cadena",
    desc: "Cada factura firma la anterior, creando una cadena inmutable que garantiza la integridad de todos los registros.",
    color: "#0d9488",
  },
  {
    icon: Lock,
    title: "Registro directo en AEAT",
    desc: "Envío automático al sistema VERI*FACTU de la Agencia Tributaria con código QR de verificación incluido.",
    color: "#6366f1",
  },
  {
    icon: FileCheck,
    title: "XML certificado",
    desc: "Generamos el XML según la especificación técnica oficial de AEAT con todos los campos obligatorios.",
    color: "#f59e0b",
  },
  {
    icon: CheckCircle,
    title: "Validación automática",
    desc: "Verificamos cada registro antes del envío para garantizar el cumplimiento total con la Ley Antifraude.",
    color: "#10b981",
  },
];

export function VerifactuSection() {
  return (
    <section
      id="verifactu"
      className="py-24 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #040c0a 0%, #061410 60%, #080f0c 100%)",
      }}
    >
      {/* Background glow */}
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(13,148,136,0.12) 0%, transparent 70%)" }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: text */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
          >
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium mb-6 border"
              style={{
                background: "rgba(13,148,136,0.12)",
                borderColor: "rgba(13,148,136,0.3)",
                color: "#5eead4",
              }}
            >
              <Shield className="h-4 w-4" />
              VeriFactu certificado
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-5 text-white leading-tight">
              Cumplimiento fiscal total
              <br />
              <span style={{ color: "#2dd4bf" }}>desde el primer día</span>
            </h2>

            <p className="text-lg leading-relaxed mb-8" style={{ color: "#94a3b8" }}>
              La Ley VeriFactu (Ley Antifraude 11/2021) obliga a registrar cada
              factura en la AEAT desde 2025. Con YouWhole, esto ocurre
              automáticamente — sin configuración, sin trabajo extra.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {POINTS.map((p, i) => {
                const Icon = p.icon;
                return (
                  <motion.div
                    key={p.title}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="rounded-xl p-4 border"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      borderColor: "rgba(255,255,255,0.08)",
                    }}
                  >
                    <Icon className="h-5 w-5 mb-2" style={{ color: p.color }} />
                    <p className="font-medium text-sm mb-1 text-white">{p.title}</p>
                    <p className="text-xs leading-relaxed" style={{ color: "#64748b" }}>
                      {p.desc}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Right: XML code mockup */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.1 }}
          >
            {/* Glow behind card */}
            <div
              aria-hidden="true"
              className="absolute inset-0 rounded-3xl blur-2xl"
              style={{ background: "rgba(13,148,136,0.15)", transform: "scale(1.1)" }}
            />

            <div
              className="relative rounded-2xl border overflow-hidden"
              style={{
                background: "rgba(3,9,8,0.95)",
                borderColor: "rgba(13,148,136,0.3)",
                boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
              }}
            >
              {/* Window chrome */}
              <div
                className="flex items-center gap-2 px-4 py-3 border-b"
                style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(0,0,0,0.3)" }}
              >
                <div className="h-3 w-3 rounded-full" style={{ background: "#ef4444" }} />
                <div className="h-3 w-3 rounded-full" style={{ background: "#f59e0b" }} />
                <div className="h-3 w-3 rounded-full" style={{ background: "#22c55e" }} />
                <span className="ml-2 text-xs font-mono" style={{ color: "#475569" }}>
                  verifactu.xml
                </span>
              </div>

              <div className="p-5">
                <pre
                  className="text-xs leading-relaxed overflow-auto"
                  style={{ fontFamily: "ui-monospace, 'Cascadia Code', monospace" }}
                >
                  <span style={{ color: "#64748b" }}>&lt;</span>
                  <span style={{ color: "#2dd4bf" }}>VERI*FACTU</span>
                  <span style={{ color: "#64748b" }}>&gt;</span>
                  {"\n"}
                  {"  "}<span style={{ color: "#64748b" }}>&lt;</span>
                  <span style={{ color: "#5eead4" }}>Cabecera</span>
                  <span style={{ color: "#64748b" }}>&gt;</span>
                  {"\n"}
                  {"    "}<span style={{ color: "#64748b" }}>&lt;</span>
                  <span style={{ color: "#7dd3fc" }}>NIF</span>
                  <span style={{ color: "#64748b" }}>&gt;</span>
                  <span style={{ color: "#fde68a" }}>B12345678</span>
                  <span style={{ color: "#64748b" }}>&lt;/</span>
                  <span style={{ color: "#7dd3fc" }}>NIF</span>
                  <span style={{ color: "#64748b" }}>&gt;</span>
                  {"\n"}
                  {"    "}<span style={{ color: "#64748b" }}>&lt;</span>
                  <span style={{ color: "#7dd3fc" }}>NombreRazon</span>
                  <span style={{ color: "#64748b" }}>&gt;</span>
                  <span style={{ color: "#fde68a" }}>Mi Empresa SL</span>
                  <span style={{ color: "#64748b" }}>&lt;/</span>
                  <span style={{ color: "#7dd3fc" }}>NombreRazon</span>
                  <span style={{ color: "#64748b" }}>&gt;</span>
                  {"\n"}
                  {"  "}<span style={{ color: "#64748b" }}>&lt;/</span>
                  <span style={{ color: "#5eead4" }}>Cabecera</span>
                  <span style={{ color: "#64748b" }}>&gt;</span>
                  {"\n"}
                  {"  "}<span style={{ color: "#64748b" }}>&lt;</span>
                  <span style={{ color: "#5eead4" }}>RegistroFactura</span>
                  <span style={{ color: "#64748b" }}>&gt;</span>
                  {"\n"}
                  {"    "}<span style={{ color: "#64748b" }}>&lt;</span>
                  <span style={{ color: "#7dd3fc" }}>NumSerie</span>
                  <span style={{ color: "#64748b" }}>&gt;</span>
                  <span style={{ color: "#fde68a" }}>F-2025-0001</span>
                  <span style={{ color: "#64748b" }}>&lt;/</span>
                  <span style={{ color: "#7dd3fc" }}>NumSerie</span>
                  <span style={{ color: "#64748b" }}>&gt;</span>
                  {"\n"}
                  {"    "}<span style={{ color: "#64748b" }}>&lt;</span>
                  <span style={{ color: "#7dd3fc" }}>ImporteTotal</span>
                  <span style={{ color: "#64748b" }}>&gt;</span>
                  <span style={{ color: "#6ee7b7" }}>1210.00</span>
                  <span style={{ color: "#64748b" }}>&lt;/</span>
                  <span style={{ color: "#7dd3fc" }}>ImporteTotal</span>
                  <span style={{ color: "#64748b" }}>&gt;</span>
                  {"\n"}
                  {"    "}<span style={{ color: "#64748b" }}>&lt;</span>
                  <span style={{ color: "#7dd3fc" }}>Huella</span>
                  <span style={{ color: "#64748b" }}>&gt;</span>
                  {"\n"}
                  {"      "}<span style={{ color: "#a78bfa" }}>a3f8c2d1e9b4712f...</span>
                  {"\n"}
                  {"    "}<span style={{ color: "#64748b" }}>&lt;/</span>
                  <span style={{ color: "#7dd3fc" }}>Huella</span>
                  <span style={{ color: "#64748b" }}>&gt;</span>
                  {"\n"}
                  {"  "}<span style={{ color: "#64748b" }}>&lt;/</span>
                  <span style={{ color: "#5eead4" }}>RegistroFactura</span>
                  <span style={{ color: "#64748b" }}>&gt;</span>
                  {"\n"}
                  <span style={{ color: "#64748b" }}>&lt;/</span>
                  <span style={{ color: "#2dd4bf" }}>VERI*FACTU</span>
                  <span style={{ color: "#64748b" }}>&gt;</span>
                </pre>
              </div>

              <div
                className="flex items-center gap-3 px-5 py-3 border-t"
                style={{ borderColor: "rgba(255,255,255,0.07)" }}
              >
                <div className="h-2.5 w-2.5 rounded-full animate-pulse" style={{ background: "#10b981" }} />
                <span className="text-xs font-medium" style={{ color: "#10b981" }}>
                  Registrado en AEAT · {new Date().toLocaleDateString("es-ES")} · Estado: CORRECTO
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
