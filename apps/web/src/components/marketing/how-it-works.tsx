"use client";

import { motion } from "framer-motion";
import { UserPlus, Upload, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

const STEP_META = [
  { key: "step1", icon: UserPlus, color: "#0d9488", bg: "rgba(13,148,136,0.1)", border: "rgba(13,148,136,0.25)" },
  { key: "step2", icon: Upload, color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)" },
  { key: "step3", icon: TrendingUp, color: "#6366f1", bg: "rgba(99,102,241,0.1)", border: "rgba(99,102,241,0.25)" },
] as const;

export function HowItWorks() {
  const t = useTranslations("marketing.howItWorks");

  const STEPS = STEP_META.map((meta) => ({
    ...meta,
    number: t(`steps.${meta.key}.number`),
    title: t(`steps.${meta.key}.title`),
    desc: t(`steps.${meta.key}.desc`),
  }));

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
            {t("badge")}
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            {t("title")}
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg">
            {t("subtitle")}
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
                    {t("stepLabel")} {step.number}
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
            {t("cta")}
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
