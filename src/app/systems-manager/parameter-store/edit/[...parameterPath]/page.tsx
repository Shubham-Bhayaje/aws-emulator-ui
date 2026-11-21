import Link from "next/link";
import { getParameterDetailAction } from "../../actions";
import { EditParameterClient } from "./EditParameterClient";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    parameterPath: string[];
  }>;
}

export default async function EditParameterPage({ params }: PageProps) {
  const { parameterPath } = await params;
  const decodedSegments = (parameterPath || []).map((seg) => decodeURIComponent(seg));

  const joined = decodedSegments.join("/");
  const slashName = joined.startsWith("/") ? joined : `/${joined}`;

  let res = await getParameterDetailAction(slashName, false);
  if (!res.success || !res.parameter) {
    res = await getParameterDetailAction(joined, false);
  }

  if (!res.success || !res.parameter) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div className="text-[12px] text-[#545b64] mb-1">
          <Link href="/systems-manager/parameter-store" className="text-[#0972d3] hover:underline">
            Parameter Store
          </Link>{" "}
          &gt; Parameter not found
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-8 shadow-sm text-center space-y-4">
          <h2 className="text-[18px] font-bold text-[#16191f]">Parameter not found</h2>
          <p className="text-[13px] text-[#545b64]">
            The parameter <code className="bg-[#f2f3f3] px-1.5 py-0.5 rounded font-mono">{slashName}</code> could not be found to edit.
          </p>
          <div>
            <Link
              href="/systems-manager/parameter-store"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] bg-[#ec7211] hover:bg-[#eb5f07] text-white px-4 rounded shadow-sm transition-colors"
            >
              Back to Parameter Store
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <EditParameterClient initialParameter={res.parameter} />;
}
