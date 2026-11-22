import { getAccountSendingStatusAction } from "../actions";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function SESDashboardPage() {
  const statusRes = await getAccountSendingStatusAction();
  const metrics = statusRes.metrics || {
    productionAccessEnabled: false,
    sendingEnabled: true,
    enforcementStatus: "HEALTHY",
    max24HourSend: 200,
    sentLast24Hours: 0,
    maxSendRate: 1.0,
    bounceRate: 0.0,
    complaintRate: 0.0,
  };

  return <DashboardClient initialMetrics={metrics} />;
}
