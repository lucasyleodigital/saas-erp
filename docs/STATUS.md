# SaaS ERP — Estado del Proyecto
> Última actualización: 2026-06-11

## Stack
- **Frontend**: Next.js 15.5.19, shadcn/ui, TanStack Query v5, Zustand, Recharts
- **Backend**: NestJS 10, Prisma 6, PostgreSQL (Supabase eu-west-1)
- **Monorepo**: Turborepo + pnpm workspaces
- **Deploy**: Vercel (web) + Railway (API)

## URLs de producción
| Servicio | URL |
|----------|-----|
| Web (Vercel) | https://saas-erp-pi.vercel.app |
| API (Railway) | https://saasapi-production-b5f3.up.railway.app/api/v1 |
| Supabase | proyecto `eqqjbqlewmpoxjlhbrwz` (eu-west-1) |
| GitHub | https://github.com/lucasyleodigital/saas-erp |

## Cuentas y accesos
- **Vercel**: cuenta `polchu2899s-projects` (Hobby) — commits deben ir con email `lucasyleodigital@gmail.com`
- **Railway**: proyecto `saas-erp`, servicio `@saas/api`
- **Supabase**: proyecto `eqqjbqlewmpoxjlhbrwz`
- **GitHub org**: `lucasyleodigital` — repo `saas-erp` (público)
- **Git config local**: user.email = `lucasyleodigital@gmail.com` / user.name = `lucasyleodigital`

## Notas importantes de deploy
- **Vercel**: hacer push con email `lucasyleodigital@gmail.com` en git config — si no, bloquea el deploy
- **Railway watchPath**: el servicio `@saas/api` solo redespliega si cambian ficheros en `/apps/api/**`
- **PATs de GitHub**: revocar todos los usados en https://github.com/settings/tokens (los del historial de esta sesión)

---

## ✅ COMPLETADO

### Infraestructura
- [x] Monorepo Turborepo + pnpm workspaces
- [x] `packages/types` — tipos compartidos
- [x] `packages/database` — Prisma client + schema completo (30+ modelos)
- [x] `packages/ui` — componentes shadcn/ui
- [x] `packages/config` — Tailwind config compartida
- [x] Deploy API → Railway (Dockerfile multi-stage)
- [x] Deploy Web → Vercel (root dir: apps/web)
- [x] GitHub repo público en `lucasyleodigital/saas-erp`

### Backend (NestJS API)
- [x] Auth: JWT (7d) + refresh token (30d, cookie httpOnly) + bcrypt + 2FA + Google OAuth skeleton
- [x] Rate limiting global: 20 req/s, 200 req/min (ThrottlerGuard)
- [x] Rate limiting auth: login 10/min, registro 5/min (brute force protection)
- [x] SSRF protection en webhooks de automatizaciones
- [x] Módulos: clients, invoices, quotes, products, leads, deals/pipeline
- [x] Módulos: dashboard, companies, users, notifications, inventory
- [x] Módulos: accounting, automations, billing (Stripe), email (Resend), VeriFactu skeleton
- [x] ValidationPipe global (whitelist + forbidNonWhitelisted)
- [x] Helmet (cabeceras de seguridad)
- [x] CORS: solo acepta CLIENT_URL
- [x] Cookies cross-domain: SameSite=None en producción
- [x] Health check en `/health`
- [x] Swagger desactivado en producción

### Frontend (Next.js)
- [x] Auth: login, registro, cookie `auth_session` para middleware
- [x] Middleware: protección de rutas con cookie session
- [x] Dashboard: KPIs, gráficas ingresos, facturas recientes, top clientes, funnel deals
- [x] Clientes: lista paginada, búsqueda, detalle con historial
- [x] Facturas: lista, filtros por estado, detalle, registro de pagos
- [x] Presupuestos: CRUD completo
- [x] Productos: catálogo con precios y stock
- [x] Pipeline CRM: Kanban con drag (deals por etapas)
- [x] Leads: lista + gestión
- [x] Inventario: stock, movimientos, almacenes
- [x] Contabilidad: P&L, IVA trimestral, asientos, plan de cuentas
- [x] Automatizaciones: motor trigger→acción (email/notificación/webhook)
- [x] Notificaciones: centro de notificaciones con badge
- [x] Empresa: configuración de empresa
- [x] Configuración: perfil usuario, cambio contraseña
- [x] Billing: checkout Stripe, portal cliente

