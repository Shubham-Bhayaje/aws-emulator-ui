export interface KMSNavItem {
  label: string;
  href: string;
}

export const kmsNav: KMSNavItem[] = [
  { label: "Customer managed keys", href: "/kms" },
  { label: "AWS managed keys", href: "/kms/default-keys" },
  { label: "Custom key stores", href: "/kms/custom-keystores" },
];
