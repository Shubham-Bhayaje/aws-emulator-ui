/**
 * Queue detail page – send, receive, delete messages.
 * Matches real AWS Console SQS queue detail view.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { sqs } from "@/lib/aws";
import { ListQueuesCommand, GetQueueAttributesCommand } from "@aws-sdk/client-sqs";
import { QueueDetail } from "./QueueDetail";

const sqsNav = [{ label: "Queues", href: "/sqs" }];

type Props = { params: Promise<{ queue: string }> };

export default async function QueuePage(props: Props) {
  const { queue } = await props.params;
  const queueName = decodeURIComponent(queue);

  // Find queue URL by listing queues
  let queueUrl = "";
  let attrs: Record<string, string> = {};
  let error: string | null = null;

  try {
    const list = await sqs.send(new ListQueuesCommand({ QueueNamePrefix: queueName }));
    const match = (list.QueueUrls ?? []).find((u) => u.endsWith("/" + queueName));
    if (!match) throw new Error("Queue not found: " + queueName);
    queueUrl = match;

    const attrRes = await sqs.send(new GetQueueAttributesCommand({ QueueUrl: queueUrl, AttributeNames: ["All"] }));
    attrs = attrRes.Attributes ?? {};
  } catch (err: unknown) {
    error = err instanceof Error ? err.message : String(err);
  }

  return (
    <ServiceLayout serviceName="SQS" serviceColor="#D946EF" navItems={sqsNav}>
      <div>
        <h1 className="text-[22px] font-bold text-[#16191f] mb-4">{queueName}</h1>

        {error ? (
          <div className="bg-[#fdf3f1] border border-[#d13212] rounded p-4 text-[13px] text-[#d13212]">Error: {error}</div>
        ) : (
          <QueueDetail queueUrl={queueUrl} queueName={queueName} attrs={attrs} />
        )}
      </div>
    </ServiceLayout>
  );
}
