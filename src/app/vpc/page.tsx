import VpcDashboardClient from "./VpcDashboardClient";
import { getVpcDashboardStatsAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function VpcDashboardPage() {
  const res = await getVpcDashboardStatsAction();
  const initialStats = res.success
    ? res.stats
    : {
        vpcsCount: 0,
        subnetsCount: 0,
        routeTablesCount: 0,
        internetGatewaysCount: 0,
        natGatewaysCount: 0,
        elasticIpsCount: 0,
        endpointsCount: 0,
        securityGroupsCount: 0,
        networkAclsCount: 0,
        peeringConnectionsCount: 0,
        dhcpOptionsCount: 0,
      };

  return <VpcDashboardClient initialStats={initialStats} />;
}
