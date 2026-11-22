"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SESIdentitySummary, deleteIdentityAction } from "../actions";
import SendTestEmailModal from "../components/SendTestEmailModal";

interface IdentitiesClientProps {
  initialIdentities: SESIdentitySummary[];
}

export default function IdentitiesClient({ initialIdentities }: IdentitiesClientProps) {
  const router = useRouter();
  const [identities, setIdentities] = useState<SESIdentitySummary[]>(initialIdentities);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "EmailAddress" | "Domain">("ALL");
  const [selectedIdentity, setSelectedIdentity] = useState<string | null>(null);

  // Modals
  const [isTestEmailOpen, setIsTestEmailOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const filtered = identities.filter((i) => {
    const matchesSearch = i.identity.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "ALL" || i.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const verifiedCount = identities.filter((i) => i.verificationStatus === "Success").length;
  const emailCount = identities.filter((i) => i.type === "EmailAddress").length;
  const domainCount = identities.filter((i) => i.type === "Domain").length;

  const handleDelete = async () => {
    if (!selectedIdentity) return;
    if (deleteConfirmText.toLowerCase() !== "delete") {
      setDeleteError('Please type "delete" to confirm.');
      return;
    }

    setDeleteLoading(true);
    setDeleteError(null);

    const res = await deleteIdentityAction(selectedIdentity);
    setDeleteLoading(false);

    if (res.success) {
      setIdentities((prev) => prev.filter((i) => i.identity !== selectedIdentity));
      setSelectedIdentity(null);
      setIsDeleteModalOpen(false);
      setDeleteConfirmText("");
      router.refresh();
    } else {
      setDeleteError(res.error || "Failed to delete identity.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-[#16191f]">Verified identities</h1>
          <p className="text-[13px] text-[#545b64]">
            An identity is an email address or domain that you use to send email through Amazon SES.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsTestEmailOpen(true)}
            disabled={!selectedIdentity}
            className="px-3 text-[13px] font-medium text-[#16191f] bg-white border border-[#aab7b8] rounded hover:bg-[#fafafa] disabled:opacity-50 transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Send test email
          </button>
          <button
            onClick={() => {
              setDeleteConfirmText("");
              setDeleteError(null);
              setIsDeleteModalOpen(true);
            }}
            disabled={!selectedIdentity}
            className="px-3 text-[13px] font-medium text-[#d13212] bg-white border border-[#d13212] rounded hover:bg-[#fdf2f2] disabled:opacity-50 transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Delete
          </button>
          <Link
            href="/ses/identities/create"
            className="px-4 text-[13px] font-semibold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded flex items-center transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Create identity
          </Link>
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-3 bg-white border border-[#eaeded] rounded-md shadow-sm">
          <div className="text-[11px] font-semibold text-[#545b64] uppercase tracking-wide">
            Total identities
          </div>
          <div className="text-[20px] font-bold text-[#16191f] mt-1">{identities.length}</div>
        </div>
        <div className="p-3 bg-white border border-[#eaeded] rounded-md shadow-sm">
          <div className="text-[11px] font-semibold text-[#545b64] uppercase tracking-wide">
            Verified
          </div>
          <div className="text-[20px] font-bold text-[#1d8102] mt-1">{verifiedCount}</div>
        </div>
        <div className="p-3 bg-white border border-[#eaeded] rounded-md shadow-sm">
          <div className="text-[11px] font-semibold text-[#545b64] uppercase tracking-wide">
            Email addresses
          </div>
          <div className="text-[20px] font-bold text-[#16191f] mt-1">{emailCount}</div>
        </div>
        <div className="p-3 bg-white border border-[#eaeded] rounded-md shadow-sm">
          <div className="text-[11px] font-semibold text-[#545b64] uppercase tracking-wide">
            Domains
          </div>
          <div className="text-[20px] font-bold text-[#16191f] mt-1">{domainCount}</div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-3 bg-white border border-[#eaeded] rounded-t-md flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search verified identities"
            className="w-full px-3 py-1.5 border border-[#aab7b8] rounded text-[13px] bg-white placeholder-[#879596]"
          />
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-[12px] text-[#545b64] font-medium">Type:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-2 py-1.5 border border-[#aab7b8] rounded text-[13px] bg-white"
          >
            <option value="ALL">All identity types</option>
            <option value="EmailAddress">Email address</option>
            <option value="Domain">Domain</option>
          </select>
        </div>
      </div>

      {/* Identities Table */}
      <div className="bg-white border-x border-b border-[#eaeded] rounded-b-md shadow-sm overflow-x-auto">
        <table className="w-full text-left text-[13px] text-[#16191f] border-collapse">
          <thead>
            <tr className="border-b border-[#eaeded] bg-[#fafafa] text-[#545b64] text-[12px]">
              <th className="py-2.5 px-3 w-8"></th>
              <th className="py-2.5 px-3 font-semibold">Identity</th>
              <th className="py-2.5 px-3 font-semibold">Identity type</th>
              <th className="py-2.5 px-3 font-semibold">Status</th>
              <th className="py-2.5 px-3 font-semibold">Easy DKIM</th>
              <th className="py-2.5 px-3 font-semibold">MAIL FROM domain</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[#545b64]">
                  {identities.length === 0 ? (
                    <div className="space-y-2">
                      <p>No verified identities found in your Amazon SES account.</p>
                      <Link
                        href="/ses/identities/create"
                        className="inline-block px-3 py-1 text-[12px] font-semibold text-white bg-[#ec7211] rounded"
                      >
                        Create identity
                      </Link>
                    </div>
                  ) : (
                    "No identities match the current search filter."
                  )}
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const isSelected = selectedIdentity === item.identity;
                const isVerified = item.verificationStatus === "Success";

                return (
                  <tr
                    key={item.identity}
                    onClick={() => setSelectedIdentity(item.identity)}
                    className={`border-b border-[#eaeded] cursor-pointer transition-colors ${
                      isSelected ? "bg-[#f2f8fd]" : "hover:bg-[#fafafa]"
                    }`}
                  >
                    <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="radio"
                        name="identitySelection"
                        checked={isSelected}
                        onChange={() => setSelectedIdentity(item.identity)}
                        className="accent-[#ec7211]"
                      />
                    </td>
                    <td className="py-2.5 px-3 font-medium">
                      <Link
                        href={`/ses/identities/${encodeURIComponent(item.identity)}`}
                        className="text-[#0972d3] hover:underline"
                      >
                        {item.identity}
                      </Link>
                    </td>
                    <td className="py-2.5 px-3 text-[#545b64]">
                      {item.type === "EmailAddress" ? "Email address" : "Domain"}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${
                          isVerified
                            ? "bg-[#e7f4e4] text-[#1d8102] border-[#a2dca0]"
                            : "bg-[#fff7e6] text-[#b35900] border-[#ffcc80]"
                        }`}
                      >
                        {item.verificationStatus === "Success" ? "Verified" : "Pending"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[#545b64]">
                      {item.dkimEnabled ? (
                        <span className="text-[#1d8102]">Enabled</span>
                      ) : (
                        <span className="text-[#879596]">Disabled</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-[#545b64] font-mono text-[12px]">
                      {item.mailFromDomain || "Default"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Send Test Email Modal */}
      <SendTestEmailModal
        isOpen={isTestEmailOpen}
        onClose={() => setIsTestEmailOpen(false)}
        defaultFrom={selectedIdentity || ""}
      />

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedIdentity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-md shadow-2xl border border-[#d5dbdb] w-full max-w-md p-6 space-y-4">
            <h3 className="text-[16px] font-bold text-[#16191f]">
              Delete identity: {selectedIdentity}?
            </h3>
            <p className="text-[13px] text-[#545b64]">
              You will no longer be able to use this identity to send emails through Amazon SES. You will need to verify it again to reuse it.
            </p>
            {deleteError && (
              <div className="p-2 bg-[#fdf2f2] border-l-4 border-l-[#d13212] text-[#d13212] text-[12px] rounded">
                {deleteError}
              </div>
            )}
            <div className="space-y-1">
              <label className="text-[12px] font-semibold text-[#16191f]">
                To confirm deletion, type <span className="font-bold text-[#d13212]">delete</span> below:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="delete"
                className="w-full px-3 py-1.5 border border-[#aab7b8] rounded text-[13px]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#eaeded]">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 text-[13px] font-medium text-[#16191f] border border-[#aab7b8] rounded hover:bg-[#eaeded]"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading || deleteConfirmText.toLowerCase() !== "delete"}
                className="px-4 text-[13px] font-semibold text-white bg-[#d13212] hover:bg-[#ba2d0f] disabled:opacity-50 rounded"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
