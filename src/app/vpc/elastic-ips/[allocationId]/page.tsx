import { notFound } from "next/navigation";
import { getElasticIpDetailAction } from "../../actions";
import ElasticIpDetailClient from "./ElasticIpDetailClient";

export const dynamic = "force-dynamic";

export default async function ElasticIpDetailPage({
  params,
}: {
  params: Promise<{ allocationId: string }>;
}) {
  const { allocationId } = await params;
  const res = await getElasticIpDetailAction(allocationId);

  if (!res.success || !res.elasticIp) {
    notFound();
  }

  return (
    <ElasticIpDetailClient
      elasticIp={res.elasticIp}
      vpcs={res.vpcs || []}
    />
  );
}
