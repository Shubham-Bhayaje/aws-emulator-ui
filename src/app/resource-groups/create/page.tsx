import React from "react";
import { CreateGroupWizard } from "./CreateGroupWizard";
import { fetchTagKeys } from "../actions";

export const dynamic = "force-dynamic";

export default async function CreateGroupPage() {
  const keysRes = await fetchTagKeys();
  return <CreateGroupWizard initialTagKeys={keysRes.data || []} />;
}
