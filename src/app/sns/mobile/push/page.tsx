import Link from "next/link";

export default function MobilePushPage() {
  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">
      {/* Breadcrumbs */}
      <div className="text-[13px] text-[#545b64] flex items-center gap-2">
        <Link href="/sns" className="text-[#0073bb] hover:underline">
          Amazon SNS
        </Link>
        <span>/</span>
        <span className="text-[#16191f] font-medium">Push notifications</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#16191f]">Push notifications</h1>
          <p className="text-[13px] text-[#545b64] mt-1">
            Create platform applications to send push notification messages to mobile devices on Apple (APNs), Google (FCM), Windows, and Baidu.
          </p>
        </div>
      </div>

      <div className="bg-white border border-[#eaeded] rounded p-8 text-center space-y-4 max-w-xl mx-auto mt-12 shadow-sm">
        <h2 className="text-[18px] font-bold text-[#16191f]">Platform applications</h2>
        <p className="text-[13px] text-[#545b64] leading-relaxed">
          To send push notifications, register your mobile platform credentials (e.g., Apple APNs p8 token or Firebase Cloud Messaging server key) with Amazon SNS.
        </p>
        <div className="pt-2">
          <button
            type="button"
            disabled
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center justify-center px-4 font-bold text-[13px] bg-[#ec7211] text-white rounded opacity-50 cursor-not-allowed"
          >
            Create platform application
          </button>
        </div>
        <p className="text-[11px] text-[#545b64]">
          Mobile push gateway requires public APNs/FCM credentials not supported in local emulator environment.
        </p>
      </div>
    </div>
  );
}
