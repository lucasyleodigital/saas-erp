import Link from "next/link";

const FOOTER_LINKS = [
  {
    title: "Producto",
    links: [
      { href: "#features", label: "Funcionalidades" },
      { href: "#pricing", label: "Precios" },
      { href: "#verifactu", label: "VeriFactu" },
      { href: "/changelog", label: "Novedades" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { href: "/about", label: "Sobre nosotros" },
      { href: "/blog", label: "Blog" },
      { href: "mailto:hola@tusaas.es", label: "Contacto" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacidad", label: "Privacidad" },
      { href: "/terminos", label: "Términos de uso" },
      { href: "/cookies", label: "Política de cookies" },
      { href: "/rgpd", label: "RGPD" },
    ],
  },
  {
    title: "Soporte",
    links: [
      { href: "/ayuda", label: "Centro de ayuda" },
      { href: "/status", label: "Estado del servicio" },
      { href: "mailto:soporte@tusaas.es", label: "Soporte técnico" },
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
            <Link href="/" className="flex items-center gap-2 font-bold text-lg mb-4">
              <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                E
              </div>
              ERP SaaS
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
            © {new Date().getFullYear()} ERP SaaS. Todos los derechos
            reservados.
          </span>
          <div className="flex items-center gap-4">
            <span>Hecho con ❤️ en España 🇪🇸</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
