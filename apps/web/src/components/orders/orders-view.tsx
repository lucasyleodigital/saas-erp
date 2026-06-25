"use client";

import { useState } from "react";
import {
  useOrders,
  useDeleteOrder,
  useCreateOrder,
  useConvertOrderToDeliveryNote,
  type Order,
} from "@/hooks/use-orders";
import { useClients } from "@/hooks/use-clients";
import { useProducts } from "@/hooks/use-products";
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
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  FileText,
  ShoppingCart,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import { useDebounce } from "@/hooks/use-debounce";
import { formatCurrency } from "@/lib/utils";
import { useTranslations } from "next-intl";

const _STATUS = {
  PENDING:   { label: "Pendiente",  color: "bg-yellow-100 text-yellow-700" },
  CONFIRMED: { label: "Confirmado", color: "bg-blue-100 text-blue-700" },
  SHIPPED:   { label: "Enviado",    color: "bg-purple-100 text-purple-700" },
  DELIVERED: { label: "Entregado",  color: "bg-green-100 text-green-700" },
  CANCELLED: { label: "Cancelado",  color: "bg-gray-100 text-gray-500" },
};
const STATUS = _STATUS as Record<string, { label: string; color: string }>;
function getStatus(s: string) { return STATUS[s] ?? _STATUS.PENDING; }

export function OrdersView() {
  const t = useTranslations("orders");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useOrders({
    search: debouncedSearch || undefined,
    status: statusFilter || undefined,
    page,
    limit: 20,
  });
  const deleteOrder = useDeleteOrder();
  const convertOrder = useConvertOrderToDeliveryNote();

  const orders = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  async function handleConvert(id: string, number: string) {
    if (!confirm(`¿Convertir pedido ${number} en albarán?`)) return;
    try {
      const dn = await convertOrder.mutateAsync(id);
      toast.success(`Albarán ${dn.number} creado`);
    } catch {
      toast.error("Error al convertir el pedido");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          {t("new")}
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("search")}
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === "ALL" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos</SelectItem>
            <SelectItem value="PENDING">Pendiente</SelectItem>
            <SelectItem value="CONFIRMED">Confirmado</SelectItem>
            <SelectItem value="SHIPPED">Enviado</SelectItem>
            <SelectItem value="DELIVERED">Entregado</SelectItem>
            <SelectItem value="CANCELLED">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-px">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted/40 animate-pulse" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <EmptyState onNew={() => setDialogOpen(true)} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">Número</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">Cliente</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">Estado</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">Fecha</th>
                    <th className="text-right font-medium text-muted-foreground px-4 py-3">Total</th>
                    <th className="px-4 py-3 w-12" />
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {orders.map((order, i) => {
                      const cfg = getStatus(order.status);
                      return (
                        <motion.tr
                          key={order.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.03 }}
                          className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-4 py-3 font-mono font-medium">{order.number}</td>
                          <td className="px-4 py-3">{(order as any).client?.name ?? "—"}</td>
                          <td className="px-4 py-3">
                            <Badge className={cfg.color}>{cfg.label}</Badge>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                            {new Date(order.issueDate).toLocaleDateString("es-ES")}
                          </td>
                          <td className="px-4 py-3 text-right font-medium">
                            {formatCurrency(Number(order.total))}
                          </td>
                          <td className="px-4 py-3">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {!order.convertedToDeliveryNoteId && order.status !== "CANCELLED" && (
                                  <DropdownMenuItem onClick={() => handleConvert(order.id, order.number)}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Crear albarán
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => {
                                    if (confirm(`¿Eliminar pedido ${order.number}?`)) {
                                      deleteOrder.mutate(order.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Página {page} de {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Siguiente</Button>
          </div>
        </div>
      )}

      <OrderDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}

function OrderDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const createOrder = useCreateOrder();
  const { data: clientsData } = useClients({ limit: 100 });
  const { data: productsData } = useProducts();
  const clients = clientsData?.data ?? [];
  const products = (productsData as any)?.data ?? productsData ?? [];

  const [clientId, setClientId] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([{ description: "", quantity: 1, unitPrice: 0, discount: 0, taxRate: 21, productId: "" }]);

  function addItem() {
    setItems([...items, { description: "", quantity: 1, unitPrice: 0, discount: 0, taxRate: 21, productId: "" }]);
  }

  function removeItem(i: number) {
    setItems(items.filter((_, idx) => idx !== i));
  }

  function setItem(i: number, k: string, v: any) {
    setItems(items.map((item, idx) => {
      if (idx !== i) return item;
      const updated = { ...item, [k]: v };
      if (k === "productId") {
        const prod = products.find((p: any) => p.id === v);
        if (prod) {
          updated.description = prod.name;
          updated.unitPrice = Number(prod.price ?? 0);
        }
      }
      return updated;
    }));
  }

  const total = items.reduce((s, item) => {
    const base = Number(item.quantity) * Number(item.unitPrice) * (1 - Number(item.discount) / 100);
    return s + base * (1 + Number(item.taxRate) / 100);
  }, 0);

  async function handleSubmit() {
    if (!clientId) return toast.error("Selecciona un cliente");
    if (!items.some((i) => i.description)) return toast.error("Añade al menos una línea");
    try {
      await createOrder.mutateAsync({
        clientId,
        notes,
        items: items.filter((i) => i.description).map((i) => ({
          ...i,
          productId: i.productId || null,
        })),
      } as any);
      toast.success("Pedido creado");
      onOpenChange(false);
    } catch {
      toast.error("Error al crear el pedido");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo pedido</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-1">
            <Label>Cliente *</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar cliente..." />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Líneas</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-3 w-3 mr-1" />Añadir línea
              </Button>
            </div>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-4">
                    <Select value={item.productId} onValueChange={(v) => setItem(i, "productId", v)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Producto..." />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p: any) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      className="h-8 text-xs mt-1"
                      placeholder="Descripción *"
                      value={item.description}
                      onChange={(e) => setItem(i, "description", e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      className="h-8 text-xs"
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => setItem(i, "quantity", Number(e.target.value))}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      className="h-8 text-xs"
                      type="number"
                      placeholder="Precio"
                      value={item.unitPrice}
                      onChange={(e) => setItem(i, "unitPrice", Number(e.target.value))}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      className="h-8 text-xs"
                      type="number"
                      placeholder="IVA %"
                      value={item.taxRate}
                      onChange={(e) => setItem(i, "taxRate", Number(e.target.value))}
                    />
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeItem(i)}
                      disabled={items.length === 1}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <Label>Notas</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas internas..." />
          </div>

          <div className="flex justify-between items-center border-t pt-3">
            <span className="text-sm text-muted-foreground">Total estimado</span>
            <span className="font-bold text-lg">{formatCurrency(total)}</span>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button disabled={createOrder.isPending} onClick={handleSubmit}>
              {createOrder.isPending ? "Creando..." : "Crear pedido"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EmptyState({ onNew }: { onNew: () => void }) {
  const t = useTranslations("orders");
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
        <ShoppingCart className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="font-medium">{t("noResults")}</p>
      <p className="text-sm text-muted-foreground mt-1 mb-4">{t("noResultsDesc")}</p>
      <Button onClick={onNew} size="sm">
        <Plus className="h-4 w-4 mr-2" />{t("new")}
      </Button>
    </div>
  );
}
