import { listConnectionsAction } from "../dx-actions";
import ConnectionsClient from "./ConnectionsClient";

export const dynamic = "force-dynamic";

export default async function ConnectionsPage() {
  const res = await listConnectionsAction();
  const connections = res.success ? res.connections : [];

  return <ConnectionsClient initialConnections={connections} />;
}
