import { fetchVpcsAndSubnetsAction } from "../actions";
import { CreateClusterWizardClient } from "./CreateClusterWizardClient";

export const dynamic = "force-dynamic";

export default async function CreateClusterPage() {
  const res = await fetchVpcsAndSubnetsAction();
  return (
    <CreateClusterWizardClient
      vpcs={res.vpcs || []}
      subnets={res.subnets || []}
    />
  );
}
