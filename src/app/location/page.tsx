import LocationDashboardClient from "./LocationDashboardClient";
import { getLocationDashboardStatsAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function LocationDashboardPage() {
  const stats = await getLocationDashboardStatsAction();
  return <LocationDashboardClient initialStats={stats} />;
}
