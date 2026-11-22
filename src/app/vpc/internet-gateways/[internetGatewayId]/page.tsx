import { notFound } from "next/navigation";
import { getInternetGatewayDetailAction } from "../../actions";
import InternetGatewayDetailClient from "./InternetGatewayDetailClient";

export const dynamic = "force-dynamic";

export default async function InternetGatewayDetailPage({
  params,
}: {
  params: Promise<{ internetGatewayId: string }>;
}) {
  const { internetGatewayId } = await params;
  const res = await getInternetGatewayDetailAction(internetGatewayId);

  if (!res.success || !res.internetGateway) {
    notFound();
  }

  return (
    <InternetGatewayDetailClient
      internetGateway={res.internetGateway}
      vpcs={res.vpcs || []}
      attachedVpc={res.attachedVpc}
    />
  );
}
