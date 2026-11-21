/**
 * src/app/secretsmanager/settings/SettingsClient.tsx – Secrets Manager Settings.
 * Strict Cloudscape enterprise styling, 32px standard button heights, zero emojis.
 */

"use client";

import Link from "next/link";

export function SettingsClient() {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Breadcrumb */}
      <div>
        <div className="text-[12px] text-[#545b64] mb-1">
          <Link href="/secretsmanager" className="text-[#0972d3] hover:underline">
            Secrets
          </Link>{" "}
          &gt; Settings
        </div>
        <h1 className="text-[20px] font-bold text-[#16191f]">Settings</h1>
      </div>

      {/* Info Card */}
      <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-6">
        <div>
          <h2 className="text-[16px] font-bold text-[#16191f]">Secrets Manager Settings & Integrations</h2>
          <p className="text-[13px] text-[#545b64] mt-1">
            Configure default settings and view service dependencies for AWS Secrets Manager.
          </p>
        </div>

        <div className="space-y-6 text-[13px]">
          {/* KMS Integration */}
          <div className="border-t border-[#eaeded] pt-4">
            <h3 className="font-bold text-[#16191f] text-[14px]">AWS KMS Encryption</h3>
            <p className="text-[#545b64] mt-1">
              Secrets Manager encrypts your secret values using AWS Key Management Service (AWS KMS). You can use the AWS managed key (aws/secretsmanager) at no additional charge, or create customer managed keys for fine-grained key rotation and access policies.
            </p>
            <div className="pt-3">
              <Link
                href="/kms"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center px-4 border border-[#aab7b8] rounded text-[13px] font-semibold text-[#16191f] hover:bg-[#fafafa]"
              >
                Manage KMS keys
              </Link>
            </div>
          </div>

          {/* Service Quotas */}
          <div className="border-t border-[#eaeded] pt-4">
            <h3 className="font-bold text-[#16191f] text-[14px]">Service Quotas</h3>
            <p className="text-[#545b64] mt-1">
              View and request limit increases for Secrets Manager quotas such as maximum secrets per account, maximum secret size (64 KB), and API request rates.
            </p>
            <div className="pt-3">
              <Link
                href="/service-quotas"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center px-4 border border-[#aab7b8] rounded text-[13px] font-semibold text-[#16191f] hover:bg-[#fafafa]"
              >
                View Service Quotas
              </Link>
            </div>
          </div>

          {/* Multi-Region Replication */}
          <div className="border-t border-[#eaeded] pt-4">
            <h3 className="font-bold text-[#16191f] text-[14px]">Multi-Region Replication</h3>
            <p className="text-[#545b64] mt-1">
              In multi-region AWS environments, secrets can be replicated across Regions with automatic synchronization. In this local emulator environment, the service operates within the configured primary Region (us-east-1).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
