# SaaS ERP - Estado del Proyecto
> Ultima actualizacion: 2026-06-12

---

## Stack tecnico
| Capa | Tecnologia |
|---|---|
| Frontend | Next.js 15.5.19, shadcn/ui, TanStack Query v5, Framer Motion |
| Backend | NestJS 10, Prisma 6, PostgreSQL (Supabase eu-west-1) |
| Monorepo | Turborepo + pnpm workspaces |
| Deploy Web | Vercel (saas-erp-pi.vercel.app) |
| Deploy API | Railway (saasapi-production-b5f3.up.railway.app) |
| i18n | next-intl v4 - 6 idiomas: es, en, fr, de, pt, it |

## URLs de produccion
| Web | https://saas-erp-pi.vercel.app |
| API | https://saasapi-production-b5f3.up.railway.app/api/v1 |
| GitHub | https://github.com/lucasyleodigital/saas-erp |

## Accesos importantes
- Git: user.email = lucasyleodigital@gmail.com
- Git PAT activo: ghp_<ver-en-local-no-subir-a-git>
- Empresa "Lucas y leo digital" en BD plan ENTERPRISE (para tests)

---

## COMPLETADO

### Infraestructura
- [x] Monorepo Turborepo + pnpm (packages/types, database, ui, config)
- [x] Prisma schema completo (35+ modelos, multi-tenant por companyId)
- [x] Deploy API -> Railway (Dockerfile multi-stage, watchPath /apps/api/**)
- [x] Deploy Web -> Vercel (auto-deploy desde master)
- [x] Multi-idioma: next-intl, 6 locales, middleware, [locale] routing, force-dynamic
- [x] Sistema de planes (FREE/STARTER/PRO/ENTERPRISE) con limites por recurso
- [x] Multi-tenant: toda query filtra por companyId del JWT

### Backend - Modulos completados
- [x] auth (JWT + refresh httpOnly + bcrypt + Google OAuth)
- [x] companies, users, plans
- [x] clients, invoices (con VeriFactu), quotes, products
- [x] leads, deals (pipeline CRM)
- [x] dashboard, notifications, inventory, accounting
- [x] automations (trigger-accion con SSRF protection)
- [x] billing (Stripe skeleton), email (Resend skeleton), verifactu
- [x] Rate limiting, Helmet, CORS, ValidationPipe, health check

### Frontend - Vistas completadas
- [x] Login / Registro
- [x] Dashboard: KPIs, grafica ingresos, facturas recientes, top clientes, funnel
- [x] Clientes: lista paginada, busqueda, detalle con historial
- [x] Facturas: lista+filtros, detalle completo, registro de pagos, VeriFactu
- [x] Presupuestos: CRUD completo, conversion a factura
- [x] Productos: catalogo, tipos, precio + IVA
- [x] Pipeline CRM: Kanban drag and drop
- [x] Leads: lista + gestion
- [x] Inventario: stock, movimientos, almacenes
- [x] Contabilidad: P&L, IVA trimestral, asientos, plan de cuentas
- [x] Automatizaciones: trigger-accion, templates, edit mode, plan upgrade wall
- [x] VeriFactu: vista registros hash/QR/stats, generacion desde detalle factura
- [x] Notificaciones: centro con badge no leidas
- [x] Empresa, Configuracion, Billing skeleton
- [x] Sidebar: colapsable, traducido, badge notificaciones

---

## PENDIENTE - ROADMAP

### FASE 5 - Multi-usuario [SIGUIENTE] [ALTA PRIORIDAD]
Sin esto el 80% de las PYMEs no pueden usarlo (tienen equipo).

- [ ] Invitar miembros al equipo (email + rol) con link de invitacion
- [ ] Gestion de miembros: ver equipo, cambiar roles, revocar acceso (en /empresa)
- [ ] Roles: OWNER / ADMIN / MEMBER / VIEWER
- [ ] RBAC en API: guards por rol en endpoints sensibles
- [ ] Limite maxUsers aplicado al invitar nuevos miembros
- [ ] Vista: miembros activos + invitaciones pendientes

### FASE 5b - Resend email [ALTA PRIORIDAD]
Necesario para invitaciones de equipo y envio de facturas.

- [ ] Crear cuenta Resend con lucasyleodigital@gmail.com
- [ ] Verificar dominio lucasyleodigital.com (SPF, DKIM, DMARC)
- [ ] Obtener API key -> anadir RESEND_API_KEY en Railway
- [ ] EMAIL_FROM = ERP SaaS noreply@lucasyleodigital.com
- [ ] Activar envio de facturas por email (endpoint ya existe)
- [ ] Email de bienvenida al registrarse

### FASE 6 - Albaranes [MEDIA-ALTA PRIORIDAD]
Abre mercado: distribucion, retail, hosteleria, construccion.

- [ ] Modelo Prisma: DeliveryNote + DeliveryNoteItem
- [ ] Flujo: Presupuesto -> Albaran -> Factura
- [ ] API CRUD /delivery-notes
- [ ] Vista: lista con filtros, detalle, firma de entrega
- [ ] PDF de albaran
- [ ] Serie propia (DN-0001)

### FASE 6b - Importacion CSV/Excel [MEDIA-ALTA PRIORIDAD]
Elimina la friccion de migracion desde otros ERPs.

- [ ] Importar clientes desde CSV/Excel (campos mapeables)
- [ ] Importar productos desde CSV/Excel
- [ ] Importar facturas historicas
- [ ] Validacion de datos + informe de errores
- [ ] Plantillas Excel descargables por entidad

### FASE 7 - Empleados + RRHH [MEDIA PRIORIDAD]
Abre mercado: empresas con 5-50 empleados.

- [ ] Modelo Prisma: Employee (nombre, cargo, fecha alta, sueldo, nif, cuenta bancaria)
- [ ] Vista de empleados: ficha, historial, documentos
- [ ] Control horario: fichaje entrada/salida
- [ ] Vacaciones y ausencias: solicitud y aprobacion
- [ ] Documentos: contratos adjuntos

### FASE 7b - Nominas [MEDIA PRIORIDAD]
El modulo mas pegajoso: empresa nunca cambia ERP si le calculas nominas.

- [ ] Calculo nomina mensual (sueldo + complementos + deducciones)
- [ ] Tramos IRPF automaticos segun salario anual
- [ ] Cuotas SS empresa y trabajador
- [ ] PDF nomina
- [ ] Modelos: 111 (trimestral IRPF), 190 (anual resumen)
- [ ] Exportacion SEPA XML para transferencias bancarias masivas

### FASE 8 - Portal del cliente [MEDIA PRIORIDAD]
Reduce tiempo de cobro, mejora imagen profesional.

- [ ] Link unico por cliente -> ver sus facturas
- [ ] Pagar factura online con Stripe
- [ ] Marcar automaticamente como pagada
- [ ] Aceptar/rechazar presupuesto desde el portal

### FASE 8b - Pedidos [MEDIA PRIORIDAD]

- [ ] Pedidos de cliente -> albaran -> factura
- [ ] Ordenes de compra a proveedor -> entrada de stock
- [ ] CRUD Proveedores
- [ ] Estado: pendiente / confirmado / enviado / entregado

### FASE 9 - Almacen avanzado [BAJA-MEDIA PRIORIDAD]
Mercado: logistica, fabricacion, e-commerce.

- [ ] Multiples almacenes con ubicaciones (pasillo, estanteria)
- [ ] Entradas automaticas por orden de compra
- [ ] Salidas automaticas por albaran/factura
- [ ] Stock minimo con alerta automatica
- [ ] Inventario fisico: conteo y ajuste
- [ ] Trazabilidad: lotes y numeros de serie

### FASE 9b - Automatizaciones externas [BAJA-MEDIA PRIORIDAD]
Posiciona el SaaS como hub central de la empresa.

- [ ] Webhooks de salida configurables (base ya existe)
- [ ] Conectores nativos: Slack, Gmail, WhatsApp Business API
- [ ] Integracion Zapier/Make
- [ ] Integracion e-commerce: Shopify, WooCommerce
- [ ] API publica documentada

### FASE 10 - PDF profesional [BAJA PRIORIDAD]

- [ ] PDF factura con QR VeriFactu, logo empresa, formato legal
- [ ] PDF presupuesto y albaran
- [ ] PDF nomina
- [ ] Plantillas personalizables

### FASE 11 - Dominio y SEO [BAJA PRIORIDAD]

- [ ] Apuntar DNS de lucasyleodigital.com a Vercel
- [ ] Actualizar CLIENT_URL en Railway
- [ ] Landing page con pricing real, testimonios, demo

---

## Mercados desbloqueados por feature

| Feature | Mercado nuevo |
|---|---|
| Multi-usuario + roles | Cualquier empresa con equipo (80% del mercado) |
| Albaranes | Distribucion, retail, hosteleria, construccion |
| Importacion CSV | Todos los que migran desde otro software |
| Empleados + horario | PYMEs con 5-50 empleados |
| Nominas | Empresas que externalizan gestoria |
| Portal del cliente | Servicios, consultoria, agencias |
| Pedidos + Proveedores | Comercio, mayoristas, e-commerce |
| Almacen avanzado | Logistica, fabricacion, distribucion |
| Automatizaciones externas | Agencias, empresas tech |

---

## Servicios externos pendientes

| Servicio | Estado | Variables Railway |
|---|---|---|
| Resend | Pendiente crear cuenta | RESEND_API_KEY, EMAIL_FROM |
| Stripe | Pendiente crear cuenta | STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_* |
| Google OAuth | Pendiente completar | GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET |

---

## Decisiones tecnicas clave

- Multi-tenant: companyId siempre del JWT, nunca de la URL
- i18n: localePrefix always, force-dynamic en layouts con useTranslations()
- VeriFactu: modo QR (hash chain + QR AEAT), sin certificado p12, valido para cumplimiento
- Planes: limites validados en el servicio API, PlanUpgradeWall en frontend
- Automatizaciones: SSRF protection en webhooks salientes (bloquea IPs privadas)
