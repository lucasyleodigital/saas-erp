import { IsBoolean, IsDateString, IsNumber, IsOptional, IsString, Min, MinLength, MaxLength } from "class-validator";

export class CreateExpenseDto {
  @IsDateString()
  date!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  description!: string;

  // Proveedor existente; si no llega (escáner de documentos), se busca o crea con supplier/supplierNif
  @IsOptional()
  @IsString()
  @MinLength(1)
  supplierId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  supplier?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  supplierNif?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  invoiceRef?: string;

  @IsNumber()
  @Min(0)
  subtotal!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  vatRate?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;

  @IsOptional()
  @IsString()
  attachmentUrl?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  withholdingRate?: number;

  @IsOptional()
  @IsBoolean()
  isDeductible?: boolean;
}
