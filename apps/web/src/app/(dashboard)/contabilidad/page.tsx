import type { Metadata } from "next";

export const metadata: Metadata = { title: "Contabilidad" };

export default function AccountingPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Contabilidad</h1>
      <p className="text-muted-foreground">Módulo de contabilidad — próximamente.</p>
    </div>
  );
}
