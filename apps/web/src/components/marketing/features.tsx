"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  FileText,
  Users,
  BarChart3,
  Shield,
  Zap,
  Calculator,
  Package,
  Bell,
  TrendingUp,
  ClipboardList,
  FolderKanban,
  Timer,
  Globe,
  Landmark,
  HardDrive,
} from "lucide-react";

const FEATURE_META = [
  { key: "invoicing", icon: FileText, color: "#0d9488", bg: "rgba(13,148,136,0.08)", border: "rgba(13,148,136,0.2)", glow: "rgba(13,148,136,0.15)", size: "large" },
  { key: "verifactuNative", icon: Shield, color: "#6366f1", bg: "rgba(99,102,241,0.08)", border: "rgba(99,102,241,0.2)", glow: "rgba(99,102,241,0.12)" },
  { key: "crm", icon: Users, color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)", glow: "rgba(245,158,11,0.12)" },
  { key: "pipeline", icon: BarChart3, color: "#ec4899", bg: "rgba(236,72,153,0.08)", border: "rgba(236,72,153,0.2)", glow: "rgba(236,72,153,0.12)" },
  { key: "accounting", icon: Calculator, color: "#10b981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)", glow: "rgba(16,185,129,0.12)" },
  { key: "inventory", icon: Package, color: "#3b82f6", bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.2)", glow: "rgba(59,130,246,0.12)" },
  { key: "payroll", icon: ClipboardList, color: "#8b5cf6", bg: "rgba(139,92,246,0.08)", border: "rgba(139,92,246,0.2)", glow: "rgba(139,92,246,0.12)" },
  { key: "automations", icon: Zap, color: "#f97316", bg: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.2)", glow: "rgba(249,115,22,0.12)" },
  { key: "reporting", icon: TrendingUp, color: "#06b6d4", bg: "rgba(6,182,212,0.08)", border: "rgba(6,182,212,0.2)", glow: "rgba(6,182,212,0.12)" },
  { key: "notifications", icon: Bell, color: "#14b8a6", bg: "rgba(20,184,166,0.08)", border: "rgba(20,184,166,0.2)", glow: "rgba(20,184,166,0.12)" },
  { key: "projects", icon: FolderKanban, color: "#a855f7", bg: "rgba(168,85,247,0.08)", border: "rgba(168,85,247,0.2)", glow: "rgba(168,85,247,0.12)" },
  { key: "timeTracking", icon: Timer, color: "#e11d48", bg: "rgba(225,29,72,0.08)", border: "rgba(225,29,72,0.2)", glow: "rgba(225,29,72,0.12)" },
  { key: "multiLanguage", icon: Globe, color: "#0ea5e9", bg: "rgba(14,165,233,0.08)", border: "rgba(14,165,233,0.2)", glow: "rgba(14,165,233,0.12)" },
  { key: "bankReconciliation", icon: Landmark, color: "#84cc16", bg: "rgba(132,204,22,0.08)", border: "rgba(132,204,22,0.2)", glow: "rgba(132,204,22,0.12)" },
  { key: "backup", icon: HardDrive, color: "#64748b", bg: "rgba(100,116,139,0.08)", border: "rgba(100,116,139,0.2)", glow: "rgba(100,116,139,0.12)" },
] as const;

interface FeatureCardData {
  key: string;
  icon: (typeof FEATURE_META)[number]["icon"];
  color: string;
  bg: string;
  border: string;
  glow: string;
  title: string;
  desc: string;
}

interface FeatureCardProps {
  feature: FeatureCardData;
  index: number;
  large?: boolean;
}

