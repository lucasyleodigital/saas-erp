import { IsString, IsOptional, IsEnum, IsDateString, IsArray, ValidateNested, IsNumber, MaxLength } from "class-validator";
import { Type } from "class-transformer";

export enum JournalEntryType { INVOICE = "INVOICE", PAYMENT = "PAYMENT", REFUND = "REFUND", ADJUSTMENT = "ADJUSTMENT", MANUAL = "MANUAL" }

export class JournalItemDto {
  @IsString() accountId: string;
  @IsNumber() @Type(() => Number) debit: number;
  @IsNumber() @Type(() => Number) credit: number;
  @IsOptional() @IsString() description?: string;
}

export class CreateJournalEntryDto {
  @IsEnum(JournalEntryType) type: JournalEntryType;
  @IsOptional() @IsString() @MaxLength(100) reference?: string;
  @IsString() @MaxLength(500) description: string;
  @IsDateString() entryDate: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => JournalItemDto) items: JournalItemDto[];
}
