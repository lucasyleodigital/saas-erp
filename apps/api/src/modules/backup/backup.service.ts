import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class BackupService {
  constructor(private prisma: PrismaService) {}

  async generateBackup(companyId: string) {
    const [
      company,
      clients,
      invoices,
      quotes,
      products,
      suppliers,
      employees,
      projects,
      bankAccounts,
      journalEntries,
    ] = await Promise.all([
      this.prisma.company.findUnique({ where: { id: companyId } }),
      this.prisma.client.findMany({
        where: { companyId },
        include: { contacts: true },
      }),
      this.prisma.invoice.findMany({
        where: { companyId },
        include: { items: true, taxes: true, payments: true },
      }),
      this.prisma.quote.findMany({
        where: { companyId },
        include: { items: true },
      }),
      this.prisma.product.findMany({ where: { companyId } }),
      this.prisma.supplier.findMany({ where: { companyId } }),
      this.prisma.employee.findMany({ where: { companyId } }),
      this.prisma.project.findMany({ where: { companyId } }),
      this.prisma.bankAccount.findMany({
        where: { companyId },
        include: { transactions: true },
      }),
      this.prisma.journalEntry.findMany({
        where: { companyId },
        include: { items: true },
      }),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      version: "1.0",
      company,
      clients,
      invoices,
      quotes,
      products,
      suppliers,
      employees,
      projects,
      bankAccounts,
      journalEntries,
    };
  }
}
