# YouWhole SaaS-ERP — Contexto Maestro
> Última actualización: 2026-08-03

---

## 1. QUIÉN ES EL CLIENTE / QUÉ ES EL PROYECTO

- **Producto propio** de Alex Lucas Torrubia (autónomo, nombre comercial: Lucas y Leo Digital)
- **Qué es:** ERP SaaS para autónomos y pymes españolas. Compite directamente con Holded y Billin.
- **Dominio producción:** https://youwhole.com (también accesible en https://saas-erp-pi.vercel.app)
- **Estado:** En producción. Clientes reales. No romper nada sin probar.
- **Email contacto:** lucasyleodigital@gmail.com
- **Datos fiscales responsable:** Alex Lucas Torrubia, NIF 41003566V, Carrer del Progrés 27 bz. 28, 08850 Gavà (Barcelona). Autónomo — sin Registro Mercantil.

---

## 2. ESTRUCTURA DEL PROYECTO

**Ruta local:** `C:\Users\polch\Desktop\PROYECTOS\SaaS-ERP`

```
SaaS-ERP/
├── apps/
│   ├── api/                        NestJS 10 — backend REST
│   │   └── src/
│   │       ├── modules/
│   │       │   ├── auth/           JWT + refresh tokens
│   │       │   ├── meetings/       Módulo reuniones/actas (meetings.service.ts, meetings.controller.ts)
│   │       │   ├── invoices/       Facturas + calendar.controller.ts (eventos calendario)
│   │       │   ├── products/       Productos + importBulk() para CSV masivo
│   │       │   ├── email/          EmailModule (@Global) — Resend. sendGeneric()
│   │       │   ├── verifactu/      Firma XAdES-BES + SOAP AEAT
│   │       │   ├── billing/        Stripe + webhooks
│   │       │   └── ...
│   │       ├── database/
│   │       │   ├── prisma.service.ts
│   │       │   └── tenant.interceptor.ts   SET LOCAL app.current_company_id
│   │       ├── decimal.interceptor.ts      Convierte Prisma Decimal → float
│   │       └── main.ts
│   └── web/                        Next.js 15 App Router — frontend
│       └── src/
│           ├── app/
│           │   ├── layout.tsx               lang="es", meta description 140 chars
│           │   ├── [locale]/(dashboard)/    Rutas protegidas con locale
│           │   ├── privacidad/page.tsx      Política privacidad — datos reales
│           │   ├── terminos/page.tsx        T&C — datos reales (autónomo)
│           │   ├── aviso-legal/page.tsx     Aviso legal — datos reales
│           │   └── cookies/page.tsx
│           ├── components/
│           │   ├── assistant/
│           │   │   └── help-data.ts         FAQ del asistente (17 categorías)
│           │   ├── calendar/
│           │   │   └── calendar-view.tsx    AutoEventType incluye "MEETING" (teal)
│           │   ├── products/
│           │   │   └── import-products-dialog.tsx   CSV drag-and-drop
│           │   └── layout/
│           │       ├── update-banner.tsx    Poll /api/version cada 5min
│           │       └── impersonation-banner.tsx
│           └── hooks/
│               └── use-products.ts          useImportProducts() mutation
├── packages/
│   ├── database/
│   │   └── rls-policies.sql        RLS completo — ejecutar en Supabase SQL Editor
│   ├── @saas/types/
│   └── @saas/ui/
├── presentacion-youwhole.html      Presentación comercial standalone (logos base64)
└── CONTEXT_MAESTRO.md              Este archivo
```

**Archivos que NO tocar / NO subir:**
- `.env` — credenciales locales
- `node_modules/`
- `.next/`
- Cualquier archivo con tokens o secrets en texto plano

---

## 3. INFRAESTRUCTURA Y SERVICIOS

| Servicio | Uso | Detalles |
|----------|-----|----------|
| **Vercel** | Frontend hosting | Account: `lucasyleo-projects`. Auto-deploy desde GitHub `master`. |
| **Railway** | API hosting | Proyecto: `glistening-balance`. URL: `https://saasapi-production-b5f3.up.railway.app`. Trial agotado — necesita plan Hobby ($5/mes). |
| **Supabase** | PostgreSQL | BD principal. RLS activado. Proyecto: `saas-erp` (rama `main`, PRODUCTION). |
| **Resend** | Emails transaccionales | `EmailModule` global en NestJS. Método `sendGeneric()`. |
| **Stripe** | Pagos | Necesita `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` en Railway. |
| **GitHub** | Repositorio | `https://github.com/lucasyleodigital/saas-erp.git`, rama `master`. |

