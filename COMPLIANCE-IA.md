# Cumplimiento IA — YouWhole (SaaS-ERP)

> Este archivo lo mantiene la skill `cumplimiento-ia`. Es un registro de
> diligencia debida, no un certificado legal. Para riesgo alto o dudas reales,
> consulta con un abogado especializado en la materia.

## Última auditoría: 2026-10-12

**Resultado:** Sí aplica el AI Act — **riesgo mínimo**. Hay un sistema de IA real (lectura de tickets y facturas), ahora usado en tres puntos de la app. No decide nada sobre personas: rellena datos que una persona revisa. Quedan pendientes dos huecos de protección de datos (listas de subencargados), no del AI Act.

**Resumen:** Re-auditoría tras los cambios del 2026-10-11/12: módulo de gastos de empleados (notas de gasto), recepción de tickets por email y reparación de la cascada de IA. La cascada estaba de facto apagada en producción (4 de 5 proveedores fallaban: modelo de OpenRouter y `gemini-2.0-flash` retirados, NVIDIA sin cupo, clave de Claude inválida; Mistral funcionaba pero clasificaba mal). Ahora el orden es Gemini 3.5 Flash → Mistral Pixtral → Claude Haiku → OpenRouter (Gemma) → NVIDIA Nemotron, con 25 s de tiempo máximo por proveedor y modelos configurables por variable de entorno.

### Hallazgos

| Componente | Qué es realmente | Estado | Categoría |
|---|---|---|---|
| `fiscal.service.ts::analyzeExpense` (`POST /fiscal/expenses/analyze`) | Extrae comercio, NIF, fecha, importe, IVA y tipo de documento de una foto/PDF con un modelo de visión (cascada de 5 proveedores) | **ACTIVO** | Sistema de IA real — riesgo mínimo |
| `document-scanner-dialog.tsx` (botón «Escanear documento» del menú) | Usa `analyzeExpense`; muestra el resultado y el usuario decide qué hacer | **ACTIVO** | Mismo sistema — riesgo mínimo |
| `fiscal-view.tsx` (gastos fiscales) | Usa `analyzeExpense` para rellenar un gasto deducible | **ACTIVO** | Mismo sistema — riesgo mínimo |
| `expense-claim-form.tsx` (Gastos y dietas → Nuevo gasto) — **nuevo** | Usa `analyzeExpense` para rellenar el gasto de un empleado; muestra el aviso «Una IA lee el ticket para rellenar los datos: revísalos antes de guardar» | **ACTIVO** | Mismo sistema — riesgo mínimo |
| `expense-claims.service.ts::processInboundEmail` (`POST /inbound/expense-email`) — **nuevo** | Cada adjunto recibido por email pasa por `analyzeExpense` y se crea un gasto **en borrador** que el empleado revisa | **Construido, sin activar** (faltan `INBOUND_EMAIL_DOMAIN`/`INBOUND_EMAIL_SECRET` en Railway y el Email Routing de Cloudflare) | Mismo sistema — riesgo mínimo |
| Avisos de política, duplicados, conciliación de tarjetas, aprobación de notas de gasto | Reglas fijas (importe máximo, misma fecha e importe, últimos 4 dígitos) y decisión de una persona | Activo | **No es IA** — no aplica |
| `assistant.service.ts` + `/assistant/chat` (Claude Haiku) | Backend funcional sin ningún componente que lo llame (`useAssistantChat()` sigue sin importarse) | Inactivo | Vigilar si se activa |
| `assistant-widget.tsx` y `chat-widget.tsx` | Buscadores de FAQ estáticos (`findBestAnswer`), sin modelo | Activos, **no son IA** | No aplica |
| «fingerprint» en `messages/en.json` | «Huella digital» (hash SHA-256) de VeriFactu | Falso positivo | No aplica |

### Qué significa esto para ti

