import type { Metadata } from "next";
import { NotificationsView } from "@/components/notifications/notifications-view";

export const metadata: Metadata = { title: "Notificaciones" };

export default function NotificationsPage() {
  return <NotificationsView />;
}
