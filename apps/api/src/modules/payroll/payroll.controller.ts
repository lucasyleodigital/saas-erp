import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards, Req, Res, HttpCode,
} from "@nestjs/common";
import { Response } from "express";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PayrollService } from "./payroll.service";
import { ForbiddenException } from "@nestjs/common";

function requireAdminOrOwner(role: string) {
  if (role !== "OWNER" && role !== "ADMIN" && role !== "ACCOUNTANT") {
    throw new ForbiddenException("Se requiere rol de Administrador o Contable");
  }
}

@Controller("payrolls")
@UseGuards(JwtAuthGuard)
export class PayrollController {
  constructor(private readonly service: PayrollService) {}

  // ── Static routes BEFORE /:id ────────────────────────────────

  @Get("stats")
  getStats(
    @Req() req: any,
    @Query("year") year: string,
    @Query("month") month: string,
  ) {
    requireAdminOrOwner(req.user.role);
    return this.service.getStats(
      req.user.companyId,
      parseInt(year ?? String(new Date().getFullYear())),
      parseInt(month ?? String(new Date().getMonth() + 1)),
    );
  }

  @Get("modelo-111")
  getModelo111(
    @Req() req: any,
    @Query("year") year: string,
    @Query("quarter") quarter: string,
  ) {
    requireAdminOrOwner(req.user.role);
    const q = parseInt(quarter ?? "1");
    const y = parseInt(year ?? String(new Date().getFullYear()));
    return this.service.getModelo111(req.user.companyId, y, q);
  }

  @Get("modelo-190")
  getModelo190(
    @Req() req: any,
    @Query("year") year: string,
  ) {
    requireAdminOrOwner(req.user.role);
    return this.service.getModelo190(req.user.companyId, parseInt(year ?? String(new Date().getFullYear())));
  }

  @Get("sepa")
  async downloadSepa(
    @Req() req: any,
    @Res() res: Response,
    @Query("year") year: string,
    @Query("month") month: string,
    @Query("paymentDate") paymentDate?: string,
  ) {
    requireAdminOrOwner(req.user.role);
    const y = parseInt(year ?? String(new Date().getFullYear()));
    const m = parseInt(month ?? String(new Date().getMonth() + 1));
    const xml = await this.service.generateSepaXml(req.user.companyId, y, m, paymentDate);
    const filename = `sepa-nominas-${y}-${String(m).padStart(2, "0")}.xml`;
    res.setHeader("Content-Type", "application/xml");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(xml);
  }

  // ── CRUD ────────────────────────────────────────────────────

  @Get()
  findAll(
    @Req() req: any,
    @Query("year") year: string,
    @Query("month") month: string,
  ) {
    requireAdminOrOwner(req.user.role);
    return this.service.findAll(
      req.user.companyId,
      parseInt(year ?? String(new Date().getFullYear())),
      parseInt(month ?? String(new Date().getMonth() + 1)),
    );
  }

  @Post("generate")
  @HttpCode(201)
  generate(
    @Req() req: any,
    @Body() dto: { year?: number; month?: number },
  ) {
    requireAdminOrOwner(req.user.role);
    const now = new Date();
    return this.service.generateMonthlyPayrolls(
      req.user.companyId,
      dto.year ?? now.getFullYear(),
      dto.month ?? now.getMonth() + 1,
    );
  }

  @Get(":id")
  findOne(@Req() req: any, @Param("id") id: string) {
    requireAdminOrOwner(req.user.role);
    return this.service.findOne(req.user.companyId, id);
  }

  @Patch(":id")
  update(
    @Req() req: any,
    @Param("id") id: string,
    @Body() dto: {
      overtimePay?: number;
      bonuses?: number;
      otherDeductions?: number;
      irpfRate?: number;
      notes?: string;
    },
  ) {
    requireAdminOrOwner(req.user.role);
    return this.service.update(req.user.companyId, id, dto);
  }

  @Post(":id/approve")
  @HttpCode(200)
  approve(@Req() req: any, @Param("id") id: string) {
    requireAdminOrOwner(req.user.role);
    return this.service.approve(req.user.companyId, id);
  }

  @Post(":id/pay")
  @HttpCode(200)
  markPaid(
    @Req() req: any,
    @Param("id") id: string,
    @Body() dto: { paymentDate?: string },
  ) {
    requireAdminOrOwner(req.user.role);
    return this.service.markPaid(req.user.companyId, id, dto.paymentDate);
  }

  @Delete(":id")
  @HttpCode(204)
  remove(@Req() req: any, @Param("id") id: string) {
    requireAdminOrOwner(req.user.role);
    return this.service.remove(req.user.companyId, id);
  }
}
