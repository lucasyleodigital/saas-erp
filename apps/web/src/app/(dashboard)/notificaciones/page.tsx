import type { Metadata } from "next";

export const metadata: Metadata = { title: "Notificaciones" };

export default function NotificationsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Notificaciones</h1>
      <p className="text-muted-foreground">Centro de notificaciones — próximamente.</p>
    </div>
  );
}
