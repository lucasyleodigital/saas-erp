"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bell, Search, Sun, Moon, X, FileText, Users, Package, UserCheck, ClipboardList, Truck } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { useAuthStore } from "@/store/auth.store";
import { useUnreadCount } from "@/hooks/use-notifications";
import { useSearch, type SearchResult } from "@/hooks/use-search";
import { useLocale } from "@/hooks/use-locale";
import Link from "next/link";

const TYPE_ICON: Record<string, React.ElementType> = {
  client: Users,
  invoice: FileText,
  quote: ClipboardList,
  product: Package,
  employee: UserCheck,
  "delivery-note": Truck,
};

const TYPE_LABEL: Record<string, string> = {
  client: "Cliente",
  invoice: "Factura",
  quote: "Presupuesto",
  product: "Producto",
  employee: "Empleado",
  "delivery-note": "Albarán",
};

export function Header() {
  const { theme, setTheme } = useTheme();
  const user = useAuthStore((s) => s.user);
  const { data: unreadCount = 0 } = useUnreadCount();
  const router = useRouter();
  const locale = useLocale();

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { data: results = [], isFetching } = useSearch(query);

  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || user.email[0].toUpperCase()
    : "?";

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
        inputRef.current?.blur();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handleSelect = useCallback((r: SearchResult) => {
    setOpen(false);
    setQuery("");
    router.push(`/${locale}${r.href}`);
  }, [router, locale]);

  const showDropdown = open && query.trim().length >= 2;

  return (
    <header className="flex h-16 items-center justify-between border-b border-border px-6 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
      {/* Search */}
      <div ref={wrapperRef} className="relative w-72">
        <div
          className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 cursor-text"
          onClick={() => { inputRef.current?.focus(); setOpen(true); }}
        >
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder="Buscar..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {query ? (
            <button onClick={() => { setQuery(""); setOpen(false); }} className="text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <kbd className="text-xs border border-border rounded px-1 text-muted-foreground hidden sm:inline">⌘K</kbd>
          )}
        </div>

        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg overflow-hidden z-50 max-h-80 overflow-y-auto">
            {isFetching && results.length === 0 && (
              <p className="text-sm text-muted-foreground px-4 py-3">Buscando...</p>
            )}
            {!isFetching && results.length === 0 && (
              <p className="text-sm text-muted-foreground px-4 py-3">Sin resultados para &ldquo;{query}&rdquo;</p>
            )}
            {results.map((r) => {
              const Icon = TYPE_ICON[r.type] ?? Search;
              return (
                <button
                  key={`${r.type}-${r.id}`}
                  onClick={() => handleSelect(r)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted text-left transition-colors"
                >
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.label}</p>
                    {r.sublabel && <p className="text-xs text-muted-foreground truncate">{r.sublabel}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{TYPE_LABEL[r.type]}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="text-muted-foreground"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <Link href={`/${locale}/notificaciones`}>
          <Button variant="ghost" size="icon" className="relative text-muted-foreground">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 h-4 w-4 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center font-medium">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>
        </Link>

        <Link href={`/${locale}/configuracion`}>
          <button className="flex items-center gap-2 rounded-lg px-3 py-1.5 hover:bg-muted transition-colors">
            <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-medium">
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium leading-none">{user?.firstName ?? "Usuario"}</p>
              <p className="text-xs text-muted-foreground">{user?.role ?? "Miembro"}</p>
            </div>
          </button>
        </Link>
      </div>
    </header>
  );
}
