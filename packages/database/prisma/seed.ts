import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed...");

  // Admin user
  const passwordHash = await bcrypt.hash("Admin1234!", 12);

  const user = await prisma.user.upsert({
    where: { email: "admin@tusaas.es" },
    update: {},
    create: {
      email: "admin@tusaas.es",
      password: passwordHash,
      firstName: "Lucas",
      lastName: "Admin",
      emailVerified: true,
    },
  });

  // Company
  const company = await prisma.company.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Mi empresa SL",
      legalName: "Mi Empresa Sociedad Limitada",
      cif: "B12345678",
      email: "contacto@miempresa.es",
      phone: "93 123 45 67",
      address: "Calle Mayor 1",
      city: "Barcelona",
      province: "Barcelona",
      postalCode: "08001",
      country: "ES",
    },
  });

  // Link user to company
  await prisma.userCompany.upsert({
    where: { userId_companyId: { userId: user.id, companyId: company.id } },
    update: {},
    create: {
      userId: user.id,
      companyId: company.id,
      role: "OWNER",
      isDefault: true,
    },
  });

  // Taxes
  const iva21 = await prisma.tax.upsert({
    where: { id: "iva-21" },
    update: {},
    create: {
      id: "iva-21",
      companyId: company.id,
      name: "IVA 21%",
      rate: 21,
      isDefault: true,
    },
  });

  await prisma.tax.upsert({
    where: { id: "iva-10" },
    update: {},
    create: {
      id: "iva-10",
      companyId: company.id,
      name: "IVA 10%",
      rate: 10,
    },
  });

  await prisma.tax.upsert({
    where: { id: "iva-4" },
    update: {},
    create: {
      id: "iva-4",
      companyId: company.id,
      name: "IVA 4%",
      rate: 4,
    },
  });

  await prisma.tax.upsert({
    where: { id: "iva-0" },
    update: {},
    create: {
      id: "iva-0",
      companyId: company.id,
      name: "Exento",
      rate: 0,
    },
  });

  // Invoice series
  const series = await prisma.invoiceSeries.upsert({
    where: { companyId_prefix: { companyId: company.id, prefix: "F-2024-" } },
    update: {},
    create: {
      companyId: company.id,
      name: "Facturas 2024",
      prefix: "F-2024-",
      nextNumber: 1,
      isDefault: true,
    },
  });

  // Products
  const products = [
    { name: "Consultoría estratégica", type: "SERVICE", price: 150.0, description: "Hora de consultoría estratégica" },
    { name: "Desarrollo web", type: "SERVICE", price: 80.0, description: "Hora de desarrollo web frontend/backend" },
    { name: "Diseño gráfico", type: "SERVICE", price: 65.0, description: "Hora de diseño gráfico" },
    { name: "Pack SEO mensual", type: "SERVICE", price: 450.0, description: "Gestión SEO mensual" },
    { name: "Mantenimiento web", type: "SERVICE", price: 120.0, description: "Mantenimiento mensual web" },
    { name: "Licencia software", type: "DIGITAL", price: 29.0, description: "Licencia mensual software" },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { id: `prod-${p.name.toLowerCase().replace(/\s+/g, "-")}` },
      update: {},
      create: {
        id: `prod-${p.name.toLowerCase().replace(/\s+/g, "-")}`,
        companyId: company.id,
        taxId: iva21.id,
        ...p,
        price: p.price,
        type: p.type as any,
      },
    });
  }

  // Clients
  const clientsData = [
    {
      id: "client-1",
      name: "Acme Corp SL",
      cifNif: "B12345001",
      email: "info@acme.es",
      phone: "93 111 22 33",
      city: "Barcelona",
      province: "Barcelona",
    },
    {
      id: "client-2",
      name: "Tech Solutions SA",
      cifNif: "A87654321",
      email: "admin@techsolutions.es",
      phone: "91 222 33 44",
      city: "Madrid",
      province: "Madrid",
    },
    {
      id: "client-3",
      name: "Moda Barcelona SL",
      cifNif: "B11223344",
      email: "contacto@modabcn.es",
      city: "Barcelona",
      province: "Barcelona",
    },
    {
      id: "client-4",
      name: "Consultoria Manel",
      cifNif: "47123456A",
      email: "manel@consultoria.es",
      phone: "972 111 234",
      city: "Girona",
      province: "Girona",
    },
    {
      id: "client-5",
      name: "Restaurante Can Pep",
      cifNif: "B55443322",
      email: "canpep@restaurant.es",
      city: "Palma",
      province: "Baleares",
    },
  ];

  for (const c of clientsData) {
    await prisma.client.upsert({
      where: { id: c.id },
      update: {},
      create: { companyId: company.id, ...c },
    });
  }

  // Pipeline
  const pipeline = await prisma.pipeline.upsert({
    where: { id: "pipeline-1" },
    update: {},
    create: {
      id: "pipeline-1",
      companyId: company.id,
      name: "Pipeline de ventas",
      isDefault: true,
    },
  });

  const stagesData = [
    { id: "stage-1", name: "Lead", order: 1, color: "#3b82f6" },
    { id: "stage-2", name: "Cualificado", order: 2, color: "#6366f1" },
    { id: "stage-3", name: "Propuesta", order: 3, color: "#8b5cf6" },
    { id: "stage-4", name: "Negociación", order: 4, color: "#a855f7" },
    { id: "stage-5", name: "Cerrado ganado", order: 5, color: "#10b981" },
    { id: "stage-6", name: "Cerrado perdido", order: 6, color: "#94a3b8" },
  ];

  for (const s of stagesData) {
    await prisma.pipelineStage.upsert({
      where: { id: s.id },
      update: {},
      create: { pipelineId: pipeline.id, ...s },
    });
  }

  // Sample deals
  const deals = [
    { title: "Rediseño web corporativa", clientId: "client-1", stageId: "stage-3", value: 4500, stage: "PROPOSAL" },
    { title: "Consultoría transformación digital", clientId: "client-2", stageId: "stage-2", value: 12000, stage: "QUALIFIED" },
    { title: "Pack marketing digital 6 meses", clientId: "client-3", stageId: "stage-4", value: 2700, stage: "NEGOTIATION" },
    { title: "App móvil catálogo", clientId: "client-1", stageId: "stage-1", value: 8000, stage: "LEAD" },
    { title: "Mantenimiento mensual", clientId: "client-5", stageId: "stage-3", value: 1440, stage: "PROPOSAL" },
  ];

  for (let i = 0; i < deals.length; i++) {
    await prisma.deal.upsert({
      where: { id: `deal-${i + 1}` },
      update: {},
      create: {
        id: `deal-${i + 1}`,
        companyId: company.id,
        title: deals[i]!.title,
        clientId: deals[i]!.clientId,
        stageId: deals[i]!.stageId,
        value: deals[i]!.value,
        stage: deals[i]!.stage as any,
      },
    });
  }

  console.log("✅ Seed completado");
  console.log("📧 Email:    admin@tusaas.es");
  console.log("🔑 Password: Admin1234!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
