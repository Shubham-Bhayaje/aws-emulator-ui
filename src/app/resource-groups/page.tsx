import React from "react";
import { fetchGroups } from "./actions";
import { GroupsClient } from "./GroupsClient";

export const dynamic = "force-dynamic";

export default async function SavedGroupsPage() {
  const res = await fetchGroups();
  return <GroupsClient initialGroups={res.data || []} />;
}
