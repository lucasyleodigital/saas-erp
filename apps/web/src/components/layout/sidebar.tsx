"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/lib/auth";
import {
  LayoutDashboard,
  Users,
  FileText,
  Package,
  BarChart3,
  Settings,
  Building2,
  Briefcase,
  Calculator,
  Warehouse,
  Bell,
  Zap,
  ChevronLeft,
  ChevronRight,
  LogOut,
  UserPlus,
  CreditCard,
  ClipboardList,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUnreadCount } from "@/hooks/use-notifications";

const navItems = [
  {
    group: "Principal",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    group: "CRM",
    items: [
      { href: "/clientes", label: "Clientes", icon: Users },
      { href: "/leads", label: "Leads", icon: UserPlus },
      { href: "/pipeline", label: "Pipeline", icon: BarChart3 },
    ],
  },
  {
    group: "Facturación",
    items: [
      { href: "/facturas", label: "Facturas", icon: FileText },
      { href: "/presupuestos", label: "Presupuestos", icon: ClipboardList },
      { href: "/productos", label: "Productos", icon: Package },
    ],
  },
  {
    group: "Contabilidad",
    items: [
      { href: "/contabilidad", label: "Contabilidad", icon: Calculator },
      { href: "/inventario", label: "Inventario", icon: Warehouse },
    ],
  },
  {
    group: "Sistema",
    items: [
      { href: "/empresa", label: "Mi empresa", icon: Building2 },
      { href: "/billing", label: "Planes", icon: CreditCard },
      { href: "/automatizaciones", label: "Automatizaciones", icon: Zap },
      { href: "/notificaciones", label: "Notificaciones", icon: Bell },
      { href: "/configuracion", label: "Configuración", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { data: unreadCount } = useUnreadCount();

  return (
    <motion.aside
      animate={{ width: collapsed ? 68 : 240 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="relative flex h-full flex-col bg-sidebar border-r border-sidebar-border overflow-hidden"
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-2"
            >
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                E
              </div>
              <span className="font-bold text-sidebar-foreground text-lg">
                ERP SaaS
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        {collapsed && (
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm mx-auto">
            E
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin">
        {navItems.map((group) => (
          <div key={group.group} className="mb-4">
            {!collapsed && (
              <p className="px-4 py-1 text-xs font-medium text-sidebar-foreground/40 uppercase tracking-widest">
                {group.group}
              </p>
            )}
            {group.items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground/70"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <AnimatePresence mode="wait">
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.15 }}
                        className="truncate flex-1"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {item.href === "/notificaciones" && (unreadCount ?? 0) > 0 && (
                    <span className={cn(
                      "flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1",
                      collapsed && "absolute right-1 top-1 h-3 min-w-3 text-[8px]"
                    )}>
                      {unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-2">
        <button
          onClick={() => logoutAction()}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-sidebar-border text-sidebar-foreground shadow-sm hover:bg-sidebar-accent transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>
    </motion.aside>
  );
}
