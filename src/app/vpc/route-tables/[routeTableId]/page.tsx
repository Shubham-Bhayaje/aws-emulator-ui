import { notFound } from "next/navigation";
import { getRouteTableDetailAction } from "../../actions";
import { listTransitGatewaysAction } from "../../transit-gateway-actions";
import { listVirtualPrivateGatewaysAction } from "../../vpn-actions";
import RouteTableDetailClient from "./RouteTableDetailClient";

export const dynamic = "force-dynamic";

export default async function RouteTableDetailPage({
  params,
}: {
  params: Promise<{ routeTableId: string }>;
}) {
  const { routeTableId } = await params;
  const [res, tgwRes, vgwRes] = await Promise.all([
    getRouteTableDetailAction(routeTableId),
    listTransitGatewaysAction(),
    listVirtualPrivateGatewaysAction(),
  ]);

  if (!res.success || !res.routeTable) {
    notFound();
  }

  return (
    <RouteTableDetailClient
      routeTable={res.routeTable}
      associatedSubnets={res.associatedSubnets || []}
      unassociatedSubnets={res.unassociatedSubnets || []}
      allSubnets={res.allSubnets || []}
      internetGateways={res.internetGateways || []}
      natGateways={res.natGateways || []}
      endpoints={res.endpoints || []}
      transitGateways={tgwRes.success ? tgwRes.transitGateways : []}
      virtualPrivateGateways={vgwRes.success ? vgwRes.vpnGateways : []}
      vpc={res.vpc}
    />
  );
}