function FeatureCard({ feature, index, large }: FeatureCardProps) {
  const Icon = feature.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.07, duration: 0.45 }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="rounded-2xl p-6 border relative overflow-hidden group cursor-default"
      style={{
        background: feature.bg,
        borderColor: feature.border,
      }}
    >
      {/* Glow on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(400px circle at 50% 0%, ${feature.glow}, transparent 60%)`,
        }}
      />

      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 border"
        style={{ background: feature.bg, borderColor: feature.border }}
      >
        <Icon className="h-5 w-5" style={{ color: feature.color }} />
      </div>

      <h3
        className={`font-semibold mb-2 ${large ? "text-xl" : "text-base"}`}
        style={{ color: "hsl(var(--foreground))" }}
      >
        {feature.title}
      </h3>
      <p className={`text-muted-foreground leading-relaxed ${large ? "text-base" : "text-sm"}`}>
        {feature.desc}
      </p>
    </motion.div>
  );
}

const BOKEH = [
  { w: 520, h: 520, l: -6, t: 8,  c: "rgba(13,148,136,0.28)", dur: 22, dx: 38,  dy: -22, d: 0  },
  { w: 420, h: 420, l: 58, t: -12, c: "rgba(99,102,241,0.22)", dur: 28, dx: -32, dy: 42,  d: 6  },
  { w: 640, h: 640, l: 72, t: 38, c: "rgba(20,184,166,0.20)", dur: 20, dx: -28, dy: -32, d: 10 },
  { w: 360, h: 360, l: 18, t: 68, c: "rgba(245,158,11,0.20)", dur: 26, dx: 42,  dy: 18,  d: 4  },
  { w: 480, h: 480, l: 38, t: 52, c: "rgba(99,102,241,0.20)", dur: 32, dx: -22, dy: -38, d: 14 },
];

export function Features() {
  const t = useTranslations("marketing.features");

  const MAIN_FEATURES: FeatureCardData[] = FEATURE_META.map((meta) => ({
    ...meta,
    title: t(`items.${meta.key}.title`),
    desc: t(`items.${meta.key}.desc`),
  }));

  const main = MAIN_FEATURES[0]!;
  const rest = MAIN_FEATURES.slice(1);
  const secondRow = rest.slice(0, 3);
  const thirdRow = rest.slice(3, 6);
  const fourthRow = rest.slice(6, 9);
  const fifthRow = rest.slice(9, 12);
  const sixthRow = rest.slice(12);

  return (
    <section
      id="features"
      className="py-24 relative overflow-hidden"
      style={{ background: "linear-gradient(180deg, #060e0c 0%, #040c0a 55%, #060e0c 100%)" }}
    >
      {/* Bokeh orbs */}
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none">
        {BOKEH.map((orb, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${orb.w}px`,
              height: `${orb.h}px`,
              left: `${orb.l}%`,
              top: `${orb.t}%`,
              background: `radial-gradient(circle, ${orb.c} 0%, transparent 70%)`,
              filter: "blur(40px)",
            }}
            animate={{ x: [0, orb.dx, 0], y: [0, orb.dy, 0] }}
            transition={{ duration: orb.dur, repeat: Infinity, ease: "easeInOut", delay: orb.d }}
          />
        ))}
        {/* Subtle dot grid */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(rgba(13,148,136,0.12) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium mb-4 border"
            style={{
              background: "rgba(13,148,136,0.10)",
              borderColor: "rgba(13,148,136,0.28)",
              color: "#2dd4bf",
            }}
          >
            {t("badge")}
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-white">
            {t("title")}
          </h2>
          <p className="max-w-xl mx-auto text-lg" style={{ color: "#94a3b8" }}>
            {t("subtitle")}
          </p>
        </motion.div>

        {/* Bento row 1: large + 3 small */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
          <div className="md:col-span-1">
            <FeatureCard feature={main} index={0} large />
          </div>
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {secondRow.map((f, i) => (
              <FeatureCard key={f.key} feature={f} index={i + 1} />
            ))}
          </div>
        </div>

        {/* Row 2: 3 equal */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-5">
          {thirdRow.map((f, i) => (
            <FeatureCard key={f.key} feature={f} index={i + 4} />
          ))}
        </div>

        {/* Row 3: 3 equal */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-5">
          {fourthRow.map((f, i) => (
            <FeatureCard key={f.key} feature={f} index={i + 7} />
          ))}
        </div>

        {/* Row 4: 3 equal */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-5">
          {fifthRow.map((f, i) => (
            <FeatureCard key={f.key} feature={f} index={i + 10} />
          ))}
        </div>

        {/* Row 5: remaining */}
        {sixthRow.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {sixthRow.map((f, i) => (
              <FeatureCard key={f.key} feature={f} index={i + 13} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
