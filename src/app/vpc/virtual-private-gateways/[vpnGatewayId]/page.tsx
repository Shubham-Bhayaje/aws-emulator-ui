import { notFound } from "next/navigation";
import { getVirtualPrivateGatewayDetailAction } from "../../vpn-actions";
import VirtualPrivateGatewayDetailClient from "./VirtualPrivateGatewayDetailClient";

export const dynamic = "force-dynamic";

export default async function VirtualPrivateGatewayDetailPage({
  params,
}: {
  params: Promise<{ vpnGatewayId: string }>;
}) {
  const { vpnGatewayId } = await params;
  const res = await getVirtualPrivateGatewayDetailAction(vpnGatewayId);

  if (!res.success || !res.virtualPrivateGateway) {
    notFound();
  }

  return (
    <VirtualPrivateGatewayDetailClient
      virtualPrivateGateway={res.virtualPrivateGateway}
      vpcs={res.vpcs || []}
    />
  );
}
