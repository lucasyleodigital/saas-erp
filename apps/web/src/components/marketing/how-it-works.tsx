"use client";

import { motion } from "framer-motion";
import { UserPlus, Upload, TrendingUp } from "lucide-react";
import Link from "next/link";

const STEPS = [
  {
    number: "01",
    icon: UserPlus,
    title: "Crea tu cuenta en 30 segundos",
    desc: "Regístrate con tu email. Sin tarjeta de crédito, sin letra pequeña. Tu empresa lista para facturar en minutos.",
    color: "#0d9488",
    bg: "rgba(13,148,136,0.1)",
    border: "rgba(13,148,136,0.25)",
  },
  {
    number: "02",
    icon: Upload,
    title: "Importa tus datos existentes",
    desc: "Sube tu listado de clientes desde Excel, CSV o conecta con tu gestoría actual. La migración es guiada y automática.",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.1)",
    border: "rgba(245,158,11,0.25)",
  },
  {
    number: "03",
    icon: TrendingUp,
    title: "Factura, gestiona y crece",
    desc: "CRM, facturación VeriFactu, contabilidad y nóminas conectados. Un solo panel para toda tu empresa.",
    color: "#6366f1",
    bg: "rgba(99,102,241,0.1)",
    border: "rgba(99,102,241,0.25)",
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 bg-background overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium mb-4 border"
            style={{
              background: "rgba(13,148,136,0.08)",
              borderColor: "rgba(13,148,136,0.25)",
              color: "#0d9488",
            }}
          >
            Empieza hoy
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            En marcha en menos de 5 minutos
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg">
            Sin formación, sin consultor, sin horas de configuración.
            YouWhole está diseñado para arrancar solo.
          </p>
        </motion.div>

        <div className="relative">
          {/* Connector line */}
          <div
            className="absolute top-10 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-px hidden md:block"
            style={{ background: "linear-gradient(90deg, rgba(13,148,136,0.3), rgba(99,102,241,0.3))" }}
            aria-hidden="true"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.number}
                  className="flex flex-col items-center text-center"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.5 }}
                >
                  {/* Circle with icon */}
                  <div
                    className="relative w-20 h-20 rounded-2xl flex items-center justify-center mb-6 border-2"
                    style={{ background: step.bg, borderColor: step.border }}
                  >
                    <Icon className="h-8 w-8" style={{ color: step.color }} />
                    <span
                      className="absolute -top-3 -right-3 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: step.color }}
                    >
                      {i + 1}
                    </span>
                  </div>

                  <div
                    className="text-xs font-mono font-bold mb-2 tracking-widest"
                    style={{ color: step.color }}
                  >
                    PASO {step.number}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm max-w-xs">
                    {step.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>

        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          <Link
            href="/registro"
            className="inline-flex items-center gap-2 rounded-xl px-8 h-13 text-base font-semibold text-white transition-all hover:scale-105 active:scale-95"
            style={{
              height: 52,
              background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
              boxShadow: "0 4px 24px rgba(13,148,136,0.35)",
            }}
          >
            Crear cuenta gratis — sin tarjeta
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
