import { notFound } from "next/navigation";
import {
  getClientVpnEndpointDetailAction,
  getClientVpnDependenciesAction,
} from "../../client-vpn-actions";
import ClientVpnEndpointDetailClient from "./ClientVpnEndpointDetailClient";

export const dynamic = "force-dynamic";

export default async function ClientVpnEndpointDetailPage({
  params,
}: {
  params: Promise<{ clientVpnEndpointId: string }>;
}) {
  const { clientVpnEndpointId } = await params;

  const [detailRes, depRes] = await Promise.all([
    getClientVpnEndpointDetailAction(clientVpnEndpointId),
    getClientVpnDependenciesAction(),
  ]);

  if (!detailRes.success || !detailRes.endpoint) {
    notFound();
  }

  const dependencies = depRes.success
    ? depRes.data
    : {
        certificates: [],
        vpcs: [],
        subnets: [],
        securityGroups: [],
        directories: [],
        logGroups: [],
      };

  return (
    <ClientVpnEndpointDetailClient
      endpoint={detailRes.endpoint}
      initialTargetNetworks={detailRes.targetNetworks}
      initialRoutes={detailRes.routes}
      dependencies={dependencies}
    />
  );
}
