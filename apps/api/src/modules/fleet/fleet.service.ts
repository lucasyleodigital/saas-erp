import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class FleetService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string, params: any) {
    const { search, activeOnly } = params;
    const where: any = {
      companyId,
      ...(activeOnly === "true" && { isActive: true }),
      ...(search && {
        OR: [
          { matricula: { contains: search, mode: "insensitive" } },
          { marca: { contains: search, mode: "insensitive" } },
          { modelo: { contains: search, mode: "insensitive" } },
          { transportistaNombre: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const vehicles = await this.prisma.vehicle.findMany({
      where,
      include: {
        _count: { select: { maintenances: true } },
        maintenances: {
          orderBy: { fecha: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return vehicles;
  }

  async findOne(companyId: string, id: string) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id, companyId },
      include: {
        maintenances: { orderBy: { fecha: "desc" } },
      },
    });
    if (!vehicle) throw new NotFoundException("Vehículo no encontrado");
    return vehicle;
  }

  async create(companyId: string, dto: any) {
    const exists = await this.prisma.vehicle.findFirst({
      where: { companyId, matricula: dto.matricula },
    });
    if (exists) throw new BadRequestException("Ya existe un vehículo con esa matrícula");

    return this.prisma.vehicle.create({
      data: {
        companyId,
        matricula: dto.matricula,
        marca: dto.marca ?? undefined,
        modelo: dto.modelo ?? undefined,
        anio: dto.anio ? Number(dto.anio) : undefined,
        transportistaNombre: dto.transportistaNombre ?? undefined,
        transportistaNif: dto.transportistaNif ?? undefined,
        itvDate: dto.itvDate ? new Date(dto.itvDate) : undefined,
        seguroDate: dto.seguroDate ? new Date(dto.seguroDate) : undefined,
        notas: dto.notas ?? undefined,
        isActive: dto.isActive !== false,
      },
    });
  }

  async update(companyId: string, id: string, dto: any) {
    await this.findOne(companyId, id);

    if (dto.matricula) {
      const dup = await this.prisma.vehicle.findFirst({
        where: { companyId, matricula: dto.matricula, NOT: { id } },
      });
      if (dup) throw new BadRequestException("Ya existe un vehículo con esa matrícula");
    }

    return this.prisma.vehicle.update({
      where: { id },
      data: {
        ...(dto.matricula !== undefined && { matricula: dto.matricula }),
        ...(dto.marca !== undefined && { marca: dto.marca }),
        ...(dto.modelo !== undefined && { modelo: dto.modelo }),
        ...(dto.anio !== undefined && { anio: dto.anio ? Number(dto.anio) : null }),
        ...(dto.transportistaNombre !== undefined && { transportistaNombre: dto.transportistaNombre }),
        ...(dto.transportistaNif !== undefined && { transportistaNif: dto.transportistaNif }),
        ...(dto.itvDate !== undefined && { itvDate: dto.itvDate ? new Date(dto.itvDate) : null }),
        ...(dto.seguroDate !== undefined && { seguroDate: dto.seguroDate ? new Date(dto.seguroDate) : null }),
        ...(dto.notas !== undefined && { notas: dto.notas }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async remove(companyId: string, id: string) {
    await this.findOne(companyId, id);
    return this.prisma.vehicle.delete({ where: { id } });
  }

  async createMaintenance(companyId: string, vehicleId: string, dto: any) {
    await this.findOne(companyId, vehicleId);
    return this.prisma.vehicleMaintenance.create({
      data: {
        vehicleId,
        companyId,
        tipo: dto.tipo ?? "REVISION",
        descripcion: dto.descripcion ?? undefined,
        fecha: new Date(dto.fecha),
        km: dto.km ? Number(dto.km) : undefined,
        coste: dto.coste !== undefined && dto.coste !== "" ? Number(dto.coste) : undefined,
        proveedor: dto.proveedor ?? undefined,
        proximaRevision: dto.proximaRevision ? new Date(dto.proximaRevision) : undefined,
      },
    });
  }

  async updateMaintenance(companyId: string, maintenanceId: string, dto: any) {
    const m = await this.prisma.vehicleMaintenance.findFirst({
      where: { id: maintenanceId, companyId },
    });
    if (!m) throw new NotFoundException("Mantenimiento no encontrado");

    return this.prisma.vehicleMaintenance.update({
      where: { id: maintenanceId },
      data: {
        ...(dto.tipo !== undefined && { tipo: dto.tipo }),
        ...(dto.descripcion !== undefined && { descripcion: dto.descripcion }),
        ...(dto.fecha !== undefined && { fecha: new Date(dto.fecha) }),
        ...(dto.km !== undefined && { km: dto.km ? Number(dto.km) : null }),
        ...(dto.coste !== undefined && { coste: dto.coste !== "" ? Number(dto.coste) : null }),
        ...(dto.proveedor !== undefined && { proveedor: dto.proveedor }),
        ...(dto.proximaRevision !== undefined && {
          proximaRevision: dto.proximaRevision ? new Date(dto.proximaRevision) : null,
        }),
      },
    });
  }

  async removeMaintenance(companyId: string, maintenanceId: string) {
    const m = await this.prisma.vehicleMaintenance.findFirst({
      where: { id: maintenanceId, companyId },
    });
    if (!m) throw new NotFoundException("Mantenimiento no encontrado");
    return this.prisma.vehicleMaintenance.delete({ where: { id: maintenanceId } });
  }
}
