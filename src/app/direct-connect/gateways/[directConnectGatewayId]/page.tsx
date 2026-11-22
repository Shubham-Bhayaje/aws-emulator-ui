import { notFound } from "next/navigation";
import { getDirectConnectGatewayDetailAction } from "../../dx-actions";
import DirectConnectGatewayDetailClient from "./DirectConnectGatewayDetailClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ directConnectGatewayId: string }>;
}

export default async function DirectConnectGatewayDetailPage(props: Props) {
  const { directConnectGatewayId } = await props.params;
  const res = await getDirectConnectGatewayDetailAction(directConnectGatewayId);

  if (!res.success || !res.gateway) {
    notFound();
  }

  return (
    <DirectConnectGatewayDetailClient
      gateway={res.gateway}
      virtualInterfaces={res.virtualInterfaces || []}
    />
  );
}
