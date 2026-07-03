import { NextResponse } from "next/server";

// Vercel sets VERCEL_DEPLOYMENT_ID on every deploy; locally it's undefined.
const VERSION = process.env.VERCEL_DEPLOYMENT_ID ?? process.env.NODE_ENV ?? "dev";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ version: VERSION });
}
