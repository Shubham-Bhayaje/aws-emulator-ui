"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RAMResourceShare, RAMInvitation } from "../types";
import { formatRAMDate } from "../dateUtils";

interface SharedWithMeClientProps {
  shares: RAMResourceShare[];
  invitations: RAMInvitation[];
}

export default function SharedWithMeClient({ shares, invitations }: SharedWithMeClientProps) {
  const router = useRouter();
  const [selectedInvArn, setSelectedInvArn] = useState<string | null>(null);
  const [unsupportedModal, setUnsupportedModal] = useState<{
    action: "Accept" | "Reject";
    invitationName: string;
  } | null>(null);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#16191f]">Shared with me: Resource shares</h1>
          <p className="text-sm text-[#545b64] mt-1">
            Resource shares created by other AWS accounts that are shared with your account or organization.
          </p>
        </div>
        <button
          onClick={() => router.refresh()}
          className="bg-white border border-[#879596] hover:bg-[#f2f3f3] text-[#16191f] font-bold text-[13px] px-3 rounded-[2px] transition-colors flex items-center justify-center self-start sm:self-auto"
          style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          title="Refresh"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 4v6h-6M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
          </svg>
        </button>
      </div>

      {/* Invitations Section */}
      <div className="bg-white border border-[#eaeded] rounded shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#16191f]">Resource share invitations</h2>
            <p className="text-xs text-[#545b64]">
              Invitations sent to your AWS account. You must accept an invitation before you can access shared resources.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const inv = invitations.find((i) => i.resourceShareInvitationArn === selectedInvArn);
                if (inv) setUnsupportedModal({ action: "Accept", invitationName: inv.resourceShareName });
              }}
              disabled={!selectedInvArn}
              className={`font-bold text-[13px] px-3 rounded-[2px] transition-colors border ${
                selectedInvArn
                  ? "bg-[#ec7211] hover:bg-[#eb5f07] text-white border-[#ec7211] shadow-sm"
                  : "bg-[#f2f3f3] border-[#eaeded] text-[#959da5] cursor-not-allowed"
              }`}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              Accept resource share
            </button>
            <button
              onClick={() => {
                const inv = invitations.find((i) => i.resourceShareInvitationArn === selectedInvArn);
                if (inv) setUnsupportedModal({ action: "Reject", invitationName: inv.resourceShareName });
              }}
              disabled={!selectedInvArn}
              className={`font-bold text-[13px] px-3 rounded-[2px] transition-colors border ${
                selectedInvArn
                  ? "bg-white border-[#879596] hover:bg-[#f2f3f3] text-[#16191f]"
                  : "bg-[#f2f3f3] border-[#eaeded] text-[#959da5] cursor-not-allowed"
              }`}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              Reject resource share
            </button>
          </div>
        </div>

        <div className="border border-[#eaeded] rounded overflow-x-auto">
          <table className="w-full text-left text-[13px] text-[#16191f]">
            <thead className="bg-[#fafafa] text-[#545b64] text-[11px] font-bold uppercase border-b border-[#eaeded]">
              <tr>
                <th className="p-3 w-10 text-center">Select</th>
                <th className="p-3">Resource Share Name</th>
                <th className="p-3">Sender Account ID</th>
                <th className="p-3">Status</th>
                <th className="p-3">Invitation Date</th>
                <th className="p-3">Resource Share ARN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded]">
              {invitations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-xs text-[#545b64]">
                    No resource share invitations found for this account.
                  </td>
                </tr>
              ) : (
                invitations.map((inv) => {
                  const isChecked = selectedInvArn === inv.resourceShareInvitationArn;
                  return (
                    <tr
                      key={inv.resourceShareInvitationArn}
                      className={`hover:bg-[#f9f9f9] ${isChecked ? "bg-[#f2f8fd]" : ""}`}
                    >
                      <td className="p-3 text-center">
                        <input
                          type="radio"
                          name="selected_inv"
                          checked={isChecked}
                          onChange={() => setSelectedInvArn(inv.resourceShareInvitationArn)}
                          className="text-[#0073bb] focus:ring-0"
                        />
                      </td>
                      <td className="p-3 font-semibold text-[#16191f]">
                        {inv.resourceShareName}
                      </td>
                      <td className="p-3 font-mono text-xs">{inv.senderAccountId}</td>
                      <td className="p-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#f1faff] text-[#0073bb] border border-[#9fd8f6]">
                          {inv.status}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-[#545b64]">
                        <span suppressHydrationWarning>{formatRAMDate(inv.invitationTimestamp)}</span>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-[#545b64] truncate max-w-xs">
                        {inv.resourceShareArn}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Accepted Resource Shares Section */}
      <div className="bg-white border border-[#eaeded] rounded shadow-sm p-6 space-y-4">
        <div>
          <h2 className="text-base font-bold text-[#16191f]">Resource shares</h2>
          <p className="text-xs text-[#545b64]">
            Resource shares from other accounts that you have accepted or that are shared within your organization.
          </p>
        </div>

        <div className="border border-[#eaeded] rounded overflow-x-auto">
          <table className="w-full text-left text-[13px] text-[#16191f]">
            <thead className="bg-[#fafafa] text-[#545b64] text-[11px] font-bold uppercase border-b border-[#eaeded]">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Status</th>
                <th className="p-3">Owner Account ID</th>
                <th className="p-3">Last Modified</th>
                <th className="p-3">Resource Share ARN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded]">
              {shares.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-xs text-[#545b64]">
                    No resource shares shared with you yet.
                  </td>
                </tr>
              ) : (
                shares.map((share) => (
                  <tr key={share.arn} className="hover:bg-[#f9f9f9]">
                    <td className="p-3 font-medium">
                      <Link
                        href={`/ram/${encodeURIComponent(share.arn)}`}
                        className="text-[#0073bb] hover:underline"
                      >
                        {share.name}
                      </Link>
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#ecf7ed] text-[#1d8102]">
                        {share.status}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-xs">{share.owner}</td>
                    <td className="p-3 text-xs text-[#545b64]">
                      <span suppressHydrationWarning>{formatRAMDate(share.lastUpdatedTime)}</span>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-[#545b64] truncate max-w-xs">
                      {share.arn}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Unsupported Action Notification Modal */}
      {unsupportedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#f1faff] border border-[#9fd8f6] flex items-center justify-center text-[#0073bb] font-bold text-sm shrink-0">
                i
              </div>
              <div>
                <h3 className="text-base font-bold text-[#16191f]">
                  Action not supported by emulator
                </h3>
                <p className="text-xs text-[#545b64] mt-1">
                  <strong>{unsupportedModal.action} resource share</strong> for &quot;{unsupportedModal.invitationName}&quot; is not supported by the local AWS emulator (API endpoint returns <code className="font-mono bg-[#f2f3f3] px-1 py-0.5 rounded">NotImplemented</code>).
                </p>
                <p className="text-xs text-[#545b64] mt-2">
                  In production AWS, accepting an invitation associates the shared resources with your account so they appear in your service consoles (such as VPC or KMS).
                </p>
              </div>
            </div>
            <div className="flex justify-end pt-2 border-t border-[#eaeded]">
              <button
                onClick={() => setUnsupportedModal(null)}
                className="bg-white border border-[#879596] hover:bg-[#f2f3f3] text-[#16191f] font-bold text-[13px] px-4 rounded-[2px] transition-colors"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
