import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiTags, ApiBearerAuth, ApiConsumes } from "@nestjs/swagger";
import { Response } from "express";
import { ImportService } from "./import.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "@saas/types";

const ALLOWED_MIME = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
  "application/csv",
  "text/plain",
];

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

@ApiTags("Import")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("import")
export class ImportController {
  constructor(private importService: ImportService) {}

  @Get("template/:entity")
  downloadTemplate(
    @Param("entity") entity: string,
    @Res() res: Response,
  ) {
    const valid = ["clients", "products", "invoices"];
    if (!valid.includes(entity)) {
      throw new BadRequestException("Entidad no válida. Usa: clients, products, invoices");
    }

    const buffer = this.importService.generateTemplate(entity as any);
    const names: Record<string, string> = {
      clients:  "plantilla_clientes.xlsx",
      products: "plantilla_productos.xlsx",
      invoices: "plantilla_facturas.xlsx",
    };

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${names[entity]}"`);
    res.send(buffer);
  }

  @Post("clients")
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileInterceptor("file", {
    limits: { fileSize: MAX_SIZE },
    fileFilter: (_, file, cb) => {
      if (ALLOWED_MIME.includes(file.mimetype) || file.originalname.match(/\.(xlsx|csv|xls)$/i)) {
        cb(null, true);
      } else {
        cb(new BadRequestException("Solo se aceptan archivos .xlsx o .csv"), false);
      }
    },
  }))
  importClients(
    @CurrentUser() u: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException("No se ha adjuntado ningún archivo");
    return this.importService.importClients(u.companyId, file.buffer);
  }

  @Post("products")
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileInterceptor("file", {
    limits: { fileSize: MAX_SIZE },
    fileFilter: (_, file, cb) => {
      if (ALLOWED_MIME.includes(file.mimetype) || file.originalname.match(/\.(xlsx|csv|xls)$/i)) {
        cb(null, true);
      } else {
        cb(new BadRequestException("Solo se aceptan archivos .xlsx o .csv"), false);
      }
    },
  }))
  importProducts(
    @CurrentUser() u: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException("No se ha adjuntado ningún archivo");
    return this.importService.importProducts(u.companyId, file.buffer);
  }

  @Post("invoices")
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileInterceptor("file", {
    limits: { fileSize: MAX_SIZE },
    fileFilter: (_, file, cb) => {
      if (ALLOWED_MIME.includes(file.mimetype) || file.originalname.match(/\.(xlsx|csv|xls)$/i)) {
        cb(null, true);
      } else {
        cb(new BadRequestException("Solo se aceptan archivos .xlsx o .csv"), false);
      }
    },
  }))
  importInvoices(
    @CurrentUser() u: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException("No se ha adjuntado ningún archivo");
    return this.importService.importInvoices(u.companyId, file.buffer);
  }
}
