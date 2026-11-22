import { getResolverOverviewMetricsAction } from "./resolver-actions";
import ResolverDashboardClient from "./ResolverDashboardClient";

export const dynamic = "force-dynamic";

export default async function Route53ResolverDashboardPage() {
  const metrics = await getResolverOverviewMetricsAction();
  return <ResolverDashboardClient metrics={metrics} />;
}
