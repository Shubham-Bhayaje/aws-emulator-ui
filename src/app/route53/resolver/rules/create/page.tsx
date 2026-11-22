import { getResolverDependenciesAction, listResolverEndpointsAction } from "../../resolver-actions";
import CreateResolverRuleClient from "./CreateResolverRuleClient";

export const dynamic = "force-dynamic";

export default async function CreateResolverRulePage() {
  const [depsRes, endpointsRes] = await Promise.all([
    getResolverDependenciesAction(),
    listResolverEndpointsAction(),
  ]);

  const outboundEndpoints = (endpointsRes.endpoints || []).filter(
    (ep) => ep.direction === "OUTBOUND"
  );

  return (
    <CreateResolverRuleClient
      vpcs={depsRes.dependencies.vpcs}
      outboundEndpoints={outboundEndpoints}
    />
  );
}
