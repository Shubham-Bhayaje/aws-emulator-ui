import Link from "next/link";
import { describeClusterAction } from "../../actions";
import { ClusterDetailClient } from "./ClusterDetailClient";

export const dynamic = "force-dynamic";

interface ClusterDetailPageProps {
  params: Promise<{ clusterId: string }>;
  searchParams?: Promise<{ tab?: string }>;
}

export default async function ClusterDetailPage({
  params,
  searchParams,
}: ClusterDetailPageProps) {
  const { clusterId } = await params;
  const sp = searchParams ? await searchParams : {};
  const initialTab = sp.tab || "overview";

  const res = await describeClusterAction(clusterId);

  if (!res.success || !res.cluster) {
    return (
      <div className="space-y-4">
        <div className="text-[12px] text-[#545b64]">
          <Link href="/cloudhsm" className="hover:underline text-[#0972d3]">
            Clusters
          </Link>{" "}
          &gt; {clusterId}
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-8 text-center space-y-4 max-w-xl mx-auto mt-8">
          <h2 className="text-[18px] font-bold text-[#16191f]">Cluster Not Found</h2>
          <p className="text-[13px] text-[#545b64]">
            {res.error || `Cluster "${clusterId}" does not exist in this account or Region.`}
          </p>
          <div className="pt-2">
            <Link
              href="/cloudhsm"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
            >
              Back to clusters
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <ClusterDetailClient initialCluster={res.cluster} initialTab={initialTab} />;
}
