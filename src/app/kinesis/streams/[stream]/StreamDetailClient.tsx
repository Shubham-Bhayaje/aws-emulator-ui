"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  StreamDetail,
  ShardItem,
  ConsumerItem,
  RecordItem,
  KmsKeyOption,
} from "../../types";
import {
  deleteStreamAction,
  updateStreamModeAction,
  updateShardCountAction,
  updateRetentionPeriodAction,
  updateEncryptionAction,
  putRecordAction,
  getRecordsAction,
  registerConsumerAction,
  deregisterConsumerAction,
  updateTagsAction,
  updateEnhancedMonitoringAction,
} from "../../actions";

interface StreamDetailClientProps {
  stream: StreamDetail;
  shards: ShardItem[];
  consumers: ConsumerItem[];
  kmsKeys: KmsKeyOption[];
  initialError?: string;
}

export default function StreamDetailClient({
  stream,
  shards,
  consumers,
  kmsKeys,
  initialError,
}: StreamDetailClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "configuration" | "shards" | "data-viewer" | "consumers" | "monitoring" | "tags"
  >("configuration");

  const [error, setError] = useState<string | null>(initialError || null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [copiedArn, setCopiedArn] = useState(false);

  // Modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInputText, setDeleteInputText] = useState("");
  const [isDeleting, startDeleteTransition] = useTransition();

  const [showCapacityModal, setShowCapacityModal] = useState(false);
  const [newCapacityMode, setNewCapacityMode] = useState<"ON_DEMAND" | "PROVISIONED">(
    stream.StreamMode
  );
  const [newShardCount, setNewShardCount] = useState(stream.OpenShardCount || 1);
  const [isUpdatingCapacity, startCapacityTransition] = useTransition();

  const [showRetentionModal, setShowRetentionModal] = useState(false);
  const [newRetentionHours, setNewRetentionHours] = useState(stream.RetentionPeriodHours || 24);
  const [isUpdatingRetention, startRetentionTransition] = useTransition();

  const [showEncryptionModal, setShowEncryptionModal] = useState(false);
  const [newEncryptionEnable, setNewEncryptionEnable] = useState(stream.EncryptionType === "KMS");
  const [newKmsChoice, setNewKmsChoice] = useState<"DEFAULT" | "CUSTOM">(
    stream.KeyId && stream.KeyId !== "alias/aws/kinesis" ? "CUSTOM" : "DEFAULT"
  );
  const [newKmsKeyArn, setNewKmsKeyArn] = useState(
    stream.KeyId || kmsKeys[0]?.Arn || "alias/aws/kinesis"
  );
  const [isUpdatingEncryption, startEncryptionTransition] = useTransition();

  const [showRegisterConsumerModal, setShowRegisterConsumerModal] = useState(false);
  const [consumerNameInput, setConsumerNameInput] = useState("");
  const [isRegisteringConsumer, startRegisterConsumerTransition] = useTransition();

  const [consumerToDeregister, setConsumerToDeregister] = useState<ConsumerItem | null>(null);
  const [isDeregisteringConsumer, startDeregisterConsumerTransition] = useTransition();

  // Data Viewer / Test Ingestion
  const [selectedShardId, setSelectedShardId] = useState(shards[0]?.ShardId || "");
  const [iteratorType, setIteratorType] = useState<
    "TRIM_HORIZON" | "LATEST" | "AT_SEQUENCE_NUMBER" | "AFTER_SEQUENCE_NUMBER"
  >("TRIM_HORIZON");
  const [customSequenceNumber, setCustomSequenceNumber] = useState("");
  const [fetchedRecords, setFetchedRecords] = useState<RecordItem[]>([]);
  const [isLoadingRecords, startGetRecordsTransition] = useTransition();

  // Test Ingestion Inline
  const [putPartitionKey, setPutPartitionKey] = useState("partition-key-1");
  const [putPayload, setPutPayload] = useState('{"message": "Hello from Kinesis emulator"}');
  const [isPuttingRecord, startPutRecordTransition] = useTransition();

  // Tags
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [editingTags, setEditingTags] = useState<{ key: string; value: string }[]>(
    stream.Tags.map((t) => ({ key: t.Key, value: t.Value }))
  );
  const [isUpdatingTags, startTagsTransition] = useTransition();

  // Enhanced Monitoring
  const [showMonitoringModal, setShowMonitoringModal] = useState(false);
  const allShardMetrics = [
    "IncomingBytes",
    "IncomingRecords",
    "OutgoingBytes",
    "OutgoingRecords",
    "WriteProvisionedThroughputExceeded",
    "ReadProvisionedThroughputExceeded",
    "IteratorAgeMilliseconds",
  ];
  const [selectedShardMetrics, setSelectedShardMetrics] = useState<string[]>(
    stream.EnhancedMonitoring || []
  );
  const [isUpdatingMonitoring, startMonitoringTransition] = useTransition();

  function handleCopyArn() {
    navigator.clipboard.writeText(stream.StreamARN);
    setCopiedArn(true);
    setTimeout(() => setCopiedArn(false), 2000);
  }

  function handleDeleteStream() {
    if (deleteInputText.trim().toLowerCase() !== "delete") return;
    setError(null);
    startDeleteTransition(async () => {
      const res = await deleteStreamAction(stream.StreamName);
      if (res.success) {
        router.push("/kinesis/streams");
      } else {
        setError(res.error || "Failed to delete data stream.");
      }
    });
  }

  function handleSaveCapacity() {
    setError(null);
    startCapacityTransition(async () => {
      let res;
      if (newCapacityMode !== stream.StreamMode) {
        res = await updateStreamModeAction(stream.StreamARN, newCapacityMode);
        if (!res.success) {
          setError(res.error || "Failed to update stream capacity mode.");
          return;
        }
      }
      if (newCapacityMode === "PROVISIONED" && newShardCount !== stream.OpenShardCount) {
        res = await updateShardCountAction(stream.StreamName, newShardCount);
        if (!res.success) {
          setError(res.error || "Failed to update shard count.");
          return;
        }
      }
      setShowCapacityModal(false);
      setSuccessBanner("Capacity mode updated successfully.");
      router.refresh();
    });
  }

  function handleSaveRetention() {
    setError(null);
    startRetentionTransition(async () => {
      const res = await updateRetentionPeriodAction(
        stream.StreamName,
        stream.RetentionPeriodHours,
        Number(newRetentionHours)
      );
      if (res.success) {
        setShowRetentionModal(false);
        setSuccessBanner(`Retention period updated to ${newRetentionHours} hours.`);
        router.refresh();
      } else {
        setError(res.error || "Failed to update retention period.");
      }
    });
  }

  function handleSaveEncryption() {
    setError(null);
    startEncryptionTransition(async () => {
      const targetKey =
        newKmsChoice === "DEFAULT" ? "alias/aws/kinesis" : newKmsKeyArn;
      const res = await updateEncryptionAction(
        stream.StreamName,
        newEncryptionEnable,
        targetKey
      );
      if (res.success) {
        setShowEncryptionModal(false);
        setSuccessBanner(
          newEncryptionEnable
            ? "Server-side encryption enabled."
            : "Server-side encryption disabled."
        );
        router.refresh();
      } else {
        setError(res.error || "Failed to update encryption.");
      }
    });
  }

  function handleGetRecords() {
    if (!selectedShardId) {
      setError("Please select a shard to fetch records from.");
      return;
    }
    setError(null);
    startGetRecordsTransition(async () => {
      const res = await getRecordsAction({
        streamName: stream.StreamName,
        shardId: selectedShardId,
        iteratorType,
        sequenceNumber:
          iteratorType === "AT_SEQUENCE_NUMBER" || iteratorType === "AFTER_SEQUENCE_NUMBER"
            ? customSequenceNumber.trim()
            : undefined,
        limit: 25,
      });

      if (res.error) {
        setError(res.error);
      } else {
        setFetchedRecords(res.records);
        setSuccessBanner(`Retrieved ${res.records.length} records from ${selectedShardId}.`);
      }
    });
  }

  function handlePutRecord(e: React.FormEvent) {
    e.preventDefault();
    if (!putPartitionKey.trim() || !putPayload.trim()) return;
    setError(null);
    startPutRecordTransition(async () => {
      const res = await putRecordAction(stream.StreamName, putPartitionKey.trim(), putPayload);
      if (res.success) {
        setSuccessBanner(
          `Record successfully ingested into shard ${res.shardId} (Seq: ${res.sequenceNumber}).`
        );
        // Refresh records if viewing
        handleGetRecords();
        router.refresh();
      } else {
        setError(res.error || "Failed to put record.");
      }
    });
  }

  function handleRegisterConsumer() {
    if (!consumerNameInput.trim()) return;
    setError(null);
    startRegisterConsumerTransition(async () => {
      const res = await registerConsumerAction(stream.StreamARN, consumerNameInput.trim());
      if (res.success) {
        setShowRegisterConsumerModal(false);
        setConsumerNameInput("");
        setSuccessBanner(`Consumer '${consumerNameInput.trim()}' registered successfully.`);
        router.refresh();
      } else {
        setError(res.error || "Failed to register consumer.");
      }
    });
  }

  function handleDeregisterConsumer() {
    if (!consumerToDeregister) return;
    setError(null);
    startDeregisterConsumerTransition(async () => {
      const res = await deregisterConsumerAction(
        stream.StreamARN,
        consumerToDeregister.ConsumerName
      );
      if (res.success) {
        setSuccessBanner(`Consumer '${consumerToDeregister.ConsumerName}' deregistered.`);
        setConsumerToDeregister(null);
        router.refresh();
      } else {
        setError(res.error || "Failed to deregister consumer.");
      }
    });
  }

  function handleSaveTags() {
    setError(null);
    startTagsTransition(async () => {
      const originalKeys = new Set(stream.Tags.map((t) => t.Key));
      const newKeys = new Set(editingTags.map((t) => t.key.trim()).filter(Boolean));

      const tagsToRemove = Array.from(originalKeys).filter((k) => !newKeys.has(k));
      const tagsToAdd = editingTags.filter((t) => t.key.trim().length > 0);

      const res = await updateTagsAction(stream.StreamName, tagsToAdd, tagsToRemove);
      if (res.success) {
        setShowTagsModal(false);
        setSuccessBanner("Tags updated successfully.");
        router.refresh();
      } else {
        setError(res.error || "Failed to update tags.");
      }
    });
  }

  function handleSaveMonitoring() {
    setError(null);
    startMonitoringTransition(async () => {
      const current = new Set(stream.EnhancedMonitoring || []);
      const desired = new Set(selectedShardMetrics);

      const toEnable = Array.from(desired).filter((m) => !current.has(m));
      const toDisable = Array.from(current).filter((m) => !desired.has(m));

      const res = await updateEnhancedMonitoringAction(stream.StreamName, toEnable, toDisable);
      if (res.success) {
        setShowMonitoringModal(false);
        setSuccessBanner("Enhanced monitoring updated successfully.");
        router.refresh();
      } else {
        setError(res.error || "Failed to update enhanced monitoring.");
      }
    });
  }

  function formatRetention(hours: number): string {
    const days = Math.floor(hours / 24);
    if (days >= 1 && hours % 24 === 0) {
      return `${hours} hours (${days} day${days > 1 ? "s" : ""})`;
    }
    return `${hours} hours`;
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Breadcrumbs */}
      <div className="text-[12px] text-[#545b64] flex items-center gap-1.5">
        <Link href="/kinesis/streams" className="text-[#0073bb] hover:underline">
          Data streams
        </Link>
        <span>/</span>
        <span className="text-[#16191f] font-semibold">{stream.StreamName}</span>
      </div>

      {/* Notifications */}
      {successBanner && (
        <div className="bg-[#f2f8f0] border border-[#1d8102] text-[#1d8102] p-4 rounded text-[13px] flex items-center justify-between">
          <div>{successBanner}</div>
          <button onClick={() => setSuccessBanner(null)} className="text-[12px] font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="bg-[#fdf2f2] border border-[#d13212] text-[#d13212] p-4 rounded text-[13px] flex items-center justify-between">
          <div>{error}</div>
          <button onClick={() => setError(null)} className="text-[12px] font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Title & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[24px] font-bold text-[#16191f]">{stream.StreamName}</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#edf7ed] text-[#1d8102]">
              {stream.StreamStatus}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[12px] font-mono text-[#545b64]">{stream.StreamARN}</span>
            <button
              onClick={handleCopyArn}
              style={{ height: "24px", minHeight: "24px", maxHeight: "24px" }}
              className="text-[11px] font-bold text-[#0073bb] hover:underline"
            >
              {copiedArn ? "Copied" : "Copy ARN"}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab("data-viewer")}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center justify-center font-bold text-[13px] px-3 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
          >
            Test data ingestion
          </button>
          <button
            onClick={() => setShowCapacityModal(true)}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center justify-center font-bold text-[13px] px-3 rounded bg-white text-[#16191f] border border-[#d5dbdb] hover:bg-[#fafafa]"
          >
            Edit capacity
          </button>
          <button
            onClick={() => setShowRetentionModal(true)}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center justify-center font-bold text-[13px] px-3 rounded bg-white text-[#16191f] border border-[#d5dbdb] hover:bg-[#fafafa]"
          >
            Edit retention
          </button>
          <button
            onClick={() => setShowEncryptionModal(true)}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center justify-center font-bold text-[13px] px-3 rounded bg-white text-[#16191f] border border-[#d5dbdb] hover:bg-[#fafafa]"
          >
            Edit encryption
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center justify-center font-bold text-[13px] px-3 rounded bg-white text-[#d13212] border border-[#d5dbdb] hover:bg-[#fafafa]"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Stream Overview Card */}
      <div className="bg-white border border-[#eaeded] rounded shadow-sm p-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-[13px]">
        <div>
          <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wide">
            Capacity mode
          </div>
          <div className="text-[15px] font-bold text-[#16191f] mt-1">
            {stream.StreamMode === "ON_DEMAND" ? "On-demand" : "Provisioned"}
          </div>
          <div className="text-[12px] text-[#545b64] mt-0.5">
            {stream.StreamMode === "ON_DEMAND"
              ? "Auto-scaling throughput"
              : `${stream.OpenShardCount} open shard${stream.OpenShardCount > 1 ? "s" : ""}`}
          </div>
        </div>

        <div>
          <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wide">
            Data retention period
          </div>
          <div className="text-[15px] font-bold text-[#16191f] mt-1">
            {formatRetention(stream.RetentionPeriodHours)}
          </div>
          <div className="text-[12px] text-[#545b64] mt-0.5">Record accessibility duration</div>
        </div>

        <div>
          <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wide">
            Server-side encryption
          </div>
          <div className="text-[15px] font-bold text-[#16191f] mt-1">
            {stream.EncryptionType === "KMS" ? "AWS KMS" : "None"}
          </div>
          <div className="text-[12px] text-[#545b64] mt-0.5 truncate max-w-xs">
            {stream.KeyId || "Unencrypted"}
          </div>
        </div>

        <div>
          <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wide">
            Enhanced fan-out consumers
          </div>
          <div className="text-[15px] font-bold text-[#16191f] mt-1">
            {consumers.length}
          </div>
          <div className="text-[12px] text-[#545b64] mt-0.5">Dedicated throughput readers</div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-[#eaeded] flex items-center gap-6 text-[14px]">
        <button
          onClick={() => setActiveTab("configuration")}
          className={`pb-3 font-bold border-b-2 transition-colors ${
            activeTab === "configuration"
              ? "border-[#ec7211] text-[#ec7211]"
              : "border-transparent text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          Configuration
        </button>
        <button
          onClick={() => setActiveTab("shards")}
          className={`pb-3 font-bold border-b-2 transition-colors ${
            activeTab === "shards"
              ? "border-[#ec7211] text-[#ec7211]"
              : "border-transparent text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          Shards ({shards.length})
        </button>
        <button
          onClick={() => setActiveTab("data-viewer")}
          className={`pb-3 font-bold border-b-2 transition-colors ${
            activeTab === "data-viewer"
              ? "border-[#ec7211] text-[#ec7211]"
              : "border-transparent text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          Data viewer
        </button>
        <button
          onClick={() => setActiveTab("consumers")}
          className={`pb-3 font-bold border-b-2 transition-colors ${
            activeTab === "consumers"
              ? "border-[#ec7211] text-[#ec7211]"
              : "border-transparent text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          Enhanced fan-out ({consumers.length})
        </button>
        <button
          onClick={() => setActiveTab("monitoring")}
          className={`pb-3 font-bold border-b-2 transition-colors ${
            activeTab === "monitoring"
              ? "border-[#ec7211] text-[#ec7211]"
              : "border-transparent text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          Monitoring
        </button>
        <button
          onClick={() => setActiveTab("tags")}
          className={`pb-3 font-bold border-b-2 transition-colors ${
            activeTab === "tags"
              ? "border-[#ec7211] text-[#ec7211]"
              : "border-transparent text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          Tags ({stream.Tags.length})
        </button>
      </div>

      {/* Tab 1: Configuration */}
      {activeTab === "configuration" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Capacity Card */}
          <div className="bg-white border border-[#eaeded] rounded shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#eaeded] pb-2">
              <h3 className="text-[16px] font-bold text-[#16191f]">Capacity mode</h3>
              <button
                onClick={() => setShowCapacityModal(true)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[12px] px-3 rounded bg-white text-[#16191f] border border-[#d5dbdb] hover:bg-[#fafafa]"
              >
                Edit
              </button>
            </div>
            <div className="space-y-3 text-[13px]">
              <div>
                <span className="text-[#545b64] block">Mode</span>
                <span className="font-bold text-[#16191f]">
                  {stream.StreamMode === "ON_DEMAND" ? "On-demand" : "Provisioned"}
                </span>
              </div>
              <div>
                <span className="text-[#545b64] block">Open shards</span>
                <span className="font-bold text-[#16191f]">
                  {stream.StreamMode === "ON_DEMAND" ? "Automatic (scales on traffic)" : stream.OpenShardCount}
                </span>
              </div>
              {stream.StreamMode === "PROVISIONED" && (
                <div className="p-3 bg-[#fafafa] border border-[#eaeded] rounded space-y-1 text-[12px]">
                  <div>Total write capacity: {stream.OpenShardCount * 1} MB/s (1,000 records/sec per shard)</div>
                  <div>Total read capacity: {stream.OpenShardCount * 2} MB/s (5 transactions/sec per shard)</div>
                </div>
              )}
            </div>
          </div>

          {/* Retention Period Card */}
          <div className="bg-white border border-[#eaeded] rounded shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#eaeded] pb-2">
              <h3 className="text-[16px] font-bold text-[#16191f]">Data retention</h3>
              <button
                onClick={() => setShowRetentionModal(true)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[12px] px-3 rounded bg-white text-[#16191f] border border-[#d5dbdb] hover:bg-[#fafafa]"
              >
                Edit
              </button>
            </div>
            <div className="space-y-3 text-[13px]">
              <div>
                <span className="text-[#545b64] block">Retention period</span>
                <span className="font-bold text-[#16191f]">
                  {formatRetention(stream.RetentionPeriodHours)}
                </span>
              </div>
              <p className="text-[12px] text-[#545b64] leading-relaxed">
                Records are accessible for this duration after being ingested. If consumers do not read records before this window expires, records are permanently deleted.
              </p>
            </div>
          </div>

          {/* Encryption Card */}
          <div className="bg-white border border-[#eaeded] rounded shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#eaeded] pb-2">
              <h3 className="text-[16px] font-bold text-[#16191f]">Server-side encryption</h3>
              <button
                onClick={() => setShowEncryptionModal(true)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[12px] px-3 rounded bg-white text-[#16191f] border border-[#d5dbdb] hover:bg-[#fafafa]"
              >
                Edit
              </button>
            </div>
            <div className="space-y-3 text-[13px]">
              <div>
                <span className="text-[#545b64] block">Encryption status</span>
                <span className="font-bold text-[#16191f]">
                  {stream.EncryptionType === "KMS" ? "Enabled (AWS KMS)" : "Disabled (None)"}
                </span>
              </div>
              {stream.KeyId && (
                <div>
                  <span className="text-[#545b64] block">KMS Key</span>
                  <span className="font-mono text-[12px] text-[#16191f] break-all">{stream.KeyId}</span>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Monitoring Card */}
          <div className="bg-white border border-[#eaeded] rounded shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#eaeded] pb-2">
              <h3 className="text-[16px] font-bold text-[#16191f]">Enhanced monitoring</h3>
              <button
                onClick={() => setShowMonitoringModal(true)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[12px] px-3 rounded bg-white text-[#16191f] border border-[#d5dbdb] hover:bg-[#fafafa]"
              >
                Edit
              </button>
            </div>
            <div className="space-y-3 text-[13px]">
              <div>
                <span className="text-[#545b64] block">Shard-level metrics</span>
                <span className="font-bold text-[#16191f]">
                  {stream.EnhancedMonitoring && stream.EnhancedMonitoring.length > 0
                    ? `${stream.EnhancedMonitoring.length} metrics enabled`
                    : "Disabled (Basic stream-level metrics only)"}
                </span>
              </div>
              {stream.EnhancedMonitoring && stream.EnhancedMonitoring.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {stream.EnhancedMonitoring.map((m) => (
                    <span
                      key={m}
                      className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#f2f3f3] text-[#16191f] border border-[#d5dbdb]"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Shards */}
      {activeTab === "shards" && (
        <div className="bg-white border border-[#eaeded] rounded shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[#eaeded] flex items-center justify-between">
            <div>
              <h3 className="text-[16px] font-bold text-[#16191f]">Shards ({shards.length})</h3>
              <p className="text-[12px] text-[#545b64]">
                A shard is a uniquely identified sequence of data records in a stream.
              </p>
            </div>
            {stream.StreamMode === "PROVISIONED" && (
              <button
                onClick={() => setShowCapacityModal(true)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-3 rounded bg-white text-[#16191f] border border-[#d5dbdb] hover:bg-[#fafafa]"
              >
                Reshard stream
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] text-[#16191f]">
              <thead className="bg-[#fafafa] text-[#545b64] border-b border-[#eaeded] font-bold">
                <tr>
                  <th className="px-4 py-3">Shard ID</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Starting hash key</th>
                  <th className="px-4 py-3">Ending hash key</th>
                  <th className="px-4 py-3">Starting sequence number</th>
                  <th className="px-4 py-3">Ending sequence number</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded]">
                {shards.map((sh) => (
                  <tr key={sh.ShardId} className="hover:bg-[#fafafa]">
                    <td className="px-4 py-3 font-mono font-bold text-[#0073bb]">{sh.ShardId}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#edf7ed] text-[#1d8102]">
                        {sh.EndingSequenceNumber ? "Closed" : "Open"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[12px] text-[#545b64] truncate max-w-xs">
                      {sh.StartingHashKey}
                    </td>
                    <td className="px-4 py-3 font-mono text-[12px] text-[#545b64] truncate max-w-xs">
                      {sh.EndingHashKey}
                    </td>
                    <td className="px-4 py-3 font-mono text-[12px] text-[#545b64] truncate max-w-xs">
                      {sh.StartingSequenceNumber}
                    </td>
                    <td className="px-4 py-3 font-mono text-[12px] text-[#545b64]">
                      {sh.EndingSequenceNumber || "— (Open)"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Data Viewer & Live Test Ingestion */}
      {activeTab === "data-viewer" && (
        <div className="space-y-6">
          {/* Test Ingestion Section */}
          <div className="bg-white border border-[#eaeded] rounded shadow-sm p-6 space-y-4">
            <h3 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
              Test data ingestion (Put record)
            </h3>
            <p className="text-[13px] text-[#545b64]">
              Simulate live producer telemetry by inserting records into this stream with custom partition keys.
            </p>

            <form onSubmit={handlePutRecord} className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-[12px] font-bold text-[#16191f]">
                  Partition key <span className="text-[#d13212]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={putPartitionKey}
                  onChange={(e) => setPutPartitionKey(e.target.value)}
                  placeholder="e.g. sensor-device-42"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                  className="mt-1 w-full px-3 text-[13px] border border-[#d5dbdb] rounded focus:outline-none focus:border-[#0073bb]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#16191f]">
                  Data payload (Text or JSON) <span className="text-[#d13212]">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={putPayload}
                  onChange={(e) => setPutPayload(e.target.value)}
                  placeholder='{"temp": 24.5, "pressure": 101.3}'
                  className="mt-1 w-full p-2.5 font-mono text-[12px] border border-[#d5dbdb] rounded focus:outline-none focus:border-[#0073bb]"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isPuttingRecord}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] disabled:opacity-50"
                >
                  {isPuttingRecord ? "Ingesting record..." : "Put record"}
                </button>
              </div>
            </form>
          </div>

          {/* Data Viewer Section */}
          <div className="bg-white border border-[#eaeded] rounded shadow-sm p-6 space-y-4">
            <h3 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
              Data viewer (Get records)
            </h3>
            <p className="text-[13px] text-[#545b64]">
              View the records ingested into your data stream by selecting a shard and iterator starting point.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div>
                <label className="block text-[12px] font-bold text-[#545b64]">Shard</label>
                <select
                  value={selectedShardId}
                  onChange={(e) => setSelectedShardId(e.target.value)}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                  className="mt-1 w-full px-3 text-[13px] border border-[#d5dbdb] rounded bg-white"
                >
                  {shards.map((sh) => (
                    <option key={sh.ShardId} value={sh.ShardId}>
                      {sh.ShardId}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#545b64]">Starting position</label>
                <select
                  value={iteratorType}
                  onChange={(e) => setIteratorType(e.target.value as any)}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                  className="mt-1 w-full px-3 text-[13px] border border-[#d5dbdb] rounded bg-white"
                >
                  <option value="TRIM_HORIZON">Trim horizon (Oldest available)</option>
                  <option value="LATEST">Latest (Newly arriving only)</option>
                  <option value="AT_SEQUENCE_NUMBER">At sequence number</option>
                  <option value="AFTER_SEQUENCE_NUMBER">After sequence number</option>
                </select>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleGetRecords}
                  disabled={isLoadingRecords || !selectedShardId}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="w-full inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] disabled:opacity-50"
                >
                  {isLoadingRecords ? "Fetching records..." : "Get records"}
                </button>
              </div>
            </div>

            {(iteratorType === "AT_SEQUENCE_NUMBER" || iteratorType === "AFTER_SEQUENCE_NUMBER") && (
              <div className="max-w-md pt-2">
                <label className="block text-[12px] font-bold text-[#16191f]">
                  Sequence number <span className="text-[#d13212]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customSequenceNumber}
                  onChange={(e) => setCustomSequenceNumber(e.target.value)}
                  placeholder="491795..."
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                  className="mt-1 w-full px-3 text-[13px] border border-[#d5dbdb] rounded"
                />
              </div>
            )}

            {/* Fetched Records Table */}
            <div className="pt-4 border-t border-[#eaeded]">
              <div className="text-[13px] font-bold text-[#16191f] mb-2">
                Fetched records ({fetchedRecords.length})
              </div>

              {fetchedRecords.length === 0 ? (
                <div className="p-8 text-center bg-[#fafafa] border border-[#eaeded] rounded text-[13px] text-[#545b64]">
                  No records returned for the current shard and iterator. Put a record above and click &quot;Get records&quot;.
                </div>
              ) : (
                <div className="border border-[#eaeded] rounded overflow-x-auto">
                  <table className="w-full text-left text-[13px] text-[#16191f]">
                    <thead className="bg-[#fafafa] text-[#545b64] border-b border-[#eaeded] font-bold">
                      <tr>
                        <th className="px-4 py-2.5">Sequence number</th>
                        <th className="px-4 py-2.5">Partition key</th>
                        <th className="px-4 py-2.5">Arrival time</th>
                        <th className="px-4 py-2.5">Data payload (UTF-8)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eaeded]">
                      {fetchedRecords.map((r, i) => (
                        <tr key={i} className="hover:bg-[#fafafa]">
                          <td className="px-4 py-2.5 font-mono text-[12px] text-[#545b64] truncate max-w-xs">
                            {r.SequenceNumber}
                          </td>
                          <td className="px-4 py-2.5 font-bold text-[#16191f]">{r.PartitionKey}</td>
                          <td className="px-4 py-2.5 text-[#545b64]">
                            {r.ApproximateArrivalTimestamp
                              ? new Date(r.ApproximateArrivalTimestamp).toLocaleString()
                              : "—"}
                          </td>
                          <td className="px-4 py-2.5 font-mono text-[12px] text-[#16191f] break-all max-w-md">
                            {r.DataText}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Enhanced Fan-out (Consumers) */}
      {activeTab === "consumers" && (
        <div className="bg-white border border-[#eaeded] rounded shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[#eaeded] flex items-center justify-between">
            <div>
              <h3 className="text-[16px] font-bold text-[#16191f]">
                Enhanced fan-out consumers ({consumers.length})
              </h3>
              <p className="text-[12px] text-[#545b64]">
                Enhanced fan-out enables applications to receive records from a stream with dedicated 2 MB/sec throughput per shard.
              </p>
            </div>
            <button
              onClick={() => setShowRegisterConsumerModal(true)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] px-3 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
            >
              Register consumer
            </button>
          </div>

          {consumers.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <div className="text-[15px] font-bold text-[#16191f]">
                No enhanced fan-out consumers registered
              </div>
              <p className="text-[13px] text-[#545b64] max-w-md mx-auto">
                By default, consumers share shard read throughput (2 MB/sec per shard). Register an enhanced fan-out consumer to get dedicated throughput.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setShowRegisterConsumerModal(true)}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
                >
                  Register consumer
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px] text-[#16191f]">
                <thead className="bg-[#fafafa] text-[#545b64] border-b border-[#eaeded] font-bold">
                  <tr>
                    <th className="px-4 py-3">Consumer name</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">ARN</th>
                    <th className="px-4 py-3">Creation time</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeded]">
                  {consumers.map((c) => (
                    <tr key={c.ConsumerARN} className="hover:bg-[#fafafa]">
                      <td className="px-4 py-3 font-bold text-[#16191f]">{c.ConsumerName}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#edf7ed] text-[#1d8102]">
                          {c.ConsumerStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[12px] text-[#545b64] truncate max-w-sm">
                        {c.ConsumerARN}
                      </td>
                      <td className="px-4 py-3 text-[#545b64]">
                        {c.ConsumerCreationTimestamp
                          ? new Date(c.ConsumerCreationTimestamp).toLocaleString()
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setConsumerToDeregister(c)}
                          className="text-[12px] font-bold text-[#d13212] hover:underline"
                        >
                          Deregister
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

      {/* Tab 5: Monitoring */}
      {activeTab === "monitoring" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[16px] font-bold text-[#16191f]">CloudWatch stream metrics</h3>
            <button
              onClick={() => setShowMonitoringModal(true)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] px-3 rounded bg-white text-[#16191f] border border-[#d5dbdb] hover:bg-[#fafafa]"
            >
              Configure enhanced monitoring
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
              <div className="text-[12px] font-bold text-[#545b64] uppercase">Incoming Bytes</div>
              <div className="text-[20px] font-bold text-[#16191f] mt-1">0 Bytes</div>
              <div className="text-[11px] text-[#545b64] mt-1">Average per 5 minutes</div>
            </div>

            <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
              <div className="text-[12px] font-bold text-[#545b64] uppercase">Incoming Records</div>
              <div className="text-[20px] font-bold text-[#16191f] mt-1">0 Records</div>
              <div className="text-[11px] text-[#545b64] mt-1">Sum per 5 minutes</div>
            </div>

            <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
              <div className="text-[12px] font-bold text-[#545b64] uppercase">Outgoing Bytes</div>
              <div className="text-[20px] font-bold text-[#16191f] mt-1">0 Bytes</div>
              <div className="text-[11px] text-[#545b64] mt-1">Average per 5 minutes</div>
            </div>

            <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
              <div className="text-[12px] font-bold text-[#545b64] uppercase">Outgoing Records</div>
              <div className="text-[20px] font-bold text-[#16191f] mt-1">0 Records</div>
              <div className="text-[11px] text-[#545b64] mt-1">Sum per 5 minutes</div>
            </div>

            <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
              <div className="text-[12px] font-bold text-[#545b64] uppercase">
                Write Throughput Exceeded
              </div>
              <div className="text-[20px] font-bold text-[#16191f] mt-1">0</div>
              <div className="text-[11px] text-[#545b64] mt-1">Throttled write requests</div>
            </div>

            <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
              <div className="text-[12px] font-bold text-[#545b64] uppercase">
                Read Throughput Exceeded
              </div>
              <div className="text-[20px] font-bold text-[#16191f] mt-1">0</div>
              <div className="text-[11px] text-[#545b64] mt-1">Throttled read requests</div>
            </div>
          </div>

          <div className="bg-[#f2f3f3] border border-[#d5dbdb] rounded p-4 text-[12px] text-[#545b64]">
            <strong className="text-[#16191f]">CloudWatch Metrics Note:</strong> Telemetry charts will stream live metrics when Amazon CloudWatch is fully integrated.
          </div>
        </div>
      )}

      {/* Tab 6: Tags */}
      {activeTab === "tags" && (
        <div className="bg-white border border-[#eaeded] rounded shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[#eaeded] flex items-center justify-between">
            <div>
              <h3 className="text-[16px] font-bold text-[#16191f]">Tags ({stream.Tags.length})</h3>
              <p className="text-[12px] text-[#545b64]">
                A tag is a label consisting of a key and an optional value to organize and track resources.
              </p>
            </div>
            <button
              onClick={() => setShowTagsModal(true)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] px-3 rounded bg-white text-[#16191f] border border-[#d5dbdb] hover:bg-[#fafafa]"
            >
              Manage tags
            </button>
          </div>

          {stream.Tags.length === 0 ? (
            <div className="p-8 text-center text-[13px] text-[#545b64]">
              No tags applied to this data stream. Click &quot;Manage tags&quot; to add tags.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px] text-[#16191f]">
                <thead className="bg-[#fafafa] text-[#545b64] border-b border-[#eaeded] font-bold">
                  <tr>
                    <th className="px-4 py-2.5">Key</th>
                    <th className="px-4 py-2.5">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeded]">
                  {stream.Tags.map((t) => (
                    <tr key={t.Key} className="hover:bg-[#fafafa]">
                      <td className="px-4 py-2.5 font-bold text-[#16191f]">{t.Key}</td>
                      <td className="px-4 py-2.5 text-[#545b64]">{t.Value || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Edit Capacity Modal */}
      {showCapacityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-[#eaeded] rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">Edit capacity mode</h3>
            <p className="text-[13px] text-[#545b64]">
              Change the capacity mode or update provisioned shard count for this data stream.
            </p>

            <div className="space-y-3">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="editCapacityMode"
                  value="ON_DEMAND"
                  checked={newCapacityMode === "ON_DEMAND"}
                  onChange={() => setNewCapacityMode("ON_DEMAND")}
                  className="mt-1 text-[#0073bb]"
                />
                <div>
                  <div className="text-[13px] font-bold text-[#16191f]">On-demand</div>
                  <div className="text-[11px] text-[#545b64]">
                    Automatically scales throughput based on data volume.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="editCapacityMode"
                  value="PROVISIONED"
                  checked={newCapacityMode === "PROVISIONED"}
                  onChange={() => setNewCapacityMode("PROVISIONED")}
                  className="mt-1 text-[#0073bb]"
                />
                <div>
                  <div className="text-[13px] font-bold text-[#16191f]">Provisioned</div>
                  <div className="text-[11px] text-[#545b64]">
                    Specify the number of shards for your data stream.
                  </div>
                </div>
              </label>

              {newCapacityMode === "PROVISIONED" && (
                <div className="pt-2">
                  <label className="block text-[12px] font-bold text-[#16191f]">
                    Number of open shards
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={newShardCount}
                    onChange={(e) => setNewShardCount(Math.max(1, parseInt(e.target.value) || 1))}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                    className="mt-1 w-full px-3 text-[13px] border border-[#d5dbdb] rounded"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowCapacityModal(false)}
                disabled={isUpdatingCapacity}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-white text-[#16191f] border border-[#d5dbdb] hover:bg-[#fafafa]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCapacity}
                disabled={isUpdatingCapacity}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
              >
                {isUpdatingCapacity ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Retention Modal */}
      {showRetentionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-[#eaeded] rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">Edit data retention period</h3>
            <p className="text-[13px] text-[#545b64]">
              Update the data retention period between 24 and 8760 hours (up to 365 days).
            </p>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f]">
                Retention period (hours)
              </label>
              <input
                type="number"
                min={24}
                max={8760}
                value={newRetentionHours}
                onChange={(e) =>
                  setNewRetentionHours(Math.max(24, Math.min(8760, parseInt(e.target.value) || 24)))
                }
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                className="mt-1 w-full px-3 text-[13px] border border-[#d5dbdb] rounded"
              />
              <div className="text-[11px] text-[#545b64] mt-1">
                Equivalent to {Math.floor(newRetentionHours / 24)} day(s).
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowRetentionModal(false)}
                disabled={isUpdatingRetention}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-white text-[#16191f] border border-[#d5dbdb] hover:bg-[#fafafa]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRetention}
                disabled={isUpdatingRetention}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
              >
                {isUpdatingRetention ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Encryption Modal */}
      {showEncryptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-[#eaeded] rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">Edit server-side encryption</h3>
            <p className="text-[13px] text-[#545b64]">
              Enable or disable server-side encryption for incoming records at rest.
            </p>

            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newEncryptionEnable}
                  onChange={(e) => setNewEncryptionEnable(e.target.checked)}
                  className="rounded text-[#0073bb]"
                />
                <span className="text-[13px] font-bold text-[#16191f]">
                  Enable server-side encryption with AWS KMS
                </span>
              </label>

              {newEncryptionEnable && (
                <div className="space-y-3 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="kmsChoiceModal"
                      value="DEFAULT"
                      checked={newKmsChoice === "DEFAULT"}
                      onChange={() => setNewKmsChoice("DEFAULT")}
                    />
                    <span className="text-[13px] text-[#16191f]">(default) aws/kinesis</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="kmsChoiceModal"
                      value="CUSTOM"
                      checked={newKmsChoice === "CUSTOM"}
                      onChange={() => setNewKmsChoice("CUSTOM")}
                    />
                    <span className="text-[13px] text-[#16191f]">Customer managed KMS key</span>
                  </label>

                  {newKmsChoice === "CUSTOM" && (
                    <select
                      value={newKmsKeyArn}
                      onChange={(e) => setNewKmsKeyArn(e.target.value)}
                      style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                      className="w-full px-3 text-[13px] border border-[#d5dbdb] rounded bg-white"
                    >
                      {kmsKeys.map((k) => (
                        <option key={k.Arn} value={k.Arn}>
                          {k.AliasName ? `${k.AliasName} (${k.KeyId})` : k.KeyId}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowEncryptionModal(false)}
                disabled={isUpdatingEncryption}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-white text-[#16191f] border border-[#d5dbdb] hover:bg-[#fafafa]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEncryption}
                disabled={isUpdatingEncryption}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
              >
                {isUpdatingEncryption ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register Consumer Modal */}
      {showRegisterConsumerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-[#eaeded] rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">
              Register enhanced fan-out consumer
            </h3>
            <p className="text-[13px] text-[#545b64]">
              Each registered consumer gets a dedicated connection with up to 2 MB/sec per shard of read throughput.
            </p>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f]">
                Consumer name <span className="text-[#d13212]">*</span>
              </label>
              <input
                type="text"
                required
                value={consumerNameInput}
                onChange={(e) => setConsumerNameInput(e.target.value)}
                placeholder="e.g. analytics-app-consumer"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                className="mt-1 w-full px-3 text-[13px] border border-[#d5dbdb] rounded"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => {
                  setShowRegisterConsumerModal(false);
                  setConsumerNameInput("");
                }}
                disabled={isRegisteringConsumer}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-white text-[#16191f] border border-[#d5dbdb] hover:bg-[#fafafa]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRegisterConsumer}
                disabled={isRegisteringConsumer || !consumerNameInput.trim()}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] disabled:opacity-50"
              >
                {isRegisteringConsumer ? "Registering..." : "Register"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deregister Consumer Modal */}
      {consumerToDeregister && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-[#eaeded] rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">
              Deregister consumer: {consumerToDeregister.ConsumerName}?
            </h3>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to deregister this consumer? Applications currently reading with this consumer will lose dedicated throughput.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setConsumerToDeregister(null)}
                disabled={isDeregisteringConsumer}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-white text-[#16191f] border border-[#d5dbdb] hover:bg-[#fafafa]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeregisterConsumer}
                disabled={isDeregisteringConsumer}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#d13212] text-white hover:bg-[#b02a0f]"
              >
                {isDeregisteringConsumer ? "Deregistering..." : "Deregister"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Tags Modal */}
      {showTagsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-[#eaeded] rounded-lg shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[18px] font-bold text-[#16191f]">Manage tags</h3>
              <button
                type="button"
                onClick={() => setEditingTags([...editingTags, { key: "", value: "" }])}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[12px] px-3 rounded bg-white text-[#16191f] border border-[#d5dbdb] hover:bg-[#fafafa]"
              >
                Add tag
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2">
              {editingTags.length === 0 ? (
                <div className="text-[13px] text-[#545b64] italic">No tags. Click &quot;Add tag&quot;.</div>
              ) : (
                editingTags.map((t, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Key"
                      value={t.key}
                      onChange={(e) => {
                        const copy = [...editingTags];
                        copy[idx].key = e.target.value;
                        setEditingTags(copy);
                      }}
                      style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                      className="w-1/2 px-2.5 text-[13px] border border-[#d5dbdb] rounded"
                    />
                    <input
                      type="text"
                      placeholder="Value"
                      value={t.value}
                      onChange={(e) => {
                        const copy = [...editingTags];
                        copy[idx].value = e.target.value;
                        setEditingTags(copy);
                      }}
                      style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                      className="w-1/2 px-2.5 text-[13px] border border-[#d5dbdb] rounded"
                    />
                    <button
                      type="button"
                      onClick={() => setEditingTags(editingTags.filter((_, i) => i !== idx))}
                      className="text-[12px] font-bold text-[#d13212] px-2 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowTagsModal(false)}
                disabled={isUpdatingTags}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-white text-[#16191f] border border-[#d5dbdb] hover:bg-[#fafafa]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveTags}
                disabled={isUpdatingTags}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
              >
                {isUpdatingTags ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Monitoring Modal */}
      {showMonitoringModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-[#eaeded] rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">
              Configure enhanced monitoring
            </h3>
            <p className="text-[13px] text-[#545b64]">
              Select shard-level metrics to emit to Amazon CloudWatch in addition to standard stream-level metrics.
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {allShardMetrics.map((m) => {
                const isChecked = selectedShardMetrics.includes(m);
                return (
                  <label key={m} className="flex items-center gap-2.5 cursor-pointer text-[13px]">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedShardMetrics([...selectedShardMetrics, m]);
                        } else {
                          setSelectedShardMetrics(selectedShardMetrics.filter((x) => x !== m));
                        }
                      }}
                      className="rounded text-[#0073bb]"
                    />
                    <span className="font-mono text-[12px] text-[#16191f]">{m}</span>
                  </label>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowMonitoringModal(false)}
                disabled={isUpdatingMonitoring}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-white text-[#16191f] border border-[#d5dbdb] hover:bg-[#fafafa]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveMonitoring}
                disabled={isUpdatingMonitoring}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
              >
                {isUpdatingMonitoring ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Stream Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-[#eaeded] rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">
              Delete data stream: {stream.StreamName}?
            </h3>
            <p className="text-[13px] text-[#545b64] leading-relaxed">
              Deleting this data stream cannot be undone. All active shards and unread records in this stream will be permanently removed.
            </p>
            <div className="bg-[#fdf2f2] border border-[#d13212] p-3 rounded text-[12px] text-[#d13212]">
              To confirm deletion, type <strong className="font-bold">delete</strong> in the field below.
            </div>
            <div>
              <input
                type="text"
                placeholder="delete"
                value={deleteInputText}
                onChange={(e) => setDeleteInputText(e.target.value)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                className="w-full px-3 text-[13px] border border-[#d5dbdb] rounded focus:outline-none focus:border-[#d13212]"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteInputText("");
                }}
                disabled={isDeleting}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-white text-[#16191f] border border-[#d5dbdb] hover:bg-[#fafafa]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteStream}
                disabled={isDeleting || deleteInputText.trim().toLowerCase() !== "delete"}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className={`inline-flex items-center justify-center font-bold text-[13px] px-4 rounded text-white ${
                  deleteInputText.trim().toLowerCase() === "delete" && !isDeleting
                    ? "bg-[#d13212] hover:bg-[#b02a0f]"
                    : "bg-[#d13212]/50 cursor-not-allowed"
                }`}
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
