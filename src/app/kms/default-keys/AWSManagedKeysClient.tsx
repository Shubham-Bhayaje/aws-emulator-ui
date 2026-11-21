/**
 * src/app/kms/default-keys/AWSManagedKeysClient.tsx – AWS Managed Keys Client Component.
 * Zero emojis, Cloudscape enterprise standard, strict 32px button height standard.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KMSKeySummary } from "../types";

interface AWSManagedKeysClientProps {
  keys: KMSKeySummary[];
}

export function AWSManagedKeysClient({ keys }: AWSManagedKeysClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filteredKeys = keys.filter((k) => {
    const term = search.toLowerCase();
    const aliasMatch = k.aliases.some((a) => a.toLowerCase().includes(term));
    const idMatch = k.keyId.toLowerCase().includes(term);
    const descMatch = k.description.toLowerCase().includes(term);
    const specMatch = k.keySpec.toLowerCase().includes(term);
    return !search || aliasMatch || idMatch || descMatch || specMatch;
  });

  return (
    <div className="space-y-4">
      {/* Header section */}
      <div>
        <h1 className="text-[20px] font-bold text-[#16191f]">
          AWS managed keys ({keys.length})
        </h1>
        <p className="text-[13px] text-[#545b64] mt-1 max-w-4xl">
          AWS managed keys are KMS keys in your AWS account that are created, managed, and used on your
          behalf by an AWS service that is integrated with AWS KMS. You can view the AWS managed keys
          in your account, view their key policies, and audit their use in AWS CloudTrail logs. But you
          cannot manage these KMS keys, rotate them, or change their key policies.
        </p>
      </div>

      {/* Info Callout */}
      <div className="bg-[#f2f8fd] border-l-4 border-[#0972d3] p-4 rounded-r text-[13px] text-[#16191f]">
        <div className="font-bold text-[#0972d3] mb-1">About AWS managed keys</div>
        <div>
          You are not charged a monthly fee for AWS managed keys. You only pay for cryptographic
          requests that use them beyond the free tier.
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-[#eaeded] rounded shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-[#eaeded] flex flex-wrap items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Find keys by alias, key ID, or spec"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-[320px] border border-[#aab7b8] rounded px-3 py-1 text-[13px] text-[#16191f] focus:outline-none focus:border-[#ec7211]"
            />
            <button
              onClick={() => router.refresh()}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-3 rounded transition-colors"
            >
              Refresh
            </button>
          </div>
          <div className="text-[12px] text-[#545b64]">
            Showing {filteredKeys.length} of {keys.length} keys
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-[#f8f9fa] border-b border-[#eaeded] font-semibold text-[#545b64] text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Aliases</th>
                <th className="py-2.5 px-4">Key ID</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Key type</th>
                <th className="py-2.5 px-4">Key spec</th>
                <th className="py-2.5 px-4">Creation date</th>
                <th className="py-2.5 px-4">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded]">
              {filteredKeys.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#545b64]">
                    No AWS managed keys found in this Region.
                  </td>
                </tr>
              ) : (
                filteredKeys.map((k) => (
                  <tr key={k.keyId} className="hover:bg-[#f2f8fd] transition-colors">
                    <td className="py-3 px-4 font-semibold text-[#0972d3]">
                      <Link
                        href={`/kms/keys/${encodeURIComponent(k.keyId)}`}
                        className="hover:underline"
                      >
                        {k.aliases.join(", ") || "(No alias)"}
                      </Link>
                    </td>
                    <td className="py-3 px-4 font-mono text-[#545b64] text-[12px]">
                      <Link
                        href={`/kms/keys/${encodeURIComponent(k.keyId)}`}
                        className="text-[#545b64] hover:text-[#16191f] hover:underline"
                      >
                        {k.keyId}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded bg-[#f2f8f0] text-[#1d8102]">
                        {k.keyState}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#545b64]">
                      {k.keySpec.includes("SYMMETRIC") ? "Symmetric" : "Asymmetric"}
                    </td>
                    <td className="py-3 px-4 font-mono text-[12px] text-[#545b64]">{k.keySpec}</td>
                    <td className="py-3 px-4 text-[#545b64]">{k.creationDate}</td>
                    <td className="py-3 px-4 text-[#545b64] max-w-md truncate">{k.description || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
