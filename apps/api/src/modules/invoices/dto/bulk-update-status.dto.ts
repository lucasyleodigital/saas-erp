import { IsArray, IsString, IsIn, ArrayMinSize, ArrayMaxSize } from "class-validator";

const INVOICE_STATUSES = ["DRAFT", "SENT", "PAID", "PARTIAL", "OVERDUE", "CANCELLED"] as const;

export class BulkUpdateStatusDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @IsString({ each: true })
  ids!: string[];

  @IsIn(INVOICE_STATUSES)
  status!: (typeof INVOICE_STATUSES)[number];
}
