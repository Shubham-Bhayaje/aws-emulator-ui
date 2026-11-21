/**
 * src/app/cloudhsm/clusters/[clusterId]/ClusterDetailClient.tsx – Cluster Details View.
 * Displays Overview, HSMs, Backups, and Tags tabs with HSM provisioning and cluster management.
 * Zero emojis, Cloudscape enterprise standard, strict 32px button height standard.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClusterSummary, ClusterState, HsmSummary } from "../../types";
import {
  describeClusterAction,
  createHsmAction,
  deleteHsmAction,
  deleteClusterAction,
  initializeClusterAction,
} from "../../actions";

interface ClusterDetailClientProps {
  initialCluster: ClusterSummary;
  initialTab?: string;
}

export function ClusterDetailClient({
  initialCluster,
  initialTab = "overview",
}: ClusterDetailClientProps) {
  const router = useRouter();
  const [cluster, setCluster] = useState<ClusterSummary>(initialCluster);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Add HSM Modal
  const [showAddHsmModal, setShowAddHsmModal] = useState(false);
  const [selectedAz, setSelectedAz] = useState<string>(
    Object.keys(initialCluster.subnetMapping)[0] || ""
  );
  const [hsmIpAddress, setHsmIpAddress] = useState("");
  const [isAddingHsm, setIsAddingHsm] = useState(false);

  // Delete HSM Modal
  const [hsmToDelete, setHsmToDelete] = useState<HsmSummary | null>(null);
  const [isDeletingHsm, setIsDeletingHsm] = useState(false);

  // Initialize Cluster Modal
  const [showInitModal, setShowInitModal] = useState(false);
  const [signedCert, setSignedCert] = useState("");
  const [trustAnchor, setTrustAnchor] = useState("");
  const [isInitializing, setIsInitializing] = useState(false);

  // Delete Cluster Modal
  const [showDeleteClusterModal, setShowDeleteClusterModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeletingCluster, setIsDeletingCluster] = useState(false);

  // Copy feedback
  const [copiedCsr, setCopiedCsr] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setNotification(null);
    try {
      const res = await describeClusterAction(cluster.clusterId);
      if (res.success && res.cluster) {
        setCluster(res.cluster);
      } else {
        setNotification({ type: "error", message: res.error || "Failed to refresh cluster details" });
      }
    } catch (err: unknown) {
      setNotification({ type: "error", message: String(err) });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAddHsm = async () => {
    if (!selectedAz) return;
    setIsAddingHsm(true);
    setNotification(null);
    try {
      const res = await createHsmAction(cluster.clusterId, selectedAz, hsmIpAddress);
      if (res.success) {
        setNotification({
          type: "success",
          message: `HSM "${res.hsm?.hsmId || ""}" created successfully in ${selectedAz}.`,
        });
        setShowAddHsmModal(false);
        setHsmIpAddress("");
        await handleRefresh();
      } else {
        setNotification({ type: "error", message: res.error || "Failed to create HSM" });
      }
    } catch (err: unknown) {
      setNotification({ type: "error", message: String(err) });
    } finally {
      setIsAddingHsm(false);
    }
  };

  const handleDeleteHsm = async () => {
    if (!hsmToDelete) return;
    setIsDeletingHsm(true);
    setNotification(null);
    try {
      const res = await deleteHsmAction(cluster.clusterId, hsmToDelete.hsmId);
      if (res.success) {
        setNotification({
          type: "success",
          message: `HSM "${hsmToDelete.hsmId}" deleted successfully.`,
        });
        setHsmToDelete(null);
        await handleRefresh();
      } else {
        setNotification({ type: "error", message: res.error || "Failed to delete HSM" });
      }
    } catch (err: unknown) {
      setNotification({ type: "error", message: String(err) });
    } finally {
      setIsDeletingHsm(false);
    }
  };

  const handleInitialize = async () => {
    setIsInitializing(true);
    setNotification(null);
    try {
      const res = await initializeClusterAction(cluster.clusterId, signedCert, trustAnchor);
      if (res.success) {
        setNotification({
          type: "success",
          message: `Cluster "${cluster.clusterId}" initialized successfully.`,
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

  const handleDeleteCluster = async () => {
    setIsDeletingCluster(true);
    setNotification(null);
    try {
      const res = await deleteClusterAction(cluster.clusterId);
      if (res.success) {
        router.push("/cloudhsm");
      } else {
        setNotification({ type: "error", message: res.error || "Failed to delete cluster" });
        setIsDeletingCluster(false);
      }
    } catch (err: unknown) {
      setNotification({ type: "error", message: String(err) });
      setIsDeletingCluster(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCsr(true);
    setTimeout(() => setCopiedCsr(false), 2000);
  };

  const renderStateBadge = (state: ClusterState) => {
    switch (state) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[12px] font-bold bg-[#edf7ed] text-[#1e4620] border border-[#55a559]">
            Active
          </span>
        );
      case "INITIALIZED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[12px] font-bold bg-[#f1faff] text-[#004a80] border border-[#0073bb]">
            Initialized
          </span>
        );
      case "UNINITIALIZED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[12px] font-bold bg-[#fff3e0] text-[#7d3c00] border border-[#ffb74d]">
            Uninitialized
          </span>
        );
      case "CREATE_IN_PROGRESS":
      case "INITIALIZE_IN_PROGRESS":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[12px] font-bold bg-[#f1faff] text-[#004a80] border border-[#0073bb]">
            {state.replace(/_/g, " ")}
          </span>
        );
      case "DELETE_IN_PROGRESS":
      case "DELETED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[12px] font-bold bg-[#fdf2f2] text-[#900] border border-[#d13212]">
            {state.replace(/_/g, " ")}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[12px] font-bold bg-[#f2f3f3] text-[#545b64] border border-[#aab7b8]">
            {state}
          </span>
        );
    }
  };

  const availableAzs = Object.keys(cluster.subnetMapping);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-[12px] text-[#545b64]">
        <Link href="/cloudhsm" className="hover:underline text-[#0972d3]">
          CloudHSM
        </Link>{" "}
        &gt;{" "}
        <Link href="/cloudhsm" className="hover:underline text-[#0972d3]">
          Clusters
        </Link>{" "}
        &gt; <span className="font-bold text-[#16191f] font-mono">{cluster.clusterId}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-[24px] font-bold font-mono text-[#16191f]">{cluster.clusterId}</h1>
          {renderStateBadge(cluster.state)}
        </div>
        <div className="flex items-center gap-2">
          {cluster.state === "UNINITIALIZED" && (
            <button
              type="button"
              onClick={() => setShowInitModal(true)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3]"
            >
              Initialize cluster
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (availableAzs.length > 0 && !selectedAz) setSelectedAz(availableAzs[0]);
              setShowAddHsmModal(true);
            }}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
          >
            Add HSM
          </button>
          <button
            type="button"
            onClick={() => setShowDeleteClusterModal(true)}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#d13212] text-[#d13212] hover:bg-[#fdf2f2]"
          >
            Delete cluster
          </button>
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

      {/* Tabs */}
      <div className="flex border-b border-[#eaeded]">
        {[
          { id: "overview", label: "Overview" },
          { id: "hsms", label: `HSMs (${cluster.hsms?.length || 0})` },
          { id: "backups", label: "Backups" },
          { id: "tags", label: `Tags (${cluster.tagList?.length || 0})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`py-2 px-4 text-[13px] font-medium border-b-2 -mb-[1px] transition-colors ${
              activeTab === tab.id
                ? "border-[#ec7211] text-[#ec7211] font-bold"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* General Configuration */}
          <div className="bg-white border border-[#eaeded] rounded p-6">
            <h2 className="text-[16px] font-bold text-[#16191f] mb-4">Cluster configuration</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wider">Cluster ID</div>
                <div className="text-[13px] font-mono font-medium text-[#16191f] mt-1">{cluster.clusterId}</div>
              </div>
              <div>
                <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wider">State</div>
                <div className="mt-1">{renderStateBadge(cluster.state)}</div>
              </div>
              <div>
                <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wider">Cluster mode</div>
                <div className="text-[13px] font-medium text-[#16191f] mt-1">{cluster.mode}</div>
              </div>
              <div>
                <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wider">HSM type</div>
                <div className="text-[13px] font-mono text-[#16191f] mt-1">{cluster.hsmType}</div>
              </div>
              <div>
                <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wider">Security group</div>
                <div className="text-[13px] font-mono text-[#0972d3] mt-1">{cluster.securityGroup || "-"}</div>
              </div>
              <div>
                <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wider">Backup retention</div>
                <div className="text-[13px] text-[#16191f] mt-1">
                  {cluster.backupRetentionPolicy?.value ? `${cluster.backupRetentionPolicy.value} days` : "90 days"}
                </div>
              </div>
              <div>
                <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wider">Created at</div>
                <div className="text-[13px] text-[#545b64] mt-1">{cluster.createTimestamp || "-"}</div>
              </div>
              <div>
                <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wider">Total HSMs</div>
                <div className="text-[13px] font-bold text-[#16191f] mt-1">{cluster.hsms?.length || 0}</div>
              </div>
            </div>
          </div>

          {/* Network Configuration */}
          <div className="bg-white border border-[#eaeded] rounded p-6">
            <h2 className="text-[16px] font-bold text-[#16191f] mb-4">Network configuration</h2>
            <div className="mb-4">
              <span className="text-[13px] text-[#545b64]">VPC: </span>
              <span className="text-[13px] font-mono font-medium text-[#0972d3]">{cluster.vpcId || "-"}</span>
            </div>
            <div className="border border-[#eaeded] rounded overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#fafafa] border-b border-[#eaeded] text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                    <th className="py-2.5 px-4">Availability Zone</th>
                    <th className="py-2.5 px-4">Subnet ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeded] text-[13px]">
                  {Object.entries(cluster.subnetMapping).map(([az, subnetId]) => (
                    <tr key={az}>
                      <td className="py-2.5 px-4 font-mono font-medium">{az}</td>
                      <td className="py-2.5 px-4 font-mono text-[#0972d3]">{subnetId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Certificates & CSR */}
          <div className="bg-white border border-[#eaeded] rounded p-6 space-y-4">
            <h2 className="text-[16px] font-bold text-[#16191f]">Cluster certificates</h2>
            {cluster.certificates?.clusterCsr ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-[#16191f]">Cluster CSR (Certificate Signing Request):</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(cluster.certificates?.clusterCsr || "")}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                    className="inline-flex items-center justify-center font-bold text-[12px] px-3 rounded border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3]"
                  >
                    {copiedCsr ? "Copied" : "Copy CSR"}
                  </button>
                </div>
                <textarea
                  readOnly
                  rows={6}
                  value={cluster.certificates.clusterCsr}
                  className="w-full text-[11px] font-mono p-3 border border-[#aab7b8] rounded bg-[#fafafa] focus:outline-none"
                />
              </div>
            ) : (
              <div className="p-4 border border-[#eaeded] rounded bg-[#fafafa] text-[13px] text-[#545b64]">
                The cluster CSR will be generated automatically after you add your first HSM instance to this cluster.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: HSMs */}
      {activeTab === "hsms" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-[#545b64]">
              HSMs in this cluster. Adding HSMs across different Availability Zones provides high availability.
            </p>
            <button
              type="button"
              onClick={() => {
                if (availableAzs.length > 0 && !selectedAz) setSelectedAz(availableAzs[0]);
                setShowAddHsmModal(true);
              }}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
            >
              Add HSM
            </button>
          </div>

          <div className="bg-white border border-[#eaeded] rounded overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#fafafa] border-b border-[#eaeded] text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                  <th className="py-2.5 px-4">HSM ID</th>
                  <th className="py-2.5 px-4">State</th>
                  <th className="py-2.5 px-4">Availability Zone</th>
                  <th className="py-2.5 px-4">Subnet ID</th>
                  <th className="py-2.5 px-4">ENI ID</th>
                  <th className="py-2.5 px-4">IP Address</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded] text-[13px]">
                {(!cluster.hsms || cluster.hsms.length === 0) ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#545b64]">
                      <div className="max-w-md mx-auto space-y-3">
                        <div className="text-[16px] font-bold text-[#16191f]">No HSMs in this cluster</div>
                        <p className="text-[13px] text-[#545b64]">
                          You must provision at least one HSM to activate this cluster and generate a CSR.
                        </p>
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (availableAzs.length > 0 && !selectedAz) setSelectedAz(availableAzs[0]);
                              setShowAddHsmModal(true);
                            }}
                            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                            className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
                          >
                            Add HSM
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  cluster.hsms.map((hsm) => (
                    <tr key={hsm.hsmId} className="hover:bg-[#f2f8fd]">
                      <td className="py-2.5 px-4 font-mono font-medium text-[#16191f]">{hsm.hsmId}</td>
                      <td className="py-2.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-[#edf7ed] text-[#1e4620] border border-[#55a559]">
                          {hsm.state}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-mono">{hsm.availabilityZone}</td>
                      <td className="py-2.5 px-4 font-mono text-[#0972d3]">{hsm.subnetId || "-"}</td>
                      <td className="py-2.5 px-4 font-mono text-[#545b64]">{hsm.eniId || "-"}</td>
                      <td className="py-2.5 px-4 font-mono text-[#16191f]">{hsm.eniIp || "-"}</td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setHsmToDelete(hsm)}
                          style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                          className="inline-flex items-center justify-center font-bold text-[12px] px-3 rounded border border-[#d13212] text-[#d13212] hover:bg-[#fdf2f2]"
                        >
                          Delete HSM
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

      {/* Tab 3: Backups */}
      {activeTab === "backups" && (
        <div className="space-y-4">
          <div className="p-4 rounded border border-[#0073bb] bg-[#f1faff] text-[13px] text-[#004a80]">
            <strong>CloudHSM Backups:</strong> Automated daily backups are maintained for this cluster based on the configured retention policy ({cluster.backupRetentionPolicy?.value || 90} days). In the local emulator, DescribeBackups is scaffolded.
          </div>
          <div className="bg-white border border-[#eaeded] rounded p-8 text-center text-[#545b64]">
            <p className="text-[13px]">Backups for cluster <span className="font-mono font-bold text-[#16191f]">{cluster.clusterId}</span> are managed automatically.</p>
          </div>
        </div>
      )}

      {/* Tab 4: Tags */}
      {activeTab === "tags" && (
        <div className="space-y-4">
          <div className="bg-white border border-[#eaeded] rounded overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#fafafa] border-b border-[#eaeded] text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                  <th className="py-2.5 px-4">Key</th>
                  <th className="py-2.5 px-4">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded] text-[13px]">
                {(!cluster.tagList || cluster.tagList.length === 0) ? (
                  <tr>
                    <td colSpan={2} className="py-8 text-center text-[#545b64]">
                      No tags attached to this cluster.
                    </td>
                  </tr>
                ) : (
                  cluster.tagList.map((tag, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-4 font-medium">{tag.Key}</td>
                      <td className="py-2.5 px-4 text-[#545b64]">{tag.Value}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="p-3 border border-yellow-200 bg-yellow-50 text-[12px] text-yellow-800 rounded">
            <strong>Emulator notice:</strong> CloudHSM TagResource and ListTags operations are scaffolded in the local emulator engine.
          </div>
        </div>
      )}

      {/* Add HSM Modal */}
      {showAddHsmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">Add HSM to cluster</h3>
            <p className="text-[13px] text-[#545b64]">
              Select an Availability Zone from your cluster&apos;s subnet mapping to provision an HSM instance.
            </p>
            <div className="space-y-1">
              <label className="text-[12px] font-bold text-[#16191f]">Availability Zone:</label>
              <select
                value={selectedAz}
                onChange={(e) => setSelectedAz(e.target.value)}
                className="w-full text-[13px] px-3 py-2 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3] bg-white font-mono"
              >
                {availableAzs.map((az) => (
                  <option key={az} value={az}>
                    {az} (Subnet: {cluster.subnetMapping[az]})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[12px] font-bold text-[#16191f]">IP Address (optional):</label>
              <input
                type="text"
                placeholder="Leave blank for automatic assignment"
                value={hsmIpAddress}
                onChange={(e) => setHsmIpAddress(e.target.value)}
                className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3] font-mono"
              />
              <span className="text-[11px] text-[#545b64]">An available IP from the subnet CIDR block.</span>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowAddHsmModal(false)}
                disabled={isAddingHsm}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddHsm}
                disabled={isAddingHsm || !selectedAz}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] disabled:opacity-50"
              >
                {isAddingHsm ? "Adding HSM..." : "Add HSM"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete HSM Confirmation Modal */}
      {hsmToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">Delete HSM</h3>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to delete HSM <span className="font-mono font-bold text-[#16191f]">{hsmToDelete.hsmId}</span>? This action removes the HSM instance from the cluster and cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setHsmToDelete(null)}
                disabled={isDeletingHsm}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteHsm}
                disabled={isDeletingHsm}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#d13212] text-white hover:bg-[#b02a0f]"
              >
                {isDeletingHsm ? "Deleting..." : "Delete HSM"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Initialize Cluster Modal */}
      {showInitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-xl w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">
              Initialize cluster {cluster.clusterId}
            </h3>
            <div className="p-3 rounded border border-[#0073bb] bg-[#f1faff] text-[12px] text-[#004a80]">
              To initialize your cluster, download and sign the cluster CSR using your issuing Certificate Authority (or AWS Private CA), then upload the signed certificate and trust anchor below.
            </div>
            {cluster.certificates?.clusterCsr ? (
              <div className="space-y-1">
                <label className="text-[12px] font-bold text-[#16191f]">Cluster CSR:</label>
                <textarea
                  readOnly
                  rows={4}
                  value={cluster.certificates.clusterCsr}
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

      {/* Delete Cluster Confirmation Modal */}
      {showDeleteClusterModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">
              Delete cluster {cluster.clusterId}
            </h3>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to delete this cluster? This action is permanent and cannot be undone.
            </p>
            {cluster.hsms && cluster.hsms.length > 0 && (
              <div className="p-3 rounded border border-[#ffb74d] bg-[#fff8e1] text-[12px] text-[#7d3c00]">
                <strong>Warning:</strong> This cluster contains {cluster.hsms.length} active HSM instance(s). You must delete all HSMs in the cluster before the cluster can be deleted.
              </div>
            )}
            <div className="space-y-1">
              <label className="text-[12px] font-bold text-[#16191f]">
                To confirm deletion, type <code className="bg-[#f2f3f3] px-1 py-0.5 rounded">delete</code> below:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="delete"
                className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteClusterModal(false);
                  setDeleteConfirmText("");
                }}
                disabled={isDeletingCluster}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCluster}
                disabled={isDeletingCluster || deleteConfirmText !== "delete"}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className={`inline-flex items-center justify-center font-bold text-[13px] px-4 rounded text-white ${
                  deleteConfirmText === "delete" && !isDeletingCluster
                    ? "bg-[#d13212] hover:bg-[#b02a0f]"
                    : "bg-[#e8a397] cursor-not-allowed"
                }`}
              >
                {isDeletingCluster ? "Deleting..." : "Delete cluster"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
