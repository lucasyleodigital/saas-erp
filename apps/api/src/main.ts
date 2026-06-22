import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import helmet from "helmet";
import * as cookieParser from "cookie-parser";
import * as compression from "compression";
import { AppModule } from "./app.module";
import { DecimalInterceptor } from "./decimal.interceptor";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ["error", "warn", "log"],
    rawBody: true, // Required for Stripe webhook signature verification
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>("PORT", 3001);
  const clientUrl = configService.get<string>("CLIENT_URL", "http://localhost:3000");

  // Security
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cookieParser());
  app.use(compression());

  // CORS
  app.enableCors({
    origin: [clientUrl],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    })
  );

  // Serialization — DecimalInterceptor converts Prisma Decimal objects to JS numbers
  app.useGlobalInterceptors(new DecimalInterceptor());

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

  // Diagnostic endpoint — returns record counts per table (no sensitive data)
  httpAdapter.get("/api/v1/debug/counts", async (_req: any, res: any) => {
    try {
      const { PrismaService } = await import("./database/prisma.service");
      const prisma = app.get(PrismaService);
      const [clients, clientsActive, invoices, products, productsActive, suppliers] = await Promise.all([
        prisma.client.count(),
        prisma.client.count({ where: { isActive: true } }),
        prisma.invoice.count(),
        prisma.product.count(),
        prisma.product.count({ where: { isActive: true } }),
        prisma.supplier.count(),
      ]);
      res.json({
        status: "ok",
        counts: { clients, clientsActive, invoices, products, productsActive, suppliers },
        version: "438cbba+debug2",
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Debug: test clients query directly (temporary — remove after fixing)
  httpAdapter.get("/api/v1/debug/test-clients", async (_req: any, res: any) => {
    try {
      const { PrismaService } = await import("./database/prisma.service");
      const prisma = app.get(PrismaService);
      // Find first company with clients
      const firstClient = await prisma.client.findFirst({ select: { companyId: true } });
      if (!firstClient) return res.json({ error: "No clients in DB" });

      const companyId = firstClient.companyId;

      // Reproduce the exact query from clients.service.ts
      const data = await prisma.client.findMany({
        where: { companyId, isActive: true },
        skip: 0,
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { invoices: true } } },
      });

      // Test serialization
      const serialized = JSON.parse(JSON.stringify(data, (_key, val) =>
        typeof val === "bigint" ? val.toString() : val
      ));

      res.json({
        status: "ok",
        companyId,
        count: data.length,
        firstClient: serialized[0] ? {
          name: serialized[0].name,
          totalBilled: serialized[0].totalBilled,
          totalBilledType: typeof serialized[0].totalBilled,
          pendingBalance: serialized[0].pendingBalance,
          _count: serialized[0]._count,
        } : null,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message, stack: e.stack?.split("\n").slice(0, 5) });
    }
  });

  await app.listen(port);
  console.log(`🚀 API running on http://localhost:${port}/api/v1`);
  console.log(`📚 Docs available at http://localhost:${port}/docs`);
}

bootstrap();
