"use client";

import { useState, useCallback } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { RouteProgress } from "./route-progress";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const openMenu = useCallback(() => setMobileOpen(true), []);
  const closeMenu = useCallback(() => setMobileOpen(false), []);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={closeMenu}
        />
      )}

      {/* Sidebar — always visible on desktop, drawer on mobile */}
      <div
        className={[
          "fixed inset-y-0 left-0 z-40 md:relative md:z-auto md:flex md:translate-x-0 transition-transform duration-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <Sidebar onClose={closeMenu} />
      </div>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <RouteProgress />
        <Header onMenuClick={openMenu} />
        <main className="flex-1 overflow-y-auto px-3 py-4 sm:px-4 md:px-6 md:py-6 scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  );
}
