# Recepción de tickets por email

Cada empleado tiene una dirección personal (`g1a2b3c4d5e6@recibos.youwhole.com`, visible en **Gastos y dietas**). Cuando reenvía ahí la foto o el PDF de un ticket desde su propio email:

1. Cloudflare Email Routing entrega el correo a este Worker.
2. El Worker extrae los adjuntos (imágenes y PDF, máximo 5 de 10 MB) y los envía a `POST /api/v1/inbound/expense-email` con la clave compartida `INBOUND_EMAIL_SECRET`.
3. La API comprueba que el remitente es el email del empleado, lee cada ticket con la IA y crea un gasto en borrador. El empleado recibe una notificación.

El Worker nunca rebota el correo: si algo no cuadra (remitente distinto, sin adjuntos), la API avisa al empleado por notificación.

## Puesta en marcha (una vez)

### 1. Variables en Railway (servicio `@saas/api`)

| Variable | Valor |
|---|---|
| `INBOUND_EMAIL_DOMAIN` | `recibos.youwhole.com` |
| `INBOUND_EMAIL_SECRET` | una cadena aleatoria larga (por ejemplo `openssl rand -hex 32`) |

### 2. Email Routing en Cloudflare (zona `youwhole.com`)

1. **Email → Email Routing → Settings → Subdomains**: añade `recibos.youwhole.com`. Cloudflare crea los registros MX y SPF del subdominio.
2. Despliega el Worker (paso 3).
3. **Email Routing → Routing rules → Catch-all** del subdominio `recibos.youwhole.com`: acción **Send to a Worker** → `youwhole-recibos`.

El dominio principal `youwhole.com` no se toca: usar un subdominio evita interferir con el correo de la empresa.

### 3. Desplegar el Worker

```bash
cd infra/email-worker
npm install
npx wrangler login
npx wrangler secret put INBOUND_EMAIL_SECRET   # el mismo valor que en Railway
npx wrangler deploy
```

`API_URL` está en `wrangler.toml`; cámbialo si la URL de la API de Railway cambia.

## Probar sin Cloudflare

Con la API arrancada en local:

```bash
API_URL=http://localhost:3001/api/v1 INBOUND_EMAIL_SECRET=... \
TO=g1a2b3c4d5e6@recibos.youwhole.com FROM=empleado@empresa.com TICKET=ticket.png \
node test/local-test.mjs
```
