import { PrismaService } from "../../database/prisma.service";

/**
 * Siguiente número libre de una serie. Salta los que ya existen en la empresa
 * (facturas importadas o creadas con el contador desfasado), porque repetir
 * número viola el índice único (companyId, number) y bloquea la facturación.
 */
export async function nextFreeInvoiceNumber(
  prisma: PrismaService,
  companyId: string,
  series: { prefix: string; nextNumber: number },
): Promise<{ number: string; nextNumber: number }> {
  const taken = new Set(
    (
      await prisma.invoice.findMany({
        where: { companyId, number: { startsWith: series.prefix } },
        select: { number: true },
      })
    ).map((i) => i.number),
  );

  let n = series.nextNumber;
  let number = `${series.prefix}${String(n).padStart(4, "0")}`;
  while (taken.has(number)) {
    n++;
    number = `${series.prefix}${String(n).padStart(4, "0")}`;
  }
  return { number, nextNumber: n + 1 };
}
