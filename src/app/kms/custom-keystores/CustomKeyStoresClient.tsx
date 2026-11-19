/**
 * src/app/kms/custom-keystores/CustomKeyStoresClient.tsx – Custom Key Stores Client Component.
 * Zero emojis, Cloudscape enterprise standard.
 */

"use client";

import { useState } from "react";
import Link from "next/link";

interface KeyStoreItem {
  id: string;
  name: string;
  type: "AWS_CLOUDHSM" | "EXTERNAL_KEY_STORE";
  status: "CONNECTED" | "DISCONNECTED" | "CREATING";
  cloudHsmClusterId?: string;
  proxyUri?: string;
  creationDate: string;
}

export function CustomKeyStoresClient() {
  const [activeTab, setActiveTab] = useState<"all" | "cloudhsm" | "xks">("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedType, setSelectedType] = useState<"AWS_CLOUDHSM" | "EXTERNAL_KEY_STORE">("AWS_CLOUDHSM");
  const [keyStoreName, setKeyStoreName] = useState("");
  const [clusterId, setClusterId] = useState("");
  const [proxyUri, setProxyUri] = useState("");
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Sample or active keystores
  const [keyStores, setKeyStores] = useState<KeyStoreItem[]>([]);

  const filteredStores = keyStores.filter((s) => {
    if (activeTab === "cloudhsm") return s.type === "AWS_CLOUDHSM";
    if (activeTab === "xks") return s.type === "EXTERNAL_KEY_STORE";
    return true;
  });

  const handleCreateKeyStore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyStoreName.trim()) return;

    const newStore: KeyStoreItem = {
      id: `cks-${Math.random().toString(36).substring(2, 10)}`,
      name: keyStoreName.trim(),
      type: selectedType,
      status: "DISCONNECTED",
      cloudHsmClusterId: selectedType === "AWS_CLOUDHSM" ? clusterId || "cluster-sample-01" : undefined,
      proxyUri: selectedType === "EXTERNAL_KEY_STORE" ? proxyUri || "https://xks-proxy.example.internal" : undefined,
      creationDate: new Date().toLocaleString(),
    };

    setKeyStores([...keyStores, newStore]);
    setShowCreateModal(false);
    setKeyStoreName("");
    setClusterId("");
    setProxyUri("");
    setInfoMessage(`Custom key store "${newStore.name}" created. Connect your cluster or external proxy to begin generating keys.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#16191f] tracking-tight">
            Custom key stores ({keyStores.length})
          </h1>
          <p className="text-[13px] text-[#545b64] mt-1 max-w-4xl">
            A custom key store is an AWS KMS resource backed by a key manager outside of AWS KMS that
            you control. You can generate, store, and use KMS keys in hardware security modules (HSMs)
            under your direct physical or logical control.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors shadow-sm"
          >
            Create custom key store
          </button>
        </div>
      </div>

      {infoMessage && (
        <div className="bg-[#edfbf0] border-l-4 border-[#1d8102] p-3 text-[13px] text-[#1d8102] flex items-center justify-between">
          <span>{infoMessage}</span>
          <button
            onClick={() => setInfoMessage(null)}
            className="text-[12px] underline ml-4 hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Two types explanation cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-[#eaeded] rounded p-5 shadow-sm space-y-3">
          <div className="text-[11px] font-bold tracking-wider uppercase text-[#545b64]">Option 1</div>
          <h2 className="text-[16px] font-bold text-[#16191f]">AWS CloudHSM key store</h2>
          <p className="text-[13px] text-[#545b64] leading-relaxed">
            Backed by an AWS CloudHSM cluster in your VPC. KMS keys generated in this key store are stored
            and used in FIPS 140-2 Level 3 certified hardware security modules that you manage.
          </p>
          <div className="text-[12px] text-[#0972d3] font-medium pt-1">
            Requirement: Active AWS CloudHSM cluster with at least 2 HSMs in different AZs.
          </div>
        </div>

        <div className="bg-white border border-[#eaeded] rounded p-5 shadow-sm space-y-3">
          <div className="text-[11px] font-bold tracking-wider uppercase text-[#545b64]">Option 2</div>
          <h2 className="text-[16px] font-bold text-[#16191f]">External key store (XKS)</h2>
          <p className="text-[13px] text-[#545b64] leading-relaxed">
            Backed by an external key manager outside of AWS, such as an on-premises HSM, via an External
            Key Store proxy. Cryptographic keys never leave your on-premises HSM.
          </p>
          <div className="text-[12px] text-[#0972d3] font-medium pt-1">
            Requirement: External key manager and XKS proxy endpoint reachable via Public or VPC endpoint.
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#eaeded] space-x-6 text-[13px] font-medium">
        <button
          onClick={() => setActiveTab("all")}
          className={`pb-2 transition-colors ${
            activeTab === "all"
              ? "border-b-2 border-[#0972d3] text-[#0972d3] font-bold"
              : "text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          All key stores ({keyStores.length})
        </button>
        <button
          onClick={() => setActiveTab("cloudhsm")}
          className={`pb-2 transition-colors ${
            activeTab === "cloudhsm"
              ? "border-b-2 border-[#0972d3] text-[#0972d3] font-bold"
              : "text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          CloudHSM key stores ({keyStores.filter((s) => s.type === "AWS_CLOUDHSM").length})
        </button>
        <button
          onClick={() => setActiveTab("xks")}
          className={`pb-2 transition-colors ${
            activeTab === "xks"
              ? "border-b-2 border-[#0972d3] text-[#0972d3] font-bold"
              : "text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          External key stores ({keyStores.filter((s) => s.type === "EXTERNAL_KEY_STORE").length})
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#eaeded] rounded shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[#eaeded] bg-[#fafafa] text-[#545b64] font-semibold">
                <th className="py-2.5 px-4">Custom key store name</th>
                <th className="py-2.5 px-4">Custom key store ID</th>
                <th className="py-2.5 px-4">Type</th>
                <th className="py-2.5 px-4">Connection state</th>
                <th className="py-2.5 px-4">Backing resource</th>
                <th className="py-2.5 px-4">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded]">
              {filteredStores.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#545b64]">
                    <div className="font-semibold text-[#16191f] text-[14px] mb-1">
                      No custom key stores found
                    </div>
                    <p className="text-[13px] max-w-md mx-auto mb-4">
                      Custom key stores allow you to configure KMS keys that are backed by CloudHSM
                      clusters or external key managers outside AWS.
                    </p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                      className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors"
                    >
                      Create custom key store
                    </button>
                  </td>
                </tr>
              ) : (
                filteredStores.map((s) => (
                  <tr key={s.id} className="hover:bg-[#f2f8fd] transition-colors">
                    <td className="py-3 px-4 font-medium text-[#16191f]">{s.name}</td>
                    <td className="py-3 px-4 font-mono text-[#545b64] text-[12px]">{s.id}</td>
                    <td className="py-3 px-4">
                      {s.type === "AWS_CLOUDHSM" ? "AWS CloudHSM" : "External Key Store (XKS)"}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                          s.status === "CONNECTED"
                            ? "bg-[#edfbf0] text-[#1d8102] border border-[#a4e2b0]"
                            : "bg-[#fbeeed] text-[#d13212] border border-[#f5b8ad]"
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[12px] text-[#545b64]">
                      {s.cloudHsmClusterId || s.proxyUri || "—"}
                    </td>
                    <td className="py-3 px-4 text-[#545b64]">{s.creationDate}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Custom Key Store Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">Create custom key store</h3>
            <p className="text-[13px] text-[#545b64]">
              Select the type of backing keystore and specify configuration details.
            </p>

            <form onSubmit={handleCreateKeyStore} className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                  Custom key store type
                </label>
                <div className="space-y-2">
                  <label className="flex items-start gap-2 cursor-pointer text-[13px]">
                    <input
                      type="radio"
                      name="storeType"
                      checked={selectedType === "AWS_CLOUDHSM"}
                      onChange={() => setSelectedType("AWS_CLOUDHSM")}
                      className="mt-0.5 text-[#0972d3]"
                    />
                    <div>
                      <span className="font-semibold text-[#16191f]">AWS CloudHSM key store</span>
                      <div className="text-[12px] text-[#545b64]">
                        Keys are generated and stored in an AWS CloudHSM cluster that you manage.
                      </div>
                    </div>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer text-[13px]">
                    <input
                      type="radio"
                      name="storeType"
                      checked={selectedType === "EXTERNAL_KEY_STORE"}
                      onChange={() => setSelectedType("EXTERNAL_KEY_STORE")}
                      className="mt-0.5 text-[#0972d3]"
                    />
                    <div>
                      <span className="font-semibold text-[#16191f]">External key store (XKS)</span>
                      <div className="text-[12px] text-[#545b64]">
                        Keys are generated and stored in an external key manager outside of AWS.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                  Custom key store name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. production-cloudhsm-store"
                  value={keyStoreName}
                  onChange={(e) => setKeyStoreName(e.target.value)}
                  className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3]"
                />
              </div>

              {selectedType === "AWS_CLOUDHSM" ? (
                <div>
                  <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                    CloudHSM cluster ID
                  </label>
                  <input
                    type="text"
                    placeholder="cluster-1234567890abcdef0"
                    value={clusterId}
                    onChange={(e) => setClusterId(e.target.value)}
                    className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3]"
                  />
                  <p className="text-[11px] text-[#545b64] mt-1">
                    Enter the cluster ID of an unassociated, active AWS CloudHSM cluster.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                    External key store proxy URI endpoint
                  </label>
                  <input
                    type="text"
                    placeholder="https://myproxy.example.com/kms/xks/v1"
                    value={proxyUri}
                    onChange={(e) => setProxyUri(e.target.value)}
                    className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3]"
                  />
                  <p className="text-[11px] text-[#545b64] mt-1">
                    The endpoint URI for your external key store proxy.
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-[#eaeded]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
