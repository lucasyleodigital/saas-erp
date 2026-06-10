import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async findOne(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: {
        users: { include: { user: { select: { id: true, email: true, firstName: true, lastName: true, avatar: true } } } },
      },
    });
    if (!company) throw new NotFoundException("Empresa no encontrada");
    return company;
  }

  async update(companyId: string, data: any) {
    return this.prisma.company.update({ where: { id: companyId }, data });
  }
}
