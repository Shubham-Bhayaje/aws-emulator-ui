import { getKmsKeysAction } from "../../actions";
import CreateTableClient from "./CreateTableClient";

export const dynamic = "force-dynamic";

export default async function CreateTablePage() {
  const kmsKeys = await getKmsKeysAction();

  return <CreateTableClient kmsKeys={kmsKeys} />;
}
