import { fetchVpcsAndSubnetsAction } from "../actions";
import { SetupDirectoryWizardClient } from "./SetupDirectoryWizardClient";

export const dynamic = "force-dynamic";

export default async function SetupDirectoryPage() {
  const res = await fetchVpcsAndSubnetsAction();
  return (
    <SetupDirectoryWizardClient
      vpcs={res.vpcs || []}
      subnets={res.subnets || []}
    />
  );
}