**Push manual (cuando el email de GitHub bloquea):**
```
git push https://lucasyleodigital:<PAT>@github.com/lucasyleodigital/saas-erp.git master
```
⚠️ Nunca commitear el PAT. Si GitHub bloquea por email privado: Settings > Emails > desactivar "Block command line pushes".

**Env vars críticas en Railway:**
- `PLATFORM_ADMIN_EMAILS` — emails super-admin (antes hardcoded, ahora env var)
- `CERT_ENCRYPTION_KEY` — cifrado certificados VeriFactu (sin fallback — si falta, crashes)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

---

## 4. ARQUITECTURA Y FLUJO DE DATOS

**Stack completo:**
- Monorepo: Turborepo + pnpm workspaces
- Frontend: Next.js 15 App Router + TanStack Query v5
- Backend: NestJS 10 + Prisma 6 + PostgreSQL (Supabase)
- i18n: next-intl con `localePrefix: "always"` — rutas siempre como `/es/facturas`, `/ca/clients`

**Flujo autenticación:**
1. Login → JWT access token + refresh token
2. Frontend guarda como `access_token` en localStorage (⚠️ NO `accessToken` — ese fue un bug)
3. TenantInterceptor en API extrae companyId del JWT → `SET LOCAL app.current_company_id`
4. RLS en Supabase filtra automáticamente por companyId

**Flujo calendario:**
- `GET /calendar/events?from=&to=` en `calendar.controller.ts`
- Hace `Promise.all([invoices, quotes, meetings])` — las tres fuentes
- Meetings devueltos como `{ type: "MEETING", readonly: true, meetingId: m.id }`
- Frontend: `AUTO_STYLE.MEETING = { dot: "bg-teal-600", bg: "bg-teal-50", label: "Reunión" }`

**Flujo emails (reuniones):**
- Al crear reunión → `meetings.service.ts` filtra participantes con `EMAIL_RE`
- Envía `sendGeneric()` por cada participante
- Todo en try/catch — errores de email NO rompen el guardado de la reunión

**PDF doble:**
- Client-side: `@react-pdf/renderer` en `apps/web/src/lib/pdf/invoice-pdf.tsx` (descarga en UI)
- Server-side: `pdfkit` en `apps/api` vía `invoice-pdf.generator.ts` (adjunto en emails)
- `downloadInvoicePdf` hace fetch paralelo de `/invoices/:id` + `/companies/me`

**React Query config global:**
- `staleTime: 5min`, `gcTime: 30min`, `refetchOnMount: false`
- ⚠️ Los list hooks (clientes, facturas, productos) overriden a `refetchOnMount: true`
- ⚠️ Usar `removeQueries` en lugar de `invalidateQueries` después de imports masivos

---

## 5. INTERNACIONALIZACIÓN

- **5 idiomas:** `es` (fuente de verdad), `ca`, `eu`, `gl`, `en`
- **~1500+ claves por idioma** en `apps/web/src/messages/`
- **Rutas siempre con locale:** `/es/facturas`, NO `/facturas` — router.push debe incluir `/${locale}/`
- PDFs de facturas: 5 idiomas en `invoice-pdf.generator.ts`

**Pendiente i18n (no crítico):**
- `currency-selector.tsx` — nombres de monedas
- `language-selector.tsx` — nombres de idiomas
- `demo-section.tsx`, `chat-widget.tsx`, `pricing-cards.tsx` — contenido marketing
- Toast messages en hooks (requiere refactor mayor)

---

## 6. TODOS LOS BUGS CORREGIDOS

### 2026-06-22 — Bugs críticos iniciales

| Bug | Causa raíz | Fix | Archivo |
|-----|-----------|-----|---------|
| HTTP 500 en /clients y /invoices | `page`/`limit` llegan como string desde HTTP, Prisma rechaza strings en `take`/`skip` | `Number(params.page) \|\| 1` en todos los servicios | 8 archivos de servicios |
| NaN en precios | `ClassSerializerInterceptor` + `instanceToPlain()` convierte Prisma `Decimal` a `{}` | `DecimalInterceptor` global, eliminado `ClassSerializerInterceptor` | `apps/api/src/decimal.interceptor.ts` |
| Datos no visibles tras importar | `refetchOnMount: false` + `invalidateQueries` no fuerza refetch | `refetchOnMount: true` + `removeQueries` en import hook | hooks de lista |

### 2026-06-24 — Audit de funcionalidad

