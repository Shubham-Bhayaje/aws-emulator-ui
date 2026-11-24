import { fetchLiveRuleGroups } from "../network-firewall-actions";
import RuleGroupsClient from "./RuleGroupsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Network Firewall rule groups | VPC | AWS Management Console",
};

export default async function RuleGroupsPage() {
  const [statelessRes, statefulRes] = await Promise.all([
    fetchLiveRuleGroups("STATELESS"),
    fetchLiveRuleGroups("STATEFUL"),
  ]);

  const stateless = (statelessRes.ruleGroups || []).map((r) => ({ ...r, type: "STATELESS" as const }));
  const stateful = (statefulRes.ruleGroups || []).map((r) => ({ ...r, type: "STATEFUL" as const }));
  const allGroups = [...stateless, ...stateful];

  return <RuleGroupsClient initialRuleGroups={allGroups} initialError={statelessRes.error || statefulRes.error || null} />;
}
