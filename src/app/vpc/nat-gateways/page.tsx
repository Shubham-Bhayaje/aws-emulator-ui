import NatGatewaysClient from "./NatGatewaysClient";
import { listNatGatewaysAction, listSubnetsAction, listElasticIpsAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function NatGatewaysPage({
  searchParams,
}: {
  searchParams?: Promise<{ search?: string }>;
}) {
  const sp = searchParams ? await searchParams : {};
  const [natsRes, subnetsRes, eipsRes] = await Promise.all([
    listNatGatewaysAction(),
    listSubnetsAction(),
    listElasticIpsAction(),
  ]);

  return (
    <NatGatewaysClient
      initialGateways={natsRes.success ? natsRes.natGateways : []}
      subnets={subnetsRes.success ? subnetsRes.subnets : []}
      elasticIps={eipsRes.success ? eipsRes.elasticIps : []}
      initialSearch={sp.search || ""}
    />
  );
}
