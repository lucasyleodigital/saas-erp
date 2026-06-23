import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class AssistantService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async chat(companyId: string, message: string) {
    const apiKey = this.config.get("CLAUDE_API_KEY");
    if (!apiKey) {
      return {
        response:
          "El asistente IA no esta configurado. Anade CLAUDE_API_KEY en las variables de entorno.",
      };
    }

    // Gather company context
    const [company, invoiceStats, clientCount] = await Promise.all([
      this.prisma.company.findUnique({
        where: { id: companyId },
        select: { name: true, settings: true },
      }),
      this.prisma.invoice.groupBy({
        by: ["status"],
        where: { companyId },
        _count: true,
        _sum: { total: true },
      }),
      this.prisma.client.count({ where: { companyId } }),
    ]);

    const context = `Eres el asistente de YouWhole ERP. La empresa del usuario es "${company?.name}". Tiene ${clientCount} clientes. Resumen de facturas: ${JSON.stringify(invoiceStats)}. Responde en espanol, de forma concisa y util. Si preguntan algo que no sabes, di que consulten con su asesor.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: context,
        messages: [{ role: "user", content: message }],
      }),
    });

    if (!response.ok) {
      return {
        response:
          "Error al contactar con el asistente. Intentalo de nuevo.",
      };
    }

    const result = await response.json();
    return { response: result.content?.[0]?.text ?? "Sin respuesta" };
  }
}
