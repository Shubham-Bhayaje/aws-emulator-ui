import { getResolverDependenciesAction } from "../../resolver-actions";
import CreateResolverQueryLogConfigClient from "./CreateResolverQueryLogConfigClient";

export const dynamic = "force-dynamic";

export default async function CreateResolverQueryLogConfigPage() {
  const depsRes = await getResolverDependenciesAction();
  return <CreateResolverQueryLogConfigClient dependencies={depsRes.dependencies} />;
}
