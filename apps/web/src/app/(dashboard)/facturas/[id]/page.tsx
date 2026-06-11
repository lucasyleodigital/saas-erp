import type { Metadata } from "next";
import { InvoiceDetail } from "@/components/invoices/invoice-detail";

export const metadata: Metadata = { title: "Detalle de factura — ERP SaaS" };

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <InvoiceDetail id={id} />;
}
