import Link from "next/link";

export default function SmsPreferencesPage() {
  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">
      {/* Breadcrumbs */}
      <div className="text-[13px] text-[#545b64] flex items-center gap-2">
        <Link href="/sns" className="text-[#0073bb] hover:underline">
          Amazon SNS
        </Link>
        <span>/</span>
        <span className="text-[#16191f] font-medium">Text messaging (SMS)</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#16191f]">Text messaging (SMS)</h1>
          <p className="text-[13px] text-[#545b64] mt-1">
            Manage SMS text messaging settings, monthly spend quotas, origination identities, and SMS sandbox.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-[#eaeded] rounded p-6 space-y-4 shadow-sm">
          <h2 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
            SMS sandbox
          </h2>
          <p className="text-[13px] text-[#545b64]">
            In the SMS sandbox, you can only send SMS messages to verified destination phone numbers.
          </p>
          <div className="p-3 rounded bg-[#f2f3f3] text-[12px] text-[#545b64] font-medium">
            Account status: In SMS sandbox
          </div>
        </div>

        <div className="bg-white border border-[#eaeded] rounded p-6 space-y-4 shadow-sm">
          <h2 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
            Monthly spend limit
          </h2>
          <p className="text-[13px] text-[#545b64]">
            Maximum spend limit allocated for text messaging per calendar month.
          </p>
          <div className="text-[20px] font-bold text-[#16191f] mt-2">$1.00 USD</div>
        </div>
      </div>
    </div>
  );
}
