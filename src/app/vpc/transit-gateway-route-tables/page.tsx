import { listTransitGatewayRouteTablesAction } from "../transit-gateway-actions";
import TransitGatewayRouteTablesClient from "./TransitGatewayRouteTablesClient";

export const dynamic = "force-dynamic";

export default async function TransitGatewayRouteTablesPage() {
  const res = await listTransitGatewayRouteTablesAction();

  return (
    <TransitGatewayRouteTablesClient
      initialRouteTables={res.success ? res.routeTables : []}
    />
  );
}
