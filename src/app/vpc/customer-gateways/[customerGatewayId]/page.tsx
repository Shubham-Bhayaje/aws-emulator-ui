import { notFound } from "next/navigation";
import { getCustomerGatewayDetailAction } from "../../vpn-actions";
import CustomerGatewayDetailClient from "./CustomerGatewayDetailClient";

export const dynamic = "force-dynamic";

export default async function CustomerGatewayDetailPage({
  params,
}: {
  params: Promise<{ customerGatewayId: string }>;
}) {
  const { customerGatewayId } = await params;
  const res = await getCustomerGatewayDetailAction(customerGatewayId);

  if (!res.success || !res.customerGateway) {
    notFound();
  }

  return (
    <CustomerGatewayDetailClient
      customerGateway={res.customerGateway}
      vpnConnections={res.vpnConnections || []}
    />
  );
}
