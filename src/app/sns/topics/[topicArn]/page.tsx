import Link from "next/link";
import {
  getTopicDetailsAction,
  listSubscriptionsByTopicAction,
  getSqsQueuesAction,
  getLambdaFunctionsAction,
} from "../../actions";
import TopicDetailClient from "./TopicDetailClient";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ topicArn: string }> };

export default async function TopicDetailPage(props: Props) {
  const { topicArn: rawArn } = await props.params;
  const topicArn = decodeURIComponent(rawArn);

  const [topicRes, subsRes, sqsQueues, lambdaFunctions] = await Promise.all([
    getTopicDetailsAction(topicArn),
    listSubscriptionsByTopicAction(topicArn),
    getSqsQueuesAction(),
    getLambdaFunctionsAction(),
  ]);

  if (!topicRes.success || !topicRes.topic) {
    return (
      <div className="p-6 max-w-[1200px] mx-auto space-y-4">
        <div className="bg-[#fdf3f1] border border-[#d13212] rounded p-4 text-[13px] text-[#d13212]">
          <span className="font-bold">Error:</span> {topicRes.error || `Topic "${topicArn}" not found.`}
        </div>
        <div>
          <Link
            href="/sns/topics"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center px-4 rounded font-bold text-[13px] bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors"
          >
            Back to Topics
          </Link>
        </div>
      </div>
    );
  }

  return (
    <TopicDetailClient
      topic={topicRes.topic}
      initialSubscriptions={subsRes.subscriptions || []}
      sqsQueues={sqsQueues}
      lambdaFunctions={lambdaFunctions}
    />
  );
}
