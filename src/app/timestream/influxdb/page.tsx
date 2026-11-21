import Link from "next/link";

export default function TimestreamInfluxDBPage() {
  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold text-[#16191f]">InfluxDB instances</h1>
          <p className="text-[14px] text-[#545b64] mt-0.5">
            Amazon Timestream for InfluxDB makes it easy to run managed open-source InfluxDB databases for real-time telemetry analytics.
          </p>
        </div>
        <div>
          <button
            disabled
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#f2f3f3] text-[#aab7b8] border border-[#eaeded] cursor-not-allowed"
          >
            Create InfluxDB instance
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wider">
            DB Instances
          </div>
          <div className="text-[28px] font-bold text-[#16191f] mt-1">0</div>
          <div className="text-[12px] text-[#545b64] mt-1">Managed instances</div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wider">
            Multi-AZ High Availability
          </div>
          <div className="text-[28px] font-bold text-[#16191f] mt-1">0</div>
          <div className="text-[12px] text-[#545b64] mt-1">Standby replication</div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wider">
            Engine Version
          </div>
          <div className="text-[28px] font-bold text-[#16191f] mt-1">v2.7+</div>
          <div className="text-[12px] text-[#545b64] mt-1">Open source InfluxQL / Flux</div>
        </div>
      </div>

      {/* Capability Notice Card */}
      <div className="bg-white border border-[#eaeded] rounded p-8 shadow-sm text-center max-w-2xl mx-auto space-y-4">
        <div className="bg-[#f2f8fd] border-l-4 border-[#0073bb] p-4 text-[13px] text-[#16191f] text-left">
          <strong>Emulator Note:</strong> Timestream for InfluxDB managed instances require hardware VM provisioning and are not implemented in the local AWS Emulator engine.
        </div>
        <h3 className="text-[18px] font-bold text-[#16191f]">
          Manage InfluxDB workloads with Amazon Timestream
        </h3>
        <p className="text-[13px] text-[#545b64]">
          For serverless, automated time series data storage on localhost, use <strong>Amazon Timestream LiveAnalytics</strong> databases and tables.
        </p>
        <div className="pt-2">
          <Link
            href="/timestream/databases"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
          >
            Go to Timestream databases
          </Link>
        </div>
      </div>
    </div>
  );
}