| Bug | Causa raíz | Fix |
|-----|-----------|-----|
| XSS en /api/contact | Inputs sin escapar en HTML de emails | Función `esc()` con HTML entity encoding |
| SEPA siempre 401 | payroll-view usaba `accessToken` pero la app guarda `access_token` | Cambiado a `access_token` |
| Calendario siempre mostraba mes actual | Hook enviaba `month/year`, backend espera `from/to` ISO | Parámetros corregidos |
| API 404 si falta env var | 4 archivos usaban `http://localhost:3001` sin `/api/v1` | URLs corregidas |
| Quick-actions rotos en dashboard | 3/4 botones apuntaban a rutas sin locale | Rutas corregidas con `/${locale}/` |
| GPS bloqueado | `Permissions-Policy: geolocation=()` bloqueaba | Cambiado a `geolocation=(self)` |
| Login empleado fallaba | `isDefault` mal en `UserCompany` | Auto-corrección al login |

### 2026-08-01 — Módulo reuniones

| Bug | Causa raíz | Fix | Archivo |
|-----|-----------|-----|---------|
| Reunión se guardaba pero daba HTTP 500 | Email `Promise.all` sin try/catch lanzaba excepción tras write OK | Envío email en try/catch independiente | `meetings.service.ts` |
| Reuniones no aparecían en calendario | Dos sistemas separados (CalendarEntry vs Meeting) | `calendar.controller.ts` añade `prisma.meeting.findMany()` al `Promise.all` | `calendar.controller.ts` |
| Build Vercel fallaba | `lines[0]` posiblemente undefined (TS strict) | `(lines[0] ?? "").split(...)` | `import-products-dialog.tsx` |
| Build Vercel fallaba | `title` prop en SVG Lucide icon | `<span title={p.error}><AlertCircle /></span>` | `import-products-dialog.tsx` |

### 2026-08-03 — RLS Supabase

| Bug | Causa raíz | Fix |
|-----|-----------|-----|
| `meetings` sin RLS | Tabla nueva no estaba en el script | `ALTER TABLE meetings ENABLE ROW LEVEL SECURITY` + policy |
| `shift_assignments` sin policy | RLS activo pero sin política | Policy con `company_id` (snake_case, no `"companyId"`) |
| 3 warnings Security Advisor | `current_company_id()` sin `SET search_path` + ejecutable por anon | Recrear función + `REVOKE EXECUTE FROM PUBLIC/anon/authenticated` |

---

## 7. CÓMO DESPLEGAR

**Deploy automático (habitual):**
```bash
git add <archivos>
git commit -m "mensaje"
git push origin master
```
Vercel detecta el push y despliega el frontend automáticamente (~2min).

**Railway (API):**
- También se despliega solo desde GitHub push a `master`
- ⚠️ Si Railway trial expiró, el deploy falla — necesita plan Hobby ($5/mes)

**RLS Supabase (solo cuando hay tablas nuevas):**
1. Abrir Supabase > SQL Editor
2. Ejecutar el contenido de `packages/database/rls-policies.sql`
3. Verificar en Security Advisor que no hay errores

**Verificar deploy:**
- Abrir https://saas-erp-pi.vercel.app
- Comprobar que la funcionalidad cambiada funciona
- Revisar Vercel dashboard si hay build errors

⚠️ NUNCA subir manualmente archivos al servidor — todo va por git.
⚠️ NUNCA commitear `.env`, tokens, o el PAT de GitHub.

---

## 8. GOTCHAS Y TRAMPAS CONOCIDAS

| Trampa | Detalle / Cómo evitarla |
|--------|------------------------|
| `PaginationParams` es interfaz TS, no clase | NestJS `ValidationPipe` no transforma query params. Siempre `Number(params.page) \|\| 1` en servicios. |
| Prisma `Decimal` → `{}` | `instanceToPlain()` rompe Decimal. Usar `DecimalInterceptor` global, nunca `ClassSerializerInterceptor`. |
| localStorage key: `access_token` | La app guarda `access_token` (con guión bajo). Nunca `accessToken` (camelCase). |
| Rutas Next.js sin locale | Siempre `router.push(\`/${locale}/ruta\`)`. Sin locale → redirect 302 silencioso. |
| `invalidateQueries` no refresca datos stale | Usar `removeQueries` + `refetchOnMount: true` en list hooks tras mutations importantes. |
| `EmailModule` es `@Global()` | No hace falta importarlo en módulos hijos. Solo inyectar `EmailService` en constructor. |
| VeriFactu: facturas emitidas no se pueden borrar | Solo DRAFT/CANCELLED sin registro VeriFactu se pueden eliminar. Las SENT/PAID solo se cancelan. |
| `shift_assignments` usa `company_id` snake_case | A diferencia del resto de tablas (que usan `"companyId"` camelCase), esta tabla usa `company_id`. Las políticas RLS deben usar el nombre correcto. |
| `current_company_id()` en Supabase | Función helper para RLS. Si no existe, las políticas fallan con `42883`. Crearla antes de las políticas. |
| Memoria de Claude puede estar desactualizada | Siempre verificar estado real en código antes de asumir que algo está "pendiente" o "completado". |
| GitHub bloquea push por email privado | Ir a GitHub Settings > Emails > desactivar "Block command line pushes that expose my email address". |

