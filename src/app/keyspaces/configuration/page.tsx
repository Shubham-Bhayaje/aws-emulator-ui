import Link from "next/link";

export const dynamic = "force-dynamic";

export default function KeyspacesConfigurationPage() {
  const serviceQuotas = [
    { name: "Keyspaces per Region", limit: "100", adjustable: "Yes" },
    { name: "Tables per keyspace", limit: "250", adjustable: "Yes" },
    { name: "Max partition size", limit: "Unlimited", adjustable: "No" },
    { name: "Max row size", limit: "1 MB", adjustable: "No" },
    { name: "Max columns per table", limit: "2,000", adjustable: "No" },
    { name: "Max length of column name", limit: "48 characters", adjustable: "No" },
  ];

  return (
    <div className="space-y-6 pb-12 max-w-5xl">
      {/* Breadcrumb */}
      <div className="text-[12px] text-[#545b64] flex items-center gap-1.5">
        <Link href="/" className="hover:underline text-[#0073bb]">Console Home</Link>
        <span>/</span>
        <Link href="/keyspaces" className="hover:underline text-[#0073bb]">Keyspaces</Link>
        <span>/</span>
        <span className="text-[#16191f] font-medium">Configuration</span>
      </div>

      <div>
        <h1 className="text-[24px] font-bold text-[#16191f]">Configuration</h1>
        <p className="text-[14px] text-[#545b64] mt-0.5">
          View connection endpoints, transport layer security (TLS) requirements, and account quotas for Amazon Keyspaces.
        </p>
      </div>

      {/* Cassandra Client Endpoints Card */}
      <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
        <h2 className="text-[16px] font-bold text-[#16191f]">Cassandra client endpoint</h2>
        <p className="text-[13px] text-[#545b64]">
          Configure your Apache Cassandra driver or cqlsh client to connect to the following endpoint:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3 border border-[#eaeded] rounded bg-[#fafafa]">
            <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
              Endpoint
            </div>
            <div className="font-mono text-[13px] font-bold text-[#16191f] mt-1 select-all">
              cassandra.us-east-1.amazonaws.com
            </div>
          </div>

          <div className="p-3 border border-[#eaeded] rounded bg-[#fafafa]">
            <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
              Port
            </div>
            <div className="font-mono text-[13px] font-bold text-[#16191f] mt-1 select-all">
              9142 (TLS)
            </div>
          </div>
        </div>

        <div className="p-4 bg-[#f2f8fd] border-l-4 border-[#0073bb] rounded text-[13px] text-[#16191f] space-y-1">
          <div className="font-bold text-[#0073bb]">Transport Layer Security (TLS) requirement</div>
          <p className="text-[#545b64]">
            Connections to Amazon Keyspaces require TLS 1.2 or higher. Make sure your Cassandra driver has SSL enabled
            and trusts the Amazon Digital Services certificate authority.
          </p>
        </div>
      </div>

      {/* Service Quotas Card */}
      <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[16px] font-bold text-[#16191f]">Account quotas</h2>
            <p className="text-[12px] text-[#545b64] mt-0.5">
              Service limits and quotas for Amazon Keyspaces in US East (N. Virginia).
            </p>
          </div>
          <Link
            href="/service-quotas"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center justify-center font-bold text-[12px] px-3.5 rounded border border-[#545b64] text-[#16191f] bg-white hover:bg-[#f2f3f3]"
          >
            Manage in Service Quotas
          </Link>
        </div>

        <table className="w-full text-left text-[13px] border border-[#eaeded] rounded">
          <thead className="bg-[#fafafa] text-[#545b64] border-b border-[#eaeded] font-bold text-[11px] uppercase tracking-wider">
            <tr>
              <th className="px-4 py-2.5">Quota name</th>
              <th className="px-4 py-2.5">Applied quota</th>
              <th className="px-4 py-2.5">Adjustable</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eaeded]">
            {serviceQuotas.map((q) => (
              <tr key={q.name} className="hover:bg-[#fafafa]">
                <td className="px-4 py-2.5 font-bold text-[#16191f]">{q.name}</td>
                <td className="px-4 py-2.5 font-mono text-[12px] text-[#545b64]">{q.limit}</td>
                <td className="px-4 py-2.5">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                      q.adjustable === "Yes"
                        ? "bg-[#edf7ed] text-[#1d8102]"
                        : "bg-[#f2f3f3] text-[#545b64]"
                    }`}
                  >
                    {q.adjustable}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
