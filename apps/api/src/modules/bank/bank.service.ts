import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import * as XLSX from "xlsx";

export interface ReconcileResult {
  imported: number;
  reconciled: number;
  unmatched: number;
}

@Injectable()
export class BankService {
  constructor(private prisma: PrismaService) {}

  async getAccounts(companyId: string) {
    return this.prisma.bankAccount.findMany({
      where: { companyId, isActive: true },
      orderBy: { name: "asc" },
    });
  }

  async createAccount(companyId: string, data: { name: string; iban?: string; bic?: string }) {
    return this.prisma.bankAccount.create({
      data: { companyId, name: data.name, iban: data.iban, bic: data.bic },
    });
  }

  async deleteAccount(companyId: string, id: string) {
    const account = await this.prisma.bankAccount.findFirst({ where: { id, companyId } });
    if (!account) throw new BadRequestException("Cuenta no encontrada");
    await this.prisma.bankAccount.update({ where: { id }, data: { isActive: false } });
    return { deleted: true };
  }

  async getTransactions(companyId: string, bankAccountId: string, params: any) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 50;
    const skip = (page - 1) * limit;

    const account = await this.prisma.bankAccount.findFirst({
      where: { id: bankAccountId, companyId },
    });
    if (!account) throw new BadRequestException("Cuenta no encontrada");

