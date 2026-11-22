import { listTransitGatewaysAction } from "../transit-gateway-actions";
import TransitGatewaysClient from "./TransitGatewaysClient";

export const dynamic = "force-dynamic";

export default async function TransitGatewaysPage() {
  const res = await listTransitGatewaysAction();

  return (
    <TransitGatewaysClient
      initialTransitGateways={res.transitGateways || []}
    />
  );
}
