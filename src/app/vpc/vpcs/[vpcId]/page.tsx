import { notFound } from "next/navigation";
import { getVpcDetailAction } from "../../actions";
import VpcDetailClient from "./VpcDetailClient";

export const dynamic = "force-dynamic";

export default async function VpcDetailPage({
  params,
}: {
  params: Promise<{ vpcId: string }>;
}) {
  const { vpcId } = await params;
  const res = await getVpcDetailAction(vpcId);

  if (!res.success || !res.vpc) {
    notFound();
  }

  return (
    <VpcDetailClient
      vpc={res.vpc}
      subnets={res.subnets || []}
      routeTables={res.routeTables || []}
      internetGateways={res.internetGateways || []}
      natGateways={res.natGateways || []}
      endpoints={res.endpoints || []}
      networkAcls={res.networkAcls || []}
    />
  );
}
