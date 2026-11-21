"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  RegistrySettingsResponse,
  putRegistryScanningConfigurationAction,
  createPullThroughCacheRuleAction,
  deletePullThroughCacheRuleAction,
} from "../actions";

interface RegistrySettingsClientProps {
  initialSettings: RegistrySettingsResponse;
  initialError?: string;
}

export default function RegistrySettingsClient({
  initialSettings,
  initialError,
}: RegistrySettingsClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"scanning" | "replication" | "pullthrough">("scanning");

  const [scanType, setScanType] = useState<"BASIC" | "ENHANCED">(initialSettings.scanType);
  const [scanFeedback, setScanFeedback] = useState<string | null>(null);
  const [isUpdatingScan, startScanTransition] = useTransition();

  // Pull through cache
  const [showAddCacheModal, setShowAddCacheModal] = useState(false);
  const [prefixInput, setPrefixInput] = useState("");
  const [upstreamUrl, setUpstreamUrl] = useState("public.ecr.aws");
  const [cacheError, setCacheError] = useState<string | null>(null);
  const [isUpdatingCache, startCacheTransition] = useTransition();

  function handleSaveScanning(newType: "BASIC" | "ENHANCED") {
    setScanType(newType);
    setScanFeedback(null);

    startScanTransition(async () => {
      const res = await putRegistryScanningConfigurationAction(newType);
      if (res.success) {
        setScanFeedback(`Registry scanning set to ${newType}.`);
        router.refresh();
      } else {
        setScanFeedback(`Failed to update scanning: ${res.error || "Unknown error"}`);
      }
      setTimeout(() => setScanFeedback(null), 4000);
    });
  }

  function handleCreateCacheRule(e: React.FormEvent) {
    e.preventDefault();
    const cleanPrefix = prefixInput.trim().toLowerCase();
    if (!cleanPrefix) {
      setCacheError("Prefix is required.");
      return;
    }

    setCacheError(null);
    startCacheTransition(async () => {
      const res = await createPullThroughCacheRuleAction(cleanPrefix, upstreamUrl);
      if (res.success) {
        setShowAddCacheModal(false);
        setPrefixInput("");
        router.refresh();
      } else {
        setCacheError(res.error || "Failed to create pull through cache rule.");
      }
    });
  }

  function handleDeleteCacheRule(prefix: string) {
    if (!confirm(`Are you sure you want to delete pull through cache rule for '${prefix}'?`)) {
      return;
    }

    startCacheTransition(async () => {
      await deletePullThroughCacheRuleAction(prefix);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6 max-w-[1100px]">
      {/* Breadcrumb */}
      <div className="text-[12px] text-[#545b64] flex items-center gap-1.5">
        <Link href="/" className="hover:text-[#0073bb]">
          Console Home
        </Link>
        <span>/</span>
        <Link href="/ecr/repositories" className="hover:text-[#0073bb]">
          Amazon ECR
        </Link>
        <span>/</span>
        <span className="text-[#16191f] font-semibold">Registry settings</span>
      </div>

      {initialError && (
        <div className="p-3 bg-[#fdf3f1] border border-[#d13212] rounded-sm text-[#d13212] text-[13px]">
          {initialError}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#16191f] mb-1">
            Registry settings
          </h1>
          <p className="text-[13px] text-[#545b64]">
            Manage registry-wide configuration for vulnerability scanning, cross-Region replication, and pull through cache rules.
          </p>
        </div>

        <div className="bg-white border border-[#d5dbdb] px-3 py-1.5 rounded-sm font-mono text-[12px] text-[#545b64]">
          Registry ID: <span className="font-bold text-[#16191f]">{initialSettings.registryId}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#eaeded] flex gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("scanning")}
          className={`px-4 py-2 text-[13px] font-bold border-b-2 transition-colors ${
            activeTab === "scanning"
              ? "border-[#ec7211] text-[#ec7211]"
              : "border-transparent text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          Scanning configuration
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("replication")}
          className={`px-4 py-2 text-[13px] font-bold border-b-2 transition-colors ${
            activeTab === "replication"
              ? "border-[#ec7211] text-[#ec7211]"
              : "border-transparent text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          Replication configuration
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("pullthrough")}
          className={`px-4 py-2 text-[13px] font-bold border-b-2 transition-colors ${
            activeTab === "pullthrough"
              ? "border-[#ec7211] text-[#ec7211]"
              : "border-transparent text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          Pull through cache ({initialSettings.pullThroughCacheRules.length})
        </button>
      </div>

      {/* Tab 1: Scanning Configuration */}
      {activeTab === "scanning" && (
        <div className="bg-white border border-[#d5dbdb] rounded-sm p-6 shadow-xs space-y-5">
          <div className="border-b border-[#eaeded] pb-3">
            <h2 className="text-[16px] font-bold text-[#16191f]">
              Vulnerability scanning configuration
            </h2>
            <p className="text-[12px] text-[#545b64] mt-0.5">
              Choose the scanning engine that evaluates software packages and CVEs across your container repositories.
            </p>
          </div>

          {scanFeedback && (
            <div
              className={`p-3 rounded-sm text-[12px] border ${
                scanFeedback.includes("Failed")
                  ? "bg-[#fdf3f1] border-[#d13212] text-[#d13212]"
                  : "bg-[#e6f4ea] border-[#137333] text-[#137333]"
              }`}
            >
              {scanFeedback}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label
              onClick={() => handleSaveScanning("BASIC")}
              className={`p-5 border rounded-sm cursor-pointer flex flex-col justify-between transition-colors ${
                scanType === "BASIC"
                  ? "border-[#ec7211] bg-[#fdf8f4]"
                  : "border-[#d5dbdb] bg-white hover:bg-[#fafafa]"
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="scanType"
                    checked={scanType === "BASIC"}
                    onChange={() => handleSaveScanning("BASIC")}
                    className="accent-[#ec7211]"
                  />
                  <span className="font-bold text-[#16191f] text-[14px]">Basic scanning</span>
                  <span className="px-2 py-0.5 bg-[#f2f3f3] text-[#545b64] text-[10px] font-bold rounded uppercase">
                    Clair engine
                  </span>
                </div>
                <p className="text-[12px] text-[#545b64] mt-3 leading-relaxed">
                  Basic scanning uses the open-source Clair scanning engine. Scans can be triggered automatically on image push or manually via CLI.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#eaeded] text-[11px] text-[#545b64]">
                Included with Amazon ECR at no additional charge.
              </div>
            </label>

            <label
              onClick={() => handleSaveScanning("ENHANCED")}
              className={`p-5 border rounded-sm cursor-pointer flex flex-col justify-between transition-colors ${
                scanType === "ENHANCED"
                  ? "border-[#ec7211] bg-[#fdf8f4]"
                  : "border-[#d5dbdb] bg-white hover:bg-[#fafafa]"
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="scanType"
                    checked={scanType === "ENHANCED"}
                    onChange={() => handleSaveScanning("ENHANCED")}
                    className="accent-[#ec7211]"
                  />
                  <span className="font-bold text-[#16191f] text-[14px]">Enhanced scanning</span>
                  <span className="px-2 py-0.5 bg-[#f2f8fd] text-[#0073bb] text-[10px] font-bold rounded uppercase">
                    Amazon Inspector
                  </span>
                </div>
                <p className="text-[12px] text-[#545b64] mt-3 leading-relaxed">
                  Enhanced scanning integrates with Amazon Inspector for continuous vulnerability scanning of OS packages and application dependencies.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#eaeded] text-[11px] text-[#545b64]">
                Available after Amazon Inspector is built.
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Tab 2: Replication Configuration */}
      {activeTab === "replication" && (
        <div className="bg-white border border-[#d5dbdb] rounded-sm p-6 shadow-xs space-y-4">
          <div className="border-b border-[#eaeded] pb-3">
            <h2 className="text-[16px] font-bold text-[#16191f]">
              Replication configuration
            </h2>
            <p className="text-[12px] text-[#545b64] mt-0.5">
              Replication automatically syncs repositories and container images to destination AWS Regions or accounts.
            </p>
          </div>

          {initialSettings.replicationRules.length === 0 ? (
            <div className="p-8 text-center text-[#545b64] space-y-2 bg-[#fafafa] border border-[#eaeded] rounded-sm text-[13px]">
              <div className="font-bold text-[#16191f]">No replication destinations configured</div>
              <p className="max-w-md mx-auto text-[12px]">
                Images pushed to this registry reside solely within the local Region. You can configure cross-region replication for disaster recovery and low-latency deployments.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#eaeded] border border-[#eaeded] rounded-sm">
              {initialSettings.replicationRules.map((rule, idx) => (
                <div key={idx} className="p-4 space-y-2 text-[13px]">
                  <div className="font-bold text-[#16191f]">Rule #{idx + 1}</div>
                  <div className="flex flex-wrap gap-2">
                    {rule.destinations.map((d, dIdx) => (
                      <span
                        key={dIdx}
                        className="px-2.5 py-1 bg-[#f2f3f3] text-[#16191f] font-mono text-[11px] rounded"
                      >
                        {d.region} ({d.registryId})
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Pull Through Cache */}
      {activeTab === "pullthrough" && (
        <div className="bg-white border border-[#d5dbdb] rounded-sm p-6 shadow-xs space-y-4">
          <div className="border-b border-[#eaeded] pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-[16px] font-bold text-[#16191f]">
                Pull through cache rules
              </h2>
              <p className="text-[12px] text-[#545b64] mt-0.5">
                Automatically cache images from public container registries into your private Amazon ECR repositories.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddCacheModal(true)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-3 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] transition-colors shadow-xs"
            >
              Add rule
            </button>
          </div>

          {initialSettings.pullThroughCacheRules.length === 0 ? (
            <div className="p-8 text-center text-[#545b64] space-y-2 bg-[#fafafa] border border-[#eaeded] rounded-sm text-[13px]">
              <div className="font-bold text-[#16191f]">No pull through cache rules configured</div>
              <p className="max-w-md mx-auto text-[12px]">
                Create a rule to cache upstream registries (e.g. Amazon ECR Public, Docker Hub, Quay) directly into your private ECR namespace.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCacheModal(true)}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="inline-flex items-center h-[32px] px-3 bg-white border border-[#aab7b8] rounded-sm text-[13px] font-semibold text-[#16191f] hover:bg-[#f2f3f3]"
                >
                  Create pull through cache rule
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto border border-[#eaeded] rounded-sm">
              <table className="w-full text-left border-collapse text-[13px]">
                <thead>
                  <tr className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] text-[11px] font-bold uppercase tracking-wider">
                    <th className="px-4 py-3">ECR Repository prefix</th>
                    <th className="px-4 py-3">Upstream registry URL</th>
                    <th className="px-4 py-3">Created at</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeded]">
                  {initialSettings.pullThroughCacheRules.map((rule) => (
                    <tr key={rule.ecrRepositoryPrefix} className="hover:bg-[#f2f8fd]">
                      <td className="px-4 py-3 font-mono font-bold text-[#16191f]">
                        {rule.ecrRepositoryPrefix}
                      </td>
                      <td className="px-4 py-3 font-mono text-[#545b64]">
                        {rule.upstreamRegistryUrl}
                      </td>
                      <td className="px-4 py-3 text-[#545b64]">
                        {rule.createdAt ? new Date(rule.createdAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteCacheRule(rule.ecrRepositoryPrefix)}
                          disabled={isUpdatingCache}
                          className="text-[12px] font-bold text-[#d13212] hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Pull Through Cache Rule Modal */}
      {showAddCacheModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-sm shadow-xl max-w-[560px] w-full border border-[#d5dbdb] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#eaeded]">
              <h2 className="text-[17px] font-bold text-[#16191f]">
                Add pull through cache rule
              </h2>
              <button
                onClick={() => setShowAddCacheModal(false)}
                className="text-[#545b64] hover:text-[#16191f] text-[18px] font-bold leading-none"
              >
                x
              </button>
            </div>

            <form onSubmit={handleCreateCacheRule}>
              <div className="p-6 space-y-4 text-[13px]">
                {cacheError && (
                  <div className="p-3 bg-[#fdf3f1] border border-[#d13212] rounded-sm text-[#d13212] text-[12px]">
                    {cacheError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block font-bold text-[#16191f]">
                    Upstream registry
                  </label>
                  <select
                    value={upstreamUrl}
                    onChange={(e) => setUpstreamUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-[#aab7b8] rounded-sm text-[13px] bg-white focus:outline-none focus:border-[#ec7211]"
                  >
                    <option value="public.ecr.aws">Amazon ECR Public (public.ecr.aws)</option>
                    <option value="registry-1.docker.io">Docker Hub (registry-1.docker.io)</option>
                    <option value="quay.io">Quay.io (quay.io)</option>
                    <option value="ghcr.io">GitHub Container Registry (ghcr.io)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-bold text-[#16191f]">
                    ECR repository prefix
                  </label>
                  <input
                    type="text"
                    value={prefixInput}
                    onChange={(e) => setPrefixInput(e.target.value)}
                    placeholder="e.g. ecr-public or docker-hub"
                    className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] focus:outline-none focus:border-[#ec7211]"
                  />
                  <p className="text-[12px] text-[#545b64]">
                    The namespace prefix under which cached images will be stored in your private registry.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-3.5 border-t border-[#eaeded] bg-[#fafafa]">
                <button
                  type="button"
                  onClick={() => setShowAddCacheModal(false)}
                  disabled={isUpdatingCache}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="h-[32px] px-3 bg-white border border-[#aab7b8] rounded-sm text-[13px] font-semibold text-[#16191f] hover:bg-[#f2f3f3]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingCache}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="h-[32px] px-4 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] disabled:opacity-50"
                >
                  {isUpdatingCache ? "Creating..." : "Save rule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
