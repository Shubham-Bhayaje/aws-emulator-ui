/**
 * src/app/kms/custom-keystores/CustomKeyStoresClient.tsx – Custom Key Stores Client Component.
 * Zero emojis, Cloudscape enterprise standard, strict 32px button height standard.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CustomKeyStoreItem } from "../types";

interface CustomKeyStoresClientProps {
  customKeyStores: CustomKeyStoreItem[];
}

export function CustomKeyStoresClient({ customKeyStores }: CustomKeyStoresClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [notSupportedMessage, setNotSupportedMessage] = useState<string | null>(null);

  const filteredStores = customKeyStores.filter((s) => {
    const term = search.toLowerCase();
    const idMatch = s.customKeyStoreId?.toLowerCase().includes(term);
    const nameMatch = s.customKeyStoreName?.toLowerCase().includes(term);
    const typeMatch = s.customKeyStoreType?.toLowerCase().includes(term);
    return !search || idMatch || nameMatch || typeMatch;
  });

  const handleCreateClick = () => {
    setNotSupportedMessage(
      "Not supported by this emulator: Creating an AWS KMS custom key store requires an active AWS CloudHSM cluster or an external key store proxy."
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-[#16191f]">
            Custom key stores ({customKeyStores.length})
          </h1>
          <p className="text-[13px] text-[#545b64] mt-1 max-w-4xl">
            A custom key store is an AWS KMS resource backed by an AWS CloudHSM cluster or external key manager. You can use KMS keys in a custom key store to protect data under your control.
          </p>
        </div>
      </div>

      {/* Emulator Support Notice */}
      {notSupportedMessage && (
        <div className="bg-[#fdf3f1] border border-[#d13212] rounded p-3 text-[13px] text-[#d13212] flex items-center justify-between">
          <span>{notSupportedMessage}</span>
          <button
            onClick={() => setNotSupportedMessage(null)}
            className="text-[#545b64] font-bold text-sm ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Info Callout */}
      <div className="bg-[#f2f8fd] border-l-4 border-[#0972d3] p-4 rounded-r text-[13px] text-[#16191f]">
        <div className="font-bold text-[#0972d3] mb-1">About custom key stores</div>
        <div>
          Custom key stores combine the convenience and comprehensive integration of AWS KMS with the added control of an AWS CloudHSM cluster or an external key manager outside AWS.
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-[#eaeded] rounded shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-[#eaeded] flex flex-wrap items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Find custom key stores"
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
          <div>
            <button
              onClick={handleCreateClick}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] bg-[#ec7211] hover:bg-[#eb5f07] text-white px-4 rounded shadow-sm transition-colors"
            >
              Create custom key store
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-[#f8f9fa] border-b border-[#eaeded] font-semibold text-[#545b64] text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Custom key store ID</th>
                <th className="py-2.5 px-4">Custom key store name</th>
                <th className="py-2.5 px-4">Type</th>
                <th className="py-2.5 px-4">Connection state</th>
                <th className="py-2.5 px-4">CloudHSM cluster ID</th>
                <th className="py-2.5 px-4">Creation date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded]">
              {filteredStores.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#545b64]">
                    No custom key stores found. A custom key store requires an AWS CloudHSM cluster or external key manager.
                  </td>
                </tr>
              ) : (
                filteredStores.map((s) => (
                  <tr key={s.customKeyStoreId} className="hover:bg-[#f2f8fd] transition-colors">
                    <td className="py-3 px-4 font-mono text-[12px] text-[#0972d3] font-medium">
                      {s.customKeyStoreId}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#16191f]">
                      {s.customKeyStoreName}
                    </td>
                    <td className="py-3 px-4 text-[#545b64]">
                      {s.customKeyStoreType || "AWS_CLOUDHSM"}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded bg-[#f2f3f3] text-[#545b64]">
                        {s.connectionState || "DISCONNECTED"}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[12px] text-[#545b64]">
                      {s.cloudHsmClusterId || "-"}
                    </td>
                    <td className="py-3 px-4 text-[#545b64]">{s.creationDate || "-"}</td>
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