La IA de YouWhole solo hace una cosa: leer tickets y facturas para ahorrar teclear. No aprueba ni rechaza gastos, no puntúa a empleados ni decide nada sobre ellos: cada dato lo revisa una persona y las notas de gasto las aprueba administración. Por eso no entra en «alto riesgo», aunque el módulo trate gastos de trabajadores. Tampoco es un chatbot ni genera contenido, así que no le toca el aviso obligatorio del art. 50; aun así, el formulario de gastos ya avisa de que una IA rellena los datos, que es buena práctica.

Lo que sí falta es de protección de datos: los proveedores de IA ven los tickets de tus clientes (y de sus empleados), y el contrato de encargado del tratamiento de `/terminos` no los nombra como subencargados. La política de privacidad sí los nombra, pero solo para el escáner, no para los gastos de empleados ni para el email.

Como integradores que solo consumís la API de los modelos, las obligaciones de modelos de propósito general (GPAI) son de Google, Anthropic, Mistral, NVIDIA y los proveedores de OpenRouter, no vuestras.

La Ley Orgánica española de IA sigue en trámite en el Congreso (proyecto 121/000096, en fase de comisión desde junio de 2026; verificado el 2026-10-12, sin aprobación definitiva).

### Acciones recomendadas
_Las cuatro primeras se aplicaron el 2026-10-12 (subencargados, privacidad, aviso en la tarjeta de email y logs sin datos de tickets)._

- [x] **Contrato de encargado (`/terminos`, sección 9, «Subencargados»)**: añadir Google (Gemini), Mistral AI, Anthropic, OpenRouter y NVIDIA para la lectura de documentos, y Cloudflare cuando se active la recepción por email. Hoy la lista solo incluye Supabase, Vercel, Railway, Resend y Stripe.
- [x] **Política de privacidad** (`/privacidad`, sección 5): ampliar la finalidad de la línea de proveedores de IA a «tickets de gastos de empleados subidos en la app o recibidos por email», y añadir Cloudflare (enrutado de correo) al activar esa función.
- [x] **Aviso en la tarjeta de email** (`email.body` en los 5 idiomas): indicar que la IA lee automáticamente los adjuntos, como ya hace el formulario.
- [x] **Registros**: `analyzeExpense` escribe en los logs de Railway hasta 400 caracteres de la respuesta de la IA (comercio, NIF, importes). Reducirlo a los nombres de campo, que es lo que se necesita para depurar.
- [ ] Operativo, no legal: la clave `CLAUDE_API_KEY` de producción es inválida (HTTP 401); renovarla en console.anthropic.com o quitarla.
- [ ] Si se activa el asistente Claude Haiku, añadir el aviso de transparencia del art. 50 antes de publicarlo.

### Aviso
Esto es una detección técnica de apoyo, no asesoría legal certificada. Para
riesgo alto real, o si tienes dudas, consulta con un abogado especializado en
protección de datos/IA antes de lanzar.

---

## Historial de auditorías

### 2026-08-27 — re-auditoría (corrección aplicada)

**Resultado:** Riesgo mínimo/limitado — un sistema de IA activo en producción. La única acción pendiente de la auditoría anterior **ya se ha corregido**.

**Resumen:** Re-escaneo del código tras la auditoría del mismo día. Los mismos 4 componentes, sin cambios de estado: el escáner de gastos/tickets sigue siendo el único sistema de IA real y activo; el asistente Claude Haiku sigue construido pero desconectado del frontend; los dos "chat-widget" siguen siendo buscadores de FAQ estáticos sin inferencia. Se detectaron además 2 coincidencias de "fingerprint" en `en.json` — verificadas y descartadas: es "huella digital" en el sentido de hash SHA256 de VeriFactu, no biometría.

#### Hallazgos

