import type { Metadata } from "next";
import { ContactoClient } from "./client";

export const metadata: Metadata = {
  title: "Contacto — YouWhole",
  description:
    "Contacta con el equipo de YouWhole. Escríbenos por email, WhatsApp o usa el formulario. Respondemos en menos de 24 horas en días laborables.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://youwhole.com/contacto" },
  openGraph: {
    title: "Contacto — YouWhole",
    description: "Escríbenos por email, WhatsApp o formulario. Respondemos en menos de 24 horas.",
    url: "https://youwhole.com/contacto",
    type: "website",
  },
};

export default function ContactoPage() {
  return <ContactoClient />;
}
