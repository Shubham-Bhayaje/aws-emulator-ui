import { listKeyspacesAction } from "./actions";
import KeyspacesClient from "./KeyspacesClient";

export const dynamic = "force-dynamic";

export default async function KeyspacesPage() {
  const { keyspaces, error } = await listKeyspacesAction();

  return <KeyspacesClient initialKeyspaces={keyspaces} initialError={error} />;
}
