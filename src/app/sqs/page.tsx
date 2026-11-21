import { listQueuesAction } from "./actions";
import QueuesClient from "./QueuesClient";

export const dynamic = "force-dynamic";

export default async function SQSPage() {
  const res = await listQueuesAction();
  return <QueuesClient initialQueues={res.queues || []} />;
}
