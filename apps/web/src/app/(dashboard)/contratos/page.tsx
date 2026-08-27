"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Eye, Download, FileSignature } from "lucide-react";
import { useContracts, useContract, downloadContractPdf } from "@/hooks/use-contracts";

const PLAN_LABEL: Record<string, string> = {
  FREE: "Gratuito",
  STARTER: "Starter",
  PRO: "Pro",
  ENTERPRISE: "Enterprise",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function ContratosPage() {
  const { data: contracts, isLoading } = useContracts();
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const { data: detail } = useContract(viewingId);

  async function handleDownload(id: string, plan: string) {
    setDownloadingId(id);
    await downloadContractPdf(id, plan);
    setDownloadingId(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mis contratos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Cada vez que te das de alta o cambias de plan, guardamos y te enviamos por email el
          contrato exacto que aceptaste.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !contracts || contracts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Todavía no tienes ningún contrato registrado.
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-xl border border-border divide-y divide-border">
          {contracts.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between gap-4 px-5 py-4"
            >
              <div className="flex items-center gap-3">
                <FileSignature className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-medium">
                    Plan {PLAN_LABEL[c.plan] ?? c.plan}
                    {c.price > 0 && ` — ${c.price}€/mes`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Aceptado el {formatDate(c.acceptedAt)} · Versión {c.version}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="sm" className="gap-2" onClick={() => setViewingId(c.id)}>
                  <Eye className="h-4 w-4" />
                  Ver
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  disabled={downloadingId === c.id}
                  onClick={() => handleDownload(c.id, c.plan)}
                >
                  {downloadingId === c.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  PDF
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!viewingId} onOpenChange={(o) => !o && setViewingId(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Contrato de servicios YouWhole</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 border rounded-md">
            {detail ? (
              <div dangerouslySetInnerHTML={{ __html: detail.contentHtml }} />
            ) : (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
