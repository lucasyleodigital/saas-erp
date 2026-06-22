"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

const TESTIMONIALS = [
  {
    name: "María García",
    role: "CEO, Diseño Creativo SL",
    initials: "MG",
    color: "#0d9488",
    quote:
      "YouWhole nos ha ahorrado más de 10 horas semanales de gestión contable. La integración de VeriFactu fue automática — cero configuración por nuestra parte.",
    stars: 5,
  },
  {
    name: "Carlos López",
    role: "Fundador, TechStart Barcelona",
    initials: "CL",
    color: "#6366f1",
    quote:
      "Probé otros ERPs y todos eran demasiado complejos. YouWhole lo tenemos funcionando en un día. El CRM conectado con facturación es un cambio de juego para nosotros.",
    stars: 5,
  },
  {
    name: "Ana Martínez",
    role: "Directora, Proyectos Integrales",
    initials: "AM",
    color: "#f59e0b",
    quote:
      "El cumplimiento VeriFactu con la AEAT me daba miedo, pero con YouWhole es completamente automático. Ahora facturo y sé que estoy 100% al día con Hacienda.",
    stars: 5,
  },
];

export function Testimonials() {
  return (
    <section className="py-24 bg-muted/20">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Lo que dicen nuestros clientes
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Autonomos y pymes que ya gestionan su negocio completo con YouWhole.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              className="bg-background rounded-2xl p-6 border border-border relative overflow-hidden"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.45 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              {/* Color accent top */}
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ background: `linear-gradient(90deg, ${t.color}, transparent)` }}
              />

              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.stars }).map((_, s) => (
                  <Star key={s} className="h-4 w-4 fill-current" style={{ color: "#f59e0b" }} />
                ))}
              </div>

              {/* Quote */}
              <p className="text-sm leading-relaxed text-muted-foreground mb-6">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                  style={{ background: t.color }}
                >
                  {t.initials}
                </div>
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
