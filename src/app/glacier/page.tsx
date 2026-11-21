import { listVaultsAction } from "./actions";
import VaultsClient from "./VaultsClient";

export const dynamic = "force-dynamic";

export default async function GlacierVaultsPage() {
  const res = await listVaultsAction();
  return <VaultsClient initialVaults={res.vaults || []} />;
}
