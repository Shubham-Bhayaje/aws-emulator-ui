import {
  listConnectionsAction,
  listDirectConnectGatewaysAction,
  listVirtualInterfacesAction,
  listLocationsAction,
} from "./dx-actions";
import DirectConnectDashboardClient from "./DirectConnectDashboardClient";

export const dynamic = "force-dynamic";

export default async function DirectConnectDashboardPage() {
  const [connsRes, gwsRes, vifsRes, locsRes] = await Promise.all([
    listConnectionsAction(),
    listDirectConnectGatewaysAction(),
    listVirtualInterfacesAction(),
    listLocationsAction(),
  ]);

  return (
    <DirectConnectDashboardClient
      connections={connsRes.success ? connsRes.connections : []}
      gateways={gwsRes.success ? gwsRes.gateways : []}
      virtualInterfaces={vifsRes.success ? vifsRes.virtualInterfaces : []}
      locations={locsRes.success ? locsRes.locations : []}
    />
  );
}
