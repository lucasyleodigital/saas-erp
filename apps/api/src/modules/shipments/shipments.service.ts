import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../database/prisma.service";

export interface CreateShipmentDto {
  referencia?: string;
  transportistaNombre: string;
  transportistaNif: string;
  origen: string;
  destino: string;
  naturalezaCarga: string;
  pesoKg: number;
  matricula: string;
  fechaRecogida?: string;
  horarioRecogida?: string;
  fechaEntrega?: string;
  horarioEntrega?: string;
  palets?: number;
  metrosLineales?: number;
}

@Injectable()
export class ShipmentsService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async create(companyId: string, dto: CreateShipmentDto) {
    const company = await this.prisma.company.findUniqueOrThrow({
      where: { id: companyId },
      select: { name: true, legalName: true, cif: true, vatNumber: true },
    });

    const cargadorNombre = company.legalName ?? company.name;
    const cargadorNif = company.cif ?? company.vatNumber ?? "";

    if (!cargadorNif) {
      throw new BadRequestException(
        "La empresa no tiene CIF configurado. Añádelo en Ajustes → Empresa antes de generar un DeCA.",
      );
    }

    const body: Record<string, any> = {
      cargadorNombre,
      cargadorNif,
      transportistaNombre: dto.transportistaNombre,
      transportistaNif: dto.transportistaNif,
      origen: dto.origen,
      destino: dto.destino,
      naturalezaCarga: dto.naturalezaCarga,
      pesoKg: dto.pesoKg,
      matricula: dto.matricula,
    };
    if (dto.referencia) body.referencia = dto.referencia.slice(0, 60);
    if (dto.fechaRecogida) body.fechaRecogida = dto.fechaRecogida;
    if (dto.horarioRecogida) body.horarioRecogida = dto.horarioRecogida;
    if (dto.fechaEntrega) body.fechaEntrega = dto.fechaEntrega;
    if (dto.horarioEntrega) body.horarioEntrega = dto.horarioEntrega;
    if (dto.palets != null) body.palets = dto.palets;
    if (dto.metrosLineales != null) body.metrosLineales = dto.metrosLineales;

    const apiKey = this.config.get<string>("DECAFLY_API_KEY");

    let decaflyId: string | undefined;
    let decaflyVerifyUrl: string | undefined;
    let decaflyPdfUrl: string | undefined;
    let decaflyHash: string | undefined;
    let decaflyEstado = "pendiente";

    if (apiKey) {
      const res = await fetch("https://porteo-pi.vercel.app/api/v1/documentos", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as any;
        const detail = err?.detalles ? JSON.stringify(err.detalles) : err?.error ?? res.statusText;
        throw new BadRequestException(`Error al generar el DeCA: ${detail}`);
      }

      const doc = await res.json() as {
        id: string;
        estado: string;
        verifyUrl: string;
        pdfUrl: string;
        hash: string;
      };

      decaflyId = doc.id;
      decaflyVerifyUrl = doc.verifyUrl;
      decaflyPdfUrl = doc.pdfUrl;
      decaflyHash = doc.hash;
      decaflyEstado = doc.estado;
    }

    return this.prisma.shipment.create({
      data: {
        companyId,
        referencia: dto.referencia,
        cargadorNombre,
        cargadorNif,
        transportistaNombre: dto.transportistaNombre,
        transportistaNif: dto.transportistaNif,
        origen: dto.origen,
        destino: dto.destino,
        naturalezaCarga: dto.naturalezaCarga,
        pesoKg: dto.pesoKg,
        matricula: dto.matricula,
        fechaRecogida: dto.fechaRecogida ? new Date(dto.fechaRecogida) : undefined,
        horarioRecogida: dto.horarioRecogida,
        fechaEntrega: dto.fechaEntrega ? new Date(dto.fechaEntrega) : undefined,
        horarioEntrega: dto.horarioEntrega,
        palets: dto.palets,
        metrosLineales: dto.metrosLineales,
        decaflyId,
        decaflyVerifyUrl,
        decaflyPdfUrl,
        decaflyHash,
        decaflyEstado,
      },
    });
  }

  async findAll(companyId: string, params: { limit?: string; offset?: string }) {
    const limit = Math.min(Number(params.limit ?? 50), 200);
    const offset = Number(params.offset ?? 0);

    const [data, total] = await Promise.all([
      this.prisma.shipment.findMany({
        where: { companyId },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      this.prisma.shipment.count({ where: { companyId } }),
    ]);

    return { data, total, limit, offset };
  }

  async findOne(companyId: string, id: string) {
    const shipment = await this.prisma.shipment.findFirst({
      where: { id, companyId },
    });
    if (!shipment) throw new NotFoundException("Envío no encontrado");
    return shipment;
  }

  async anular(companyId: string, id: string) {
    const shipment = await this.findOne(companyId, id);

    if (!shipment.decaflyId) {
      throw new BadRequestException("Este envío no tiene DeCA generado");
    }

    const apiKey = this.config.get<string>("DECAFLY_API_KEY");
    if (apiKey) {
      const res = await fetch(
        `https://porteo-pi.vercel.app/api/v1/documentos/${shipment.decaflyId}/anular`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}` },
        },
      );
      if (!res.ok && res.status !== 404) {
        throw new BadRequestException("Error al anular el DeCA en Decafly");
      }
    }

    return this.prisma.shipment.update({
      where: { id },
      data: { decaflyEstado: "anulado" },
    });
  }
}
