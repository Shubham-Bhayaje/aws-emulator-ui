import { listKmsKeysAction } from "../../actions";
import CreateRepositoryClient from "./CreateRepositoryClient";

export const dynamic = "force-dynamic";

export default async function CreateRepositoryPage() {
  const { keys } = await listKmsKeysAction();

  return <CreateRepositoryClient kmsKeys={keys || []} />;
}
