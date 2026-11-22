import { listConfigurationSetsAction } from "../actions";
import ConfigurationSetsClient from "./ConfigurationSetsClient";

export const dynamic = "force-dynamic";

export default async function ConfigurationSetsPage() {
  const res = await listConfigurationSetsAction();
  return <ConfigurationSetsClient initialConfigSets={res.configurationSets || []} />;
}
