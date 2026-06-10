import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Multi-tenant middleware: auto-filter by companyId
prisma.$use(async (params, next) => {
  const companyId = (globalThis as any).__currentCompanyId;

  const tenantModels = [
    "Client",
    "Lead",
    "Invoice",
    "Quote",
    "Product",
    "Tax",
    "Pipeline",
    "Deal",
    "Activity",
    "Account",
    "JournalEntry",
    "BankAccount",
    "Warehouse",
    "Supplier",
    "Notification",
    "AuditLog",
    "VerifactuRecord",
    "InvoiceSeries",
    "Category",
  ];

  if (companyId && tenantModels.includes(params.model ?? "")) {
    if (params.action === "findMany" || params.action === "findFirst") {
      params.args = params.args ?? {};
      params.args.where = { ...params.args.where, companyId };
    }
    if (params.action === "create") {
      params.args.data = { ...params.args.data, companyId };
    }
  }

  return next(params);
});

export * from "@prisma/client";
