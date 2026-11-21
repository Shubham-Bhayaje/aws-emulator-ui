import Link from "next/link";

export default function CloudWatchMetricsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-[#16191f]">All metrics</h1>
          <p className="text-[13px] text-[#545b64] mt-1">
            CloudWatch metrics provide real-time numerical time-series data for AWS services and custom applications.
          </p>
        </div>
      </div>

      <div className="bg-white border border-[#eaeded] rounded-lg p-8 text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 mx-auto rounded-full bg-[#f2f3f3] flex items-center justify-center text-[#545b64]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
        </div>
        <h2 className="text-[16px] font-bold text-[#16191f]">CloudWatch Metrics</h2>
        <p className="text-[13px] text-[#545b64] max-w-md mx-auto">
          Detailed metrics dashboards will be available with the CloudWatch Metrics service. You can currently create metric filters on log groups to extract custom numerical metrics from log events.
        </p>
        <div>
          <Link
            href="/cloudwatch/logs"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center justify-center font-bold text-[13px] bg-[#ec7211] hover:bg-[#eb5f07] text-white px-4 rounded shadow-sm transition-colors"
          >
            Go to Log groups
          </Link>
        </div>
      </div>
    </div>
  );
}
