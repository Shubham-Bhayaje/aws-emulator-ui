export interface CloudWatchNavItem {
  label: string;
  href: string;
  group?: string;
}

export const cloudwatchNav: CloudWatchNavItem[] = [
  { label: "Log groups", href: "/cloudwatch/logs", group: "Logs" },
  { label: "Live Tail", href: "/cloudwatch/logs/live-tail", group: "Logs" },
  { label: "Log Insights", href: "/cloudwatch/logs/insights", group: "Logs" },
  { label: "All alarms", href: "/cloudwatch/alarms", group: "Alarms" },
  { label: "All metrics", href: "/cloudwatch/metrics", group: "Metrics" },
];
