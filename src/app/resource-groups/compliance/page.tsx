import React from "react";
import { fetchAvailableBuckets } from "../actions";
import { ComplianceClient } from "./ComplianceClient";

export const dynamic = "force-dynamic";

export default async function CompliancePage() {
  const bucketsRes = await fetchAvailableBuckets();
  return <ComplianceClient buckets={bucketsRes.data || []} />;
}
