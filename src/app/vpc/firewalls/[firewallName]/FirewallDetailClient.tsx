"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Firewall,
  FirewallStatus,
  LoggingConfiguration,
  Tag,
} from "@aws-sdk/client-network-firewall";
import {
  deleteLiveFirewall,
  updateFirewallDeleteProtection,
  updateLiveLoggingConfiguration,
  tagLiveResource,
  untagLiveResource,
} from "../../network-firewall-actions";
import EmulatorOfflineBanner from "@/components/EmulatorOfflineBanner";

interface Props {
  firewall: Firewall;
  firewallStatus?: FirewallStatus;
  updateToken: string;
  initialLoggingConfig?: LoggingConfiguration;
  logDestinations: {
    cloudwatchLogGroups: string[];
    s3Buckets: string[];
  };
  initialTags: Tag[];
}

export default function FirewallDetailClient({
  firewall,
  firewallStatus,
  updateToken,
  initialLoggingConfig,
  logDestinations,
  initialTags,
}: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"details" | "policy" | "logging" | "tags">("details");

  // State
  const [loggingConfig, setLoggingConfig] = useState<LoggingConfiguration | undefined>(initialLoggingConfig);
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [deleteProtection, setDeleteProtection] = useState(Boolean(firewall.DeleteProtection));
  const [currentToken, setCurrentToken] = useState(updateToken);

  // Modals
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoggingModalOpen, setIsLoggingModalOpen] = useState(false);
  const [isTagsModalOpen, setIsTagsModalOpen] = useState(false);

  // Logging edit form state
  const [logType, setLogType] = useState<"ALERT" | "FLOW">("ALERT");
  const [destType, setDestType] = useState<"CloudWatchLogs" | "S3" | "KinesisDataFirehose">("CloudWatchLogs");
  const [selectedLogGroup, setSelectedLogGroup] = useState(logDestinations.cloudwatchLogGroups[0] || "");
  const [selectedBucket, setSelectedBucket] = useState(logDestinations.s3Buckets[0] || "");
  const [isSavingLogging, setIsSavingLogging] = useState(false);

  // Tags edit form state
  const [newTagKey, setNewTagKey] = useState("");
  const [newTagValue, setNewTagValue] = useState("");
  const [isSavingTags, setIsSavingTags] = useState(false);

  // Notifications
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Endpoints list from sync states
  const endpointsList = Object.entries(firewallStatus?.SyncStates || {}).map(([az, state]) => ({
    az,
    subnetId: state.Attachment?.SubnetId || "—",
    endpointId: state.Attachment?.EndpointId || "—",
    status: state.Attachment?.Status || "READY",
  }));

  // Policy Name derivation
  const policyName = firewall.FirewallPolicyArn?.split("/").pop() || firewall.FirewallPolicyArn || "—";

  async function handleDelete() {
    setIsDeleting(true);
    setError(null);
    try {
      const res = await deleteLiveFirewall(firewall.FirewallName!);
      if (res.success) {
        router.push("/vpc/firewalls");
      } else {
        setError(res.error || "Failed to delete firewall.");
        setIsDeleting(false);
      }
    } catch (err: any) {
      setError(err?.message || "An error occurred.");
      setIsDeleting(false);
    }
  }

  async function handleToggleDeleteProtection() {
    setError(null);
    const nextVal = !deleteProtection;
    try {
      const res = await updateFirewallDeleteProtection(firewall.FirewallName!, currentToken, nextVal);
      if (res.success) {
        setDeleteProtection(nextVal);
        setSuccessMsg(`Delete protection set to ${nextVal ? "Enabled" : "Disabled"}.`);
        router.refresh();
      } else {
        setError(res.error || "Failed to update delete protection.");
      }
    } catch (err: any) {
      setError(err?.message || "An error occurred.");
    }
  }

  async function handleSaveLogging(e: React.FormEvent) {
    e.preventDefault();
    if (destType === "KinesisDataFirehose") return; // Disabled

    setIsSavingLogging(true);
    setError(null);

    let destinationRecord: Record<string, string> = {};
    if (destType === "CloudWatchLogs") {
      destinationRecord = { logGroup: selectedLogGroup };
    } else if (destType === "S3") {
      destinationRecord = { bucketName: selectedBucket };
    }

    const currentConfigs = (loggingConfig?.LogDestinationConfigs || []).map((c) => ({
      logType: c.LogType as "ALERT" | "FLOW",
      logDestinationType: c.LogDestinationType as "CloudWatchLogs" | "S3" | "KinesisDataFirehose",
      logDestination: (c.LogDestination || {}) as Record<string, string>,
    }));
    const updatedConfigs = [
      ...currentConfigs.filter((c) => c.logType !== logType),
      {
        logType,
        logDestinationType: destType,
        logDestination: destinationRecord,
      },
    ];

    try {
      const res = await updateLiveLoggingConfiguration(firewall.FirewallName!, updatedConfigs);
      if (res.success) {
        setLoggingConfig({
          LogDestinationConfigs: updatedConfigs.map((c) => ({
            LogType: c.logType,
            LogDestinationType: c.logDestinationType,
            LogDestination: c.logDestination,
          })),
        });
        setSuccessMsg("Logging configuration updated successfully.");
        setIsLoggingModalOpen(false);
        router.refresh();
      } else {
        setError(res.error || "Failed to update logging configuration.");
      }
    } catch (err: any) {
      setError(err?.message || "An error occurred.");
    } finally {
      setIsSavingLogging(false);
    }
  }

  async function handleAddTag(e: React.FormEvent) {
    e.preventDefault();
    if (!newTagKey.trim() || !firewall.FirewallArn) return;
    setIsSavingTags(true);
    setError(null);
    try {
      const res = await tagLiveResource(firewall.FirewallArn, [{ key: newTagKey.trim(), value: newTagValue.trim() }]);
      if (res.success) {
        setTags((prev) => [...prev, { Key: newTagKey.trim(), Value: newTagValue.trim() }]);
        setNewTagKey("");
        setNewTagValue("");
        setSuccessMsg("Tag added successfully.");
        setIsTagsModalOpen(false);
        router.refresh();
      } else {
        setError(res.error || "Failed to add tag.");
      }
    } catch (err: any) {
      setError(err?.message || "An error occurred.");
    } finally {
      setIsSavingTags(false);
    }
  }

  async function handleRemoveTag(tagKey: string) {
    if (!firewall.FirewallArn) return;
    setError(null);
    try {
      const res = await untagLiveResource(firewall.FirewallArn, [tagKey]);
      if (res.success) {
        setTags((prev) => prev.filter((t) => t.Key !== tagKey));
        setSuccessMsg(`Tag '${tagKey}' removed.`);
        router.refresh();
      } else {
        setError(res.error || "Failed to remove tag.");
      }
    } catch (err: any) {
      setError(err?.message || "An error occurred.");
    }
  }

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Breadcrumb & Header */}
      <div className="border-b border-[#eaeded] pb-4">
        <div className="text-[12px] text-[#545b64] mb-1 flex items-center gap-1.5">
          <Link href="/vpc" className="hover:underline">VPC</Link>
          <span>&rsaquo;</span>
          <Link href="/vpc/firewalls" className="hover:underline">Firewalls</Link>
          <span>&rsaquo;</span>
          <span className="text-[#16191f]">{firewall.FirewallName}</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
          <div className="flex items-center gap-3">
            <h1 className="text-[22px] font-bold text-[#16191f]">{firewall.FirewallName}</h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-[#f2f8f0] text-[#2e7d32] border border-[#a6d997]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2e7d32]"></span>
              {firewallStatus?.Status || "READY"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleDeleteProtection}
              className="px-3.5 py-1.5 text-[13px] font-medium border border-[#aab7b8] rounded-sm bg-white text-[#16191f] hover:bg-[#f2f3f3]"
            >
              {deleteProtection ? "Disable delete protection" : "Enable delete protection"}
            </button>
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              disabled={deleteProtection}
              className="px-3.5 py-1.5 text-[13px] font-medium bg-[#d13212] text-white rounded-sm hover:bg-[#a82a0f] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {error && <EmulatorOfflineBanner error={error} />}

      {successMsg && (
        <div className="p-3 bg-[#f2f8f0] border border-[#2e7d32] rounded-sm text-[#16191f] text-[13px] flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-[#545b64] hover:text-black text-sm">&times;</button>
        </div>
      )}

      {/* Summary Info Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-[#eaeded] rounded-sm p-4">
          <div className="text-[12px] font-medium text-[#545b64] uppercase tracking-wider">VPC ID</div>
          <div className="text-[14px] font-mono font-bold text-[#0073bb] mt-1">
            <Link href={`/vpc/vpcs`} className="hover:underline">{firewall.VpcId}</Link>
          </div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded-sm p-4">
          <div className="text-[12px] font-medium text-[#545b64] uppercase tracking-wider">Associated policy</div>
          <div className="text-[14px] font-bold text-[#0073bb] mt-1 truncate">
            <Link href={`/vpc/firewall-policies/${policyName}`} className="hover:underline">
              {policyName}
            </Link>
          </div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded-sm p-4">
          <div className="text-[12px] font-medium text-[#545b64] uppercase tracking-wider">Encryption</div>
          <div className="text-[14px] font-semibold text-[#16191f] mt-1">
            {firewall.EncryptionConfiguration?.Type === "CUSTOMER_KMS" ? "Customer KMS CMK" : "AWS owned key"}
          </div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded-sm p-4">
          <div className="text-[12px] font-medium text-[#545b64] uppercase tracking-wider">Delete protection</div>
          <div className="text-[14px] font-semibold text-[#16191f] mt-1">
            {deleteProtection ? (
              <span className="text-[#2e7d32]">Enabled</span>
            ) : (
              <span className="text-[#545b64]">Disabled</span>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-[#eaeded]">
        <nav className="flex space-x-8 text-[13px] font-medium">
          <button
            onClick={() => setActiveTab("details")}
            className={`pb-3 border-b-2 ${
              activeTab === "details"
                ? "border-[#0073bb] text-[#0073bb] font-bold"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Firewall details
          </button>
          <button
            onClick={() => setActiveTab("policy")}
            className={`pb-3 border-b-2 ${
              activeTab === "policy"
                ? "border-[#0073bb] text-[#0073bb] font-bold"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Firewall policy
          </button>
          <button
            onClick={() => setActiveTab("logging")}
            className={`pb-3 border-b-2 ${
              activeTab === "logging"
                ? "border-[#0073bb] text-[#0073bb] font-bold"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Logging ({loggingConfig?.LogDestinationConfigs?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("tags")}
            className={`pb-3 border-b-2 ${
              activeTab === "tags"
                ? "border-[#0073bb] text-[#0073bb] font-bold"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Tags ({tags.length})
          </button>
        </nav>
      </div>

      {/* Tab 1: Firewall details */}
      {activeTab === "details" && (
        <div className="space-y-6">
          <div className="bg-white border border-[#d5dbdb] rounded-sm p-5 space-y-4 shadow-xs">
            <h2 className="text-[16px] font-bold text-[#16191f]">General details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px]">
              <div>
                <span className="text-[#545b64] block">Firewall name</span>
                <span className="font-semibold text-[#16191f]">{firewall.FirewallName}</span>
              </div>
              <div>
                <span className="text-[#545b64] block">Firewall ID</span>
                <span className="font-mono text-[#16191f]">{firewall.FirewallId}</span>
              </div>
              <div>
                <span className="text-[#545b64] block">Description</span>
                <span className="text-[#16191f]">{firewall.Description || "—"}</span>
              </div>
              <div>
                <span className="text-[#545b64] block">Firewall ARN</span>
                <span className="font-mono text-[11px] text-[#545b64] break-all">{firewall.FirewallArn}</span>
              </div>
            </div>
          </div>

          {/* Firewall Endpoints Table */}
          <div className="bg-white border border-[#d5dbdb] rounded-sm p-5 space-y-4 shadow-xs">
            <div>
              <h2 className="text-[16px] font-bold text-[#16191f]">Firewall endpoints</h2>
              <p className="text-[13px] text-[#545b64] mt-0.5">
                VPC endpoints provisioned by AWS Network Firewall in each designated subnet. Route your VPC subnet traffic through these endpoint IDs.
              </p>
            </div>
            <div className="border border-[#eaeded] rounded-sm overflow-hidden">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64]">
                  <tr>
                    <th className="px-3 py-2">Availability Zone</th>
                    <th className="px-3 py-2">Subnet ID</th>
                    <th className="px-3 py-2">Endpoint ID</th>
                    <th className="px-3 py-2">Endpoint Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeded]">
                  {endpointsList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-[#545b64]">
                        No endpoint attachments found.
                      </td>
                    </tr>
                  ) : (
                    endpointsList.map((ep) => (
                      <tr key={ep.az} className="hover:bg-[#fbfbfb]">
                        <td className="px-3 py-2 font-medium">{ep.az}</td>
                        <td className="px-3 py-2 font-mono text-[#0073bb]">
                          <Link href="/vpc/subnets" className="hover:underline">{ep.subnetId}</Link>
                        </td>
                        <td className="px-3 py-2 font-mono font-bold text-[#16191f]">{ep.endpointId}</td>
                        <td className="px-3 py-2">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-[#f2f8f0] text-[#2e7d32] border border-[#a6d997]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#2e7d32]"></span>
                            {ep.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Firewall policy */}
      {activeTab === "policy" && (
        <div className="bg-white border border-[#d5dbdb] rounded-sm p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-bold text-[#16191f]">Associated firewall policy</h2>
            <Link
              href={`/vpc/firewall-policies/${policyName}`}
              className="px-3 py-1 text-[12px] font-medium border border-[#aab7b8] rounded-sm bg-white hover:bg-[#f2f3f3]"
            >
              View policy configuration
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px]">
            <div>
              <span className="text-[#545b64] block">Policy name</span>
              <Link href={`/vpc/firewall-policies/${policyName}`} className="font-semibold text-[#0073bb] hover:underline">
                {policyName}
              </Link>
            </div>
            <div>
              <span className="text-[#545b64] block">Policy ARN</span>
              <span className="font-mono text-[11px] text-[#545b64] break-all">{firewall.FirewallPolicyArn}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Logging */}
      {activeTab === "logging" && (
        <div className="bg-white border border-[#d5dbdb] rounded-sm p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[16px] font-bold text-[#16191f]">Logging configuration</h2>
              <p className="text-[13px] text-[#545b64] mt-0.5">
                Send Alert logs and Flow logs to CloudWatch Logs or Amazon S3.
              </p>
            </div>
            <button
              onClick={() => setIsLoggingModalOpen(true)}
              className="px-3.5 py-1.5 text-[13px] font-medium bg-[#ec7211] text-white rounded-sm hover:bg-[#eb5f07]"
            >
              Edit logging configuration
            </button>
          </div>

          <div className="border border-[#eaeded] rounded-sm overflow-hidden">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64]">
                <tr>
                  <th className="px-3 py-2">Log type</th>
                  <th className="px-3 py-2">Destination type</th>
                  <th className="px-3 py-2">Log destination</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded]">
                {!loggingConfig?.LogDestinationConfigs || loggingConfig.LogDestinationConfigs.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-4 text-center text-[#545b64]">
                      Logging is not enabled. Click &quot;Edit logging configuration&quot; to configure log destinations.
                    </td>
                  </tr>
                ) : (
                  loggingConfig.LogDestinationConfigs.map((cfg, idx) => (
                    <tr key={idx} className="hover:bg-[#fbfbfb]">
                      <td className="px-3 py-2 font-semibold text-[#16191f]">{cfg.LogType}</td>
                      <td className="px-3 py-2">{cfg.LogDestinationType}</td>
                      <td className="px-3 py-2 font-mono text-[12px] text-[#545b64]">
                        {JSON.stringify(cfg.LogDestination)}
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
        <div className="bg-white border border-[#d5dbdb] rounded-sm p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-bold text-[#16191f]">Tags</h2>
            <button
              onClick={() => setIsTagsModalOpen(true)}
              className="px-3.5 py-1.5 text-[13px] font-medium bg-white border border-[#aab7b8] rounded-sm hover:bg-[#f2f3f3]"
            >
              Manage tags
            </button>
          </div>

          <div className="border border-[#eaeded] rounded-sm overflow-hidden">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64]">
                <tr>
                  <th className="px-3 py-2">Key</th>
                  <th className="px-3 py-2">Value</th>
                  <th className="w-20 px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded]">
                {tags.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-4 text-center text-[#545b64]">
                      No tags associated with this firewall.
                    </td>
                  </tr>
                ) : (
                  tags.map((t) => (
                    <tr key={t.Key} className="hover:bg-[#fbfbfb]">
                      <td className="px-3 py-2 font-semibold text-[#16191f]">{t.Key}</td>
                      <td className="px-3 py-2 text-[#545b64]">{t.Value}</td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => handleRemoveTag(t.Key!)}
                          className="text-[#d13212] hover:underline text-[12px]"
                        >
                          Delete
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

      {/* Edit Logging Modal */}
      {isLoggingModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#d5dbdb] rounded-sm max-w-lg w-full p-6 shadow-xl space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">Edit logging configuration</h3>
            <form onSubmit={handleSaveLogging} className="space-y-4 text-[13px]">
              <div>
                <label className="block font-bold text-[#16191f] mb-1">Log type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="logType"
                      value="ALERT"
                      checked={logType === "ALERT"}
                      onChange={() => setLogType("ALERT")}
                      className="accent-[#0073bb]"
                    />
                    Alert logs
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="logType"
                      value="FLOW"
                      checked={logType === "FLOW"}
                      onChange={() => setLogType("FLOW")}
                      className="accent-[#0073bb]"
                    />
                    Flow logs
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#16191f] mb-1">Log destination type</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="destType"
                      value="CloudWatchLogs"
                      checked={destType === "CloudWatchLogs"}
                      onChange={() => setDestType("CloudWatchLogs")}
                      className="accent-[#0073bb]"
                    />
                    Amazon CloudWatch Logs
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="destType"
                      value="S3"
                      checked={destType === "S3"}
                      onChange={() => setDestType("S3")}
                      className="accent-[#0073bb]"
                    />
                    Amazon S3 bucket
                  </label>
                  <label className="flex items-center gap-1.5 opacity-50 cursor-not-allowed">
                    <input
                      type="radio"
                      name="destType"
                      value="KinesisDataFirehose"
                      disabled
                      className="accent-[#0073bb]"
                    />
                    Amazon Data Firehose (Available after Amazon Data Firehose is built)
                  </label>
                </div>
              </div>

              {destType === "CloudWatchLogs" && (
                <div>
                  <label className="block font-bold text-[#16191f] mb-1">CloudWatch log group</label>
                  {logDestinations.cloudwatchLogGroups.length === 0 ? (
                    <div className="p-3 bg-[#fdf3f1] border border-[#f5b8b0] text-[#d13212] rounded-sm">
                      No log groups found. <Link href="/cloudwatch/logs" className="underline font-bold">Create a log group</Link>.
                    </div>
                  ) : (
                    <select
                      value={selectedLogGroup}
                      onChange={(e) => setSelectedLogGroup(e.target.value)}
                      className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm bg-white"
                    >
                      {logDestinations.cloudwatchLogGroups.map((lg) => (
                        <option key={lg} value={lg}>{lg}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {destType === "S3" && (
                <div>
                  <label className="block font-bold text-[#16191f] mb-1">S3 bucket</label>
                  {logDestinations.s3Buckets.length === 0 ? (
                    <div className="p-3 bg-[#fdf3f1] border border-[#f5b8b0] text-[#d13212] rounded-sm">
                      No S3 buckets found. <Link href="/s3" className="underline font-bold">Create a bucket</Link>.
                    </div>
                  ) : (
                    <select
                      value={selectedBucket}
                      onChange={(e) => setSelectedBucket(e.target.value)}
                      className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm bg-white"
                    >
                      {logDestinations.s3Buckets.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#eaeded]">
                <button
                  type="button"
                  onClick={() => setIsLoggingModalOpen(false)}
                  className="px-3.5 py-1.5 border border-[#aab7b8] rounded-sm bg-white hover:bg-[#f2f3f3]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingLogging}
                  className="px-4 py-1.5 font-medium bg-[#ec7211] text-white rounded-sm hover:bg-[#eb5f07] disabled:opacity-50"
                >
                  {isSavingLogging ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Tags Modal */}
      {isTagsModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#d5dbdb] rounded-sm max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">Add tag</h3>
            <form onSubmit={handleAddTag} className="space-y-3 text-[13px]">
              <div>
                <label className="block font-bold text-[#16191f] mb-1">Key <span className="text-[#d13212]">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Environment"
                  value={newTagKey}
                  onChange={(e) => setNewTagKey(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm"
                />
              </div>
              <div>
                <label className="block font-bold text-[#16191f] mb-1">Value</label>
                <input
                  type="text"
                  placeholder="e.g. Production"
                  value={newTagValue}
                  onChange={(e) => setNewTagValue(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#eaeded]">
                <button
                  type="button"
                  onClick={() => setIsTagsModalOpen(false)}
                  className="px-3.5 py-1.5 border border-[#aab7b8] rounded-sm bg-white hover:bg-[#f2f3f3]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingTags}
                  className="px-4 py-1.5 font-medium bg-[#ec7211] text-white rounded-sm hover:bg-[#eb5f07] disabled:opacity-50"
                >
                  {isSavingTags ? "Adding..." : "Add tag"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#d5dbdb] rounded-sm max-w-lg w-full p-6 shadow-xl space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">
              Delete {firewall.FirewallName}?
            </h3>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to delete this firewall? This operation permanently removes the firewall and all associated VPC endpoint attachments. This action cannot be undone.
            </p>
            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                To confirm deletion, type <span className="font-mono text-[#d13212]">delete</span> below:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="delete"
                className="w-full px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded-sm text-[#16191f] outline-hidden focus:border-[#d13212]"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteConfirmText("");
                }}
                className="px-3.5 py-1.5 text-[13px] border border-[#aab7b8] rounded-sm bg-white hover:bg-[#f2f3f3]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmText !== "delete" || isDeleting}
                onClick={handleDelete}
                className="px-4 py-1.5 text-[13px] font-medium bg-[#d13212] text-white rounded-sm hover:bg-[#a82a0f] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
