import { IsString, IsIn, IsDateString, IsOptional, MaxLength } from "class-validator";

const LEAVE_TYPES = ["VACATION", "SICK", "PERSONAL", "MATERNITY", "PATERNITY", "OTHER"] as const;

export class RequestLeaveDto {
  @IsIn(LEAVE_TYPES)
  type!: (typeof LEAVE_TYPES)[number];

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}
