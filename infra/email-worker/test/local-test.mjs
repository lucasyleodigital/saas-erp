// Prueba el Worker sin Cloudflare: construye un email MIME con el ticket adjunto y lo envía a la API.
// Uso: API_URL=http://localhost:3001/api/v1 INBOUND_EMAIL_SECRET=... TO=g...@recibos.youwhole.com FROM=empleado@empresa.com TICKET=ruta.png node test/local-test.mjs
import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { forwardEmail } from "../src/index.js";

const { API_URL, INBOUND_EMAIL_SECRET, TO, FROM, TICKET } = process.env;
const boundary = "----youwhole-test";
const parts = [
  `From: Empleado <${FROM}>`,
  `To: ${TO}`,
  "Subject: Ticket gasolina",
  "MIME-Version: 1.0",
  `Content-Type: multipart/mixed; boundary="${boundary}"`,
  "",
  `--${boundary}`,
  "Content-Type: text/plain; charset=utf-8",
  "",
  "Te paso el ticket.",
];
if (TICKET) {
  const b64 = readFileSync(TICKET).toString("base64").replace(/.{76}/g, "$&\r\n");
  parts.push(
    `--${boundary}`,
    `Content-Type: image/png; name="${basename(TICKET)}"`,
    "Content-Transfer-Encoding: base64",
    `Content-Disposition: attachment; filename="${basename(TICKET)}"`,
    "",
    b64,
  );
}
parts.push(`--${boundary}--`, "");
const raw = new TextEncoder().encode(parts.join("\r\n"));
const message = { to: TO, from: FROM, raw: new Blob([raw]).stream() };
console.log(JSON.stringify(await forwardEmail(message, { API_URL, INBOUND_EMAIL_SECRET })));
