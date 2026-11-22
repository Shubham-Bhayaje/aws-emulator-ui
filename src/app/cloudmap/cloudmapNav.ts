export interface CloudMapNavItem {
  label: string;
  href: string;
  group?: string;
  badge?: string;
}

export const cloudmapNav: CloudMapNavItem[] = [
  { label: "Overview", href: "/cloudmap" },
  { label: "Namespaces", href: "/cloudmap/namespaces" },
  { label: "Services", href: "/cloudmap/services" },
];