| Componente | Qué es realmente | Estado | Categoría |
|---|---|---|---|
| `document-scanner-dialog.tsx` → `/fiscal/expenses/analyze` (`fiscal.service.ts`) | Extrae datos de tickets/facturas subidos usando IA (cascada OpenRouter → Gemini → NVIDIA → Claude → Mistral) | **ACTIVO** en producción | Sistema de IA real — riesgo mínimo/limitado |
| `assistant-widget.tsx` (panel de ayuda "?" del dashboard) | Buscador de FAQ estático sobre `help-data.ts`, sin llamada a ningún modelo | Activo, pero **no es IA** | No aplica |
| `assistant.service.ts` + endpoint `/assistant/chat` (backend, llama a Claude Haiku) | Backend ya construido y funcional | **Inactivo** — ningún componente del frontend lo llama (`useAssistantChat()` sigue definido pero sin usar) | Vigilar si se reactiva |
| `chat-widget.tsx` (web de marketing pública) | Buscador de FAQ estático (`findBestAnswer`), sin llamada a ningún modelo | Activo, pero **no es IA** | No aplica |
| "fingerprint" en `messages/en.json` (líneas 2948, 2959) | Texto sobre la "huella digital" (hash SHA256) de las facturas VeriFactu | Falso positivo verificado — no es biometría | No aplica |

#### Qué se corrigió en esta pasada

La política de privacidad (`apps/web/src/app/privacidad/page.tsx`, sección 5 «Destinatarios y transferencias internacionales») no mencionaba los proveedores de IA que procesan las imágenes de tickets/facturas en el escáner de documentos. Se añadió la línea:

> **OpenRouter, Google (Gemini), NVIDIA, Anthropic (Claude) y Mistral AI** — procesamiento de imágenes mediante inteligencia artificial cuando usas la función opcional «Escanear documento con IA» para extraer datos de tickets y facturas; solo se envía el documento que subes voluntariamente para ese fin.

Verificado con `tsc --noEmit` (compila limpio). Cambio pendiente de commit/push — solo se aplica en el working tree hasta que lo confirmes.

#### Qué significa esto para ti

El escáner de tickets/facturas sigue siendo el único sistema de IA real, y sigue sin caer en alto riesgo (no decide nada sobre empleo, crédito, salud ni justicia — solo extrae datos que el propio usuario confirma antes de guardar). Con la política de privacidad ya actualizada, la única brecha de la auditoría anterior queda cerrada.

El asistente con Claude Haiku sigue en el backend sin conectar — sigue pendiente de vigilancia, no de acción: si se activa, hará falta el aviso de transparencia Art. 50 antes de publicarlo.

#### Acciones recomendadas
- [x] Añadir a la política de privacidad de YouWhole la mención de OpenRouter, Google (Gemini), NVIDIA, Anthropic y Mistral como subencargados del tratamiento para el escáner de documentos. — **Hecho 2026-08-27.**
- [ ] Si se reactiva el asistente Claude Haiku (`useAssistantChat`), añadir el aviso de transparencia Art. 50 antes de lanzarlo — la skill puede insertarlo cuando llegue el momento.
- [ ] Nada más pendiente por ahora.

#### Aviso
Esto es una detección técnica de apoyo, no asesoría legal certificada. Para
riesgo alto real, o si tienes dudas, consulta con un abogado especializado en
protección de datos/IA antes de lanzar.

### 2026-08-27 — primera auditoría

**Resultado:** Riesgo mínimo/limitado — un sistema de IA activo en producción, sin obligaciones incumplidas graves, con una mejora recomendada.

**Resumen:** De los 4 componentes que sonaban a "IA" en el código, solo uno llama de verdad a un modelo (el escáner de gastos/tickets). Los otros tres ("asistente", "chat-widget") son buscadores de FAQ estáticos sin inferencia — no son sistemas de IA a efectos legales, aunque el nombre lo sugiera.

**Acción recomendada:** Añadir a la política de privacidad la mención de OpenRouter, Google (Gemini), NVIDIA, Anthropic y Mistral como subencargados del tratamiento para el escáner de documentos. → Corregida en la re-auditoría del mismo día (ver arriba).
