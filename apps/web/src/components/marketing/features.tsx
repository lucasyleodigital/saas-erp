"use client";

import { motion } from "framer-motion";
import {
  FileText,
  Users,
  BarChart3,
  Shield,
  Zap,
  Calculator,
  Package,
  Bell,
} from "lucide-react";

const FEATURES = [
  {
    icon: FileText,
    title: "Facturación electrónica",
    desc: "Crea, envía y cobra facturas profesionales. Genera automáticamente el XML VeriFactu para cumplir con la AEAT.",
    color: "bg-blue-500/10 text-blue-600",
  },
  {
    icon: Shield,
    title: "VeriFactu nativo",
    desc: "Hash SHA256 en cadena, registro inmutable y envío directo a la AEAT. Cumplimiento total desde el primer día.",
    color: "bg-purple-500/10 text-purple-600",
  },
  {
    icon: Users,
    title: "CRM integrado",
    desc: "Gestiona clientes, leads y pipeline de ventas desde el mismo lugar donde facturas. Sin integraciones.",
    color: "bg-emerald-500/10 text-emerald-600",
  },
  {
    icon: BarChart3,
    title: "Pipeline Kanban",
    desc: "Visualiza y mueve tus oportunidades de venta entre etapas con drag & drop. Cierra más deals.",
    color: "bg-amber-500/10 text-amber-600",
  },
  {
    icon: Calculator,
    title: "Contabilidad",
    desc: "Libro diario, plan de cuentas PGC, cierres y balances. Todo conectado automáticamente con tus facturas.",
    color: "bg-red-500/10 text-red-600",
  },
  {
    icon: Package,
    title: "Inventario",
    desc: "Control de stock, movimientos y alertas de mínimos. Perfecto para negocios con producto físico.",
    color: "bg-indigo-500/10 text-indigo-600",
  },
  {
    icon: Zap,
    title: "Automatizaciones",
    desc: "Facturas recurrentes, recordatorios de cobro automáticos y flujos de trabajo sin configuración manual.",
    color: "bg-pink-500/10 text-pink-600",
  },
  {
    icon: Bell,
    title: "Notificaciones inteligentes",
    desc: "Alertas de vencimientos, pagos recibidos y actividad del equipo en tiempo real.",
    color: "bg-cyan-500/10 text-cyan-600",
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 bg-muted/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Todo lo que necesita tu empresa
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg">
            Diseñado específicamente para el mercado español. Cumplimiento
            fiscal total incluido de serie.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
                viewport={{ once: true }}
                className="bg-background rounded-xl p-5 border border-border hover:border-primary/30 hover:shadow-sm transition-all"
              >
                <div
                  className={`w-10 h-10 rounded-lg ${f.color} flex items-center justify-center mb-4`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold mb-2 text-sm">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {f.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
