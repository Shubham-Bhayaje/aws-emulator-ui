import { fetchLiveRuleGroups, fetchKmsKeys } from "../../network-firewall-actions";
import CreateFirewallPolicyClient from "./CreateFirewallPolicyClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Create firewall policy | VPC | AWS Management Console",
};

export default async function CreateFirewallPolicyPage() {
  const [statelessRes, statefulRes, kmsKeys] = await Promise.all([
    fetchLiveRuleGroups("STATELESS"),
    fetchLiveRuleGroups("STATEFUL"),
    fetchKmsKeys(),
  ]);

  return (
    <CreateFirewallPolicyClient
      statelessRuleGroups={statelessRes.ruleGroups}
      statefulRuleGroups={statefulRes.ruleGroups}
      kmsKeys={kmsKeys}
    />
  );
}
