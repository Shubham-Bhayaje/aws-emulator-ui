import ServiceLayout from "@/components/ServiceLayout";
import { kmsNav } from "../../kmsNav";
import { fetchKeyDetails } from "../../actions";
import { KeyDetailClient } from "./KeyDetailClient";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface KeyDetailPageProps {
  params: Promise<{ keyId: string }>;
}

export default async function KeyDetailPage({ params }: KeyDetailPageProps) {
  const { keyId } = await params;
  const decodedKeyId = decodeURIComponent(keyId);
  const result = await fetchKeyDetails(decodedKeyId);

  if (!result.success || !result.key) {
    const isAwsManaged = decodedKeyId.startsWith("aws-") || decodedKeyId.includes("aws");
    return (
      <ServiceLayout serviceName="KMS" serviceColor="#E7157B" navItems={kmsNav}>
        <div className="space-y-4">
          <div className="text-[12px] text-[#545b64] mb-1 flex items-center gap-1.5 font-medium">
            <Link
              href={isAwsManaged ? "/kms/default-keys" : "/kms"}
              className="hover:underline text-[#0972d3]"
            >
              {isAwsManaged ? "AWS managed keys" : "Customer managed keys"}
            </Link>
            <span>/</span>
            <span className="font-mono text-[#16191f]">{decodedKeyId}</span>
          </div>

          <div className="bg-white border border-[#eaeded] rounded p-8 text-center space-y-4 max-w-xl mx-auto mt-8">
            <h2 className="text-[18px] font-bold text-[#16191f]">KMS Key Not Found</h2>
            <p className="text-[13px] text-[#545b64]">
              {result.error || `The KMS key "${decodedKeyId}" does not exist in this account or Region.`}
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <Link
                href="/kms/default-keys"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd] transition-colors"
              >
                Back to AWS managed keys
              </Link>
              <Link
                href="/kms"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors"
              >
                Customer managed keys
              </Link>
            </div>
          </div>
        </div>
      </ServiceLayout>
    );
  }

  return (
    <ServiceLayout serviceName="KMS" serviceColor="#E7157B" navItems={kmsNav}>
      <KeyDetailClient keyData={result.key} />
    </ServiceLayout>
  );
}
