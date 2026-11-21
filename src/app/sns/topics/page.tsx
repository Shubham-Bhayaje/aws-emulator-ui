import { listTopicsAction } from "../actions";
import TopicsClient from "./TopicsClient";

export const dynamic = "force-dynamic";

export default async function SnsTopicsPage() {
  const res = await listTopicsAction();
  return <TopicsClient initialTopics={res.topics || []} />;
}
