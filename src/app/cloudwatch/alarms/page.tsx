import Link from "next/link";

export default function CloudWatchAlarmsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-[#16191f]">Alarms</h1>
          <p className="text-[13px] text-[#545b64] mt-1">
            CloudWatch alarms monitor metrics and automatically perform actions based on thresholds.
          </p>
        </div>
      </div>

      <div className="bg-white border border-[#eaeded] rounded-lg p-8 text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 mx-auto rounded-full bg-[#f2f3f3] flex items-center justify-center text-[#545b64]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
        </div>
        <h2 className="text-[16px] font-bold text-[#16191f]">CloudWatch Alarms</h2>
        <p className="text-[13px] text-[#545b64] max-w-md mx-auto">
          Alarm management will be enabled in the upcoming CloudWatch Alarms module. In the meantime, you can monitor and manage your log groups, metric filters, and log streams in CloudWatch Logs.
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
