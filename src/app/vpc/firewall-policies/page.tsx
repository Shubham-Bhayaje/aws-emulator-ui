import { fetchLiveFirewallPolicies } from "../network-firewall-actions";
import FirewallPoliciesClient from "./FirewallPoliciesClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Firewall policies | VPC | AWS Management Console",
};

export default async function FirewallPoliciesPage() {
  const res = await fetchLiveFirewallPolicies();
  const policies = res.success ? res.policies : [];

  return <FirewallPoliciesClient initialPolicies={policies} initialError={res.error || null} />;
}
