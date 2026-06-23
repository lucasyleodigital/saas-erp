import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { CookieBanner } from "@/components/layout/cookie-banner";
import { Toaster } from "sonner";
import Script from "next/script";
import "./globals.css";

const GA_ID = "G-BMYELB3HTF";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://youwhole.com";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "YouWhole — ERP para autonomos y pymes españolas",
    template: "%s | YouWhole",
  },
  description:
    "YouWhole: ERP creado por autonomos para autonomos y pymes. Facturacion electronica con VeriFactu, IRPF automatico, Modelo 130/303/347, CRM, contabilidad PGC y nominas. Desde 29 EUR/mes, sin permanencia.",
  keywords: [
    "ERP autonomos España",
    "ERP pymes España",
    "software facturacion autonomos",
    "facturacion electronica España",
    "VeriFactu certificado",
    "Modelo 130 autonomos",
    "Modelo 303 IVA",
    "IRPF autonomos",
    "CRM autonomos pymes",
    "contabilidad PGC",
    "nominas online",
    "software gestion empresarial",
    "ERP todo en uno",
    "YouWhole",
    "gestion empresarial pymes autonomos",
    "software autonomos España",
    "facturacion con retencion IRPF",
  ],
  authors: [{ name: "Lucas y Leo Digital", url: "https://lucasyleodigital.com" }],
  creator: "Lucas y Leo Digital",
  publisher: "YouWhole",
  applicationName: "YouWhole",
  category: "Business Software",
  manifest: "/manifest.json",
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  icons: {
    icon: "/logo-icon.png",
    apple: "/logo-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: APP_URL,
    siteName: "YouWhole",
    title: "YouWhole — ERP para autonomos y pymes españolas",
    description:
      "ERP creado por autonomos para autonomos y pymes. VeriFactu, IRPF automatico, Modelo 130/303, CRM y contabilidad en una sola plataforma. Desde 29 EUR/mes.",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 200,
        alt: "YouWhole — ERP para autonomos y pymes españolas",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "YouWhole — ERP para autonomos y pymes españolas",
    description:
      "Creado por autonomos para autonomos y pymes. VeriFactu, IRPF, Modelo 130/303, CRM y contabilidad. Desde 29 EUR/mes.",
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

        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
          `}
        </Script>
      </body>
    </html>
  );
}
