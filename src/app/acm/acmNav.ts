export interface ACMNavItem {
  label: string;
  href: string;
}

export const acmNav: ACMNavItem[] = [
  { label: "Certificates", href: "/acm" },
  { label: "AWS Private CA", href: "/acm/pca" },
];
