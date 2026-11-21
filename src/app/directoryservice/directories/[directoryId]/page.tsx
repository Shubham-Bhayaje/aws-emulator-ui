import Link from "next/link";
import {
  describeDirectoryAction,
  describeSnapshotsAction,
  describeTrustsAction,
  describeConditionalForwardersAction,
  listTagsForResourceAction,
} from "../../actions";
import { DirectoryDetailClient } from "./DirectoryDetailClient";

export const dynamic = "force-dynamic";

interface DirectoryDetailPageProps {
  params: Promise<{ directoryId: string }>;
  searchParams?: Promise<{ tab?: string }>;
}

export default async function DirectoryDetailPage({
  params,
  searchParams,
}: DirectoryDetailPageProps) {
  const { directoryId } = await params;
  const sp = searchParams ? await searchParams : {};
  const initialTab = sp.tab || "details";

  const [dirRes, snapRes, trustsRes, fwdRes, tagsRes] = await Promise.all([
    describeDirectoryAction(directoryId),
    describeSnapshotsAction(directoryId),
    describeTrustsAction(directoryId),
    describeConditionalForwardersAction(directoryId),
    listTagsForResourceAction(directoryId),
  ]);

  if (!dirRes.success || !dirRes.directory) {
    return (
      <div className="space-y-4">
        <div className="text-[12px] text-[#545b64]">
          <Link href="/directoryservice" className="hover:underline text-[#0972d3]">
            Directories
          </Link>{" "}
          &gt; {directoryId}
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-8 text-center space-y-4 max-w-xl mx-auto mt-8">
          <h2 className="text-[18px] font-bold text-[#16191f]">Directory Not Found</h2>
          <p className="text-[13px] text-[#545b64]">
            {dirRes.error || `Directory "${directoryId}" does not exist in this account or Region.`}
          </p>
          <div className="pt-2">
            <Link
              href="/directoryservice"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
            >
              Back to directories
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DirectoryDetailClient
      initialDirectory={dirRes.directory}
      initialSnapshots={snapRes.snapshots || []}
      initialTrusts={trustsRes.trusts || []}
      initialForwarders={fwdRes.forwarders || []}
      initialTags={tagsRes.tags || []}
      initialTab={initialTab}
    />
  );
}
