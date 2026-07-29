import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { EmailService } from "../email/email.service";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Injectable()
export class MeetingsService {
  constructor(
    private prisma: PrismaService,
    private email: EmailService,
  ) {}

  async findAll(companyId: string, params: any) {
    const { search, status, dateFrom, dateTo } = params;
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 50;

    const where: any = {
      companyId,
      ...(status && { status }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { notes: { contains: search, mode: "insensitive" } },
          { diagnosis: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo + "T23:59:59");
    }

    const [data, total] = await Promise.all([
      this.prisma.meeting.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { date: "desc" },
      }),
      this.prisma.meeting.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(companyId: string, id: string) {
    const meeting = await this.prisma.meeting.findFirst({ where: { id, companyId } });
    if (!meeting) throw new NotFoundException("Reunión no encontrada");
    return meeting;
  }

  async create(companyId: string, userId: string, data: any) {
    const meeting = await this.prisma.meeting.create({
      data: {
        ...data,
        companyId,
        createdById: userId,
        date: new Date(data.date),
        endDate: data.endDate ? new Date(data.endDate) : null,
        participants: data.participants ?? [],
        sharedWith: data.sharedWith ?? [],
      },
    });

    const emailParticipants: string[] = (meeting.participants as string[]).filter((p) => EMAIL_RE.test(p));
    if (emailParticipants.length > 0) {
      try {
        const dateStr = new Date(meeting.date).toLocaleDateString("es-ES", {
          weekday: "long", day: "numeric", month: "long", year: "numeric",
        });
        const html = this.buildInviteHtml(meeting.title, dateStr, meeting.location as string | null, meeting.agenda as string | null);
        await Promise.all(emailParticipants.map((to) => this.email.sendGeneric(to, `Invitación: ${meeting.title}`, html)));
      } catch (err) {
        console.error("[MEETINGS] Error sending invitation emails:", err);
      }
    }

    return meeting;
  }

  private buildInviteHtml(title: string, date: string, location: string | null, agenda: string | null): string {
    return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:0;background:#f8fafc;">
      <div style="background:linear-gradient(135deg,#040c0a 0%,#061410 60%,#080f0c 100%);padding:36px 32px 28px;text-align:center;">
        <h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:0 0 6px;">Convocatoria de reunión</h1>
        <p style="color:#94a3b8;font-size:14px;margin:0;">Has sido invitado/a a participar</p>
      </div>
      <div style="padding:32px;">
        <div style="background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;padding:28px;margin-bottom:20px;">
          <h2 style="color:#111827;font-size:18px;font-weight:700;margin:0 0 20px;">${title}</h2>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr>
              <td style="color:#6b7280;padding:8px 0;width:110px;vertical-align:top;">Fecha</td>
              <td style="color:#111827;padding:8px 0;font-weight:500;">${date}</td>
            </tr>
            ${location ? `<tr><td style="color:#6b7280;padding:8px 0;vertical-align:top;">Lugar</td><td style="color:#111827;padding:8px 0;">${location}</td></tr>` : ""}
            ${agenda ? `<tr><td style="color:#6b7280;padding:8px 0;vertical-align:top;">Orden del día</td><td style="color:#111827;padding:8px 0;white-space:pre-line;">${agenda}</td></tr>` : ""}
          </table>
        </div>
        <p style="font-size:12px;color:#9ca3af;text-align:center;margin:0;">
          Enviado desde <a href="https://youwhole.com" style="color:#0d9488;text-decoration:none;">YouWhole</a> · El ERP para pymes y autónomos
        </p>
      </div>
    </div>`;
  }

  async update(companyId: string, id: string, data: any) {
    const meeting = await this.prisma.meeting.findFirst({ where: { id, companyId } });
    if (!meeting) throw new NotFoundException("Reunión no encontrada");

    return this.prisma.meeting.update({
      where: { id },
      data: {
        ...data,
        date: data.date ? new Date(data.date) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : data.endDate === null ? null : undefined,
      },
    });
  }

  async remove(companyId: string, id: string) {
    const meeting = await this.prisma.meeting.findFirst({ where: { id, companyId } });
    if (!meeting) throw new NotFoundException("Reunión no encontrada");
    await this.prisma.meeting.delete({ where: { id } });
    return { ok: true };
  }
}
