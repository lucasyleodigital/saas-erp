import type { Metadata } from "next";
import { BackupSection } from "@/components/settings/backup-section";

export const metadata: Metadata = { title: "Backup" };

export default function BackupPage() {
  return <BackupSection />;
}
