import { notFound } from "next/navigation";
import { getTopicDetailsAction } from "../../../actions";
import PublishMessageClient from "./PublishMessageClient";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ topicArn: string }> };

export default async function PublishMessagePage(props: Props) {
  const { topicArn: rawArn } = await props.params;
  const topicArn = decodeURIComponent(rawArn);

  const res = await getTopicDetailsAction(topicArn);
  if (!res.success || !res.topic) {
    notFound();
  }

  return <PublishMessageClient topic={res.topic} />;
}
