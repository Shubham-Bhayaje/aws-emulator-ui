import { getKmsKeysAction } from "../../actions";
import CreateDatabaseClient from "./CreateDatabaseClient";

export const dynamic = "force-dynamic";

export default async function CreateDatabasePage() {
  const kmsKeys = await getKmsKeysAction();

  return <CreateDatabaseClient kmsKeys={kmsKeys} />;
}
