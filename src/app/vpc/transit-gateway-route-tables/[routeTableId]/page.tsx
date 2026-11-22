import { notFound } from "next/navigation";
import { getTransitGatewayRouteTableDetailAction } from "../../transit-gateway-actions";
import TransitGatewayRouteTableDetailClient from "./TransitGatewayRouteTableDetailClient";

export const dynamic = "force-dynamic";

export default async function TransitGatewayRouteTableDetailPage({
  params,
}: {
  params: Promise<{ routeTableId: string }>;
}) {
  const { routeTableId } = await params;
  const res = await getTransitGatewayRouteTableDetailAction(routeTableId);

  if (!res.success || !res.routeTable) {
    notFound();
  }

  return (
    <TransitGatewayRouteTableDetailClient
      routeTable={res.routeTable}
      associations={res.associations || []}
      propagations={res.propagations || []}
      routes={res.routes || []}
      availableAttachments={res.availableAttachments || []}
    />
  );
}
