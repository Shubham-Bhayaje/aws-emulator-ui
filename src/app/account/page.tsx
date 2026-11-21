import React from "react";
import {
  fetchAccountOverview,
  fetchAlternateContacts,
  fetchRegionsAction,
} from "./actions";
import { AccountSettingsClient } from "./AccountSettingsClient";

export const dynamic = "force-dynamic";

export default async function AccountSettingsPage() {
  const [overviewRes, alternateRes, regionsRes] = await Promise.all([
    fetchAccountOverview(),
    fetchAlternateContacts(),
    fetchRegionsAction(),
  ]);

  return (
    <AccountSettingsClient
      initialAccount={
        overviewRes.account || {
          accountId: "000000000000",
          accountName: "AWS Account",
          accountState: "ACTIVE",
        }
      }
      initialContact={
        overviewRes.contact || {
          fullName: "",
          addressLine1: "",
          city: "",
          stateOrRegion: "",
          postalCode: "",
          countryCode: "US",
          phoneNumber: "",
        }
      }
      initialAlternateContacts={alternateRes.contacts || {}}
      initialRegions={regionsRes.regions || []}
    />
  );
}
