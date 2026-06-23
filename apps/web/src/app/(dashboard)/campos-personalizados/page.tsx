import type { Metadata } from "next";
import { CustomFieldsView } from "@/components/settings/custom-fields-view";

export const metadata: Metadata = { title: "Campos personalizados" };

export default function CustomFieldsPage() {
  return <CustomFieldsView />;
}
