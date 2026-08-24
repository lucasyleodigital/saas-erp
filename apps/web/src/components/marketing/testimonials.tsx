"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { useTranslations } from "next-intl";

const TESTIMONIALS_META = [
  { key: "maria", name: "María García", initials: "MG", color: "#0d9488", stars: 5 },
  { key: "carlos", name: "Carlos López", initials: "CL", color: "#6366f1", stars: 5 },
  { key: "ana", name: "Ana Martínez", initials: "AM", color: "#f59e0b", stars: 5 },
] as const;

export function Testimonials() {
  const t = useTranslations("marketing.testimonials");

  const TESTIMONIALS = TESTIMONIALS_META.map((meta) => ({
    ...meta,
    role: t(`items.${meta.key}.role`),
    quote: t(`items.${meta.key}.quote`),
  }));

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
            {t("title")}
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            {t("subtitle")}
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
