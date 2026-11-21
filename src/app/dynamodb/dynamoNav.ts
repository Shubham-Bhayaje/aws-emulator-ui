export interface NavItem {
  label: string;
  href: string;
  badge?: string;
}

export const dynamoNav: NavItem[] = [
  { label: "Dashboard", href: "/dynamodb" },
  { label: "Tables", href: "/dynamodb/tables" },
  { label: "Explore items", href: "/dynamodb/explore" },
  { label: "Backups", href: "/dynamodb/backups" },
];
