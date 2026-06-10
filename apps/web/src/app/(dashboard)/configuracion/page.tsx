import type { Metadata } from "next";

export const metadata: Metadata = { title: "Configuración" };

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Configuración</h1>
      <p className="text-muted-foreground">Ajustes de la cuenta y empresa — próximamente.</p>
    </div>
  );
}
