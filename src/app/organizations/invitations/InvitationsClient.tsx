/**
 * src/app/organizations/invitations/InvitationsClient.tsx – AWS Organizations Invitations.
 * Zero emojis, Cloudscape enterprise standard.
 */

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AccountRecord, inviteAccountAction } from "../actions";

interface InvitationsClientProps {
  invitedAccounts: AccountRecord[];
  parentOptions: Array<{ id: string; name: string }>;
}

export function InvitationsClient({ invitedAccounts, parentOptions }: InvitationsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [targetInput, setTargetInput] = useState("");
  const [targetParent, setTargetParent] = useState(parentOptions[0]?.id || "r-7qygd7aa");
  const [notes, setNotes] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSendInvite = () => {
    if (!targetInput.trim()) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await inviteAccountAction({
        accountIdOrEmail: targetInput.trim(),
        parentId: targetParent,
        notes: notes.trim(),
      });
      if (res.success) {
        setShowInviteModal(false);
        setTargetInput("");
        setNotes("");
        setSuccess(`Invitation sent to ${targetInput}. Account enrolled successfully.`);
        router.refresh();
      } else {
        setError(res.error || "Failed to send invitation.");
      }
    });
  };

  return (
    <div>
      {/* Alerts */}
      {success && (
        <div className="mb-4 bg-[#f2f8f0] border border-[#1d8102] rounded p-3 text-[13px] text-[#1d8102] flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className="text-[#545b64] font-bold text-sm ml-4">
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 bg-[#fdf3f1] border border-[#d13212] rounded p-3 text-[13px] text-[#d13212] flex items-center justify-between">
          <span>Error: {error}</span>
          <button onClick={() => setError(null)} className="text-[#545b64] font-bold text-sm ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white border border-[#eaeded] rounded-t p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[14px] font-bold text-[#16191f]">Account invitations</h2>
          <p className="text-[12px] text-[#545b64]">
            Track invitations sent to existing AWS accounts to join your organization.
          </p>
        </div>

        <button
          onClick={() => {
            setError(null);
            setShowInviteModal(true);
          }}
          style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] bg-[#ec7211] hover:bg-[#eb5f07] text-white px-4 rounded shadow-sm transition-colors"
        >
          Invite an AWS account
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-t-0 border-[#eaeded] rounded-b overflow-hidden shadow-sm">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-[#f8f9fa] border-b border-[#eaeded] font-semibold text-[#545b64] text-[11px] uppercase tracking-wider">
            <tr>
              <th className="py-2.5 px-4">Account name</th>
              <th className="py-2.5 px-4">Account ID</th>
              <th className="py-2.5 px-4">Target email</th>
              <th className="py-2.5 px-4">Status</th>
              <th className="py-2.5 px-4">Joined date</th>
              <th className="py-2.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eaeded]">
            {invitedAccounts.map((acc) => (
              <tr key={acc.id} className="hover:bg-[#f2f8fc]">
                <td className="py-3 px-4 font-medium">
                  <Link href={`/organizations/accounts/${acc.id}`} className="text-[#0972d3] hover:underline">
                    {acc.name}
                  </Link>
                </td>
                <td className="py-3 px-4 font-mono text-[12px] text-[#16191f]">{acc.id}</td>
                <td className="py-3 px-4 text-[#545b64]">{acc.email}</td>
                <td className="py-3 px-4">
                  <span className="inline-block bg-[#f2f8f0] text-[#1d8102] text-[11px] font-semibold px-2 py-0.5 rounded">
                    ACCEPTED
                  </span>
                </td>
                <td className="py-3 px-4 text-[#545b64]">
                  {acc.joinedTimestamp ? new Date(acc.joinedTimestamp).toLocaleDateString() : "—"}
                </td>
                <td className="py-3 px-4 text-right">
                  <Link
                    href={`/organizations/accounts/${acc.id}`}
                    className="text-[#0972d3] hover:underline font-medium text-[12px]"
                  >
                    View account
                  </Link>
                </td>
              </tr>
            ))}
            {invitedAccounts.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[#545b64]">
                  No external accounts have been invited yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Invite Account */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg border border-[#eaeded] overflow-hidden">
            <div className="bg-[#f8f9fa] border-b border-[#eaeded] px-6 py-4 flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-[#16191f]">Invite an AWS account</h2>
              <button onClick={() => setShowInviteModal(false)} className="text-[#545b64] font-bold text-lg">
                X
              </button>
            </div>
            <div className="p-6 space-y-4 text-[13px]">
              <div>
                <label className="block font-semibold text-[#16191f] mb-1">Account ID or Email address</label>
                <input
                  type="text"
                  placeholder="12-digit account ID or owner email"
                  value={targetInput}
                  onChange={(e) => setTargetInput(e.target.value)}
                  className="w-full border border-[#aab7b8] rounded px-3 py-1.5 focus:outline-none focus:border-[#ec7211]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#16191f] mb-1">Target parent container</label>
                <select
                  value={targetParent}
                  onChange={(e) => setTargetParent(e.target.value)}
                  className="w-full border border-[#aab7b8] rounded px-3 py-1.5 focus:outline-none focus:border-[#ec7211]"
                >
                  {parentOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#16191f] mb-1">Notes (optional)</label>
                <textarea
                  rows={2}
                  placeholder="Optional message to include with the invitation"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border border-[#aab7b8] rounded px-3 py-1.5 focus:outline-none focus:border-[#ec7211]"
                />
              </div>
            </div>

            <div className="bg-[#f8f9fa] border-t border-[#eaeded] px-6 py-3 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-4 rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending || !targetInput.trim()}
                onClick={handleSendInvite}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] bg-[#ec7211] hover:bg-[#eb5f07] text-white px-4 rounded shadow-sm disabled:opacity-50"
              >
                {isPending ? "Sending..." : "Send invitation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
