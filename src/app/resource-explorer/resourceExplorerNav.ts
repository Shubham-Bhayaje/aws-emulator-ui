export interface ResourceExplorerNavItem {
  label: string;
  href: string;
  group?: string;
  badge?: string;
}

export const resourceExplorerNav: ResourceExplorerNavItem[] = [
  { label: "Resource search", href: "/resource-explorer" },
  { label: "Views", href: "/resource-explorer/views" },
  { label: "Settings", href: "/resource-explorer/settings" },
];
