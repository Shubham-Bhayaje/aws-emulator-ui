import { fetchAutoManagementConfig } from "../actions";
import SettingsClient from "./SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const res = await fetchAutoManagementConfig();
  const optInStatus = res.success ? res.optInStatus : "DISABLED";

  return <SettingsClient initialOptInStatus={optInStatus} />;
}
