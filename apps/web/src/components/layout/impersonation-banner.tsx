"use client";

import { useEffect, useState } from "react";
import { Shield, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ImpersonationBanner() {
  const [companyName, setCompanyName] = useState<string | null>(null);

  useEffect(() => {
    const orig = localStorage.getItem("admin_original_token");
    const name = localStorage.getItem("admin_impersonated_company");
    if (orig) setCompanyName(name ?? "empresa");
  }, []);

  if (!companyName) return null;

  function returnToAdmin() {
    const orig = localStorage.getItem("admin_original_token");
    if (orig) {
      localStorage.setItem("access_token", orig);
      localStorage.removeItem("admin_original_token");
      localStorage.removeItem("admin_impersonated_company");
    }
    window.location.href = "/es/admin";
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between gap-3 bg-amber-500 dark:bg-amber-600 px-4 py-2 text-amber-950">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Shield className="h-4 w-4 shrink-0" />
        <span>Modo administrador — estás viendo la cuenta de <strong>{companyName}</strong></span>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="h-7 border-amber-800 bg-transparent text-amber-950 hover:bg-amber-600 hover:text-amber-950 shrink-0 gap-1.5"
        onClick={returnToAdmin}
      >
        <LogOut className="h-3.5 w-3.5" />
        Volver a mi cuenta admin
      </Button>
    </div>
  );
}
