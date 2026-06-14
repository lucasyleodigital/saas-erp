"use client";

import { useState } from "react";
import {
  useStock,
  useStockAlerts,
  useStockMovements,
  useValuation,
  useWarehouses,
  useAddMovement,
  useTransferStock,
  usePhysicalInventory,
  useSetMinStock,
  useCreateWarehouse,
  useUpdateWarehouse,
  useDeleteWarehouse,
  useSetDefaultWarehouse,
  useInventorySummary,
} from "@/hooks/use-inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Warehouse,
  AlertTriangle,
  ArrowRightLeft,
  ClipboardCheck,
  TrendingUp,
  Package,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Star,
  Search,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

type Tab = "stock" | "alerts" | "movements" | "valuation" | "warehouses";

const MOVE_TYPE_LABELS: Record<string, string> = {
  PURCHASE:       "Compra",
  SALE:           "Venta",
  ADJUSTMENT_IN:  "Ajuste entrada",
  ADJUSTMENT_OUT: "Ajuste salida",
  RETURN:         "Devolución",
  TRANSFER:       "Transferencia salida",
  TRANSFER_IN:    "Transferencia entrada",
  IN:             "Entrada",
};

export function InventoryView() {
  const [tab, setTab] = useState<Tab>("stock");
  const { data: summary } = useInventorySummary();

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "stock",      label: "Stock",         icon: <Package className="h-4 w-4" /> },
    { key: "alerts",     label: `Alertas${(summary as any)?.lowStock ? ` (${(summary as any).lowStock})` : ""}`, icon: <AlertTriangle className="h-4 w-4" /> },
    { key: "movements",  label: "Movimientos",   icon: <ArrowRightLeft className="h-4 w-4" /> },
    { key: "valuation",  label: "Valoración",    icon: <TrendingUp className="h-4 w-4" /> },
    { key: "warehouses", label: "Almacenes",     icon: <Warehouse className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Inventario</h1>
        <p className="text-sm text-muted-foreground mt-1">Stock, almacenes y valoración</p>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard label="Productos" value={(summary as any).totalProducts} icon={<Package className="h-5 w-5 text-blue-500" />} />
          <SummaryCard label="Stock bajo" value={(summary as any).lowStock} icon={<AlertTriangle className="h-5 w-5 text-yellow-500" />} warn={(summary as any).lowStock > 0} />
          <SummaryCard label="Sin stock" value={(summary as any).outOfStock} icon={<Package className="h-5 w-5 text-red-500" />} warn={(summary as any).outOfStock > 0} />
          <SummaryCard label="Valor total" value={formatCurrency((summary as any).totalValue)} icon={<TrendingUp className="h-5 w-5 text-green-500" />} />
        </div>
      )}

      <div className="flex border-b gap-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {tab === "stock"      && <StockTab />}
      {tab === "alerts"     && <AlertsTab />}
      {tab === "movements"  && <MovementsTab />}
      {tab === "valuation"  && <ValuationTab />}
      {tab === "warehouses" && <WarehousesTab />}
    </div>
  );
}

// ─── Stock Tab ─────────────────────────────────────────────────────────────────

