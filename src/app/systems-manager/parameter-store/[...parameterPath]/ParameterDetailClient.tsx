/**
 * src/app/systems-manager/parameter-store/[...parameterPath]/ParameterDetailClient.tsx
 * Detail client component with Overview, History, and Tags tabs.
 * Replicates AWS Systems Manager Parameter Store console.
 * Zero emojis, Cloudscape enterprise standard, strict 32px button height standard.
 */

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  SSMParameterDetail,
  SSMParameterHistoryItem,
  SSMParameterTag,
} from "../types";
import {
  getParameterValueAction,
  getParameterHistoryAction,
  labelParameterVersionAction,
  deleteParameterAction,
  addTagsToParameterAction,
  removeTagsFromParameterAction,
} from "../actions";

interface ParameterDetailClientProps {
  initialParameter: SSMParameterDetail;
}

export function ParameterDetailClient({ initialParameter }: ParameterDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [parameter, setParameter] = useState<SSMParameterDetail>(initialParameter);
  const [activeTab, setActiveTab] = useState<"overview" | "history" | "tags">("overview");

  // Decrypted Value state
  const [isDecrypted, setIsDecrypted] = useState(false);
  const [decryptedValue, setDecryptedValue] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  // History state
  const [historyItems, setHistoryItems] = useState<SSMParameterHistoryItem[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [historyDecrypted, setHistoryDecrypted] = useState<Record<number, string>>({});

  // Label modal state
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [targetVersion, setTargetVersion] = useState<number>(parameter.version);
  const [labelInput, setLabelInput] = useState("");
  const [labelError, setLabelError] = useState<string | null>(null);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Tags modal state
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [modalTags, setModalTags] = useState<SSMParameterTag[]>(parameter.tags);
  const [newTagKey, setNewTagKey] = useState("");
  const [newTagVal, setNewTagVal] = useState("");

  const [banner, setBanner] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Toggle decrypt for main value
  const handleToggleDecrypt = async () => {
    if (isDecrypted) {
      setIsDecrypted(false);
      return;
    }

    if (decryptedValue !== null) {
      setIsDecrypted(true);
      return;
    }

    const res = await getParameterValueAction(parameter.name, true);
    if (res.success && res.value !== undefined) {
      setDecryptedValue(res.value);
      setIsDecrypted(true);
    } else {
      setBanner({
        type: "error",
        text: res.error || "Failed to decrypt parameter value.",
      });
    }
  };

  // Load history when tab is clicked
  const handleTabChange = async (tab: "overview" | "history" | "tags") => {
    setActiveTab(tab);
    if (tab === "history" && !historyLoaded) {
      const res = await getParameterHistoryAction(parameter.name);
      if (res.success) {
        setHistoryItems(res.history);
        setHistoryLoaded(true);
      }
    }
  };

  // Decrypt individual history version
  const handleDecryptHistoryItem = async (ver: number) => {
    if (historyDecrypted[ver]) return;
    const res = await getParameterValueAction(parameter.name, true);
    if (res.success && res.value !== undefined) {
      setHistoryDecrypted((prev) => ({ ...prev, [ver]: res.value }));
    }
  };

  // Label submit
  const handleApplyLabel = () => {
    if (!labelInput.trim()) return;
    setLabelError(null);

    const labels = labelInput
      .split(",")
      .map((l) => l.trim())
      .filter(Boolean);

    startTransition(async () => {
      const res = await labelParameterVersionAction(parameter.name, targetVersion, labels);
      if (res.success) {
        setShowLabelModal(false);
        setLabelInput("");
        setBanner({
          type: "success",
          text: `Successfully applied labels to version ${targetVersion}.`,
        });
        // Refresh history
        const hRes = await getParameterHistoryAction(parameter.name);
        if (hRes.success) setHistoryItems(hRes.history);
      } else {
        setLabelError(res.error || "Failed to label parameter version.");
      }
    });
  };

  // Delete parameter
  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteParameterAction(parameter.name);
      if (res.success) {
        router.push("/systems-manager/parameter-store");
      } else {
        setBanner({ type: "error", text: res.error || "Failed to delete parameter." });
        setShowDeleteModal(false);
      }
    });
  };

  // Tags save
  const handleSaveTags = () => {
    startTransition(async () => {
      // Find removed keys
      const existingKeys = parameter.tags.map((t) => t.key);
      const newKeys = modalTags.map((t) => t.key);
      const removedKeys = existingKeys.filter((k) => !newKeys.includes(k));

      if (removedKeys.length > 0) {
        await removeTagsFromParameterAction(parameter.name, removedKeys);
      }

      if (modalTags.length > 0) {
        await addTagsToParameterAction(parameter.name, modalTags);
      }

      setParameter((prev) => ({ ...prev, tags: modalTags }));
      setShowTagsModal(false);
      setBanner({ type: "success", text: "Successfully updated parameter tags." });
    });
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(label);
    setTimeout(() => setCopySuccess(null), 2500);
  };

  const cleanPath = parameter.name.startsWith("/") ? parameter.name : `/${parameter.name}`;

  return (
    <div className="space-y-6 max-w-5xl pb-16">
      {/* Breadcrumb */}
      <div>
        <div className="text-[12px] text-[#545b64] mb-1">
          <Link href="/systems-manager/parameter-store" className="text-[#0972d3] hover:underline">
            Parameter Store
          </Link>{" "}
          &gt; {parameter.name}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-[22px] font-bold text-[#16191f] font-mono">{parameter.name}</h1>
            <span
              className={`inline-block px-2.5 py-0.5 rounded text-[12px] font-semibold ${
                parameter.type === "SecureString"
                  ? "bg-[#e7f4e4] text-[#1d8102] border border-[#a2dca0]"
                  : parameter.type === "StringList"
                  ? "bg-[#f3e8ff] text-[#7e22ce] border border-[#d8b4fe]"
                  : "bg-[#e9f3f9] text-[#0972d3] border border-[#9ed0f5]"
              }`}
            >
              {parameter.type}
            </span>
            <span className="bg-[#f2f3f3] text-[#545b64] border border-[#d5dbdb] px-2 py-0.5 rounded text-[11px] font-medium">
              Version {parameter.version}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/systems-manager/parameter-store/edit${cleanPath}`}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-3.5 rounded transition-colors"
            >
              Edit
            </Link>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#d13212] text-[#d13212] hover:bg-[#fdf3f2] px-3.5 rounded transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Banner */}
      {banner && (
        <div
          className={`border rounded p-3 text-[13px] flex items-center justify-between ${
            banner.type === "success"
              ? "bg-[#f2fcf3] border-[#1d8102] text-[#1d8102]"
              : "bg-[#fdf3f2] border-[#d13212] text-[#d13212]"
          }`}
        >
          <span>{banner.text}</span>
          <button
            type="button"
            onClick={() => setBanner(null)}
            className="text-[12px] font-bold text-[#545b64] hover:text-[#16191f] ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-[#eaeded]">
        <nav className="flex space-x-8">
          <button
            type="button"
            onClick={() => handleTabChange("overview")}
            className={`pb-3 text-[14px] font-bold border-b-2 transition-colors ${
              activeTab === "overview"
                ? "border-[#ec7211] text-[#ec7211]"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("history")}
            className={`pb-3 text-[14px] font-bold border-b-2 transition-colors ${
              activeTab === "history"
                ? "border-[#ec7211] text-[#ec7211]"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            History
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("tags")}
            className={`pb-3 text-[14px] font-bold border-b-2 transition-colors ${
              activeTab === "tags"
                ? "border-[#ec7211] text-[#ec7211]"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Tags ({parameter.tags.length})
          </button>
        </nav>
      </div>

      {/* Tab: Overview */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Value Box */}
          <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-[#16191f]">Value</h2>
              <div className="flex items-center gap-3">
                {parameter.type === "SecureString" && (
                  <button
                    type="button"
                    onClick={handleToggleDecrypt}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                    className="inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-3 rounded transition-colors"
                  >
                    {isDecrypted ? "Hide decrypted value" : "Show decrypted value"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      parameter.type === "SecureString" && isDecrypted
                        ? decryptedValue || ""
                        : parameter.value,
                      "value"
                    )
                  }
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-3 rounded transition-colors"
                >
                  {copySuccess === "value" ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            <div className="bg-[#fafafa] border border-[#eaeded] rounded p-4 font-mono text-[13px] text-[#16191f] whitespace-pre-wrap break-all max-h-72 overflow-y-auto">
              {parameter.type === "SecureString" && !isDecrypted
                ? parameter.value
                : isDecrypted && decryptedValue !== null
                ? decryptedValue
                : parameter.value}
            </div>

            {parameter.type === "SecureString" && !isDecrypted && (
              <p className="text-[12px] text-[#545b64]">
                This value is encrypted using KMS key:{" "}
                <code className="bg-[#f2f3f3] px-1 rounded font-mono">
                  {parameter.keyId || "alias/aws/ssm"}
                </code>
                . Click &ldquo;Show decrypted value&rdquo; to decrypt.
              </p>
            )}
          </div>

          {/* Metadata Grid */}
          <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
            <h2 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
              Parameter metadata
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-[13px]">
              <div>
                <span className="text-[#545b64] block">Name</span>
                <span className="font-mono text-[#16191f] font-bold">{parameter.name}</span>
              </div>

              <div>
                <span className="text-[#545b64] block">ARN</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[#16191f] truncate text-[12px]">
                    {parameter.arn}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(parameter.arn, "arn")}
                    className="text-[#0972d3] text-[12px] hover:underline"
                  >
                    {copySuccess === "arn" ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[#545b64] block">Tier</span>
                <span className="text-[#16191f]">{parameter.tier}</span>
              </div>

              <div>
                <span className="text-[#545b64] block">Type</span>
                <span className="text-[#16191f]">{parameter.type}</span>
              </div>

              <div>
                <span className="text-[#545b64] block">Version</span>
                <span className="text-[#16191f] font-mono">{parameter.version}</span>
              </div>

              <div>
                <span className="text-[#545b64] block">Data type</span>
                <span className="text-[#16191f] font-mono">{parameter.dataType || "text"}</span>
              </div>

              {parameter.keyId && (
                <div>
                  <span className="text-[#545b64] block">KMS Key ID</span>
                  <span className="font-mono text-[#16191f] text-[12px]">{parameter.keyId}</span>
                </div>
              )}

              <div>
                <span className="text-[#545b64] block">Last modified date</span>
                <span className="text-[#16191f]">{parameter.lastModifiedDate || "—"}</span>
              </div>

              <div>
                <span className="text-[#545b64] block">Last modified user</span>
                <span className="font-mono text-[12px] text-[#16191f]">
                  {parameter.lastModifiedUser || "arn:aws:iam::000000000000:root"}
                </span>
              </div>

              <div className="md:col-span-2">
                <span className="text-[#545b64] block">Description</span>
                <span className="text-[#16191f]">{parameter.description || "—"}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: History */}
      {activeTab === "history" && (
        <div className="bg-white border border-[#eaeded] rounded shadow-sm">
          <div className="p-4 border-b border-[#eaeded] flex items-center justify-between">
            <div>
              <h2 className="text-[16px] font-bold text-[#16191f]">Version history</h2>
              <p className="text-[12px] text-[#545b64] mt-0.5">
                Parameter Store maintains an immutable record of each parameter revision.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setTargetVersion(parameter.version);
                setShowLabelModal(true);
              }}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-3.5 rounded transition-colors"
            >
              Manage labels
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] border-collapse">
              <thead>
                <tr className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] font-semibold">
                  <th className="py-2.5 px-3">Version</th>
                  <th className="py-2.5 px-3">Value</th>
                  <th className="py-2.5 px-3">Labels</th>
                  <th className="py-2.5 px-3">Last modified date</th>
                  <th className="py-2.5 px-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded]">
                {historyItems.map((item) => {
                  const isDec = historyDecrypted[item.version];
                  return (
                    <tr key={item.version} className="hover:bg-[#f2f8fd] transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-[#16191f]">
                        v{item.version}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[12px] max-w-xs truncate">
                        {item.type === "SecureString" && !isDec ? (
                          <span className="text-[#545b64]">•••••••• (Encrypted)</span>
                        ) : isDec ? (
                          <span className="text-[#1d8102]">{isDec}</span>
                        ) : (
                          item.value
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {item.labels && item.labels.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {item.labels.map((lbl) => (
                              <span
                                key={lbl}
                                className="bg-[#e9f3f9] text-[#0972d3] border border-[#9ed0f5] px-2 py-0.5 rounded text-[11px] font-semibold"
                              >
                                {lbl}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[#545b64]">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-[#545b64] text-[12px]">
                        {item.lastModifiedDate || "—"}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          {item.type === "SecureString" && !isDec && (
                            <button
                              type="button"
                              onClick={() => handleDecryptHistoryItem(item.version)}
                              className="text-[12px] text-[#0972d3] hover:underline"
                            >
                              Decrypt
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setTargetVersion(item.version);
                              setLabelInput((item.labels || []).join(", "));
                              setShowLabelModal(true);
                            }}
                            className="text-[12px] text-[#0972d3] hover:underline"
                          >
                            Label
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Tags */}
      {activeTab === "tags" && (
        <div className="bg-white border border-[#eaeded] rounded shadow-sm">
          <div className="p-4 border-b border-[#eaeded] flex items-center justify-between">
            <div>
              <h2 className="text-[16px] font-bold text-[#16191f]">Tags</h2>
              <p className="text-[12px] text-[#545b64] mt-0.5">
                Key-value pairs attached to this parameter for organization, billing, or access control.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setModalTags(parameter.tags);
                setShowTagsModal(true);
              }}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-3.5 rounded transition-colors"
            >
              Manage tags
            </button>
          </div>

          {parameter.tags.length === 0 ? (
            <div className="p-8 text-center text-[13px] text-[#545b64]">
              No tags applied to this parameter.
            </div>
          ) : (
            <table className="w-full text-left text-[13px] border-collapse">
              <thead>
                <tr className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] font-semibold">
                  <th className="py-2.5 px-4">Key</th>
                  <th className="py-2.5 px-4">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded]">
                {parameter.tags.map((t, idx) => (
                  <tr key={idx} className="hover:bg-[#fafafa]">
                    <td className="py-2.5 px-4 font-mono font-medium text-[#16191f]">{t.key}</td>
                    <td className="py-2.5 px-4 text-[#545b64]">{t.value || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Manage Labels Modal */}
      {showLabelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">
              Manage labels for version {targetVersion}
            </h3>
            <p className="text-[13px] text-[#545b64]">
              Enter comma-separated labels for version {targetVersion} (e.g.,{" "}
              <code className="bg-[#f2f3f3] px-1 rounded">live, staging, v1.0</code>).
            </p>

            {labelError && (
              <div className="bg-[#fdf3f2] border border-[#d13212] rounded p-2 text-[12px] text-[#d13212]">
                {labelError}
              </div>
            )}

            <div>
              <label className="block text-[13px] font-bold text-[#16191f] mb-1">Labels</label>
              <input
                type="text"
                placeholder="live, prod, current"
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLabelModal(false)}
                disabled={isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-4 rounded transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyLabel}
                disabled={isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] bg-[#ec7211] hover:bg-[#eb5f07] text-white px-4 rounded shadow-sm transition-colors disabled:opacity-50"
              >
                {isPending ? "Applying..." : "Apply labels"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Tags Modal */}
      {showTagsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">Manage tags</h3>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Key"
                value={newTagKey}
                onChange={(e) => setNewTagKey(e.target.value)}
                className="flex-1 border border-[#aab7b8] rounded px-3 py-1 text-[13px] focus:outline-none focus:border-[#ec7211]"
              />
              <input
                type="text"
                placeholder="Value"
                value={newTagVal}
                onChange={(e) => setNewTagVal(e.target.value)}
                className="flex-1 border border-[#aab7b8] rounded px-3 py-1 text-[13px] focus:outline-none focus:border-[#ec7211]"
              />
              <button
                type="button"
                onClick={() => {
                  if (!newTagKey.trim()) return;
                  setModalTags([...modalTags, { key: newTagKey.trim(), value: newTagVal.trim() }]);
                  setNewTagKey("");
                  setNewTagVal("");
                }}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-3 rounded"
              >
                Add
              </button>
            </div>

            <div className="max-h-56 overflow-y-auto border border-[#eaeded] rounded divide-y divide-[#eaeded]">
              {modalTags.length === 0 ? (
                <div className="p-4 text-center text-[12px] text-[#545b64]">No tags added</div>
              ) : (
                modalTags.map((t, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 text-[13px]">
                    <span className="font-mono text-[12px]">
                      <strong>{t.key}</strong>: {t.value || "—"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setModalTags(modalTags.filter((_, i) => i !== idx))}
                      className="text-[#d13212] hover:underline text-[12px]"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowTagsModal(false)}
                disabled={isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-4 rounded transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveTags}
                disabled={isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] bg-[#ec7211] hover:bg-[#eb5f07] text-white px-4 rounded shadow-sm transition-colors disabled:opacity-50"
              >
                {isPending ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">Delete parameter?</h3>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to permanently delete parameter{" "}
              <strong className="text-[#16191f] font-mono">{parameter.name}</strong>? All versions
              and history will be deleted. This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-4 rounded transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] bg-[#d13212] hover:bg-[#a82a0f] text-white px-4 rounded shadow-sm transition-colors disabled:opacity-50"
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
