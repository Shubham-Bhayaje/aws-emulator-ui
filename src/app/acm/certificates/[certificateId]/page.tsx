import Link from "next/link";
import { fetchCertificateDetailAction, fetchHostedZonesAction } from "../../actions";
import { CertificateDetailClient } from "./CertificateDetailClient";

export const dynamic = "force-dynamic";

interface CertificateDetailPageProps {
  params: Promise<{ certificateId: string }>;
}

export default async function CertificateDetailPage({ params }: CertificateDetailPageProps) {
  const { certificateId } = await params;
  const decodedId = decodeURIComponent(certificateId);

  const [detailRes, zonesRes] = await Promise.all([
    fetchCertificateDetailAction(decodedId),
    fetchHostedZonesAction(),
  ]);

  if (!detailRes.success || !detailRes.certificate) {
    return (
      <div className="space-y-4">
        <div className="text-[12px] text-[#545b64] mb-1">
          <Link href="/acm" className="hover:underline text-[#0972d3]">
            Certificates
          </Link>{" "}
          &gt; {decodedId}
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-8 text-center space-y-4 max-w-xl mx-auto mt-8">
          <h2 className="text-[18px] font-bold text-[#16191f]">Certificate Not Found</h2>
          <p className="text-[13px] text-[#545b64]">
            {detailRes.error || `Certificate "${decodedId}" does not exist in this account or Region.`}
          </p>
          <div className="pt-2">
            <Link
              href="/acm"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
            >
              Back to certificates
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <CertificateDetailClient
      certificate={detailRes.certificate}
      hostedZones={zonesRes.hostedZones || []}
    />
  );
}
