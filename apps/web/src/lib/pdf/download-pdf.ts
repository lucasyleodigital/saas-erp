import { api } from "@/lib/api";

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement("a");
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function downloadInvoicePdf(invoiceId: string) {
  const { pdf }         = await import("@react-pdf/renderer");
  const { createElement } = await import("react");
  const { InvoicePdf }  = await import("./invoice-pdf");

  const [invoice, company] = await Promise.all([
    api.get(`/invoices/${invoiceId}`).then((r) => r.data),
    api.get("/companies/me").then((r) => r.data),
  ]);

  if (company) {
    invoice.company = {
      ...invoice.company,
      logo: company.logo ?? invoice.company?.logo,
      settings: company.settings ?? invoice.company?.settings,
      city: company.city ?? invoice.company?.city,
      province: company.province ?? invoice.company?.province,
      postalCode: company.postalCode ?? invoice.company?.postalCode,
      website: company.website ?? invoice.company?.website,
      bankAccounts: invoice.company?.bankAccounts ?? [],
    };
  }

  const blob = await pdf(createElement(InvoicePdf, { invoice }) as any).toBlob();
  triggerDownload(blob, `${invoice.number}.pdf`);
}

export async function downloadQuotePdf(quoteId: string) {
  const { pdf }         = await import("@react-pdf/renderer");
  const { createElement } = await import("react");
  const { QuotePdf }    = await import("./quote-pdf");

  const quote = await api.get(`/quotes/${quoteId}`).then((r) => r.data);
  const blob  = await pdf(createElement(QuotePdf, { quote }) as any).toBlob();
  triggerDownload(blob, `${quote.number}.pdf`);
}

export async function downloadDeliveryNotePdf(dnId: string) {
  const { pdf }           = await import("@react-pdf/renderer");
  const { createElement } = await import("react");
  const { DeliveryNotePdf } = await import("./delivery-note-pdf");

  const dn   = await api.get(`/delivery-notes/${dnId}`).then((r) => r.data);
  const blob = await pdf(createElement(DeliveryNotePdf, { dn }) as any).toBlob();
  triggerDownload(blob, `${dn.number}.pdf`);
}
