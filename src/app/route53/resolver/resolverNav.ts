export interface NavItem {
  label: string;
  href: string;
}

export const resolverNav: NavItem[] = [
  { label: "Resolver overview", href: "/route53/resolver" },
  { label: "Resolver endpoints", href: "/route53/resolver/endpoints" },
  { label: "Rules", href: "/route53/resolver/rules" },
  { label: "Query logging", href: "/route53/resolver/query-logging" },
  { label: "DNS Firewall", href: "/route53/resolver/firewall" },
];
