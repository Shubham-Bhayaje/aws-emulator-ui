import { getResolverDependenciesAction } from "../../resolver-actions";
import CreateResolverEndpointClient from "./CreateResolverEndpointClient";

export const dynamic = "force-dynamic";

export default async function CreateResolverEndpointPage() {
  const deps = await getResolverDependenciesAction();
  return (
    <CreateResolverEndpointClient
      vpcs={deps.dependencies.vpcs || []}
      subnets={deps.dependencies.subnets || []}
      securityGroups={deps.dependencies.securityGroups || []}
    />
  );
}
