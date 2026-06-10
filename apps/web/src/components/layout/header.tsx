"use client";

import { Bell, Search, Sun, Moon, ChevronDown } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function Header() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="flex h-16 items-center justify-between border-b border-border px-6 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
      {/* Search */}
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 w-72">
        <Search className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          Buscar... <kbd className="text-xs border border-border rounded px-1 ml-1">⌘K</kbd>
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="text-muted-foreground"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>

        <Button variant="ghost" size="icon" className="relative text-muted-foreground">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
        </Button>

        {/* User menu */}
        <button className="flex items-center gap-2 rounded-lg px-3 py-1.5 hover:bg-muted transition-colors">
          <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-medium">
            L
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium leading-none">Lucas</p>
            <p className="text-xs text-muted-foreground">Administrador</p>
          </div>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
      </div>
    </header>
  );
}
