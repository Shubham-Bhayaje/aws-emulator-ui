import { notFound } from "next/navigation";
import { getResolverRuleDetailAction, getResolverDependenciesAction } from "../../resolver-actions";
import ResolverRuleDetailClient from "./ResolverRuleDetailClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ ruleId: string }>;
}

export default async function ResolverRuleDetailPage({ params }: Props) {
  const { ruleId } = await params;
  const decodedId = decodeURIComponent(ruleId);

  const [ruleRes, depsRes] = await Promise.all([
    getResolverRuleDetailAction(decodedId),
    getResolverDependenciesAction(),
  ]);

  if (!ruleRes.success || !ruleRes.rule) {
    notFound();
  }

  return (
    <ResolverRuleDetailClient
      rule={ruleRes.rule}
      initialAssociations={ruleRes.associations}
      availableVpcs={depsRes.dependencies.vpcs}
    />
  );
}
