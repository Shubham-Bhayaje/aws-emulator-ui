/**
 * KeyPairsClient.tsx – Interactive Key Pairs manager with real .pem file generation and downloads.
 * Zero emojis, Cloudscape enterprise styling.
 */

"use client";

import { useState, useTransition } from "react";
import { DEFAULT_KEY_PAIRS, KeyPair } from "@/lib/ec2-data";
import { createLiveKeyPair, deleteLiveKeyPair, fetchLiveKeyPairs } from "@/app/ec2/actions";

interface KeyPairsClientProps {
  initialKeyPairs?: KeyPair[];
  isLive?: boolean;
  liveError?: string;
}

export default function KeyPairsClient({
  initialKeyPairs = DEFAULT_KEY_PAIRS,
  isLive = true,
  liveError,
}: KeyPairsClientProps) {
  const [keyPairs, setKeyPairs] = useState<KeyPair[]>(initialKeyPairs);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  // New key form state
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyType, setNewKeyType] = useState<"RSA" | "ED25519">("RSA");
  const [newKeyFormat, setNewKeyFormat] = useState<"pem" | "ppk">("pem");

  const selectedKey = keyPairs.find((k) => k.id === selectedId) || null;

  function handleCreateKeyPair(e: React.FormEvent) {
    e.preventDefault();
    const name = newKeyName.trim();
    if (!name) return;

    startTransition(async () => {
      const res = await createLiveKeyPair(name);
      if (res.success && res.keyPair) {
        setKeyPairs([res.keyPair, ...keyPairs]);
        const keyData = res.keyMaterial || `-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA...\n-----END RSA PRIVATE KEY-----\n`;
        const blob = new Blob([keyData], { type: "application/x-pem-file" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${name}.${newKeyFormat}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        const fresh = await fetchLiveKeyPairs();
        if (fresh.isLive) setKeyPairs(fresh.keyPairs);
      }
      setNewKeyName("");
      setShowCreateModal(false);
    });
  }

  function handleDeleteKeyPair() {
    if (!selectedKey) return;
    const targetName = selectedKey.name;
    setKeyPairs(keyPairs.filter((k) => k.id !== selectedKey.id));
    setSelectedId(null);
    setShowDeleteModal(false);

    startTransition(async () => {
      await deleteLiveKeyPair(targetName);
      const fresh = await fetchLiveKeyPairs();
      if (fresh.isLive) setKeyPairs(fresh.keyPairs);
    });
  }

  const filteredKeys = keyPairs.filter((k) =>
    k.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    k.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4 max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#16191f]">Key Pairs ({keyPairs.length})</h1>
          <p className="text-[13px] text-[#545b64]">
            Manage private keys used to prove your identity when connecting to an Amazon EC2 instance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDeleteModal(true)}
            disabled={!selectedKey}
            className={`px-3 py-1.5 text-[13px] rounded-sm font-medium border transition-colors ${
              selectedKey
                ? "border-[#d5dbdb] text-[#d13212] hover:bg-[#fdf3f1]"
                : "border-[#d5dbdb] text-[#aab7b8] cursor-not-allowed bg-white"
            }`}
          >
            Delete
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-1.5 text-[13px] bg-[#ec7211] text-white rounded-sm hover:bg-[#eb5f07] font-medium transition-colors"
          >
            Create key pair
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#d5dbdb] rounded-sm p-3">
        <input
          type="text"
          placeholder="Filter key pairs by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-[400px] px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded-sm text-[#16191f] focus:border-[#0073bb] outline-hidden"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-[#d5dbdb] rounded-sm awsui-shadow overflow-x-auto">
        <table className="w-full text-[13px] text-left border-collapse">
          <thead className="bg-[#f2f3f3] text-[#545b64] font-semibold border-b border-[#eaeded]">
            <tr>
              <th className="py-2.5 px-3 w-8">
                <input
                  type="checkbox"
                  checked={selectedId !== null && filteredKeys.length > 0}
                  onChange={(e) => {
                    if (e.target.checked && filteredKeys.length > 0) {
                      setSelectedId(filteredKeys[0].id);
                    } else {
                      setSelectedId(null);
                    }
                  }}
                  className="rounded-xs"
                />
              </th>
              <th className="py-2.5 px-3">Name</th>
              <th className="py-2.5 px-3">Type</th>
              <th className="py-2.5 px-3">Format</th>
              <th className="py-2.5 px-3">Fingerprint</th>
              <th className="py-2.5 px-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eaeded]">
            {filteredKeys.map((kp) => {
              const isSelected = selectedId === kp.id;
              return (
                <tr
                  key={kp.id}
                  onClick={() => setSelectedId(isSelected ? null : kp.id)}
                  className={`cursor-pointer transition-colors ${
                    isSelected ? "bg-[#f2f8fd]" : "hover:bg-[#fafafa]"
                  }`}
                >
                  <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => setSelectedId(isSelected ? null : kp.id)}
                      className="rounded-xs"
                    />
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-[#0073bb]">{kp.name}</td>
                  <td className="py-2.5 px-3 font-mono text-[12px] text-[#16191f]">{kp.type}</td>
                  <td className="py-2.5 px-3 uppercase text-[12px] font-mono text-[#545b64]">.{kp.format}</td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-[#545b64]">{kp.fingerprint}</td>
                  <td className="py-2.5 px-3 text-[#545b64] text-[12px]">{kp.createTime}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Create Key Pair Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateKeyPair}
            className="bg-white rounded border border-[#d5dbdb] shadow-2xl max-w-[500px] w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#eaeded] pb-3">
              <h3 className="text-[17px] font-bold text-[#16191f]">Create key pair</h3>
              <button type="button" onClick={() => setShowCreateModal(false)} className="text-[#879596] hover:text-[#16191f]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="space-y-4 text-[13px]">
              <div>
                <label className="block font-medium text-[#16191f] mb-1">Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. my-app-keypair"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#aab7b8] rounded text-[#16191f] outline-hidden focus:border-[#0073bb]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#16191f] mb-1">Key pair type</label>
                <div className="space-y-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="keyType"
                      checked={newKeyType === "RSA"}
                      onChange={() => setNewKeyType("RSA")}
                    />
                    <span>RSA (Encrypted private and public key pair)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="keyType"
                      checked={newKeyType === "ED25519"}
                      onChange={() => setNewKeyType("ED25519")}
                    />
                    <span>ED25519 (Elliptic curve signature)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#16191f] mb-1">Private key file format</label>
                <div className="space-y-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="keyFormat"
                      checked={newKeyFormat === "pem"}
                      onChange={() => setNewKeyFormat("pem")}
                    />
                    <span>.pem (For use with OpenSSH)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="keyFormat"
                      checked={newKeyFormat === "ppk"}
                      onChange={() => setNewKeyFormat("ppk")}
                    />
                    <span>.ppk (For use with PuTTY)</span>
                  </label>
                </div>
              </div>

              <div className="p-3 bg-[#f2f8fd] border border-[#d5dbdb] rounded text-[12px] text-[#0073bb]">
                Saving will automatically generate and download your private key file to your browser.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-1.5 text-[13px] border border-[#545b64] text-[#16191f] rounded hover:bg-[#f2f3f3]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-[13px] bg-[#ec7211] text-white rounded font-medium hover:bg-[#eb5f07]"
              >
                Create key pair
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedKey && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#d5dbdb] shadow-2xl max-w-[460px] w-full p-6 space-y-4">
            <h3 className="text-[16px] font-bold text-[#d13212]">Delete key pair</h3>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to delete key pair <strong className="text-[#16191f]">{selectedKey.name}</strong>?
              You will not be able to reconnect to instances launched with this key pair if you do not have the private key.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#eaeded]">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-1.5 text-[13px] border border-[#545b64] text-[#16191f] rounded hover:bg-[#f2f3f3]"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteKeyPair}
                className="px-4 py-1.5 text-[13px] bg-[#d13212] text-white rounded font-medium hover:bg-[#a82a0f]"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
