export interface SSMNavItem {
  label: string;
  href: string;
}

export const ssmNav: SSMNavItem[] = [
  { label: "Fleet Manager", href: "/systems-manager" },
  { label: "Parameter Store", href: "/systems-manager/parameter-store" },
  { label: "Session Manager", href: "/systems-manager/session-manager" },
];
