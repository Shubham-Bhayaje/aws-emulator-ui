/**
 * src/app/cloudhsm/ClustersClient.tsx – AWS CloudHSM Clusters Inventory Component.
 * Zero emojis, Cloudscape enterprise standard, strict 32px button height standard.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClusterSummary, ClusterState, ClusterMode } from "./types";
import {
  describeClustersAction,
  deleteClusterAction,
  initializeClusterAction,
} from "./actions";

interface ClustersClientProps {
  initialClusters: ClusterSummary[];
}

export function ClustersClient({ initialClusters }: ClustersClientProps) {
  const router = useRouter();
  const [clusters, setClusters] = useState<ClusterSummary[]>(initialClusters);
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [stateFilter, setStateFilter] = useState<string>("ALL");
  const [modeFilter, setModeFilter] = useState<string>("ALL");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Initialize modal
  const [showInitModal, setShowInitModal] = useState(false);
  const [signedCert, setSignedCert] = useState("");
  const [trustAnchor, setTrustAnchor] = useState("");
  const [isInitializing, setIsInitializing] = useState(false);

  const selectedCluster = clusters.find((c) => c.clusterId === selectedClusterId);

  const totalClusters = clusters.length;
  const activeClusters = clusters.filter((c) => c.state === "ACTIVE" || c.state === "INITIALIZED").length;
  const uninitializedClusters = clusters.filter((c) => c.state === "UNINITIALIZED").length;
  const totalHsms = clusters.reduce((acc, c) => acc + (c.hsms?.length || 0), 0);

  const filteredClusters = clusters.filter((c) => {
    if (stateFilter !== "ALL" && c.state !== stateFilter) return false;
    if (modeFilter !== "ALL" && c.mode !== modeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = c.clusterId.toLowerCase().includes(q);
      const matchVpc = c.vpcId?.toLowerCase().includes(q) || false;
      const matchSg = c.securityGroup?.toLowerCase().includes(q) || false;
      return matchId || matchVpc || matchSg;
    }
    return true;
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setNotification(null);
    try {
      const res = await describeClustersAction();
      if (res.success) {
        setClusters(res.clusters);
      } else {
        setNotification({ type: "error", message: res.error || "Failed to refresh clusters" });
      }
    } catch (err: unknown) {
      setNotification({ type: "error", message: String(err) });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCluster) return;
    setIsDeleting(true);
    setNotification(null);
    try {
      const res = await deleteClusterAction(selectedCluster.clusterId);
      if (res.success) {
        setNotification({
          type: "success",
          message: `Cluster "${selectedCluster.clusterId}" deleted successfully.`,
        });
        setSelectedClusterId(null);
        setShowDeleteModal(false);
        setDeleteConfirmInput("");
        await handleRefresh();
      } else {
        setNotification({ type: "error", message: res.error || "Failed to delete cluster" });
      }
    } catch (err: unknown) {
      setNotification({ type: "error", message: String(err) });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleInitialize = async () => {
    if (!selectedCluster) return;
    setIsInitializing(true);
    setNotification(null);
    try {
      const res = await initializeClusterAction(selectedCluster.clusterId, signedCert, trustAnchor);
      if (res.success) {
        setNotification({
          type: "success",
          message: `Cluster "${selectedCluster.clusterId}" initialized successfully.`,
        });
        setShowInitModal(false);
        await handleRefresh();
      } else {
        setNotification({ type: "error", message: res.error || "Failed to initialize cluster" });
      }
    } catch (err: unknown) {
      setNotification({ type: "error", message: String(err) });
    } finally {
      setIsInitializing(false);
    }
  };

  const renderStateBadge = (state: ClusterState) => {
    switch (state) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-[#edf7ed] text-[#1e4620] border border-[#55a559]">
            Active
          </span>
        );
      case "INITIALIZED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-[#f1faff] text-[#004a80] border border-[#0073bb]">
            Initialized
          </span>
        );
      case "UNINITIALIZED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-[#fff3e0] text-[#7d3c00] border border-[#ffb74d]">
            Uninitialized
          </span>
        );
      case "CREATE_IN_PROGRESS":
      case "INITIALIZE_IN_PROGRESS":
      case "UPDATE_IN_PROGRESS":
      case "MODIFY_IN_PROGRESS":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-[#f1faff] text-[#004a80] border border-[#0073bb]">
            {state.replace(/_/g, " ")}
          </span>
        );
      case "DELETE_IN_PROGRESS":
      case "DELETED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-[#fdf2f2] text-[#900] border border-[#d13212]">
            {state.replace(/_/g, " ")}
          </span>
        );
      case "DEGRADED":
      case "ROLLBACK_IN_PROGRESS":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-[#fff8e1] text-[#b78103] border border-[#ffc107]">
            {state.replace(/_/g, " ")}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-[#f2f3f3] text-[#545b64] border border-[#aab7b8]">
            {state}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="text-[12px] text-[#545b64]">
        <span className="text-[#545b64]">AWS CloudHSM</span> &gt;{" "}
        <span className="font-bold text-[#16191f]">Clusters</span>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold text-[#16191f]">Clusters</h1>
          <p className="text-[13px] text-[#545b64] mt-0.5">
            AWS CloudHSM provides hardware security modules in the AWS Cloud. A cluster is a collection of individual HSMs that are kept in sync.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/cloudhsm/create"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
          >
            Create cluster
          </Link>
          <div className="relative">
            <button
              type="button"
              onClick={() => setActionsOpen(!actionsOpen)}
              disabled={!selectedCluster}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className={`inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border ${
                selectedCluster
                  ? "border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3]"
                  : "border-[#d5dbdb] text-[#aab7b8] cursor-not-allowed bg-[#fafafa]"
              }`}
            >
              Actions
              <svg className="w-3.5 h-3.5 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {actionsOpen && selectedCluster && (
              <div
                className="absolute right-0 mt-1 w-48 bg-white border border-[#eaeded] rounded shadow-lg z-20 py-1"
                onMouseLeave={() => setActionsOpen(false)}
              >
                <Link
                  href={`/cloudhsm/clusters/${selectedCluster.clusterId}`}
                  className="block px-4 py-2 text-[13px] text-[#16191f] hover:bg-[#f2f3f3]"
                  onClick={() => setActionsOpen(false)}
                >
                  View details
                </Link>
                {selectedCluster.state === "UNINITIALIZED" && (
                  <button
                    type="button"
                    onClick={() => {
                      setActionsOpen(false);
                      setShowInitModal(true);
                    }}
                    className="w-full text-left px-4 py-2 text-[13px] text-[#16191f] hover:bg-[#f2f3f3]"
                  >
                    Initialize cluster
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setActionsOpen(false);
                    setShowDeleteModal(true);
                  }}
                  className="w-full text-left px-4 py-2 text-[13px] text-[#d13212] hover:bg-[#fdf2f2]"
                >
                  Delete cluster
                </button>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3]"
          >
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Notification banner */}
      {notification && (
        <div
          className={`p-4 rounded border text-[13px] flex items-start justify-between ${
            notification.type === "success"
              ? "bg-[#edf7ed] border-[#55a559] text-[#1e4620]"
              : "bg-[#fdf2f2] border-[#d13212] text-[#900]"
          }`}
        >
          <span>{notification.message}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="ml-4 font-bold text-gray-500 hover:text-black"
          >
            &times;
          </button>
        </div>
      )}

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-[#eaeded] rounded p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#545b64]">Total Clusters</div>
          <div className="text-[24px] font-bold text-[#16191f] mt-1">{totalClusters}</div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#545b64]">Active / Initialized</div>
          <div className="text-[24px] font-bold text-[#1e4620] mt-1">{activeClusters}</div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#545b64]">Uninitialized</div>
          <div className="text-[24px] font-bold text-[#7d3c00] mt-1">{uninitializedClusters}</div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#545b64]">Total HSMs</div>
          <div className="text-[24px] font-bold text-[#0972d3] mt-1">{totalHsms}</div>
        </div>
      </div>

      {/* Inventory Container */}
      <div className="bg-white border border-[#eaeded] rounded overflow-hidden">
        {/* Filters bar */}
        <div className="p-3 border-b border-[#eaeded] flex flex-wrap items-center gap-3 bg-[#fafafa]">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search clusters by ID, VPC, or Security Group..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3] bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[12px] font-bold text-[#545b64]">State:</label>
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3] bg-white"
            >
              <option value="ALL">All states</option>
              <option value="UNINITIALIZED">Uninitialized</option>
              <option value="INITIALIZED">Initialized</option>
              <option value="ACTIVE">Active</option>
              <option value="CREATE_IN_PROGRESS">Create in progress</option>
              <option value="DELETE_IN_PROGRESS">Delete in progress</option>
              <option value="DELETED">Deleted</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[12px] font-bold text-[#545b64]">Mode:</label>
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3] bg-white"
            >
              <option value="ALL">All modes</option>
              <option value="FIPS">FIPS</option>
              <option value="NON_FIPS">Non-FIPS</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#fafafa] border-b border-[#eaeded] text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                <th className="py-2.5 px-3 w-10 text-center"></th>
                <th className="py-2.5 px-4">Cluster ID</th>
                <th className="py-2.5 px-4">State</th>
                <th className="py-2.5 px-4 text-center">HSMs</th>
                <th className="py-2.5 px-4">Mode</th>
                <th className="py-2.5 px-4">HSM Type</th>
                <th className="py-2.5 px-4">VPC</th>
                <th className="py-2.5 px-4">Security Group</th>
                <th className="py-2.5 px-4">Retention</th>
                <th className="py-2.5 px-4">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded] text-[13px] text-[#16191f]">
              {filteredClusters.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-[#545b64]">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="text-[16px] font-bold text-[#16191f]">No clusters found</div>
                      <p className="text-[13px] text-[#545b64]">
                        {clusters.length === 0
                          ? "You do not have any CloudHSM clusters in this AWS Region. Get started by creating your first cluster."
                          : "No clusters match the search and filter criteria."}
                      </p>
                      {clusters.length === 0 && (
                        <div className="pt-2">
                          <Link
                            href="/cloudhsm/create"
                            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                            className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
                          >
                            Create cluster
                          </Link>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredClusters.map((cluster) => {
                  const isSelected = selectedClusterId === cluster.clusterId;
                  return (
                    <tr
                      key={cluster.clusterId}
                      onClick={() => setSelectedClusterId(cluster.clusterId)}
                      className={`cursor-pointer hover:bg-[#f2f8fd] ${
                        isSelected ? "bg-[#e7f2fa]" : ""
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="radio"
                          name="selectedCluster"
                          checked={isSelected}
                          onChange={() => setSelectedClusterId(cluster.clusterId)}
                          className="h-4 w-4 text-[#0972d3] border-gray-300 focus:ring-0 cursor-pointer"
                        />
                      </td>
                      <td className="py-2.5 px-4 font-mono font-medium">
                        <Link
                          href={`/cloudhsm/clusters/${cluster.clusterId}`}
                          className="text-[#0972d3] hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {cluster.clusterId}
                        </Link>
                      </td>
                      <td className="py-2.5 px-4">{renderStateBadge(cluster.state)}</td>
                      <td className="py-2.5 px-4 text-center font-bold">
                        {cluster.hsms?.length || 0}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[12px]">{cluster.mode}</td>
                      <td className="py-2.5 px-4 font-mono text-[12px]">{cluster.hsmType}</td>
                      <td className="py-2.5 px-4 font-mono text-[12px] text-[#545b64]">
                        {cluster.vpcId || "-"}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[12px] text-[#545b64]">
                        {cluster.securityGroup || "-"}
                      </td>
                      <td className="py-2.5 px-4 text-[12px]">
                        {cluster.backupRetentionPolicy?.value
                          ? `${cluster.backupRetentionPolicy.value} days`
                          : "-"}
                      </td>
                      <td className="py-2.5 px-4 text-[12px] text-[#545b64]">
                        {cluster.createTimestamp || "-"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer count */}
        <div className="p-3 border-t border-[#eaeded] text-[12px] text-[#545b64] bg-[#fafafa]">
          Showing {filteredClusters.length} of {clusters.length} clusters
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedCluster && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">
              Delete cluster {selectedCluster.clusterId}
            </h3>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to delete this cluster? This action is permanent and cannot be undone.
            </p>
            {selectedCluster.hsms && selectedCluster.hsms.length > 0 && (
              <div className="p-3 rounded border border-[#ffb74d] bg-[#fff8e1] text-[12px] text-[#7d3c00]">
                <strong>Warning:</strong> This cluster contains {selectedCluster.hsms.length} active HSM instance(s). You must delete all HSMs in the cluster before the cluster can be deleted.
              </div>
            )}
            <div className="space-y-1">
              <label className="text-[12px] font-bold text-[#16191f]">
                To confirm deletion, type <code className="bg-[#f2f3f3] px-1 py-0.5 rounded">delete</code> below:
              </label>
              <input
                type="text"
                value={deleteConfirmInput}
                onChange={(e) => setDeleteConfirmInput(e.target.value)}
                placeholder="delete"
                className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmInput("");
                }}
                disabled={isDeleting}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting || deleteConfirmInput !== "delete"}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className={`inline-flex items-center justify-center font-bold text-[13px] px-4 rounded text-white ${
                  deleteConfirmInput === "delete" && !isDeleting
                    ? "bg-[#d13212] hover:bg-[#b02a0f]"
                    : "bg-[#e8a397] cursor-not-allowed"
                }`}
              >
                {isDeleting ? "Deleting..." : "Delete cluster"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Initialize Cluster Modal */}
      {showInitModal && selectedCluster && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-xl w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">
              Initialize cluster {selectedCluster.clusterId}
            </h3>
            <div className="p-3 rounded border border-[#0073bb] bg-[#f1faff] text-[12px] text-[#004a80]">
              To initialize your cluster, download and sign the cluster CSR using your issuing Certificate Authority (or AWS Private CA), then upload the signed certificate and trust anchor below.
            </div>
            {selectedCluster.certificates?.clusterCsr ? (
              <div className="space-y-1">
                <label className="text-[12px] font-bold text-[#16191f]">Cluster CSR:</label>
                <textarea
                  readOnly
                  rows={4}
                  value={selectedCluster.certificates.clusterCsr}
                  className="w-full text-[11px] font-mono p-2 border border-[#aab7b8] rounded bg-[#fafafa] focus:outline-none"
                />
              </div>
            ) : (
              <div className="p-2 border border-[#eaeded] rounded bg-[#fafafa] text-[12px] text-[#545b64]">
                A CSR is automatically generated after you add your first HSM to the cluster.
              </div>
            )}
            <div className="space-y-1">
              <label className="text-[12px] font-bold text-[#16191f]">Signed cluster certificate (PEM):</label>
              <textarea
                rows={3}
                value={signedCert}
                onChange={(e) => setSignedCert(e.target.value)}
                placeholder="-----BEGIN CERTIFICATE-----..."
                className="w-full text-[11px] font-mono p-2 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[12px] font-bold text-[#16191f]">Customer CA trust anchor certificate (PEM):</label>
              <textarea
                rows={3}
                value={trustAnchor}
                onChange={(e) => setTrustAnchor(e.target.value)}
                placeholder="-----BEGIN CERTIFICATE-----..."
                className="w-full text-[11px] font-mono p-2 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3]"
              />
            </div>
            <div className="p-2 border border-yellow-200 bg-yellow-50 text-[11px] text-yellow-800 rounded">
              <strong>Notice:</strong> In the local emulator, InitializeCluster is scaffolded. Submitting this form tests the API command and displays the emulator response.
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowInitModal(false)}
                disabled={isInitializing}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInitialize}
                disabled={isInitializing || !signedCert.trim() || !trustAnchor.trim()}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] disabled:opacity-50"
              >
                {isInitializing ? "Initializing..." : "Initialize cluster"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