    const [data, total] = await Promise.all([
      this.prisma.bankTransaction.findMany({
        where: { bankAccountId },
        skip,
        take: limit,
        orderBy: { date: "desc" },
      }),
      this.prisma.bankTransaction.count({ where: { bankAccountId } }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async deleteTransaction(companyId: string, bankAccountId: string, txId: string) {
    const account = await this.prisma.bankAccount.findFirst({ where: { id: bankAccountId, companyId } });
    if (!account) throw new BadRequestException("Cuenta no encontrada");
    await this.prisma.bankTransaction.delete({ where: { id: txId } });
    return { deleted: true };
  }

  async clearTransactions(companyId: string, bankAccountId: string) {
    const account = await this.prisma.bankAccount.findFirst({ where: { id: bankAccountId, companyId } });
    if (!account) throw new BadRequestException("Cuenta no encontrada");
    const result = await this.prisma.bankTransaction.deleteMany({ where: { bankAccountId } });
    return { deleted: result.count };
  }

  async importStatement(
    companyId: string,
    bankAccountId: string,
    buffer: Buffer,
  ): Promise<ReconcileResult> {
    const account = await this.prisma.bankAccount.findFirst({
      where: { id: bankAccountId, companyId },
    });
    if (!account) throw new BadRequestException("Cuenta no encontrada");

    const rows = this.parseStatement(buffer);
    if (!rows.length) throw new BadRequestException("No se encontraron transacciones en el archivo");

    let imported = 0;
    let reconciled = 0;
    let unmatched = 0;

    for (const row of rows) {
      const amount = row.amount;
      if (!amount || isNaN(amount)) continue;

      const existing = await this.prisma.bankTransaction.findFirst({
        where: {
          bankAccountId,
          amount: { gte: amount - 0.01, lte: amount + 0.01 },
          date: row.date,
          reference: row.reference || undefined,
        },
      });
      if (existing) continue;

      const tx = await this.prisma.bankTransaction.create({
        data: {
          bankAccountId,
          description: row.description || "",
          amount,
          date: row.date,
          reference: row.reference || null,
          isReconciled: false,
        },
      });
      imported++;

      if (amount > 0) {
        const matched = await this.tryReconcile(companyId, tx.id, amount, row.description);
        if (matched) reconciled++;
        else unmatched++;
      } else {
        unmatched++;
      }
    }

    return { imported, reconciled, unmatched };
  }

  async reconcilePending(companyId: string, bankAccountId: string): Promise<{ reconciled: number }> {
    const account = await this.prisma.bankAccount.findFirst({ where: { id: bankAccountId, companyId } });
    if (!account) throw new BadRequestException("Cuenta no encontrada");

    const pending = await this.prisma.bankTransaction.findMany({
      where: { bankAccountId, isReconciled: false, amount: { gt: 0 } },
    });

    let reconciled = 0;
    for (const tx of pending) {
      const matched = await this.tryReconcile(companyId, tx.id, Number(tx.amount), tx.description);
      if (matched) reconciled++;
    }
    return { reconciled };
  }

  private async tryReconcile(
    companyId: string,
    txId: string,
    amount: number,
    description: string,
  ): Promise<boolean> {
    const pendingInvoices = await this.prisma.invoice.findMany({
      where: {
        companyId,
        status: { in: ["SENT", "OVERDUE", "PARTIAL"] },
      },
      include: { client: true },
    });

    for (const inv of pendingInvoices) {
      const remaining = Number(inv.total) - Number(inv.paidAmount);
      const matchByAmount = Math.abs(remaining - amount) < 0.02;
      const matchByRef = description.toLowerCase().includes(inv.number.toLowerCase());
      const matchByClient = inv.client?.name && description.toLowerCase().includes(inv.client.name.toLowerCase());

      if (matchByAmount || matchByRef || matchByClient) {
        const newPaid = Number(inv.paidAmount) + amount;
        const newStatus = newPaid >= Number(inv.total) ? "PAID" : "PARTIAL";

        await this.prisma.$transaction([
          this.prisma.payment.create({
            data: { invoiceId: inv.id, amount, method: "BANK_TRANSFER" as any },
          }),
          this.prisma.invoice.update({
            where: { id: inv.id },
            data: { paidAmount: newPaid, status: newStatus as any },
          }),
          this.prisma.bankTransaction.update({
            where: { id: txId },
            data: { isReconciled: true },
          }),
        ]);
        return true;
      }
    }
    return false;
  }

  private parseStatement(buffer: Buffer): Array<{ date: Date; amount: number; description: string; reference: string }> {
    let rows: Record<string, any>[];

    const isZip = buffer[0] === 0x50 && buffer[1] === 0x4B;
    const isXls = buffer[0] === 0xD0 && buffer[1] === 0xCF;

    if (isZip || isXls) {
      rows = this.parseExcelBuffer(buffer);
    } else {
      const raw = buffer.toString("utf8").trimStart();
      if (raw.startsWith("[") || raw.startsWith("{")) {
        rows = JSON.parse(raw);
        if (!Array.isArray(rows)) rows = [rows];
      } else {
        rows = this.parseExcelBuffer(buffer);
      }
    }

    const AMOUNT_KEYS = ["importe", "amount", "cantidad", "monto", "valor", "debe", "haber", "cargo", "abono"];
    const DATE_KEYS = ["fecha", "date", "fecha valor", "fecha operacion", "value date", "f. valor", "f.valor", "f valor"];
    const DESC_KEYS = ["concepto", "description", "descripcion", "detalle", "movimiento", "comentario"];
    const REF_KEYS = ["referencia", "reference", "ref", "numero", "subcategoria", "categoria"];

    function findKey(obj: Record<string, any>, candidates: string[]): string {
      const keys = Object.keys(obj);
      for (const c of candidates) {
        const found = keys.find((k) => k.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").includes(c));
        if (found) return found;
      }
      return "";
    }

    return rows.map((r) => {
      const amountKey = findKey(r, AMOUNT_KEYS);
      const dateKey = findKey(r, DATE_KEYS);
      const descKey = findKey(r, DESC_KEYS);
      const refKey = findKey(r, REF_KEYS);

      let amount = 0;
      if (amountKey) {
        const val = String(r[amountKey]).replace(/[^\d.,-]/g, "").replace(",", ".");
        amount = parseFloat(val) || 0;
      }

      let date = new Date();
      if (dateKey && r[dateKey]) {
        const val = r[dateKey];
        if (val instanceof Date) {
          date = val;
        } else if (typeof val === "number" && val > 25000 && val < 60000) {
          // Excel serial date number (days since 1900-01-01)
          const excelEpoch = new Date(1899, 11, 30);
          date = new Date(excelEpoch.getTime() + val * 86400000);
        } else {
          const s = String(val).trim();
          const dmY = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
          if (dmY) {
            const yr = dmY[3]!.length === 2 ? `20${dmY[3]}` : dmY[3];
            date = new Date(`${yr}-${dmY[2]!.padStart(2, "0")}-${dmY[1]!.padStart(2, "0")}`);
          } else {
            date = new Date(s);
          }
        }
      }

      return {
        date,
        amount,
        description: descKey ? String(r[descKey] ?? "") : "",
        reference: refKey ? String(r[refKey] ?? "") : "",
      };
    }).filter((r) => !isNaN(r.amount) && r.amount !== 0);
  }

  private parseExcelBuffer(buffer: Buffer): Record<string, any>[] {
    const wb = XLSX.read(buffer, { type: "buffer" });
    const ws = wb.Sheets[wb.SheetNames[0]!];
    if (!ws) throw new BadRequestException("Hoja vacia");

    const rawRows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

    const HEADER_HINTS = [
      "importe", "amount", "fecha", "date", "concepto", "descripcion",
      "description", "valor", "saldo", "movimiento", "cargo", "abono",
      "f. valor", "f.valor", "categoria", "referencia",
    ];

    let headerIdx = -1;
    for (let i = 0; i < Math.min(15, rawRows.length); i++) {
      const row = rawRows[i];
      if (!row || !Array.isArray(row)) continue;
      const cellsText = row.map((c: any) =>
        String(c ?? "").toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").trim()
      );
      const matches = cellsText.filter((c: string) =>
        HEADER_HINTS.some((h) => c.includes(h))
      ).length;
      if (matches >= 2) {
        headerIdx = i;
        break;
      }
    }

    if (headerIdx === -1) {
      return XLSX.utils.sheet_to_json(ws, { defval: "" });
    }

    const headers = (rawRows[headerIdx] as any[]).map((h: any) =>
      String(h ?? "").trim()
    );

    const dataRows: Record<string, any>[] = [];
    for (let i = headerIdx + 1; i < rawRows.length; i++) {
      const row = rawRows[i] as any[];
      if (!row || row.every((c: any) => c === "" || c === null || c === undefined)) continue;
      const obj: Record<string, any> = {};
      headers.forEach((h, idx) => {
        if (h) obj[h] = row[idx] ?? "";
      });
      dataRows.push(obj);
    }

    return dataRows;
  }
}
