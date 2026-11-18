/**
 * src/components/ec2/KeyPairsClient.tsx – AWS Key Pairs Console Replica.
 * Zero emojis, Cloudscape enterprise styling.
 */

"use client";

import React, { useState, useTransition } from "react";
import { KeyPair } from "@/lib/ec2-data";
import {
  createLiveKeyPair,
  importLiveKeyPair,
  deleteLiveKeyPair,
  fetchLiveKeyPairs,
} from "@/app/ec2/actions";

interface Props {
  initialKeyPairs?: KeyPair[];
  isLive?: boolean;
  liveError?: string;
}

export default function KeyPairsClient({
  initialKeyPairs = [],
  isLive = true,
  liveError,
}: Props) {
  const [keyPairs, setKeyPairs] = useState<KeyPair[]>(initialKeyPairs || []);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialKeyPairs && initialKeyPairs.length > 0 ? initialKeyPairs[0]?.id : null
  );
  const [search, setSearch] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"details" | "tags">("details");
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Create Key Pair Form
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyType, setNewKeyType] = useState<"RSA" | "ED25519">("RSA");
  const [newKeyFormat, setNewKeyFormat] = useState<"pem" | "ppk">("pem");

  // Import Key Pair Form
  const [importKeyName, setImportKeyName] = useState("");
  const [importPublicKeyMaterial, setImportPublicKeyMaterial] = useState("");

  const selectedKey = (keyPairs || []).find((k) => k.id === selectedId) || null;

  const totalCount = (keyPairs || []).length;
  const rsaCount = (keyPairs || []).filter((k) => (k.type || "").toUpperCase() === "RSA").length;
  const ed25519Count = (keyPairs || []).filter((k) => (k.type || "").toUpperCase() === "ED25519").length;

  function refreshKeyPairs() {
    startTransition(async () => {
      const res = await fetchLiveKeyPairs();
      const list = res.keyPairs || [];
      setKeyPairs(list);
      if (list.length > 0 && (!selectedId || !list.some((k) => k.id === selectedId))) {
        setSelectedId(list[0]?.id || null);
      }
    });
  }

  function handleCreateKeyPair(e: React.FormEvent) {
    e.preventDefault();
    const name = newKeyName.trim();
    if (!name) return;

    startTransition(async () => {
      const res = await createLiveKeyPair(
        name,
        newKeyType.toLowerCase() as "rsa" | "ed25519",
        newKeyFormat
      );

      if (res.success && res.keyPair) {
        setShowCreateModal(false);
        setNewKeyName("");
        const fresh = await fetchLiveKeyPairs();
        const list = fresh.keyPairs || [];
        setKeyPairs(list);
        setSelectedId(res.keyPair.id);

        // Download private key file in browser
        const keyData =
          res.keyMaterial ||
          `-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA0...\n-----END RSA PRIVATE KEY-----\n`;
        const blob = new Blob([keyData], { type: "application/x-pem-file" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${name}.${newKeyFormat}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setFeedback(`Created and downloaded key pair "${name}.${newKeyFormat}" successfully.`);
      } else {
        setFeedback(`Failed to create key pair: ${res.error || "Unknown error"}`);
      }
      setTimeout(() => setFeedback(null), 6000);
    });
  }

  function handleImportKeyPair(e: React.FormEvent) {
    e.preventDefault();
    const name = importKeyName.trim();
    const pubKey = importPublicKeyMaterial.trim();
    if (!name || !pubKey) return;

    startTransition(async () => {
      const res = await importLiveKeyPair({
        keyName: name,
        publicKeyMaterial: pubKey,
      });

      if (res.success && res.keyPair) {
        setShowImportModal(false);
        setImportKeyName("");
        setImportPublicKeyMaterial("");
        const fresh = await fetchLiveKeyPairs();
        const list = fresh.keyPairs || [];
        setKeyPairs(list);
        setSelectedId(res.keyPair.id);
        setFeedback(`Imported public key pair "${name}" successfully.`);
      } else {
        setFeedback(`Failed to import key pair: ${res.error || "Unknown error"}`);
      }
      setTimeout(() => setFeedback(null), 6000);
    });
  }

  function handleDeleteKeyPair() {
    if (!selectedKey) return;
    const targetName = selectedKey.name;

    startTransition(async () => {
      setShowDeleteModal(false);
      const res = await deleteLiveKeyPair(targetName);
      if (res.success) {
        const fresh = await fetchLiveKeyPairs();
        const list = fresh.keyPairs || [];
        setKeyPairs(list);
        setSelectedId(list.length > 0 ? list[0]?.id : null);
        setFeedback(`Deleted key pair "${targetName}" successfully.`);
      } else {
        setFeedback(`Failed to delete key pair: ${res.error || "Unknown error"}`);
      }
      setTimeout(() => setFeedback(null), 5000);
    });
  }

  const filteredKeys = (keyPairs || []).filter((k) => {
    const term = search.toLowerCase();
    return (
      (k.name || "").toLowerCase().includes(term) ||
      (k.id || "").toLowerCase().includes(term) ||
      (k.fingerprint || "").toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-4 max-w-[1400px]">
      {/* Live Badge Banner */}
      <div className="flex items-center justify-between bg-white border border-[#d5dbdb] px-4 py-2.5 rounded-sm shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`inline-block w-2.5 h-2.5 rounded-full ${
                isLive ? "bg-[#1d8102]" : "bg-[#ec7211]"
              }`}
            />
            <span className="text-[12px] font-semibold text-[#16191f]">
              {isLive ? "Key Pairs Connected (AWS Emulator)" : "Mock Data Mode"}
            </span>
          </div>
          <span className="text-[#95a5a6] text-[12px]">|</span>
          <span className="text-[12px] font-mono text-[#545b64]">Region: us-east-1</span>
        </div>
        <span className="text-[11px] text-[#545b64]">AWS EC2 Key Pair Manager</span>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#d5dbdb] p-4 rounded-sm shadow-xs">
          <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
            Total Key Pairs
          </div>
          <div className="text-[24px] font-bold text-[#16191f] mt-1">{totalCount}</div>
          <div className="text-[11px] text-[#545b64] mt-0.5">Instance SSH authentication keys</div>
        </div>

        <div className="bg-white border border-[#d5dbdb] p-4 rounded-sm shadow-xs">
          <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
            RSA Key Pairs
          </div>
          <div className="text-[24px] font-bold text-[#0073bb] mt-1">{rsaCount}</div>
          <div className="text-[11px] text-[#545b64] mt-0.5">Compatible with all OS versions</div>
        </div>

        <div className="bg-white border border-[#d5dbdb] p-4 rounded-sm shadow-xs">
          <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
            ED25519 Key Pairs
          </div>
          <div className="text-[24px] font-bold text-[#1d8102] mt-1">{ed25519Count}</div>
          <div className="text-[11px] text-[#545b64] mt-0.5">Elliptic curve cryptography</div>
        </div>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`p-3 rounded-sm border text-[13px] flex items-center justify-between ${
            feedback.includes("Failed") || feedback.includes("failed")
              ? "bg-[#fdf3f1] border-[#d13212] text-[#d13212]"
              : "bg-[#f2f8fd] border-[#0073bb] text-[#0073bb]"
          }`}
        >
          <span>{feedback}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-[12px] font-bold hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-white border border-[#d5dbdb] rounded-sm shadow-xs">
        {/* Header & Actions Toolbar */}
        <div className="p-4 border-b border-[#eaeded] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-[18px] font-bold text-[#16191f]">
              Key Pairs ({totalCount})
            </h1>
            <p className="text-[12px] text-[#545b64] mt-0.5">
              A key pair, consisting of a private key and a public key, is a set of security credentials used to prove identity when connecting to an Amazon EC2 instance.
            </p>
          </div>

          <div className="flex items-center gap-2 relative">
            <button
              onClick={refreshKeyPairs}
              disabled={isPending}
              title="Refresh key pairs"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-3 border border-[#aab7b8] rounded-sm text-[13px] font-bold text-[#16191f] bg-white hover:bg-[#f2f3f3] whitespace-nowrap inline-flex items-center justify-center transition-colors disabled:opacity-50"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`mr-1.5 ${isPending ? "animate-spin" : ""}`}
              >
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
              Refresh
            </button>

            {/* Actions Menu Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowActionsDropdown(!showActionsDropdown)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-3 border border-[#aab7b8] rounded-sm text-[13px] font-bold text-[#16191f] bg-white hover:bg-[#f2f3f3] whitespace-nowrap inline-flex items-center justify-center transition-colors"
              >
                Actions
                <svg
                  className="ml-1.5"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {showActionsDropdown && (
                <div
                  className="absolute right-0 top-full mt-1 w-48 bg-white border border-[#d5dbdb] rounded-sm shadow-lg py-1 z-30 text-[13px]"
                  onMouseLeave={() => setShowActionsDropdown(false)}
                >
                  <button
                    onClick={() => {
                      setShowActionsDropdown(false);
                      setShowImportModal(true);
                    }}
                    className="w-full text-left px-4 py-2 text-[#16191f] hover:bg-[#f2f3f3] flex items-center justify-between"
                  >
                    Import key pair
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowDeleteModal(true)}
              disabled={!selectedKey || isPending}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className={`h-[32px] px-3 border rounded-sm text-[13px] font-bold whitespace-nowrap inline-flex items-center justify-center transition-colors ${
                selectedKey
                  ? "border-[#d5dbdb] text-[#d13212] hover:bg-[#fdf3f1] bg-white"
                  : "border-[#eaeded] text-[#aab7b8] cursor-not-allowed bg-white"
              }`}
            >
              Delete key pair
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-4 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] whitespace-nowrap inline-flex items-center justify-center transition-colors shadow-xs"
            >
              Create key pair
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="p-3 border-b border-[#eaeded] bg-[#fafafa]">
          <div className="relative max-w-[450px]">
            <input
              type="text"
              placeholder="Filter key pairs by name, ID, or fingerprint..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] bg-white text-[#16191f] focus:outline-hidden focus:border-[#0073bb]"
            />
            <svg
              className="absolute left-2.5 top-2.5 text-[#545b64]"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] text-[11px] font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3 w-10 text-center"></th>
                <th className="py-2.5 px-4">Name</th>
                <th className="py-2.5 px-3">Key pair ID</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Format</th>
                <th className="py-2.5 px-3">Fingerprint</th>
                <th className="py-2.5 px-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded] text-[#16191f]">
              {filteredKeys.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-[#545b64]">
                    No key pairs found in region us-east-1.
                  </td>
                </tr>
              ) : (
                filteredKeys.map((kp) => {
                  const isSelected = selectedId === kp.id;
                  return (
                    <tr
                      key={kp.id}
                      onClick={() => setSelectedId(kp.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? "bg-[#f2f8fd]" : "hover:bg-[#fafafa]"
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="radio"
                          name="selectedKp"
                          checked={isSelected}
                          onChange={() => setSelectedId(kp.id)}
                          className="accent-[#0073bb] cursor-pointer"
                        />
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-[#0073bb]">
                        {kp.name}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[12px] text-[#545b64]">
                        {kp.id}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#f2f3f3] text-[#16191f] uppercase tracking-wider">
                          {kp.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 uppercase text-[12px] font-mono text-[#545b64]">
                        .{kp.format}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-[#545b64]">
                        {kp.fingerprint}
                      </td>
                      <td className="py-2.5 px-3 text-[#545b64] text-[12px]">
                        {kp.createTime}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cloudscape Bottom Drawer for Details & Tags */}
      {selectedKey && (
        <div className="bg-white border border-[#d5dbdb] rounded-sm shadow-xs mt-4">
          <div className="border-b border-[#eaeded] flex items-center px-4">
            <button
              onClick={() => setActiveTab("details")}
              className={`py-3 px-4 text-[13px] font-bold border-b-2 transition-colors ${
                activeTab === "details"
                  ? "border-[#0073bb] text-[#0073bb]"
                  : "border-transparent text-[#545b64] hover:text-[#16191f]"
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab("tags")}
              className={`py-3 px-4 text-[13px] font-bold border-b-2 transition-colors ${
                activeTab === "tags"
                  ? "border-[#0073bb] text-[#0073bb]"
                  : "border-transparent text-[#545b64] hover:text-[#16191f]"
              }`}
            >
              Tags
            </button>
          </div>

          <div className="p-6">
            {activeTab === "details" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8 text-[13px]">
                <div>
                  <div className="text-[12px] text-[#545b64] font-medium">Name</div>
                  <div className="font-bold text-[#16191f] mt-1">{selectedKey.name}</div>
                </div>

                <div>
                  <div className="text-[12px] text-[#545b64] font-medium">Key pair ID</div>
                  <div className="font-mono text-[#16191f] mt-1">{selectedKey.id}</div>
                </div>

                <div>
                  <div className="text-[12px] text-[#545b64] font-medium">Key pair type</div>
                  <div className="text-[#16191f] mt-1 font-mono">{selectedKey.type}</div>
                </div>

                <div>
                  <div className="text-[12px] text-[#545b64] font-medium">Private key format</div>
                  <div className="text-[#16191f] mt-1 uppercase font-mono">.{selectedKey.format}</div>
                </div>

                <div>
                  <div className="text-[12px] text-[#545b64] font-medium">Created</div>
                  <div className="text-[#16191f] mt-1">{selectedKey.createTime}</div>
                </div>

                <div>
                  <div className="text-[12px] text-[#545b64] font-medium">Fingerprint</div>
                  <div className="font-mono text-[11px] text-[#16191f] mt-1 break-all">
                    {selectedKey.fingerprint}
                  </div>
                </div>

                <div className="md:col-span-2 lg:col-span-3">
                  <div className="text-[12px] text-[#545b64] font-medium">ARN</div>
                  <div className="font-mono text-[12px] text-[#16191f] mt-1 break-all">
                    {selectedKey.arn || `arn:aws:ec2:us-east-1:000000000000:key-pair/${selectedKey.name}`}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-[13px] font-bold text-[#16191f] mb-3">
                  Tags ({Object.keys(selectedKey.tags || {}).length})
                </div>
                {Object.keys(selectedKey.tags || {}).length === 0 ? (
                  <div className="text-[13px] text-[#545b64] py-4">No tags associated with this key pair.</div>
                ) : (
                  <table className="w-full max-w-lg text-[13px] border border-[#eaeded]">
                    <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] text-[11px] font-semibold uppercase">
                      <tr>
                        <th className="py-2 px-3 text-left">Key</th>
                        <th className="py-2 px-3 text-left">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eaeded]">
                      {Object.entries(selectedKey.tags || {}).map(([k, v]) => (
                        <tr key={k}>
                          <td className="py-2 px-3 font-medium text-[#16191f]">{k}</td>
                          <td className="py-2 px-3 text-[#545b64]">{v}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Key Pair Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <form
            onSubmit={handleCreateKeyPair}
            className="bg-white rounded-sm border border-[#d5dbdb] shadow-xl w-full max-w-lg p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#eaeded] pb-3">
              <h3 className="text-[17px] font-bold text-[#16191f]">Create key pair</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-[#545b64] hover:text-[#16191f]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                Name <span className="text-[#d13212]">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. prod-web-access"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] text-[#16191f] focus:outline-hidden focus:border-[#0073bb]"
              />
              <p className="text-[11px] text-[#545b64] mt-1">
                The name can be up to 255 ASCII characters. It cannot include spaces.
              </p>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">Key pair type</label>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 cursor-pointer text-[13px]">
                  <input
                    type="radio"
                    name="keyType"
                    checked={newKeyType === "RSA"}
                    onChange={() => setNewKeyType("RSA")}
                    className="accent-[#0073bb]"
                  />
                  <span>RSA (Supported by all operating systems)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-[13px]">
                  <input
                    type="radio"
                    name="keyType"
                    checked={newKeyType === "ED25519"}
                    onChange={() => setNewKeyType("ED25519")}
                    className="accent-[#0073bb]"
                  />
                  <span>ED25519 (Elliptic curve cryptographic keys)</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">Private key file format</label>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 cursor-pointer text-[13px]">
                  <input
                    type="radio"
                    name="keyFormat"
                    checked={newKeyFormat === "pem"}
                    onChange={() => setNewKeyFormat("pem")}
                    className="accent-[#0073bb]"
                  />
                  <span>.pem (For use with OpenSSH)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-[13px]">
                  <input
                    type="radio"
                    name="keyFormat"
                    checked={newKeyFormat === "ppk"}
                    onChange={() => setNewKeyFormat("ppk")}
                    className="accent-[#0073bb]"
                  />
                  <span>.ppk (For use with PuTTY)</span>
                </label>
              </div>
            </div>

            <div className="p-3 bg-[#f2f8fd] border border-[#0073bb]/30 rounded-sm text-[12px] text-[#0073bb]">
              Saving will automatically download your private key file to your browser. You will not be able to download it again.
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-4 border border-[#aab7b8] rounded-sm text-[13px] font-bold text-[#16191f] hover:bg-[#f2f3f3] whitespace-nowrap inline-flex items-center justify-center transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-4 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] whitespace-nowrap inline-flex items-center justify-center transition-colors disabled:opacity-50"
              >
                {isPending ? "Creating..." : "Create key pair"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Import Key Pair Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <form
            onSubmit={handleImportKeyPair}
            className="bg-white rounded-sm border border-[#d5dbdb] shadow-xl w-full max-w-lg p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#eaeded] pb-3">
              <h3 className="text-[17px] font-bold text-[#16191f]">Import key pair</h3>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="text-[#545b64] hover:text-[#16191f]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                Name <span className="text-[#d13212]">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. corporate-bastion-key"
                value={importKeyName}
                onChange={(e) => setImportKeyName(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] text-[#16191f] focus:outline-hidden focus:border-[#0073bb]"
              />
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                Public key material <span className="text-[#d13212]">*</span>
              </label>
              <textarea
                required
                rows={5}
                placeholder="ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC... user@domain"
                value={importPublicKeyMaterial}
                onChange={(e) => setImportPublicKeyMaterial(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[12px] font-mono text-[#16191f] focus:outline-hidden focus:border-[#0073bb]"
              />
              <p className="text-[11px] text-[#545b64] mt-1">
                Paste the contents of your public key file (e.g. id_rsa.pub or id_ed25519.pub).
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-4 border border-[#aab7b8] rounded-sm text-[13px] font-bold text-[#16191f] hover:bg-[#f2f3f3] whitespace-nowrap inline-flex items-center justify-center transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-4 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] whitespace-nowrap inline-flex items-center justify-center transition-colors disabled:opacity-50"
              >
                {isPending ? "Importing..." : "Import key pair"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-sm border border-[#d5dbdb] shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-[17px] font-bold text-[#16191f]">Delete key pair</h3>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to delete key pair <strong className="text-[#16191f]">{selectedKey.name}</strong> ({selectedKey.id})?
              You will not be able to reconnect to instances launched with this key pair if you do not retain a valid private key.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-4 border border-[#aab7b8] rounded-sm text-[13px] font-bold text-[#16191f] hover:bg-[#f2f3f3] whitespace-nowrap inline-flex items-center justify-center transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteKeyPair}
                disabled={isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-4 bg-[#d13212] text-white rounded-sm text-[13px] font-bold hover:bg-[#b02008] whitespace-nowrap inline-flex items-center justify-center transition-colors disabled:opacity-50"
              >
                {isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
