import type { Metadata } from "next";
import { CompanySettings } from "@/components/settings/company-settings";

export const metadata: Metadata = { title: "Mi empresa — ERP SaaS" };

export default function CompanyPage() {
  return <CompanySettings />;
}
