import { notFound } from "next/navigation";
import { getNetworkAclDetailAction } from "../../actions";
import NetworkAclDetailClient from "./NetworkAclDetailClient";

export const dynamic = "force-dynamic";

export default async function NetworkAclDetailPage({
  params,
}: {
  params: Promise<{ networkAclId: string }>;
}) {
  const { networkAclId } = await params;
  const res = await getNetworkAclDetailAction(networkAclId);

  if (!res.success || !res.networkAcl) {
    notFound();
  }

  return (
    <NetworkAclDetailClient
      networkAcl={res.networkAcl}
      associatedSubnets={res.associatedSubnets || []}
      allSubnets={res.allSubnets || []}
      vpc={res.vpc}
    />
  );
}
