import { notFound } from "next/navigation";
import { getVpcEndpointDetailAction } from "../../actions";
import EndpointDetailClient from "./EndpointDetailClient";

export const dynamic = "force-dynamic";

export default async function EndpointDetailPage({
  params,
}: {
  params: Promise<{ endpointId: string }>;
}) {
  const { endpointId } = await params;
  const res = await getVpcEndpointDetailAction(endpointId);

  if (!res.success || !res.endpoint) {
    notFound();
  }

  return (
    <EndpointDetailClient
      endpoint={res.endpoint}
      vpc={res.vpc}
      routeTables={res.routeTables || []}
      subnets={res.subnets || []}
      allRouteTables={res.allRouteTables || []}
      allSubnets={res.allSubnets || []}
    />
  );
}
