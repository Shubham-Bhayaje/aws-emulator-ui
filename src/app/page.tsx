/**
 * Console Home – Authentic AWS Management Console Home page.
 * Renders all core console widgets:
 * - Recently visited (2-column service launcher)
 * - Security (Security Hub posture score, failed controls, findings)
 * - Welcome to AWS (getting started guides and documentation)
 * - Cost and usage (monthly costs, forecasted costs, stacked bar chart, and functional AWS Budgets)
 * - AWS Health (operational issues, scheduled maintenance, and service status)
 * Supports dynamic widget customization and resetting to default layout.
 */

import ConsoleHome from "@/components/ConsoleHome";

export default function HomePage() {
  return <ConsoleHome />;
}
