import RouteTablesClient from "./RouteTablesClient";
import {
  listRouteTablesAction,
  listVpcsAction,
  listSubnetsAction,
  listInternetGatewaysAction,
  listNatGatewaysAction,
} from "../actions";

export const dynamic = "force-dynamic";

export default async function RouteTablesPage({
  searchParams,
}: {
  searchParams?: Promise<{ search?: string }>;
}) {
  const sp = searchParams ? await searchParams : {};
  const [rtbsRes, vpcsRes, subnetsRes, igwsRes, natsRes] = await Promise.all([
    listRouteTablesAction(),
    listVpcsAction(),
    listSubnetsAction(),
    listInternetGatewaysAction(),
    listNatGatewaysAction(),
  ]);

  return (
    <RouteTablesClient
      initialRouteTables={rtbsRes.success ? rtbsRes.routeTables : []}
      vpcs={vpcsRes.success ? vpcsRes.vpcs : []}
      subnets={subnetsRes.success ? subnetsRes.subnets : []}
      internetGateways={igwsRes.success ? igwsRes.internetGateways : []}
      natGateways={natsRes.success ? natsRes.natGateways : []}
      initialSearch={sp.search || ""}
    />
  );
}
