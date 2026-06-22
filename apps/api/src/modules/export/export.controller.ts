import { Controller, Get, Param, Res, UseGuards, BadRequestException } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { Response } from "express";
import { ExportService } from "./export.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "@saas/types";

const FILE_NAMES: Record<string, string> = {
  clients:   "clientes.xlsx",
  products:  "productos.xlsx",
  invoices:  "facturas.xlsx",
  suppliers: "proveedores.xlsx",
};

@ApiTags("Export")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("export")
export class ExportController {
  constructor(private exportService: ExportService) {}

  @Get(":entity")
  async exportEntity(
    @CurrentUser() u: JwtPayload,
    @Param("entity") entity: string,
    @Res() res: Response,
  ) {
    if (!FILE_NAMES[entity]) {
      throw new BadRequestException("Entidad no valida. Usa: clients, products, invoices, suppliers");
    }

    const methods: Record<string, () => Promise<Buffer>> = {
      clients:   () => this.exportService.exportClients(u.companyId),
      products:  () => this.exportService.exportProducts(u.companyId),
      invoices:  () => this.exportService.exportInvoices(u.companyId),
      suppliers: () => this.exportService.exportSuppliers(u.companyId),
    };

    const buffer = await methods[entity]!();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${FILE_NAMES[entity]}"`);
    res.send(buffer);
  }
}
