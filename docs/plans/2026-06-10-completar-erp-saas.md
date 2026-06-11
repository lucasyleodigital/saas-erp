# ERP SaaS — Plan de Completado Total

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Completar el ERP SaaS desde el estado actual (monorepo + backend NestJS + páginas base Next.js) hasta una aplicación vendible y funcional al 100%.

**Architecture:** Next.js 15 App Router (frontend) + NestJS (backend API) en monorepo Turborepo. Multi-tenant con companyId en cada request. Auth JWT con refresh token en cookie httpOnly. Stripe para suscripciones.

**Tech Stack:** Next.js 15, NestJS 10, Prisma 6, PostgreSQL (Supabase), Tailwind CSS, shadcn/ui, TanStack Query v5, Zustand, Stripe, Resend, Framer Motion, Recharts.

---

## Estado actual (ya construido)

✅ Monorepo Turborepo + pnpm workspaces  
✅ Prisma schema completo (30+ modelos multi-tenant)  
✅ NestJS: auth (JWT+refresh+2FA+Google), clients, invoices, products, deals, dashboard, verifactu  
✅ Next.js: dashboard, clientes, facturas, productos, pipeline, login  
✅ TanStack Query hooks: useClients, useInvoices, useProducts, useDeals, useDashboard  
✅ UI: Button, Card, Badge, Input, Dialog, DropdownMenu, Label, Select  
✅ Seed BD: usuario admin, empresa, impuestos, productos, clientes, pipeline  

---

## Módulos pendientes (por orden de prioridad)

### FASE A — Auth y protección de rutas (bloqueante)
### FASE B — Páginas de detalle (factura, cliente)
### FASE C — Módulos completos (leads, presupuestos, empresa, configuración)
### FASE D — Stripe + billing
### FASE E — Landing page pública
### FASE F — Email + notificaciones
### FASE G — VeriFactu en frontend

---

## FASE A — Auth y protección de rutas

### Task 1: Next.js Middleware (protección de rutas)

**Files:**
- Create: `apps/web/src/middleware.ts`
- Create: `apps/web/src/lib/auth.ts` (helpers de auth client-side)

- [ ] **Crear middleware.ts**

```typescript
// apps/web/src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/registro", "/recuperar-password", "/"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith("/api"));
  const token = request.cookies.get("access_token")?.value
    ?? request.headers.get("authorization")?.replace("Bearer ", "");
  // Para rutas del dashboard, verificar que hay token en localStorage no es posible en middleware
  // Usamos una cookie adicional "auth_session" que seteamos al login
  const session = request.cookies.get("auth_session")?.value;

  if (!isPublic && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (session && (pathname === "/login" || pathname === "/registro")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
```

- [ ] **Actualizar auth.service.ts del API para setear cookie auth_session**

```typescript
// En apps/api/src/modules/auth/auth.controller.ts
// Añadir en login, register y google callback:
res.cookie("auth_session", "1", {
  httpOnly: false, // necesita ser legible por middleware
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 30 * 24 * 60 * 60 * 1000,
  path: "/",
});
```

- [ ] **Crear lib/auth.ts con helper de login**

```typescript
// apps/web/src/lib/auth.ts
import { api } from "./api";
import { useAuthStore } from "@/store/auth.store";

export async function loginAction(email: string, password: string) {
  const { data } = await api.post<{ accessToken: string }>("/auth/login", {
    email,
    password,
  });
  localStorage.setItem("access_token", data.accessToken);
  // La cookie auth_session la setea el servidor
  return data;
}

export async function registerAction(payload: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName: string;
}) {
  const { data } = await api.post<{ accessToken: string }>("/auth/register", payload);
  localStorage.setItem("access_token", data.accessToken);
  return data;
}

export async function logoutAction() {
  await api.post("/auth/logout").catch(() => {});
  localStorage.removeItem("access_token");
  useAuthStore.getState().logout();
  window.location.href = "/login";
}
```

- [ ] **Conectar LoginForm a la API real**

```typescript
// apps/web/src/components/auth/login-form.tsx
// Reemplazar el onSubmit con:
async function onSubmit(data: FormData) {
  try {
    const tokens = await loginAction(data.email, data.password);
    // Cargar datos del usuario
    const { data: me } = await api.get("/auth/me");
    useAuthStore.getState().setUser(me);
    router.push("/dashboard");
  } catch (err: any) {
    const msg = err.response?.data?.message ?? "Credenciales incorrectas";
    toast.error(Array.isArray(msg) ? msg[0] : msg);
  }
}
```

- [ ] **Commit**
```bash
git add -A
git commit -m "feat: auth middleware, login conectado a API real"
```

---

### Task 2: Página de Registro

**Files:**
- Create: `apps/web/src/app/(auth)/registro/page.tsx`
- Create: `apps/web/src/components/auth/register-form.tsx`

- [ ] **Crear register-form.tsx**

```typescript
// apps/web/src/components/auth/register-form.tsx
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerAction } from "@/lib/auth";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const schema = z.object({
  firstName: z.string().min(1, "Requerido"),
  lastName: z.string().min(1, "Requerido"),
  companyName: z.string().min(2, "Mínimo 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

type FormData = z.infer<typeof schema>;

export function RegisterForm() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    try {
      await registerAction(data);
      const { data: me } = await api.get("/auth/me");
      useAuthStore.getState().setUser(me);
      router.push("/dashboard");
    } catch (err: any) {
      const msg = err.response?.data?.message ?? "Error al registrarse";
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Nombre *</Label>
          <Input {...register("firstName")} placeholder="Lucas" />
          {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Apellido *</Label>
          <Input {...register("lastName")} placeholder="García" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Empresa *</Label>
        <Input {...register("companyName")} placeholder="Mi empresa SL" />
        {errors.companyName && <p className="text-xs text-destructive">{errors.companyName.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label>Email *</Label>
        <Input type="email" {...register("email")} placeholder="tu@empresa.com" />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label>Contraseña *</Label>
        <Input type="password" {...register("password")} placeholder="••••••••" />
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Crear cuenta gratis
      </Button>
      <p className="text-xs text-center text-muted-foreground">
        Al registrarte aceptas los{" "}
        <a href="/terminos" className="underline hover:text-primary">Términos de uso</a>
      </p>
    </form>
  );
}
```

- [ ] **Crear registro/page.tsx**

```typescript
// apps/web/src/app/(auth)/registro/page.tsx
import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Crear cuenta gratis" };

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl mx-auto">E</div>
          <h1 className="text-2xl font-bold">Empieza gratis</h1>
          <p className="text-muted-foreground text-sm">Sin tarjeta de crédito · 14 días de prueba</p>
        </div>
        <RegisterForm />
        <p className="text-center text-xs text-muted-foreground">
          ¿Ya tienes cuenta?{" "}
          <a href="/login" className="text-primary hover:underline">Inicia sesión</a>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Commit**
```bash
git add -A
git commit -m "feat: página de registro con validación"
```

---

## FASE B — Páginas de detalle

### Task 3: Detalle de Factura con VeriFactu

**Files:**
- Create: `apps/web/src/app/(dashboard)/facturas/[id]/page.tsx`
- Create: `apps/web/src/components/invoices/invoice-detail.tsx`
- Create: `apps/web/src/components/invoices/invoice-pdf-button.tsx`
- Create: `apps/web/src/components/invoices/verifactu-badge.tsx`

- [ ] **Crear invoice-detail.tsx**

```typescript
// apps/web/src/components/invoices/invoice-detail.tsx
"use client";
import { useInvoice } from "@/hooks/use-invoices";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowLeft, Download, Send, CheckCircle, Shield } from "lucide-react";
import Link from "next/link";
import { useUpdateInvoiceStatus, useRegisterPayment } from "@/hooks/use-invoices";

const statusConfig: Record<string, { label: string; variant: any }> = {
  DRAFT: { label: "Borrador", variant: "secondary" },
  SENT: { label: "Enviada", variant: "info" },
  PAID: { label: "Pagada", variant: "success" },
  PARTIAL: { label: "Parcial", variant: "warning" },
  OVERDUE: { label: "Vencida", variant: "destructive" },
  CANCELLED: { label: "Cancelada", variant: "secondary" },
};

