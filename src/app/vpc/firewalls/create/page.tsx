import {
  fetchVpcsAndSubnets,
  fetchLiveFirewallPolicies,
  fetchKmsKeys,
} from "../../network-firewall-actions";
import CreateFirewallClient from "./CreateFirewallClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Create firewall | VPC | AWS Management Console",
};

export default async function CreateFirewallPage() {
  const [vpcSubData, policyData, kmsData] = await Promise.all([
    fetchVpcsAndSubnets(),
    fetchLiveFirewallPolicies(),
    fetchKmsKeys(),
  ]);

  return (
    <CreateFirewallClient
      vpcs={vpcSubData.vpcs}
      subnets={vpcSubData.subnets}
      policies={policyData.policies}
      kmsKeys={kmsData}
    />
  );
}
