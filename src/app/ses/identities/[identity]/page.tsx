import { notFound } from "next/navigation";
import { getIdentityDetailsAction, listSnsTopicsAction } from "../../actions";
import IdentityDetailClient from "./IdentityDetailClient";

export const dynamic = "force-dynamic";

interface IdentityDetailPageProps {
  params: Promise<{ identity: string }>;
}

export default async function IdentityDetailPage({ params }: IdentityDetailPageProps) {
  const { identity } = await params;
  const decoded = decodeURIComponent(identity);

  const [detailsRes, snsRes] = await Promise.all([
    getIdentityDetailsAction(decoded),
    listSnsTopicsAction(),
  ]);

  if (!detailsRes.success || !detailsRes.details) {
    notFound();
  }

  return (
    <IdentityDetailClient
      initialDetails={detailsRes.details}
      availableSnsTopics={snsRes.topics || []}
    />
  );
}
