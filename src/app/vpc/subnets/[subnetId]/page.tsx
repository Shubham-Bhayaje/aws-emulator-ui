import { notFound } from "next/navigation";
import { getSubnetDetailAction } from "../../actions";
import SubnetDetailClient from "./SubnetDetailClient";

export const dynamic = "force-dynamic";

export default async function SubnetDetailPage({
  params,
}: {
  params: Promise<{ subnetId: string }>;
}) {
  const { subnetId } = await params;
  const res = await getSubnetDetailAction(subnetId);

  if (!res.success || !res.subnet) {
    notFound();
  }

  return (
    <SubnetDetailClient
      subnet={res.subnet}
      routeTable={res.routeTable}
      networkAcl={res.networkAcl}
      allRouteTables={res.allRouteTables || []}
      vpc={res.vpc}
    />
  );
}
