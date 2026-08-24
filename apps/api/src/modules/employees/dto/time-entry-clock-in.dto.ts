import { IsString, IsNumber, IsOptional, Min, Max, MaxLength } from "class-validator";
import { Type } from "class-transformer";

export class TimeEntryClockInDto {
  @IsString()
  employeeId!: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  @Type(() => Number)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  @Type(() => Number)
  longitude?: number;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  method?: string;
}
