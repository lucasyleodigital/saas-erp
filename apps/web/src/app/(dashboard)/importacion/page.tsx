import type { Metadata } from "next";
import { ImportView } from "@/components/import/import-view";

export const metadata: Metadata = { title: "Importar datos — YouWhole" };

export default function ImportPage() {
  return <ImportView />;
}
