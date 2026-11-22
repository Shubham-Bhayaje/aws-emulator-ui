export interface AppConfigNavItem {
  label: string;
  href: string;
  group?: string;
  badge?: string;
}

export const appconfigNav: AppConfigNavItem[] = [
  { label: "Applications", href: "/appconfig/applications", group: "Configurations" },
  { label: "Deployment strategies", href: "/appconfig/deployment-strategies", group: "Deployments" },
  { label: "Extensions", href: "/appconfig/extensions", group: "Deployments" },
  { label: "Account settings", href: "/appconfig/account-settings", group: "Settings" },
];
