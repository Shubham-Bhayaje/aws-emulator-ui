import Link from "next/link";
import { fetchResourceShareDetail, fetchAvailableResourcesForSharing } from "../actions";
import ResourceShareDetailClient from "./ResourceShareDetailClient";

export const dynamic = "force-dynamic";

interface DetailPageProps {
  params: Promise<{ shareArn: string }>;
}

export default async function ResourceShareDetailPage({ params }: DetailPageProps) {
  const { shareArn } = await params;
  const decodedArn = decodeURIComponent(shareArn);

  const [detailRes, availRes] = await Promise.all([
    fetchResourceShareDetail(decodedArn),
    fetchAvailableResourcesForSharing(),
  ]);

  if (!detailRes.success || !detailRes.share) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-4">
        <div className="border border-[#eaeded] bg-white rounded shadow-sm p-8 text-center space-y-3">
          <h2 className="text-xl font-bold text-[#16191f]">Resource share not found</h2>
          <p className="text-sm text-[#545b64]">
            The resource share with ARN <code className="font-mono bg-[#f2f3f3] px-1 py-0.5 rounded text-xs">{decodedArn}</code> could not be found or has been deleted.
          </p>
          <div className="pt-2">
            <Link
              href="/ram"
              className="bg-[#ec7211] hover:bg-[#eb5f07] text-white font-bold text-[13px] px-4 rounded-[2px] transition-colors shadow-sm inline-flex items-center justify-center"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              Return to Resource shares
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ResourceShareDetailClient
      share={detailRes.share}
      initialResources={detailRes.resources}
      initialPrincipals={detailRes.principals}
      initialPermissions={detailRes.permissions}
      initialTags={detailRes.tags}
      availableResources={availRes.success ? availRes.data : []}
    />
  );
}
