import Link from "next/link";

export default function AnalyticsApplicationsPage() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-bold text-[#16191f]">Analytics applications</h1>
          <p className="text-[14px] text-[#545b64] mt-0.5">
            Amazon Managed Service for Apache Flink is the easiest way to transform and analyze streaming data in real time with Apache Flink.
          </p>
        </div>
      </div>

      <div className="bg-[#f2f3f3] border border-[#d5dbdb] rounded p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-white rounded border border-[#eaeded] text-[#8C4FFF] font-bold text-lg">
            Flink
          </div>
          <div className="space-y-2">
            <h2 className="text-[16px] font-bold text-[#16191f]">
              Managed Service for Apache Flink
            </h2>
            <p className="text-[13px] text-[#545b64] leading-relaxed">
              Build stream processing applications in Java, Scala, Python, or SQL to continuously process and analyze records streaming from your Amazon Kinesis data streams with sub-second processing latency.
            </p>
            <div className="p-3 bg-white border border-[#eaeded] rounded text-[13px] text-[#545b64]">
              <strong className="text-[#16191f]">Note:</strong> Managed Service for Apache Flink is tracked in the Integration Backlog. You can inspect live stream records and test ingestion directly using the Kinesis Data Viewer in the console.
            </div>
            <div className="pt-2">
              <Link
                href="/kinesis/streams"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors"
              >
                Go to Data streams
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
