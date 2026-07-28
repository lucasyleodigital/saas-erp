import { NextResponse } from "next/server";

const INDEXNOW_KEY = "ebe57ad2f65cf9a20a3f58c185ce5372";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://youwhole.com";

const PUBLIC_URLS = [
  APP_URL,
  `${APP_URL}/es`,
  `${APP_URL}/ca`,
  `${APP_URL}/eu`,
  `${APP_URL}/gl`,
  `${APP_URL}/en`,
  `${APP_URL}/erp-autonomos-espana`,
  `${APP_URL}/software-facturacion-pymes`,
  `${APP_URL}/verifactu-software-certificado`,
  `${APP_URL}/alternativa-holded`,
  `${APP_URL}/alternativa-sage-autonomos`,
  `${APP_URL}/modelo-130-online`,
  `${APP_URL}/software-recursos-humanos-pymes`,
  `${APP_URL}/software-control-horario`,
  `${APP_URL}/software-almacen-inventario`,
  `${APP_URL}/software-crm-pymes`,
  `${APP_URL}/software-contabilidad-pymes`,
  `${APP_URL}/software-nominas-pymes`,
  `${APP_URL}/sobre-nosotros`,
  `${APP_URL}/contacto`,
  `${APP_URL}/ayuda`,
  `${APP_URL}/privacidad`,
  `${APP_URL}/aviso-legal`,
  `${APP_URL}/terminos`,
  `${APP_URL}/cookies`,
];

export async function POST(request: Request) {
  const secret = request.headers.get("x-indexnow-secret");
  if (secret !== process.env.INDEXNOW_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = {
    host: new URL(APP_URL).hostname,
    key: INDEXNOW_KEY,
    keyLocation: `${APP_URL}/${INDEXNOW_KEY}.txt`,
    urlList: PUBLIC_URLS,
  };

  const [bingRes, googleRes] = await Promise.allSettled([
    fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
    }),
    fetch("https://api.indexnow.org/IndexNow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ ...body }),
    }),
  ]);

  return NextResponse.json({
    submitted: PUBLIC_URLS.length,
    bing: bingRes.status === "fulfilled" ? bingRes.value.status : "error",
    google: googleRes.status === "fulfilled" ? googleRes.value.status : "error",
  });
}

// GET with ?secret=xxx triggers submission from the browser (no curl needed)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  if (secret !== process.env.INDEXNOW_SECRET) {
    return NextResponse.json({ info: "IndexNow ready", key: INDEXNOW_KEY, urlCount: PUBLIC_URLS.length });
  }

  const body = {
    host: new URL(APP_URL).hostname,
    key: INDEXNOW_KEY,
    keyLocation: `${APP_URL}/${INDEXNOW_KEY}.txt`,
    urlList: PUBLIC_URLS,
  };

  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  });

  return NextResponse.json({
    submitted: PUBLIC_URLS.length,
    urls: PUBLIC_URLS,
    status: res.status,
    ok: res.status === 200 || res.status === 202,
  });
}
