"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  deleteConfigurationProfileAction,
  createHostedConfigurationVersionAction,
  deleteHostedConfigurationVersionAction,
  getHostedConfigurationVersionAction,
} from "../../../../actions";

interface VersionItem {
  applicationId: string;
  configurationProfileId: string;
  versionNumber: number;
  description: string;
  contentType: string;
  versionLabel?: string;
}

interface EnvironmentItem {
  id: string;
  name: string;
}

interface Props {
  application: {
    id: string;
    name: string;
  };
  profile: {
    id: string;
    applicationId: string;
    name: string;
    description: string;
    locationUri: string;
    retrievalRoleArn: string;
    type: string;
    validators: Array<{ type: string; content: string }>;
  };
  initialVersions: VersionItem[];
  latestContent: string;
  latestContentType: string;
  environments: EnvironmentItem[];
}

export default function ProfileDetailClient({
  application,
  profile,
  initialVersions,
  latestContent,
  latestContentType,
  environments,
}: Props) {
  const router = useRouter();
  const isFeatureFlag = profile.type === "AWS.AppConfig.FeatureFlags";
  const isHosted = profile.locationUri === "hosted";

  const [activeTab, setActiveTab] = useState<"editor" | "versions">("editor");
  const [versions, setVersions] = useState<VersionItem[]>(initialVersions);
  const [editorMode, setEditorMode] = useState<"visual" | "json">("visual");

  // Editor content state
  const [content, setContent] = useState(latestContent || "{}");
  const [contentType, setContentType] = useState(latestContentType || "application/json");
  const [versionDescription, setVersionDescription] = useState("");
  const [savingVersion, setSavingVersion] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Inspected Version Modal
  const [inspectedVersion, setInspectedVersion] = useState<{
    versionNumber: number;
    content: string;
    contentType: string;
  } | null>(null);

  // Delete Profile Modal
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Add Feature Flag Modal
  const [isAddFlagOpen, setIsAddFlagOpen] = useState(false);
  const [newFlagKey, setNewFlagKey] = useState("");
  const [newFlagName, setNewFlagName] = useState("");
  const [newFlagDesc, setNewFlagDesc] = useState("");
  const [newFlagEnabled, setNewFlagEnabled] = useState(false);

  // Parse Feature Flags JSON into structure
  let flagsData: {
    version: string;
    flags: Record<string, { name?: string; description?: string; attributes?: any }>;
    values: Record<string, { enabled?: boolean; [k: string]: any }>;
  } = { version: "1", flags: {}, values: {} };

  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === "object") {
      flagsData = {
        version: parsed.version || "1",
        flags: parsed.flags || {},
        values: parsed.values || {},
      };
    }
  } catch (e) {
    // raw non-json content
  }

  const flagEntries = Object.entries(flagsData.flags || {});

  // Toggle flag enabled
  const handleToggleFlag = (key: string) => {
    const nextValues = { ...flagsData.values };
    const currentEnabled = nextValues[key]?.enabled ?? false;
    nextValues[key] = {
      ...(nextValues[key] || {}),
      enabled: !currentEnabled,
    };
    const updated = {
      ...flagsData,
      values: nextValues,
    };
    setContent(JSON.stringify(updated, null, 2));
  };

  // Add Flag
  const handleAddFlagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFlagKey.trim()) return;
    const cleanKey = newFlagKey.trim().replace(/[^a-zA-Z0-9_-]/g, "");

    const nextFlags = {
      ...flagsData.flags,
      [cleanKey]: {
        name: newFlagName.trim() || cleanKey,
        description: newFlagDesc.trim() || undefined,
        attributes: {},
      },
    };
    const nextValues = {
      ...flagsData.values,
      [cleanKey]: {
        enabled: newFlagEnabled,
      },
    };

    const updated = {
      version: flagsData.version || "1",
      flags: nextFlags,
      values: nextValues,
    };

    setContent(JSON.stringify(updated, null, 2));
    setNewFlagKey("");
    setNewFlagName("");
    setNewFlagDesc("");
    setNewFlagEnabled(false);
    setIsAddFlagOpen(false);
  };

  // Remove Flag
  const handleRemoveFlag = (key: string) => {
    const nextFlags = { ...flagsData.flags };
    delete nextFlags[key];
    const nextValues = { ...flagsData.values };
    delete nextValues[key];

    const updated = {
      ...flagsData,
      flags: nextFlags,
      values: nextValues,
    };
    setContent(JSON.stringify(updated, null, 2));
  };

  // Save new hosted version
  const handleSaveVersion = async () => {
    setSavingVersion(true);
    setSaveError(null);
    setSaveSuccess(null);

    const res = await createHostedConfigurationVersionAction(
      application.id,
      profile.id,
      content,
      contentType,
      versionDescription.trim() || undefined
    );

    setSavingVersion(false);

    if (res.success && res.version) {
      setSaveSuccess(`Version ${res.version.versionNumber} created successfully.`);
      setVersionDescription("");
      setVersions((prev) => [
        {
          applicationId: application.id,
          configurationProfileId: profile.id,
          versionNumber: res.version!.versionNumber,
          description: res.version!.description || "",
          contentType: res.version!.contentType || contentType,
        },
        ...prev,
      ]);
      router.refresh();
      setTimeout(() => setSaveSuccess(null), 5000);
    } else {
      setSaveError(res.error || "Failed to create configuration version.");
    }
  };

  // Delete profile
  const handleDeleteProfile = async () => {
    if (deleteConfirmText.toLowerCase() !== "delete") return;
    setDeleteLoading(true);
    setDeleteError(null);
    const res = await deleteConfigurationProfileAction(application.id, profile.id);
    setDeleteLoading(false);
    if (res.success) {
      router.push(`/appconfig/applications/${application.id}`);
    } else {
      setDeleteError(res.error || "Failed to delete profile.");
    }
  };

  // Inspect version
  const handleInspectVersion = async (verNum: number) => {
    const res = await getHostedConfigurationVersionAction(application.id, profile.id, verNum);
    if (res.success && res.version) {
      setInspectedVersion({
        versionNumber: verNum,
        content: res.version.content || "",
        contentType: res.version.contentType || "application/json",
      });
    }
  };

  // Delete version
  const handleDeleteVersion = async (verNum: number) => {
    if (!confirm(`Delete version ${verNum}?`)) return;
    const res = await deleteHostedConfigurationVersionAction(application.id, profile.id, verNum);
    if (res.success) {
      setVersions((prev) => prev.filter((v) => v.versionNumber !== verNum));
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <nav className="text-[12px] text-[#545b64] flex items-center gap-1.5">
        <Link href="/appconfig/applications" className="hover:text-[#0073bb]">
          Applications
        </Link>
        <span>&rsaquo;</span>
        <Link href={`/appconfig/applications/${application.id}`} className="hover:text-[#0073bb]">
          {application.name}
        </Link>
        <span>&rsaquo;</span>
        <span className="text-[#545b64]">Configuration profiles</span>
        <span>&rsaquo;</span>
        <span className="text-[#16191f]">{profile.name}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#eaeded]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[22px] font-bold text-[#16191f]">{profile.name}</h1>
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                isFeatureFlag ? "bg-[#e8f0fe] text-[#1a73e8]" : "bg-[#f2f3f3] text-[#545b64]"
              }`}
            >
              {isFeatureFlag ? "Feature flag" : "Freeform"}
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#f2f3f3] text-[#545b64] border border-[#eaeded]">
              {profile.id}
            </span>
          </div>
          <p className="text-[13px] text-[#545b64] mt-1">
            {profile.description || "No description provided."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setDeleteConfirmText("");
              setDeleteError(null);
              setIsDeleteOpen(true);
            }}
            className="px-3 text-[13px] font-medium text-[#d13212] bg-white border border-[#d13212] rounded hover:bg-[#fdf2f2]"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Delete
          </button>
          <Link
            href={`/appconfig/applications/${application.id}/deploy?profileId=${profile.id}`}
            className="px-4 text-[13px] font-semibold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded flex items-center justify-center transition-colors shadow-xs"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Deploy
          </Link>
        </div>
      </div>

      {/* Summary Box */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-white border border-[#eaeded] rounded p-4 text-[13px]">
        <div>
          <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
            Configuration location
          </div>
          <div className="font-mono text-[#16191f] mt-1 truncate" title={profile.locationUri}>
            {profile.locationUri}
          </div>
        </div>
        <div>
          <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
            Profile Type
          </div>
          <div className="text-[#16191f] mt-1">{profile.type}</div>
        </div>
        <div>
          <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
            Hosted versions
          </div>
          <div className="text-[#16191f] font-semibold mt-1">{versions.length}</div>
        </div>
        <div>
          <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
            Retrieval Role
          </div>
          <div className="font-mono text-[12px] text-[#545b64] mt-1 truncate">
            {profile.retrievalRoleArn || "None (Hosted)"}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#eaeded] flex items-center gap-8">
        <button
          onClick={() => setActiveTab("editor")}
          className={`pb-3 text-[14px] font-bold transition-colors border-b-2 ${
            activeTab === "editor"
              ? "border-[#0073bb] text-[#0073bb]"
              : "border-transparent text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          {isFeatureFlag ? "Feature flags" : "Configuration data"}
        </button>
        {isHosted && (
          <button
            onClick={() => setActiveTab("versions")}
            className={`pb-3 text-[14px] font-bold transition-colors border-b-2 ${
              activeTab === "versions"
                ? "border-[#0073bb] text-[#0073bb]"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Version history ({versions.length})
          </button>
        )}
      </div>

      {/* Notification Banners */}
      {saveSuccess && (
        <div className="p-3 bg-[#f2f8fd] border border-[#0073bb] text-[#0073bb] rounded text-[13px]">
          {saveSuccess}
        </div>
      )}
      {saveError && (
        <div className="p-3 bg-[#fdf2f2] border border-[#d13212] text-[#d13212] rounded text-[13px]">
          {saveError}
        </div>
      )}

      {/* TAB 1: Editor / Feature Flags Table */}
      {activeTab === "editor" && (
        <div className="space-y-4">
          {/* Feature Flag view modes */}
          {isFeatureFlag && (
            <div className="flex items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditorMode("visual")}
                  className={`px-3 text-[12px] font-medium rounded ${
                    editorMode === "visual"
                      ? "bg-[#0073bb] text-white"
                      : "bg-[#f2f3f3] text-[#16191f] hover:bg-[#eaeded]"
                  }`}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  Table view
                </button>
                <button
                  type="button"
                  onClick={() => setEditorMode("json")}
                  className={`px-3 text-[12px] font-medium rounded ${
                    editorMode === "json"
                      ? "bg-[#0073bb] text-white"
                      : "bg-[#f2f3f3] text-[#16191f] hover:bg-[#eaeded]"
                  }`}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  JSON editor
                </button>
              </div>

              {editorMode === "visual" && (
                <button
                  type="button"
                  onClick={() => setIsAddFlagOpen(true)}
                  className="px-3 text-[13px] font-semibold text-white bg-[#0073bb] hover:bg-[#005f9e] rounded flex items-center justify-center transition-colors"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  Add feature flag
                </button>
              )}
            </div>
          )}

          {/* VISUAL TABLE VIEW (For Feature Flags) */}
          {isFeatureFlag && editorMode === "visual" && (
            <div className="bg-white border border-[#eaeded] rounded shadow-xs overflow-hidden">
              {flagEntries.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="text-[14px] font-semibold text-[#16191f]">No feature flags defined</div>
                  <p className="text-[13px] text-[#545b64] mt-1">
                    Click "Add feature flag" to create your first dynamic feature toggle.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsAddFlagOpen(true)}
                    className="mt-4 px-4 text-[13px] font-semibold text-white bg-[#0073bb] hover:bg-[#005f9e] rounded inline-flex items-center justify-center"
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  >
                    Add feature flag
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[13px]">
                    <thead>
                      <tr className="border-b border-[#eaeded] bg-[#fafafa] text-[#545b64] text-[11px] font-semibold uppercase tracking-wider">
                        <th className="py-2.5 px-4">Flag name</th>
                        <th className="py-2.5 px-4">Key</th>
                        <th className="py-2.5 px-4">State</th>
                        <th className="py-2.5 px-4">Description</th>
                        <th className="py-2.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eaeded]">
                      {flagEntries.map(([key, flag]) => {
                        const isEnabled = flagsData.values[key]?.enabled ?? false;
                        return (
                          <tr key={key} className="hover:bg-[#fafafa]">
                            <td className="py-3 px-4 font-bold text-[#16191f]">
                              {flag.name || key}
                            </td>
                            <td className="py-3 px-4 font-mono text-[12px] text-[#545b64]">
                              {key}
                            </td>
                            <td className="py-3 px-4">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isEnabled}
                                  onChange={() => handleToggleFlag(key)}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-[#eaeded] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#aab7b8] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1d8102]"></div>
                                <span className={`ml-2 text-[12px] font-semibold ${isEnabled ? "text-[#1d8102]" : "text-[#545b64]"}`}>
                                  {isEnabled ? "Enabled" : "Disabled"}
                                </span>
                              </label>
                            </td>
                            <td className="py-3 px-4 text-[#545b64]">
                              {flag.description || "-"}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveFlag(key)}
                                className="text-[12px] font-medium text-[#d13212] hover:underline"
                              >
                                Delete flag
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* RAW JSON / FREEFORM EDITOR */}
          {(!isFeatureFlag || editorMode === "json") && (
            <div className="bg-white border border-[#eaeded] rounded p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[14px] font-bold text-[#16191f]">
                    {isFeatureFlag ? "Feature Flags JSON schema" : "Configuration data payload"}
                  </h3>
                  <p className="text-[12px] text-[#545b64] mt-0.5">
                    Edit the configuration content below. Save as a new version to deploy changes.
                  </p>
                </div>
                {!isFeatureFlag && (
                  <div className="flex items-center gap-2">
                    <label className="text-[12px] text-[#545b64]">Content type:</label>
                    <select
                      value={contentType}
                      onChange={(e) => setContentType(e.target.value)}
                      className="px-2 py-1 text-[12px] border border-[#aab7b8] rounded bg-white"
                    >
                      <option value="application/json">application/json</option>
                      <option value="application/x-yaml">application/x-yaml</option>
                      <option value="text/plain">text/plain</option>
                    </select>
                  </div>
                )}
              </div>

              <textarea
                rows={16}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full p-4 font-mono text-[12px] bg-[#fafafa] border border-[#aab7b8] rounded focus:outline-none focus:border-[#0073bb] text-[#16191f]"
              />
            </div>
          )}

          {/* Save Version Footer (for hosted configurations) */}
          {isHosted && (
            <div className="bg-white border border-[#eaeded] rounded p-4 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Version description (e.g. Updated checkout flags for release 2.4)"
                  value={versionDescription}
                  onChange={(e) => setVersionDescription(e.target.value)}
                  className="w-full px-3 py-1.5 text-[12px] border border-[#aab7b8] rounded focus:outline-none focus:border-[#0073bb]"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveVersion}
                  disabled={savingVersion || !content.trim()}
                  className="px-4 text-[13px] font-semibold text-white bg-[#0073bb] hover:bg-[#005f9e] rounded disabled:opacity-40 flex items-center justify-center transition-colors"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  {savingVersion ? "Saving version..." : "Save as new version"}
                </button>
                <Link
                  href={`/appconfig/applications/${application.id}/deploy?profileId=${profile.id}`}
                  className="px-4 text-[13px] font-semibold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded flex items-center justify-center transition-colors shadow-xs"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  Deploy
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Version History */}
      {activeTab === "versions" && isHosted && (
        <div className="space-y-4">
          <div className="bg-white border border-[#eaeded] rounded shadow-xs overflow-hidden">
            {versions.length === 0 ? (
              <div className="p-8 text-center text-[#545b64]">
                <p className="text-[13px] font-medium text-[#16191f]">No hosted versions found</p>
                <p className="text-[12px] mt-1">
                  Save a configuration in the editor tab to create version 1.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-[#eaeded] bg-[#fafafa] text-[#545b64] text-[11px] font-semibold uppercase tracking-wider">
                      <th className="py-2.5 px-4">Version</th>
                      <th className="py-2.5 px-4">Content Type</th>
                      <th className="py-2.5 px-4">Description</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eaeded]">
                    {versions.map((v) => (
                      <tr key={v.versionNumber} className="hover:bg-[#fafafa]">
                        <td className="py-2.5 px-4 font-bold text-[#16191f]">
                          v{v.versionNumber}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-[12px] text-[#545b64]">
                          {v.contentType}
                        </td>
                        <td className="py-2.5 px-4 text-[#545b64]">
                          {v.description || "-"}
                        </td>
                        <td className="py-2.5 px-4 text-right space-x-3">
                          <button
                            type="button"
                            onClick={() => handleInspectVersion(v.versionNumber)}
                            className="text-[12px] font-medium text-[#0073bb] hover:underline"
                          >
                            View content
                          </button>
                          <Link
                            href={`/appconfig/applications/${application.id}/deploy?profileId=${profile.id}&version=${v.versionNumber}`}
                            className="text-[12px] font-semibold text-[#ec7211] hover:underline"
                          >
                            Deploy version
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDeleteVersion(v.versionNumber)}
                            className="text-[12px] font-medium text-[#d13212] hover:underline"
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
        </div>
      )}

      {/* Add Feature Flag Modal */}
      {isAddFlagOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded border border-[#eaeded] shadow-lg max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#eaeded]">
              <h3 className="text-[16px] font-bold text-[#16191f]">Add feature flag</h3>
              <button onClick={() => setIsAddFlagOpen(false)} className="text-[#545b64] hover:text-[#16191f]">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddFlagSubmit} className="space-y-4">
              <div>
                <label className="block text-[13px] font-bold text-[#16191f] mb-1">
                  Flag name <span className="text-[#d13212]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dark Mode Theme"
                  value={newFlagName}
                  onChange={(e) => {
                    setNewFlagName(e.target.value);
                    if (!newFlagKey) {
                      setNewFlagKey(
                        e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "")
                      );
                    }
                  }}
                  className="w-full px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded focus:outline-none focus:border-[#0073bb]"
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-[#16191f] mb-1">
                  Flag key <span className="text-[#d13212]">*</span>
                </label>
                <p className="text-[11px] text-[#545b64] mb-1">
                  Identifier queried by application code (letters, numbers, hyphens, underscores).
                </p>
                <input
                  type="text"
                  required
                  placeholder="e.g. darkModeTheme"
                  value={newFlagKey}
                  onChange={(e) => setNewFlagKey(e.target.value)}
                  className="w-full px-3 py-1.5 text-[13px] font-mono border border-[#aab7b8] rounded focus:outline-none focus:border-[#0073bb]"
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-[#16191f] mb-1">
                  Description <span className="text-[12px] font-normal text-[#545b64]">- optional</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Toggles dark mode styling in the web client"
                  value={newFlagDesc}
                  onChange={(e) => setNewFlagDesc(e.target.value)}
                  className="w-full px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded focus:outline-none focus:border-[#0073bb]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="flag-enabled"
                  checked={newFlagEnabled}
                  onChange={(e) => setNewFlagEnabled(e.target.checked)}
                  className="h-4 w-4 text-[#0073bb] border-[#aab7b8] rounded"
                />
                <label htmlFor="flag-enabled" className="text-[13px] font-medium text-[#16191f] cursor-pointer">
                  Enable flag by default
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#eaeded]">
                <button
                  type="button"
                  onClick={() => setIsAddFlagOpen(false)}
                  className="px-3 text-[13px] font-medium text-[#16191f] bg-white border border-[#aab7b8] rounded hover:bg-[#fafafa]"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newFlagKey.trim()}
                  className="px-4 text-[13px] font-semibold text-white bg-[#0073bb] hover:bg-[#005f9e] rounded disabled:opacity-40"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  Add flag
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Version Modal */}
      {inspectedVersion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded border border-[#eaeded] shadow-lg max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#eaeded]">
              <div>
                <h3 className="text-[16px] font-bold text-[#16191f]">
                  Version {inspectedVersion.versionNumber} payload
                </h3>
                <span className="text-[11px] text-[#545b64]">
                  Content-Type: {inspectedVersion.contentType}
                </span>
              </div>
              <button
                onClick={() => setInspectedVersion(null)}
                className="text-[#545b64] hover:text-[#16191f]"
              >
                ✕
              </button>
            </div>
            <pre className="p-4 bg-[#16191f] text-[#34d399] font-mono text-[12px] rounded overflow-x-auto max-h-96">
              {inspectedVersion.content}
            </pre>
            <div className="flex justify-end pt-2 border-t border-[#eaeded]">
              <button
                onClick={() => setInspectedVersion(null)}
                className="px-4 text-[13px] font-medium text-[#16191f] bg-white border border-[#aab7b8] rounded hover:bg-[#fafafa]"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Profile Modal */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded border border-[#eaeded] shadow-lg max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#eaeded]">
              <h3 className="text-[16px] font-bold text-[#16191f]">Delete profile</h3>
              <button onClick={() => setIsDeleteOpen(false)} className="text-[#545b64] hover:text-[#16191f]">
                ✕
              </button>
            </div>
            <p className="text-[13px] text-[#16191f]">
              Are you sure you want to delete configuration profile <strong>{profile.name}</strong>?
            </p>
            {deleteError && (
              <div className="p-3 bg-[#fdf2f2] border border-[#d13212] rounded text-[13px] text-[#d13212]">
                {deleteError}
              </div>
            )}
            <div>
              <label className="block text-[12px] font-medium text-[#545b64] mb-1">
                To confirm deletion, type <code className="text-[#d13212] font-mono">delete</code>:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="delete"
                className="w-full px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded focus:outline-none focus:border-[#0073bb]"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#eaeded]">
              <button
                onClick={() => setIsDeleteOpen(false)}
                className="px-3 text-[13px] font-medium text-[#16191f] bg-white border border-[#aab7b8] rounded hover:bg-[#fafafa]"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProfile}
                disabled={deleteLoading || deleteConfirmText.toLowerCase() !== "delete"}
                className="px-4 text-[13px] font-semibold text-white bg-[#d13212] hover:bg-[#b02a0f] rounded disabled:opacity-40"
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
