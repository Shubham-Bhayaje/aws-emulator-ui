import VpcsClient from "./VpcsClient";
import {
  listVpcsAction,
  listSubnetsAction,
  listRouteTablesAction,
  listInternetGatewaysAction,
  listNatGatewaysAction,
  listVpcEndpointsAction,
} from "../actions";

export const dynamic = "force-dynamic";

export default async function VpcsPage() {
  const [vpcsRes, subnetsRes, rtbsRes, igwsRes, natsRes, vpcesRes] = await Promise.all([
    listVpcsAction(),
    listSubnetsAction(),
    listRouteTablesAction(),
    listInternetGatewaysAction(),
    listNatGatewaysAction(),
    listVpcEndpointsAction(),
  ]);

  return (
    <VpcsClient
      initialVpcs={vpcsRes.success ? vpcsRes.vpcs : []}
      initialSubnets={subnetsRes.success ? subnetsRes.subnets : []}
      initialRouteTables={rtbsRes.success ? rtbsRes.routeTables : []}
      initialInternetGateways={igwsRes.success ? igwsRes.internetGateways : []}
      initialNatGateways={natsRes.success ? natsRes.natGateways : []}
      initialEndpoints={vpcesRes.success ? vpcesRes.endpoints : []}
    />
  );
}
