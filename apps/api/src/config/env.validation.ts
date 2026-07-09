import { plainToInstance } from "class-transformer";
import { IsString, IsNumber, IsOptional, validateSync, Min } from "class-validator";

class EnvironmentVariables {
  @IsString()
  DATABASE_URL!: string;

  @IsString()
  JWT_SECRET!: string;

  @IsString()
  JWT_REFRESH_SECRET!: string;

  @IsNumber()
  @IsOptional()
  PORT?: number = 3001;

  @IsString()
  @IsOptional()
  CLIENT_URL?: string = "http://localhost:3000";

  @IsString()
  @IsOptional()
  GOOGLE_CLIENT_ID?: string;

  @IsString()
  @IsOptional()
  GOOGLE_CLIENT_SECRET?: string;

  @IsString()
  @IsOptional()
  RESEND_API_KEY?: string;

  @IsString()
  @IsOptional()
  STRIPE_SECRET_KEY?: string;

  @IsString()
  @IsOptional()
  STRIPE_WEBHOOK_SECRET?: string;

  @IsString()
  @IsOptional()
  STRIPE_PRICE_STARTER?: string;

  @IsString()
  @IsOptional()
  STRIPE_PRICE_PRO?: string;

  @IsString()
  @IsOptional()
  STRIPE_PRICE_ENTERPRISE?: string;

  @IsString()
  @IsOptional()
  REDIS_URL?: string;

  @IsString()
  @IsOptional()
  CERT_ENCRYPTION_KEY?: string;

  @IsString()
  @IsOptional()
  PLATFORM_ADMIN_EMAILS?: string;

  @IsString()
  @IsOptional()
  AEAT_ENV?: string = "test";
}

export function validateEnv(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validated;
}
