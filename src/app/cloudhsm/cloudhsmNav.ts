export interface CloudHSMNavItem {
  label: string;
  href: string;
}

export const cloudhsmNav: CloudHSMNavItem[] = [
  { label: "Clusters", href: "/cloudhsm" },
  { label: "Backups", href: "/cloudhsm/backups" },
];
