import type { Metadata } from "next";

export const metadata: Metadata = { title: "Mi empresa" };

export default function CompanyPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Mi empresa</h1>
      <p className="text-muted-foreground">Datos fiscales y configuración de empresa — próximamente.</p>
    </div>
  );
}
