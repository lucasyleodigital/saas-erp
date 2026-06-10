import type { Metadata } from "next";

export const metadata: Metadata = { title: "Automatizaciones" };

export default function AutomationsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Automatizaciones</h1>
      <p className="text-muted-foreground">Flujos de trabajo automáticos — próximamente.</p>
    </div>
  );
}
