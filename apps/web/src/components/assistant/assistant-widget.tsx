"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  HelpCircle, X, Search, ChevronLeft, ChevronRight,
  Rocket, Users, FileText, Calculator, Package,
  UserCheck, FolderKanban, Settings,
} from "lucide-react";
import { HELP_CATEGORIES, type HelpCategory, type HelpQuestion } from "./help-data";

const ICON_MAP: Record<string, React.ElementType> = {
  Rocket, Users, FileText, Calculator, Package, UserCheck, FolderKanban, Settings,
};

export function AssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedQ, setExpandedQ] = useState<number | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) setTimeout(() => searchRef.current?.focus(), 150);
  }, [isOpen]);

  useEffect(() => {
    if (panelRef.current) panelRef.current.scrollTop = 0;
    setExpandedQ(null);
  }, [selectedCategory, search]);

  const category = selectedCategory
    ? HELP_CATEGORIES.find((c) => c.id === selectedCategory)
    : null;

  const searchResults = useMemo(() => {
    if (!search.trim()) return null;
    const term = search.toLowerCase();
    const results: { category: HelpCategory; question: HelpQuestion; index: number }[] = [];
    for (const cat of HELP_CATEGORIES) {
      for (let i = 0; i < cat.questions.length; i++) {
        const q = cat.questions[i]!;
        if (q.q.toLowerCase().includes(term) || q.a.toLowerCase().includes(term)) {
          results.push({ category: cat, question: q, index: i });
        }
      }
    }
    return results;
  }, [search]);

  function goBack() {
    setSelectedCategory(null);
    setExpandedQ(null);
  }

  return (
    <>
      {/* Help panel */}
      <div
        className={cn(
          "fixed bottom-24 right-6 z-50 w-[400px] h-[540px] flex flex-col rounded-2xl border border-border bg-background shadow-2xl transition-all duration-200",
          isOpen
            ? "scale-100 opacity-100 pointer-events-auto"
            : "scale-95 opacity-0 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border rounded-t-2xl bg-primary/5">
          <div className="flex items-center gap-2">
            {selectedCategory && !search ? (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goBack}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            ) : (
              <HelpCircle className="h-5 w-5 text-primary" />
            )}
            <span className="font-semibold text-sm">
              {selectedCategory && !search ? category?.label : "Centro de ayuda"}
            </span>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="px-4 py-2.5 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              ref={searchRef}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (e.target.value) setSelectedCategory(null);
              }}
              placeholder="Buscar en la ayuda..."
              className="pl-9 h-9 text-sm rounded-lg"
            />
          </div>
        </div>

        {/* Content */}
        <div ref={panelRef} className="flex-1 overflow-y-auto">
          {/* Search results */}
          {searchResults !== null ? (
            <div className="p-3 space-y-1">
              {searchResults.length === 0 ? (
                <div className="text-center py-10">
                  <Search className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Sin resultados para "{search}"</p>
                  <p className="text-xs text-muted-foreground mt-1">Prueba con otras palabras</p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground px-1 mb-2">
                    {searchResults.length} resultado{searchResults.length !== 1 ? "s" : ""}
                  </p>
                  {searchResults.map((r, i) => (
                    <button
                      key={`${r.category.id}-${r.index}`}
                      onClick={() => setExpandedQ(expandedQ === i ? null : i)}
                      className="w-full text-left"
                    >
                      <div className={cn(
                        "rounded-lg px-3 py-2.5 transition-colors",
                        expandedQ === i ? "bg-primary/5" : "hover:bg-muted/50"
                      )}>
                        <p className="text-xs text-muted-foreground mb-0.5">{r.category.label}</p>
                        <p className="text-sm font-medium flex items-center justify-between gap-2">
                          <span>{r.question.q}</span>
                          <ChevronRight className={cn(
                            "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform",
                            expandedQ === i && "rotate-90"
                          )} />
                        </p>
                        {expandedQ === i && (
                          <p className="text-sm text-muted-foreground mt-2 whitespace-pre-line leading-relaxed">
                            {r.question.a}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </>
              )}
            </div>
          ) : selectedCategory && category ? (
            /* Category questions */
            <div className="p-3 space-y-1">
              {category.questions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => setExpandedQ(expandedQ === i ? null : i)}
                  className="w-full text-left"
                >
                  <div className={cn(
                    "rounded-lg px-3 py-2.5 transition-colors",
                    expandedQ === i ? "bg-primary/5" : "hover:bg-muted/50"
                  )}>
                    <p className="text-sm font-medium flex items-center justify-between gap-2">
                      <span>{q.q}</span>
                      <ChevronRight className={cn(
                        "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform",
                        expandedQ === i && "rotate-90"
                      )} />
                    </p>
                    {expandedQ === i && (
                      <p className="text-sm text-muted-foreground mt-2 whitespace-pre-line leading-relaxed">
                        {q.a}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            /* Category grid */
            <div className="p-4">
              <p className="text-xs text-muted-foreground mb-3 px-1">
                Selecciona un departamento o busca tu pregunta
              </p>
              <div className="grid grid-cols-2 gap-2">
                {HELP_CATEGORIES.map((cat) => {
                  const Icon = ICON_MAP[cat.icon] ?? HelpCircle;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className="flex items-center gap-3 rounded-xl border border-border px-3 py-3 text-left hover:bg-muted/50 hover:border-primary/30 transition-colors group"
                    >
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                        <Icon className="h-4.5 w-4.5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{cat.label}</p>
                        <p className="text-xs text-muted-foreground">{cat.questions.length} temas</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            YouWhole -- Creado por autonomos para autonomos
          </p>
        </div>
      </div>

      {/* Floating button */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className={cn(
          "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105",
          !isOpen && "animate-pulse"
        )}
        aria-label="Ayuda"
      >
        {isOpen ? <X className="h-6 w-6" /> : <HelpCircle className="h-6 w-6" />}
      </button>
    </>
  );
}
