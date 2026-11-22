import { notFound } from "next/navigation";
import { getRouteTableDetailAction } from "../../actions";
import { listTransitGatewaysAction } from "../../transit-gateway-actions";
import RouteTableDetailClient from "./RouteTableDetailClient";

export const dynamic = "force-dynamic";

export default async function RouteTableDetailPage({
  params,
}: {
  params: Promise<{ routeTableId: string }>;
}) {
  const { routeTableId } = await params;
  const [res, tgwRes] = await Promise.all([
    getRouteTableDetailAction(routeTableId),
    listTransitGatewaysAction(),
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
      vpc={res.vpc}
    />
  );
}
