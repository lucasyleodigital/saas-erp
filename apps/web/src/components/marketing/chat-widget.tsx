"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Bot, Search } from "lucide-react";

interface Message {
  id: number;
  from: "bot" | "user";
  text: string;
}

const QA: { q: string; a: string; keywords: string[] }[] = [
  // -- Plan y precios --
  {
    q: "Que incluye el plan gratuito?",
    a: "El plan Gratuito incluye hasta 5 clientes, 10 facturas al mes, 1 usuario y 1 GB de almacenamiento. Perfecto para empezar sin compromiso.",
    keywords: ["gratis", "gratuito", "free", "plan", "precio", "coste", "cuesta"],
  },
  {
    q: "Cuanto cuesta YouWhole?",
    a: "Tenemos 4 planes:\n- Gratuito: 0 EUR/mes (5 clientes, 10 facturas)\n- Starter: 29 EUR/mes (3 usuarios, ilimitado)\n- Pro: 79 EUR/mes (10 usuarios, soporte prioritario)\n- Enterprise: personalizado (usuarios ilimitados)\n\nTodos incluyen 14 dias de prueba gratis del plan Pro, sin tarjeta.",
    keywords: ["precio", "cuesta", "plan", "tarifa", "pagar", "suscripcion", "starter", "pro", "enterprise"],
  },
  {
    q: "Puedo cancelar cuando quiera?",
    a: "Si, sin permanencia ni penalizaciones. Si cancelas, sigues teniendo acceso hasta el final del periodo ya pagado. Despues, tu cuenta pasa al plan Gratuito y conservas todos tus datos.",
    keywords: ["cancelar", "baja", "permanencia", "devolucion"],
  },
  // -- VeriFactu --
  {
    q: "Como funciona VeriFactu?",
    a: "VeriFactu registra cada factura automaticamente en la AEAT con firma SHA256 encadenada. YouWhole genera el XML certificado, el codigo QR de verificacion y lo envia directamente al sistema VERI*FACTU de Hacienda. No tienes que hacer nada -- es automatico desde el primer dia.",
    keywords: ["verifactu", "aeat", "hacienda", "sha256", "factura electronica", "ley antifraude", "cumplimiento"],
  },
  // -- Facturacion --
  {
    q: "Como creo una factura?",
    a: "Desde Facturacion > Facturas > Nueva factura:\n1. Selecciona el cliente\n2. Anade las lineas (concepto, cantidad, precio)\n3. El IVA y el IRPF (si eres autonomo) se calculan automaticamente\n4. Guarda como borrador o envia por email al cliente\n\nEl PDF se genera con tu logo y datos de empresa.",
    keywords: ["factura", "facturar", "crear factura", "emitir"],
  },
  {
    q: "Puedo facturar en otros idiomas?",
    a: "Si. Al crear una factura, puedes seleccionar el idioma del documento. El PDF se genera con todas las etiquetas traducidas. Idiomas disponibles: Espanol, English, Francais, Deutsch, Portugues, Italiano y Catala.",
    keywords: ["idioma", "ingles", "frances", "traducir", "multi-idioma", "catala"],
  },
  {
    q: "Puedo facturar en otra moneda?",
    a: "Si. Puedes facturar en EUR, USD, GBP, CHF y muchas mas monedas. El sistema muestra el tipo de cambio actual del BCE (Banco Central Europeo) y calcula el equivalente en euros como referencia.",
    keywords: ["moneda", "divisa", "dolar", "libra", "cambio", "multi-divisa", "usd", "gbp"],
  },
  {
    q: "Como funcionan las facturas recurrentes?",
    a: "Al crear una factura, activa la opcion 'Recurrente' y selecciona la frecuencia (semanal, mensual, trimestral o anual). El sistema generara automaticamente una nueva factura cada periodo a las 7:00 AM. Se crean como borrador para que puedas revisarlas antes de enviar.",
    keywords: ["recurrente", "automatica", "periodicidad", "repetir", "suscripcion"],
  },
  {
    q: "Como genero un link de pago?",
    a: "Si tienes Stripe configurado, puedes generar un enlace de pago desde el menu de cada factura. El cliente recibe un link seguro donde pagar con tarjeta. Cuando pague, la factura se marca automaticamente como pagada.",
    keywords: ["pago", "stripe", "cobrar", "tarjeta", "link", "pasarela"],
  },
  // -- IRPF y modelos --
  {
    q: "Como funciona el IRPF para autonomos?",
    a: "Si configuras tu empresa como AUTONOMO, al crear facturas se resta automaticamente la retencion IRPF (normalmente 15%, o 7% si eres nuevo autonomo). El calculo es: Total = Base + IVA - IRPF. Ademas, en Contabilidad tienes el Modelo 130 con el pago fraccionado trimestral calculado automaticamente.",
    keywords: ["irpf", "autonomo", "retencion", "modelo 130", "trimestral", "hacienda"],
  },
  {
    q: "Que modelos fiscales calcula YouWhole?",
    a: "YouWhole calcula automaticamente:\n- Modelo 130: pago fraccionado IRPF (trimestral, para autonomos)\n- Modelo 303: IVA trimestral\n- Modelo 347: operaciones con terceros > 3.005,06 EUR\n- Libro de Facturas emitidas y recibidas (formato AEAT)\n- Retenciones IRPF por cliente\n\nUsas estos datos como referencia para presentar en la AEAT.",
    keywords: ["modelo", "303", "130", "347", "fiscal", "impuesto", "iva", "trimestre"],
  },
  // -- CRM --
  {
    q: "Que incluye el CRM?",
    a: "El CRM de YouWhole incluye:\n- Gestion de clientes con fichas completas\n- Leads y pipeline Kanban (drag & drop)\n- Proyectos con control de rentabilidad\n- Empleados y nominas\n- Control horario con seguimiento por proyecto\n- Etiquetas y filtros avanzados\n- Portal del cliente con acceso a facturas",
    keywords: ["crm", "cliente", "lead", "pipeline", "oportunidad", "ventas"],
  },
  // -- Proyectos --
  {
    q: "Como funciona la gestion de proyectos?",
    a: "En Proyectos puedes crear proyectos con presupuesto, tarifa/hora y cliente asignado. Cada proyecto muestra:\n- Ingresos reales (facturas vinculadas)\n- Horas registradas por empleados\n- Porcentaje de presupuesto usado\n- Margen de rentabilidad\n\nPuedes vincular facturas y horas para ver la rentabilidad real.",
    keywords: ["proyecto", "rentabilidad", "presupuesto", "margen"],
  },
  // -- Contabilidad --
  {
    q: "Que incluye la contabilidad?",
    a: "La contabilidad de YouWhole incluye:\n- Perdidas y Ganancias con grafico mensual\n- IVA Trimestral (Modelo 303)\n- Libro Diario con asientos manuales y automaticos\n- Plan de Cuentas PGC espanol\n- Conciliacion bancaria (importa CSV del banco)\n- Control de inventario y stock\n- Gestion de proveedores y pedidos de compra",
    keywords: ["contabilidad", "pgc", "asiento", "libro diario", "balance", "cuentas"],
  },
  // -- Nominas y RRHH --
  {
    q: "Puedo gestionar nominas con YouWhole?",
    a: "Si. En Nominas puedes gestionar empleados, contratos y nominas mensuales. El sistema calcula automaticamente las retenciones de IRPF y Seguridad Social. Tambien incluye control horario con registro de horas por proyecto y empleado.",
    keywords: ["nomina", "empleado", "rrhh", "contrato", "seguridad social", "horario"],
  },
  // -- Importar / Exportar --
  {
    q: "Puedo importar mis datos existentes?",
    a: "Si. Puedes importar clientes, productos y facturas historicas desde archivos Excel (.xlsx) o CSV. El sistema detecta las columnas automaticamente y te pide confirmar antes de importar. Tambien puedes exportar cualquier listado a Excel.",
    keywords: ["importar", "excel", "csv", "migrar", "exportar", "datos"],
  },
  {
    q: "Puedo hacer backup de mis datos?",
    a: "Si. En la seccion Backup puedes descargar un archivo JSON con TODOS los datos de tu empresa: clientes, facturas, presupuestos, productos, empleados, asientos contables, proyectos y mas. Util para tener una copia de seguridad local.",
    keywords: ["backup", "copia", "seguridad", "descargar", "exportar todo"],
  },
  // -- Seguridad --
  {
    q: "Son seguros mis datos?",
    a: "Si. Todos tus datos se almacenan cifrados en servidores europeos con cumplimiento RGPD. Incluimos backups automaticos, acceso protegido con autenticacion segura y registro de auditoria de todas las acciones. Jamas compartimos tus datos con terceros.",
    keywords: ["seguro", "seguridad", "rgpd", "cifrado", "privacidad", "datos"],
  },
  // -- Funcionalidades nuevas --
  {
    q: "Que son los campos personalizados?",
    a: "Los campos personalizados te permiten anadir informacion extra a tus entidades (clientes, facturas, productos, proyectos). Puedes crear campos de tipo texto, numero, fecha, seleccion o si/no. Util para adaptar YouWhole a las necesidades de tu sector.",
    keywords: ["campo", "personalizado", "custom", "adaptar", "flexible"],
  },
  {
    q: "Tiene registro de auditoria?",
    a: "Si. En Auditoria puedes ver un historial de todas las acciones: quien hizo que, cuando y que datos se cambiaron (antes/despues). Filtrable por entidad y tipo de accion. Cumple con los requisitos de trazabilidad de la AEAT.",
    keywords: ["auditoria", "historial", "registro", "trazabilidad", "log"],
  },
  // -- Soporte y contacto --
  {
    q: "Como puedo contactar con soporte?",
    a: "Puedes contactarnos por:\n- Email: hola@youwhole.com\n- Telefono: +34 624 029 617\n- Horario: Lunes a Viernes, 9:00 a 18:00 (hora espanola)\n\nLos clientes Pro y Enterprise tienen soporte prioritario.",
    keywords: ["contacto", "soporte", "ayuda", "telefono", "email", "hablar", "persona", "llamar"],
  },
  // -- General --
  {
    q: "Funciona en el movil?",
    a: "Si. YouWhole es una PWA (Progressive Web App) que puedes instalar en tu movil como una app nativa. Abre la web en el navegador, pulsa 'Anadir a pantalla de inicio' y listo. Tendras acceso a todas las funciones con interfaz adaptada.",
    keywords: ["movil", "app", "android", "iphone", "ios", "pwa", "telefono", "tablet"],
  },
  {
    q: "Para que tipo de empresa funciona?",
    a: "YouWhole esta disenado para autonomos y pymes espanolas de cualquier sector: servicios, comercio, construccion, tecnologia, hosteleria, consultoria... Si tienes necesidades especificas, escribenos a hola@youwhole.com y te ayudamos.",
    keywords: ["empresa", "sector", "autonomo", "pyme", "quien", "tipo"],
  },
];

