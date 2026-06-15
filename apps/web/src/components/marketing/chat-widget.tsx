"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Bot } from "lucide-react";

interface Message {
  id: number;
  from: "bot" | "user";
  text: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: 1,
    from: "bot",
    text: "¡Hola! 👋 Soy el asistente de YouWhole. ¿En qué te puedo ayudar hoy?",
  },
];

const QUICK_REPLIES = [
  "¿Qué incluye el plan gratuito?",
  "¿Cómo funciona VeriFactu?",
  "Quiero hablar con una persona",
];

const BOT_RESPONSES: Record<string, string> = {
  "¿Qué incluye el plan gratuito?":
    "El plan Gratuito incluye hasta 5 clientes, 10 facturas al mes, 1 usuario y 1 GB de almacenamiento. Perfecto para empezar sin compromiso. 🎉",
  "¿Cómo funciona VeriFactu?":
    "VeriFactu registra cada factura automáticamente en la AEAT con firma SHA256. No tienes que hacer nada — YouWhole lo gestiona solo para que siempre estés al día con Hacienda. ✅",
  "Quiero hablar con una persona":
    "¡Claro! Escríbenos a hola@youwhole.es o llámanos al +34 900 000 000 (L-V 9-18h). Nuestro equipo en español te atenderá encantado. 🙌",
};

const DEFAULT_RESPONSE =
  "Gracias por tu mensaje. Un agente de nuestro equipo te responderá en breve. También puedes escribirnos directamente a hola@youwhole.es ✉️";

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
      const botText = BOT_RESPONSES[text] ?? DEFAULT_RESPONSE;
      setMessages((prev) => [...prev, { id: nextId.current++, from: "bot", text: botText }]);
      setTyping(false);
    }, 900);
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
            className="fixed bottom-24 right-4 sm:right-6 z-50 w-[340px] rounded-2xl border border-border bg-background shadow-2xl overflow-hidden flex flex-col"
            style={{ maxHeight: "min(520px, 80dvh)" }}
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
                <p className="text-sm font-semibold text-white">Soporte YouWhole</p>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
                  <span className="text-xs text-white/70">En línea · responde en minutos</span>
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
                    className="max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed"
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
