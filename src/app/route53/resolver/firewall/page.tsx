import {
  listFirewallConfigsAction,
  listFirewallDomainListsAction,
  listFirewallRuleGroupsAction,
} from "../resolver-actions";
import DnsFirewallClient from "./DnsFirewallClient";

export const dynamic = "force-dynamic";

export default async function DnsFirewallPage() {
  const [configsRes, domainListsRes, ruleGroupsRes] = await Promise.all([
    listFirewallConfigsAction(),
    listFirewallDomainListsAction(),
    listFirewallRuleGroupsAction(),
  ]);

  return (
    <DnsFirewallClient
      initialConfigs={configsRes.configs}
      initialDomainLists={domainListsRes.domainLists}
      initialRuleGroups={ruleGroupsRes.ruleGroups}
    />
  );
}
