import PostalMime from "postal-mime";

const MAX_ATTACHMENTS = 5;
const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPTED = /^(image\/(jpeg|png|webp|gif|heic|heif)|application\/pdf)$/i;

export async function forwardEmail(message, env, fetchImpl = fetch) {
  const raw = await new Response(message.raw).arrayBuffer();
  const email = await PostalMime.parse(raw);

  const form = new FormData();
  form.append("to", message.to);
  form.append("from", message.from);
  form.append("headerFrom", email.from?.address ?? "");
  form.append("subject", email.subject ?? "");

  let attached = 0;
  for (const a of email.attachments ?? []) {
    if (attached >= MAX_ATTACHMENTS) break;
    const type = (a.mimeType || "").toLowerCase();
    const size = a.content?.byteLength ?? 0;
    if (!ACCEPTED.test(type) || size === 0 || size > MAX_BYTES) continue;
    form.append("attachments", new Blob([a.content], { type }), a.filename || `ticket-${attached + 1}`);
    attached++;
  }

  const res = await fetchImpl(`${env.API_URL}/inbound/expense-email`, {
    method: "POST",
    headers: { "x-inbound-secret": env.INBOUND_EMAIL_SECRET },
    body: form,
  });
  const result = await res.json().catch(() => ({}));
  return { status: res.status, attached, result };
}

export default {
  async email(message, env) {
    const { status, attached, result } = await forwardEmail(message, env);
    // Nunca rebotamos el correo: la API avisa al empleado por notificación si algo no cuadra
    console.log(JSON.stringify({ to: message.to, status, attached, result: result?.status }));
  },
};
