import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

export interface SearchResult {
  id: string;
  type: "client" | "invoice" | "quote" | "product" | "employee" | "delivery-note";
  label: string;
  sublabel?: string;
  href: string;
}

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async search(companyId: string, q: string): Promise<SearchResult[]> {
    if (!q || q.trim().length < 2) return [];
    const term = q.trim().toLowerCase();
    const results: SearchResult[] = [];

    const [clients, invoices, quotes, products, employees, notes] = await Promise.all([
      this.prisma.client.findMany({
        where: {
          companyId,
          isActive: true,
          OR: [
            { name: { contains: term, mode: "insensitive" } },
            { email: { contains: term, mode: "insensitive" } },
            { nif: { contains: term, mode: "insensitive" } },
          ],
        },
        take: 5,
        select: { id: true, name: true, email: true },
      }),
      this.prisma.invoice.findMany({
        where: {
          companyId,
          OR: [
            { number: { contains: term, mode: "insensitive" } },
            { client: { name: { contains: term, mode: "insensitive" } } },
          ],
        },
        take: 5,
        select: { id: true, number: true, client: { select: { name: true } } },
      }),
      this.prisma.quote.findMany({
        where: {
          companyId,
          OR: [
            { number: { contains: term, mode: "insensitive" } },
            { client: { name: { contains: term, mode: "insensitive" } } },
          ],
        },
        take: 4,
        select: { id: true, number: true, client: { select: { name: true } } },
      }),
      this.prisma.product.findMany({
        where: {
          companyId,
          OR: [
            { name: { contains: term, mode: "insensitive" } },
            { sku: { contains: term, mode: "insensitive" } },
          ],
        },
        take: 4,
        select: { id: true, name: true, sku: true },
      }),
      this.prisma.employee.findMany({
        where: {
          companyId,
          OR: [
            { firstName: { contains: term, mode: "insensitive" } },
            { lastName: { contains: term, mode: "insensitive" } },
          ],
        },
        take: 4,
        select: { id: true, firstName: true, lastName: true, position: true },
      }),
      this.prisma.deliveryNote.findMany({
        where: {
          companyId,
          OR: [
            { number: { contains: term, mode: "insensitive" } },
            { client: { name: { contains: term, mode: "insensitive" } } },
          ],
        },
        take: 3,
        select: { id: true, number: true, client: { select: { name: true } } },
      }),
    ]);

    for (const c of clients) {
      results.push({ id: c.id, type: "client", label: c.name, sublabel: c.email ?? undefined, href: `/clientes/${c.id}` });
    }
    for (const inv of invoices) {
      results.push({ id: inv.id, type: "invoice", label: inv.number, sublabel: (inv.client as any)?.name, href: `/facturas/${inv.id}` });
    }
    for (const q2 of quotes) {
      results.push({ id: q2.id, type: "quote", label: q2.number, sublabel: (q2.client as any)?.name, href: `/presupuestos` });
    }
    for (const p of products) {
      results.push({ id: p.id, type: "product", label: p.name, sublabel: p.sku ?? undefined, href: `/productos` });
    }
    for (const emp of employees) {
      results.push({ id: emp.id, type: "employee", label: `${emp.firstName} ${emp.lastName}`, sublabel: emp.position ?? undefined, href: `/empleados/${emp.id}` });
    }
    for (const dn of notes) {
      results.push({ id: dn.id, type: "delivery-note", label: dn.number, sublabel: (dn.client as any)?.name, href: `/albaranes` });
    }

    return results;
  }
}
