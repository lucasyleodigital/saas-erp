import type { Metadata } from "next";

export const metadata: Metadata = { title: "Leads" };

export default function LeadsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Leads</h1>
      <p className="text-muted-foreground">Módulo de leads — próximamente.</p>
    </div>
  );
}
