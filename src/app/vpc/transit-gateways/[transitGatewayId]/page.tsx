import { notFound } from "next/navigation";
import { getTransitGatewayDetailAction } from "../../transit-gateway-actions";
import TransitGatewayDetailClient from "./TransitGatewayDetailClient";

export const dynamic = "force-dynamic";

export default async function TransitGatewayDetailPage({
  params,
}: {
  params: Promise<{ transitGatewayId: string }>;
}) {
  const { transitGatewayId } = await params;
  const res = await getTransitGatewayDetailAction(transitGatewayId);

  if (!res.success || !res.transitGateway) {
    notFound();
  }

  return (
    <TransitGatewayDetailClient
      transitGateway={res.transitGateway}
      attachments={res.attachments || []}
      routeTables={res.routeTables || []}
    />
  );
}
