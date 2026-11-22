import CloudMapDashboardClient from "./CloudMapDashboardClient";
import { getCloudMapDashboardStatsAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function CloudMapDashboardPage() {
  const stats = await getCloudMapDashboardStatsAction();
  return <CloudMapDashboardClient initialStats={stats} />;
}
