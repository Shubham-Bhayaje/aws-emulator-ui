import PeeringConnectionsClient from "./PeeringConnectionsClient";
import { listPeeringConnectionsAction, listVpcsAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function PeeringConnectionsPage() {
  const [peersRes, vpcsRes] = await Promise.all([
    listPeeringConnectionsAction(),
    listVpcsAction(),
  ]);

  return (
    <PeeringConnectionsClient
      initialConnections={peersRes.success ? peersRes.peeringConnections : []}
      vpcs={vpcsRes.success ? vpcsRes.vpcs : []}
    />
  );
}
