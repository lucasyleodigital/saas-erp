import type { Metadata } from "next";

export const metadata: Metadata = { title: "Presupuestos" };

export default function QuotesPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Presupuestos</h1>
      <p className="text-muted-foreground">Módulo de presupuestos — próximamente.</p>
    </div>
  );
}
