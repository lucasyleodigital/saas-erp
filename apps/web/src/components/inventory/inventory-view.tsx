"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useInventorySummary, useStock, useStockMovements,
  useAddMovement, useWarehouses, useCreateWarehouse,
} from "@/hooks/use-inventory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { cn, formatCurrency } from "@/lib/utils";
import {
  Package, PackagePlus, AlertTriangle, TrendingDown, Warehouse,
  Plus, ArrowUpCircle, ArrowDownCircle, Search, Loader2,
} from "lucide-react";
import { motion } from "framer-motion";

// ---- Movement dialog ----
const movementSchema = z.object({
  productId: z.string().min(1, "Selecciona un producto"),
  warehouseId: z.string().min(1, "Selecciona un almacén"),
  type: z.enum(["PURCHASE", "SALE", "ADJUSTMENT_IN", "ADJUSTMENT_OUT", "RETURN", "TRANSFER"]),
  quantity: z.coerce.number().min(1, "Cantidad mínima 1"),
  notes: z.string().optional(),
});
type MovementForm = z.infer<typeof movementSchema>;

function MovementDialog({
  open, onOpenChange, products, warehouses,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  products: any[];
  warehouses: any[];
}) {
  const addMovement = useAddMovement();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<MovementForm>({
    resolver: zodResolver(movementSchema),
    defaultValues: { type: "PURCHASE", quantity: 1 },
  });

  async function onSubmit(data: MovementForm) {
    await addMovement.mutateAsync(data as any);
    onOpenChange(false);
    reset();
  }

  const MOVEMENT_TYPES = [
    { value: "PURCHASE", label: "Compra (entrada)" },
    { value: "SALE", label: "Venta (salida)" },
    { value: "ADJUSTMENT_IN", label: "Ajuste positivo" },
    { value: "ADJUSTMENT_OUT", label: "Ajuste negativo" },
    { value: "RETURN", label: "Devolución (entrada)" },
    { value: "TRANSFER", label: "Transferencia (salida)" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar movimiento de stock</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Producto *</Label>
            <select
              {...register("productId")}
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Seleccionar producto</option>
              {products.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {errors.productId && <p className="text-xs text-destructive">{errors.productId.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Almacén *</Label>
              <select
                {...register("warehouseId")}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Seleccionar</option>
                {warehouses.map((w: any) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Cantidad *</Label>
              <Input type="number" min="1" {...register("quantity")} />
              {errors.quantity && <p className="text-xs text-destructive">{errors.quantity.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Tipo *</Label>
            <select
              {...register("type")}
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {MOVEMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>Notas</Label>
            <Input {...register("notes")} placeholder="Opcional..." />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={addMovement.isPending}>
              {addMovement.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Registrar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---- Warehouse dialog ----
function WarehouseDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const create = useCreateWarehouse();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<{ name: string; location?: string }>({
    resolver: zodResolver(z.object({ name: z.string().min(1), location: z.string().optional() })),
  });

  async function onSubmit(data: { name: string; location?: string }) {
    await create.mutateAsync(data as any);
    onOpenChange(false);
    reset();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Nuevo almacén</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nombre *</Label>
            <Input {...register("name")} placeholder="Almacén principal" />
            {errors.name && <p className="text-xs text-destructive">Nombre obligatorio</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Ubicación</Label>
            <Input {...register("location")} placeholder="Barcelona, España" />
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Crear
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---- Main view ----
export function InventoryView() {
  const [tab, setTab] = useState<"stock" | "movements" | "warehouses">("stock");
  const [movementOpen, setMovementOpen] = useState(false);
  const [warehouseOpen, setWarehouseOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: summary } = useInventorySummary();
  const { data: stockData, isLoading: stockLoading } = useStock({ search: search || undefined });
  const { data: movementsData, isLoading: movLoading } = useStockMovements({});
  const { data: warehousesData } = useWarehouses();

  const stock: any[] = stockData ?? [];
  const movements: any[] = movementsData?.data ?? [];
  const warehouses: any[] = warehousesData ?? [];

  const summaryCards = [
    { label: "Productos con stock", value: summary?.totalProducts ?? 0, icon: Package, color: "text-blue-500" },
    { label: "Stock bajo", value: summary?.lowStock ?? 0, icon: AlertTriangle, color: "text-amber-500" },
    { label: "Sin stock", value: summary?.outOfStock ?? 0, icon: TrendingDown, color: "text-destructive" },
    { label: "Almacenes", value: summary?.warehouses ?? 0, icon: Warehouse, color: "text-purple-500" },
  ];

  const MOVEMENT_IN = new Set(["PURCHASE", "ADJUSTMENT_IN", "RETURN"]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventario</h1>
          <p className="text-sm text-muted-foreground mt-1">Control de stock y almacenes</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setWarehouseOpen(true)}>
            <Warehouse className="h-4 w-4" />
            Almacén
          </Button>
          <Button size="sm" className="gap-2" onClick={() => setMovementOpen(true)}>
            <Plus className="h-4 w-4" />
            Movimiento
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                  <p className="text-2xl font-bold mt-1">{c.value}</p>
                </div>
                <c.icon className={cn("h-8 w-8", c.color)} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg w-fit">
        {[
          { key: "stock", label: "Stock" },
          { key: "movements", label: "Movimientos" },
          { key: "warehouses", label: "Almacenes" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
              tab === t.key ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Stock tab */}
      {tab === "stock" && (
        <div className="space-y-3">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Card>
            <CardContent className="p-0">
              {stockLoading ? (
                <div className="space-y-0">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 border-b last:border-0">
                      <div className="h-4 bg-muted rounded w-1/3 animate-pulse" />
                      <div className="h-4 bg-muted rounded w-1/4 animate-pulse ml-auto" />
                    </div>
                  ))}
                </div>
              ) : stock.length === 0 ? (
                <div className="flex flex-col items-center py-14 text-center">
                  <PackagePlus className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="font-medium">Sin productos con stock</p>
                  <p className="text-sm text-muted-foreground mt-1">Registra un movimiento de entrada para empezar</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4 text-xs font-medium text-muted-foreground">Producto</th>
                        <th className="text-right p-4 text-xs font-medium text-muted-foreground">Stock actual</th>
                        <th className="text-right p-4 text-xs font-medium text-muted-foreground">Precio coste</th>
                        <th className="text-right p-4 text-xs font-medium text-muted-foreground">Valor stock</th>
                        <th className="text-center p-4 text-xs font-medium text-muted-foreground">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stock.map((item: any, i: number) => {
                        const qty = item.currentStock ?? 0;
                        const statusLabel = qty === 0 ? "Sin stock" : qty <= 5 ? "Stock bajo" : "OK";
                        const statusVariant = qty === 0 ? "destructive" : qty <= 5 ? "warning" : "success";
                        const variants: Record<string, string> = {
                          destructive: "bg-destructive/10 text-destructive",
                          warning: "bg-amber-100 text-amber-700",
                          success: "bg-emerald-100 text-emerald-700",
                        };
                        return (
                          <motion.tr
                            key={item.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.02 }}
                            className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                          >
                            <td className="p-4">
                              <p className="font-medium text-sm">{item.name}</p>
                              <p className="text-xs text-muted-foreground">{item.sku ?? "—"}</p>
                            </td>
                            <td className="p-4 text-right font-semibold text-sm">{qty}</td>
                            <td className="p-4 text-right text-sm text-muted-foreground">
                              {item.costPrice ? formatCurrency(Number(item.costPrice)) : "—"}
                            </td>
                            <td className="p-4 text-right text-sm font-medium">
                              {item.costPrice ? formatCurrency(qty * Number(item.costPrice)) : "—"}
                            </td>
                            <td className="p-4 text-center">
                              <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", variants[statusVariant])}>
                                {statusLabel}
                              </span>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Movements tab */}
      {tab === "movements" && (
        <Card>
          <CardContent className="p-0">
            {movLoading ? (
              <div className="p-8 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : movements.length === 0 ? (
              <div className="flex flex-col items-center py-14 text-center">
                <ArrowUpCircle className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="font-medium">Sin movimientos</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 text-xs font-medium text-muted-foreground">Fecha</th>
                      <th className="text-left p-4 text-xs font-medium text-muted-foreground">Producto</th>
                      <th className="text-left p-4 text-xs font-medium text-muted-foreground">Tipo</th>
                      <th className="text-right p-4 text-xs font-medium text-muted-foreground">Cantidad</th>
                      <th className="text-left p-4 text-xs font-medium text-muted-foreground">Almacén</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map((m: any) => {
                      const isIn = MOVEMENT_IN.has(m.type);
                      return (
                        <tr key={m.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="p-4 text-sm text-muted-foreground">
                            {new Date(m.createdAt).toLocaleDateString("es-ES")}
                          </td>
                          <td className="p-4 text-sm font-medium">{m.product?.name ?? "—"}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-1.5">
                              {isIn ? (
                                <ArrowUpCircle className="h-4 w-4 text-emerald-500" />
                              ) : (
                                <ArrowDownCircle className="h-4 w-4 text-destructive" />
                              )}
                              <span className="text-xs">{m.type.replace(/_/g, " ")}</span>
                            </div>
                          </td>
                          <td className={cn(
                            "p-4 text-right text-sm font-semibold",
                            isIn ? "text-emerald-600" : "text-destructive"
                          )}>
                            {isIn ? "+" : "-"}{m.quantity}
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">{m.warehouse?.name ?? "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Warehouses tab */}
      {tab === "warehouses" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {warehouses.map((w: any) => (
            <Card key={w.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Warehouse className="h-4 w-4 text-muted-foreground" />
                      <p className="font-semibold">{w.name}</p>
                      {w.isDefault && (
                        <Badge variant="secondary" className="text-xs">Principal</Badge>
                      )}
                    </div>
                    {w.location && (
                      <p className="text-sm text-muted-foreground mt-1">{w.location}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          <Card
            className="border-dashed cursor-pointer hover:bg-muted/30 transition-colors"
            onClick={() => setWarehouseOpen(true)}
          >
            <CardContent className="p-5 flex items-center justify-center gap-2 h-full min-h-[80px] text-muted-foreground">
              <Plus className="h-4 w-4" />
              <span className="text-sm font-medium">Nuevo almacén</span>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dialogs */}
      <MovementDialog
        open={movementOpen}
        onOpenChange={setMovementOpen}
        products={stock}
        warehouses={warehouses}
      />
      <WarehouseDialog open={warehouseOpen} onOpenChange={setWarehouseOpen} />
    </div>
  );
}
