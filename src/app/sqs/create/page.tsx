import { listQueuesAction, getKmsKeysAction } from "../actions";
import CreateQueueClient from "./CreateQueueClient";

export const dynamic = "force-dynamic";

export default async function CreateQueuePage() {
  const [queuesRes, kmsKeys] = await Promise.all([
    listQueuesAction(),
    getKmsKeysAction(),
  ]);

  return (
    <CreateQueueClient
      existingQueues={queuesRes.queues || []}
      kmsKeys={kmsKeys}
    />
  );
}
