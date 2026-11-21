/**
 * src/app/iam/account-settings/page.tsx – Account Settings Page.
 * Zero emojis, Cloudscape enterprise styling.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { iamNav } from "../page";
import { fetchAccountDetails, listAllVirtualMFADevicesAction } from "../actions";
import { AccountSettingsClient } from "./AccountSettingsClient";

export const dynamic = "force-dynamic";

export default async function AccountSettingsPage() {
  const [details, mfaRes] = await Promise.all([
    fetchAccountDetails(),
    listAllVirtualMFADevicesAction(),
  ]);

  return (
    <ServiceLayout serviceName="IAM" serviceColor="#BD0816" navItems={iamNav}>
      <AccountSettingsClient
        accountId={details.accountId}
        aliases={details.aliases}
        summary={details.summary}
        initialRootMFAEnabled={mfaRes.rootMFAEnabled}
        initialRootSerialNumber={mfaRes.rootSerialNumber}
      />
    </ServiceLayout>
  );
}
