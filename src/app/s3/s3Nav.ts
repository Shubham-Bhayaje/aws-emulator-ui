export interface S3NavItem {
  label: string;
  href: string;
}

export const s3Nav: S3NavItem[] = [
  { label: "Buckets", href: "/s3" },
  { label: "Access Points", href: "/s3/access-points" },
  { label: "Storage Lens", href: "/s3/storage-lens" },
  { label: "Block Public Access (account settings)", href: "/s3/settings" },
];
