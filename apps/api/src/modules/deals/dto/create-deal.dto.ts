import { IsString, IsOptional, IsEnum, IsNumber, IsDateString, MaxLength, Min } from "class-validator";
import { Type } from "class-transformer";

export enum DealStage {
  LEAD = "LEAD", QUALIFIED = "QUALIFIED", PROPOSAL = "PROPOSAL",
  NEGOTIATION = "NEGOTIATION", CLOSED_WON = "CLOSED_WON", CLOSED_LOST = "CLOSED_LOST",
}

export class CreateDealDto {
  @IsString() @MaxLength(300) title: string;
  @IsOptional() @IsString() stageId?: string;
  @IsOptional() @IsString() clientId?: string;
  @IsOptional() @IsString() leadId?: string;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) value?: number;
  @IsOptional() @IsString() @MaxLength(3) currency?: string;
  @IsOptional() @IsEnum(DealStage) stage?: DealStage;
  @IsOptional() @IsDateString() closeDate?: string;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}
