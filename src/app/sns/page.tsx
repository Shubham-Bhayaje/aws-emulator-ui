import { listTopicsAction } from "./actions";
import TopicsClient from "./topics/TopicsClient";

export const dynamic = "force-dynamic";

export default async function SnsPage() {
  const res = await listTopicsAction();
  return <TopicsClient initialTopics={res.topics || []} />;
}
