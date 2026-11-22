import { notFound } from "next/navigation";
import { getVpnConnectionDetailAction } from "../../vpn-actions";
import VpnConnectionDetailClient from "./VpnConnectionDetailClient";

export const dynamic = "force-dynamic";

export default async function VpnConnectionDetailPage({
  params,
}: {
  params: Promise<{ vpnConnectionId: string }>;
}) {
  const { vpnConnectionId } = await params;
  const res = await getVpnConnectionDetailAction(vpnConnectionId);

  if (!res.success || !res.vpnConnection) {
    notFound();
  }

  return (
    <VpnConnectionDetailClient
      vpnConnection={res.vpnConnection}
      customerGateway={res.customerGateway}
      virtualPrivateGateway={res.virtualPrivateGateway}
    />
  );
}