---

## 9. DECISIONES ARQUITECTÓNICAS

| Decisión | Razón | Alternativa descartada |
|----------|-------|----------------------|
| PDF client-side con `@react-pdf/renderer` | Generación instantánea sin servidor, preview en navegador | Server-side solo — más lento, sin preview |
| PDF server-side con `pdfkit` para emails | `@react-pdf/renderer` no funciona en Node.js (usa Canvas API) | Enviar PDF sin adjunto — peor UX |
| `DecimalInterceptor` en lugar de `ClassSerializerInterceptor` | Prisma `Decimal` se serializa como `{}` con `instanceToPlain()` | Convertir en cada servicio manualmente — repetitivo y propenso a olvidarse |
| `removeQueries` en lugar de `invalidateQueries` | `invalidateQueries` marca stale pero no fuerza refetch si `refetchOnMount: false` | Cambiar config global de React Query — afectaría a toda la app |
| `EmailModule` como `@Global()` | Se usa en múltiples módulos (meetings, invoices, auth...) sin necesitar importar en cada uno | Importar en cada módulo — boilerplate innecesario |
| Emails de reunión en try/catch independiente | El guardado en BD no debe fallar por un error de email externo | Sin try/catch — HTTP 500 aunque el dato se guardó |
| RLS con `current_company_id()` helper function | Centraliza la lógica de tenant en un lugar. Fail-closed: sin variable → string vacío → 0 rows | Chequeo en cada policy inline — más difícil de mantener |
| `REVOKE EXECUTE ON FUNCTION` a anon/authenticated | La función no debe ser llamable directamente via PostgREST `/rpc/` — solo internamente por RLS | Dejar ejecutable — expone la función a usuarios no autenticados |
| FAQ estática en asistente (`help-data.ts`) | Sin coste de API, funciona offline, mantenible como código | Claude API en tiempo real — usuario no quería el coste |
| 5 idiomas: es/ca/eu/gl/en | Mercado español multilingüe, diferenciador vs Holded | Solo español + inglés — pierde cuota en País Vasco y Cataluña |

---

## 10. SEGURIDAD

**Capas implementadas (defense-in-depth):**
1. **PostgreSQL RLS** — `packages/database/rls-policies.sql` — ejecutado en Supabase
2. **TenantInterceptor** — `apps/api/src/database/tenant.interceptor.ts` — `SET LOCAL app.current_company_id`
3. **SanitizePipe global** — `apps/api/src/common/pipes/sanitize.pipe.ts` — strip HTML + control chars. ⚠️ Ignora `Buffer`/`ArrayBuffer` (para no corromper uploads)
4. **ValidationPipe** — whitelist + forbidNonWhitelisted + transform
5. **ThrottlerModule** — rate limiting global + específico en auth/password
6. **Helmet + HSTS** — security headers en API y frontend
7. **SSRF protection** — `webhooks.service` bloquea localhost/IPs internas

**Estado RLS en Supabase (2026-08-03):**
- Security Advisor: 0 errores, 0 warnings, 0 suggestions
- `meetings` y `shift_assignments` añadidas con políticas correctas
- `current_company_id()` con `SET search_path = public` + `REVOKE EXECUTE FROM PUBLIC`

---

## 11. MÓDULOS Y FEATURES — ESTADO COMPLETO

### Completado al 100%

| Módulo | Estado |
|--------|--------|
| Facturación (facturas, presupuestos, albaranes, pedidos) | Completo |
| CRM (clientes, leads, pipeline, proyectos) | Completo |
| Contabilidad (P&G, IVA, Modelo 303/130/347, libro diario, plan cuentas) | Completo |
| Banco (import extracto CSV/Excel, auto-conciliación) | Completo |
| Inventario (stock, almacenes, alertas, valoración) | Completo |
| Empleados + Nóminas | Completo |
| Control horario (fichaje GPS, QR, vista semanal, portal empleado) | Completo |
| VeriFactu (hash chain, QR, firma XAdES-BES, SOAP) | Completo excepto test con cert FNMT real |
| Proveedores + órdenes de compra | Completo |
| Automatizaciones | Completo (UI + backend) |
| Reuniones/Actas | Completo (CRUD + email invitaciones + calendario) |
| Importación CSV productos | Completo (drag-drop, preview, bulk create) |
| Pipeline rename/delete columnas | Completo |
| Multi-divisa (20 divisas, BCE) | Completo |
| Multi-idioma facturas PDF (5 idiomas) | Completo |
| PWA instalable | Completo |
| Audit log | Completo |
| Multiempresa backend | Completo |
| Filtros avanzados (6 módulos) | Completo |
| Páginas legales con datos reales | Completo (agosto 2026) |
| Asistente FAQ estática | Completo (17 categorías, actualizado agosto 2026) |
| SEO básico (lang, meta description) | Completo |

