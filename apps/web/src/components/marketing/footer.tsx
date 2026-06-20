import Link from "next/link";
import Image from "next/image";

const FOOTER_LINKS = [
  {
    title: "Producto",
    links: [
      { href: "#features", label: "Funcionalidades" },
      { href: "#pricing", label: "Precios" },
      { href: "#verifactu", label: "VeriFactu" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { href: "/sobre-nosotros", label: "Sobre nosotros" },
      { href: "/contacto", label: "Contacto" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/aviso-legal", label: "Aviso legal" },
      { href: "/privacidad", label: "Política de privacidad" },
      { href: "/terminos", label: "Términos y condiciones" },
      { href: "/cookies", label: "Política de cookies" },
    ],
  },
  {
    title: "Soporte",
    links: [
      { href: "/ayuda", label: "Centro de ayuda" },
      { href: "mailto:soporte@youwhole.com", label: "Soporte técnico" },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-muted/20 py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <Image src="/logo.png" alt="YouWhole" width={130} height={36} className="object-contain" />
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed">
              El ERP más moderno para pymes españolas. VeriFactu, CRM y
              facturación en una sola herramienta.
            </p>
          </div>

          {/* Links */}
          {FOOTER_LINKS.map((col) => (
            <div key={col.title}>
              <p className="font-medium text-sm mb-3">{col.title}</p>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <span>
            © {new Date().getFullYear()} YouWhole. Todos los derechos
            reservados.
          </span>
          <div className="flex items-center gap-4">
            <span>Hecho con ❤️ en España 🇪🇸</span>
            <span className="hidden sm:inline text-border">·</span>
            <span className="hidden sm:inline">
              Diseñado y desarrollado por{" "}
              <a
                href="https://lucasyleodigital.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                Lucas y Leo Digital
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
