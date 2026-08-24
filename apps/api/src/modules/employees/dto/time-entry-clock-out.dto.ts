import { IsString, IsNumber, IsOptional, Min, Max } from "class-validator";
import { Type } from "class-transformer";

export class TimeEntryClockOutDto {
  @IsString()
  employeeId!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1440)
  @Type(() => Number)
  breakMinutes?: number;

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
}
