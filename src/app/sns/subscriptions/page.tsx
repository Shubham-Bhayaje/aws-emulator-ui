import { listSubscriptionsAction } from "../actions";
import SubscriptionsClient from "./SubscriptionsClient";

export const dynamic = "force-dynamic";

export default async function SnsSubscriptionsPage() {
  const res = await listSubscriptionsAction();
  return <SubscriptionsClient initialSubscriptions={res.subscriptions || []} />;
}
