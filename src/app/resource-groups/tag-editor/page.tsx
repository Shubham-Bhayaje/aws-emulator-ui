import React from "react";
import { searchResources, fetchTagKeys } from "../actions";
import { TagEditorClient } from "./TagEditorClient";

export const dynamic = "force-dynamic";

export default async function TagEditorPage() {
  const [resourcesRes, keysRes] = await Promise.all([
    searchResources({ regions: ["us-east-1"], resourceTypes: [], tagFilters: [] }),
    fetchTagKeys(),
  ]);

  return (
    <TagEditorClient
      initialResources={resourcesRes.data || []}
      initialTagKeys={keysRes.data || []}
    />
  );
}
