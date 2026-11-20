import Link from "next/link";
import { fetchQuotaDetail } from "../../../actions";
import QuotaDetailClient from "./QuotaDetailClient";

export const dynamic = "force-dynamic";

interface QuotaDetailPageProps {
  params: Promise<{ serviceCode: string; quotaCode: string }>;
}

export default async function QuotaDetailPage({ params }: QuotaDetailPageProps) {
  const { serviceCode, quotaCode } = await params;
  const decodedServiceCode = decodeURIComponent(serviceCode);
  const decodedQuotaCode = decodeURIComponent(quotaCode);

  const res = await fetchQuotaDetail(decodedServiceCode, decodedQuotaCode);

  if (!res.success || !res.quota) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-4">
        <div className="border border-[#eaeded] bg-white rounded shadow-sm p-8 text-center space-y-3">
          <h2 className="text-xl font-bold text-[#16191f]">Quota not found</h2>
          <p className="text-sm text-[#545b64]">
            Could not find quota <code className="font-mono bg-[#f2f3f3] px-1 py-0.5 rounded text-xs">{decodedQuotaCode}</code> for service <code className="font-mono bg-[#f2f3f3] px-1 py-0.5 rounded text-xs">{decodedServiceCode}</code>.
          </p>
          <div className="pt-2">
            <Link
              href={`/service-quotas/services/${encodeURIComponent(decodedServiceCode)}`}
              className="bg-[#ec7211] hover:bg-[#eb5f07] text-white font-bold text-[13px] px-4 rounded-[2px] transition-colors shadow-sm inline-flex items-center justify-center"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              Return to {decodedServiceCode} quotas
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <QuotaDetailClient
      quota={res.quota}
      initialHistory={res.history}
      initialTags={res.tags}
    />
  );
}
