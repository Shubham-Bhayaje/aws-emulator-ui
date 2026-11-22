import { listVpnConnectionsAction } from "../vpn-actions";
import VpnConnectionsClient from "./VpnConnectionsClient";

export const dynamic = "force-dynamic";

export default async function VpnConnectionsPage() {
  const res = await listVpnConnectionsAction();

  return (
    <VpnConnectionsClient
      initialVpnConnections={res.success ? res.vpnConnections : []}
    />
  );
}
