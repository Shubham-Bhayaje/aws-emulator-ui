import { notFound } from "next/navigation";
import {
  fetchLiveFirewallPolicy,
  fetchLiveFirewalls,
  fetchLiveTagsForResource,
} from "../../network-firewall-actions";
import FirewallPolicyDetailClient from "./FirewallPolicyDetailClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ policyName: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { policyName } = await params;
  return {
    title: `${policyName} | Firewall policies | VPC | AWS Management Console`,
  };
}

export default async function FirewallPolicyDetailPage({ params }: Props) {
  const { policyName } = await params;
  const res = await fetchLiveFirewallPolicy(policyName);

  if (!res.success || !res.response) {
    notFound();
  }

  const [fwRes, tagsRes] = await Promise.all([
    fetchLiveFirewalls(),
    res.response.FirewallPolicyArn
      ? fetchLiveTagsForResource(res.response.FirewallPolicyArn)
      : Promise.resolve({ success: true, tags: [] }),
  ]);

  // Find firewalls referencing this policy
  const associatedFirewalls = (fwRes.firewalls || []).filter(
    (f) => f.FirewallArn && f.FirewallName // in list firewalls, name is returned
  );

  return (
    <FirewallPolicyDetailClient
      policyResponse={res.response}
      policy={res.policy}
      updateToken={res.updateToken || ""}
      associatedFirewalls={associatedFirewalls}
      initialTags={tagsRes.tags}
    />
  );
}
