export const CONTRACT_VERSION = "2026-08";

export type ContractPlan = "FREE" | "STARTER" | "PRO" | "ENTERPRISE";

const PLAN_LABEL: Record<ContractPlan, string> = {
  FREE: "Gratuito",
  STARTER: "Starter",
  PRO: "Pro",
  ENTERPRISE: "Enterprise",
};

export interface ContractSection {
  title: string;
  body: string;
}

export interface ContractDocument {
  subject: string;
  companyName: string;
  cif: string | null;
  plan: ContractPlan;
  planLabel: string;
  price: number;
  dateStr: string;
  version: string;
  sections: ContractSection[];
}

export interface BuildContractParams {
  companyName: string;
  cif: string | null;
  plan: ContractPlan;
  price: number;
  acceptedAt: Date;
}

// Single source of truth for what every customer agrees to — used to build
// the email sent on signup/upgrade, the row stored in ContractAcceptance,
// the downloadable PDF, and the "Mis contratos" viewer in the dashboard.
export function buildContractDocument(params: BuildContractParams): ContractDocument {
  const { companyName, cif, plan, price, acceptedAt } = params;
  const planLabel = PLAN_LABEL[plan] ?? plan;
  const dateStr = acceptedAt.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const sections: ContractSection[] = [
    {
      title: "PARTES",
      body: `Alex Lucas Torrubia (NIF 41003566V), titular de la plataforma YouWhole bajo el nombre comercial «Lucas y Leo Digital» («YouWhole»), y <strong>${companyName}</strong> (CIF/NIF: ${cif ?? "—"}) («Cliente»).`,
    },
    {
      title: "OBJETO",
      body: `Acceso a la plataforma SaaS YouWhole en modalidad ${planLabel}, incluyendo los módulos correspondientes a dicho plan según se describen en youwhole.com.`,
    },
    {
      title: "PRECIO Y FACTURACIÓN",
      body:
        price > 0
          ? `${price}€/mes (IVA incluido), con cargo automático mensual a la tarjeta facilitada.`
          : `Plan gratuito, 0€/mes, sujeto a los límites de uso publicados en youwhole.com/terminos.`,
    },
    ...(plan === "ENTERPRISE"
      ? [
          {
            title: "SLA",
            body: `Disponibilidad garantizada del 99,5% mensual. Soporte prioritario L–V 9:00–19:00 (hora peninsular española) con respuesta en 4 horas laborables.`,
          },
        ]
      : []),
    {
      title: "CANCELACIÓN",
      body: `Cancelación en cualquier momento sin penalización desde el panel de control (Planes y facturación → Cancelar suscripción). La baja surte efecto al final del período en curso.`,
    },
    {
      title: "VERIFICACIÓN DE DATOS Y EXENCIÓN DE RESPONSABILIDAD",
      body: `YouWhole automatiza cálculos y genera documentos (facturas VeriFactu, resúmenes de IRPF, Modelo 130/303/347, nóminas, datos extraídos de tickets y facturas mediante inteligencia artificial, y cualquier otro dato o documento producido por la plataforma) a partir de la información que el Cliente introduce o sube. El Cliente es el único responsable de revisar y verificar la exactitud de estos datos antes de presentarlos, remitirlos o comunicarlos a la Agencia Tributaria, la Seguridad Social o cualquier otra administración, entidad o tercero. YouWhole no valida el contenido introducido por el Cliente ni garantiza que los cálculos, extracciones automáticas o documentos generados estén libres de errores, y no asume responsabilidad alguna por sanciones, recargos, intereses, perjuicios o cualquier otra consecuencia derivada de datos que el Cliente no haya revisado y verificado previamente.`,
    },
    {
      title: "PROTECCIÓN DE DATOS",
      body: `YouWhole actúa como Encargado del Tratamiento (RGPD). Datos alojados en la Unión Europea. Política completa en youwhole.com/privacidad.`,
    },
    {
      title: "JURISDICCIÓN",
      body: `Legislación española. Juzgados y Tribunales de Barcelona, con renuncia expresa a cualquier otro fuero.`,
    },
  ];

  return {
    subject: `Contrato de servicios YouWhole ${planLabel} — ${companyName}`,
    companyName,
    cif,
    plan,
    planLabel,
    price,
    dateStr,
    version: CONTRACT_VERSION,
    sections,
  };
}

export function renderContractHtml(doc: ContractDocument): string {
  const clausesHtml = doc.sections
    .map((s, i) => `<p><strong>${i + 1}. ${s.title}</strong><br/>${s.body}</p>`)
    .join("\n        ");

  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:640px;margin:0 auto;padding:40px 32px;color:#111827;">
      <div style="background:#0d9488;width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;margin-bottom:24px;">
        <span style="color:white;font-weight:700;font-size:20px;">Y</span>
      </div>
      <h1 style="font-size:22px;font-weight:700;margin:0 0 4px;">Contrato de Servicios YouWhole</h1>
      <p style="color:#6b7280;margin:0 0 28px;">Plan <strong style="color:#0d9488;">${doc.planLabel}</strong> · Aceptado el ${doc.dateStr} · Versión ${doc.version}</p>

      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px 24px;margin-bottom:28px;font-size:13px;line-height:1.7;">
        <p style="margin:0 0 12px;font-weight:600;color:#111827;">DATOS DE LA SUSCRIPCIÓN</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="color:#6b7280;padding:3px 0;width:140px;">Empresa</td><td style="font-weight:500;">${doc.companyName}</td></tr>
          <tr><td style="color:#6b7280;padding:3px 0;">CIF/NIF</td><td style="font-weight:500;">${doc.cif ?? "—"}</td></tr>
          <tr><td style="color:#6b7280;padding:3px 0;">Plan</td><td style="font-weight:500;">${doc.planLabel}</td></tr>
          <tr><td style="color:#6b7280;padding:3px 0;">Importe</td><td style="font-weight:500;">${doc.price > 0 ? `${doc.price}€/mes (IVA incluido)` : "0€ (plan gratuito)"}</td></tr>
          <tr><td style="color:#6b7280;padding:3px 0;">Fecha</td><td style="font-weight:500;">${doc.dateStr}</td></tr>
          <tr><td style="color:#6b7280;padding:3px 0;">Renovación</td><td style="font-weight:500;">${doc.price > 0 ? "Automática mensual · Sin permanencia" : "No aplica (plan gratuito)"}</td></tr>
        </table>
      </div>

      <div style="font-size:13px;color:#374151;line-height:1.8;">
        ${clausesHtml}
      </div>

      <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0;"/>
      <p style="font-size:12px;color:#9ca3af;margin:0;">
        Este documento confirma la aceptación del contrato de servicios de YouWhole.<br/>
        Puedes consultarlo en cualquier momento desde youwhole.com/dashboard → Mis contratos.<br/>
        Contacto: ventas@youwhole.com · YouWhole es una marca comercial de Alex Lucas Torrubia.
      </p>
    </div>`;
}
