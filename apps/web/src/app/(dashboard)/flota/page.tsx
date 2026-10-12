"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  useVehicles,
  useVehicle,
  useCreateVehicle,
  useUpdateVehicle,
  useDeleteVehicle,
  useCreateMaintenance,
  useUpdateMaintenance,
  useDeleteMaintenance,
  getExpiryStatus,
  MAINTENANCE_TYPES,
  type Vehicle,
  type VehicleMaintenance,
} from "@/hooks/use-fleet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatDate, cn } from "@/lib/utils";
import { VehicleExpensesCard } from "@/components/expenses/vehicle-expenses-card";
import {
  Plus,
  Truck,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Pencil,
  Trash2,
  ChevronRight,
  ArrowLeft,
  Wrench,
  Calendar,
  Loader2,
} from "lucide-react";

const EMPTY_VEHICLE = {
  matricula: "",
  marca: "",
  modelo: "",
  anio: "",
  transportistaNombre: "",
  transportistaNif: "",
  itvDate: "",
  seguroDate: "",
  notas: "",
  isActive: true,
};

const EMPTY_MAINTENANCE = {
  tipo: "REVISION" as VehicleMaintenance["tipo"],
  descripcion: "",
  fecha: new Date().toISOString().slice(0, 10),
  km: "",
  coste: "",
  proveedor: "",
  proximaRevision: "",
};

const needsAttention = (s: string) => s === "warn" || s === "expired";

function ExpiryBadge({ dateStr, label }: { dateStr: string | null; label: string }) {
  const locale = useLocale();
  const status = getExpiryStatus(dateStr);
  if (status === "none") return <span className="text-muted-foreground text-xs">—</span>;

  const d = new Date(dateStr!);
  const fmtd = d.toLocaleDateString(locale, { day: "2-digit", month: "2-digit", year: "numeric" });

  if (status === "expired") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400 font-medium">
        <XCircle className="h-3 w-3" />
        {label}: {fmtd}
      </span>
    );
  }
  if (status === "warn") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
        <AlertTriangle className="h-3 w-3" />
        {label}: {fmtd}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
      <CheckCircle2 className="h-3 w-3" />
      {label}: {fmtd}
    </span>
  );
}

function VehicleForm({
  initial,
  onSubmit,
  onClose,
  isPending,
}: {
  initial: typeof EMPTY_VEHICLE;
  onSubmit: (data: any) => void;
  onClose: () => void;
  isPending: boolean;
}) {
  const t = useTranslations("fleet.form");
  const tc = t;
  const [form, setForm] = useState(initial);
  function set(k: keyof typeof form, v: any) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  return (
    <div className="space-y-4 py-1">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5 col-span-2 sm:col-span-1">
          <Label htmlFor="v-mat">{t("plate")}</Label>
          <Input id="v-mat" value={form.matricula} onChange={(e) => set("matricula", e.target.value.toUpperCase())} placeholder="1234ABC" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="v-marca">{t("brand")}</Label>
          <Input id="v-marca" value={form.marca} onChange={(e) => set("marca", e.target.value)} placeholder="Mercedes" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="v-modelo">{t("model")}</Label>
          <Input id="v-modelo" value={form.modelo} onChange={(e) => set("modelo", e.target.value)} placeholder="Sprinter 519" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="v-anio">{t("year")}</Label>
          <Input id="v-anio" type="number" value={form.anio} onChange={(e) => set("anio", e.target.value)} placeholder="2020" min="1980" max="2030" />
        </div>
      </div>

      <hr className="border-border" />
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("carrierSection")}</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="v-tnom">{t("carrierName")}</Label>
          <Input id="v-tnom" value={form.transportistaNombre} onChange={(e) => set("transportistaNombre", e.target.value)} placeholder="Transportes Ejemplo SL" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="v-tnif">{t("carrierNif")}</Label>
          <Input id="v-tnif" value={form.transportistaNif} onChange={(e) => set("transportistaNif", e.target.value)} placeholder="B12345678" />
        </div>
      </div>

      <hr className="border-border" />
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("documentsSection")}</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="v-itv">{t("itvExpiry")}</Label>
          <Input id="v-itv" type="date" value={form.itvDate} onChange={(e) => set("itvDate", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="v-seg">{t("insuranceExpiry")}</Label>
          <Input id="v-seg" type="date" value={form.seguroDate} onChange={(e) => set("seguroDate", e.target.value)} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="v-notas">{t("notes")}</Label>
        <Input id="v-notas" value={form.notas} onChange={(e) => set("notas", e.target.value)} placeholder={t("notesPlaceholder")} />
      </div>

      <DialogFooter className="gap-2 pt-2">
        <Button variant="outline" onClick={onClose}>{tc("cancel")}</Button>
        <Button
          disabled={!form.matricula.trim() || isPending}
          onClick={() => onSubmit(form)}
          className="gap-2"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {tc("save")}
        </Button>
      </DialogFooter>
    </div>
  );
}

