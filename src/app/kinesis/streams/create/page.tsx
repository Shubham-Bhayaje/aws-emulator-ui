import { getKmsKeysAction } from "../../actions";
import CreateStreamClient from "./CreateStreamClient";

export const dynamic = "force-dynamic";

export default async function CreateStreamPage() {
  const kmsKeys = await getKmsKeysAction();

  return <CreateStreamClient kmsKeys={kmsKeys} />;
}
