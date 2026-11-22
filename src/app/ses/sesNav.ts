export interface SesNavItem {
  label: string;
  href: string;
  group?: string;
}

export const sesNav: SesNavItem[] = [
  { label: "Account dashboard", href: "/ses/dashboard" },
  { label: "Verified identities", href: "/ses/identities", group: "Configuration" },
  { label: "Configuration sets", href: "/ses/configuration-sets", group: "Configuration" },
  { label: "Email templates", href: "/ses/templates", group: "Configuration" },
  { label: "Suppression list", href: "/ses/suppression-list", group: "Configuration" },
  { label: "SMTP settings", href: "/ses/smtp", group: "Account settings" },
];
