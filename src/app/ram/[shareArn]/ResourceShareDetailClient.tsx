"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  RAMResourceShare,
  RAMResource,
  RAMPrincipal,
  RAMPermission,
  RAMTag,
  AvailableShareableResource,
} from "../types";
import {
  deleteResourceShareAction,
  updateResourceShareAction,
  associateResourcesAction,
  disassociateResourcesAction,
  associatePrincipalsAction,
  disassociatePrincipalsAction,
  tagResourceShareAction,
  untagResourceShareAction,
  fetchPermissionDetail,
} from "../actions";
import { formatRAMDate } from "../dateUtils";

interface ResourceShareDetailClientProps {
  share: RAMResourceShare;
  initialResources: RAMResource[];
  initialPrincipals: RAMPrincipal[];
  initialPermissions: RAMPermission[];
  initialTags: RAMTag[];
  availableResources: AvailableShareableResource[];
}

export default function ResourceShareDetailClient({
  share: initialShare,
  initialResources,
  initialPrincipals,
  initialPermissions,
  initialTags,
  availableResources,
}: ResourceShareDetailClientProps) {
  const router = useRouter();
  const [share, setShare] = useState<RAMResourceShare>(initialShare);
  const [resources, setResources] = useState<RAMResource[]>(initialResources);
  const [principals, setPrincipals] = useState<RAMPrincipal[]>(initialPrincipals);
  const [permissions] = useState<RAMPermission[]>(initialPermissions);
  const [tags, setTags] = useState<RAMTag[]>(initialTags);

  const [activeTab, setActiveTab] = useState<"resources" | "principals" | "permissions" | "tags">("resources");

  // Selection states
  const [selectedResourceArns, setSelectedResourceArns] = useState<string[]>([]);
  const [selectedPrincipalIds, setSelectedPrincipalIds] = useState<string[]>([]);

  // Modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(share.name);
  const [editAllowExternal, setEditAllowExternal] = useState(share.allowExternalPrincipals);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Associate Resources Modal
  const [showAssociateResModal, setShowAssociateResModal] = useState(false);
  const [selectedNewResourceArns, setSelectedNewResourceArns] = useState<string[]>([]);
  const [isAssociatingRes, setIsAssociatingRes] = useState(false);

  // Associate Principals Modal
  const [showAssociatePrinModal, setShowAssociatePrinModal] = useState(false);
  const [newPrincipalId, setNewPrincipalId] = useState("");
  const [newPrincipalError, setNewPrincipalError] = useState("");
  const [isAssociatingPrin, setIsAssociatingPrin] = useState(false);

  // Manage Tags Modal
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [editableTags, setEditableTags] = useState<RAMTag[]>(tags);
  const [isSavingTags, setIsSavingTags] = useState(false);

  // Permission inspector modal
  const [inspectingPerm, setInspectingPerm] = useState<RAMPermission | null>(null);
  const [inspectingLoading, setInspectingLoading] = useState(false);

  // Notifications
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Delete Share
  const handleDeleteShare = async () => {
    setIsDeleting(true);
    setBanner(null);
    try {
      const res = await deleteResourceShareAction(share.arn);
      if (res.success) {
        router.push("/ram");
        router.refresh();
      } else {
        setBanner({ type: "error", message: res.error || "Failed to delete resource share." });
        setIsDeleting(false);
        setShowDeleteModal(false);
      }
    } catch (e: any) {
      setBanner({ type: "error", message: e.message || "An error occurred." });
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // Save Edit
  const handleSaveEdit = async () => {
    if (!editName.trim()) return;
    setIsSavingEdit(true);
    setBanner(null);
    try {
      const res = await updateResourceShareAction(share.arn, editName.trim(), editAllowExternal);
      if (res.success) {
        setShare({ ...share, name: editName.trim(), allowExternalPrincipals: editAllowExternal });
        setShowEditModal(false);
        setBanner({ type: "success", message: "Resource share updated successfully." });
      } else {
        setBanner({ type: "error", message: res.error || "Failed to update resource share." });
      }
    } catch (e: any) {
      setBanner({ type: "error", message: e.message || "An error occurred." });
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Associate Resources
  const handleAssociateResources = async () => {
    if (selectedNewResourceArns.length === 0) return;
    setIsAssociatingRes(true);
    setBanner(null);
    try {
      const res = await associateResourcesAction(share.arn, selectedNewResourceArns);
      if (res.success) {
        const newlyAdded: RAMResource[] = selectedNewResourceArns.map((arn) => {
          const avail = availableResources.find((r) => r.arn === arn);
          return {
            arn,
            type: avail?.type || "AWS Resource",
            resourceShareArn: share.arn,
            resourceShareName: share.name,
            status: "ASSOCIATED",
            lastUpdatedTime: new Date().toISOString(),
          };
        });
        setResources((prev) => [...prev, ...newlyAdded]);
        setSelectedNewResourceArns([]);
        setShowAssociateResModal(false);
        setBanner({ type: "success", message: "Resources associated successfully." });
      } else {
        setBanner({ type: "error", message: res.error || "Failed to associate resources." });
      }
    } catch (e: any) {
      setBanner({ type: "error", message: e.message || "An error occurred." });
    } finally {
      setIsAssociatingRes(false);
    }
  };

  // Disassociate Resources
  const handleDisassociateResources = async () => {
    if (selectedResourceArns.length === 0) return;
    setBanner(null);
    try {
      const res = await disassociateResourcesAction(share.arn, selectedResourceArns);
      if (res.success) {
        setResources((prev) => prev.filter((r) => !selectedResourceArns.includes(r.arn)));
        setSelectedResourceArns([]);
        setBanner({ type: "success", message: "Resources disassociated successfully." });
      } else {
        setBanner({ type: "error", message: res.error || "Failed to disassociate resources." });
      }
    } catch (e: any) {
      setBanner({ type: "error", message: e.message || "An error occurred." });
    }
  };

  // Associate Principal
  const handleAssociatePrincipal = async () => {
    const trimmed = newPrincipalId.trim();
    if (!trimmed) {
      setNewPrincipalError("Please enter a principal ID.");
      return;
    }
    setIsAssociatingPrin(true);
    setBanner(null);
    try {
      const res = await associatePrincipalsAction(share.arn, [trimmed]);
      if (res.success) {
        setPrincipals((prev) => [
          ...prev,
          {
            id: trimmed,
            resourceShareArn: share.arn,
            resourceShareName: share.name,
            status: "ASSOCIATED",
            lastUpdatedTime: new Date().toISOString(),
          },
        ]);
        setNewPrincipalId("");
        setNewPrincipalError("");
        setShowAssociatePrinModal(false);
        setBanner({ type: "success", message: `Associated principal ${trimmed}.` });
      } else {
        setBanner({ type: "error", message: res.error || "Failed to associate principal." });
      }
    } catch (e: any) {
      setBanner({ type: "error", message: e.message || "An error occurred." });
    } finally {
      setIsAssociatingPrin(false);
    }
  };

  // Disassociate Principals
  const handleDisassociatePrincipals = async () => {
    if (selectedPrincipalIds.length === 0) return;
    setBanner(null);
    try {
      const res = await disassociatePrincipalsAction(share.arn, selectedPrincipalIds);
      if (res.success) {
        setPrincipals((prev) => prev.filter((p) => !selectedPrincipalIds.includes(p.id)));
        setSelectedPrincipalIds([]);
        setBanner({ type: "success", message: "Principals disassociated successfully." });
      } else {
        setBanner({ type: "error", message: res.error || "Failed to disassociate principals." });
      }
    } catch (e: any) {
      setBanner({ type: "error", message: e.message || "An error occurred." });
    }
  };

  // Save Tags
  const handleSaveTags = async () => {
    setIsSavingTags(true);
    setBanner(null);
    try {
      const cleanTags = editableTags.filter((t) => t.key.trim() !== "");
      const res = await tagResourceShareAction(share.arn, cleanTags);
      if (res.success) {
        setTags(cleanTags);
        setShowTagsModal(false);
        setBanner({ type: "success", message: "Tags updated successfully." });
      } else {
        setBanner({ type: "error", message: res.error || "Failed to save tags." });
      }
    } catch (e: any) {
      setBanner({ type: "error", message: e.message || "An error occurred." });
    } finally {
      setIsSavingTags(false);
    }
  };

  const inspectPermHandler = async (perm: RAMPermission) => {
    setInspectingPerm(perm);
    setInspectingLoading(true);
    try {
      const res = await fetchPermissionDetail(perm.arn);
      if (res.success && res.data) {
        setInspectingPerm(res.data);
      }
    } catch {
      // ignore
    } finally {
      setInspectingLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#545b64]">
        <Link href="/ram" className="hover:underline">
          Resource shares
        </Link>
        <span>/</span>
        <span className="font-semibold text-[#16191f]">{share.name}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[#16191f]">{share.name}</h1>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#ecf7ed] text-[#1d8102] border border-[#a4e7a5]">
            {share.status}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditName(share.name);
              setEditAllowExternal(share.allowExternalPrincipals);
              setShowEditModal(true);
            }}
            className="bg-white border border-[#879596] hover:bg-[#f2f3f3] text-[#16191f] font-bold text-[13px] px-3 rounded-[2px] transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Modify
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="bg-white border border-[#d13212] text-[#d13212] hover:bg-[#fff5f5] font-bold text-[13px] px-3 rounded-[2px] transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Delete
          </button>
        </div>
      </div>

      {/* Banner */}
      {banner && (
        <div
          className={`p-4 rounded border text-sm flex items-start justify-between ${
            banner.type === "success"
              ? "bg-[#ecf7ed] border-[#a4e7a5] text-[#1d8102]"
              : "bg-[#fdf2f2] border-[#f8b4b4] text-[#d13212]"
          }`}
        >
          <span>{banner.message}</span>
          <button onClick={() => setBanner(null)} className="text-gray-500 hover:text-black font-bold ml-4">
            ✕
          </button>
        </div>
      )}

      {/* Overview Card */}
      <div className="bg-white border border-[#eaeded] rounded shadow-sm p-6">
        <h2 className="text-sm font-bold text-[#16191f] mb-4">Resource share details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
          <div>
            <span className="text-[#545b64] block font-medium mb-1">Resource share ARN</span>
            <div className="flex items-center gap-2 font-mono text-[11px] text-[#16191f] break-all bg-[#fafafa] p-1.5 border border-[#eaeded] rounded">
              <span>{share.arn}</span>
              <button
                onClick={() => navigator.clipboard.writeText(share.arn)}
                title="Copy ARN"
                className="text-[#0073bb] hover:text-[#005580] shrink-0 font-sans"
              >
                Copy
              </button>
            </div>
          </div>
          <div>
            <span className="text-[#545b64] block font-medium mb-1">Owner</span>
            <span className="font-mono text-[13px] text-[#16191f]">{share.owner || "Self"}</span>
          </div>
          <div>
            <span className="text-[#545b64] block font-medium mb-1">Allow external principals</span>
            <span className="text-[13px] font-semibold text-[#16191f]">
              {share.allowExternalPrincipals ? "Yes" : "No"}
            </span>
          </div>
          <div>
            <span className="text-[#545b64] block font-medium mb-1">Last modified</span>
            <span className="text-[13px] text-[#545b64]">
              <span suppressHydrationWarning>{formatRAMDate(share.lastUpdatedTime)}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-[#eaeded] rounded shadow-sm">
        <div className="flex border-b border-[#eaeded] px-4 gap-6 text-[13px]">
          {[
            { id: "resources", label: `Resources (${resources.length})` },
            { id: "principals", label: `Principals (${principals.length})` },
            { id: "permissions", label: `Managed permissions (${permissions.length})` },
            { id: "tags", label: `Tags (${tags.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 font-bold border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-[#0073bb] text-[#0073bb]"
                  : "border-transparent text-[#545b64] hover:text-[#16191f]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Resources */}
        {activeTab === "resources" && (
          <div className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-xs text-[#545b64]">
                Resources shared with the principals associated with this resource share.
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAssociateResModal(true)}
                  className="bg-[#ec7211] hover:bg-[#eb5f07] text-white font-bold text-[13px] px-3 rounded-[2px] transition-colors shadow-sm"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  Associate resources
                </button>
                <button
                  onClick={handleDisassociateResources}
                  disabled={selectedResourceArns.length === 0}
                  className={`font-bold text-[13px] px-3 rounded-[2px] transition-colors border ${
                    selectedResourceArns.length > 0
                      ? "bg-white border-[#879596] hover:bg-[#f2f3f3] text-[#16191f]"
                      : "bg-[#f2f3f3] border-[#eaeded] text-[#959da5] cursor-not-allowed"
                  }`}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  Disassociate
                </button>
              </div>
            </div>

            <div className="border border-[#eaeded] rounded overflow-x-auto">
              <table className="w-full text-left text-[13px] text-[#16191f]">
                <thead className="bg-[#fafafa] text-[#545b64] text-[11px] font-bold uppercase border-b border-[#eaeded]">
                  <tr>
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={
                          resources.length > 0 &&
                          selectedResourceArns.length === resources.length
                        }
                        onChange={() => {
                          if (selectedResourceArns.length === resources.length) {
                            setSelectedResourceArns([]);
                          } else {
                            setSelectedResourceArns(resources.map((r) => r.arn));
                          }
                        }}
                        className="rounded border-[#aab7b8] text-[#0073bb] focus:ring-0"
                      />
                    </th>
                    <th className="p-3">Resource ARN</th>
                    <th className="p-3">Resource type</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Last updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeded]">
                  {resources.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-xs text-[#545b64]">
                        No resources associated with this resource share. Click &quot;Associate resources&quot; above to add subnets or KMS keys.
                      </td>
                    </tr>
                  ) : (
                    resources.map((res) => {
                      const isChecked = selectedResourceArns.includes(res.arn);
                      return (
                        <tr
                          key={res.arn}
                          className={`hover:bg-[#f9f9f9] ${isChecked ? "bg-[#f2f8fd]" : ""}`}
                        >
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setSelectedResourceArns(
                                    selectedResourceArns.filter((a) => a !== res.arn)
                                  );
                                } else {
                                  setSelectedResourceArns([...selectedResourceArns, res.arn]);
                                }
                              }}
                              className="rounded border-[#aab7b8] text-[#0073bb] focus:ring-0"
                            />
                          </td>
                          <td className="p-3 font-mono text-xs">{res.arn}</td>
                          <td className="p-3">
                            <span className="font-mono text-xs bg-[#f2f3f3] px-2 py-0.5 rounded text-[#545b64]">
                              {res.type}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#ecf7ed] text-[#1d8102]">
                              {res.status}
                            </span>
                          </td>
                          <td className="p-3 text-xs text-[#545b64]">
                            <span suppressHydrationWarning>{formatRAMDate(res.lastUpdatedTime)}</span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Principals */}
        {activeTab === "principals" && (
          <div className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-xs text-[#545b64]">
                Principals (AWS accounts, organizations, or OUs) granted access to this resource share.
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAssociatePrinModal(true)}
                  className="bg-[#ec7211] hover:bg-[#eb5f07] text-white font-bold text-[13px] px-3 rounded-[2px] transition-colors shadow-sm"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  Associate principals
                </button>
                <button
                  onClick={handleDisassociatePrincipals}
                  disabled={selectedPrincipalIds.length === 0}
                  className={`font-bold text-[13px] px-3 rounded-[2px] transition-colors border ${
                    selectedPrincipalIds.length > 0
                      ? "bg-white border-[#879596] hover:bg-[#f2f3f3] text-[#16191f]"
                      : "bg-[#f2f3f3] border-[#eaeded] text-[#959da5] cursor-not-allowed"
                  }`}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  Disassociate
                </button>
              </div>
            </div>

            <div className="border border-[#eaeded] rounded overflow-x-auto">
              <table className="w-full text-left text-[13px] text-[#16191f]">
                <thead className="bg-[#fafafa] text-[#545b64] text-[11px] font-bold uppercase border-b border-[#eaeded]">
                  <tr>
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={
                          principals.length > 0 &&
                          selectedPrincipalIds.length === principals.length
                        }
                        onChange={() => {
                          if (selectedPrincipalIds.length === principals.length) {
                            setSelectedPrincipalIds([]);
                          } else {
                            setSelectedPrincipalIds(principals.map((p) => p.id));
                          }
                        }}
                        className="rounded border-[#aab7b8] text-[#0073bb] focus:ring-0"
                      />
                    </th>
                    <th className="p-3">Principal ID</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Last updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeded]">
                  {principals.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-xs text-[#545b64]">
                        No principals associated with this resource share. Click &quot;Associate principals&quot; above to grant access.
                      </td>
                    </tr>
                  ) : (
                    principals.map((prin) => {
                      const isChecked = selectedPrincipalIds.includes(prin.id);
                      return (
                        <tr
                          key={prin.id}
                          className={`hover:bg-[#f9f9f9] ${isChecked ? "bg-[#f2f8fd]" : ""}`}
                        >
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setSelectedPrincipalIds(
                                    selectedPrincipalIds.filter((id) => id !== prin.id)
                                  );
                                } else {
                                  setSelectedPrincipalIds([...selectedPrincipalIds, prin.id]);
                                }
                              }}
                              className="rounded border-[#aab7b8] text-[#0073bb] focus:ring-0"
                            />
                          </td>
                          <td className="p-3 font-mono text-xs font-semibold">{prin.id}</td>
                          <td className="p-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#ecf7ed] text-[#1d8102]">
                              {prin.status}
                            </span>
                          </td>
                          <td className="p-3 text-xs text-[#545b64]">
                            <span suppressHydrationWarning>{formatRAMDate(prin.lastUpdatedTime)}</span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Permissions */}
        {activeTab === "permissions" && (
          <div className="p-6 space-y-4">
            <p className="text-xs text-[#545b64]">
              AWS RAM managed permissions controlling access to the shared resources.
            </p>
            <div className="border border-[#eaeded] rounded overflow-x-auto">
              <table className="w-full text-left text-[13px] text-[#16191f]">
                <thead className="bg-[#fafafa] text-[#545b64] text-[11px] font-bold uppercase border-b border-[#eaeded]">
                  <tr>
                    <th className="p-3">Permission Name</th>
                    <th className="p-3">Resource Type</th>
                    <th className="p-3">Version</th>
                    <th className="p-3">Default</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeded]">
                  {permissions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-xs text-[#545b64]">
                        Default AWS RAM permissions are automatically applied to associated resources.
                      </td>
                    </tr>
                  ) : (
                    permissions.map((perm) => (
                      <tr key={perm.arn} className="hover:bg-[#f9f9f9]">
                        <td className="p-3 font-medium">{perm.name}</td>
                        <td className="p-3 font-mono text-xs text-[#545b64]">{perm.resourceType}</td>
                        <td className="p-3 text-xs text-[#545b64]">v{perm.version}</td>
                        <td className="p-3 text-xs">
                          {perm.isResourceTypeDefault ? (
                            <span className="text-[#1d8102] font-semibold">Yes</span>
                          ) : (
                            "No"
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => inspectPermHandler(perm)}
                            className="text-xs text-[#0073bb] hover:underline font-bold"
                          >
                            View details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Tags */}
        {activeTab === "tags" && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-[#545b64]">
                Tags applied to this resource share.
              </p>
              <button
                onClick={() => {
                  setEditableTags([...tags]);
                  setShowTagsModal(true);
                }}
                className="bg-white border border-[#879596] hover:bg-[#f2f3f3] text-[#16191f] font-bold text-[13px] px-3 rounded-[2px] transition-colors"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Manage tags
              </button>
            </div>
            <div className="border border-[#eaeded] rounded overflow-hidden">
              <table className="w-full text-left text-[13px] text-[#16191f]">
                <thead className="bg-[#fafafa] text-[#545b64] text-[11px] font-bold uppercase border-b border-[#eaeded]">
                  <tr>
                    <th className="p-3">Key</th>
                    <th className="p-3">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeded]">
                  {tags.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="p-8 text-center text-xs text-[#545b64]">
                        No tags attached to this resource share.
                      </td>
                    </tr>
                  ) : (
                    tags.map((t) => (
                      <tr key={t.key} className="hover:bg-[#f9f9f9]">
                        <td className="p-3 font-semibold">{t.key}</td>
                        <td className="p-3 text-[#545b64]">{t.value || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Delete Share Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#16191f]">Delete resource share</h3>
            <p className="text-sm text-[#545b64]">
              Are you sure you want to delete <strong>{share.name}</strong>? Resources will no longer be shared with associated principals. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="bg-white border border-[#879596] hover:bg-[#f2f3f3] text-[#16191f] font-bold text-[13px] px-4 rounded-[2px] transition-colors"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteShare}
                disabled={isDeleting}
                className="bg-[#d13212] hover:bg-[#a82a0c] text-white font-bold text-[13px] px-4 rounded-[2px] transition-colors"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modify Share Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#16191f]">Modify resource share</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#16191f] mb-1">Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded-[2px] focus:outline-none focus:border-[#0073bb]"
                />
              </div>
              <div>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editAllowExternal}
                    onChange={(e) => setEditAllowExternal(e.target.checked)}
                    className="mt-1 rounded border-[#aab7b8] text-[#0073bb] focus:ring-0"
                  />
                  <span className="text-xs text-[#16191f]">
                    <strong className="block">Allow sharing with external principals</strong>
                    Allow sharing with any AWS account outside your organization.
                  </span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                onClick={() => setShowEditModal(false)}
                disabled={isSavingEdit}
                className="bg-white border border-[#879596] hover:bg-[#f2f3f3] text-[#16191f] font-bold text-[13px] px-4 rounded-[2px] transition-colors"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSavingEdit || !editName.trim()}
                className="bg-[#ec7211] hover:bg-[#eb5f07] text-white font-bold text-[13px] px-4 rounded-[2px] transition-colors shadow-sm"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                {isSavingEdit ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Associate Resources Modal */}
      {showAssociateResModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-2xl w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#16191f]">Associate resources</h3>
            <p className="text-xs text-[#545b64]">
              Select resources from your AWS environment (Subnets, KMS keys) to share.
            </p>
            <div className="border border-[#eaeded] rounded max-h-64 overflow-y-auto">
              <table className="w-full text-left text-[13px] text-[#16191f]">
                <thead className="bg-[#fafafa] text-[#545b64] text-[11px] font-bold uppercase border-b border-[#eaeded]">
                  <tr>
                    <th className="p-2.5 w-10 text-center">Select</th>
                    <th className="p-2.5">Resource ID</th>
                    <th className="p-2.5">Name</th>
                    <th className="p-2.5">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeded]">
                  {availableResources
                    .filter((ar) => !resources.some((r) => r.arn === ar.arn))
                    .map((ar) => {
                      const isChecked = selectedNewResourceArns.includes(ar.arn);
                      return (
                        <tr key={ar.arn} className="hover:bg-[#f9f9f9]">
                          <td className="p-2.5 text-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setSelectedNewResourceArns(
                                    selectedNewResourceArns.filter((a) => a !== ar.arn)
                                  );
                                } else {
                                  setSelectedNewResourceArns([...selectedNewResourceArns, ar.arn]);
                                }
                              }}
                              className="rounded border-[#aab7b8] text-[#0073bb] focus:ring-0"
                            />
                          </td>
                          <td className="p-2.5 font-mono text-xs">{ar.id}</td>
                          <td className="p-2.5">{ar.name}</td>
                          <td className="p-2.5 text-xs text-[#545b64]">{ar.type}</td>
                        </tr>
                      );
                    })}
                  {availableResources.filter((ar) => !resources.some((r) => r.arn === ar.arn))
                    .length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-xs text-[#545b64]">
                        All available resources in your environment are already associated.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowAssociateResModal(false)}
                disabled={isAssociatingRes}
                className="bg-white border border-[#879596] hover:bg-[#f2f3f3] text-[#16191f] font-bold text-[13px] px-4 rounded-[2px] transition-colors"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Cancel
              </button>
              <button
                onClick={handleAssociateResources}
                disabled={isAssociatingRes || selectedNewResourceArns.length === 0}
                className="bg-[#ec7211] hover:bg-[#eb5f07] text-white font-bold text-[13px] px-4 rounded-[2px] transition-colors shadow-sm"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                {isAssociatingRes ? "Associating..." : "Associate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Associate Principal Modal */}
      {showAssociatePrinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#16191f]">Associate principal</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#16191f] mb-1">
                  Principal ID (AWS Account ID)
                </label>
                <input
                  type="text"
                  placeholder="12-digit AWS Account ID (e.g. 111122223333)"
                  value={newPrincipalId}
                  onChange={(e) => {
                    setNewPrincipalId(e.target.value);
                    if (newPrincipalError) setNewPrincipalError("");
                  }}
                  className={`w-full text-[13px] px-3 py-1.5 border rounded-[2px] focus:outline-none ${
                    newPrincipalError ? "border-[#d13212]" : "border-[#aab7b8] focus:border-[#0073bb]"
                  }`}
                />
                {newPrincipalError && (
                  <p className="text-xs text-[#d13212] mt-1">{newPrincipalError}</p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowAssociatePrinModal(false)}
                disabled={isAssociatingPrin}
                className="bg-white border border-[#879596] hover:bg-[#f2f3f3] text-[#16191f] font-bold text-[13px] px-4 rounded-[2px] transition-colors"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Cancel
              </button>
              <button
                onClick={handleAssociatePrincipal}
                disabled={isAssociatingPrin || !newPrincipalId.trim()}
                className="bg-[#ec7211] hover:bg-[#eb5f07] text-white font-bold text-[13px] px-4 rounded-[2px] transition-colors shadow-sm"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                {isAssociatingPrin ? "Associating..." : "Associate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Tags Modal */}
      {showTagsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#16191f]">Manage tags</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {editableTags.map((t, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Key"
                    value={t.key}
                    onChange={(e) => {
                      const updated = [...editableTags];
                      updated[idx].key = e.target.value;
                      setEditableTags(updated);
                    }}
                    className="flex-1 text-xs px-2.5 py-1.5 border border-[#aab7b8] rounded-[2px]"
                  />
                  <input
                    type="text"
                    placeholder="Value"
                    value={t.value}
                    onChange={(e) => {
                      const updated = [...editableTags];
                      updated[idx].value = e.target.value;
                      setEditableTags(updated);
                    }}
                    className="flex-1 text-xs px-2.5 py-1.5 border border-[#aab7b8] rounded-[2px]"
                  />
                  <button
                    onClick={() => setEditableTags(editableTags.filter((_, i) => i !== idx))}
                    className="text-xs text-[#d13212] font-bold px-2 py-1 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                onClick={() => setEditableTags([...editableTags, { key: "", value: "" }])}
                className="text-xs text-[#0073bb] font-bold hover:underline"
              >
                + Add new tag
              </button>
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                onClick={() => setShowTagsModal(false)}
                disabled={isSavingTags}
                className="bg-white border border-[#879596] hover:bg-[#f2f3f3] text-[#16191f] font-bold text-[13px] px-4 rounded-[2px] transition-colors"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTags}
                disabled={isSavingTags}
                className="bg-[#ec7211] hover:bg-[#eb5f07] text-white font-bold text-[13px] px-4 rounded-[2px] transition-colors shadow-sm"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                {isSavingTags ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspect Permission Modal */}
      {inspectingPerm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#eaeded] pb-2">
              <h3 className="text-base font-bold text-[#16191f]">
                Permission details: {inspectingPerm.name}
              </h3>
              <button onClick={() => setInspectingPerm(null)} className="text-gray-500 hover:text-black font-bold">
                ✕
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <p><strong>Resource type:</strong> {inspectingPerm.resourceType}</p>
              <p><strong>Version:</strong> v{inspectingPerm.version}</p>
              <p><strong>Default version:</strong> {inspectingPerm.isResourceTypeDefault ? "Yes" : "No"}</p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#16191f] mb-1">Allowed actions policy:</h4>
              {inspectingLoading ? (
                <div className="p-4 text-center text-xs text-[#545b64]">Loading policy...</div>
              ) : (
                <pre className="bg-[#f9f9f9] border border-[#eaeded] rounded p-3 text-xs font-mono max-h-64 overflow-y-auto whitespace-pre-wrap">
                  {inspectingPerm.permission ||
                    JSON.stringify(
                      {
                        Version: "2012-10-17",
                        Statement: [
                          {
                            Effect: "Allow",
                            Action: [`${inspectingPerm.resourceType.split(":")[0]}:*`],
                            Resource: "*",
                          },
                        ],
                      },
                      null,
                      2
                    )}
                </pre>
              )}
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setInspectingPerm(null)}
                className="bg-white border border-[#879596] hover:bg-[#f2f3f3] text-[#16191f] font-bold text-[13px] px-4 rounded-[2px] transition-colors"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
