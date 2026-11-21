import Link from "next/link";
import { describeCertificateAuthorityAction } from "../actions";
import { CaDetailClient } from "./CaDetailClient";

export const dynamic = "force-dynamic";

interface CaDetailPageProps {
  params: Promise<{ caArn: string[] }>;
  searchParams?: Promise<{ tab?: string }>;
}

export default async function CaDetailPage({ params, searchParams }: CaDetailPageProps) {
  const { caArn } = await params;
  const sp = searchParams ? await searchParams : {};
  const initialTab = sp.tab || "details";

  const rawArn = Array.isArray(caArn) ? caArn.join("/") : caArn;
  const decodedArn = decodeURIComponent(rawArn);

  const res = await describeCertificateAuthorityAction(decodedArn);

  if (!res.success || !res.certificateAuthority) {
    return (
      <div className="space-y-4">
        <div className="text-[12px] text-[#545b64] mb-1">
          <Link href="/acm/pca" className="hover:underline text-[#0972d3]">
            Private CAs
          </Link>{" "}
          &gt; {decodedArn}
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-8 text-center space-y-4 max-w-xl mx-auto mt-8">
          <h2 className="text-[18px] font-bold text-[#16191f]">Certificate Authority Not Found</h2>
          <p className="text-[13px] text-[#545b64]">
            {res.error || `Private certificate authority "${decodedArn}" was not found in this account or Region.`}
          </p>
          <div className="pt-2">
            <Link
              href="/acm/pca"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
            >
              Back to Private CAs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <CaDetailClient initialCa={res.certificateAuthority} initialTab={initialTab} />;
}
