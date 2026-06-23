"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface Stat {
  value: number;
  suffix: string;
  label: string;
  prefix?: string;
}

const STATS: Stat[] = [
  { value: 15, suffix: "+", label: "Modulos integrados" },
  { value: 7, suffix: "", label: "Idiomas para documentos" },
  { value: 99.9, suffix: "%", label: "Disponibilidad garantizada" },
  { value: 14, suffix: " dias", label: "Prueba gratis sin tarjeta" },
];

function AnimatedNumber({ target, suffix, prefix = "" }: { target: number; suffix: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  const isDecimal = !Number.isInteger(target);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1600;
          const start = performance.now();
          const tick = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(parseFloat((eased * target).toFixed(isDecimal ? 1 : 0)));
            if (progress < 1) requestAnimationFrame(tick);
            else setCount(target);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, isDecimal]);

  const display = isDecimal ? count.toFixed(1) : Math.floor(count).toLocaleString("es-ES");

  return (
    <span ref={ref}>
      {prefix}{display}{suffix}
    </span>
  );
}

export function StatsBar() {
  return (
    <section className="py-20 border-y border-border bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          className="flex flex-wrap justify-center"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {STATS.map((stat, i) => (
            <div key={stat.label} className="flex items-stretch">
              <motion.div
                className="text-center px-8 sm:px-12 py-2"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
              >
                <div
                  className="text-4xl sm:text-5xl font-bold mb-2 tabular-nums"
                  style={{ color: "#0d9488" }}
                >
                  <AnimatedNumber target={stat.value} suffix={stat.suffix} prefix={stat.prefix} />
                </div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
              {i < STATS.length - 1 && (
                <div className="self-stretch w-px my-2" style={{ background: "hsl(var(--border))" }} />
              )}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
