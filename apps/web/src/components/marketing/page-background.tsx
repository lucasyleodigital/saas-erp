"use client";

import { useEffect, useRef } from "react";

export function PageBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    type Star = { x: number; y: number; vx: number; vy: number; r: number; a: number; ta: number };
    const stars: Star[] = Array.from({ length: 110 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      r: Math.random() * 0.85 + 0.2,
      a: Math.random() * 0.2 + 0.04,
      ta: Math.random() * 0.2 + 0.04,
    }));

    type Meteor = { x: number; y: number; vx: number; vy: number; spd: number; len: number; life: number; maxLife: number };
    const meteors: Meteor[] = [];
    let nextMeteorAt = performance.now() + 4000 + Math.random() * 5000;

    const spawnMeteor = () => {
      const angle = 0.48 + (Math.random() - 0.5) * 0.28;
      const spd = 12 + Math.random() * 9;
      meteors.push({
        x: Math.random() * canvas.width * 0.65,
        y: Math.random() * canvas.height * 0.5,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        spd,
        len: 90 + Math.random() * 100,
        life: 0,
        maxLife: 55,
      });
      nextMeteorAt = performance.now() + 9000 + Math.random() * 10000;
    };

    const tick = (now: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Stars with twinkle
      for (const s of stars) {
        s.x += s.vx; s.y += s.vy;
        if (s.x < 0) s.x += canvas.width;
        if (s.x > canvas.width) s.x -= canvas.width;
        if (s.y < 0) s.y += canvas.height;
        if (s.y > canvas.height) s.y -= canvas.height;
        s.a += (s.ta - s.a) * 0.01;
        if (Math.abs(s.a - s.ta) < 0.002) s.ta = Math.random() * 0.2 + 0.04;

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,255,250,${s.a})`;
        ctx.fill();
      }

      // Meteors
      if (now >= nextMeteorAt) spawnMeteor();

      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        if (!m) continue;
        m.life++;
        m.x += m.vx;
        m.y += m.vy;
        const p = m.life / m.maxLife;
        const alpha = p < 0.2 ? p / 0.2 : 1 - (p - 0.2) / 0.8;
        const tx = m.x - (m.vx / m.spd) * m.len;
        const ty = m.y - (m.vy / m.spd) * m.len;

        const g = ctx.createLinearGradient(m.x, m.y, tx, ty);
        g.addColorStop(0, `rgba(45,212,191,${(alpha * 0.95).toFixed(3)})`);
        g.addColorStop(0.45, `rgba(45,212,191,${(alpha * 0.3).toFixed(3)})`);
        g.addColorStop(1, "rgba(45,212,191,0)");

        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(tx, ty);
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Glow dot at meteor head
        const glowGrad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, 4);
        glowGrad.addColorStop(0, `rgba(180,255,240,${alpha * 0.9})`);
        glowGrad.addColorStop(1, "rgba(45,212,191,0)");
        ctx.beginPath();
        ctx.arc(m.x, m.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = glowGrad;
        ctx.fill();

        if (m.life >= m.maxLife) meteors.splice(i, 1);
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0, opacity: 0.75 }}
    />
  );
}
