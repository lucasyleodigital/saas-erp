import { IsBoolean, IsOptional, IsIn } from "class-validator";

const RECURRING_INTERVALS = ["WEEKLY", "BIWEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"] as const;

export class SetRecurringDto {
  @IsBoolean()
  isRecurring!: boolean;

  @IsOptional()
  @IsIn(RECURRING_INTERVALS)
  interval?: (typeof RECURRING_INTERVALS)[number];
}
