import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class BackupService {
  constructor(private prisma: PrismaService) {}

  async restoreBackup(companyId: string, backup: any) {
    if (!backup?.version || !backup?.company) {
      throw new BadRequestException("Archivo de backup inválido o corrupto");
    }

    await this.prisma.$transaction(async (tx) => {
      // Clientes
      if (Array.isArray(backup.clients)) {
        for (const client of backup.clients) {
          const { contacts, id, companyId: _cid, ...clientData } = client;
          const upserted = await tx.client.upsert({
            where: { id },
            create: { id, ...clientData, companyId },
            update: { ...clientData, companyId },
          });
          if (Array.isArray(contacts)) {
            for (const contact of contacts) {
              const { id: cId, clientId: _cl, ...contactData } = contact;
              await tx.clientContact.upsert({
                where: { id: cId },
                create: { id: cId, ...contactData, clientId: upserted.id },
                update: { ...contactData },
              });
            }
          }
        }
      }

      // Productos
      if (Array.isArray(backup.products)) {
        for (const product of backup.products) {
          const { id, companyId: _cid, ...productData } = product;
          await tx.product.upsert({
            where: { id },
            create: { id, ...productData, companyId },
            update: { ...productData, companyId },
          });
        }
      }

      // Presupuestos
      if (Array.isArray(backup.quotes)) {
        for (const quote of backup.quotes) {
          const { items, id, companyId: _cid, ...quoteData } = quote;
          await tx.quote.upsert({
            where: { id },
            create: { id, ...quoteData, companyId },
            update: { ...quoteData, companyId },
          });
          if (Array.isArray(items)) {
            for (const item of items) {
              const { id: iId, quoteId: _qi, ...itemData } = item;
              await tx.quoteItem.upsert({
                where: { id: iId },
                create: { id: iId, ...itemData, quoteId: id },
                update: { ...itemData },
              });
            }
          }
        }
      }

      // Facturas
      if (Array.isArray(backup.invoices)) {
        for (const invoice of backup.invoices) {
          const { items, taxes, payments, id, companyId: _cid, ...invoiceData } = invoice;
          await tx.invoice.upsert({
            where: { id },
            create: { id, ...invoiceData, companyId },
            update: { ...invoiceData, companyId },
          });
          if (Array.isArray(items)) {
            for (const item of items) {
              const { id: iId, invoiceId: _ii, ...itemData } = item;
              await tx.invoiceItem.upsert({
                where: { id: iId },
                create: { id: iId, ...itemData, invoiceId: id },
                update: { ...itemData },
              });
            }
          }
        }
      }

      // Proveedores
      if (Array.isArray(backup.suppliers)) {
        for (const supplier of backup.suppliers) {
          const { id, companyId: _cid, ...supplierData } = supplier;
          await tx.supplier.upsert({
            where: { id },
            create: { id, ...supplierData, companyId },
            update: { ...supplierData, companyId },
          });
        }
      }

      // Proyectos
      if (Array.isArray(backup.projects)) {
        for (const project of backup.projects) {
          const { id, companyId: _cid, ...projectData } = project;
          await tx.project.upsert({
            where: { id },
            create: { id, ...projectData, companyId },
            update: { ...projectData, companyId },
          });
        }
      }
    }, { timeout: 30000 });

    return { restored: true, restoredAt: new Date().toISOString() };
  }

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