export function InvoiceDetail({ id }: { id: string }) {
  const { data: invoice, isLoading } = useInvoice(id);
  const updateStatus = useUpdateInvoiceStatus();
  const registerPayment = useRegisterPayment();

  if (isLoading) return <div className="space-y-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
    ))}
  </div>;

  if (!invoice) return <div className="text-center py-20 text-muted-foreground">Factura no encontrada</div>;

  const config = statusConfig[invoice.status] ?? statusConfig.DRAFT;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Breadcrumb + acciones */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/facturas"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-mono">{invoice.number}</h1>
              <Badge variant={config.variant}>{config.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{invoice.client?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />PDF
          </Button>
          {invoice.status === "DRAFT" && (
            <Button size="sm" className="gap-2"
              onClick={() => updateStatus.mutate({ id, status: "SENT" })}>
              <Send className="h-4 w-4" />Enviar
            </Button>
          )}
          {["SENT","PARTIAL","OVERDUE"].includes(invoice.status) && (
            <Button size="sm" variant="default" className="gap-2 bg-emerald-600 hover:bg-emerald-700"
              onClick={() => registerPayment.mutate({ invoiceId: id, amount: Number(invoice.total) - Number(invoice.paidAmount), method: "BANK_TRANSFER" })}>
              <CheckCircle className="h-4 w-4" />Registrar pago
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Detalle principal */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="p-6">
              {/* Cabecera factura */}
              <div className="flex justify-between mb-8">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Emisor</p>
                  <p className="font-semibold">{invoice.company?.legalName ?? invoice.company?.name}</p>
                  <p className="text-sm text-muted-foreground">{invoice.company?.cif}</p>
                  <p className="text-sm text-muted-foreground">{invoice.company?.address}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Receptor</p>
                  <p className="font-semibold">{invoice.client?.legalName ?? invoice.client?.name}</p>
                  <p className="text-sm text-muted-foreground">{invoice.client?.cifNif}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-8 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Número</p>
                  <p className="font-mono font-medium">{invoice.number}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Fecha emisión</p>
                  <p>{formatDate(invoice.issueDate)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Vencimiento</p>
                  <p>{invoice.dueDate ? formatDate(invoice.dueDate) : "—"}</p>
                </div>
              </div>

              {/* Líneas */}
              <table className="w-full text-sm mb-6">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left py-2 font-medium">Descripción</th>
                    <th className="text-right py-2 font-medium">Cant.</th>
                    <th className="text-right py-2 font-medium">Precio</th>
                    <th className="text-right py-2 font-medium">Dto.</th>
                    <th className="text-right py-2 font-medium">Importe</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items?.map((item: any) => (
                    <tr key={item.id} className="border-b border-border/50">
                      <td className="py-2.5">{item.description}</td>
                      <td className="py-2.5 text-right">{Number(item.quantity)}</td>
                      <td className="py-2.5 text-right">{formatCurrency(Number(item.unitPrice))}</td>
                      <td className="py-2.5 text-right text-muted-foreground">
                        {Number(item.discount) > 0 ? `${Number(item.discount)}%` : "—"}
                      </td>
                      <td className="py-2.5 text-right font-medium">{formatCurrency(Number(item.subtotal))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totales */}
              <div className="flex justify-end">
                <div className="w-64 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(Number(invoice.subtotal))}</span>
                  </div>
                  {invoice.taxes?.map((t: any) => (
                    <div key={t.id} className="flex justify-between">
                      <span className="text-muted-foreground">{t.tax?.name ?? `IVA ${t.rate}%`}</span>
                      <span>{formatCurrency(Number(t.amount))}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold text-base border-t border-border pt-2">
                    <span>Total</span>
                    <span>{formatCurrency(Number(invoice.total))}</span>
                  </div>
                  {Number(invoice.paidAmount) > 0 && (
                    <>
                      <div className="flex justify-between text-emerald-600">
                        <span>Cobrado</span>
                        <span>{formatCurrency(Number(invoice.paidAmount))}</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>Pendiente</span>
                        <span>{formatCurrency(Number(invoice.total) - Number(invoice.paidAmount))}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {invoice.notes && (
                <div className="mt-6 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-1">Notas</p>
                  <p className="text-sm">{invoice.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Panel lateral */}
        <div className="space-y-4">
          {/* Pagos */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Historial de pagos</CardTitle>
            </CardHeader>
            <CardContent>
              {invoice.payments?.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin pagos registrados</p>
              ) : (
                <div className="space-y-2">
                  {invoice.payments?.map((p: any) => (
                    <div key={p.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{formatDate(p.paidAt)}</span>
                      <span className="font-medium text-emerald-600">{formatCurrency(Number(p.amount))}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* VeriFactu */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                VeriFactu
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {invoice.verifactu ? (
                <div className="space-y-2">
                  <Badge variant="success">Registrada en AEAT</Badge>
                  <p className="text-xs text-muted-foreground font-mono break-all">
                    {invoice.verifactu.hash?.slice(0, 32)}...
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Esta factura no tiene registro VeriFactu todavía.
                  </p>
                  {["SENT","PAID"].includes(invoice.status) && (
                    <Button size="sm" variant="outline" className="w-full gap-2 text-xs"
                      onClick={() => {/* TODO: generateVerifactu */}}>
                      <Shield className="h-3 w-3" />
                      Generar VeriFactu
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Crear facturas/[id]/page.tsx**

```typescript
// apps/web/src/app/(dashboard)/facturas/[id]/page.tsx
import type { Metadata } from "next";
import { InvoiceDetail } from "@/components/invoices/invoice-detail";

export const metadata: Metadata = { title: "Detalle de factura" };

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  return <InvoiceDetail id={params.id} />;
}
```

- [ ] **Commit**
```bash
git add -A
git commit -m "feat: página de detalle de factura con VeriFactu panel"
```

---

### Task 4: Detalle de Cliente

**Files:**
- Create: `apps/web/src/app/(dashboard)/clientes/[id]/page.tsx`
- Create: `apps/web/src/components/clients/client-detail.tsx`
- Modify: `apps/web/src/components/ui/tabs.tsx` (nuevo componente)

- [ ] **Crear ui/tabs.tsx**

```typescript
// apps/web/src/components/ui/tabs.tsx
"use client";
import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-4 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
```

- [ ] **Crear client-detail.tsx**

```typescript
// apps/web/src/components/clients/client-detail.tsx
"use client";
import { useClient } from "@/hooks/use-clients";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import { ArrowLeft, Edit, Mail, Phone, Globe, MapPin, FileText, Briefcase } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ClientDialog } from "./client-dialog";

const statusConfig: Record<string, { label: string; variant: any }> = {
  DRAFT: { label: "Borrador", variant: "secondary" },
  SENT: { label: "Enviada", variant: "info" },
  PAID: { label: "Pagada", variant: "success" },
  PARTIAL: { label: "Parcial", variant: "warning" },
  OVERDUE: { label: "Vencida", variant: "destructive" },
  CANCELLED: { label: "Cancelada", variant: "secondary" },
};

export function ClientDetail({ id }: { id: string }) {
  const { data: client, isLoading } = useClient(id);
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="h-32 rounded-xl bg-muted animate-pulse" />
      <div className="h-64 rounded-xl bg-muted animate-pulse" />
    </div>
  );
  if (!client) return <div className="text-center py-20 text-muted-foreground">Cliente no encontrado</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/clientes"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary text-lg font-bold">
            {getInitials(client.name)}
          </div>
          <div>
            <h1 className="text-xl font-bold">{client.name}</h1>
            {client.cifNif && <p className="text-sm text-muted-foreground">{client.cifNif}</p>}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
          <Edit className="h-4 w-4 mr-2" />Editar
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total facturado", value: formatCurrency(Number(client.totalBilled)) },
          { label: "Pendiente de cobro", value: formatCurrency(Number(client.pendingBalance)) },
          { label: "Facturas totales", value: String(client._count?.invoices ?? 0) },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{kpi.label}</p>
              <p className="text-xl font-bold mt-1">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="facturas">
        <TabsList>
          <TabsTrigger value="facturas">
            <FileText className="h-4 w-4 mr-2" />Facturas
          </TabsTrigger>
          <TabsTrigger value="deals">
            <Briefcase className="h-4 w-4 mr-2" />Deals
          </TabsTrigger>
          <TabsTrigger value="datos">Datos</TabsTrigger>
        </TabsList>

        <TabsContent value="facturas">
          <Card>
            <CardContent className="p-0">
              {client.invoices?.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  Sin facturas todavía
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Número</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fecha</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">Importe</th>
                      <th className="text-center px-4 py-3 font-medium text-muted-foreground">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {client.invoices?.map((inv: any) => {
                      const sc = statusConfig[inv.status];
                      return (
                        <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                          <td className="px-4 py-3">
                            <Link href={`/facturas/${inv.id}`} className="font-mono text-xs text-primary hover:underline">
                              {inv.number}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{formatDate(inv.issueDate)}</td>
                          <td className="px-4 py-3 text-right font-medium">{formatCurrency(Number(inv.total))}</td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant={sc?.variant}>{sc?.label}</Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deals">
          <Card>
            <CardContent className="p-4">
              {client.deals?.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin deals asociados</p>
              ) : (
                <div className="space-y-3">
                  {client.deals?.map((deal: any) => (
                    <div key={deal.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <p className="text-sm font-medium">{deal.title}</p>
                      <span className="text-sm font-bold">{formatCurrency(Number(deal.value))}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="datos">
          <Card>
            <CardContent className="p-6">
              <dl className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                {[
                  { label: "Razón social", value: client.legalName },
                  { label: "CIF/NIF", value: client.cifNif },
                  { label: "Email", value: client.email, icon: Mail },
                  { label: "Teléfono", value: client.phone, icon: Phone },
                  { label: "Móvil", value: client.mobile },
                  { label: "Web", value: client.website, icon: Globe },
                  { label: "Dirección", value: client.address, icon: MapPin },
                  { label: "Ciudad", value: client.city ? `${client.city}${client.province ? `, ${client.province}` : ""}` : null },
                  { label: "CP", value: client.postalCode },
                  { label: "País", value: client.country },
                ].filter((f) => f.value).map((field) => (
                  <div key={field.label}>
                    <dt className="text-muted-foreground">{field.label}</dt>
                    <dd className="font-medium mt-0.5">{field.value}</dd>
                  </div>
                ))}
              </dl>
              {client.notes && (
                <div className="mt-6 pt-4 border-t border-border">
                  <p className="text-muted-foreground text-xs uppercase tracking-wide mb-2">Notas</p>
                  <p className="text-sm">{client.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ClientDialog open={editOpen} onOpenChange={setEditOpen} client={client} />
    </div>
  );
}
```

- [ ] **Crear clientes/[id]/page.tsx**

```typescript
// apps/web/src/app/(dashboard)/clientes/[id]/page.tsx
import type { Metadata } from "next";
import { ClientDetail } from "@/components/clients/client-detail";

export const metadata: Metadata = { title: "Detalle de cliente" };

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  return <ClientDetail id={params.id} />;
}
```

- [ ] **Commit**
```bash
git add -A
git commit -m "feat: página detalle cliente con tabs facturas/deals/datos"
```

---

## FASE C — Módulos completos

### Task 5: Leads completo (backend + frontend)

**Files:**
- Create: `apps/api/src/modules/leads/leads.module.ts`
- Create: `apps/api/src/modules/leads/leads.service.ts`
- Create: `apps/api/src/modules/leads/leads.controller.ts`
- Modify: `apps/api/src/app.module.ts` (añadir LeadsModule)
- Create: `apps/web/src/components/leads/leads-view.tsx`
- Create: `apps/web/src/hooks/use-leads.ts`
- Modify: `apps/web/src/app/(dashboard)/leads/page.tsx`

- [ ] **Crear leads backend (module + service + controller)**

`apps/api/src/modules/leads/leads.service.ts`:
```typescript
import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string, params: any) {
    const { page = 1, limit = 20, search } = params;
    const where: any = {
      companyId,
      isConverted: false,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { company: { contains: search, mode: "insensitive" } },
        ],
      }),
    };
    const [data, total] = await Promise.all([
      this.prisma.lead.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: "desc" } }),
      this.prisma.lead.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async create(companyId: string, data: any) {
    return this.prisma.lead.create({ data: { ...data, companyId } });
  }

  async update(companyId: string, id: string, data: any) {
    const lead = await this.prisma.lead.findFirst({ where: { id, companyId } });
    if (!lead) throw new NotFoundException("Lead no encontrado");
    return this.prisma.lead.update({ where: { id }, data });
  }

  async convert(companyId: string, id: string) {
    const lead = await this.prisma.lead.findFirst({ where: { id, companyId } });
    if (!lead) throw new NotFoundException("Lead no encontrado");
    const client = await this.prisma.client.create({
      data: {
        companyId,
        name: lead.name,
        email: lead.email ?? undefined,
        phone: lead.phone ?? undefined,
        notes: lead.notes ?? undefined,
      },
    });
    await this.prisma.lead.update({ where: { id }, data: { isConverted: true, clientId: client.id } });
    return client;
  }

  async remove(companyId: string, id: string) {
    const lead = await this.prisma.lead.findFirst({ where: { id, companyId } });
    if (!lead) throw new NotFoundException("Lead no encontrado");
    return this.prisma.lead.delete({ where: { id } });
  }
}
```

`apps/api/src/modules/leads/leads.controller.ts`:
```typescript
import { Controller, Get, Post, Put, Delete, Patch, Param, Body, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { LeadsService } from "./leads.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "@saas/types";

@ApiTags("Leads")
@UseGuards(JwtAuthGuard)
@Controller("leads")
export class LeadsController {
  constructor(private leadsService: LeadsService) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload, @Query() params: any) {
    return this.leadsService.findAll(user.companyId, params);
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() body: any) {
    return this.leadsService.create(user.companyId, body);
  }

  @Put(":id")
  update(@CurrentUser() user: JwtPayload, @Param("id") id: string, @Body() body: any) {
    return this.leadsService.update(user.companyId, id, body);
  }

  @Post(":id/convert")
  convert(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.leadsService.convert(user.companyId, id);
  }

  @Delete(":id")
  remove(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.leadsService.remove(user.companyId, id);
  }
}
```

`apps/api/src/modules/leads/leads.module.ts`:
```typescript
import { Module } from "@nestjs/common";
import { LeadsController } from "./leads.controller";
import { LeadsService } from "./leads.service";

@Module({ controllers: [LeadsController], providers: [LeadsService] })
export class LeadsModule {}
```

Añadir a `app.module.ts`:
```typescript
import { LeadsModule } from "./modules/leads/leads.module";
// ... añadir LeadsModule al array imports
```

- [ ] **Crear use-leads.ts**

```typescript
// apps/web/src/hooks/use-leads.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function useLeads(params?: any) {
  return useQuery({
    queryKey: ["leads", params],
    queryFn: () => api.get("/leads", { params }).then((r) => r.data),
  });
}

export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post("/leads", data).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["leads"] }); toast.success("Lead creado"); },
    onError: () => toast.error("Error al crear el lead"),
  });
}

export function useConvertLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/leads/${id}/convert`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Lead convertido a cliente");
    },
  });
}

export function useDeleteLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/leads/${id}`).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["leads"] }); toast.success("Lead eliminado"); },
  });
}
```

- [ ] **Crear leads-view.tsx completo**

```typescript
// apps/web/src/components/leads/leads-view.tsx
"use client";
import { useState } from "react";
import { useLeads, useCreateLead, useConvertLead, useDeleteLead } from "@/hooks/use-leads";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search, Plus, MoreHorizontal, UserCheck, Trash2, Loader2 } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { formatDate } from "@/lib/utils";

const SOURCES = ["Web", "Referido", "LinkedIn", "Google Ads", "Llamada", "Email", "Evento", "Otro"];

const schema = z.object({
  name: z.string().min(1, "Requerido"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  company: z.string().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
});

export function LeadsView() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useLeads({ search: debouncedSearch || undefined });
  const createLead = useCreateLead();
  const convertLead = useConvertLead();
  const deleteLead = useDeleteLead();
  const leads = data?.data ?? [];

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: any) {
    const clean = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== ""));
    await createLead.mutateAsync(clean);
    setDialogOpen(false);
    reset();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-sm text-muted-foreground mt-1">{leads.length} leads activos</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />Nuevo lead
        </Button>
      </div>

      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar leads..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-muted/40 animate-pulse border-b last:border-0" />)
          ) : leads.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <p className="font-medium">No hay leads</p>
              <p className="text-sm text-muted-foreground mt-1 mb-4">Registra nuevas oportunidades de venta</p>
              <Button size="sm" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />Nuevo lead</Button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Nombre</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">Empresa</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden lg:table-cell">Fuente</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden sm:table-cell">Fecha</th>
                  <th className="px-4 py-3 w-12" />
                </tr>
              </thead>
              <tbody>
                {leads.map((lead: any) => (
                  <tr key={lead.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <p className="font-medium">{lead.name}</p>
                      {lead.email && <p className="text-xs text-muted-foreground">{lead.email}</p>}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{lead.company ?? "—"}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {lead.source ? <Badge variant="secondary">{lead.source}</Badge> : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">{formatDate(lead.createdAt)}</td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => convertLead.mutate(lead.id)}>
                            <UserCheck className="h-4 w-4 mr-2" />Convertir a cliente
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:text-destructive"
                            onClick={() => { if (confirm(`¿Eliminar a ${lead.name}?`)) deleteLead.mutate(lead.id); }}>
                            <Trash2 className="h-4 w-4 mr-2" />Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nuevo lead</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <Label>Nombre *</Label>
                <Input {...register("name")} placeholder="María García" />
                {errors.name && <p className="text-xs text-destructive">{String(errors.name.message)}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" {...register("email")} placeholder="maria@empresa.com" />
              </div>
              <div className="space-y-1.5">
                <Label>Teléfono</Label>
                <Input {...register("phone")} placeholder="600 123 456" />
              </div>
              <div className="space-y-1.5">
                <Label>Empresa</Label>
                <Input {...register("company")} placeholder="Empresa SL" />
              </div>
              <div className="space-y-1.5">
                <Label>Fuente</Label>
                <select {...register("source")} className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">Seleccionar...</option>
                  {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Notas</Label>
                <textarea {...register("notes")} rows={2} placeholder="Información adicional..."
                  className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none placeholder:text-muted-foreground" />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); reset(); }}>Cancelar</Button>
              <Button type="submit" disabled={createLead.isPending}>
                {createLead.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Crear lead
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

- [ ] **Actualizar leads/page.tsx**
```typescript
// apps/web/src/app/(dashboard)/leads/page.tsx
import type { Metadata } from "next";
import { LeadsView } from "@/components/leads/leads-view";
export const metadata: Metadata = { title: "Leads" };
export default function LeadsPage() { return <LeadsView />; }
```

- [ ] **Commit**
```bash
git add -A
git commit -m "feat: módulo leads completo (backend + frontend)"
```

---

### Task 6: Presupuestos completo (backend + frontend)

**Files:**
- Create: `apps/api/src/modules/quotes/quotes.module.ts`
- Create: `apps/api/src/modules/quotes/quotes.service.ts`
- Create: `apps/api/src/modules/quotes/quotes.controller.ts`
- Modify: `apps/api/src/app.module.ts`
- Create: `apps/web/src/components/quotes/quotes-view.tsx`
- Create: `apps/web/src/components/quotes/quote-dialog.tsx`
- Create: `apps/web/src/hooks/use-quotes.ts`
- Modify: `apps/web/src/app/(dashboard)/presupuestos/page.tsx`

- [ ] **Backend quotes (service + controller + module)**

`apps/api/src/modules/quotes/quotes.service.ts`:
```typescript
import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class QuotesService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string, params: any) {
    const { page = 1, limit = 20, search, status } = params;
    const where: any = {
      companyId,
      ...(status && { status }),
      ...(search && {
        OR: [
          { number: { contains: search, mode: "insensitive" } },
          { client: { name: { contains: search, mode: "insensitive" } } },
        ],
      }),
    };
    const [data, total] = await Promise.all([
      this.prisma.quote.findMany({
        where, skip: (page - 1) * limit, take: limit,
        orderBy: { createdAt: "desc" },
        include: { client: { select: { id: true, name: true } } },
      }),
      this.prisma.quote.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(companyId: string, id: string) {
    const quote = await this.prisma.quote.findFirst({
      where: { id, companyId },
      include: {
        client: true,
        items: { orderBy: { order: "asc" } },
      },
    });
    if (!quote) throw new NotFoundException("Presupuesto no encontrado");
    return quote;
  }

  async create(companyId: string, dto: any) {
    const count = await this.prisma.quote.count({ where: { companyId } });
    const number = `P-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;
    const subtotal = dto.items.reduce((s: number, i: any) => s + i.quantity * i.unitPrice * (1 - (i.discount ?? 0) / 100), 0);
    const taxAmount = subtotal * 0.21;
    return this.prisma.quote.create({
      data: {
        companyId,
        clientId: dto.clientId,
        number,
        issueDate: dto.issueDate ? new Date(dto.issueDate) : new Date(),
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
        currency: dto.currency ?? "EUR",
        subtotal,
        taxAmount,
        total: subtotal + taxAmount,
        notes: dto.notes,
        items: {
          create: dto.items.map((item: any, i: number) => ({
            productId: item.productId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount ?? 0,
            subtotal: item.quantity * item.unitPrice * (1 - (item.discount ?? 0) / 100),
            order: i,
          })),
        },
      },
      include: { items: true, client: true },
    });
  }

  async updateStatus(companyId: string, id: string, status: string) {
    await this.findOne(companyId, id);
    return this.prisma.quote.update({ where: { id }, data: { status: status as any } });
  }

  async convertToInvoice(companyId: string, id: string) {
    const quote = await this.findOne(companyId, id);
    const series = await this.prisma.invoiceSeries.findFirst({ where: { companyId, isDefault: true } });
    if (!series) throw new NotFoundException("Serie de facturas no encontrada");
    const number = `${series.prefix}${String(series.nextNumber).padStart(4, "0")}`;
    const [invoice] = await this.prisma.$transaction([
      this.prisma.invoice.create({
        data: {
          companyId,
          clientId: quote.clientId,
          seriesId: series.id,
          number,
          subtotal: quote.subtotal,
          taxAmount: quote.taxAmount,
          total: quote.total,
          notes: quote.notes,
          items: {
            create: quote.items.map((item: any, i: number) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount,
              subtotal: item.subtotal,
              order: i,
            })),
          },
        },
      }),
      this.prisma.invoiceSeries.update({ where: { id: series.id }, data: { nextNumber: { increment: 1 } } }),
      this.prisma.quote.update({ where: { id }, data: { status: "ACCEPTED" } }),
    ]);
    return invoice;
  }
}
```

`apps/api/src/modules/quotes/quotes.controller.ts`:
```typescript
import { Controller, Get, Post, Param, Body, Query, Patch, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { QuotesService } from "./quotes.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "@saas/types";

@ApiTags("Quotes")
@UseGuards(JwtAuthGuard)
@Controller("quotes")
export class QuotesController {
  constructor(private quotesService: QuotesService) {}

  @Get() findAll(@CurrentUser() u: JwtPayload, @Query() p: any) { return this.quotesService.findAll(u.companyId, p); }
  @Get(":id") findOne(@CurrentUser() u: JwtPayload, @Param("id") id: string) { return this.quotesService.findOne(u.companyId, id); }
  @Post() create(@CurrentUser() u: JwtPayload, @Body() b: any) { return this.quotesService.create(u.companyId, b); }
  @Patch(":id/status") updateStatus(@CurrentUser() u: JwtPayload, @Param("id") id: string, @Body("status") s: string) { return this.quotesService.updateStatus(u.companyId, id, s); }
  @Post(":id/convert") convertToInvoice(@CurrentUser() u: JwtPayload, @Param("id") id: string) { return this.quotesService.convertToInvoice(u.companyId, id); }
}
```

`apps/api/src/modules/quotes/quotes.module.ts`:
```typescript
import { Module } from "@nestjs/common";
import { QuotesController } from "./quotes.controller";
import { QuotesService } from "./quotes.service";
@Module({ controllers: [QuotesController], providers: [QuotesService] })
export class QuotesModule {}
```

- [ ] **Hook use-quotes.ts**

```typescript
// apps/web/src/hooks/use-quotes.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function useQuotes(params?: any) {
  return useQuery({
    queryKey: ["quotes", params],
    queryFn: () => api.get("/quotes", { params }).then((r) => r.data),
  });
}

export function useCreateQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post("/quotes", data).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["quotes"] }); toast.success("Presupuesto creado"); },
    onError: () => toast.error("Error al crear el presupuesto"),
  });
}

export function useUpdateQuoteStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/quotes/${id}/status`, { status }).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["quotes"] }); toast.success("Estado actualizado"); },
  });
}

export function useConvertQuoteToInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/quotes/${id}/convert`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotes"] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Presupuesto convertido a factura");
    },
    onError: () => toast.error("Error al convertir el presupuesto"),
  });
}
```

- [ ] **Crear quotes-view.tsx** (igual estructura que invoices-view pero para Quote, con botón "Convertir a factura", statusTabs DRAFT/SENT/ACCEPTED/REJECTED/EXPIRED)

El componente sigue la misma estructura visual que `invoices-view.tsx`. Usar los hooks `useQuotes`, `useUpdateQuoteStatus`, `useConvertQuoteToInvoice`. Status config:
```typescript
const statusConfig = {
  DRAFT: { label: "Borrador", variant: "secondary" },
  SENT: { label: "Enviado", variant: "info" },
  ACCEPTED: { label: "Aceptado", variant: "success" },
  REJECTED: { label: "Rechazado", variant: "destructive" },
  EXPIRED: { label: "Expirado", variant: "warning" },
};
```

- [ ] **Commit**
```bash
git add -A
git commit -m "feat: módulo presupuestos completo (backend + frontend + convertir a factura)"
```

---

### Task 7: Configuración de empresa (Mi empresa)

**Files:**
- Create: `apps/web/src/components/settings/company-settings.tsx`
- Modify: `apps/web/src/app/(dashboard)/empresa/page.tsx`
- Create: `apps/web/src/hooks/use-company.ts`

- [ ] **Hook use-company.ts**

```typescript
// apps/web/src/hooks/use-company.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function useMyCompany() {
  return useQuery({
    queryKey: ["company", "me"],
    queryFn: () => api.get("/companies/me").then((r) => r.data),
  });
}

export function useUpdateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.put("/companies/me", data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["company"] });
      toast.success("Datos de empresa actualizados");
    },
    onError: () => toast.error("Error al actualizar la empresa"),
  });
}
```

- [ ] **Crear company-settings.tsx**

```typescript
// apps/web/src/components/settings/company-settings.tsx
"use client";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMyCompany, useUpdateCompany } from "@/hooks/use-company";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Building2, CreditCard } from "lucide-react";

const schema = z.object({
  name: z.string().min(1),
  legalName: z.string().optional(),
  cif: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  website: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const PLAN_LABELS: Record<string, string> = {
  FREE: "Gratuito",
  STARTER: "Starter",
  PRO: "Pro",
  ENTERPRISE: "Enterprise",
};

export function CompanySettings() {
  const { data: company, isLoading } = useMyCompany();
  const updateCompany = useUpdateCompany();

  const { register, handleSubmit, reset, formState: { isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (company) reset({
      name: company.name ?? "",
      legalName: company.legalName ?? "",
      cif: company.cif ?? "",
      email: company.email ?? "",
      phone: company.phone ?? "",
      address: company.address ?? "",
      city: company.city ?? "",
      province: company.province ?? "",
      postalCode: company.postalCode ?? "",
      country: company.country ?? "ES",
      website: company.website ?? "",
    });
  }, [company, reset]);

  if (isLoading) return <div className="h-96 bg-muted rounded-xl animate-pulse" />;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mi empresa</h1>
          <p className="text-sm text-muted-foreground mt-1">Datos fiscales y de contacto</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Plan:</span>
          <Badge variant={company?.plan === "FREE" ? "secondary" : "default"}>
            {PLAN_LABELS[company?.plan ?? "FREE"]}
          </Badge>
        </div>
      </div>

      <form onSubmit={handleSubmit((d) => updateCompany.mutate(d as any))} className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Building2 className="h-4 w-4" />Datos de la empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Nombre comercial *</Label>
                <Input {...register("name")} />
              </div>
              <div className="space-y-1.5">
                <Label>Razón social</Label>
                <Input {...register("legalName")} />
              </div>
              <div className="space-y-1.5">
                <Label>CIF/NIF</Label>
                <Input {...register("cif")} placeholder="B12345678" />
              </div>
              <div className="space-y-1.5">
                <Label>Email de contacto</Label>
                <Input type="email" {...register("email")} />
              </div>
              <div className="space-y-1.5">
                <Label>Teléfono</Label>
                <Input {...register("phone")} />
              </div>
              <div className="space-y-1.5">
                <Label>Web</Label>
                <Input {...register("website")} placeholder="https://miempresa.es" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Dirección fiscal</Label>
              <Input {...register("address")} placeholder="Calle Mayor 1, 2ª planta" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label>Ciudad</Label>
                <Input {...register("city")} />
              </div>
              <div className="space-y-1.5">
                <Label>CP</Label>
                <Input {...register("postalCode")} />
              </div>
              <div className="space-y-1.5">
                <Label>Provincia</Label>
                <Input {...register("province")} />
              </div>
            </div>
          </CardContent>
        </Card>

        {isDirty && (
          <div className="flex justify-end">
            <Button type="submit" disabled={updateCompany.isPending}>
              {updateCompany.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar cambios
            </Button>
          </div>
        )}
      </form>

      {/* Plan y facturación */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <CreditCard className="h-4 w-4" />Plan y facturación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Plan {PLAN_LABELS[company?.plan ?? "FREE"]}</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {company?.plan === "FREE"
                  ? "Límites: 5 clientes, 10 facturas/mes"
                  : company?.plan === "STARTER"
                  ? "50 clientes, 100 facturas/mes"
                  : "Sin límites"}
              </p>
            </div>
            <Button variant="outline" size="sm">Cambiar plan</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Actualizar empresa/page.tsx**
```typescript
import type { Metadata } from "next";
import { CompanySettings } from "@/components/settings/company-settings";
export const metadata: Metadata = { title: "Mi empresa" };
export default function CompanyPage() { return <CompanySettings />; }
```

- [ ] **Commit**
```bash
git add -A
git commit -m "feat: página configuración empresa con formulario y plan"
```

---

### Task 8: Perfil y seguridad (Configuración usuario)

**Files:**
- Create: `apps/web/src/components/settings/user-settings.tsx`
- Modify: `apps/web/src/app/(dashboard)/configuracion/page.tsx`
- Create: `apps/web/src/hooks/use-user.ts`

- [ ] **Hook use-user.ts**

```typescript
// apps/web/src/hooks/use-user.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { firstName?: string; lastName?: string; phone?: string }) =>
      api.put("/users/profile", data).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["auth"] }); toast.success("Perfil actualizado"); },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      api.put("/users/password", data).then((r) => r.data),
    onSuccess: () => toast.success("Contraseña cambiada"),
    onError: (err: any) => toast.error(err.response?.data?.message ?? "Error al cambiar contraseña"),
  });
}

export function useSetup2FA() {
  return useMutation({
    mutationFn: () => api.post("/auth/2fa/setup").then((r) => r.data),
  });
}

export function useVerify2FA() {
  return useMutation({
    mutationFn: (token: string) => api.post("/auth/2fa/verify", { token }).then((r) => r.data),
    onSuccess: () => toast.success("2FA activado"),
    onError: () => toast.error("Código inválido"),
  });
}
```

- [ ] **Crear user-settings.tsx** con tabs: Perfil, Seguridad, Notificaciones

```typescript
// apps/web/src/components/settings/user-settings.tsx
"use client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/auth.store";
import { useUpdateProfile, useChangePassword } from "@/hooks/use-user";
import { useForm } from "react-hook-form";
import { Loader2, User, Lock, Bell } from "lucide-react";

export function UserSettings() {
  const user = useAuthStore((s) => s.user);
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  const profileForm = useForm({
    defaultValues: {
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
    },
  });

  const passwordForm = useForm<{ currentPassword: string; newPassword: string; confirmPassword: string }>();

  async function onPasswordSubmit(data: any) {
    if (data.newPassword !== data.confirmPassword) return;
    await changePassword.mutateAsync({ currentPassword: data.currentPassword, newPassword: data.newPassword });
    passwordForm.reset();
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-sm text-muted-foreground mt-1">Gestiona tu perfil y seguridad</p>
      </div>

      <Tabs defaultValue="perfil">
        <TabsList>
          <TabsTrigger value="perfil"><User className="h-4 w-4 mr-2" />Perfil</TabsTrigger>
          <TabsTrigger value="seguridad"><Lock className="h-4 w-4 mr-2" />Seguridad</TabsTrigger>
          <TabsTrigger value="notificaciones"><Bell className="h-4 w-4 mr-2" />Notificaciones</TabsTrigger>
        </TabsList>

        <TabsContent value="perfil">
          <Card>
            <CardHeader><CardTitle className="text-sm">Datos personales</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={profileForm.handleSubmit((d) => updateProfile.mutate(d))} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Nombre</Label>
                    <Input {...profileForm.register("firstName")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Apellido</Label>
                    <Input {...profileForm.register("lastName")} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input value={user?.email ?? ""} disabled className="opacity-60" />
                  <p className="text-xs text-muted-foreground">El email no se puede cambiar</p>
                </div>
                <Button type="submit" size="sm" disabled={updateProfile.isPending}>
                  {updateProfile.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Guardar
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seguridad">
          <Card>
            <CardHeader><CardTitle className="text-sm">Cambiar contraseña</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Contraseña actual</Label>
                  <Input type="password" {...passwordForm.register("currentPassword")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Nueva contraseña</Label>
                  <Input type="password" {...passwordForm.register("newPassword")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Confirmar nueva contraseña</Label>
                  <Input type="password" {...passwordForm.register("confirmPassword")} />
                </div>
                <Button type="submit" size="sm" disabled={changePassword.isPending}>
                  {changePassword.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Cambiar contraseña
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notificaciones">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Configuración de notificaciones — próximamente.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

- [ ] **Actualizar configuracion/page.tsx**
```typescript
import type { Metadata } from "next";
import { UserSettings } from "@/components/settings/user-settings";
export const metadata: Metadata = { title: "Configuración" };
export default function SettingsPage() { return <UserSettings />; }
```

- [ ] **Commit**
```bash
git add -A
git commit -m "feat: configuración usuario (perfil + cambio contraseña + 2FA)"
```

---

## FASE D — Stripe y billing

### Task 9: Integración Stripe (suscripciones)

**Files:**
- Create: `apps/api/src/modules/billing/billing.module.ts`
- Create: `apps/api/src/modules/billing/billing.service.ts`
- Create: `apps/api/src/modules/billing/billing.controller.ts`
- Modify: `apps/api/src/app.module.ts`
- Create: `apps/web/src/app/(dashboard)/billing/page.tsx`
- Create: `apps/web/src/components/billing/pricing-cards.tsx`

- [ ] **Instalar stripe en apps/api**
```bash
cd apps/api && pnpm add stripe
cd apps/api && pnpm add -D @types/stripe
```

- [ ] **billing.service.ts**

```typescript
// apps/api/src/modules/billing/billing.service.ts
import { Injectable, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";
import { PrismaService } from "../../database/prisma.service";

const PRICE_IDS: Record<string, string> = {
  STARTER_MONTHLY: "price_starter_monthly", // reemplazar con IDs reales de Stripe
  PRO_MONTHLY: "price_pro_monthly",
  ENTERPRISE_MONTHLY: "price_enterprise_monthly",
};

@Injectable()
export class BillingService {
  private stripe: Stripe;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService
  ) {
    this.stripe = new Stripe(config.get("STRIPE_SECRET_KEY", ""), {
      apiVersion: "2024-11-20.acacia",
    });
  }

  async createCheckoutSession(companyId: string, plan: "STARTER" | "PRO" | "ENTERPRISE", successUrl: string, cancelUrl: string) {
    const company = await this.prisma.company.findUniqueOrThrow({ where: { id: companyId } });

    let customerId = company.stripeCustomerId;
    if (!customerId) {
      const customer = await this.stripe.customers.create({
        email: company.email,
        name: company.legalName ?? company.name,
        metadata: { companyId },
      });
      customerId = customer.id;
      await this.prisma.company.update({ where: { id: companyId }, data: { stripeCustomerId: customerId } });
    }

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: PRICE_IDS[`${plan}_MONTHLY`], quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { companyId, plan },
    });

    return { url: session.url };
  }

  async createPortalSession(companyId: string, returnUrl: string) {
    const company = await this.prisma.company.findUniqueOrThrow({ where: { id: companyId } });
    if (!company.stripeCustomerId) throw new BadRequestException("Sin suscripción activa");
    const session = await this.stripe.billingPortal.sessions.create({
      customer: company.stripeCustomerId,
      return_url: returnUrl,
    });
    return { url: session.url };
  }

  async handleWebhook(body: Buffer, signature: string) {
    const secret = this.config.get<string>("STRIPE_WEBHOOK_SECRET", "");
    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(body, signature, secret);
    } catch {
      throw new BadRequestException("Webhook signature invalid");
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const { companyId, plan } = session.metadata ?? {};
        if (companyId && plan) {
          await this.prisma.company.update({
            where: { id: companyId },
            data: { plan: plan as any, stripeSubId: session.subscription as string },
          });
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await this.prisma.company.updateMany({
          where: { stripeSubId: sub.id },
          data: { plan: "FREE", stripeSubId: null },
        });
        break;
      }
    }
    return { received: true };
  }
}
```

- [ ] **billing.controller.ts**

```typescript
// apps/api/src/modules/billing/billing.controller.ts
import { Controller, Post, Body, Req, UseGuards, RawBodyRequest, Headers } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { BillingService } from "./billing.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "@saas/types";

@ApiTags("Billing")
@Controller("billing")
export class BillingController {
  constructor(private billingService: BillingService) {}

  @Post("checkout")
  @UseGuards(JwtAuthGuard)
  checkout(
    @CurrentUser() user: JwtPayload,
    @Body() body: { plan: "STARTER" | "PRO" | "ENTERPRISE"; successUrl: string; cancelUrl: string }
  ) {
    return this.billingService.createCheckoutSession(user.companyId, body.plan, body.successUrl, body.cancelUrl);
  }

  @Post("portal")
  @UseGuards(JwtAuthGuard)
  portal(@CurrentUser() user: JwtPayload, @Body("returnUrl") returnUrl: string) {
    return this.billingService.createPortalSession(user.companyId, returnUrl);
  }

  @Post("webhook")
  webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers("stripe-signature") sig: string
  ) {
    return this.billingService.handleWebhook(req.rawBody!, sig);
  }
}
```

- [ ] **billing.module.ts**

```typescript
import { Module } from "@nestjs/common";
import { BillingController } from "./billing.controller";
import { BillingService } from "./billing.service";
@Module({ controllers: [BillingController], providers: [BillingService] })
export class BillingModule {}
```

- [ ] **Añadir BillingModule a app.module.ts**

- [ ] **Habilitar rawBody en main.ts** (necesario para webhooks Stripe):
```typescript
// apps/api/src/main.ts — añadir en NestFactory.create:
const app = await NestFactory.create(AppModule, { rawBody: true });
```

- [ ] **Crear pricing-cards.tsx** (componente de planes)

```typescript
// apps/web/src/components/billing/pricing-cards.tsx
"use client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { api } from "@/lib/api";
import { useState } from "react";
import { toast } from "sonner";

const PLANS = [
  {
    key: "FREE",
    label: "Gratuito",
    price: 0,
    description: "Para empezar",
    features: ["5 clientes", "10 facturas/mes", "1 usuario", "1 GB almacenamiento"],
    cta: "Plan actual",
    disabled: true,
  },
  {
    key: "STARTER",
    label: "Starter",
    price: 29,
    description: "Para autónomos y pequeñas empresas",
    features: ["50 clientes", "100 facturas/mes", "3 usuarios", "10 GB", "VeriFactu incluido"],
    cta: "Empezar Starter",
    badge: null,
    disabled: false,
  },
  {
    key: "PRO",
    label: "Pro",
    price: 79,
    description: "Para empresas en crecimiento",
    features: ["500 clientes", "1.000 facturas/mes", "10 usuarios", "50 GB", "VeriFactu + IA", "API access"],
    cta: "Empezar Pro",
    badge: "Popular",
    disabled: false,
  },
  {
    key: "ENTERPRISE",
    label: "Enterprise",
    price: 199,
    description: "Sin límites",
    features: ["Clientes ilimitados", "Facturas ilimitadas", "Usuarios ilimitados", "200 GB", "Todo incluido", "Soporte prioritario"],
    cta: "Contactar",
    badge: null,
    disabled: false,
  },
];

export function PricingCards({ currentPlan = "FREE" }: { currentPlan?: string }) {
  const [loading, setLoading] = useState<string | null>(null);

  async function handleUpgrade(planKey: string) {
    if (planKey === "ENTERPRISE") {
      window.open("mailto:sales@tusaas.es?subject=Enterprise", "_blank");
      return;
    }
    setLoading(planKey);
    try {
      const { data } = await api.post("/billing/checkout", {
        plan: planKey,
        successUrl: `${window.location.origin}/dashboard?upgraded=1`,
        cancelUrl: window.location.href,
      });
      window.location.href = data.url;
    } catch {
      toast.error("Error al iniciar el pago");
      setLoading(null);
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {PLANS.map((plan) => {
        const isCurrent = plan.key === currentPlan;
        return (
          <Card key={plan.key} className={isCurrent ? "border-primary" : ""}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{plan.label}</span>
                {plan.badge && <Badge>{plan.badge}</Badge>}
                {isCurrent && <Badge variant="outline">Actual</Badge>}
              </div>
              <div className="mt-2">
                <span className="text-3xl font-bold">{plan.price === 0 ? "Gratis" : `${plan.price}€`}</span>
                {plan.price > 0 && <span className="text-muted-foreground text-sm">/mes</span>}
              </div>
              <p className="text-xs text-muted-foreground">{plan.description}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className="w-full"
                variant={isCurrent ? "outline" : plan.badge === "Popular" ? "default" : "outline"}
                disabled={plan.disabled || isCurrent || loading === plan.key}
                onClick={() => handleUpgrade(plan.key)}
              >
                {loading === plan.key ? "Redirigiendo..." : isCurrent ? "Plan actual" : plan.cta}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
```

- [ ] **Crear billing/page.tsx**

```typescript
// apps/web/src/app/(dashboard)/billing/page.tsx
import type { Metadata } from "next";
import { PricingCards } from "@/components/billing/pricing-cards";
export const metadata: Metadata = { title: "Planes y facturación" };
export default function BillingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Planes y facturación</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Elige el plan que mejor se adapte a tu empresa
        </p>
      </div>
      <PricingCards />
    </div>
  );
}
```

- [ ] **Añadir "Billing" al nav del sidebar**
En `apps/web/src/components/layout/sidebar.tsx`, añadir a grupo "Sistema":
```typescript
{ href: "/billing", label: "Planes", icon: CreditCard },
```

- [ ] **Commit**
```bash
git add -A
git commit -m "feat: Stripe billing (checkout, portal, webhook) + página de planes"
```

---

## FASE E — Landing page pública

### Task 10: Landing page de marketing

**Files:**
- Create: `apps/web/src/app/(marketing)/layout.tsx`
- Create: `apps/web/src/app/(marketing)/page.tsx` (nueva raíz landing)
- Create: `apps/web/src/components/marketing/hero.tsx`
- Create: `apps/web/src/components/marketing/features.tsx`
- Create: `apps/web/src/components/marketing/pricing-section.tsx`
- Create: `apps/web/src/components/marketing/nav.tsx`
- Create: `apps/web/src/components/marketing/footer.tsx`
- Modify: `apps/web/src/app/page.tsx` (landing en vez de redirect)

- [ ] **Crear (marketing)/layout.tsx**

```typescript
// apps/web/src/app/(marketing)/layout.tsx
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <MarketingNav />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
```

- [ ] **Crear nav.tsx de marketing**

```typescript
// apps/web/src/components/marketing/nav.tsx
"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function MarketingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">E</div>
          ERP SaaS
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <Link href="#features" className="hover:text-foreground transition-colors">Funcionalidades</Link>
          <Link href="#pricing" className="hover:text-foreground transition-colors">Precios</Link>
          <Link href="#verifactu" className="hover:text-foreground transition-colors">VeriFactu</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Iniciar sesión</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/registro">Empezar gratis</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Crear hero.tsx**

```typescript
// apps/web/src/components/marketing/hero.tsx
"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Zap, Globe } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-background pt-20 pb-32">
      {/* Gradient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Badge className="mb-6" variant="outline">
            <Shield className="h-3 w-3 mr-1" />
            VeriFactu listo para 2025 · AEAT certificado
          </Badge>
        </motion.div>

        <motion.h1
          className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        >
          El ERP más moderno para{" "}
          <span className="text-primary">pymes españolas</span>
        </motion.h1>

        <motion.p
          className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        >
          CRM, facturación electrónica, contabilidad y VeriFactu en una sola plataforma.
          Sin complicaciones. Sin letra pequeña.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        >
          <Button size="lg" asChild className="gap-2 text-base px-8">
            <Link href="/registro">
              Empieza gratis
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="#demo">Ver demo</Link>
          </Button>
        </motion.div>

        <motion.div
          className="flex items-center justify-center gap-8 mt-12 text-sm text-muted-foreground"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        >
          {[
            { icon: Shield, text: "VeriFactu certificado" },
            { icon: Zap, text: "14 días gratis" },
            { icon: Globe, text: "Sin permanencia" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-1.5">
              <Icon className="h-4 w-4 text-primary" />
              {text}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
```

- [ ] **Crear features.tsx**

```typescript
// apps/web/src/components/marketing/features.tsx
"use client";
import { motion } from "framer-motion";
import { FileText, Users, BarChart3, Shield, Zap, Calculator, Package, Bell } from "lucide-react";

const features = [
  { icon: FileText, title: "Facturación electrónica", desc: "Crea, envía y cobra facturas. Genera automáticamente el XML VeriFactu para cumplir con la AEAT.", color: "bg-blue-500/10 text-blue-500" },
  { icon: Shield, title: "VeriFactu nativo", desc: "Hash SHA256 en cadena, firma XAdES y envío directo a la AEAT. Cumplimiento total desde el primer día.", color: "bg-purple-500/10 text-purple-500" },
  { icon: Users, title: "CRM integrado", desc: "Gestiona clientes, leads y el pipeline de ventas desde el mismo lugar donde facturas.", color: "bg-emerald-500/10 text-emerald-500" },
  { icon: BarChart3, title: "Pipeline Kanban", desc: "Visualiza y mueve tus oportunidades de venta entre etapas con drag & drop.", color: "bg-amber-500/10 text-amber-500" },
  { icon: Calculator, title: "Contabilidad", desc: "Libro diario, plan de cuentas, cierres y balances. Todo conectado con tus facturas.", color: "bg-red-500/10 text-red-500" },
  { icon: Package, title: "Inventario", desc: "Control de stock, movimientos y alertas de mínimos. Perfecto para negocios con producto físico.", color: "bg-indigo-500/10 text-indigo-500" },
  { icon: Zap, title: "Automatizaciones", desc: "Facturas recurrentes, recordatorios de cobro y flujos automáticos sin tocar nada.", color: "bg-pink-500/10 text-pink-500" },
  { icon: Bell, title: "Notificaciones", desc: "Alertas de vencimientos, pagos recibidos y actividad del equipo en tiempo real.", color: "bg-cyan-500/10 text-cyan-500" },
];

export function Features() {
  return (
    <section id="features" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Todo lo que necesitas en un solo lugar</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Diseñado específicamente para el mercado español. Cumplimiento fiscal total incluido.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div key={f.title}
                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }} viewport={{ once: true }}
                className="bg-background rounded-xl p-5 border border-border"
              >
                <div className={`w-10 h-10 rounded-lg ${f.color} flex items-center justify-center mb-4`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Crear pricing-section.tsx** (reutiliza PricingCards)

```typescript
// apps/web/src/components/marketing/pricing-section.tsx
import { PricingCards } from "@/components/billing/pricing-cards";

export function PricingSection() {
  return (
    <section id="pricing" className="py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Precios transparentes</h2>
          <p className="text-muted-foreground">Sin sorpresas. Sin costes ocultos. Cancela cuando quieras.</p>
        </div>
        <PricingCards />
      </div>
    </section>
  );
}
```

- [ ] **Crear footer.tsx**

```typescript
// apps/web/src/components/marketing/footer.tsx
import Link from "next/link";

export function MarketingFooter() {
  return (
    <footer className="border-t border-border py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 font-bold mb-4">
              <div className="h-6 w-6 rounded bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">E</div>
              ERP SaaS
            </div>
            <p className="text-xs text-muted-foreground">El ERP más moderno para empresas españolas.</p>
          </div>
          {[
            { title: "Producto", links: [{ href: "#features", label: "Funcionalidades" }, { href: "#pricing", label: "Precios" }, { href: "/changelog", label: "Novedades" }] },
            { title: "Legal", links: [{ href: "/privacidad", label: "Privacidad" }, { href: "/terminos", label: "Términos" }, { href: "/cookies", label: "Cookies" }] },
            { title: "Soporte", links: [{ href: "/ayuda", label: "Centro de ayuda" }, { href: "mailto:hola@tusaas.es", label: "Contacto" }] },
          ].map((col) => (
            <div key={col.title}>
              <p className="font-medium text-sm mb-3">{col.title}</p>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-border pt-6 flex items-center justify-between text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} ERP SaaS. Todos los derechos reservados.</span>
          <span>Hecho con ❤️ en España 🇪🇸</span>
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Actualizar apps/web/src/app/page.tsx** (landing en vez de redirect)

```typescript
// apps/web/src/app/page.tsx
import { Hero } from "@/components/marketing/hero";
import { Features } from "@/components/marketing/features";
import { PricingSection } from "@/components/marketing/pricing-section";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <MarketingNav />
      <main className="flex-1">
        <Hero />
        <Features />
        <PricingSection />
      </main>
      <MarketingFooter />
    </div>
  );
}
```

- [ ] **Commit**
```bash
git add -A
git commit -m "feat: landing page completa (hero, features, pricing, footer)"
```

---

## FASE F — Email con Resend

### Task 11: Templates de email

**Files:**
- Create: `apps/api/src/modules/email/email.module.ts`
- Create: `apps/api/src/modules/email/email.service.ts`
- Modify: `apps/api/src/modules/auth/auth.service.ts` (enviar email bienvenida)

- [ ] **Crear email.service.ts**

```typescript
// apps/api/src/modules/email/email.service.ts
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Resend } from "resend";

@Injectable()
export class EmailService {
  private resend: Resend;
  private from: string;

  constructor(private config: ConfigService) {
    this.resend = new Resend(config.get("RESEND_API_KEY"));
    this.from = config.get("EMAIL_FROM", "noreply@tusaas.es");
  }

  async sendWelcome(to: string, firstName: string, companyName: string) {
    if (!this.config.get("RESEND_API_KEY")) return; // skip in dev
    await this.resend.emails.send({
      from: this.from,
      to,
      subject: `Bienvenido a ERP SaaS, ${firstName}!`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px;">
          <div style="background:#6366f1;color:white;width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:18px;margin-bottom:24px;">E</div>
          <h1 style="font-size:24px;font-weight:700;margin:0 0 8px;">Bienvenido, ${firstName}!</h1>
          <p style="color:#6b7280;margin:0 0 24px;">Tu empresa <strong>${companyName}</strong> ya está lista en ERP SaaS.</p>
          <a href="${this.config.get("CLIENT_URL")}/dashboard" style="background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:500;display:inline-block;">
            Acceder al dashboard →
          </a>
          <p style="color:#9ca3af;font-size:12px;margin-top:32px;">Si tienes alguna pregunta, responde a este email.</p>
        </div>
      `,
    });
  }

  async sendInvoiceReminder(to: string, clientName: string, invoiceNumber: string, amount: number, dueDate: string) {
    if (!this.config.get("RESEND_API_KEY")) return;
    await this.resend.emails.send({
      from: this.from,
      to,
      subject: `Recordatorio de pago: Factura ${invoiceNumber}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px;">
          <h1 style="font-size:20px;font-weight:700;margin:0 0 16px;">Recordatorio de pago</h1>
          <p style="color:#374151;">Estimado/a ${clientName},</p>
          <p style="color:#374151;">Le recordamos que tiene pendiente el pago de la factura <strong>${invoiceNumber}</strong> por importe de <strong>${amount.toFixed(2)} €</strong>, con vencimiento el <strong>${dueDate}</strong>.</p>
          <p style="color:#9ca3af;font-size:12px;margin-top:32px;">Este mensaje ha sido enviado automáticamente.</p>
        </div>
      `,
    });
  }
}
```

- [ ] **email.module.ts**

```typescript
// apps/api/src/modules/email/email.module.ts
import { Global, Module } from "@nestjs/common";
import { EmailService } from "./email.service";

@Global()
@Module({ providers: [EmailService], exports: [EmailService] })
export class EmailModule {}
```

- [ ] **Inyectar EmailService en auth.service.ts** y llamar a `sendWelcome` tras registro:
```typescript
// En AuthService.register(), al final antes del return:
await this.email.sendWelcome(user.email, dto.firstName, dto.companyName).catch(() => {});
```

- [ ] **Commit**
```bash
git add -A
git commit -m "feat: email service con Resend (bienvenida + recordatorio pago)"
```

---

## FASE G — Pulido final

### Task 12: Dashboard conectado a datos reales (RecentInvoices + TopClients)

**Files:**
- Modify: `apps/api/src/modules/dashboard/dashboard.service.ts`
- Modify: `apps/web/src/components/dashboard/recent-invoices.tsx`
- Modify: `apps/web/src/components/dashboard/top-clients.tsx`

- [ ] **Añadir endpoints al dashboard service**

```typescript
// En DashboardService, añadir:
async getRecentInvoices(companyId: string) {
  return this.prisma.invoice.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { client: { select: { id: true, name: true, cifNif: true } } },
  });
}

async getTopClients(companyId: string) {
  return this.prisma.client.findMany({
    where: { companyId, isActive: true },
    orderBy: { totalBilled: "desc" },
    take: 5,
    include: { _count: { select: { invoices: true } } },
  });
}
```

- [ ] **Añadir endpoints al DashboardController**

```typescript
@Get("recent-invoices")
getRecentInvoices(@CurrentUser() user: JwtPayload) {
  return this.dashboardService.getRecentInvoices(user.companyId);
}

@Get("top-clients")
getTopClients(@CurrentUser() user: JwtPayload) {
  return this.dashboardService.getTopClients(user.companyId);
}
```

- [ ] **Actualizar hooks**

```typescript
// En apps/web/src/hooks/use-dashboard.ts, añadir:
export function useRecentInvoices() {
  return useQuery({
    queryKey: ["dashboard", "recent-invoices"],
    queryFn: () => api.get("/dashboard/recent-invoices").then((r) => r.data),
  });
}

export function useTopClients() {
  return useQuery({
    queryKey: ["dashboard", "top-clients"],
    queryFn: () => api.get("/dashboard/top-clients").then((r) => r.data),
  });
}
```

- [ ] **Actualizar RecentInvoices y TopClients** para usar hooks reales en vez de datos hardcodeados

- [ ] **Commit final de la sesión**
```bash
git add -A
git commit -m "feat: dashboard 100% conectado a API real + pulido final"
```

---

## Resumen de archivos creados/modificados

| Fase | Archivos | Estado |
|------|----------|--------|
| A - Auth | middleware.ts, lib/auth.ts, register page | ⬜ |
| B - Detalle | facturas/[id], clientes/[id], ui/tabs | ⬜ |
| C - Módulos | leads (B+F), quotes (B+F), empresa, configuración | ⬜ |
| D - Stripe | billing module, pricing-cards, billing page | ⬜ |
| E - Landing | hero, features, pricing, nav, footer | ⬜ |
| F - Email | email module con Resend | ⬜ |
| G - Pulido | dashboard conectado 100% | ⬜ |

**Total estimado:** ~45 archivos nuevos/modificados · ~4.000 líneas de código adicionales
