"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  SESConfigurationSetSummary,
  deleteConfigurationSetAction,
} from "../actions";

interface ConfigurationSetsClientProps {
  initialConfigSets: SESConfigurationSetSummary[];
}

export default function ConfigurationSetsClient({
  initialConfigSets,
}: ConfigurationSetsClientProps) {
  const router = useRouter();
  const [configSets, setConfigSets] = useState<SESConfigurationSetSummary[]>(initialConfigSets);
  const [search, setSearch] = useState("");
  const [selectedSet, setSelectedSet] = useState<string | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const filtered = configSets.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async () => {
    if (!selectedSet) return;
    if (deleteConfirmText.toLowerCase() !== "delete") {
      setDeleteError('Please type "delete" to confirm.');
      return;
    }

    setDeleteLoading(true);
    setDeleteError(null);

    const res = await deleteConfigurationSetAction(selectedSet);
    setDeleteLoading(false);

    if (res.success) {
      setConfigSets((prev) => prev.filter((c) => c.name !== selectedSet));
      setSelectedSet(null);
      setIsDeleteModalOpen(false);
      setDeleteConfirmText("");
      router.refresh();
    } else {
      setDeleteError(res.error || "Failed to delete configuration set.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-[#16191f]">Configuration sets</h1>
          <p className="text-[13px] text-[#545b64]">
            Configuration sets contain rules and event destinations to publish email send, bounce, and delivery metrics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setDeleteConfirmText("");
              setDeleteError(null);
              setIsDeleteModalOpen(true);
            }}
            disabled={!selectedSet}
            className="px-3 text-[13px] font-medium text-[#d13212] bg-white border border-[#d13212] rounded hover:bg-[#fdf2f2] disabled:opacity-50"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Delete
          </button>
          <Link
            href="/ses/configuration-sets/create"
            className="px-4 text-[13px] font-semibold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded flex items-center"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Create configuration set
          </Link>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="p-3 bg-white border border-[#eaeded] rounded-t-md">
        <div className="w-full sm:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search configuration sets"
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
              <th className="py-2.5 px-3 font-semibold">Configuration set name</th>
              <th className="py-2.5 px-3 font-semibold">Sending status</th>
              <th className="py-2.5 px-3 font-semibold">Reputation metrics</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-[#545b64]">
                  {configSets.length === 0 ? (
                    <div className="space-y-2">
                      <p>No configuration sets found in your Amazon SES account.</p>
                      <Link
                        href="/ses/configuration-sets/create"
                        className="inline-block px-3 py-1 text-[12px] font-semibold text-white bg-[#ec7211] rounded"
                      >
                        Create configuration set
                      </Link>
                    </div>
                  ) : (
                    "No configuration sets match the search query."
                  )}
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const isSelected = selectedSet === item.name;

                return (
                  <tr
                    key={item.name}
                    onClick={() => setSelectedSet(item.name)}
                    className={`border-b border-[#eaeded] cursor-pointer transition-colors ${
                      isSelected ? "bg-[#f2f8fd]" : "hover:bg-[#fafafa]"
                    }`}
                  >
                    <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="radio"
                        name="configSetSelection"
                        checked={isSelected}
                        onChange={() => setSelectedSet(item.name)}
                        className="accent-[#ec7211]"
                      />
                    </td>
                    <td className="py-2.5 px-3 font-medium text-[#16191f]">
                      {item.name}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-[#e7f4e4] text-[#1d8102] border border-[#a2dca0]">
                        Enabled
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[#545b64]">
                      <span className="text-[#1d8102]">Enabled</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedSet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-md shadow-2xl border border-[#d5dbdb] w-full max-w-md p-6 space-y-4">
            <h3 className="text-[16px] font-bold text-[#16191f]">
              Delete configuration set: {selectedSet}?
            </h3>
            <p className="text-[13px] text-[#545b64]">
              Emails currently using this configuration set will revert to sending without custom event destinations or reputation options.
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
