import { notFound } from "next/navigation";
import {
  getResolverQueryLogConfigDetailAction,
  getResolverDependenciesAction,
} from "../../resolver-actions";
import ResolverQueryLogDetailClient from "./ResolverQueryLogDetailClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ configId: string }>;
}

export default async function ResolverQueryLogDetailPage({ params }: Props) {
  const { configId } = await params;
  const decodedId = decodeURIComponent(configId);

  const [cfgRes, depsRes] = await Promise.all([
    getResolverQueryLogConfigDetailAction(decodedId),
    getResolverDependenciesAction(),
  ]);

  if (!cfgRes.success || !cfgRes.config) {
    notFound();
  }

  return (
    <ResolverQueryLogDetailClient
      config={cfgRes.config}
      initialAssociations={cfgRes.associations}
      availableVpcs={depsRes.dependencies.vpcs}
    />
  );
}
