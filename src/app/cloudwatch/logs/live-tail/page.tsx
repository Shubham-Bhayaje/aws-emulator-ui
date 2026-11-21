import { listLogGroupsAction } from "../actions";
import LiveTailClient from "./LiveTailClient";

export const dynamic = "force-dynamic";

export default async function LiveTailPage() {
  const res = await listLogGroupsAction();

  return <LiveTailClient logGroups={res.logGroups} />;
}
