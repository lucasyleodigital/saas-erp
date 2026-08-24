import { IsString, IsIn, IsNumber, IsOptional, Min, Max } from "class-validator";
import { Type } from "class-transformer";

export class ClockByQrDto {
  @IsString()
  token!: string;

  @IsString()
  employeeId!: string;

  @IsIn(["in", "out"])
  action!: "in" | "out";

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
