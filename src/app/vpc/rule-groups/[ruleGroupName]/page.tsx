import { notFound } from "next/navigation";
import {
  fetchLiveRuleGroup,
  fetchLiveTagsForResource,
} from "../../network-firewall-actions";
import RuleGroupDetailClient from "./RuleGroupDetailClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ ruleGroupName: string }>;
  searchParams: Promise<{ type?: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { ruleGroupName } = await params;
  return {
    title: `${ruleGroupName} | Rule groups | VPC | AWS Management Console`,
  };
}

export default async function RuleGroupDetailPage({ params, searchParams }: Props) {
  const { ruleGroupName } = await params;
  const { type: rawType } = await searchParams;
  const type = rawType === "STATEFUL" ? "STATEFUL" : "STATELESS";

  const res = await fetchLiveRuleGroup(ruleGroupName, type);

  if (!res.success || !res.response) {
    notFound();
  }

  const tagsRes = res.response.RuleGroupArn
    ? await fetchLiveTagsForResource(res.response.RuleGroupArn)
    : { success: true, tags: [] };

  return (
    <RuleGroupDetailClient
      response={res.response}
      ruleGroup={res.ruleGroup}
      updateToken={res.updateToken || ""}
      initialTags={tagsRes.tags}
    />
  );
}
