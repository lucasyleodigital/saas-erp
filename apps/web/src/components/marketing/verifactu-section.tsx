"use client";

import { motion } from "framer-motion";
import { Shield, Lock, FileCheck, CheckCircle, ArrowRight, Building2, Zap, Landmark } from "lucide-react";
import { useTranslations } from "next-intl";

const POINTS_META = [
  { key: "hash", icon: Shield, color: "#0d9488" },
  { key: "registry", icon: Lock, color: "#6366f1" },
  { key: "xml", icon: FileCheck, color: "#f59e0b" },
  { key: "validation", icon: CheckCircle, color: "#10b981" },
] as const;

const FLOW_META = [
  { key: "company", Icon: Building2, color: "#0d9488", border: "rgba(13,148,136,0.4)", bg: "rgba(13,148,136,0.12)" },
  { key: "youwhole", Icon: Zap, color: "#6366f1", border: "rgba(99,102,241,0.4)", bg: "rgba(99,102,241,0.12)" },
  { key: "aeat", Icon: Landmark, color: "#f59e0b", border: "rgba(245,158,11,0.4)", bg: "rgba(245,158,11,0.12)" },
  { key: "compliance", Icon: CheckCircle, color: "#10b981", border: "rgba(16,185,129,0.4)", bg: "rgba(16,185,129,0.12)" },
] as const;

export function VerifactuSection() {
  const t = useTranslations("marketing.verifactu");

  const POINTS = POINTS_META.map((meta) => ({
    ...meta,
    title: t(`points.${meta.key}.title`),
    desc: t(`points.${meta.key}.desc`),
  }));

  const FLOW_STEPS = FLOW_META.map((meta) => ({
    ...meta,
    label: t(`flow.${meta.key}.label`),
    sublabel: t(`flow.${meta.key}.sublabel`),
  }));

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
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium mb-5 border"
            style={{
              background: "rgba(13,148,136,0.12)",
              borderColor: "rgba(13,148,136,0.3)",
              color: "#5eead4",
            }}
          >
            <Shield className="h-3.5 w-3.5" />
            {t("badge")}
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
            {t("titleLine1")}
            <br />
            <span style={{ color: "#2dd4bf" }}>{t("titleLine2")}</span>
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: "#94a3b8" }}>
            {t("subtitle")}
          </p>
        </motion.div>

        {/* Flow diagram */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-0 mb-16"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          {FLOW_STEPS.map((step, i) => (
            <div key={step.label} className="flex sm:flex-row flex-col items-center">
              <motion.div
                className="flex flex-col items-center text-center px-5 py-4 rounded-2xl border min-w-[130px]"
                style={{ background: step.bg, borderColor: step.border }}
                initial={{ opacity: 0, scale: 0.85 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
              >
                <step.Icon className="h-7 w-7 mb-2" style={{ color: step.color }} />
                <span className="font-bold text-white text-sm mb-0.5">{step.label}</span>
                <span className="text-xs" style={{ color: step.color }}>{step.sublabel}</span>
              </motion.div>

              {i < FLOW_STEPS.length - 1 && (
                <div className="flex items-center justify-center sm:mx-2 my-2 sm:my-0">
                  <ArrowRight
                    className="h-5 w-5 sm:block hidden"
                    style={{ color: "rgba(13,148,136,0.5)" }}
                  />
                  <div
                    className="h-6 w-0.5 sm:hidden"
                    style={{ background: "rgba(13,148,136,0.3)" }}
                  />
                </div>
              )}
            </div>
          ))}
        </motion.div>

        {/* 4 feature cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {POINTS.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl p-5 border"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  borderColor: "rgba(255,255,255,0.08)",
                }}
              >
                <Icon className="h-5 w-5 mb-3" style={{ color: p.color }} />
                <p className="font-semibold text-sm mb-1.5 text-white">{p.title}</p>
                <p className="text-xs leading-relaxed" style={{ color: "#64748b" }}>{p.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
