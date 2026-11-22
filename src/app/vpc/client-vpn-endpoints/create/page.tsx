import { getClientVpnDependenciesAction } from "../../client-vpn-actions";
import CreateClientVpnEndpointClient from "./CreateClientVpnEndpointClient";

export const dynamic = "force-dynamic";

export default async function CreateClientVpnEndpointPage() {
  const res = await getClientVpnDependenciesAction();
  const dependencies = res.success
    ? res.data
    : {
        certificates: [],
        vpcs: [],
        subnets: [],
        securityGroups: [],
        directories: [],
        logGroups: [],
      };

  return <CreateClientVpnEndpointClient dependencies={dependencies} />;
}