---

## 🔴 PENDIENTE — Por fases

### FASE 3 — Servicios externos (PRÓXIMO)
- [ ] **Resend email**: crear cuenta nueva → verificar dominio → añadir RESEND_API_KEY en Railway
  - EMAIL_FROM = `ERP SaaS <noreply@TUDOMINIO.com>`
- [ ] **Stripe**: crear cuenta → obtener keys prod → configurar webhook → añadir en Railway
  - Variables: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_STARTER, STRIPE_PRICE_PRO, STRIPE_PRICE_ENTERPRISE
- [ ] **Google OAuth**: Google Cloud Console → OAuth 2.0 → añadir GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET en Railway

### FASE 4 — VeriFactu (cumplimiento legal España)
- [ ] Integración real con AEAT (endpoint de envío de facturas)
- [ ] Generación de hash SHA-256 de cada factura
- [ ] Encadenamiento de facturas (cada una referencia la anterior)
- [ ] Almacenamiento del QR VeriFactu en factura
- [ ] PDF de factura con QR incluido

### FASE 5 — Robustez y UX
- [ ] **RBAC**: aplicar roles (OWNER/ADMIN/MEMBER) en endpoints de API
- [ ] **Seed datos demo**: cuando un usuario se registra, crear datos de ejemplo
- [ ] **Cron job**: limpiar refresh tokens expirados de la BD
- [ ] **Onboarding**: wizard primer uso (configurar empresa, serie de facturas, primer cliente)
- [ ] **PDF de facturas**: generar PDF descargable (puppeteer o react-pdf)
- [ ] **Envío de facturas**: botón "Enviar por email" en factura (ya tiene endpoint, falta Resend)
- [ ] **Exportar a Excel**: facturas, clientes, contabilidad

### FASE 6 — Dominio y SEO
- [ ] Dominio propio (apuntar DNS a Vercel)
- [ ] Landing page mejorada (pricing real, testimonios, demo)
- [ ] Actualizar CLIENT_URL en Railway con dominio definitivo

### FASE 7 — Escala (cuando crezcáis)
- [ ] Redis para caché (Railway Add-on)
- [ ] BullMQ para cola de tareas (automations async)
- [ ] Múltiples instancias API (Railway scale)
- [ ] Backup automático de BD

---

## Variables de entorno

### Railway (@saas/api)
```
DATABASE_URL=postgresql://postgres.eqqjbqlewmpoxjlhbrwz:wEPKjHuTMGWjjBnJ@aws-0-eu-west-1.pooler.supabase.com:5432/postgres
JWT_SECRET=<generado>
JWT_REFRESH_SECRET=<generado>
PORT=3001
NODE_ENV=production
CLIENT_URL=https://saas-erp-pi.vercel.app
RESEND_API_KEY=<pendiente>
EMAIL_FROM=<pendiente>
STRIPE_SECRET_KEY=<pendiente>
STRIPE_WEBHOOK_SECRET=<pendiente>
STRIPE_PRICE_STARTER=<pendiente>
STRIPE_PRICE_PRO=<pendiente>
STRIPE_PRICE_ENTERPRISE=<pendiente>
GOOGLE_CLIENT_ID=<pendiente>
GOOGLE_CLIENT_SECRET=<pendiente>
```

### Vercel (web)
```
NEXT_PUBLIC_API_URL=https://saasapi-production-b5f3.up.railway.app/api/v1
```

---

## Arquitectura multi-tenant
Cada query filtra siempre por `companyId` extraído del JWT — nunca de la URL.
El usuario no puede acceder a datos de otra empresa aunque manipule IDs.

## Prisma schema — modelos principales
Company → User (many-to-many via UserCompany)
Company → Client → Invoice → InvoiceItem
Company → Client → Quote → QuoteItem
Company → Product → StockMovement
Company → Deal (pipeline CRM)
Company → Lead
Company → Automation
Company → Notification
Company → JournalEntry (contabilidad)
Company → Warehouse → Stock
RefreshToken → User (con revocación)
InvoiceVerifactu → Invoice (cumplimiento AEAT)
