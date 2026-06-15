import { IsString, IsOptional, IsEnum, IsBoolean, IsObject, MaxLength } from "class-validator";

export enum AutomationTrigger {
  INVOICE_CREATED = "INVOICE_CREATED", INVOICE_PAID = "INVOICE_PAID", INVOICE_OVERDUE = "INVOICE_OVERDUE",
  QUOTE_ACCEPTED = "QUOTE_ACCEPTED", QUOTE_CREATED = "QUOTE_CREATED", LEAD_CREATED = "LEAD_CREATED",
  DEAL_STAGE_CHANGED = "DEAL_STAGE_CHANGED", PAYMENT_RECEIVED = "PAYMENT_RECEIVED",
  CLIENT_CREATED = "CLIENT_CREATED", ORDER_CREATED = "ORDER_CREATED",
}

export enum AutomationActionType {
  SEND_EMAIL = "SEND_EMAIL", CREATE_NOTIFICATION = "CREATE_NOTIFICATION",
  SEND_WEBHOOK = "SEND_WEBHOOK", UPDATE_DEAL_STAGE = "UPDATE_DEAL_STAGE",
}

export class CreateAutomationDto {
  @IsString() @MaxLength(200) name: string;
  @IsOptional() @IsString() @MaxLength(1000) description?: string;
  @IsEnum(AutomationTrigger) trigger: AutomationTrigger;
  @IsOptional() @IsObject() conditions?: Record<string, unknown>;
  @IsEnum(AutomationActionType) action: AutomationActionType;
  @IsObject() actionConfig: Record<string, unknown>;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
