import NatGatewaysClient from "./NatGatewaysClient";
import { listNatGatewaysAction, listSubnetsAction, listElasticIpsAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function NatGatewaysPage() {
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
    />
  );
}
