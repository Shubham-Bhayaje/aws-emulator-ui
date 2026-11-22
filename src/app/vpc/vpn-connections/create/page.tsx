import {
  listCustomerGatewaysAction,
  listVirtualPrivateGatewaysAction,
} from "../../vpn-actions";
import { listTransitGatewaysAction } from "../../transit-gateway-actions";
import CreateVpnConnectionClient from "./CreateVpnConnectionClient";

export const dynamic = "force-dynamic";

export default async function CreateVpnConnectionPage() {
  const [cgwRes, vgwRes, tgwRes] = await Promise.all([
    listCustomerGatewaysAction(),
    listVirtualPrivateGatewaysAction(),
    listTransitGatewaysAction(),
  ]);

  return (
    <CreateVpnConnectionClient
      customerGateways={cgwRes.success ? cgwRes.customerGateways : []}
      virtualPrivateGateways={vgwRes.success ? vgwRes.virtualPrivateGateways : []}
      transitGateways={tgwRes.success ? tgwRes.transitGateways : []}
    />
  );
}
