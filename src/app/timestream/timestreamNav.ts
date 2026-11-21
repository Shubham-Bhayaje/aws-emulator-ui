export interface TimestreamNavItem {
  label: string;
  href: string;
}

export const timestreamNav: TimestreamNavItem[] = [
  { label: "Databases", href: "/timestream/databases" },
  { label: "Query editor", href: "/timestream/query" },
  { label: "InfluxDB instances", href: "/timestream/influxdb" },
];
