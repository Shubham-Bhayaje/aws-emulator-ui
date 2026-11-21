import { getKmsKeysAction } from "../../actions";
import CreateTopicClient from "./CreateTopicClient";

export const dynamic = "force-dynamic";

export default async function CreateTopicPage() {
  const kmsKeys = await getKmsKeysAction();
  return <CreateTopicClient kmsKeys={kmsKeys} />;
}
