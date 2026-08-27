import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { EmailService } from "../email/email.service";
import {
  buildContractDocument,
  renderContractHtml,
  CONTRACT_VERSION,
  type ContractPlan,
} from "./contract-content";
import { generateContractPdf } from "./contract-pdf.generator";

const ADMIN_COPY_EMAIL = "lucasyleodigital@gmail.com";

interface RecordAcceptanceParams {
  companyId: string;
  userId: string;
  plan: ContractPlan;
  price: number;
  ipAddress: string | null;
}

@Injectable()
export class ContractsService {
  constructor(
    private prisma: PrismaService,
    private email: EmailService
  ) {}

  // The DB row is our own permanent copy as the platform owner — it never
  // depends on the client's mailbox — and doubles as the legal proof of
  // acceptance (IP + timestamp + exact text shown). Email is best-effort:
  // a delivery failure must not block signup/checkout.
  async recordAcceptance(params: RecordAcceptanceParams) {
    const { companyId, userId, plan, price, ipAddress } = params;

    const company = await this.prisma.company.findUniqueOrThrow({
      where: { id: companyId },
      select: { name: true, cif: true, legalName: true },
    });

    const acceptedAt = new Date();
    const contractDoc = buildContractDocument({
      companyName: company.legalName ?? company.name,
      cif: company.cif,
      plan,
      price,
      acceptedAt,
    });
    const html = renderContractHtml(contractDoc);

    const acceptance = await this.prisma.contractAcceptance.create({
      data: {
        companyId,
        userId,
        plan,
        version: CONTRACT_VERSION,
        price,
        contentHtml: html,
        ipAddress: ipAddress ?? undefined,
        acceptedAt,
      },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (user?.email) {
      Promise.all([
        this.email.sendGeneric(user.email, contractDoc.subject, html),
        this.email.sendGeneric(ADMIN_COPY_EMAIL, `[COPIA] ${contractDoc.subject}`, html),
      ]).catch((err) => console.error("[CONTRACTS] Email send failed:", err?.message ?? err));
    }

    return acceptance;
  }

  async listForCompany(companyId: string) {
    return this.prisma.contractAcceptance.findMany({
      where: { companyId },
      orderBy: { acceptedAt: "desc" },
      select: {
        id: true,
        plan: true,
        version: true,
        price: true,
        acceptedAt: true,
      },
    });
  }

  async getOne(companyId: string, id: string) {
    const acceptance = await this.prisma.contractAcceptance.findFirst({
      where: { id, companyId },
    });
    if (!acceptance) throw new NotFoundException("Contrato no encontrado");
    return acceptance;
  }

  async getPdf(companyId: string, id: string): Promise<{ buffer: Buffer; filename: string }> {
    const acceptance = await this.getOne(companyId, id);
    const company = await this.prisma.company.findUniqueOrThrow({
      where: { id: companyId },
      select: { name: true, cif: true, legalName: true },
    });

    const contractDoc = buildContractDocument({
      companyName: company.legalName ?? company.name,
      cif: company.cif,
      plan: acceptance.plan as ContractPlan,
      price: Number(acceptance.price),
      acceptedAt: acceptance.acceptedAt,
    });

    const buffer = await generateContractPdf(contractDoc);
    const filename = `contrato-youwhole-${acceptance.plan.toLowerCase()}-${acceptance.acceptedAt.toISOString().slice(0, 10)}.pdf`;
    return { buffer, filename };
  }
}
