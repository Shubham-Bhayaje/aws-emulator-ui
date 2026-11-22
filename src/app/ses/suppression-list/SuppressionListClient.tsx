"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  SESSuppressedDestination,
  putSuppressedDestinationAction,
  deleteSuppressedDestinationAction,
} from "../actions";

interface SuppressionListClientProps {
  initialDestinations: SESSuppressedDestination[];
}

export default function SuppressionListClient({
  initialDestinations,
}: SuppressionListClientProps) {
  const router = useRouter();
  const [destinations, setDestinations] = useState<SESSuppressedDestination[]>(initialDestinations);
  const [search, setSearch] = useState("");
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);

  // Add Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newReason, setNewReason] = useState<"BOUNCE" | "COMPLAINT">("BOUNCE");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Remove Loading
  const [removeLoading, setRemoveLoading] = useState(false);

  const filtered = destinations.filter((d) =>
    d.emailAddress.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setAddError(null);

    const res = await putSuppressedDestinationAction({
      emailAddress: newEmail.trim(),
      reason: newReason,
    });

    setAddLoading(false);
    if (res.success) {
      setIsAddModalOpen(false);
      setNewEmail("");
      router.refresh();
      const updated = await import("../actions").then((a) => a.listSuppressedDestinationsAction());
      if (updated.success) setDestinations(updated.destinations);
    } else {
      setAddError(res.error || "Failed to add email to suppression list.");
    }
  };

  const handleRemove = async () => {
    if (!selectedEmail) return;
    setRemoveLoading(true);

    const res = await deleteSuppressedDestinationAction(selectedEmail);
    setRemoveLoading(false);

    if (res.success) {
      setDestinations((prev) => prev.filter((d) => d.emailAddress !== selectedEmail));
      setSelectedEmail(null);
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-[#16191f]">Suppression list</h1>
          <p className="text-[13px] text-[#545b64]">
            Addresses that have produced bounces or complaints are automatically added to your account-level suppression list to protect your sender reputation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRemove}
            disabled={!selectedEmail || removeLoading}
            className="px-3 text-[13px] font-medium text-[#d13212] bg-white border border-[#d13212] rounded hover:bg-[#fdf2f2] disabled:opacity-50"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            {removeLoading ? "Removing..." : "Remove"}
          </button>
          <button
            onClick={() => {
              setAddError(null);
              setIsAddModalOpen(true);
            }}
            className="px-4 text-[13px] font-semibold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Add email address
          </button>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="p-3 bg-white border border-[#eaeded] rounded-t-md">
        <div className="w-full sm:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search suppressed email addresses"
            className="w-full px-3 py-1.5 border border-[#aab7b8] rounded text-[13px] bg-white placeholder-[#879596]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border-x border-b border-[#eaeded] rounded-b-md shadow-sm overflow-x-auto">
        <table className="w-full text-left text-[13px] text-[#16191f] border-collapse">
          <thead>
            <tr className="border-b border-[#eaeded] bg-[#fafafa] text-[#545b64] text-[12px]">
              <th className="py-2.5 px-3 w-8"></th>
              <th className="py-2.5 px-3 font-semibold">Email address</th>
              <th className="py-2.5 px-3 font-semibold">Suppression reason</th>
              <th className="py-2.5 px-3 font-semibold">Last updated</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-[#545b64]">
                  {destinations.length === 0
                    ? "No suppressed destinations found in your Amazon SES account."
                    : "No email addresses match the search query."}
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const isSelected = selectedEmail === item.emailAddress;

                return (
                  <tr
                    key={item.emailAddress}
                    onClick={() => setSelectedEmail(item.emailAddress)}
                    className={`border-b border-[#eaeded] cursor-pointer transition-colors ${
                      isSelected ? "bg-[#f2f8fd]" : "hover:bg-[#fafafa]"
                    }`}
                  >
                    <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="radio"
                        name="suppressionSelection"
                        checked={isSelected}
                        onChange={() => setSelectedEmail(item.emailAddress)}
                        className="accent-[#ec7211]"
                      />
                    </td>
                    <td className="py-2.5 px-3 font-medium text-[#16191f]">
                      {item.emailAddress}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${
                          item.reason === "BOUNCE"
                            ? "bg-[#fff7e6] text-[#b35900] border-[#ffcc80]"
                            : "bg-[#fdf2f2] text-[#d13212] border-[#f5b8b8]"
                        }`}
                      >
                        {item.reason}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[#545b64]">
                      {item.lastUpdateTime
                        ? new Date(item.lastUpdateTime).toLocaleString()
                        : "Unknown"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add Email Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-md shadow-2xl border border-[#d5dbdb] w-full max-w-md p-6 space-y-4">
            <h3 className="text-[16px] font-bold text-[#16191f]">Add email to suppression list</h3>

            {addError && (
              <div className="p-2 bg-[#fdf2f2] border-l-4 border-l-[#d13212] text-[#d13212] text-[12px] rounded">
                {addError}
              </div>
            )}

            <form onSubmit={handleAdd} className="space-y-4 text-[13px]">
              <div>
                <label className="block font-semibold mb-1">
                  Email address <span className="text-[#d13212]">*</span>
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. bounce@example.com"
                  className="w-full px-3 py-1.5 border border-[#aab7b8] rounded"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Suppression reason</label>
                <select
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value as any)}
                  className="w-full px-3 py-1.5 border border-[#aab7b8] rounded bg-white"
                >
                  <option value="BOUNCE">Bounce</option>
                  <option value="COMPLAINT">Complaint</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#eaeded]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 text-[13px] font-medium text-[#16191f] border border-[#aab7b8] rounded hover:bg-[#eaeded]"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-4 text-[13px] font-semibold text-white bg-[#ec7211] hover:bg-[#eb5f07] disabled:opacity-50 rounded"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  {addLoading ? "Adding..." : "Add address"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
