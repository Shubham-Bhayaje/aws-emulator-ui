import NetworkAclsClient from "./NetworkAclsClient";
import { listNetworkAclsAction, listVpcsAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function NetworkAclsPage() {
  const [naclsRes, vpcsRes] = await Promise.all([
    listNetworkAclsAction(),
    listVpcsAction(),
  ]);

  return (
    <NetworkAclsClient
      initialNetworkAcls={naclsRes.success ? naclsRes.networkAcls : []}
      vpcs={vpcsRes.success ? vpcsRes.vpcs : []}
    />
  );
}
