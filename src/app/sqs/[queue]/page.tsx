/**
 * Queue detail page – send, receive, delete messages, tabs for monitoring, encryption, DLQ, etc.
 * Matches real AWS Management Console SQS queue detail view.
 */

import Link from "next/link";
import {
  getQueueDetailsAction,
  getKmsKeysAction,
  getLambdaFunctionsAction,
  listQueuesAction,
} from "../actions";
import { listTopicsAction } from "@/app/sns/actions";
import QueueDetailClient from "./QueueDetailClient";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ queue: string }> };

export default async function QueueDetailPage(props: Props) {
  const { queue } = await props.params;
  const queueName = decodeURIComponent(queue);

  const [detailsRes, kmsRes, lambdaRes, listRes, topicsRes] = await Promise.all([
    getQueueDetailsAction(queueName),
    getKmsKeysAction(),
    getLambdaFunctionsAction(),
    listQueuesAction(),
    listTopicsAction(),
  ]);

  if (!detailsRes.success || !detailsRes.url || !detailsRes.attributes) {
    return (
      <div className="p-6 max-w-[1200px] mx-auto space-y-4">
        <div className="bg-[#fdf3f1] border border-[#d13212] rounded p-4 text-[13px] text-[#d13212]">
          <span className="font-bold">Error:</span> {detailsRes.error || `Queue "${queueName}" not found.`}
        </div>
        <div>
          <Link
            href="/sqs"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center px-4 rounded font-bold text-[13px] bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors"
          >
            Back to Queues
          </Link>
        </div>
      </div>
    );
  }

  const isFifo = queueName.endsWith(".fifo") || detailsRes.attributes.FifoQueue === "true";

  return (
    <QueueDetailClient
      queueUrl={detailsRes.url}
      queueName={queueName}
      isFifo={isFifo}
      attributes={detailsRes.attributes}
      initialTags={detailsRes.tags || {}}
      kmsKeys={kmsRes}
      lambdaFunctions={lambdaRes}
      siblingQueues={listRes.queues}
      snsTopics={topicsRes.topics || []}
    />
  );
}
