import { notFound } from "next/navigation";
import { getNatGatewayDetailAction } from "../../actions";
import NatGatewayDetailClient from "./NatGatewayDetailClient";

export const dynamic = "force-dynamic";

export default async function NatGatewayDetailPage({
  params,
}: {
  params: Promise<{ natGatewayId: string }>;
}) {
  const { natGatewayId } = await params;
  const res = await getNatGatewayDetailAction(natGatewayId);

  if (!res.success || !res.natGateway) {
    notFound();
  }

  return (
    <NatGatewayDetailClient
      natGateway={res.natGateway}
      vpc={res.vpc}
      subnet={res.subnet}
    />
  );
}
