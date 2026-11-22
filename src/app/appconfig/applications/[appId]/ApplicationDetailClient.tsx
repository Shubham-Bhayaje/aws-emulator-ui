"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  deleteApplicationAction,
  deleteEnvironmentAction,
  deleteConfigurationProfileAction,
  updateApplicationAction,
} from "../../actions";

interface EnvironmentItem {
  id: string;
  applicationId: string;
  name: string;
  description: string;
  state: string;
  monitors: Array<{ alarmArn: string; alarmRoleArn?: string }>;
}

interface ProfileItem {
  id: string;
  applicationId: string;
  name: string;
  locationUri: string;
  type: string;
}

interface ApplicationDetailProps {
  application: {
    id: string;
    name: string;
    description: string;
  };
  initialEnvironments: EnvironmentItem[];
  initialProfiles: ProfileItem[];
}

export default function ApplicationDetailClient({
  application,
  initialEnvironments,
  initialProfiles,
}: ApplicationDetailProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"profiles" | "environments">("profiles");

  // Environments state
  const [environments, setEnvironments] = useState<EnvironmentItem[]>(initialEnvironments);
  const [selectedEnvId, setSelectedEnvId] = useState<string | null>(null);
  const [envSearch, setEnvSearch] = useState("");

  // Profiles state
  const [profiles, setProfiles] = useState<ProfileItem[]>(initialProfiles);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [profileSearch, setProfileSearch] = useState("");

  // Edit App modal
  const [isEditAppOpen, setIsEditAppOpen] = useState(false);
  const [editName, setEditName] = useState(application.name);
  const [editDesc, setEditDesc] = useState(application.description);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete App modal
  const [isDeleteAppOpen, setIsDeleteAppOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Delete Env modal
  const [isDeleteEnvOpen, setIsDeleteEnvOpen] = useState(false);
  const [deleteEnvConfirmText, setDeleteEnvConfirmText] = useState("");
  const [deleteEnvLoading, setDeleteEnvLoading] = useState(false);
  const [deleteEnvError, setDeleteEnvError] = useState<string | null>(null);

  // Delete Profile modal
  const [isDeleteProfOpen, setIsDeleteProfOpen] = useState(false);
  const [deleteProfConfirmText, setDeleteProfConfirmText] = useState("");
  const [deleteProfLoading, setDeleteProfLoading] = useState(false);
  const [deleteProfError, setDeleteProfError] = useState<string | null>(null);

  // Filtered lists
  const filteredProfiles = profiles.filter((p) => {
    const q = profileSearch.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
  });

  const filteredEnvironments = environments.filter((e) => {
    const q = envSearch.toLowerCase();
    return e.name.toLowerCase().includes(q) || e.id.toLowerCase().includes(q);
  });

  const selectedEnv = environments.find((e) => e.id === selectedEnvId);
  const selectedProfile = profiles.find((p) => p.id === selectedProfileId);

  // Edit App
  const handleEditApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    setEditLoading(true);
    setEditError(null);
    const res = await updateApplicationAction(application.id, editName.trim(), editDesc.trim());
    setEditLoading(false);
    if (res.success) {
      setIsEditAppOpen(false);
      router.refresh();
    } else {
      setEditError(res.error || "Failed to update application.");
    }
  };

  // Delete App
  const handleDeleteApp = async () => {
    if (deleteConfirmText.toLowerCase() !== "delete") return;
    setDeleteLoading(true);
    setDeleteError(null);
    const res = await deleteApplicationAction(application.id);
    setDeleteLoading(false);
    if (res.success) {
      router.push("/appconfig/applications");
    } else {
      setDeleteError(res.error || "Failed to delete application.");
    }
  };

  // Delete Environment
  const handleDeleteEnv = async () => {
    if (!selectedEnvId || deleteEnvConfirmText.toLowerCase() !== "delete") return;
    setDeleteEnvLoading(true);
    setDeleteEnvError(null);
    const res = await deleteEnvironmentAction(application.id, selectedEnvId);
    setDeleteEnvLoading(false);
    if (res.success) {
      setEnvironments((prev) => prev.filter((e) => e.id !== selectedEnvId));
      setSelectedEnvId(null);
      setIsDeleteEnvOpen(false);
      setDeleteEnvConfirmText("");
      router.refresh();
    } else {
      setDeleteEnvError(res.error || "Failed to delete environment.");
    }
  };

  // Delete Profile
  const handleDeleteProfile = async () => {
    if (!selectedProfileId || deleteProfConfirmText.toLowerCase() !== "delete") return;
    setDeleteProfLoading(true);
    setDeleteProfError(null);
    const res = await deleteConfigurationProfileAction(application.id, selectedProfileId);
    setDeleteProfLoading(false);
    if (res.success) {
      setProfiles((prev) => prev.filter((p) => p.id !== selectedProfileId));
      setSelectedProfileId(null);
      setIsDeleteProfOpen(false);
      setDeleteProfConfirmText("");
      router.refresh();
    } else {
      setDeleteProfError(res.error || "Failed to delete configuration profile.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="text-[12px] text-[#545b64] flex items-center gap-1.5">
        <Link href="/appconfig/applications" className="hover:text-[#0073bb]">
          Applications
        </Link>
        <span>&rsaquo;</span>
        <span className="text-[#16191f]">{application.name}</span>
      </nav>

      {/* Header and top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#eaeded]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[22px] font-bold text-[#16191f]">{application.name}</h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#f2f3f3] text-[#545b64] border border-[#eaeded]">
              {application.id}
            </span>
          </div>
          <p className="text-[13px] text-[#545b64] mt-1">
            {application.description || "No description provided."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditName(application.name);
              setEditDesc(application.description);
              setEditError(null);
              setIsEditAppOpen(true);
            }}
            className="px-3 text-[13px] font-medium text-[#16191f] bg-white border border-[#aab7b8] rounded hover:bg-[#fafafa]"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Edit
          </button>
          <button
            onClick={() => {
              setDeleteConfirmText("");
              setDeleteError(null);
              setIsDeleteAppOpen(true);
            }}
            className="px-3 text-[13px] font-medium text-[#d13212] bg-white border border-[#d13212] rounded hover:bg-[#fdf2f2]"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Delete
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#eaeded] flex items-center gap-8">
        <button
          onClick={() => setActiveTab("profiles")}
          className={`pb-3 text-[14px] font-bold transition-colors border-b-2 ${
            activeTab === "profiles"
              ? "border-[#0073bb] text-[#0073bb]"
              : "border-transparent text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          Configuration profiles and feature flags ({profiles.length})
        </button>
        <button
          onClick={() => setActiveTab("environments")}
          className={`pb-3 text-[14px] font-bold transition-colors border-b-2 ${
            activeTab === "environments"
              ? "border-[#0073bb] text-[#0073bb]"
              : "border-transparent text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          Environments ({environments.length})
        </button>
      </div>

      {/* TAB 1: Configuration Profiles & Feature Flags */}
      {activeTab === "profiles" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-[16px] font-bold text-[#16191f]">
                Configuration profiles and feature flags
              </h2>
              <p className="text-[12px] text-[#545b64]">
                A configuration profile can be a feature flag configuration or a freeform configuration stored in AWS AppConfig, Systems Manager, Secrets Manager, or Amazon S3.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={
                  selectedProfileId
                    ? `/appconfig/applications/${application.id}/configuration-profiles/${selectedProfileId}`
                    : "#"
                }
                aria-disabled={!selectedProfileId}
                className={`px-3 text-[13px] font-medium border rounded flex items-center justify-center transition-colors ${
                  selectedProfileId
                    ? "text-[#16191f] bg-white border-[#aab7b8] hover:bg-[#fafafa]"
                    : "text-[#879596] bg-[#f2f3f3] border-[#eaeded] pointer-events-none opacity-60"
                }`}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                View details
              </Link>
              <button
                onClick={() => {
                  setDeleteProfConfirmText("");
                  setDeleteProfError(null);
                  setIsDeleteProfOpen(true);
                }}
                disabled={!selectedProfileId}
                className="px-3 text-[13px] font-medium text-[#d13212] bg-white border border-[#d13212] rounded hover:bg-[#fdf2f2] disabled:opacity-40"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Delete
              </button>
              <Link
                href={`/appconfig/applications/${application.id}/configuration-profiles/create?type=flags`}
                className="px-3 text-[13px] font-semibold text-white bg-[#0073bb] hover:bg-[#005f9e] rounded flex items-center justify-center"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Create feature flag
              </Link>
              <Link
                href={`/appconfig/applications/${application.id}/configuration-profiles/create?type=freeform`}
                className="px-3 text-[13px] font-semibold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded flex items-center justify-center"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Create freeform profile
              </Link>
            </div>
          </div>

          <div className="bg-white border border-[#eaeded] rounded shadow-xs">
            <div className="p-3 border-b border-[#eaeded] flex items-center justify-between">
              <input
                type="text"
                placeholder="Find profiles"
                value={profileSearch}
                onChange={(e) => setProfileSearch(e.target.value)}
                className="w-72 px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded focus:outline-none focus:border-[#0073bb]"
              />
              <span className="text-[12px] text-[#545b64]">
                {filteredProfiles.length} of {profiles.length} profiles
              </span>
            </div>

            {filteredProfiles.length === 0 ? (
              <div className="p-8 text-center text-[#545b64]">
                <p className="text-[13px] font-medium text-[#16191f]">No configuration profiles</p>
                <p className="text-[12px] mt-1">
                  Create a feature flag or freeform configuration profile to deploy configuration data to this application.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-[#eaeded] bg-[#fafafa] text-[#545b64] text-[11px] font-semibold uppercase tracking-wider">
                      <th className="py-2.5 px-4 w-10"></th>
                      <th className="py-2.5 px-4">Name</th>
                      <th className="py-2.5 px-4">Type</th>
                      <th className="py-2.5 px-4">Location</th>
                      <th className="py-2.5 px-4">Profile ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eaeded]">
                    {filteredProfiles.map((p) => {
                      const isSelected = selectedProfileId === p.id;
                      const isFeatureFlag = p.type === "AWS.AppConfig.FeatureFlags";
                      return (
                        <tr
                          key={p.id}
                          onClick={() => setSelectedProfileId(isSelected ? null : p.id)}
                          className={`cursor-pointer ${isSelected ? "bg-[#f2f8fd]" : "hover:bg-[#fafafa]"}`}
                        >
                          <td className="py-2.5 px-4">
                            <input
                              type="radio"
                              name="selected-profile"
                              checked={isSelected}
                              onChange={() => setSelectedProfileId(p.id)}
                              className="h-3.5 w-3.5 text-[#0073bb] border-[#aab7b8]"
                            />
                          </td>
                          <td className="py-2.5 px-4 font-medium">
                            <Link
                              href={`/appconfig/applications/${application.id}/configuration-profiles/${p.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-[#0073bb] hover:underline"
                            >
                              {p.name}
                            </Link>
                          </td>
                          <td className="py-2.5 px-4">
                            {isFeatureFlag ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#e8f0fe] text-[#1a73e8]">
                                Feature flag
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#f2f3f3] text-[#545b64]">
                                Freeform
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 font-mono text-[12px] text-[#545b64]">
                            {p.locationUri}
                          </td>
                          <td className="py-2.5 px-4 font-mono text-[12px] text-[#545b64]">
                            {p.id}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Environments */}
      {activeTab === "environments" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-[16px] font-bold text-[#16191f]">Environments</h2>
              <p className="text-[12px] text-[#545b64]">
                An environment is a deployment target, such as Production, Beta, or Development.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={
                  selectedEnvId
                    ? `/appconfig/applications/${application.id}/environments/${selectedEnvId}`
                    : "#"
                }
                aria-disabled={!selectedEnvId}
                className={`px-3 text-[13px] font-medium border rounded flex items-center justify-center transition-colors ${
                  selectedEnvId
                    ? "text-[#16191f] bg-white border-[#aab7b8] hover:bg-[#fafafa]"
                    : "text-[#879596] bg-[#f2f3f3] border-[#eaeded] pointer-events-none opacity-60"
                }`}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                View details
              </Link>
              <button
                onClick={() => {
                  setDeleteEnvConfirmText("");
                  setDeleteEnvError(null);
                  setIsDeleteEnvOpen(true);
                }}
                disabled={!selectedEnvId}
                className="px-3 text-[13px] font-medium text-[#d13212] bg-white border border-[#d13212] rounded hover:bg-[#fdf2f2] disabled:opacity-40"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Delete
              </button>
              <Link
                href={`/appconfig/applications/${application.id}/environments/create`}
                className="px-4 text-[13px] font-semibold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded flex items-center justify-center"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Create environment
              </Link>
            </div>
          </div>

          <div className="bg-white border border-[#eaeded] rounded shadow-xs">
            <div className="p-3 border-b border-[#eaeded] flex items-center justify-between">
              <input
                type="text"
                placeholder="Find environments"
                value={envSearch}
                onChange={(e) => setEnvSearch(e.target.value)}
                className="w-72 px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded focus:outline-none focus:border-[#0073bb]"
              />
              <span className="text-[12px] text-[#545b64]">
                {filteredEnvironments.length} of {environments.length} environments
              </span>
            </div>

            {filteredEnvironments.length === 0 ? (
              <div className="p-8 text-center text-[#545b64]">
                <p className="text-[13px] font-medium text-[#16191f]">No environments</p>
                <p className="text-[12px] mt-1">
                  Create an environment to deploy configuration profiles to your targets.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-[#eaeded] bg-[#fafafa] text-[#545b64] text-[11px] font-semibold uppercase tracking-wider">
                      <th className="py-2.5 px-4 w-10"></th>
                      <th className="py-2.5 px-4">Name</th>
                      <th className="py-2.5 px-4">Environment ID</th>
                      <th className="py-2.5 px-4">State</th>
                      <th className="py-2.5 px-4">Monitors</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eaeded]">
                    {filteredEnvironments.map((env) => {
                      const isSelected = selectedEnvId === env.id;
                      return (
                        <tr
                          key={env.id}
                          onClick={() => setSelectedEnvId(isSelected ? null : env.id)}
                          className={`cursor-pointer ${isSelected ? "bg-[#f2f8fd]" : "hover:bg-[#fafafa]"}`}
                        >
                          <td className="py-2.5 px-4">
                            <input
                              type="radio"
                              name="selected-env"
                              checked={isSelected}
                              onChange={() => setSelectedEnvId(env.id)}
                              className="h-3.5 w-3.5 text-[#0073bb] border-[#aab7b8]"
                            />
                          </td>
                          <td className="py-2.5 px-4 font-medium">
                            <Link
                              href={`/appconfig/applications/${application.id}/environments/${env.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-[#0073bb] hover:underline"
                            >
                              {env.name}
                            </Link>
                          </td>
                          <td className="py-2.5 px-4 font-mono text-[12px] text-[#545b64]">
                            {env.id}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#e6f4ea] text-[#137333]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#137333]" />
                              Ready for deployment
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-[#545b64]">
                            {env.monitors.length} CloudWatch alarm{env.monitors.length === 1 ? "" : "s"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit App Modal */}
      {isEditAppOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded border border-[#eaeded] shadow-lg max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#eaeded]">
              <h3 className="text-[16px] font-bold text-[#16191f]">Edit application</h3>
              <button onClick={() => setIsEditAppOpen(false)} className="text-[#545b64] hover:text-[#16191f]">
                ✕
              </button>
            </div>
            {editError && (
              <div className="p-3 bg-[#fdf2f2] border border-[#d13212] rounded text-[13px] text-[#d13212]">
                {editError}
              </div>
            )}
            <form onSubmit={handleEditApp} className="space-y-4">
              <div>
                <label className="block text-[13px] font-bold text-[#16191f] mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded focus:outline-none focus:border-[#0073bb]"
                />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-[#16191f] mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded focus:outline-none focus:border-[#0073bb]"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#eaeded]">
                <button
                  type="button"
                  onClick={() => setIsEditAppOpen(false)}
                  className="px-3 text-[13px] font-medium text-[#16191f] bg-white border border-[#aab7b8] rounded hover:bg-[#fafafa]"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading || !editName.trim()}
                  className="px-4 text-[13px] font-semibold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded disabled:opacity-40"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  {editLoading ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete App Modal */}
      {isDeleteAppOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded border border-[#eaeded] shadow-lg max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#eaeded]">
              <h3 className="text-[16px] font-bold text-[#16191f]">Delete application</h3>
              <button onClick={() => setIsDeleteAppOpen(false)} className="text-[#545b64] hover:text-[#16191f]">
                ✕
              </button>
            </div>
            <p className="text-[13px] text-[#16191f]">
              Are you sure you want to delete application <strong>{application.name}</strong>? This cannot be undone.
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
                onClick={() => setIsDeleteAppOpen(false)}
                className="px-3 text-[13px] font-medium text-[#16191f] bg-white border border-[#aab7b8] rounded hover:bg-[#fafafa]"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteApp}
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

      {/* Delete Env Modal */}
      {isDeleteEnvOpen && selectedEnv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded border border-[#eaeded] shadow-lg max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#eaeded]">
              <h3 className="text-[16px] font-bold text-[#16191f]">Delete environment</h3>
              <button onClick={() => setIsDeleteEnvOpen(false)} className="text-[#545b64] hover:text-[#16191f]">
                ✕
              </button>
            </div>
            <p className="text-[13px] text-[#16191f]">
              Are you sure you want to delete environment <strong>{selectedEnv.name}</strong> ({selectedEnv.id})?
            </p>
            {deleteEnvError && (
              <div className="p-3 bg-[#fdf2f2] border border-[#d13212] rounded text-[13px] text-[#d13212]">
                {deleteEnvError}
              </div>
            )}
            <div>
              <label className="block text-[12px] font-medium text-[#545b64] mb-1">
                To confirm deletion, type <code className="text-[#d13212] font-mono">delete</code>:
              </label>
              <input
                type="text"
                value={deleteEnvConfirmText}
                onChange={(e) => setDeleteEnvConfirmText(e.target.value)}
                placeholder="delete"
                className="w-full px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded focus:outline-none focus:border-[#0073bb]"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#eaeded]">
              <button
                onClick={() => setIsDeleteEnvOpen(false)}
                className="px-3 text-[13px] font-medium text-[#16191f] bg-white border border-[#aab7b8] rounded hover:bg-[#fafafa]"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteEnv}
                disabled={deleteEnvLoading || deleteEnvConfirmText.toLowerCase() !== "delete"}
                className="px-4 text-[13px] font-semibold text-white bg-[#d13212] hover:bg-[#b02a0f] rounded disabled:opacity-40"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                {deleteEnvLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Profile Modal */}
      {isDeleteProfOpen && selectedProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded border border-[#eaeded] shadow-lg max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#eaeded]">
              <h3 className="text-[16px] font-bold text-[#16191f]">Delete configuration profile</h3>
              <button onClick={() => setIsDeleteProfOpen(false)} className="text-[#545b64] hover:text-[#16191f]">
                ✕
              </button>
            </div>
            <p className="text-[13px] text-[#16191f]">
              Are you sure you want to delete profile <strong>{selectedProfile.name}</strong> ({selectedProfile.id})? All hosted versions will be deleted.
            </p>
            {deleteProfError && (
              <div className="p-3 bg-[#fdf2f2] border border-[#d13212] rounded text-[13px] text-[#d13212]">
                {deleteProfError}
              </div>
            )}
            <div>
              <label className="block text-[12px] font-medium text-[#545b64] mb-1">
                To confirm deletion, type <code className="text-[#d13212] font-mono">delete</code>:
              </label>
              <input
                type="text"
                value={deleteProfConfirmText}
                onChange={(e) => setDeleteProfConfirmText(e.target.value)}
                placeholder="delete"
                className="w-full px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded focus:outline-none focus:border-[#0073bb]"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#eaeded]">
              <button
                onClick={() => setIsDeleteProfOpen(false)}
                className="px-3 text-[13px] font-medium text-[#16191f] bg-white border border-[#aab7b8] rounded hover:bg-[#fafafa]"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProfile}
                disabled={deleteProfLoading || deleteProfConfirmText.toLowerCase() !== "delete"}
                className="px-4 text-[13px] font-semibold text-white bg-[#d13212] hover:bg-[#b02a0f] rounded disabled:opacity-40"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                {deleteProfLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
