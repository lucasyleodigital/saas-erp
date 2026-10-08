"use client";

import { useState } from "react";
import {
  useDeliveryNote,
  useUpdateDeliveryNoteStatus,
  useConvertDeliveryNoteToInvoice,
  useDeleteDeliveryNote,
  useGenerateDeca,
  useAnularDeca,
  getDNStatusConfig,
} from "@/hooks/use-delivery-notes";
import { useLocale } from "@/hooks/use-locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import {
  ArrowLeft,
  Truck,
  ChevronDown,
  Send,
  CheckCircle,
  XCircle,
  ArrowRight,
  Trash2,
  Building2,
  Calendar,
  FileText,
  ExternalLink,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function DeliveryNoteDetailView({ id }: { id: string }) {
  const { data: note, isLoading } = useDeliveryNote(id);
  const updateStatus = useUpdateDeliveryNoteStatus();
  const convertToInvoice = useConvertDeliveryNoteToInvoice();
  const deleteNote = useDeleteDeliveryNote();
  const generateDeca = useGenerateDeca();
  const anularDeca = useAnularDeca();
  const router = useRouter();
  const locale = useLocale();
  const [decaDialog, setDecaDialog] = useState(false);
  const [matricula, setMatricula] = useState("");

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (!note) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Albarán no encontrado
      </div>
    );
  }

  const cfg = getDNStatusConfig(note.status);
  const canConvert = ["SENT", "DELIVERED"].includes(note.status);
  const canDelete = note.status !== "INVOICED";

  async function handleDelete() {
    if (!confirm(`¿Eliminar el albarán ${note!.number}?`)) return;
    await deleteNote.mutateAsync(id);
    router.push(`/${locale}/albaranes`);
  }

  async function handleConvert() {
    if (!confirm(`¿Convertir el albarán ${note!.number} a factura?`)) return;
    const invoice = await convertToInvoice.mutateAsync(id) as any;
    router.push(`/${locale}/facturas/${invoice.id}`);
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/${locale}/albaranes`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-mono">{note.number}</h1>
              <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", cfg.color)}>
                {cfg.label}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{(note as any).client?.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!note.decaflyId && note.status !== "CANCELLED" && (
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={() => setDecaDialog(true)}
            >
              <Truck className="h-4 w-4" />
              Generar DeCA
            </Button>
          )}
          {canConvert && (
            <Button
              size="sm"
              className="gap-2"
              onClick={handleConvert}
              disabled={convertToInvoice.isPending}
            >
              <ArrowRight className="h-4 w-4" />
              Facturar
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                Acciones <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {note.status === "DRAFT" && (
                <DropdownMenuItem
                  onClick={() => updateStatus.mutate({ id, status: "SENT" })}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Marcar como enviado
                </DropdownMenuItem>
              )}
              {note.status === "SENT" && (
                <DropdownMenuItem
                  onClick={() => updateStatus.mutate({ id, status: "DELIVERED" })}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Marcar como entregado
                </DropdownMenuItem>
              )}
              {!["INVOICED", "CANCELLED"].includes(note.status) && (
                <DropdownMenuItem
                  onClick={() => updateStatus.mutate({ id, status: "CANCELLED" })}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancelar albarán
                </DropdownMenuItem>
              )}
              {canConvert && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleConvert} disabled={convertToInvoice.isPending}>
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Convertir a factura
                  </DropdownMenuItem>
                </>
              )}
              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={handleDelete}
                    disabled={deleteNote.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Cliente */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold">{(note as any).client?.name ?? "—"}</p>
            {(note as any).client?.email && (
              <p className="text-sm text-muted-foreground">{(note as any).client.email}</p>
            )}
          </CardContent>
        </Card>

        {/* Fechas */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Fechas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Emisión</span>
              <span>{formatDate(note.issueDate)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Entrega</span>
              <span>{note.deliveryDate ? formatDate(note.deliveryDate) : "—"}</span>
            </div>
          </CardContent>
        </Card>

        {/* Presupuesto origen */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Origen
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(note as any).quote ? (
              <Link
                href={`/presupuestos/${(note as any).quote.id}`}
                className="text-primary hover:underline font-mono text-sm font-medium"
              >
                {(note as any).quote.number}
              </Link>
            ) : (
              <span className="text-muted-foreground text-sm">Creado manualmente</span>
            )}
            {note.convertedToInvoiceId && (
              <div className="mt-1">
                <Link
                  href={`/facturas/${note.convertedToInvoiceId}`}
                  className="text-xs text-purple-600 dark:text-purple-400 hover:underline"
                >
                  Ver factura generada →
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Items */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Líneas del albarán
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Descripción</th>
                  <th className="text-right font-medium text-muted-foreground px-4 py-3 hidden sm:table-cell">Cantidad</th>
                  <th className="text-right font-medium text-muted-foreground px-4 py-3 hidden sm:table-cell">Precio</th>
                  <th className="text-right font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">Dto%</th>
                  <th className="text-right font-medium text-muted-foreground px-4 py-3">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {((note as any).items ?? []).map((item: any) => (
                  <tr key={item.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium">{item.description}</p>
                    </td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell text-muted-foreground">
                      {Number(item.quantity)}
                    </td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell text-muted-foreground">
                      {formatCurrency(Number(item.unitPrice))}
                    </td>
                    <td className="px-4 py-3 text-right hidden md:table-cell text-muted-foreground">
                      {Number(item.discount) > 0 ? `${Number(item.discount)}%` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatCurrency(Number(item.subtotal))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end p-4 border-t border-border">
            <div className="w-full max-w-xs space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(Number(note.subtotal))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">IVA 21%</span>
                <span>{formatCurrency(Number(note.taxAmount))}</span>
              </div>
              <div className="flex justify-between font-semibold text-base border-t border-border pt-1.5">
                <span>Total</span>
                <span>{formatCurrency(Number(note.total))}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notas */}
      {note.notes && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{note.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* DeCA */}
      {note.decaflyId && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Documento de Control de Transporte (DeCA)
              <span className={cn(
                "ml-auto inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                note.decaflyEstado === "vigente"
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                  : note.decaflyEstado === "anulado"
                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
              )}>
                {note.decaflyEstado ?? "pendiente"}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {note.matricula && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Matrícula</span>
                <span className="font-mono font-medium">{note.matricula}</span>
              </div>
            )}
            <div className="flex gap-3 flex-wrap">
              {note.decaflyVerifyUrl && (
                <a
                  href={note.decaflyVerifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Verificar DeCA
                </a>
              )}
              {note.decaflyPdfUrl && (
                <a
                  href={note.decaflyPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Descargar PDF
                </a>
              )}
            </div>
            {note.decaflyEstado === "vigente" && (
              <Button
                variant="destructive"
                size="sm"
                className="gap-2"
                onClick={() => {
                  if (confirm("¿Anular este DeCA? Esta acción no se puede deshacer.")) {
                    anularDeca.mutate(note.id);
                  }
                }}
                disabled={anularDeca.isPending}
              >
                {anularDeca.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                Anular DeCA
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Generar DeCA dialog */}
      <Dialog open={decaDialog} onOpenChange={setDecaDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              Generar DeCA
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Se creará un Documento de Control de Transporte para el albarán <span className="font-mono font-medium">{note.number}</span>.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="matricula">Matrícula del vehículo *</Label>
              <Input
                id="matricula"
                value={matricula}
                onChange={(e) => setMatricula(e.target.value)}
                placeholder="1234ABC"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDecaDialog(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!matricula.trim() || generateDeca.isPending}
              onClick={async () => {
                await generateDeca.mutateAsync({ id: note.id, matricula: matricula.trim() });
                setDecaDialog(false);
                setMatricula("");
              }}
              className="gap-2"
            >
              {generateDeca.isPending
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Generando...</>
                : <><Truck className="h-4 w-4" /> Generar DeCA</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
