import { notFound } from "next/navigation";
import { getTopicDetailsAction, getKmsKeysAction } from "../../../actions";
import EditTopicClient from "./EditTopicClient";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ topicArn: string }> };

export default async function EditTopicPage(props: Props) {
  const { topicArn: rawArn } = await props.params;
  const topicArn = decodeURIComponent(rawArn);

  const [topicRes, kmsKeys] = await Promise.all([
    getTopicDetailsAction(topicArn),
    getKmsKeysAction(),
  ]);

  if (!topicRes.success || !topicRes.topic) {
    notFound();
  }

  return <EditTopicClient topic={topicRes.topic} kmsKeys={kmsKeys} />;
}
