import EndpointsClient from "./EndpointsClient";
import { listVpcEndpointsAction, listVpcsAction, listRouteTablesAction, listSubnetsAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function EndpointsPage() {
  const [endpointsRes, vpcsRes, rtbsRes, subnetsRes] = await Promise.all([
    listVpcEndpointsAction(),
    listVpcsAction(),
    listRouteTablesAction(),
    listSubnetsAction(),
  ]);

  return (
    <EndpointsClient
      initialEndpoints={endpointsRes.success ? endpointsRes.endpoints : []}
      vpcs={vpcsRes.success ? vpcsRes.vpcs : []}
      routeTables={rtbsRes.success ? rtbsRes.routeTables : []}
      subnets={subnetsRes.success ? subnetsRes.subnets : []}
    />
  );
}
