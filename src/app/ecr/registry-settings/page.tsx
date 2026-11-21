import { getRegistrySettingsAction } from "../actions";
import RegistrySettingsClient from "./RegistrySettingsClient";

export const dynamic = "force-dynamic";

export default async function RegistrySettingsPage() {
  const res = await getRegistrySettingsAction();

  return (
    <RegistrySettingsClient
      initialSettings={
        res.settings || {
          registryId: "000000000000",
          scanType: "BASIC",
          rules: [],
          replicationRules: [],
          pullThroughCacheRules: [],
        }
      }
      initialError={res.error}
    />
  );
}
