import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { CookieBanner } from "@/components/layout/cookie-banner";
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

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://youwhole.es";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "YouWhole — Todo en uno para tu empresa",
    template: "%s | YouWhole",
  },
  description:
    "YouWhole: la plataforma de gestión empresarial todo en uno para pymes españolas. CRM, facturación, VeriFactu, nóminas, almacén y más.",
  keywords: ["YouWhole", "ERP", "CRM", "facturación", "VeriFactu", "nóminas", "contabilidad", "pymes", "gestión empresarial"],
  authors: [{ name: "Lucas y Leo Digital" }],
  robots: { index: false, follow: true },
  icons: {
    icon: "/logo-icon.png",
    apple: "/logo-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: APP_URL,
    siteName: "YouWhole",
    title: "YouWhole — Todo en uno para tu empresa",
    description:
      "La plataforma de gestión empresarial todo en uno para pymes españolas. CRM, facturación, VeriFactu, nóminas, almacén y más.",
    images: [{ url: "/logo.png", width: 800, height: 200, alt: "YouWhole" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "YouWhole — Todo en uno para tu empresa",
    description:
      "La plataforma de gestión empresarial todo en uno para pymes españolas.",
    images: ["/logo.png"],
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
            <CookieBanner />
            <Toaster richColors position="top-right" />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
