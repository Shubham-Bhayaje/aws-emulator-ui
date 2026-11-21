"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GlacierVaultSummary } from "./types";
import { deleteVaultAction } from "./actions";

interface VaultsClientProps {
  initialVaults: GlacierVaultSummary[];
}

export default function VaultsClient({ initialVaults }: VaultsClientProps) {
  const router = useRouter();
  const [vaults, setVaults] = useState<GlacierVaultSummary[]>(initialVaults);
  const [selectedVaultName, setSelectedVaultName] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const filteredVaults = useMemo(() => {
    if (!searchQuery.trim()) return vaults;
    const q = searchQuery.toLowerCase();
    return vaults.filter((v) => v.VaultName.toLowerCase().includes(q));
  }, [vaults, searchQuery]);

  const totalVaults = vaults.length;
  const totalArchives = vaults.reduce((acc, v) => acc + (v.NumberOfArchives || 0), 0);
  const totalBytes = vaults.reduce((acc, v) => acc + (v.SizeInBytes || 0), 0);

  function formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  function formatDate(isoString?: string): string {
    if (!isoString) return "-";
    try {
      const d = new Date(isoString);
      return d.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
    } catch {
      return isoString;
    }
  }

  const selectedVault = vaults.find((v) => v.VaultName === selectedVaultName);

  async function handleDeleteConfirm() {
    if (!selectedVaultName) return;
    setIsDeleting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const res = await deleteVaultAction(selectedVaultName);
    setIsDeleting(false);

    if (res.success) {
      setVaults((prev) => prev.filter((v) => v.VaultName !== selectedVaultName));
      setSelectedVaultName(null);
      setDeleteModalOpen(false);
      setDeleteConfirmInput("");
      setSuccessMessage(`Vault "${selectedVaultName}" was successfully deleted.`);
    } else {
      setErrorMessage(res.error || "Failed to delete vault.");
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Title & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#16191f]">Vaults</h1>
          <p className="text-[13px] text-[#545b64] mt-0.5">
            A vault is a container for storing archives in Amazon S3 Glacier.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/glacier/create"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors"
          >
            Create vault
          </Link>
        </div>
      </div>

      {/* Status Banners */}
      {successMessage && (
        <div className="bg-[#f2f8f0] border border-[#1d8102] rounded p-3 text-[13px] text-[#1d8102] flex items-center justify-between">
          <span>{successMessage}</span>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-[#1d8102] hover:underline font-semibold ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="bg-[#fdf3f2] border border-[#d13212] rounded p-3 text-[13px] text-[#d13212] flex items-center justify-between">
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-[#d13212] hover:underline font-semibold ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-semibold text-[#545b64] uppercase tracking-wide">
            Total Vaults
          </div>
          <div className="text-[24px] font-bold text-[#16191f] mt-1">{totalVaults}</div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-semibold text-[#545b64] uppercase tracking-wide">
            Total Archives
          </div>
          <div className="text-[24px] font-bold text-[#16191f] mt-1">{totalArchives}</div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-semibold text-[#545b64] uppercase tracking-wide">
            Total Storage Size
          </div>
          <div className="text-[24px] font-bold text-[#16191f] mt-1">{formatBytes(totalBytes)}</div>
        </div>
      </div>

      {/* Table Toolbar Container */}
      <div className="bg-white border border-[#eaeded] rounded shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#eaeded] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Filter vaults by name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211] focus:ring-1 focus:ring-[#ec7211]"
              />
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-[12px] text-[#545b64] hover:text-[#16191f] underline"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (selectedVaultName) {
                  router.push(`/glacier/vaults/${encodeURIComponent(selectedVaultName)}`);
                }
              }}
              disabled={!selectedVaultName}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className={`inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border transition-colors ${
                selectedVaultName
                  ? "border-[#545b64] text-[#16191f] bg-white hover:bg-[#fafafa]"
                  : "border-[#d5dbdb] text-[#aab7b8] bg-[#f2f3f3] cursor-not-allowed"
              }`}
            >
              View details
            </button>

            <button
              onClick={() => {
                setDeleteConfirmInput("");
                setDeleteModalOpen(true);
              }}
              disabled={!selectedVaultName}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className={`inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border transition-colors ${
                selectedVaultName
                  ? "border-[#d13212] text-[#d13212] bg-white hover:bg-[#fdf3f2]"
                  : "border-[#d5dbdb] text-[#aab7b8] bg-[#f2f3f3] cursor-not-allowed"
              }`}
            >
              Delete vault
            </button>
          </div>
        </div>

        {/* Vaults Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] font-semibold">
                <th className="py-2.5 px-4 w-10"></th>
                <th className="py-2.5 px-4">Vault name</th>
                <th className="py-2.5 px-4">Vault ARN</th>
                <th className="py-2.5 px-4">Creation date</th>
                <th className="py-2.5 px-4">Last inventory date</th>
                <th className="py-2.5 px-4 text-right">Number of archives</th>
                <th className="py-2.5 px-4 text-right">Size</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded]">
              {filteredVaults.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 px-4 text-center">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="text-[16px] font-bold text-[#16191f]">No vaults found</div>
                      <p className="text-[13px] text-[#545b64] leading-relaxed">
                        You do not have any Glacier vaults in this Region. Create a vault to begin
                        archiving data with long-term retention and high durability.
                      </p>
                      <div className="pt-2">
                        <Link
                          href="/glacier/create"
                          style={{
                            height: "32px",
                            minHeight: "32px",
                            maxHeight: "32px",
                            whiteSpace: "nowrap",
                          }}
                          className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors"
                        >
                          Create vault
                        </Link>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredVaults.map((vault) => {
                  const isSelected = selectedVaultName === vault.VaultName;
                  return (
                    <tr
                      key={vault.VaultName}
                      onClick={() => setSelectedVaultName(vault.VaultName)}
                      className={`cursor-pointer hover:bg-[#f2f8f8] transition-colors ${
                        isSelected ? "bg-[#f2f8f8]" : ""
                      }`}
                    >
                      <td className="py-2.5 px-4">
                        <input
                          type="radio"
                          name="selectedVault"
                          checked={isSelected}
                          onChange={() => setSelectedVaultName(vault.VaultName)}
                          className="text-[#ec7211] focus:ring-[#ec7211]"
                        />
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-[#0073bb] hover:underline">
                        <Link
                          href={`/glacier/vaults/${encodeURIComponent(vault.VaultName)}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {vault.VaultName}
                        </Link>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[11px] text-[#545b64] select-all max-w-xs truncate">
                        {vault.VaultARN}
                      </td>
                      <td className="py-2.5 px-4 text-[#16191f]">
                        {formatDate(vault.CreationDate)}
                      </td>
                      <td className="py-2.5 px-4 text-[#545b64]">
                        {formatDate(vault.LastInventoryDate)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-medium text-[#16191f]">
                        {vault.NumberOfArchives.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-right font-medium text-[#16191f]">
                        {formatBytes(vault.SizeInBytes)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-3 bg-[#fafafa] border-t border-[#eaeded] text-[12px] text-[#545b64] flex items-center justify-between">
          <span>Showing {filteredVaults.length} of {vaults.length} vaults</span>
        </div>
      </div>

      {/* Delete Vault Confirmation Modal */}
      {deleteModalOpen && selectedVault && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <h2 className="text-[18px] font-bold text-[#16191f]">Delete vault</h2>
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="text-[#545b64] hover:text-[#16191f] text-[18px] font-bold"
              >
                &times;
              </button>
            </div>

            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to delete the vault{" "}
              <strong className="text-[#16191f]">{selectedVault.VaultName}</strong>?
            </p>

            <div className="bg-[#fdf3f2] border-l-4 border-[#d13212] p-3 text-[12px] text-[#545b64] space-y-1">
              <div className="font-bold text-[#d13212]">Important note on vault deletion</div>
              <p>
                A vault cannot be deleted if it contains archives. In accordance with Amazon S3
                Glacier constraints, you must first delete all archives before deleting the vault.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-[13px] font-semibold text-[#16191f]">
                To confirm deletion, type <code className="bg-[#f2f3f3] px-1 py-0.5 rounded font-mono font-normal text-[#16191f]">{selectedVault.VaultName}</code> below:
              </label>
              <input
                type="text"
                placeholder={selectedVault.VaultName}
                value={deleteConfirmInput}
                onChange={(e) => setDeleteConfirmInput(e.target.value)}
                className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211] focus:ring-1 focus:ring-[#ec7211]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                onClick={() => setDeleteModalOpen(false)}
                disabled={isDeleting}
                style={{
                  height: "32px",
                  minHeight: "32px",
                  maxHeight: "32px",
                  whiteSpace: "nowrap",
                }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#545b64] text-[#16191f] bg-white hover:bg-[#fafafa] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting || deleteConfirmInput !== selectedVault.VaultName}
                style={{
                  height: "32px",
                  minHeight: "32px",
                  maxHeight: "32px",
                  whiteSpace: "nowrap",
                }}
                className={`inline-flex items-center justify-center font-bold text-[13px] px-4 rounded text-white transition-colors ${
                  deleteConfirmInput === selectedVault.VaultName && !isDeleting
                    ? "bg-[#d13212] hover:bg-[#a82a0f]"
                    : "bg-[#d5dbdb] text-[#879596] cursor-not-allowed"
                }`}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
