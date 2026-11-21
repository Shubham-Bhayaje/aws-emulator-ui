export interface SecretsManagerNavItem {
  label: string;
  href: string;
}

export const secretsManagerNav: SecretsManagerNavItem[] = [
  { label: "Secrets", href: "/secretsmanager" },
  { label: "Settings", href: "/secretsmanager/settings" },
];
