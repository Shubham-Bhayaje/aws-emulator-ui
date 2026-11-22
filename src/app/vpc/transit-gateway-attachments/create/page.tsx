import { listTransitGatewaysAction } from "../../transit-gateway-actions";
import { listVpcsAction, listSubnetsAction } from "../../actions";
import CreateTransitGatewayAttachmentClient from "./CreateTransitGatewayAttachmentClient";

export const dynamic = "force-dynamic";

export default async function CreateTransitGatewayAttachmentPage() {
  const [tgwRes, vpcRes, subRes] = await Promise.all([
    listTransitGatewaysAction(),
    listVpcsAction(),
    listSubnetsAction(),
  ]);

  return (
    <CreateTransitGatewayAttachmentClient
      transitGateways={tgwRes.success ? tgwRes.transitGateways : []}
      vpcs={vpcRes.success ? vpcRes.vpcs : []}
      subnets={subRes.success ? subRes.subnets : []}
    />
  );
}
