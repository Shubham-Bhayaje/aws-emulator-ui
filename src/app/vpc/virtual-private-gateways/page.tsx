import { listVirtualPrivateGatewaysAction } from "../vpn-actions";
import { listVpcsAction } from "../actions";
import VirtualPrivateGatewaysClient from "./VirtualPrivateGatewaysClient";

export const dynamic = "force-dynamic";

export default async function VirtualPrivateGatewaysPage() {
  const [vgwRes, vpcRes] = await Promise.all([
    listVirtualPrivateGatewaysAction(),
    listVpcsAction(),
  ]);

  return (
    <VirtualPrivateGatewaysClient
      initialVirtualPrivateGateways={vgwRes.success ? vgwRes.virtualPrivateGateways : []}
      vpcs={vpcRes.success ? vpcRes.vpcs : []}
    />
  );
}
