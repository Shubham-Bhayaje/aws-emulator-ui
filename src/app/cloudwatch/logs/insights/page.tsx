import { listLogGroupsAction } from "../actions";
import InsightsClient from "./InsightsClient";

export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const res = await listLogGroupsAction();

  return <InsightsClient logGroups={res.logGroups} />;
}
