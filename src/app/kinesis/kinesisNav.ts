export interface KinesisNavItem {
  label: string;
  href: string;
}

export const kinesisNav: KinesisNavItem[] = [
  { label: "Data streams", href: "/kinesis/streams" },
  { label: "Data delivery streams", href: "/kinesis/delivery-streams" },
  { label: "Analytics applications", href: "/kinesis/analytics" },
  { label: "Video streams", href: "/kinesis/video-streams" },
];
