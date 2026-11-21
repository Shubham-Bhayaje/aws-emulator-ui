import React from "react";
import { notFound } from "next/navigation";
import { fetchGroupDetail } from "../actions";
import { GroupDetailClient } from "./GroupDetailClient";

export const dynamic = "force-dynamic";

interface GroupDetailPageProps {
  params: Promise<{ groupName: string }>;
}

export default async function GroupDetailPage({ params }: GroupDetailPageProps) {
  const { groupName } = await params;
  const decodedName = decodeURIComponent(groupName);
  const res = await fetchGroupDetail(decodedName);

  if (!res.success || !res.data) {
    notFound();
  }

  return (
    <GroupDetailClient
      group={res.data}
      resources={res.resources || []}
    />
  );
}
