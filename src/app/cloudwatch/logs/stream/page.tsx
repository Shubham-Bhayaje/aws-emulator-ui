import Link from "next/link";
import { getLogEventsAction } from "../actions";
import LogStreamClient from "./LogStreamClient";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    group?: string;
    stream?: string;
  }>;
}

export default async function LogStreamPage({ searchParams }: PageProps) {
  const { group, stream } = await searchParams;

  if (!group || !stream) {
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
          <span className="text-[#16191f] font-medium">Log stream</span>
        </nav>

        <div className="bg-white border border-[#eaeded] rounded-lg p-8 shadow-sm text-center space-y-4">
          <h2 className="text-[18px] font-bold text-[#16191f]">Missing parameter</h2>
          <p className="text-[13px] text-[#545b64]">
            Both <code>group</code> and <code>stream</code> parameters are required to view a log stream.
          </p>
          <div>
            <Link
              href="/cloudwatch/logs"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] bg-[#ec7211] hover:bg-[#eb5f07] text-white px-4 rounded shadow-sm"
            >
              Back to Log groups
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const groupName = decodeURIComponent(group);
  const streamName = decodeURIComponent(stream);

  const res = await getLogEventsAction(groupName, streamName);

  return (
    <LogStreamClient
      logGroupName={groupName}
      logStreamName={streamName}
      initialEvents={res.events || []}
      initialError={res.error}
    />
  );
}
