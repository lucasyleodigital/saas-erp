import type { Metadata } from "next";
import { UserSettings } from "@/components/settings/user-settings";

export const metadata: Metadata = { title: "Configuración — ERP SaaS" };

export default function SettingsPage() {
  return <UserSettings />;
}
