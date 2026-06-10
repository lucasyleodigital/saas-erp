import type { Metadata } from "next";

export const metadata: Metadata = { title: "Inventario" };

export default function InventoryPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Inventario</h1>
      <p className="text-muted-foreground">Módulo de inventario — próximamente.</p>
    </div>
  );
}
