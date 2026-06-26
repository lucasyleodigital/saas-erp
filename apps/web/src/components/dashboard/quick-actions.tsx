"use client";

import Link from "next/link";
import { FilePlus, UserPlus, Receipt, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { useLocale } from "@/hooks/use-locale";
import { useTranslations } from "next-intl";

export function QuickActions() {
  const locale = useLocale();
  const t = useTranslations("dashboard");

  const actions = [
    {
      href: "/facturas",
      label: t("newInvoice"),
      icon: FilePlus,
      color: "text-primary bg-primary/10 hover:bg-primary/20",
    },
    {
      href: "/clientes",
      label: t("newClient"),
      icon: UserPlus,
      color: "text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20",
    },
    {
      href: "/presupuestos",
      label: t("newQuote"),
      icon: Receipt,
      color: "text-amber-500 bg-amber-500/10 hover:bg-amber-500/20",
    },
    {
      href: "/pipeline",
      label: t("viewPipeline"),
      icon: BarChart3,
      color: "text-purple-500 bg-purple-500/10 hover:bg-purple-500/20",
    },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action, i) => {
        const Icon = action.icon;
        return (
          <motion.div
            key={action.href}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link
              href={`/${locale}${action.href}`}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${action.color}`}
            >
              <Icon className="h-4 w-4" />
              {action.label}
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
