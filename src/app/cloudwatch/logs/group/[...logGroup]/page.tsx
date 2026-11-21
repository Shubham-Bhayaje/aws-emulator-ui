import Link from "next/link";
import {
  getLogGroupDetailAction,
  listLogStreamsAction,
  getKmsKeysAction,
  getIamRolesAction,
  getKinesisStreamsAction,
  getLambdaFunctionsAction,
} from "../../actions";
import LogGroupDetailClient from "./LogGroupDetailClient";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    logGroup: string[];
  }>;
}

export default async function LogGroupDetailPage({ params }: PageProps) {
  const { logGroup } = await params;
  const decodedSegments = (logGroup || []).map((seg) => decodeURIComponent(seg));
  const rawJoined = decodedSegments.join("/");

  // Log group names may or may not begin with a leading slash in AWS
  let groupName = rawJoined;
  let detailRes = await getLogGroupDetailAction(groupName);

  if (!detailRes.logGroup && !groupName.startsWith("/")) {
    const slashCandidate = `/${groupName}`;
    const altRes = await getLogGroupDetailAction(slashCandidate);
    if (altRes.logGroup) {
      groupName = slashCandidate;
      detailRes = altRes;
    }
  }

  if (!detailRes.logGroup) {
    return (
      <div className="space-y-6 max-w-4xl">
        <nav className="text-[12px] text-[#545b64] mb-2 flex items-center gap-1.5">
          <Link href="/cloudwatch" className="hover:underline text-[#0972d3]">
            CloudWatch
          </Link>
          <span>/</span>
          <Link href="/cloudwatch/logs" className="hover:underline text-[#0972d3]">
            Log groups
          </Link>
          <span>/</span>
          <span className="text-[#16191f] font-medium">Not found</span>
        </nav>

        <div className="bg-white border border-[#eaeded] rounded-lg p-8 shadow-sm text-center space-y-4">
          <h2 className="text-[18px] font-bold text-[#16191f]">Log group not found</h2>
          <p className="text-[13px] text-[#545b64]">
            The log group <code className="bg-[#f2f3f3] px-1.5 py-0.5 rounded font-mono">{rawJoined}</code> does not exist in this Region.
          </p>
          <div>
            <Link
              href="/cloudwatch/logs"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] bg-[#ec7211] hover:bg-[#eb5f07] text-white px-4 rounded shadow-sm transition-colors"
            >
              Back to Log groups
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const [streamsRes, kmsKeys, iamRoles, kinesisStreams, lambdaFunctions] = await Promise.all([
    listLogStreamsAction(groupName),
    getKmsKeysAction(),
    getIamRolesAction(),
    getKinesisStreamsAction(),
    getLambdaFunctionsAction(),
  ]);

  return (
    <LogGroupDetailClient
      logGroup={detailRes.logGroup}
      initialStreams={streamsRes.logStreams}
      metricFilters={detailRes.metricFilters}
      subscriptionFilters={detailRes.subscriptionFilters}
      initialTags={detailRes.tags}
      kmsKeys={kmsKeys}
      iamRoles={iamRoles}
      kinesisStreams={kinesisStreams}
      lambdaFunctions={lambdaFunctions}
      initialError={detailRes.error || streamsRes.error}
    />
  );
}