function StockTab() {
  const { data: warehouses = [] } = useWarehouses();
  const [warehouseId, setWarehouseId] = useState("");
  const [search, setSearch] = useState("");
  const [moveDialogProduct, setMoveDialogProduct] = useState<any>(null);
  const [transferDialogProduct, setTransferDialogProduct] = useState<any>(null);
  const [physicalDialog, setPhysicalDialog] = useState(false);
  const [minStockDialog, setMinStockDialog] = useState<any>(null);

  const { data: stock = [], isLoading } = useStock({
    warehouseId: warehouseId || undefined,
    search: search || undefined,
    trackStockOnly: false,
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar producto..." className="pl-9 w-56" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={warehouseId} onValueChange={(v) => setWarehouseId(v === "ALL" ? "" : v)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Todos los almacenes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los almacenes</SelectItem>
            {(warehouses as any[]).map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => setPhysicalDialog(true)}>
          <ClipboardCheck className="h-4 w-4 mr-2" />Inventario físico
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-px">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-12 bg-muted/40 animate-pulse" />)}</div>
          ) : (stock as any[]).length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">No hay productos</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">Producto</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">SKU</th>
                    <th className="text-right font-medium text-muted-foreground px-4 py-3">Stock</th>
                    <th className="text-right font-medium text-muted-foreground px-4 py-3 hidden lg:table-cell">Mínimo</th>
                    <th className="text-right font-medium text-muted-foreground px-4 py-3 hidden xl:table-cell">Valor</th>
                    <th className="px-4 py-3 w-12" />
                  </tr>
                </thead>
                <tbody>
                  {(stock as any[]).map((p) => (
                    <tr key={p.id} className={`border-b last:border-0 hover:bg-muted/30 transition-colors ${p.isLow ? "bg-yellow-50/50" : ""}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {p.isLow && <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />}
                          <span className="font-medium">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-muted-foreground font-mono text-xs">{p.sku ?? "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-bold ${p.currentStock <= 0 ? "text-red-600" : p.isLow ? "text-yellow-600" : "text-green-600"}`}>
                          {p.currentStock}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right hidden lg:table-cell text-muted-foreground">
                        {p.minStock != null ? p.minStock : "—"}
                      </td>
                      <td className="px-4 py-3 text-right hidden xl:table-cell text-muted-foreground">
                        {p.stockValue != null ? formatCurrency(p.stockValue) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setMoveDialogProduct(p)}>
                              <Plus className="h-4 w-4 mr-2" />Añadir movimiento
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTransferDialogProduct(p)}>
                              <ArrowRightLeft className="h-4 w-4 mr-2" />Transferir
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setMinStockDialog(p)}>
                              <AlertTriangle className="h-4 w-4 mr-2" />Stock mínimo
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {moveDialogProduct && <MoveDialog product={moveDialogProduct} warehouses={warehouses as any[]} onClose={() => setMoveDialogProduct(null)} />}
      {transferDialogProduct && <TransferDialog product={transferDialogProduct} warehouses={warehouses as any[]} onClose={() => setTransferDialogProduct(null)} />}
      {physicalDialog && <PhysicalDialog stock={stock as any[]} warehouses={warehouses as any[]} onClose={() => setPhysicalDialog(false)} />}
      {minStockDialog && <MinStockDialog product={minStockDialog} onClose={() => setMinStockDialog(null)} />}
    </div>
  );
}

// ─── Alerts Tab ─────────────────────────────────────────────────────────────────

