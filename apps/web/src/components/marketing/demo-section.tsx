"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Users, BarChart2, Check, Zap } from "lucide-react";

type TabId = "facturas" | "crm" | "analitica";

const TABS: { id: TabId; label: string; icon: typeof FileText }[] = [
  { id: "facturas", label: "Facturación", icon: FileText },
  { id: "crm", label: "Pipeline CRM", icon: Users },
  { id: "analitica", label: "Analítica", icon: BarChart2 },
];

const TAB_DURATION = 6500;

function useTypewriter(text: string, speed: number, active: boolean) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    if (!active) { setDisplayed(""); return; }
    setDisplayed("");
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed, active]);
  return displayed;
}

function Cursor() {
  return <span className="inline-block w-0.5 h-4 ml-0.5 align-middle animate-pulse" style={{ background: "#2dd4bf" }} />;
}

function FacturasScreen() {
  const [step, setStep] = useState(0);
  const cliente = useTypewriter("Restaurante La Marina S.L.", 32, step >= 0);
  const concepto = useTypewriter("Servicios digitales — Junio 2025", 28, step >= 1);
  const importe = useTypewriter("3.200,00", 55, step >= 2);

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 850);
    const t2 = setTimeout(() => setStep(2), 1900);
    const t3 = setTimeout(() => setStep(3), 3300);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div className="p-5 h-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold text-sm">Nueva Factura</h3>
        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(13,148,136,0.18)", color: "#2dd4bf" }}>Borrador</span>
      </div>
      <div className="grid grid-cols-2 gap-4 flex-1">
        <div className="space-y-3">
          {[
            { label: "Cliente", value: cliente, active: step >= 0, color: "white" },
            { label: "Concepto", value: concepto, active: step >= 1, color: "white" },
            { label: "Importe (€)", value: importe, active: step >= 2, color: "#0d9488" },
          ].map(({ label, value, active, color }) => (
            <div key={label}>
              <label className="text-[9px] uppercase tracking-widest mb-1 block" style={{ color: "#475569" }}>{label}</label>
              <div className="rounded-lg border px-3 py-2 text-xs min-h-[34px] flex items-center" style={{ background: "rgba(255,255,255,0.04)", borderColor: active ? "rgba(13,148,136,0.4)" : "rgba(255,255,255,0.08)", color }}>
                {active ? <>{value}<Cursor /></> : <span style={{ color: "#334155" }}>—</span>}
              </div>
            </div>
          ))}
          <AnimatePresence>
            {step >= 3 && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="rounded-xl p-3 flex items-center gap-2.5"
                style={{ background: "rgba(13,148,136,0.13)", border: "1px solid rgba(13,148,136,0.3)" }}
              >
                <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(13,148,136,0.25)" }}>
                  <Check className="h-3.5 w-3.5" style={{ color: "#2dd4bf" }} />
                </div>
                <div>
                  <p className="text-[11px] font-semibold" style={{ color: "#2dd4bf" }}>Registrado en VeriFactu ✓</p>
                  <p className="text-[9px]" style={{ color: "#475569" }}>Hash SHA256: AB2F9C44 · AEAT confirmado</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Invoice preview */}
        <div className="rounded-xl border overflow-hidden flex flex-col" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.07)" }}>
          <div className="px-3 py-2 border-b flex items-center justify-between" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.07)" }}>
            <span className="text-[9px] font-bold tracking-wider" style={{ color: "#64748b" }}>FACTURA #2025-0094</span>
            {step >= 3 && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="h-2 w-2 rounded-full" style={{ background: "#22c55e" }} />
            )}
          </div>
          <div className="p-3 flex-1 space-y-2">
            <div className="h-1.5 rounded-full w-3/4" style={{ background: "rgba(255,255,255,0.06)" }} />
            <div className="h-1.5 rounded-full w-1/2" style={{ background: "rgba(255,255,255,0.06)" }} />
            <div className="h-1.5 rounded-full w-2/3" style={{ background: "rgba(255,255,255,0.04)" }} />
            <div className="my-2 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }} />
            <div className="flex items-center justify-between">
              <div className="h-1 rounded-full w-1/4" style={{ background: "rgba(255,255,255,0.04)" }} />
              <span className="text-[11px] font-bold tabular-nums" style={{ color: step >= 2 ? "#0d9488" : "#1e293b" }}>
                {step >= 2 ? "3.200,00 €" : "—"}
              </span>
            </div>
            {step >= 3 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 pt-3 border-t flex items-center gap-1.5" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                <Zap className="h-3 w-3" style={{ color: "#f59e0b" }} />
                <span style={{ fontSize: 8, color: "#475569" }}>VeriFactu QR · Firmado SHA256</span>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const PIPELINE_COLS = [
  { label: "Prospecto", color: "#475569", bg: "rgba(71,85,105,0.15)", cards: [{ name: "Ferretería López", val: "1.200€" }, { name: "Clínica Dental Vidal", val: "800€" }] },
  { label: "Lead", color: "#6366f1", bg: "rgba(99,102,241,0.15)", cards: [{ name: "Constructora Bernal", val: "5.500€" }] },
  { label: "Propuesta", color: "#f59e0b", bg: "rgba(245,158,11,0.15)", cards: [{ name: "Grupo Textil Nord", val: "8.900€" }] },
  { label: "Ganado ✓", color: "#22c55e", bg: "rgba(34,197,94,0.12)", cards: [{ name: "Restaurante La Marina", val: "3.200€" }] },
];

function CrmScreen() {
  const [moved, setMoved] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMoved(true), 2800);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="p-5 h-full flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold text-sm">Pipeline CRM</h3>
        <span className="text-[9px]" style={{ color: "#64748b" }}>6 oportunidades · 19.600€</span>
      </div>
      <div className="flex gap-2.5 flex-1 overflow-hidden">
        {PIPELINE_COLS.map((col, ci) => (
          <div key={col.label} className="flex-1 flex flex-col gap-1.5 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <div className="h-1.5 w-1.5 rounded-full" style={{ background: col.color }} />
              <span className="text-[8px] font-bold uppercase tracking-wide truncate" style={{ color: col.color }}>{col.label}</span>
            </div>
            {col.cards.map((card) => (
              <motion.div
                key={card.name}
                layout
                className="rounded-lg p-2 border"
                style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.07)" }}
                animate={ci === 1 && moved ? { opacity: 0, scale: 0.85 } : {}}
                transition={{ duration: 0.4 }}
              >
                <p className="text-[8px] font-medium text-white truncate">{card.name}</p>
                <p className="text-[8px] mt-0.5 tabular-nums" style={{ color: col.color }}>{card.val}</p>
              </motion.div>
            ))}
            <AnimatePresence>
              {ci === 1 && moved && (
                <motion.div
                  initial={{ opacity: 0, y: -12, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="rounded-lg p-2 border"
                  style={{ background: col.bg, borderColor: `${col.color}44` }}
                >
                  <p className="text-[8px] font-medium text-white">Hotel Mediterráneo</p>
                  <p className="text-[8px] mt-0.5 tabular-nums" style={{ color: col.color }}>3.200€</p>
                </motion.div>
              )}
              {ci === 2 && moved && (
                <motion.div
                  initial={{ opacity: 0, y: -12, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.15 }}
                  className="rounded-lg p-2 border"
                  style={{ background: col.bg, borderColor: `${col.color}44` }}
                >
                  <p className="text-[8px] font-medium text-white">Constructora Bernal</p>
                  <p className="text-[8px] mt-0.5 tabular-nums" style={{ color: col.color }}>5.500€</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
      <AnimatePresence>
        {moved && (
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-xl border px-3 py-2 flex items-center gap-2"
            style={{ background: "rgba(34,197,94,0.08)", borderColor: "rgba(34,197,94,0.25)" }}
          >
            <Check className="h-3.5 w-3.5 shrink-0" style={{ color: "#22c55e" }} />
            <p className="text-[10px] font-medium text-white">Oportunidad avanzada — Constructora Bernal → Propuesta</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const BAR_H = [28, 42, 35, 58, 48, 70, 60, 82, 66, 54, 76, 100];
const MONTHS = ["E", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

function AnaliticaScreen() {
  const [bars, setBars] = useState(false);
  const [notif, setNotif] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setBars(true), 250);
    const t2 = setTimeout(() => setNotif(true), 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="p-5 h-full flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold text-sm">Analítica 2025</h3>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: "#22c55e" }} />
          <span className="text-[9px]" style={{ color: "#475569" }}>Datos en tiempo real</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Facturado", value: "48.250€", delta: "+18%", color: "#0d9488" },
          { label: "Cobrado", value: "39.800€", delta: "+12%", color: "#22c55e" },
          { label: "Pipeline", value: "22.800€", delta: "+5 oport.", color: "#6366f1" },
        ].map((k) => (
          <div key={k.label} className="rounded-xl p-2.5 border" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.07)" }}>
            <div className="text-[8px] mb-1" style={{ color: "#475569" }}>{k.label}</div>
            <div className="text-[11px] font-bold mb-0.5 tabular-nums" style={{ color: k.color }}>{k.value}</div>
            <div className="text-[8px]" style={{ color: "#22c55e" }}>{k.delta}</div>
          </div>
        ))}
      </div>
      <div className="flex-1 rounded-xl border p-3 flex flex-col min-h-0" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.07)" }}>
        <div className="text-[8px] mb-2" style={{ color: "#475569" }}>Facturación mensual 2025</div>
        <div className="flex items-end gap-1 flex-1">
          {BAR_H.map((h, i) => (
            <motion.div
              key={i}
              className="flex-1 rounded-t-sm"
              initial={{ scaleY: 0, originY: 1 }}
              animate={{ scaleY: bars ? 1 : 0 }}
              transition={{ duration: 0.5, delay: bars ? i * 0.04 : 0, ease: "easeOut" }}
              style={{
                height: `${h}%`,
                background: i === 11 ? "linear-gradient(180deg,#2dd4bf,#0d9488)" : i >= 9 ? "rgba(13,148,136,0.45)" : "rgba(13,148,136,0.2)",
                transformOrigin: "bottom",
              }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-1.5">
          {MONTHS.map((m, i) => (
            <div key={i} className="flex-1 text-center" style={{ fontSize: 6, color: "#334155" }}>{m}</div>
          ))}
        </div>
      </div>
      <AnimatePresence>
        {notif && (
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl border px-3 py-2.5 flex items-center gap-3"
            style={{ background: "rgba(13,148,136,0.1)", borderColor: "rgba(13,148,136,0.3)" }}
          >
            <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(13,148,136,0.2)" }}>
              <Check className="h-3.5 w-3.5" style={{ color: "#2dd4bf" }} />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-white">Factura cobrada · Restaurante La Marina</p>
              <p className="text-[9px]" style={{ color: "#64748b" }}>+3.200,00 € · Hace un momento</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const SIDEBAR_ITEMS: { label: string; ids: TabId[] }[] = [
  { label: "Dashboard", ids: ["analitica"] },
  { label: "Facturas", ids: ["facturas"] },
  { label: "Clientes CRM", ids: ["crm"] },
  { label: "Contabilidad", ids: [] },
  { label: "Analítica", ids: ["analitica"] },
  { label: "Nóminas", ids: [] },
];

export function DemoSection() {
  const [activeTab, setActiveTab] = useState<TabId>("facturas");
  const [progress, setProgress] = useState(0);
  const cycleKey = useRef(0);

  useEffect(() => {
    const key = cycleKey.current;
    setProgress(0);
    let p = 0;
    const progressId = setInterval(() => {
      p++;
      setProgress(p);
      if (p >= 100) clearInterval(progressId);
    }, TAB_DURATION / 100);

    const advanceId = setTimeout(() => {
      if (key !== cycleKey.current) return;
      setActiveTab((prev) => {
        const idx = TABS.findIndex((t) => t.id === prev);
        const next = TABS[(idx + 1) % TABS.length];
        return next ? next.id : prev;
      });
    }, TAB_DURATION);

    return () => { clearInterval(progressId); clearTimeout(advanceId); };
  }, [activeTab]);

  const handleTabClick = (id: TabId) => {
    cycleKey.current++;
    setActiveTab(id);
  };

  return (
    <section
      className="py-24 relative overflow-hidden"
      style={{ background: "linear-gradient(180deg, hsl(var(--background)) 0%, #040c0a 25%, #061410 75%, hsl(var(--background)) 100%)" }}
    >
      {/* Background glow */}
      <div aria-hidden="true" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] rounded-full pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(13,148,136,0.07) 0%, transparent 70%)" }} />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium mb-4 border"
            style={{ background: "rgba(13,148,136,0.08)", borderColor: "rgba(13,148,136,0.25)", color: "#0d9488" }}
          >
            <span className="h-2 w-2 rounded-full animate-pulse" style={{ background: "#0d9488" }} />
            Demo interactiva
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ve YouWhole en acción
          </h2>
          <p className="max-w-md mx-auto" style={{ color: "#64748b" }}>
            Desde la primera factura hasta el cierre del año, todo en un solo lugar.
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          {/* Tab selector */}
          <div
            className="flex gap-1.5 mb-4 p-1 rounded-xl"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                  style={{
                    background: active ? "rgba(13,148,136,0.15)" : "transparent",
                    color: active ? "#2dd4bf" : "#64748b",
                    border: `1px solid ${active ? "rgba(13,148,136,0.35)" : "transparent"}`,
                  }}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Progress bar */}
          <div className="h-0.5 rounded-full mb-5 overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div
              className="h-full rounded-full transition-none"
              style={{ background: "linear-gradient(90deg, #0d9488, #2dd4bf)", width: `${progress}%` }}
            />
          </div>

          {/* App frame */}
          <motion.div
            className="rounded-2xl border overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{
              borderColor: "rgba(13,148,136,0.2)",
              boxShadow: "0 40px 100px rgba(0,0,0,0.7), 0 0 60px rgba(13,148,136,0.07)",
            }}
          >
            {/* Browser chrome */}
            <div
              className="flex items-center gap-2 px-4 py-3 border-b"
              style={{ background: "rgba(3,9,8,0.98)", borderColor: "rgba(255,255,255,0.06)" }}
            >
              <div className="h-2.5 w-2.5 rounded-full" style={{ background: "#ef4444" }} />
              <div className="h-2.5 w-2.5 rounded-full" style={{ background: "#f59e0b" }} />
              <div className="h-2.5 w-2.5 rounded-full" style={{ background: "#22c55e" }} />
              <div
                className="ml-4 flex-1 max-w-[260px] rounded-md px-3 py-1 text-xs text-center mx-auto"
                style={{ background: "rgba(255,255,255,0.05)", color: "#475569" }}
              >
                app.youwhole.com/{activeTab}
              </div>
            </div>

            {/* App layout */}
            <div className="flex" style={{ background: "#060f0d", height: 390 }}>
              {/* Sidebar */}
              <div
                className="w-40 shrink-0 border-r p-3 hidden sm:flex flex-col gap-0.5"
                style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.3)" }}
              >
                <div className="flex items-center gap-2 mb-4 pb-3 border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                  <div className="w-5 h-5 rounded flex items-center justify-center text-white text-[9px] font-bold" style={{ background: "linear-gradient(135deg,#0d9488,#14b8a6)" }}>Y</div>
                  <span className="text-[9px] font-semibold" style={{ color: "#94a3b8" }}>YouWhole</span>
                </div>
                {SIDEBAR_ITEMS.map(({ label, ids }) => {
                  const isActive = ids.includes(activeTab);
                  return (
                    <div
                      key={label}
                      className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[9px] transition-colors"
                      style={{ background: isActive ? "rgba(13,148,136,0.15)" : "transparent", color: isActive ? "#2dd4bf" : "#475569" }}
                    >
                      <div className="h-2 w-2 rounded-sm shrink-0" style={{ background: isActive ? "#0d9488" : "rgba(255,255,255,0.08)" }} />
                      {label}
                    </div>
                  );
                })}
              </div>

              {/* Content panel */}
              <div className="flex-1 overflow-hidden relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0"
                  >
                    {activeTab === "facturas" && <FacturasScreen />}
                    {activeTab === "crm" && <CrmScreen />}
                    {activeTab === "analitica" && <AnaliticaScreen />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* Footer hint */}
          <p className="text-center text-xs mt-5" style={{ color: "#334155" }}>
            Haz clic en las pestañas para explorar · Se avanza automáticamente
          </p>
        </div>
      </div>
    </section>
  );
}
