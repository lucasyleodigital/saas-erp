"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Mail, Wrench, Phone, Clock, MapPin, CheckCircle } from "lucide-react";
import { MarketingFooter } from "@/components/marketing/footer";

const CONTACT_INFO = [
  {
    Icon: Mail,
    title: "Email comercial",
    value: "hola@youwhole.com",
    href: "mailto:hola@youwhole.com",
    description: "Planes, demos y consultas generales",
  },
  {
    Icon: Wrench,
    title: "Soporte técnico",
    value: "soporte@youwhole.com",
    href: "mailto:soporte@youwhole.com",
    description: "Incidencias y ayuda con la plataforma",
  },
  {
    Icon: Phone,
    title: "WhatsApp / Teléfono",
    value: "+34 624 029 617",
    href: "https://wa.me/34624029617",
    description: "L-V de 9:00 a 18:00h",
  },
];

export function ContactoClient() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setStatus(res.ok ? "ok" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border py-4 px-6 flex items-center justify-between">
        <Link href="/">
          <Image src="/logo.png" alt="YouWhole" width={120} height={34} className="object-contain" />
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/sobre-nosotros" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Sobre nosotros
          </Link>
          <Link
            href="/registro"
            className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Prueba gratis
          </Link>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-16 max-w-5xl">
        <div className="text-center mb-14">
          <span className="inline-block text-xs font-medium bg-primary/10 text-primary px-3 py-1 rounded-full mb-4">
            Estamos aquí para ayudarte
          </span>
          <h1 className="text-4xl font-bold mb-4">Hablemos</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            ¿Tienes dudas sobre YouWhole? ¿Quieres una demo personalizada? ¿O simplemente quieres saber si encajamos
            con tu empresa? Escríbenos — te respondemos en menos de 24 horas.
          </p>
        </div>

        <div className="grid md:grid-cols-5 gap-10">
          <div className="md:col-span-2 space-y-4">
            {CONTACT_INFO.map((c) => (
              <a
                key={c.title}
                href={c.href}
                target={c.href.startsWith("https") ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="flex gap-4 p-5 border border-border rounded-xl hover:bg-muted/30 transition-colors group"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <c.Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                    {c.title}
                  </p>
                  <p className="text-sm text-primary">{c.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>
                </div>
              </a>
            ))}

            <div className="p-5 border border-border rounded-xl bg-muted/10">
              <p className="font-medium text-sm text-foreground mb-1 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" /> Tiempo de respuesta
              </p>
              <p className="text-sm text-muted-foreground">
                Respondemos todos los mensajes en un máximo de <strong className="text-foreground">24 horas</strong> en
                días laborables. Para urgencias usa WhatsApp.
              </p>
            </div>

            <div className="p-5 border border-border rounded-xl bg-muted/10">
              <p className="font-medium text-sm text-foreground mb-1 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" /> Ubicación
              </p>
              <p className="text-sm text-muted-foreground">
                Barcelona, España.
                <br />
                Atendemos a empresas de toda España.
              </p>
            </div>
          </div>

          <div className="md:col-span-3">
            {status === "ok" ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-10 border border-border rounded-xl bg-muted/10">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-5">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Mensaje enviado</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Gracias por contactar con nosotros. Te responderemos en menos de 24 horas.
                </p>
                <button
                  onClick={() => { setStatus("idle"); setForm({ name: "", email: "", subject: "", message: "" }); }}
                  className="text-sm text-primary hover:underline"
                >
                  Enviar otro mensaje
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="border border-border rounded-xl p-8 space-y-5 bg-background">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium" htmlFor="name">
                      Nombre <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      required
                      autoComplete="name"
                      placeholder="Tu nombre"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium" htmlFor="email">
                      Email <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="tu@empresa.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium" htmlFor="subject">
                    Asunto
                  </label>
                  <input
                    id="subject"
                    type="text"
                    autoComplete="off"
                    placeholder="¿En qué podemos ayudarte?"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium" htmlFor="message">
                    Mensaje <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={6}
                    placeholder="Cuéntanos sobre tu empresa y qué necesitas..."
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>

                {status === "error" && (
                  <p className="text-sm text-destructive">
                    Error al enviar el mensaje. Escríbenos directamente a{" "}
                    <a href="mailto:hola@youwhole.com" className="underline">hola@youwhole.com</a>
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="w-full h-11 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {status === "sending" ? "Enviando..." : "Enviar mensaje"}
                </button>

                <p className="text-xs text-muted-foreground text-center">
                  Al enviar este formulario aceptas nuestra{" "}
                  <Link href="/privacidad" className="hover:text-foreground underline">
                    política de privacidad
                  </Link>
                  .
                </p>
              </form>
            )}
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