### Parcial / Pendiente (prioridad alta)

| Feature | Qué falta |
|---------|-----------|
| VeriFactu AEAT | Probar con certificado FNMT real en preproducción AEAT |
| Campos personalizados | Backend OK, UI gestión OK. Falta integrar en formularios cliente/factura/producto |
| Company switching UI | Backend multiempresa listo, falta selector en header/sidebar |
| Backup | Export JSON funciona, falta: persistir registros, restauración, programación |

### Pendiente (prioridad baja — requieren decisión o servicios externos)

| Feature | Bloqueo |
|---------|---------|
| OCR tickets/gastos | Necesita Google Vision o Claude vision API (coste) |
| WhatsApp Business | Necesita cuenta Meta Business verificada |
| IA asistente tiempo real | Usuario decidió no pagar por ahora |
| Roles granulares | Solo 4 roles actualmente |
| Libro facturas AEAT | Formato oficial emitidas/recibidas |
| i18n marketing (landing) | demo-section, pricing-cards, chat-widget |

---

## 12. ASISTENTE / HELP-DATA

Archivo: `apps/web/src/components/assistant/help-data.ts`

**17 categorías actuales:**
1. Primeros pasos
2. Clientes
3. Leads
4. Pipeline de ventas (incluye: renombrar/eliminar columnas)
5. Facturas
6. Presupuestos
7. Pedidos de clientes
8. Albaranes
9. Productos y servicios (incluye: importar CSV)
10. Contabilidad
11. Banco
12. Compras a proveedores
13. Inventario
14. Empleados y RRHH
15. Proyectos
16. VeriFactu
17. Automatizaciones
18. Configuración
19. Control horario
20. Portal del empleado
21. **Reuniones y actas** (añadida agosto 2026)

---

## 13. DATOS DE PRUEBA EN BD (a limpiar)

- 11 clientes (deberían ser 3) — de múltiples pruebas de importación
- 4 facturas (deberían ser 2)
- Facturas basura: las de nombre "2026-06-20T08:14:18.360Z" y "2.0" (estado CANCELLED — se pueden borrar)
- Limpiar manualmente con menú 3 puntos → Eliminar en la app

---

## 14. HISTORIAL DE SESIONES

| Fecha | Qué se hizo |
|-------|------------|
| 2026-06-22 | Bugs críticos: HTTP 500 paginación, NaN precios Decimal, refetch datos. Tier 1-4 features. PDF adjunto emails. Soporte autónomos (IRPF, Modelo 130). |
| 2026-06-24 | Audit seguridad: XSS contact form, SEPA 401, calendario params, quick-actions, GPS policy. RLS script inicial. |
| 2026-06-28 | Control horario completo (GPS, QR, portal empleado, vista semanal). Legal (RGPD Art. 28, planes). |
| 2026-06-29 | Audit i18n completo: 7 commits, 9 componentes principales. Calendario verificado completo. |
| 2026-07-05 | Filtros avanzados 6 módulos. UpdateBanner, ImpersonationBanner. Presentación comercial HTML standalone. i18n notificaciones. |
| 2026-08-01 | Módulo reuniones (CRUD + email invitaciones + calendario). Importación CSV masiva productos. Pipeline rename/delete columnas. SEO Bing (lang + description). Recuperación 2FA Vercel. |
| 2026-08-03 | Páginas legales con datos fiscales reales. Asistente actualizado (21 categorías). RLS Supabase: meetings, shift_assignments, current_company_id() hardened. |

---

## CÓMO CONTINUAR EN LA PRÓXIMA SESIÓN

Al inicio de la próxima conversación, di a Claude:

> "Lee el archivo CONTEXT_MAESTRO.md en C:\Users\polch\Desktop\PROYECTOS\SaaS-ERP y continúa el trabajo de YouWhole SaaS-ERP desde donde lo dejamos."

Claude leerá el archivo y estará al día sin que tengas que explicar nada.
