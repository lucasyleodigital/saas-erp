import Link from "next/link";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";

// Satellite landing pages that have translated [locale] variants —
// link to the localized URL instead of the always-Spanish bare path.
const TRANSLATED_SLUGS = new Set([
  "/erp-autonomos-espana",
  "/software-facturacion-pymes",
  "/software-contabilidad-pymes",
  "/software-crm-pymes",
  "/software-recursos-humanos-pymes",
  "/software-nominas-pymes",
  "/software-control-horario",
  "/software-almacen-inventario",
  "/modelo-130-online",
  "/alternativa-holded",
  "/alternativa-sage-autonomos",
  "/verifactu-software-certificado",
]);

export function MarketingFooter() {
  const t = useTranslations("marketing.footer");
  const locale = useLocale();

  const localize = (href: string) =>
    locale !== "es" && TRANSLATED_SLUGS.has(href) ? `/${locale}${href}` : href;

  const FOOTER_LINKS = [
    {
      title: t("columns.product.title"),
      links: [
        { href: "#features", label: t("columns.product.features") },
        { href: "#pricing", label: t("columns.product.pricing") },
        { href: "/verifactu-software-certificado", label: t("columns.product.verifactu") },
      ],
    },
    {
      title: t("columns.solutions.title"),
      links: [
        { href: "/erp-autonomos-espana", label: t("columns.solutions.selfEmployed") },
        { href: "/software-facturacion-pymes", label: t("columns.solutions.invoicing") },
        { href: "/software-contabilidad-pymes", label: t("columns.solutions.accounting") },
        { href: "/software-crm-pymes", label: t("columns.solutions.crm") },
        { href: "/software-recursos-humanos-pymes", label: t("columns.solutions.hr") },
        { href: "/software-nominas-pymes", label: t("columns.solutions.payroll") },
        { href: "/software-control-horario", label: t("columns.solutions.timeTracking") },
        { href: "/software-almacen-inventario", label: t("columns.solutions.inventory") },
        { href: "/modelo-130-online", label: t("columns.solutions.model130") },
      ],
    },
    {
      title: t("columns.comparisons.title"),
      links: [
        { href: "/alternativa-holded", label: t("columns.comparisons.holded") },
        { href: "/alternativa-sage-autonomos", label: t("columns.comparisons.sage") },
      ],
    },
    {
      title: t("columns.company.title"),
      links: [
        { href: "/sobre-nosotros", label: t("columns.company.about") },
        { href: "/contacto", label: t("columns.company.contact") },
      ],
    },
    {
      title: t("columns.legal.title"),
      links: [
        { href: "/aviso-legal", label: t("columns.legal.notice") },
        { href: "/privacidad", label: t("columns.legal.privacy") },
        { href: "/terminos", label: t("columns.legal.terms") },
        { href: "/cookies", label: t("columns.legal.cookies") },
      ],
    },
    {
      title: t("columns.support.title"),
      links: [
        { href: "/ayuda", label: t("columns.support.help") },
        { href: "mailto:hola@youwhole.com", label: t("columns.support.technicalSupport") },
      ],
    },
  ];

  return (
    <footer className="border-t border-border bg-muted/20 py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <Image src="/logo.png" alt="YouWhole" width={130} height={36} className="object-contain" />
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("tagline")}
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
                      href={localize(l.href)}
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
            © {new Date().getFullYear()} YouWhole. {t("rightsReserved")}
          </span>
          <div className="flex items-center gap-4">
            <span>{t("madeInSpain")}</span>
            <span className="hidden sm:inline text-border">·</span>
            <span className="hidden sm:inline">
              {t("designedBy")}{" "}
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
