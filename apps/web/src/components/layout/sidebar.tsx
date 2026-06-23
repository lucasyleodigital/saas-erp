"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
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
  Shield,
  Truck,
  UploadCloud,
  UserCheck,
  Banknote,
  ShoppingCart,
  PackageCheck,
  X,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUnreadCount } from "@/hooks/use-notifications";
import { useUser } from "@/hooks/use-user";

const LOCALES = ["es", "en", "fr", "de", "pt", "it"];

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { data: unreadCount } = useUnreadCount();
  const { data: currentUser } = useUser();
  const t = useTranslations("nav");

  // Extract locale from URL path (e.g. /es/dashboard → "es")
  const segments = pathname.split("/");
  const locale = LOCALES.includes(segments[1] ?? "") ? segments[1]! : "es";

  // Strip locale prefix to compare paths
  const pathWithoutLocale = pathname.replace(/^\/(es|en|fr|de|pt|it)/, "") || "/";

  // Nav items defined inside component to use translations
  const navItems = [
    {
      group: t("groupMain"),
      items: [
        { href: "/dashboard", label: t("dashboard"), icon: LayoutDashboard },
      ],
    },
    {
      group: t("crm"),
      items: [
        { href: "/clientes",  label: t("clients"),   icon: Users },
        { href: "/leads",     label: t("leads"),     icon: UserPlus },
        { href: "/pipeline",  label: t("pipeline"),  icon: BarChart3 },
        { href: "/empleados", label: t("employees"), icon: UserCheck },
        { href: "/nominas",   label: t("payroll"),   icon: Banknote },
      ],
    },
    {
      group: t("groupBilling"),
      items: [
        { href: "/facturas",     label: t("invoices"),   icon: FileText },
        { href: "/presupuestos", label: t("quotes"),     icon: ClipboardList },
        { href: "/albaranes",   label: t("deliveryNotes"), icon: Truck },
        { href: "/productos",    label: t("products"),   icon: Package },
        { href: "/verifactu",    label: t("verifactu"),  icon: Shield },
      ],
    },
    {
      group: t("accounting"),
      items: [
        { href: "/contabilidad", label: t("accounting"),    icon: Calculator },
        { href: "/inventario",   label: t("inventory"),     icon: Warehouse },
        { href: "/proveedores",  label: t("suppliers"),     icon: Truck },
        { href: "/pedidos",      label: t("orders"),        icon: ShoppingCart },
        { href: "/compras",      label: t("purchaseOrders"),icon: PackageCheck },
      ],
    },
    {
      group: t("groupSystem"),
      items: [
        { href: "/importacion",     label: t("import"),        icon: UploadCloud },
        { href: "/empresa",         label: t("company"),       icon: Building2 },
        { href: "/billing",         label: t("billing"),       icon: CreditCard },
        { href: "/automatizaciones",label: t("automations"),   icon: Zap },
        { href: "/notificaciones",  label: t("notifications"), icon: Bell },
        { href: "/configuracion",   label: t("settings"),      icon: Settings },
      ],
    },
    ...(currentUser?.role === "SUPER_ADMIN" ? [{
      group: "ADMIN",
      items: [
        { href: "/admin", label: "Panel admin", icon: Shield },
      ],
    }] : []),
  ];

  return (
    <motion.aside
      animate={{ width: collapsed ? 68 : 240 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="relative flex h-full flex-col bg-sidebar border-r border-sidebar-border overflow-hidden"
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        {/* Mobile close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute right-3 top-4 md:hidden p-1 rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Image
                src="/logo.png"
                alt="YouWhole"
                width={140}
                height={40}
                className="object-contain"
                priority
              />
            </motion.div>
          )}
        </AnimatePresence>
        {collapsed && (
          <div className="mx-auto">
            <Image
              src="/logo-icon.png"
              alt="YouWhole"
              width={36}
              height={36}
              className="object-contain"
              priority
            />
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
                pathWithoutLocale === item.href ||
                (item.href !== "/dashboard" && pathWithoutLocale.startsWith(item.href));
              const Icon = item.icon;
              const localizedHref = `/${locale}${item.href}`;
              return (
                <Link
                  key={item.href}
                  href={localizedHref}
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
          {!collapsed && <span>{t("logout")}</span>}
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
