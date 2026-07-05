"use client";

import { useState } from "react";
import { Building2, ChevronDown, Check, Loader2 } from "lucide-react";
import { useMyCompanies, useSwitchCompany } from "@/hooks/use-company";
import { useUser } from "@/hooks/use-user";
import { cn } from "@/lib/utils";

export function CompanySwitcher({ collapsed }: { collapsed: boolean }) {
  const [open, setOpen] = useState(false);
  const { data: companies, isLoading } = useMyCompanies();
  const { data: currentUser } = useUser();
  const switchMutation = useSwitchCompany();

  // Solo mostrar si hay más de 1 empresa
  if (isLoading || !companies || companies.length <= 1) return null;

  const activeCompany = companies.find((c) => c.id === currentUser?.companyId) ?? companies[0];

  function handleSwitch(companyId: string) {
    if (companyId === currentUser?.companyId) { setOpen(false); return; }
    setOpen(false);
    switchMutation.mutate(companyId);
  }

  if (collapsed) {
    return (
      <div className="px-2 py-2 border-b border-sidebar-border">
        <button
          onClick={() => setOpen((v) => !v)}
          className="relative w-full flex items-center justify-center p-2 rounded-lg hover:bg-sidebar-accent transition-colors"
          title={activeCompany?.name}
        >
          <Building2 className="h-4 w-4 text-sidebar-foreground/70" />
          {open && (
            <div className="absolute left-full top-0 ml-2 z-50 w-52 rounded-xl border border-sidebar-border bg-sidebar shadow-xl py-1">
              {companies.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSwitch(c.id)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-sidebar-accent transition-colors text-left"
                >
                  <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="flex-1 truncate text-sidebar-foreground">{c.name}</span>
                  {c.id === currentUser?.companyId && <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="px-3 py-2 border-b border-sidebar-border relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-sidebar-accent transition-colors group"
      >
        <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Building2 className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-xs font-semibold text-sidebar-foreground truncate">{activeCompany?.name}</p>
          <p className="text-[10px] text-sidebar-foreground/40 capitalize">{activeCompany?.role?.toLowerCase()}</p>
        </div>
        {switchMutation.isPending
          ? <Loader2 className="h-3.5 w-3.5 text-sidebar-foreground/40 animate-spin flex-shrink-0" />
          : <ChevronDown className={cn("h-3.5 w-3.5 text-sidebar-foreground/40 transition-transform flex-shrink-0", open && "rotate-180")} />
        }
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          {/* Dropdown */}
          <div className="absolute left-3 right-3 top-full mt-1 z-50 rounded-xl border border-sidebar-border bg-sidebar shadow-xl py-1 overflow-hidden">
            <p className="px-3 py-1.5 text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-widest">
              Mis empresas
            </p>
            {companies.map((c) => (
              <button
                key={c.id}
                onClick={() => handleSwitch(c.id)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-sidebar-accent transition-colors"
              >
                <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm text-sidebar-foreground truncate">{c.name}</p>
                  <p className="text-[10px] text-sidebar-foreground/40 capitalize">{c.role?.toLowerCase()}</p>
                </div>
                {c.id === currentUser?.companyId && (
                  <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
