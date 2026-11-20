import Link from "next/link";
import { fetchServiceQuotas } from "../../actions";
import ServiceQuotasClient from "./ServiceQuotasClient";

export const dynamic = "force-dynamic";

interface ServicePageProps {
  params: Promise<{ serviceCode: string }>;
}

export default async function ServiceQuotasPage({ params }: ServicePageProps) {
  const { serviceCode } = await params;
  const decodedServiceCode = decodeURIComponent(serviceCode);

  const res = await fetchServiceQuotas(decodedServiceCode);

  if (!res.success) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-4">
        <div className="border border-[#eaeded] bg-white rounded shadow-sm p-8 text-center space-y-3">
          <h2 className="text-xl font-bold text-[#16191f]">Service not found</h2>
          <p className="text-sm text-[#545b64]">
            Could not retrieve quotas for service code:{" "}
            <code className="font-mono bg-[#f2f3f3] px-1 py-0.5 rounded text-xs">
              {decodedServiceCode}
            </code>
          </p>
          <div className="pt-2">
            <Link
              href="/service-quotas"
              className="bg-[#ec7211] hover:bg-[#eb5f07] text-white font-bold text-[13px] px-4 rounded-[2px] transition-colors shadow-sm inline-flex items-center justify-center"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              Return to AWS services
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ServiceQuotasClient
      serviceCode={decodedServiceCode}
      serviceName={res.serviceName || decodedServiceCode}
      initialQuotas={res.data}
    />
  );
}
