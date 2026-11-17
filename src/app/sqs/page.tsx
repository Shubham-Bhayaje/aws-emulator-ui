/**
 * SQS Queues list page – lists all queues, allows create/delete.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { sqs } from "@/lib/aws";
import { ListQueuesCommand, GetQueueAttributesCommand } from "@aws-sdk/client-sqs";
import { QueueActions } from "./QueueActions";

const sqsNav = [{ label: "Queues", href: "/sqs" }];

export default async function SQSPage() {
  let queues: { url: string; name: string; type: string; created: string }[] = [];
  let error: string | null = null;

  try {
    const res = await sqs.send(new ListQueuesCommand({}));
    const urls = res.QueueUrls ?? [];

    // Fetch attributes for each queue
    queues = await Promise.all(
      urls.map(async (url) => {
        const name = url.split("/").pop() ?? url;
        let created = "—";
        let type = "Standard";
        try {
          const attrs = await sqs.send(
            new GetQueueAttributesCommand({ QueueUrl: url, AttributeNames: ["All"] })
          );
          if (attrs.Attributes?.CreatedTimestamp) {
            created = new Date(parseInt(attrs.Attributes.CreatedTimestamp) * 1000)
              .toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
          }
          if (attrs.Attributes?.FifoQueue === "true") type = "FIFO";
        } catch { /* use defaults */ }
        return { url, name, type, created };
      })
    );
  } catch (err: unknown) {
    error = err instanceof Error ? err.message : String(err);
  }

  return (
    <ServiceLayout serviceName="SQS" serviceColor="#D946EF" navItems={sqsNav}>
      <div>
        <h1 className="text-[22px] font-bold text-[#16191f] mb-1">Queues</h1>
        <p className="text-[13px] text-[#545b64] mb-4">
          Amazon SQS queues let you send, store, and receive messages between software components.
        </p>

        {error ? (
          <div className="bg-[#fdf3f1] border border-[#d13212] rounded p-4 text-[13px] text-[#d13212]">Error: {error}</div>
        ) : (
          <QueueActions queues={queues} />
        )}
      </div>
    </ServiceLayout>
  );
}
