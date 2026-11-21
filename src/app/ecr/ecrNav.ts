export interface EcrNavItem {
  label: string;
  href: string;
  group?: string;
}

export const ecrNav: EcrNavItem[] = [
  { label: "Private repositories", href: "/ecr/repositories", group: "Repositories" },
  { label: "Public repositories", href: "/ecr/public-repositories", group: "Repositories" },
  { label: "Registry settings", href: "/ecr/registry-settings", group: "Account settings" },
];
