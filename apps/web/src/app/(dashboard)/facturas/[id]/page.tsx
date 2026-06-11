import type { Metadata } from "next";
import { InvoiceDetail } from "@/components/invoices/invoice-detail";

export const metadata: Metadata = { title: "Detalle de factura — ERP SaaS" };

export default function InvoiceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <InvoiceDetail id={params.id} />;
}
