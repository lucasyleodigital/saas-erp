"use client";

import { useState } from "react";
import {
  useProjects,
  useCreateProject,
  useDeleteProject,
} from "@/hooks/use-projects";
import { useClients } from "@/hooks/use-clients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, formatCurrency } from "@/lib/utils";
import {
  Search,
  Plus,
  FolderKanban,
  Clock,
  FileText,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDebounce } from "@/hooks/use-debounce";
import Link from "next/link";
import { useTranslations } from "next-intl";

const STATUS_TABS = [
  { value: "ALL", label: "Todos" },
  { value: "ACTIVE", label: "Activos" },
  { value: "ON_HOLD", label: "En espera" },
  { value: "COMPLETED", label: "Completados" },
  { value: "CANCELLED", label: "Cancelados" },
];

const STATUS_BADGE: Record<string, { label: string; variant: "success" | "warning" | "info" | "destructive" }> = {
  ACTIVE:    { label: "Activo",     variant: "success" },
  ON_HOLD:   { label: "En espera",  variant: "warning" },
  COMPLETED: { label: "Completado", variant: "info" },
  CANCELLED: { label: "Cancelado",  variant: "destructive" },
};

export function ProjectsView() {
  const t = useTranslations("projects");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, isError } = useProjects({
    search: debouncedSearch || undefined,
    status: statusFilter !== "ALL" ? statusFilter : undefined,
  });

  const projects = data?.data ?? data ?? [];
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FolderKanban className="h-6 w-6" />
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("subtitle")}
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          {t("new")}
        </Button>
      </div>

      {/* Status tabs */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Search */}
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("search")}
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-48 rounded-xl bg-muted/40 animate-pulse"
            />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <p className="font-medium text-destructive">
              Error al cargar proyectos
            </p>
          </CardContent>
        </Card>
      ) : (Array.isArray(projects) ? projects : []).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
              <FolderKanban className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium">{t("noResults")}</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              {t("noResultsDesc")}
            </p>
            <Button onClick={() => setDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              {t("new")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {(Array.isArray(projects) ? projects : []).map(
              (project: any, i: number) => {
                const budget = Number(project.budget) || 0;
                const spent = Number(project.budgetUsed ?? project.spent ?? 0);
                const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
                const sb = STATUS_BADGE[project.status] ?? STATUS_BADGE.ACTIVE;
                const hours = Number(project.totalHours ?? project.hours ?? 0);
                const invoiceCount = Number(project.invoiceCount ?? project._count?.invoices ?? 0);

                return (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <Link href={`/proyectos/${project.id}`}>
                      <Card className="relative overflow-hidden hover:shadow-md transition-shadow cursor-pointer group">
                        {/* Color strip */}
                        <div
                          className="absolute inset-x-0 top-0 h-1"
                          style={{
                            backgroundColor: project.color || "#6366f1",
                          }}
                        />

                        <CardContent className="p-5 pt-4">
                          {/* Name + status */}
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="min-w-0">
                              <p className="font-semibold truncate">
                                {project.name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {project.client?.name ?? project.clientName ?? "Sin cliente"}
                              </p>
                            </div>
                            <Badge variant={sb!.variant} className="shrink-0">
                              {sb!.label}
                            </Badge>
                          </div>

                          {/* Budget bar */}
                          {budget > 0 && (
                            <div className="mb-3">
                              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                <span>Presupuesto</span>
                                <span>
                                  {formatCurrency(spent)} / {formatCurrency(budget)}
                                </span>
                              </div>
                              <div className="h-2 rounded-full bg-muted overflow-hidden">
                                <div
                                  className={cn(
                                    "h-full rounded-full transition-all",
                                    pct > 90
                                      ? "bg-destructive"
                                      : pct > 70
                                        ? "bg-amber-500"
                                        : "bg-primary"
                                  )}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Stats row */}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {hours.toFixed(1)} horas
                            </span>
                            <span className="flex items-center gap-1">
                              <FileText className="h-3.5 w-3.5" />
                              {invoiceCount} facturas
                            </span>
                          </div>
                        </CardContent>

                        {/* Delete on hover */}
                        <button
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-destructive/10 text-destructive"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (confirm(`Eliminar "${project.name}"?`)) {
                              deleteProject.mutate(project.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </Card>
                    </Link>
                  </motion.div>
                );
              }
            )}
          </AnimatePresence>
        </div>
      )}

      {/* New project dialog */}
      <NewProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={(data) => {
          createProject.mutate(data, {
            onSuccess: () => setDialogOpen(false),
          });
        }}
        isPending={createProject.isPending}
      />
    </div>
  );
}

function NewProjectDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (data: Record<string, unknown>) => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    clientId: "",
    budget: "",
    hourlyRate: "",
    startDate: "",
    endDate: "",
    color: "#6366f1",
  });

  const { data: clientsData } = useClients({ limit: 200 });
  const clients = clientsData?.data ?? [];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      name: form.name,
      description: form.description || undefined,
      clientId: form.clientId || undefined,
      budget: form.budget ? Number(form.budget) : undefined,
      hourlyRate: form.hourlyRate ? Number(form.hourlyRate) : undefined,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      color: form.color,
    });
  }

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo proyecto</DialogTitle>
          <DialogDescription>
            Crea un nuevo proyecto y asignalo a un cliente
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="proj-name">Nombre *</Label>
            <Input
              id="proj-name"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="proj-desc">Descripcion</Label>
            <Input
              id="proj-desc"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Cliente</Label>
            <Select
              value={form.clientId}
              onValueChange={(v) => update("clientId", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="proj-budget">Presupuesto</Label>
              <Input
                id="proj-budget"
                type="number"
                step="0.01"
                value={form.budget}
                onChange={(e) => update("budget", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proj-rate">Tarifa / hora</Label>
              <Input
                id="proj-rate"
                type="number"
                step="0.01"
                value={form.hourlyRate}
                onChange={(e) => update("hourlyRate", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="proj-start">Fecha inicio</Label>
              <Input
                id="proj-start"
                type="date"
                value={form.startDate}
                onChange={(e) => update("startDate", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proj-end">Fecha fin</Label>
              <Input
                id="proj-end"
                type="date"
                value={form.endDate}
                onChange={(e) => update("endDate", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="proj-color">Color</Label>
            <div className="flex items-center gap-3">
              <input
                id="proj-color"
                type="color"
                value={form.color}
                onChange={(e) => update("color", e.target.value)}
                className="h-10 w-10 rounded-lg border border-input cursor-pointer"
              />
              <span className="text-sm text-muted-foreground">{form.color}</span>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!form.name || isPending}>
              {isPending ? "Creando..." : "Crear proyecto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
