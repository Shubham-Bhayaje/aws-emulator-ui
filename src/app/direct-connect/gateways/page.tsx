import { listDirectConnectGatewaysAction } from "../dx-actions";
import DirectConnectGatewaysClient from "./DirectConnectGatewaysClient";

export const dynamic = "force-dynamic";

export default async function DirectConnectGatewaysPage() {
  const res = await listDirectConnectGatewaysAction();
  return <DirectConnectGatewaysClient initialGateways={res.gateways || []} />;
}
