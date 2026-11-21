import { notFound } from "next/navigation";
import { getQueueDetailsAction, listQueuesAction, getKmsKeysAction } from "../../actions";
import EditQueueClient from "./EditQueueClient";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ queue: string }>;
};

export default async function EditQueuePage(props: Props) {
  const { queue } = await props.params;
  const queueName = decodeURIComponent(queue);

  const [queueRes, queuesRes, kmsKeys] = await Promise.all([
    getQueueDetailsAction(queueName),
    listQueuesAction(),
    getKmsKeysAction(),
  ]);

  if (!queueRes.success || !queueRes.url || !queueRes.attributes) {
    notFound();
  }

  const isFifo = queueName.endsWith(".fifo") || queueRes.attributes.FifoQueue === "true";

  return (
    <EditQueueClient
      queueUrl={queueRes.url}
      queueName={queueName}
      isFifo={isFifo}
      attributes={queueRes.attributes}
      initialTags={queueRes.tags || {}}
      existingQueues={queuesRes.queues || []}
      kmsKeys={kmsKeys}
    />
  );
}
