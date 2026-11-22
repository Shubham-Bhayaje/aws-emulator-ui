import SecurityGroupsClient from "./SecurityGroupsClient";
import { listSecurityGroupsAction, listVpcsAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function SecurityGroupsPage() {
  const [sgsRes, vpcsRes] = await Promise.all([
    listSecurityGroupsAction(),
    listVpcsAction(),
  ]);

  return (
    <SecurityGroupsClient
      initialSecurityGroups={sgsRes.success ? sgsRes.securityGroups : []}
      vpcs={vpcsRes.success ? vpcsRes.vpcs : []}
    />
  );
}
