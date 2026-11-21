import { listRepositoriesAction } from "../actions";
import RepositoriesClient from "./RepositoriesClient";

export const dynamic = "force-dynamic";

export default async function EcrRepositoriesPage() {
  const res = await listRepositoriesAction();

  return (
    <RepositoriesClient
      initialRepositories={res.repositories || []}
      initialError={res.error}
    />
  );
}
