import Link from "next/link";
import { fetchSecretDetailAction, fetchKmsKeysAction } from "../actions";
import { SecretDetailClient } from "./SecretDetailClient";

export const dynamic = "force-dynamic";

interface SecretDetailPageProps {
  params: Promise<{ secretName: string }>;
}

export default async function SecretDetailPage({ params }: SecretDetailPageProps) {
  const { secretName } = await params;
  const decodedName = decodeURIComponent(secretName);

  const [detailRes, kmsRes] = await Promise.all([
    fetchSecretDetailAction(decodedName),
    fetchKmsKeysAction(),
  ]);

  if (!detailRes.success || !detailRes.secret) {
    return (
      <div className="space-y-4">
        <div className="text-[12px] text-[#545b64] mb-1">
          <Link href="/secretsmanager" className="hover:underline text-[#0972d3]">
            Secrets
          </Link>{" "}
          &gt; {decodedName}
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-8 text-center space-y-4 max-w-xl mx-auto mt-8 shadow-sm">
          <h2 className="text-[18px] font-bold text-[#16191f]">Secret Not Found</h2>
          <p className="text-[13px] text-[#545b64]">
            {detailRes.error || `Secret "${decodedName}" does not exist in this account or Region.`}
          </p>
          <div className="pt-2">
            <Link
              href="/secretsmanager"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
            >
              Back to secrets
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SecretDetailClient
      secret={detailRes.secret}
      versions={detailRes.versions || []}
      kmsKeys={kmsRes.keys || []}
    />
  );
}
