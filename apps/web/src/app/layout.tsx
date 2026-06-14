import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://tusaas.es";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "ERP SaaS — Gestión empresarial inteligente",
    template: "%s | ERP SaaS",
  },
  description:
    "La plataforma de gestión empresarial más moderna para pymes españolas. CRM, facturación, VeriFactu, contabilidad y más.",
  keywords: ["ERP", "CRM", "facturación", "VeriFactu", "contabilidad", "pymes", "gestión empresarial"],
  authors: [{ name: "Lucas y Leo Digital" }],
  robots: { index: false, follow: true },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: APP_URL,
    siteName: "ERP SaaS",
    title: "ERP SaaS — Gestión empresarial inteligente",
    description:
      "La plataforma de gestión empresarial más moderna para pymes españolas. CRM, facturación, VeriFactu, contabilidad y más.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "ERP SaaS" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ERP SaaS — Gestión empresarial inteligente",
    description:
      "La plataforma de gestión empresarial más moderna para pymes españolas.",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0f1e" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            {children}
            <Toaster richColors position="top-right" />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
