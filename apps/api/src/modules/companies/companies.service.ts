import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { EmailService } from "../email/email.service";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class CompaniesService {
  constructor(
    private prisma: PrismaService,
    private email: EmailService,
    private config: ConfigService,
  ) {}

  async findOne(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatar: true,
                lastLoginAt: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });
    if (!company) throw new NotFoundException("Empresa no encontrada");
    return company;
  }

  async update(companyId: string, data: any) {
    return this.prisma.company.update({ where: { id: companyId }, data });
  }

  // ─── TEAM / MEMBERS ───────────────────────────────────────────────

  async getMembers(companyId: string) {
    const [members, invitations] = await Promise.all([
      this.prisma.userCompany.findMany({
        where: { companyId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatar: true,
              lastLoginAt: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      }),
      this.prisma.invitation.findMany({
        where: { companyId, acceptedAt: null, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return { members, invitations };
  }

  async inviteMember(
    companyId: string,
    invitedByUserId: string,
    email: string,
    role: string,
  ) {
    // Check plan limit
    const memberCount = await this.prisma.userCompany.count({ where: { companyId } });
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new NotFoundException("Empresa no encontrada");

    // Check if user is already a member
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const alreadyMember = await this.prisma.userCompany.findFirst({
        where: { userId: existingUser.id, companyId },
      });
      if (alreadyMember) throw new ConflictException("Este usuario ya es miembro de la empresa");
    }

    // Check for pending invitation
    const existingInvite = await this.prisma.invitation.findFirst({
      where: { companyId, email, acceptedAt: null, expiresAt: { gt: new Date() } },
    });
    if (existingInvite) throw new ConflictException("Ya existe una invitación pendiente para este email");

    // Get inviter info
    const inviter = await this.prisma.user.findUnique({
      where: { id: invitedByUserId },
      select: { firstName: true, lastName: true },
    });

    const invitation = await this.prisma.invitation.create({
      data: {
        companyId,
        email,
        role: role as any,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    const clientUrl = this.config.get("CLIENT_URL", "http://localhost:3000");
    const inviteUrl = `${clientUrl}/invite/${invitation.token}`;
    const inviterName = inviter ? `${inviter.firstName} ${inviter.lastName}` : "Un miembro del equipo";

    // Send email (fire-and-forget — doesn't block if Resend not configured)
    this.email.sendInvitation(email, inviterName, company.name, role, inviteUrl).catch(() => {
      console.log(`📧 [INVITE] ${email} → ${inviteUrl}`);
    });

    return { invitation, inviteUrl };
  }

  async cancelInvitation(companyId: string, invitationId: string) {
    const invitation = await this.prisma.invitation.findFirst({
      where: { id: invitationId, companyId },
    });
    if (!invitation) throw new NotFoundException("Invitación no encontrada");
    await this.prisma.invitation.delete({ where: { id: invitationId } });
    return { message: "Invitación cancelada" };
  }

  async updateMemberRole(companyId: string, membershipId: string, role: string, requestorRole: string) {
    const membership = await this.prisma.userCompany.findFirst({
      where: { id: membershipId, companyId },
    });
    if (!membership) throw new NotFoundException("Miembro no encontrado");
    if (membership.role === "OWNER") throw new ForbiddenException("No se puede cambiar el rol del propietario");

    // Only OWNER can promote to ADMIN
    if (role === "ADMIN" && requestorRole !== "OWNER") {
      throw new ForbiddenException("Solo el propietario puede asignar el rol de Administrador");
    }

    return this.prisma.userCompany.update({
      where: { id: membershipId },
      data: { role: role as any },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async removeMember(companyId: string, membershipId: string) {
    const membership = await this.prisma.userCompany.findFirst({
      where: { id: membershipId, companyId },
    });
    if (!membership) throw new NotFoundException("Miembro no encontrado");
    if (membership.role === "OWNER") throw new ForbiddenException("No se puede eliminar al propietario");

    await this.prisma.userCompany.delete({ where: { id: membershipId } });
    return { message: "Miembro eliminado" };
  }

  // ─── INVITE ACCEPTANCE (called from AuthService) ──────────────────

  async getInvitation(token: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
      include: { company: { select: { id: true, name: true, logo: true } } },
    });
    if (!invitation) throw new NotFoundException("Invitación no encontrada o expirada");
    if (invitation.acceptedAt) throw new BadRequestException("Esta invitación ya fue utilizada");
    if (invitation.expiresAt < new Date()) throw new BadRequestException("Esta invitación ha caducado");
    return invitation;
  }

  async acceptInvitation(token: string, userId: string) {
    const invitation = await this.getInvitation(token);

    // Check if already a member
    const existing = await this.prisma.userCompany.findFirst({
      where: { userId, companyId: invitation.companyId },
    });
    if (existing) throw new ConflictException("Ya eres miembro de esta empresa");

    await this.prisma.$transaction([
      this.prisma.userCompany.create({
        data: {
          userId,
          companyId: invitation.companyId,
          role: invitation.role,
          isDefault: false,
        },
      }),
      this.prisma.invitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      }),
    ]);

    return { companyId: invitation.companyId, role: invitation.role };
  }
}
