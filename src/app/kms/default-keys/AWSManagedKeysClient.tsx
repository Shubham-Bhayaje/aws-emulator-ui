/**
 * src/app/kms/default-keys/AWSManagedKeysClient.tsx – AWS Managed Keys Client Component.
 * Zero emojis, Cloudscape enterprise standard.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { KMSKeySummary } from "../actions";

interface AWSManagedKeysClientProps {
  keys: KMSKeySummary[];
}

export function AWSManagedKeysClient({ keys }: AWSManagedKeysClientProps) {
  const [search, setSearch] = useState("");

  const filteredKeys = keys.filter((k) => {
    const term = search.toLowerCase();
    const aliasMatch = k.aliases.some((a) => a.toLowerCase().includes(term));
    const idMatch = k.keyId.toLowerCase().includes(term);
    const descMatch = k.description.toLowerCase().includes(term);
    return !search || aliasMatch || idMatch || descMatch;
  });

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div>
        <h1 className="text-[22px] font-bold text-[#16191f] tracking-tight">
          AWS managed keys ({keys.length})
        </h1>
        <p className="text-[13px] text-[#545b64] mt-1 max-w-4xl">
          AWS managed keys are KMS keys in your account that are created, managed, and used on your
          behalf by an AWS service that is integrated with AWS KMS. You cannot manage, rotate, or
          delete AWS managed keys, or change their key policies. However, you can view them and use
          them in audit reports.
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
        <div className="p-4 border-b border-[#eaeded] flex flex-wrap items-center justify-between gap-3 bg-[#fafafa]">
          <div className="relative min-w-[280px] flex-1 max-w-md">
            <input
              type="text"
              placeholder="Filter AWS managed keys by alias, ID or description"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3] bg-white placeholder-[#879596]"
            />
          </div>
          <div className="text-[12px] text-[#545b64]">
            Showing {filteredKeys.length} of {keys.length} keys
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[#eaeded] bg-[#fafafa] text-[#545b64] font-semibold">
                <th className="py-2.5 px-4">Aliases</th>
                <th className="py-2.5 px-4">Key ID</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Key spec</th>
                <th className="py-2.5 px-4">Key type</th>
                <th className="py-2.5 px-4">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded]">
              {filteredKeys.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#545b64]">
                    No AWS managed keys match the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredKeys.map((k) => (
                  <tr key={k.keyId} className="hover:bg-[#f2f8fd] transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-[#0972d3]">
                      <Link
                        href={`/kms/keys/${encodeURIComponent(k.keyId)}`}
                        className="hover:underline"
                      >
                        {k.aliases.join(", ") || "—"}
                      </Link>
                    </td>
                    <td className="py-3 px-4 font-mono text-[#545b64] text-[12px]">
                      <Link
                        href={`/kms/keys/${encodeURIComponent(k.keyId)}`}
                        className="text-[#0972d3] hover:underline"
                      >
                        {k.keyId}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#edfbf0] text-[#1d8102] border border-[#a4e2b0]">
                        {k.keyState}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#16191f] font-mono text-[12px]">{k.keySpec}</td>
                    <td className="py-3 px-4 text-[#545b64]">Default AWS Service</td>
                    <td className="py-3 px-4 text-[#545b64] max-w-md truncate">{k.description}</td>
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
