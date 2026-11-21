import React from "react";
import { fetchAccountOverview } from "../actions";
import { CloseAccountClient } from "./CloseAccountClient";

export const dynamic = "force-dynamic";

export default async function CloseAccountPage() {
  const res = await fetchAccountOverview();
  return (
    <CloseAccountClient
      accountId={res.account?.accountId || "000000000000"}
      accountName={res.account?.accountName || "AWS Account"}
    />
  );
}
