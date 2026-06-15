"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "¿Qué es VeriFactu y por qué lo necesito?",
    a: "VeriFactu es el sistema de verificación de facturas de la Agencia Tributaria española. Desde 2025, toda empresa que use un software de facturación está obligada a usar sistemas certificados VeriFactu. YouWhole lo incluye de serie — no necesitas hacer nada extra para cumplir la ley.",
  },
  {
    q: "¿Qué pasa cuando termina el período de prueba de 14 días?",
    a: "Si no introduces ningún método de pago, tu cuenta pasa automáticamente al plan Gratuito (hasta 5 clientes y 10 facturas al mes). No se te cobra nada ni se cancela tu cuenta. Tú decides cuándo y si quieres hacer upgrade.",
  },
  {
    q: "¿Puedo importar mis datos desde otro programa o Excel?",
    a: "Sí. Puedes importar clientes, productos y facturas históricas desde archivos Excel o CSV. También contamos con asistencia de migración desde los programas de facturación más habituales en España. Contáctanos y te ayudamos.",
  },
  {
    q: "¿Cuántos usuarios puede tener mi empresa?",
    a: "El plan Gratuito incluye 1 usuario. El plan Starter incluye 3 usuarios, el Pro hasta 10 y el Enterprise permite usuarios ilimitados con control de roles y permisos por departamento.",
  },
  {
    q: "¿Es seguro guardar mis facturas y datos de empresa en YouWhole?",
    a: "Sí. Todos tus datos se almacenan cifrados en servidores europeos con cumplimiento RGPD, backups diarios automáticos y acceso protegido mediante autenticación de doble factor (2FA). Jamás compartimos tus datos con terceros.",
  },
  {
    q: "¿Puedo cancelar mi suscripción cuando quiera?",
    a: "Sí, sin permanencia ni penalizaciones. Si cancelas, sigues teniendo acceso hasta el final del período ya pagado. Después, tu cuenta pasa al plan Gratuito y conservas todos tus datos.",
  },
  {
    q: "¿YouWhole funciona para cualquier tipo de empresa española?",
    a: "Está diseñado para autónomos y pymes de cualquier sector: servicios, comercio, construcción, tecnología, hostelería... Si tienes necesidades específicas de gran empresa o franquicia, escríbenos y preparamos una demo personalizada.",
  },
  {
    q: "¿Tienen soporte técnico en español?",
    a: "Sí, siempre. Contamos con soporte por chat y email en español, de lunes a viernes de 9:00 a 18:00 (hora española). Los clientes Pro y Enterprise también tienen acceso a soporte prioritario.",
  },
];

function FaqItem({ item, index }: { item: (typeof FAQS)[0]; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06 }}
      className="border-b border-border last:border-0"
    >
      <button
        className="w-full flex items-center justify-between gap-4 py-5 text-left hover:text-foreground transition-colors"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="font-medium text-sm sm:text-base pr-2">{item.q}</span>
        <ChevronDown
          className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm text-muted-foreground leading-relaxed pr-8">
              {item.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function Faq() {
  return (
    <section id="faq" className="py-24 bg-muted/20">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-14"
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
            Preguntas frecuentes
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">¿Tienes dudas?</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Aquí resolvemos las preguntas más habituales. Si no encuentras tu respuesta,
            escríbenos por el chat.
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto bg-background rounded-2xl border border-border px-6 sm:px-10">
          {FAQS.map((item, i) => (
            <FaqItem key={item.q} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
