import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import helmet from "helmet";
import * as cookieParser from "cookie-parser";
import * as compression from "compression";
import { AppModule } from "./app.module";
import { DecimalInterceptor } from "./decimal.interceptor";
import { SanitizePipe } from "./common/pipes/sanitize.pipe";
import { TenantInterceptor } from "./database/tenant.interceptor";
import { PrismaService } from "./database/prisma.service";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ["error", "warn", "log"],
    rawBody: true, // Required for Stripe webhook signature verification
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>("PORT", 3001);
  const clientUrl = configService.get<string>("CLIENT_URL", "http://localhost:3000");

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    })
  );
  app.use(cookieParser());
  app.use(compression());

  // CORS - accept www and non-www variants
  const corsOrigins = [clientUrl];
  if (clientUrl.includes("youwhole.com")) {
    corsOrigins.push("https://www.youwhole.com");
    corsOrigins.push("https://youwhole.com");
    corsOrigins.push("https://saas-erp-pi.vercel.app");
  }
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  // Validation + sanitization
  app.useGlobalPipes(
    new SanitizePipe(),
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    })
  );

  // Interceptors: tenant isolation (RLS) + Decimal conversion
  const prisma = app.get(PrismaService);
  app.useGlobalInterceptors(
    new TenantInterceptor(prisma),
    new DecimalInterceptor(),
  );

  // API prefix
  app.setGlobalPrefix("api/v1");

  // Swagger
  if (process.env.NODE_ENV !== "production") {
    const config = new DocumentBuilder()
      .setTitle("YouWhole API")
      .setDescription("API de gestión empresarial")
      .setVersion("1.0")
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("docs", app, document);
  }

  // Health check (used by Railway / load balancers)
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get("/health", (_req: any, res: any) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });

  await app.listen(port);
  console.log(`🚀 API running on http://localhost:${port}/api/v1`);
  console.log(`📚 Docs available at http://localhost:${port}/docs`);
}

bootstrap();
