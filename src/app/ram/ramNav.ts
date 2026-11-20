import { NavItem } from "@/components/ServiceLayout";

export const ramNav: NavItem[] = [
  { label: "Resource shares", href: "/ram", group: "Shared by me" },
  { label: "Shared resources", href: "/ram/resources", group: "Shared by me" },
  { label: "Principals", href: "/ram/principals", group: "Shared by me" },
  { label: "Resource shares", href: "/ram/shared-with-me", group: "Shared with me" },
  { label: "Shared resources", href: "/ram/shared-with-me/resources", group: "Shared with me" },
  { label: "Principals", href: "/ram/shared-with-me/principals", group: "Shared with me" },
  { label: "Permissions library", href: "/ram/permissions", group: "Permissions" },
  { label: "Settings", href: "/ram/settings", group: "Settings" },
];
