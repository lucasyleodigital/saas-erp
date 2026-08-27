# Cumplimiento IA — YouWhole (SaaS-ERP)

> Este archivo lo mantiene la skill `cumplimiento-ia`. Es un registro de
> diligencia debida, no un certificado legal. Para riesgo alto o dudas reales,
> consulta con un abogado especializado en la materia.

## Última auditoría: 2026-08-27 (re-auditoría, corrección aplicada)

**Resultado:** Riesgo mínimo/limitado — un sistema de IA activo en producción. La única acción pendiente de la auditoría anterior **ya se ha corregido**.

**Resumen:** Re-escaneo del código tras la auditoría del mismo día. Los mismos 4 componentes, sin cambios de estado: el escáner de gastos/tickets sigue siendo el único sistema de IA real y activo; el asistente Claude Haiku sigue construido pero desconectado del frontend; los dos "chat-widget" siguen siendo buscadores de FAQ estáticos sin inferencia. Se detectaron además 2 coincidencias de "fingerprint" en `en.json` — verificadas y descartadas: es "huella digital" en el sentido de hash SHA256 de VeriFactu, no biometría.

### Hallazgos

| Componente | Qué es realmente | Estado | Categoría |
|---|---|---|---|
| `document-scanner-dialog.tsx` → `/fiscal/expenses/analyze` (`fiscal.service.ts`) | Extrae datos de tickets/facturas subidos usando IA (cascada OpenRouter → Gemini → NVIDIA → Claude → Mistral) | **ACTIVO** en producción | Sistema de IA real — riesgo mínimo/limitado |
| `assistant-widget.tsx` (panel de ayuda "?" del dashboard) | Buscador de FAQ estático sobre `help-data.ts`, sin llamada a ningún modelo | Activo, pero **no es IA** | No aplica |
| `assistant.service.ts` + endpoint `/assistant/chat` (backend, llama a Claude Haiku) | Backend ya construido y funcional | **Inactivo** — ningún componente del frontend lo llama (`useAssistantChat()` sigue definido pero sin usar) | Vigilar si se reactiva |
| `chat-widget.tsx` (web de marketing pública) | Buscador de FAQ estático (`findBestAnswer`), sin llamada a ningún modelo | Activo, pero **no es IA** | No aplica |
| "fingerprint" en `messages/en.json` (líneas 2948, 2959) | Texto sobre la "huella digital" (hash SHA256) de las facturas VeriFactu | Falso positivo verificado — no es biometría | No aplica |

### Qué se corrigió en esta pasada

La política de privacidad (`apps/web/src/app/privacidad/page.tsx`, sección 5 «Destinatarios y transferencias internacionales») no mencionaba los proveedores de IA que procesan las imágenes de tickets/facturas en el escáner de documentos. Se añadió la línea:

> **OpenRouter, Google (Gemini), NVIDIA, Anthropic (Claude) y Mistral AI** — procesamiento de imágenes mediante inteligencia artificial cuando usas la función opcional «Escanear documento con IA» para extraer datos de tickets y facturas; solo se envía el documento que subes voluntariamente para ese fin.

Verificado con `tsc --noEmit` (compila limpio). Cambio pendiente de commit/push — solo se aplica en el working tree hasta que lo confirmes.

### Qué significa esto para ti

El escáner de tickets/facturas sigue siendo el único sistema de IA real, y sigue sin caer en alto riesgo (no decide nada sobre empleo, crédito, salud ni justicia — solo extrae datos que el propio usuario confirma antes de guardar). Con la política de privacidad ya actualizada, la única brecha de la auditoría anterior queda cerrada.

El asistente con Claude Haiku sigue en el backend sin conectar — sigue pendiente de vigilancia, no de acción: si se activa, hará falta el aviso de transparencia Art. 50 antes de publicarlo.

### Acciones recomendadas
- [x] Añadir a la política de privacidad de YouWhole la mención de OpenRouter, Google (Gemini), NVIDIA, Anthropic y Mistral como subencargados del tratamiento para el escáner de documentos. — **Hecho 2026-08-27.**
- [ ] Si se reactiva el asistente Claude Haiku (`useAssistantChat`), añadir el aviso de transparencia Art. 50 antes de lanzarlo — la skill puede insertarlo cuando llegue el momento.
- [ ] Nada más pendiente por ahora.

### Aviso
Esto es una detección técnica de apoyo, no asesoría legal certificada. Para
riesgo alto real, o si tienes dudas, consulta con un abogado especializado en
protección de datos/IA antes de lanzar.

---

## Historial de auditorías

### 2026-08-27 — primera auditoría

**Resultado:** Riesgo mínimo/limitado — un sistema de IA activo en producción, sin obligaciones incumplidas graves, con una mejora recomendada.

**Resumen:** De los 4 componentes que sonaban a "IA" en el código, solo uno llama de verdad a un modelo (el escáner de gastos/tickets). Los otros tres ("asistente", "chat-widget") son buscadores de FAQ estáticos sin inferencia — no son sistemas de IA a efectos legales, aunque el nombre lo sugiera.

**Acción recomendada:** Añadir a la política de privacidad la mención de OpenRouter, Google (Gemini), NVIDIA, Anthropic y Mistral como subencargados del tratamiento para el escáner de documentos. → Corregida en la re-auditoría del mismo día (ver arriba).