function findBestAnswer(input: string): string {
  const term = input.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  let bestScore = 0;
  let bestAnswer = "";

  for (const item of QA) {
    let score = 0;
    for (const kw of item.keywords) {
      if (term.includes(kw)) score += 3;
    }
    const qNorm = item.q.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    const words = term.split(/\s+/);
    for (const w of words) {
      if (w.length > 2 && qNorm.includes(w)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      bestAnswer = item.a;
    }
  }

  if (bestScore >= 2) return bestAnswer;
  return "No tengo una respuesta exacta para eso. Puedes escribirnos a hola@youwhole.com o llamar al +34 624 029 617 (L-V 9-18h) y te ayudamos personalmente.";
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: 1,
    from: "bot",
    text: "Hola, soy el asistente de YouWhole. Preguntame sobre funcionalidades, precios, facturacion, VeriFactu o cualquier otra duda.",
  },
];

const QUICK_REPLIES = [
  "Cuanto cuesta YouWhole?",
  "Como funciona VeriFactu?",
  "Que incluye el CRM?",
  "Como puedo contactar con soporte?",
];

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [quickRepliesShown, setQuickRepliesShown] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(10);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: nextId.current++, from: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setQuickRepliesShown(false);
    setTyping(true);

    setTimeout(() => {
      const botText = findBestAnswer(text);
      setMessages((prev) => [...prev, { id: nextId.current++, from: "bot", text: botText }]);
      setTyping(false);
    }, 700);
  };

  return (
    <>
      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-24 right-4 sm:right-6 z-50 w-[360px] rounded-2xl border border-border bg-background shadow-2xl overflow-hidden flex flex-col"
            style={{ maxHeight: "min(560px, 80dvh)" }}
          >
            {/* Header */}
            <div
              className="flex items-center gap-3 px-4 py-3 border-b border-border"
              style={{ background: "linear-gradient(135deg, #0d9488, #0f766e)" }}
            >
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">Asistente YouWhole</p>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
                  <span className="text-xs text-white/70">Disponible 24/7</span>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-white/70 hover:text-white transition-colors p-1"
                aria-label="Cerrar chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className="max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line"
                    style={
                      msg.from === "bot"
                        ? { background: "hsl(var(--muted))", color: "hsl(var(--foreground))" }
                        : {
                            background: "linear-gradient(135deg, #0d9488, #0f766e)",
                            color: "white",
                          }
                    }
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {typing && (
                <div className="flex justify-start">
                  <div
                    className="rounded-2xl px-4 py-3 flex gap-1"
                    style={{ background: "hsl(var(--muted))" }}
                  >
                    {[0, 0.15, 0.3].map((delay) => (
                      <motion.span
                        key={delay}
                        className="h-2 w-2 rounded-full"
                        style={{ background: "#0d9488" }}
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Quick replies */}
              {quickRepliesShown && !typing && (
                <div className="flex flex-col gap-2 pt-1">
                  {QUICK_REPLIES.map((r) => (
                    <button
                      key={r}
                      onClick={() => sendMessage(r)}
                      className="text-left text-xs rounded-xl border px-3 py-2 transition-colors hover:bg-muted"
                      style={{
                        borderColor: "rgba(13,148,136,0.3)",
                        color: "#0d9488",
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border p-3 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                placeholder="Escribe tu pregunta..."
                className="flex-1 rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm outline-none focus:border-teal-500 transition-colors"
                aria-label="Mensaje"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim()}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg, #0d9488, #0f766e)" }}
                aria-label="Enviar"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating button */}
      <motion.button
        className="fixed bottom-5 right-4 sm:right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg"
        style={{
          background: "linear-gradient(135deg, #0d9488, #0f766e)",
          boxShadow: "0 0 0 0 rgba(13,148,136,0.4)",
        }}
        animate={
          open
            ? {}
            : {
                boxShadow: [
                  "0 0 0 0 rgba(13,148,136,0.4)",
                  "0 0 0 12px rgba(13,148,136,0)",
                  "0 0 0 0 rgba(13,148,136,0)",
                ],
              }
        }
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        aria-label={open ? "Cerrar chat" : "Abrir chat de soporte"}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X className="h-6 w-6" />
            </motion.div>
          ) : (
            <motion.div key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <MessageCircle className="h-6 w-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
}
