"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";

export function RouteProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const prevPath = useRef(pathname);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (pathname === prevPath.current) return;
    prevPath.current = pathname;

    if (timer.current) window.clearTimeout(timer.current);
    setProgress(100);
    setVisible(true);

    timer.current = window.setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 300);
  }, [pathname]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("#") || href === pathname) return;

      setVisible(true);
      setProgress(30);

      setTimeout(() => setProgress(60), 100);
      setTimeout(() => setProgress(80), 400);
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [pathname]);

  if (!visible && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] h-[2.5px] pointer-events-none"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 200ms" }}
    >
      <div
        className="h-full bg-primary rounded-r-full shadow-[0_0_8px] shadow-primary/40"
        style={{
          width: `${progress}%`,
          transition: progress === 0 ? "none" : "width 300ms ease-out",
        }}
      />
    </div>
  );
}