function MaintenanceForm({
  initial,
  onSubmit,
  onClose,
  isPending,
}: {
  initial: typeof EMPTY_MAINTENANCE;
  onSubmit: (data: any) => void;
  onClose: () => void;
  isPending: boolean;
}) {
  const t = useTranslations("fleet");
  const tc = useTranslations("fleet.form");
  const [form, setForm] = useState(initial);
  function set(k: keyof typeof form, v: any) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  return (
    <div className="space-y-4 py-1">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5 col-span-2 sm:col-span-1">
          <Label>{t("form.type")}</Label>
          <Select value={form.tipo} onValueChange={(v) => set("tipo", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {MAINTENANCE_TYPES.map((k) => (
                <SelectItem key={k} value={k}>{t(`maintenanceTypes.${k}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 col-span-2 sm:col-span-1">
          <Label htmlFor="m-fecha">{t("form.date")}</Label>
          <Input id="m-fecha" type="date" value={form.fecha} onChange={(e) => set("fecha", e.target.value)} />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label htmlFor="m-desc">{t("form.description")}</Label>
          <Input id="m-desc" value={form.descripcion} onChange={(e) => set("descripcion", e.target.value)} placeholder={t("form.descriptionPlaceholder")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="m-km">{t("form.km")}</Label>
          <Input id="m-km" type="number" value={form.km} onChange={(e) => set("km", e.target.value)} placeholder="125000" min="0" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="m-coste">{t("form.cost")}</Label>
          <Input id="m-coste" type="number" value={form.coste} onChange={(e) => set("coste", e.target.value)} placeholder="320.00" min="0" step="0.01" />
        </div>
        <div className="space-y-1.5 col-span-2 sm:col-span-1">
          <Label htmlFor="m-prov">{t("form.workshop")}</Label>
          <Input id="m-prov" value={form.proveedor} onChange={(e) => set("proveedor", e.target.value)} placeholder={t("form.workshopPlaceholder")} />
        </div>
        <div className="space-y-1.5 col-span-2 sm:col-span-1">
          <Label htmlFor="m-prox">{t("form.nextService")}</Label>
          <Input id="m-prox" type="date" value={form.proximaRevision} onChange={(e) => set("proximaRevision", e.target.value)} />
        </div>
      </div>

      <DialogFooter className="gap-2 pt-2">
        <Button variant="outline" onClick={onClose}>{tc("cancel")}</Button>
        <Button
          disabled={!form.fecha || isPending}
          onClick={() => onSubmit(form)}
          className="gap-2"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {tc("save")}
        </Button>
      </DialogFooter>
    </div>
  );
}

export default function FlotaPage() {
  const t = useTranslations("fleet");
  const locale = useLocale();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [vehicleDialog, setVehicleDialog] = useState<"create" | Vehicle | null>(null);
  const [maintenanceDialog, setMaintenanceDialog] = useState<{ vehicleId: string; maintenance?: VehicleMaintenance } | null>(null);

  const { data: vehicles = [], isLoading } = useVehicles({ search: search || undefined });
  const { data: selectedVehicle } = useVehicle(selectedId ?? undefined);
  const createVehicle = useCreateVehicle();
  const updateVehicle = useUpdateVehicle();
  const deleteVehicle = useDeleteVehicle();
  const createMaintenance = useCreateMaintenance();
  const updateMaintenance = useUpdateMaintenance();
  const deleteMaintenance = useDeleteMaintenance();

  const alerts = vehicles.filter(
    (v) =>
      v.isActive &&
      (needsAttention(getExpiryStatus(v.itvDate)) || needsAttention(getExpiryStatus(v.seguroDate)))
  );

  async function handleSaveVehicle(form: any) {
    const data = {
      matricula: form.matricula.trim(),
      marca: form.marca || null,
      modelo: form.modelo || null,
      anio: form.anio ? Number(form.anio) : null,
      transportistaNombre: form.transportistaNombre || null,
      transportistaNif: form.transportistaNif || null,
      itvDate: form.itvDate || null,
      seguroDate: form.seguroDate || null,
      notas: form.notas || null,
      isActive: form.isActive,
    };

    if (vehicleDialog === "create") {
      await createVehicle.mutateAsync(data);
    } else {
      await updateVehicle.mutateAsync({ id: (vehicleDialog as Vehicle).id, ...data });
    }
    setVehicleDialog(null);
  }

  async function handleSaveMaintenance(form: any) {
    if (!maintenanceDialog) return;
    const data = {
      vehicleId: maintenanceDialog.vehicleId,
      tipo: form.tipo,
      descripcion: form.descripcion || null,
      fecha: form.fecha,
      km: form.km ? Number(form.km) : null,
      coste: form.coste !== "" ? form.coste : null,
      proveedor: form.proveedor || null,
      proximaRevision: form.proximaRevision || null,
    };

    if (maintenanceDialog.maintenance) {
      await updateMaintenance.mutateAsync({ ...data, id: maintenanceDialog.maintenance.id });
    } else {
      await createMaintenance.mutateAsync(data);
    }
    setMaintenanceDialog(null);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button onClick={() => setVehicleDialog("create")} className="gap-2">
          <Plus className="h-4 w-4" />
          {t("newVehicle")}
        </Button>
      </div>

      {/* Alertas */}
      {alerts.length > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-sm font-medium">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {t("alert", { count: alerts.length })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-4 flex-col lg:flex-row">
        {/* Lista izquierda */}
        <div className="lg:w-96 shrink-0 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("searchPlaceholder")}
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
            ))
          ) : vehicles.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Truck className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">{t("noVehicles")}</p>
              <Button variant="link" size="sm" onClick={() => setVehicleDialog("create")}>
                {t("addFirst")}
              </Button>
            </div>
          ) : (
            vehicles.map((v) => {
              const itvStatus = getExpiryStatus(v.itvDate);
              const segStatus = getExpiryStatus(v.seguroDate);
              const hasAlert = v.isActive && (needsAttention(itvStatus) || needsAttention(segStatus));
              return (
                <button
                  key={v.id}
                  onClick={() => setSelectedId(v.id === selectedId ? null : v.id)}
                  className={cn(
                    "w-full text-left rounded-xl border p-3 transition-colors hover:bg-accent",
                    selectedId === v.id ? "border-primary bg-primary/5" : "border-border bg-card",
                    !v.isActive && "opacity-50",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="font-mono font-semibold text-sm">{v.matricula}</span>
                      {hasAlert && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
                      {!v.isActive && <Badge variant="secondary" className="text-xs">{t("inactive")}</Badge>}
                    </div>
                    <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform", selectedId === v.id && "rotate-90")} />
                  </div>
                  {(v.marca || v.modelo) && (
                    <p className="text-xs text-muted-foreground mt-1 ml-6">
                      {[v.marca, v.modelo, v.anio].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  <div className="mt-1.5 ml-6 flex flex-col gap-0.5">
                    {v.itvDate && <ExpiryBadge dateStr={v.itvDate} label={t("itv")} />}
                    {v.seguroDate && <ExpiryBadge dateStr={v.seguroDate} label={t("insurance")} />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Detalle derecha */}
        {selectedId && selectedVehicle ? (
          <div className="flex-1 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="font-mono text-xl">{selectedVehicle.matricula}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {[selectedVehicle.marca, selectedVehicle.modelo, selectedVehicle.anio].filter(Boolean).join(" · ") || t("noVehicleData")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={() => setVehicleDialog(selectedVehicle)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      {t("edit")}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1.5 text-destructive hover:text-destructive"
                      onClick={async () => {
                        if (!confirm(t("deleteConfirm", { plate: selectedVehicle.matricula }))) return;
                        await deleteVehicle.mutateAsync(selectedVehicle.id);
                        setSelectedId(null);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {selectedVehicle.transportistaNombre && (
                    <>
                      <span className="text-muted-foreground">{t("carrier")}</span>
                      <span>{selectedVehicle.transportistaNombre}</span>
                    </>
                  )}
                  {selectedVehicle.transportistaNif && (
                    <>
                      <span className="text-muted-foreground">{t("carrierNif")}</span>
                      <span className="font-mono">{selectedVehicle.transportistaNif}</span>
                    </>
                  )}
                  <span className="text-muted-foreground">{t("itv")}</span>
                  <ExpiryBadge dateStr={selectedVehicle.itvDate} label={t("itv")} />
                  <span className="text-muted-foreground">{t("insurance")}</span>
                  <ExpiryBadge dateStr={selectedVehicle.seguroDate} label={t("insurance")} />
                </div>
                {selectedVehicle.notas && (
                  <p className="text-muted-foreground italic text-xs">{selectedVehicle.notas}</p>
                )}
              </CardContent>
            </Card>

            {/* Mantenimientos */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    {t("maintenanceHistory")}
                    {(selectedVehicle._count?.maintenances ?? selectedVehicle.maintenances?.length ?? 0) > 0 && (
                      <Badge variant="secondary">
                        {selectedVehicle.maintenances?.length ?? selectedVehicle._count?.maintenances}
                      </Badge>
                    )}
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 h-7 text-xs"
                    onClick={() => setMaintenanceDialog({ vehicleId: selectedVehicle.id })}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {t("register")}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {!selectedVehicle.maintenances?.length ? (
                  <p className="text-sm text-muted-foreground text-center py-6">{t("noMaintenance")}</p>
                ) : (
                  <div className="divide-y divide-border">
                    {selectedVehicle.maintenances.map((m) => (
                      <div key={m.id} className="flex items-start justify-between px-4 py-3 text-sm">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs font-normal">
                              {t(`maintenanceTypes.${m.tipo}`)}
                            </Badge>
                            <span className="text-muted-foreground text-xs flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(m.fecha, locale)}
                            </span>
                          </div>
                          {m.descripcion && <p className="text-muted-foreground">{m.descripcion}</p>}
                          <div className="flex gap-3 text-xs text-muted-foreground">
                            {m.km && <span>{m.km.toLocaleString(locale)} km</span>}
                            {m.coste && <span>{Number(m.coste).toLocaleString(locale, { style: "currency", currency: "EUR" })}</span>}
                            {m.proveedor && <span>{m.proveedor}</span>}
                            {m.proximaRevision && (
                              <span className="text-amber-600 dark:text-amber-400">
                                {t("next", { date: formatDate(m.proximaRevision, locale) })}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 ml-2 shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => setMaintenanceDialog({ vehicleId: selectedVehicle.id, maintenance: m })}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={async () => {
                              if (!confirm(t("deleteMaintenanceConfirm"))) return;
                              await deleteMaintenance.mutateAsync({ vehicleId: selectedVehicle.id, id: m.id });
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <VehicleExpensesCard vehicleId={selectedVehicle.id} />
          </div>
        ) : (
          <div className="flex-1 hidden lg:flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Truck className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">{t("selectVehicle")}</p>
            </div>
          </div>
        )}
      </div>

      {/* Dialog vehículo */}
      <Dialog open={vehicleDialog !== null} onOpenChange={(o) => { if (!o) setVehicleDialog(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              {vehicleDialog === "create" ? t("newVehicle") : t("editVehicle", { plate: (vehicleDialog as Vehicle)?.matricula ?? "" })}
            </DialogTitle>
          </DialogHeader>
          <VehicleForm
            key={vehicleDialog === "create" ? "create" : (vehicleDialog as Vehicle)?.id}
            initial={
              !vehicleDialog || vehicleDialog === "create"
                ? EMPTY_VEHICLE
                : {
                    matricula: (vehicleDialog as Vehicle).matricula,
                    marca: (vehicleDialog as Vehicle).marca ?? "",
                    modelo: (vehicleDialog as Vehicle).modelo ?? "",
                    anio: String((vehicleDialog as Vehicle).anio ?? ""),
                    transportistaNombre: (vehicleDialog as Vehicle).transportistaNombre ?? "",
                    transportistaNif: (vehicleDialog as Vehicle).transportistaNif ?? "",
                    itvDate: (vehicleDialog as Vehicle).itvDate?.slice(0, 10) ?? "",
                    seguroDate: (vehicleDialog as Vehicle).seguroDate?.slice(0, 10) ?? "",
                    notas: (vehicleDialog as Vehicle).notas ?? "",
                    isActive: (vehicleDialog as Vehicle).isActive,
                  }
            }
            onSubmit={handleSaveVehicle}
            onClose={() => setVehicleDialog(null)}
            isPending={createVehicle.isPending || updateVehicle.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog mantenimiento */}
      <Dialog open={maintenanceDialog !== null} onOpenChange={(o) => { if (!o) setMaintenanceDialog(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" />
              {maintenanceDialog?.maintenance ? t("editMaintenance") : t("registerMaintenance")}
            </DialogTitle>
          </DialogHeader>
          <MaintenanceForm
            key={maintenanceDialog?.maintenance?.id ?? "new"}
            initial={
              maintenanceDialog?.maintenance
                ? {
                    tipo: maintenanceDialog.maintenance.tipo,
                    descripcion: maintenanceDialog.maintenance.descripcion ?? "",
                    fecha: maintenanceDialog.maintenance.fecha.slice(0, 10),
                    km: String(maintenanceDialog.maintenance.km ?? ""),
                    coste: String(maintenanceDialog.maintenance.coste ?? ""),
                    proveedor: maintenanceDialog.maintenance.proveedor ?? "",
                    proximaRevision: maintenanceDialog.maintenance.proximaRevision?.slice(0, 10) ?? "",
                  }
                : EMPTY_MAINTENANCE
            }
            onSubmit={handleSaveMaintenance}
            onClose={() => setMaintenanceDialog(null)}
            isPending={createMaintenance.isPending || updateMaintenance.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
