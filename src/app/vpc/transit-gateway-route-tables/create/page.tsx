import { listTransitGatewaysAction } from "../../transit-gateway-actions";
import CreateTransitGatewayRouteTableClient from "./CreateTransitGatewayRouteTableClient";

export const dynamic = "force-dynamic";

export default async function CreateTransitGatewayRouteTablePage() {
  const tgwRes = await listTransitGatewaysAction();

  return (
    <CreateTransitGatewayRouteTableClient
      transitGateways={tgwRes.success ? tgwRes.transitGateways : []}
    />
  );
}
