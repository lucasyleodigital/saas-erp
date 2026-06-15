"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Shield, Zap, Globe, Star } from "lucide-react";

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId: number;
    let mouseX = -9999, mouseY = -9999;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };
    window.addEventListener("mousemove", onMouseMove);

    type P = { x: number; y: number; vx: number; vy: number; r: number; a: number };
    const pts: P[] = Array.from({ length: 90 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      r: Math.random() * 2.0 + 0.5,
      a: Math.random() * 0.6 + 0.25,
    }));

    const LINK = 165, MOUSE_R = 140;

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of pts) {
        const dx = mouseX - p.x, dy = mouseY - p.y;
        const d = Math.hypot(dx, dy);
        if (d < MOUSE_R && d > 0) {
          const f = ((MOUSE_R - d) / MOUSE_R) * 0.02;
          p.vx -= (dx / d) * f;
          p.vy -= (dy / d) * f;
        }
        const spd = Math.hypot(p.vx, p.vy);
        if (spd > 1.5) { p.vx = (p.vx / spd) * 1.5; p.vy = (p.vy / spd) * 1.5; }
        p.vx *= 0.99; p.vy *= 0.99;
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x += canvas.width;
        if (p.x > canvas.width) p.x -= canvas.width;
        if (p.y < 0) p.y += canvas.height;
        if (p.y > canvas.height) p.y -= canvas.height;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(45,212,191,${p.a})`;
        ctx.fill();
      }

      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const pi = pts[i]; const pj = pts[j];
          if (!pi || !pj) continue;
          const dx = pi.x - pj.x, dy = pi.y - pj.y;
          const d = Math.hypot(dx, dy);
          if (d < LINK) {
            ctx.beginPath();
            ctx.moveTo(pi.x, pi.y);
            ctx.lineTo(pj.x, pj.y);
            ctx.strokeStyle = `rgba(13,148,136,${(1 - d / LINK) * 0.5})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      rafId = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 1 }}
    />
  );
}

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0, visible: false });
  const { scrollY } = useScroll();
  // Only parallax Y — no opacity fade so buttons stay "encendidos" while in viewport
  const y = useTransform(scrollY, [0, 600], [0, -70]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const onMove = (e: MouseEvent) => {
      const rect = section.getBoundingClientRect();
      setMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top, visible: true });
    };
    const onLeave = () => setMouse((m) => ({ ...m, visible: false }));
    section.addEventListener("mousemove", onMove);
    section.addEventListener("mouseleave", onLeave);
    return () => {
      section.removeEventListener("mousemove", onMove);
      section.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden"
      style={{
        minHeight: "100dvh",
        background: "linear-gradient(135deg, #040c0a 0%, #061410 50%, #080f0c 100%)",
      }}
    >
      {/* Mouse spotlight */}
      <div
        aria-hidden="true"
        className="absolute pointer-events-none z-0"
        style={{
          left: 0,
          top: 0,
          width: 720,
          height: 720,
          background: "radial-gradient(circle, rgba(13,148,136,0.11) 0%, transparent 70%)",
          borderRadius: "50%",
          transform: `translate(${mouse.x - 360}px, ${mouse.y - 360}px)`,
          opacity: mouse.visible ? 1 : 0,
          transition: "opacity 0.4s",
          willChange: "transform",
        }}
      />

      {/* Animated blobs */}
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-[-20%] left-[-12%] w-[700px] h-[700px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(13,148,136,0.45) 0%, transparent 70%)" }}
          animate={{ x: [0, 50, -25, 0], y: [0, -60, 35, 0], scale: [1, 1.12, 0.92, 1] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-[15%] right-[-18%] w-[650px] h-[650px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(245,158,11,0.22) 0%, transparent 70%)" }}
          animate={{ x: [0, -60, 35, 0], y: [0, 50, -35, 0], scale: [1, 1.06, 0.96, 1] }}
          transition={{ duration: 17, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        />
        <motion.div
          className="absolute bottom-[0%] left-[20%] w-[550px] h-[550px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(20,184,166,0.32) 0%, transparent 70%)" }}
          animate={{ x: [0, 25, -45, 0], y: [0, -40, 25, 0], scale: [1, 1.09, 0.94, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 7 }}
        />
        {/* Subtle grid */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(13,148,136,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(13,148,136,0.07) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
        {/* Particle canvas */}
        <ParticleCanvas />
      </div>

      {/* Hero content */}
      <motion.div
        style={{ y }}
        className="container mx-auto px-4 text-center relative z-10 flex flex-col items-center justify-center pt-28 pb-16"
      >
        {/* VeriFactu badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm"
            style={{
              border: "1px solid rgba(13,148,136,0.35)",
              background: "rgba(13,148,136,0.12)",
              color: "#5eead4",
              backdropFilter: "blur(8px)",
            }}
          >
            <Shield className="h-3.5 w-3.5" />
            VeriFactu certificado · Cumplimiento AEAT 2025
            <span className="h-2 w-2 rounded-full animate-pulse" style={{ background: "#2dd4bf" }} />
          </div>
        </motion.div>

        {/* W logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.7, type: "spring", stiffness: 110, damping: 14 }}
          className="mb-8"
        >
          <Image
            src="/logo-tech.png"
            alt="YouWhole"
            width={120}
            height={120}
            priority
            style={{ filter: "drop-shadow(0 0 45px rgba(13,148,136,0.7))" }}
          />
        </motion.div>

        {/* Headline */}
        <motion.h1
          className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-tight text-white mb-6 max-w-4xl"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.55 }}
        >
          Todo en uno
          <br />
          <span
            style={{
              backgroundImage: "linear-gradient(135deg, #2dd4bf 0%, #14b8a6 40%, #f59e0b 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            para tu empresa
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="text-lg sm:text-xl leading-relaxed mb-10 max-w-2xl"
          style={{ color: "#94a3b8" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.38 }}
        >
          CRM, facturación electrónica, VeriFactu, contabilidad y nóminas.
          El ERP moderno diseñado desde cero para pymes españolas.
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.48 }}
        >
          <Link
            href="/registro"
            className="inline-flex items-center gap-2 rounded-xl px-8 h-14 text-base font-semibold text-white transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
              boxShadow: "0 0 35px rgba(13,148,136,0.5), 0 4px 24px rgba(0,0,0,0.5)",
            }}
          >
            Empezar gratis
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#features"
            className="inline-flex items-center gap-2 rounded-xl px-8 h-14 text-base font-medium text-white transition-all duration-200 hover:bg-white/10"
            style={{
              border: "1px solid rgba(255,255,255,0.13)",
              background: "rgba(255,255,255,0.05)",
              backdropFilter: "blur(10px)",
            }}
          >
            Ver funcionalidades
          </a>
        </motion.div>

        {/* Trust signals */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-sm"
          style={{ color: "#64748b" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.58 }}
        >
          {[
            { icon: Shield, text: "VeriFactu AEAT" },
            { icon: Zap, text: "14 días gratis" },
            { icon: Globe, text: "Sin permanencia" },
            { icon: Star, text: "Soporte en español" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-1.5">
              <Icon className="h-4 w-4" style={{ color: "#0d9488" }} />
              <span>{text}</span>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Dashboard preview */}
      <motion.div
        className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6"
        initial={{ opacity: 0, y: 80 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.72, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      >
        <div
          className="rounded-2xl border overflow-hidden"
          style={{
            borderColor: "rgba(13,148,136,0.3)",
            boxShadow: "0 40px 100px rgba(0,0,0,0.85), 0 0 80px rgba(13,148,136,0.1)",
          }}
        >
          {/* Browser chrome */}
          <div
            className="flex items-center gap-2 px-4 py-3 border-b"
            style={{ background: "rgba(3,9,8,0.98)", borderColor: "rgba(255,255,255,0.07)" }}
          >
            <div className="h-3 w-3 rounded-full" style={{ background: "#ef4444" }} />
            <div className="h-3 w-3 rounded-full" style={{ background: "#f59e0b" }} />
            <div className="h-3 w-3 rounded-full" style={{ background: "#22c55e" }} />
            <div
              className="ml-4 flex-1 max-w-xs rounded-md px-3 py-1 text-xs text-center mx-auto"
              style={{ background: "rgba(255,255,255,0.06)", color: "#475569" }}
            >
              app.youwhole.es/dashboard
            </div>
          </div>

          {/* Dashboard body */}
          <div className="flex" style={{ background: "#060f0d", minHeight: 340 }}>
            {/* Sidebar */}
            <div
              className="w-48 shrink-0 border-r p-4 hidden sm:flex flex-col"
              style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.25)" }}
            >
              <div className="flex items-center gap-2 mb-5 pb-4 border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                <div className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold" style={{ background: "linear-gradient(135deg,#0d9488,#14b8a6)" }}>Y</div>
                <span className="text-xs font-semibold" style={{ color: "#94a3b8" }}>YouWhole</span>
              </div>
              {[
                { label: "Dashboard", active: true },
                { label: "Facturas", active: false },
                { label: "Clientes", active: false },
                { label: "CRM / Deals", active: false },
                { label: "Contabilidad", active: false },
                { label: "Inventario", active: false },
                { label: "Nóminas", active: false },
              ].map(({ label, active }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs mb-0.5"
                  style={{ background: active ? "rgba(13,148,136,0.15)" : "transparent", color: active ? "#2dd4bf" : "#475569" }}
                >
                  <div className="h-3.5 w-3.5 rounded-sm shrink-0" style={{ background: active ? "#0d9488" : "rgba(255,255,255,0.1)" }} />
                  {label}
                </div>
              ))}
            </div>

            {/* Main content */}
            <div className="flex-1 p-5 overflow-hidden">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {[
                  { label: "Facturado", value: "48.250 €", delta: "+12%", color: "#0d9488" },
                  { label: "Clientes", value: "124", delta: "+8", color: "#6366f1" },
                  { label: "Por cobrar", value: "8.400 €", delta: "-3%", color: "#f59e0b" },
                  { label: "Deals", value: "17", delta: "+5", color: "#ec4899" },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl p-3 border" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.07)" }}>
                    <div className="text-[9px] uppercase tracking-wide mb-1" style={{ color: "#475569" }}>{s.label}</div>
                    <div className="text-sm font-bold mb-0.5" style={{ color: s.color }}>{s.value}</div>
                    <div className="text-[9px]" style={{ color: s.delta.startsWith("+") ? "#22c55e" : "#f87171" }}>{s.delta} vs mes anterior</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 rounded-xl border p-4" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-medium" style={{ color: "#94a3b8" }}>Facturación mensual 2025</span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: "rgba(13,148,136,0.15)", color: "#2dd4bf" }}>↑ 18% anual</span>
                  </div>
                  <div className="flex items-end gap-1 h-20">
                    {[28, 45, 35, 60, 50, 72, 62, 85, 68, 55, 78, 100].map((h, i) => (
                      <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${h}%`, background: i === 11 ? "linear-gradient(180deg,#2dd4bf,#0d9488)" : i >= 9 ? "rgba(13,148,136,0.38)" : "rgba(13,148,136,0.18)" }} />
                    ))}
                  </div>
                  <div className="flex justify-between mt-1.5">
                    {["E", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"].map((m, i) => (
                      <div key={i} className="flex-1 text-center" style={{ fontSize: 7, color: "#334155" }}>{m}</div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border p-4 flex flex-col items-center justify-center" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
                  <div className="text-[10px] font-medium mb-3" style={{ color: "#94a3b8" }}>Pipeline CRM</div>
                  <svg viewBox="0 0 64 64" className="w-16 h-16 mb-3">
                    <circle cx="32" cy="32" r="24" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="9" />
                    <circle cx="32" cy="32" r="24" fill="none" stroke="#0d9488" strokeWidth="9" strokeDasharray="75 75" strokeDashoffset="-3" strokeLinecap="round" transform="rotate(-90 32 32)" />
                    <circle cx="32" cy="32" r="24" fill="none" stroke="#f59e0b" strokeWidth="9" strokeDasharray="32 118" strokeDashoffset="-78" strokeLinecap="round" transform="rotate(-90 32 32)" />
                    <circle cx="32" cy="32" r="24" fill="none" stroke="#6366f1" strokeWidth="9" strokeDasharray="18 132" strokeDashoffset="-110" strokeLinecap="round" transform="rotate(-90 32 32)" />
                  </svg>
                  <div className="w-full space-y-1">
                    {[{ label: "Lead", pct: "50%", color: "#0d9488" }, { label: "Propuesta", pct: "21%", color: "#f59e0b" }, { label: "Negociación", pct: "12%", color: "#6366f1" }].map((s) => (
                      <div key={s.label} className="flex items-center justify-between" style={{ fontSize: 9 }}>
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
                          <span style={{ color: "#64748b" }}>{s.label}</span>
                        </div>
                        <span style={{ color: "#94a3b8" }}>{s.pct}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Bottom gradient */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
        style={{ background: "linear-gradient(to top, hsl(var(--background)), transparent)" }}
      />
    </section>
  );
}
