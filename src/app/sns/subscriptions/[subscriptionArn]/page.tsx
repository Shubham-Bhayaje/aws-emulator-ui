import Link from "next/link";
import { getSubscriptionDetailsAction } from "../../actions";
import SubscriptionDetailClient from "./SubscriptionDetailClient";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ subscriptionArn: string }> };

export default async function SubscriptionDetailPage(props: Props) {
  const { subscriptionArn: rawArn } = await props.params;
  const subscriptionArn = decodeURIComponent(rawArn);

  const res = await getSubscriptionDetailsAction(subscriptionArn);

  if (!res.success || !res.subscription) {
    return (
      <div className="p-6 max-w-[1200px] mx-auto space-y-4">
        <div className="bg-[#fdf3f1] border border-[#d13212] rounded p-4 text-[13px] text-[#d13212]">
          <span className="font-bold">Error:</span> {res.error || `Subscription "${subscriptionArn}" not found.`}
        </div>
        <div>
          <Link
            href="/sns/subscriptions"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center px-4 rounded font-bold text-[13px] bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors"
          >
            Back to Subscriptions
          </Link>
        </div>
      </div>
    );
  }

  return <SubscriptionDetailClient subscription={res.subscription} />;
}