function AlertsTab() {
  const { data: alerts = [], isLoading } = useStockAlerts();

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Productos que han alcanzado o están por debajo de su stock mínimo.</p>
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 bg-muted/40 rounded-xl animate-pulse" />)}</div>
      ) : (alerts as any[]).length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center text-muted-foreground gap-3">
          <CheckCircle2 className="h-12 w-12 text-green-400" />
          <p className="font-medium">Sin alertas activas</p>
          <p className="text-sm">Todos los productos están por encima de su stock mínimo</p>
        </div>
      ) : (
        <div className="space-y-2">
          {(alerts as any[]).map((p) => (
            <div key={p.id} className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0" />
                <div>
                  <p className="font-medium">{p.name}</p>
                  {p.sku && <p className="text-xs text-muted-foreground font-mono">{p.sku}</p>}
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold ${p.currentStock <= 0 ? "text-red-600" : "text-yellow-700"}`}>
                  Stock: {p.currentStock}
                </p>
                <p className="text-xs text-muted-foreground">Mínimo: {p.minStock}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Movements Tab ─────────────────────────────────────────────────────────────

function MovementsTab() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const { data: warehouses = [] } = useWarehouses();
  const { data } = useStockMovements({ page, warehouseId: warehouseId || undefined, type: typeFilter || undefined });
  const movements = (data as any)?.data ?? [];
  const totalPages = (data as any)?.totalPages ?? 1;

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        <Select value={warehouseId} onValueChange={(v) => setWarehouseId(v === "ALL" ? "" : v)}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Todos los almacenes" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos</SelectItem>
            {(warehouses as any[]).map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v === "ALL" ? "" : v)}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los tipos</SelectItem>
            {Object.entries(MOVE_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Fecha</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Producto</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">Almacén</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Tipo</th>
                  <th className="text-right font-medium text-muted-foreground px-4 py-3">Cantidad</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden lg:table-cell">Referencia</th>
                </tr>
              </thead>
              <tbody>
                {movements.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No hay movimientos</td></tr>
                ) : movements.map((m: any) => {
                  const isOut = ["SALE", "ADJUSTMENT_OUT", "TRANSFER"].includes(m.type);
                  return (
                    <tr key={m.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(m.createdAt).toLocaleDateString("es-ES")}</td>
                      <td className="px-4 py-3 font-medium">{m.product?.name ?? "—"}</td>
                      <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{m.warehouse?.name ?? "—"}</td>
                      <td className="px-4 py-3">
                        <Badge className={`text-xs ${isOut ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                          {MOVE_TYPE_LABELS[m.type] ?? m.type}
                        </Badge>
                      </td>
                      <td className={`px-4 py-3 text-right font-bold ${isOut ? "text-red-600" : "text-green-600"}`}>
                        {isOut ? "-" : "+"}{Number(m.quantity)}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">{m.reference ?? m.notes ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Página {page} de {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Siguiente</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Valuation Tab ─────────────────────────────────────────────────────────────

function ValuationTab() {
  const [warehouseId, setWarehouseId] = useState("");
  const { data: warehouses = [] } = useWarehouses();
  const { data, isLoading } = useValuation(warehouseId || undefined);

  return (
    <div className="space-y-4">
      <Select value={warehouseId} onValueChange={(v) => setWarehouseId(v === "ALL" ? "" : v)}>
        <SelectTrigger className="w-44"><SelectValue placeholder="Todos los almacenes" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Todos</SelectItem>
          {(warehouses as any[]).map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
        </SelectContent>
      </Select>

      {data && (
        <div className="grid grid-cols-3 gap-4">
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Valor de coste</p><p className="text-2xl font-bold text-blue-600">{formatCurrency(data.totalValue)}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Valor de venta</p><p className="text-2xl font-bold text-green-600">{formatCurrency(data.totalRevenue)}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Margen medio</p><p className="text-2xl font-bold text-purple-600">{data.totalMargin.toFixed(1)}%</p></CardContent></Card>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-px">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-12 bg-muted/40 animate-pulse" />)}</div>
          ) : !data || data.items.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">No hay productos con coste definido</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">Producto</th>
                    <th className="text-right font-medium text-muted-foreground px-4 py-3">Stock</th>
                    <th className="text-right font-medium text-muted-foreground px-4 py-3">Coste ud.</th>
                    <th className="text-right font-medium text-muted-foreground px-4 py-3">PVP ud.</th>
                    <th className="text-right font-medium text-muted-foreground px-4 py-3">Margen</th>
                    <th className="text-right font-medium text-muted-foreground px-4 py-3">Valor stock</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item) => (
                    <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <p className="font-medium">{item.name}</p>
                        {item.sku && <p className="text-xs text-muted-foreground font-mono">{item.sku}</p>}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">{item.currentStock}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(item.cost)}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(item.price)}</td>
                      <td className="px-4 py-3 text-right">
                        <Badge className={item.margin >= 30 ? "bg-green-100 text-green-700" : item.margin >= 15 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}>
                          {item.margin.toFixed(1)}%
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.stockValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Warehouses Tab ─────────────────────────────────────────────────────────────

function WarehousesTab() {
  const { data: warehouses = [], isLoading } = useWarehouses();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const createWh  = useCreateWarehouse();
  const updateWh  = useUpdateWarehouse();
  const deleteWh  = useDeleteWarehouse();
  const setDefault = useSetDefaultWarehouse();

  async function handleSave(form: any) {
    try {
      if (editing) await updateWh.mutateAsync({ id: editing.id, ...form });
      else         await createWh.mutateAsync(form);
      setDialogOpen(false);
    } catch {}
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" />Nuevo almacén
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 bg-muted/40 rounded-xl animate-pulse" />)}</div>
      ) : (warehouses as any[]).length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">No hay almacenes configurados</div>
      ) : (
        <div className="grid gap-3">
          {(warehouses as any[]).map((wh) => (
            <Card key={wh.id} className={wh.isDefault ? "border-primary" : ""}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                    <Warehouse className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{wh.name}</p>
                      {wh.isDefault && <Badge className="bg-primary/10 text-primary text-xs">Por defecto</Badge>}
                      {!wh.isActive && <Badge variant="secondary" className="text-xs">Inactivo</Badge>}
                    </div>
                    {wh.description && <p className="text-sm text-muted-foreground">{wh.description}</p>}
                    {wh.address && <p className="text-xs text-muted-foreground">{wh.address}</p>}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => { setEditing(wh); setDialogOpen(true); }}>
                      <Edit className="h-4 w-4 mr-2" />Editar
                    </DropdownMenuItem>
                    {!wh.isDefault && (
                      <DropdownMenuItem onClick={() => setDefault.mutate(wh.id)}>
                        <Star className="h-4 w-4 mr-2" />Marcar como defecto
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => { if (confirm(`¿Eliminar "${wh.name}"?`)) deleteWh.mutate(wh.id); }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <WarehouseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        warehouse={editing}
        onSave={handleSave}
        loading={createWh.isPending || updateWh.isPending}
      />
    </div>
  );
}

// ─── Dialogs ────────────────────────────────────────────────────────────────────

function MoveDialog({ product, warehouses, onClose }: { product: any; warehouses: any[]; onClose: () => void }) {
  const addMovement = useAddMovement();
  const [warehouseId, setWarehouseId] = useState(warehouses.find((w) => w.isDefault)?.id ?? "");
  const [type, setType] = useState("PURCHASE");
  const [quantity, setQuantity] = useState(1);
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  async function handleSubmit() {
    try {
      await addMovement.mutateAsync({ productId: product.id, warehouseId, type, quantity, reference, notes });
      onClose();
    } catch {}
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Movimiento — {product.name}</DialogTitle></DialogHeader>
        <div className="space-y-3 mt-2">
          <div className="space-y-1">
            <Label>Almacén</Label>
            <Select value={warehouseId} onValueChange={setWarehouseId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{warehouses.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Tipo</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(MOVE_TYPE_LABELS).filter(([k]) => !["TRANSFER_IN", "IN"].includes(k)).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Cantidad</Label>
            <Input type="number" min={0.001} step={0.001} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
          </div>
          <div className="space-y-1">
            <Label>Referencia</Label>
            <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Nº factura, albarán..." />
          </div>
          <div className="space-y-1">
            <Label>Notas</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button disabled={!warehouseId || !quantity || addMovement.isPending} onClick={handleSubmit}>
            {addMovement.isPending ? "Guardando..." : "Registrar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TransferDialog({ product, warehouses, onClose }: { product: any; warehouses: any[]; onClose: () => void }) {
  const transfer = useTransferStock();
  const [fromId, setFromId] = useState(warehouses.find((w) => w.isDefault)?.id ?? "");
  const [toId, setToId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");

  async function handleSubmit() {
    if (!fromId || !toId || !quantity) return toast.error("Completa todos los campos");
    try {
      await transfer.mutateAsync({ fromWarehouseId: fromId, toWarehouseId: toId, productId: product.id, quantity, notes });
      onClose();
    } catch {}
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Transferir — {product.name}</DialogTitle></DialogHeader>
        <div className="space-y-3 mt-2">
          <div className="space-y-1">
            <Label>Desde</Label>
            <Select value={fromId} onValueChange={setFromId}>
              <SelectTrigger><SelectValue placeholder="Almacén origen" /></SelectTrigger>
              <SelectContent>{warehouses.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Hacia</Label>
            <Select value={toId} onValueChange={setToId}>
              <SelectTrigger><SelectValue placeholder="Almacén destino" /></SelectTrigger>
              <SelectContent>{warehouses.filter((w) => w.id !== fromId).map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Cantidad</Label>
            <Input type="number" min={0.001} step={0.001} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
          </div>
          <div className="space-y-1">
            <Label>Notas</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button disabled={!fromId || !toId || !quantity || transfer.isPending} onClick={handleSubmit}>
            {transfer.isPending ? "Transfiriendo..." : "Transferir"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PhysicalDialog({ stock, warehouses, onClose }: { stock: any[]; warehouses: any[]; onClose: () => void }) {
  const physical = usePhysicalInventory();
  const [warehouseId, setWarehouseId] = useState(warehouses.find((w) => w.isDefault)?.id ?? "");
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    stock.filter((p) => p.trackStock).forEach((p) => { init[p.id] = p.currentStock; });
    return init;
  });

  const tracked = stock.filter((p) => p.trackStock);

  async function handleSubmit() {
    const items = Object.entries(quantities).map(([productId, actualQty]) => ({ productId, warehouseId, actualQty }));
    try {
      await physical.mutateAsync(items);
      onClose();
    } catch {}
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Inventario físico</DialogTitle></DialogHeader>
        <div className="space-y-3 mt-2">
          <div className="space-y-1">
            <Label>Almacén</Label>
            <Select value={warehouseId} onValueChange={setWarehouseId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{warehouses.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">Introduce el recuento real. Se crearán ajustes automáticos donde haya diferencias.</p>
          {tracked.length === 0 ? (
            <p className="text-sm text-center text-muted-foreground py-4">No hay productos con seguimiento de stock activo</p>
          ) : tracked.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{p.name}</p>
                <p className="text-xs text-muted-foreground">Sistema: {p.currentStock}</p>
              </div>
              <div className="w-28">
                <Input
                  type="number" min={0} step={0.001} className="h-8 text-sm"
                  value={quantities[p.id] ?? p.currentStock}
                  onChange={(e) => setQuantities((q) => ({ ...q, [p.id]: Number(e.target.value) }))}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button disabled={!warehouseId || physical.isPending} onClick={handleSubmit}>
            <ClipboardCheck className="h-4 w-4 mr-2" />
            {physical.isPending ? "Aplicando..." : "Aplicar inventario"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MinStockDialog({ product, onClose }: { product: any; onClose: () => void }) {
  const setMin = useSetMinStock();
  const [value, setValue] = useState<string>(product.minStock != null ? String(product.minStock) : "");

  async function handleSubmit() {
    await setMin.mutateAsync({ productId: product.id, minStock: value !== "" ? Number(value) : null });
    onClose();
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Stock mínimo — {product.name}</DialogTitle></DialogHeader>
        <div className="space-y-3 mt-2">
          <p className="text-sm text-muted-foreground">
            Se generará una alerta cuando el stock baje a este nivel. Deja vacío para desactivar.
          </p>
          <div className="space-y-1">
            <Label>Stock mínimo</Label>
            <Input type="number" min={0} step={0.001} placeholder="Sin mínimo" value={value} onChange={(e) => setValue(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button disabled={setMin.isPending} onClick={handleSubmit}>{setMin.isPending ? "Guardando..." : "Guardar"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function WarehouseDialog({
  open, onOpenChange, warehouse, onSave, loading,
}: { open: boolean; onOpenChange: (v: boolean) => void; warehouse: any; onSave: (d: any) => void; loading: boolean }) {
  const [form, setForm] = useState<any>({});
  const values = warehouse ? { ...warehouse, ...form } : form;
  function set(k: string, v: any) { setForm((f: any) => ({ ...f, [k]: v })); }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{warehouse ? "Editar almacén" : "Nuevo almacén"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3 mt-2">
          <div className="col-span-2 space-y-1">
            <Label>Nombre *</Label>
            <Input value={values.name ?? ""} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div className="col-span-2 space-y-1">
            <Label>Descripción</Label>
            <Input value={values.description ?? ""} onChange={(e) => set("description", e.target.value)} />
          </div>
          <div className="col-span-2 space-y-1">
            <Label>Dirección</Label>
            <Input value={values.address ?? ""} onChange={(e) => set("address", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Teléfono</Label>
            <Input value={values.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Email</Label>
            <Input value={values.email ?? ""} onChange={(e) => set("email", e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button disabled={loading || !values.name} onClick={() => onSave(values)}>
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SummaryCard({ label, value, icon, warn }: { label: string; value: any; icon: React.ReactNode; warn?: boolean }) {
  return (
    <Card className={warn ? "border-yellow-300" : ""}>
      <CardContent className="p-4 flex items-center gap-3">
        {icon}
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className={`text-xl font-bold ${warn ? "text-yellow-600" : ""}`}>{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
