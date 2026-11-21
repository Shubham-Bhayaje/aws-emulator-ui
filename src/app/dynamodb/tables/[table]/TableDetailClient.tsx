"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  TableDetail,
  ScannedItem,
  BackupSummary,
  KmsKeyOption,
  LambdaFunctionOption,
  S3BucketOption,
  KinesisStreamOption,
} from "../../types";
import {
  deleteTableAction,
  updateTableAction,
  putItemAction,
  deleteItemAction,
  scanTableAction,
  queryTableAction,
  updateTimeToLiveAction,
  updateContinuousBackupsAction,
  createBackupAction,
  restoreTableFromBackupAction,
  deleteBackupAction,
  tagResourceAction,
  untagResourceAction,
  enableKinesisDestinationAction,
  disableKinesisDestinationAction,
} from "../../actions";
import { attributeValueToPlain, plainToAttributeValue } from "../../dynamo-utils";

interface TableDetailClientProps {
  table: TableDetail;
  initialItems: ScannedItem[];
  backups: BackupSummary[];
  kmsKeys: KmsKeyOption[];
  lambdaFunctions: LambdaFunctionOption[];
  s3Buckets: S3BucketOption[];
  kinesisStreams?: KinesisStreamOption[];
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default function TableDetailClient({
  table,
  initialItems,
  backups: initialBackups,
  kmsKeys,
  lambdaFunctions,
  s3Buckets,
  kinesisStreams = [],
}: TableDetailClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as any) || "overview";

  const [activeTab, setActiveTab] = useState<
    "overview" | "items" | "indexes" | "monitor" | "settings" | "backups" | "streams" | "tags"
  >(initialTab);

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Items State
  const [items, setItems] = useState<ScannedItem[]>(initialItems);
  const [operationType, setOperationType] = useState<"scan" | "query">("scan");
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [scanFilter, setScanFilter] = useState("");

  // Query State
  const [queryPartitionValue, setQueryPartitionValue] = useState("");
  const [querySortOperator, setQuerySortOperator] = useState<"=" | "<" | "<=" | ">" | ">=" | "begins_with">("=");
  const [querySortValue, setQuerySortValue] = useState("");

  // Create/Edit Item Modal
  const [showItemModal, setShowItemModal] = useState(false);
  const [itemModalMode, setItemModalMode] = useState<"create" | "edit">("create");
  const [itemInputFormat, setItemInputFormat] = useState<"form" | "json">("form");
  const [itemAttributes, setItemAttributes] = useState<{ name: string; type: string; value: string }[]>([]);
  const [itemJsonText, setItemJsonText] = useState("");

  // Delete Table Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmDeleteInput, setConfirmDeleteInput] = useState("");

  // Edit Capacity Modal
  const [showEditCapacityModal, setShowEditCapacityModal] = useState(false);
  const [editBillingMode, setEditBillingMode] = useState<"PAY_PER_REQUEST" | "PROVISIONED">(table.billingMode);
  const [editRcu, setEditRcu] = useState(table.readCapacityUnits || 5);
  const [editWcu, setEditWcu] = useState(table.writeCapacityUnits || 5);

  // Manage TTL Modal
  const [showTtlModal, setShowTtlModal] = useState(false);
  const [ttlEnabled, setTtlEnabled] = useState(table.timeToLive?.TimeToLiveStatus === "ENABLED");
  const [ttlAttribute, setTtlAttribute] = useState(table.timeToLive?.AttributeName || "ttl");

  // Manage PITR Modal
  const [showPitrModal, setShowPitrModal] = useState(false);
  const [pitrEnabled, setPitrEnabled] = useState(table.continuousBackups?.PointInTimeRecoveryStatus === "ENABLED");

  // Deletion Protection Modal
  const [showDelProtModal, setShowDelProtModal] = useState(false);
  const [delProtEnabled, setDelProtEnabled] = useState(!!table.deletionProtection);

  // Backups State & Modals
  const [backupsList, setBackupsList] = useState<BackupSummary[]>(initialBackups);
  const [showCreateBackupModal, setShowCreateBackupModal] = useState(false);
  const [backupNameInput, setBackupNameInput] = useState(`${table.name}-backup-${Date.now().toString().slice(-4)}`);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedBackupForRestore, setSelectedBackupForRestore] = useState<BackupSummary | null>(null);
  const [restoreTableName, setRestoreTableName] = useState("");

  // Streams & Exports Modals
  const [showStreamModal, setShowStreamModal] = useState(false);
  const [streamEnabledState, setStreamEnabledState] = useState(table.streamSpecification?.StreamEnabled || false);
  const [streamViewType, setStreamViewType] = useState<"NEW_IMAGE" | "OLD_IMAGE" | "NEW_AND_OLD_IMAGES" | "KEYS_ONLY">("NEW_AND_OLD_IMAGES");
  const [showLambdaModal, setShowLambdaModal] = useState(false);
  const [selectedLambdaArn, setSelectedLambdaArn] = useState(lambdaFunctions[0]?.FunctionArn || "");
  const [showS3ExportModal, setShowS3ExportModal] = useState(false);
  const [selectedS3Bucket, setSelectedS3Bucket] = useState(s3Buckets[0]?.Name || "");

  // Kinesis Destination Modal
  const [showKinesisModal, setShowKinesisModal] = useState(false);
  const [selectedKinesisArn, setSelectedKinesisArn] = useState(kinesisStreams[0]?.StreamArn || "");
  const [isUpdatingKinesis, startKinesisTransition] = useTransition();

  function handleEnableKinesisDestination() {
    if (!selectedKinesisArn) return;
    setError(null);
    startKinesisTransition(async () => {
      const res = await enableKinesisDestinationAction(table.name, selectedKinesisArn);
      if (res.success) {
        setShowKinesisModal(false);
        setSuccessBanner("Kinesis data stream destination enabled.");
        router.refresh();
      } else {
        setError(res.error || "Failed to enable Kinesis streaming destination.");
      }
    });
  }

  function handleDisableKinesisDestination(streamArn: string) {
    setError(null);
    startKinesisTransition(async () => {
      const res = await disableKinesisDestinationAction(table.name, streamArn);
      if (res.success) {
        setSuccessBanner("Kinesis data stream destination disabled.");
        router.refresh();
      } else {
        setError(res.error || "Failed to disable Kinesis streaming destination.");
      }
    });
  }

  // Tags Modal
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [editableTags, setEditableTags] = useState<{ Key: string; Value: string }[]>(table.tags);

  // Discovered attributes for dynamic columns
  const discoveredColumns = useMemo(() => {
    const colSet = new Set<string>();
    colSet.add(table.partitionKey);
    if (table.sortKey) colSet.add(table.sortKey);

    for (const item of items) {
      for (const k of Object.keys(item)) {
        colSet.add(k);
      }
    }
    return Array.from(colSet);
  }, [items, table.partitionKey, table.sortKey]);

  // Execute Scan or Query
  function handleRunSearch() {
    setError(null);
    startTransition(async () => {
      if (operationType === "scan") {
        const res = await scanTableAction({ tableName: table.name, limit: 100 });
        if (res.error) {
          setError(res.error);
        } else {
          setItems(res.items);
          setSelectedItemIndex(null);
        }
      } else {
        if (!queryPartitionValue.trim()) {
          setError("Partition key value is required for query.");
          return;
        }

        let expr = `#pk = :pv`;
        const names: Record<string, string> = { "#pk": table.partitionKey };
        const values: Record<string, any> = { ":pv": queryPartitionValue.trim() };

        if (table.sortKey && querySortValue.trim()) {
          names["#sk"] = table.sortKey;
          if (querySortOperator === "begins_with") {
            expr += ` AND begins_with(#sk, :sv)`;
            values[":sv"] = querySortValue.trim();
          } else {
            expr += ` AND #sk ${querySortOperator} :sv`;
            values[":sv"] = querySortValue.trim();
          }
        }

        const res = await queryTableAction({
          tableName: table.name,
          keyConditionExpression: expr,
          expressionAttributeNames: names,
          expressionAttributeValues: values,
        });

        if (res.error) {
          setError(res.error);
        } else {
          setItems(res.items);
          setSelectedItemIndex(null);
        }
      }
    });
  }

  // Open Create Item Modal
  function handleOpenCreateItem() {
    setItemModalMode("create");
    setItemInputFormat("form");
    const initialAttrs = [
      { name: table.partitionKey, type: table.partitionKeyType, value: "" },
    ];
    if (table.sortKey) {
      initialAttrs.push({ name: table.sortKey, type: table.sortKeyType || "S", value: "" });
    }
    setItemAttributes(initialAttrs);

    const initJson: Record<string, any> = {
      [table.partitionKey]: table.partitionKeyType === "N" ? 0 : "",
    };
    if (table.sortKey) {
      initJson[table.sortKey] = table.sortKeyType === "N" ? 0 : "";
    }
    setItemJsonText(JSON.stringify(initJson, null, 2));
    setShowItemModal(true);
  }

  // Open Edit Item Modal
  function handleOpenEditItem() {
    if (selectedItemIndex === null || !items[selectedItemIndex]) return;
    setItemModalMode("edit");
    setItemInputFormat("form");

    const sel = items[selectedItemIndex];
    const attrs: { name: string; type: string; value: string }[] = [];
    const jsonObj: Record<string, any> = {};

    for (const [k, v] of Object.entries(sel)) {
      attrs.push({ name: k, type: v.type, value: String(v.value) });
      jsonObj[k] = v.value;
    }

    setItemAttributes(attrs);
    setItemJsonText(JSON.stringify(jsonObj, null, 2));
    setShowItemModal(true);
  }

  // Save Item (Form or JSON)
  function handleSaveItem() {
    setError(null);
    startTransition(async () => {
      let res;
      if (itemInputFormat === "form") {
        res = await putItemAction(table.name, itemAttributes);
      } else {
        try {
          const parsed = JSON.parse(itemJsonText);
          res = await putItemAction(table.name, parsed);
        } catch {
          setError("Invalid JSON syntax in item payload.");
          return;
        }
      }

      if (res.success) {
        setShowItemModal(false);
        setSuccessBanner("Item saved successfully.");
        // Refresh scanned items
        const scanRes = await scanTableAction({ tableName: table.name, limit: 100 });
        if (!scanRes.error) setItems(scanRes.items);
      } else {
        setError(res.error || "Failed to save item.");
      }
    });
  }

  // Delete Selected Item
  function handleDeleteSelectedItem() {
    if (selectedItemIndex === null || !items[selectedItemIndex]) return;
    const sel = items[selectedItemIndex];

    const keys: { name: string; type: string; value: string }[] = [
      {
        name: table.partitionKey,
        type: sel[table.partitionKey]?.type || table.partitionKeyType,
        value: String(sel[table.partitionKey]?.value),
      },
    ];

    if (table.sortKey && sel[table.sortKey]) {
      keys.push({
        name: table.sortKey,
        type: sel[table.sortKey]?.type || table.sortKeyType || "S",
        value: String(sel[table.sortKey]?.value),
      });
    }

    startTransition(async () => {
      const res = await deleteItemAction(table.name, keys);
      if (res.success) {
        setSuccessBanner("Item deleted successfully.");
        setSelectedItemIndex(null);
        const scanRes = await scanTableAction({ tableName: table.name, limit: 100 });
        if (!scanRes.error) setItems(scanRes.items);
      } else {
        setError(res.error || "Failed to delete item.");
      }
    });
  }

  // Save Capacity Settings
  function handleSaveCapacity() {
    startTransition(async () => {
      const res = await updateTableAction({
        tableName: table.name,
        billingMode: editBillingMode,
        readCapacityUnits: editBillingMode === "PROVISIONED" ? editRcu : undefined,
        writeCapacityUnits: editBillingMode === "PROVISIONED" ? editWcu : undefined,
      });
      if (res.success) {
        setShowEditCapacityModal(false);
        setSuccessBanner("Capacity mode updated successfully.");
        router.refresh();
      } else {
        setError(res.error || "Failed to update table capacity.");
      }
    });
  }

  // Save TTL Settings
  function handleSaveTtl() {
    startTransition(async () => {
      const res = await updateTimeToLiveAction(table.name, ttlEnabled, ttlAttribute);
      if (res.success) {
        setShowTtlModal(false);
        setSuccessBanner("Time to Live (TTL) updated successfully.");
        router.refresh();
      } else {
        setError(res.error || "Failed to update TTL.");
      }
    });
  }

  // Save PITR Settings
  function handleSavePitr() {
    startTransition(async () => {
      const res = await updateContinuousBackupsAction(table.name, pitrEnabled);
      if (res.success) {
        setShowPitrModal(false);
        setSuccessBanner("Point-in-time recovery (PITR) updated successfully.");
        router.refresh();
      } else {
        setError(res.error || "Failed to update PITR.");
      }
    });
  }

  // Save Deletion Protection
  function handleSaveDelProt() {
    startTransition(async () => {
      const res = await updateTableAction({
        tableName: table.name,
        deletionProtection: delProtEnabled,
      });
      if (res.success) {
        setShowDelProtModal(false);
        setSuccessBanner("Deletion protection updated successfully.");
        router.refresh();
      } else {
        setError(res.error || "Failed to update deletion protection.");
      }
    });
  }

  // Create On-Demand Backup
  function handleCreateBackup() {
    if (!backupNameInput.trim()) return;
    startTransition(async () => {
      const res = await createBackupAction(table.name, backupNameInput.trim());
      if (res.success) {
        setShowCreateBackupModal(false);
        setSuccessBanner(`Backup '${backupNameInput}' created successfully.`);
        router.refresh();
      } else {
        setError(res.error || "Failed to create backup.");
      }
    });
  }

  // Restore Backup
  function handleRestoreBackup() {
    if (!selectedBackupForRestore || !restoreTableName.trim()) return;
    startTransition(async () => {
      const res = await restoreTableFromBackupAction(restoreTableName.trim(), selectedBackupForRestore.BackupArn);
      if (res.success) {
        setShowRestoreModal(false);
        setSuccessBanner(`Table '${restoreTableName}' restored from backup.`);
        router.push(`/dynamodb/tables/${encodeURIComponent(restoreTableName.trim())}`);
      } else {
        setError(res.error || "Failed to restore table from backup.");
      }
    });
  }

  // Save Streams Configuration
  function handleSaveStream() {
    startTransition(async () => {
      const res = await updateTableAction({
        tableName: table.name,
        streamEnabled: streamEnabledState,
        streamViewType: streamEnabledState ? streamViewType : undefined,
      });
      if (res.success) {
        setShowStreamModal(false);
        setSuccessBanner("DynamoDB Stream configuration updated.");
        router.refresh();
      } else {
        setError(res.error || "Failed to update stream configuration.");
      }
    });
  }

  // Save Tags
  function handleSaveTags() {
    startTransition(async () => {
      const existingKeys = table.tags.map((t) => t.Key);
      if (existingKeys.length > 0) {
        await untagResourceAction(table.arn, existingKeys);
      }
      const validTags = editableTags.filter((t) => t.Key.trim() !== "");
      if (validTags.length > 0) {
        const res = await tagResourceAction(table.arn, validTags);
        if (!res.success) {
          setError(res.error || "Failed to update tags.");
          return;
        }
      }
      setShowTagsModal(false);
      setSuccessBanner("Tags updated successfully.");
      router.refresh();
    });
  }

  // Delete Table
  function handleDeleteTable() {
    if (confirmDeleteInput !== table.name) return;
    startTransition(async () => {
      const res = await deleteTableAction(table.name);
      if (res.success) {
        router.push("/dynamodb/tables");
      } else {
        setError(res.error || "Failed to delete table.");
      }
    });
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Breadcrumb Navigation */}
      <div className="text-[12px] text-[#545b64] flex items-center gap-1.5">
        <Link href="/dynamodb" className="hover:underline text-[#0073bb]">
          Amazon DynamoDB
        </Link>
        <span>&rsaquo;</span>
        <Link href="/dynamodb/tables" className="hover:underline text-[#0073bb]">
          Tables
        </Link>
        <span>&rsaquo;</span>
        <span className="text-[#16191f] font-semibold">{table.name}</span>
      </div>

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#eaeded] pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[24px] font-bold text-[#16191f]">{table.name}</h1>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                table.status.toUpperCase() === "ACTIVE"
                  ? "bg-[#edf7ed] text-[#1d8102]"
                  : "bg-[#fef3d6] text-[#b35900]"
              }`}
            >
              {table.status}
            </span>
          </div>
          <p className="text-[13px] text-[#545b64] mt-1 font-mono">
            {table.arn}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("items")}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="px-4 text-[13px] font-bold rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors"
          >
            Explore items
          </button>
          <button
            onClick={() => setShowEditCapacityModal(true)}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="px-3 text-[13px] font-bold rounded border border-[#545b64] text-[#16191f] bg-white hover:bg-[#f2f3f3] transition-colors"
          >
            Edit capacity
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="px-3 text-[13px] font-bold rounded border border-[#d13212] text-[#d13212] bg-white hover:bg-[#fdf2f2] transition-colors"
          >
            Delete table
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-3 bg-[#fdf2f2] border-l-4 border-[#d13212] text-[13px] text-[#d13212] rounded flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="font-bold">&times;</button>
        </div>
      )}
      {successBanner && (
        <div className="p-3 bg-[#edf7ed] border-l-4 border-[#1d8102] text-[13px] text-[#1d8102] rounded flex justify-between items-center">
          <span>{successBanner}</span>
          <button onClick={() => setSuccessBanner(null)} className="font-bold">&times;</button>
        </div>
      )}

      {/* 8 Tab Headers */}
      <div className="border-b border-[#eaeded] flex gap-6 overflow-x-auto text-[14px]">
        {[
          { id: "overview", label: "Overview" },
          { id: "items", label: `Explore items (${items.length})` },
          { id: "indexes", label: `Indexes (${table.globalSecondaryIndexes.length + table.localSecondaryIndexes.length})` },
          { id: "monitor", label: "Monitor" },
          { id: "settings", label: "Additional settings" },
          { id: "backups", label: `Backups (${backupsList.length})` },
          { id: "streams", label: "Exports and streams" },
          { id: "tags", label: `Tags (${table.tags.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-2.5 font-bold whitespace-nowrap transition-colors border-b-2 ${
              activeTab === tab.id
                ? "border-[#ec7211] text-[#ec7211]"
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Table Properties Card */}
            <div className="bg-white border border-[#eaeded] rounded p-5 shadow-sm space-y-4">
              <h2 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
                Table properties
              </h2>
              <dl className="grid grid-cols-2 gap-3 text-[13px]">
                <div>
                  <dt className="text-[#545b64]">Table name</dt>
                  <dd className="font-bold text-[#16191f] mt-0.5">{table.name}</dd>
                </div>
                <div>
                  <dt className="text-[#545b64]">Table status</dt>
                  <dd className="mt-0.5 font-semibold text-[#1d8102]">{table.status}</dd>
                </div>
                <div>
                  <dt className="text-[#545b64]">Partition key</dt>
                  <dd className="font-mono text-[#16191f] mt-0.5 font-bold">
                    {table.partitionKey} <span className="text-[#545b64] font-sans font-normal">({table.partitionKeyType})</span>
                  </dd>
                </div>
                <div>
                  <dt className="text-[#545b64]">Sort key</dt>
                  <dd className="font-mono text-[#16191f] mt-0.5">
                    {table.sortKey ? (
                      <>
                        <span className="font-bold">{table.sortKey}</span> <span className="text-[#545b64] font-sans">({table.sortKeyType})</span>
                      </>
                    ) : (
                      <span className="text-[#879596]">–</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#545b64]">Item count</dt>
                  <dd className="text-[#16191f] mt-0.5">{table.itemCount.toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="text-[#545b64]">Table size</dt>
                  <dd className="text-[#16191f] mt-0.5">{formatBytes(table.sizeBytes)}</dd>
                </div>
                <div>
                  <dt className="text-[#545b64]">Creation date</dt>
                  <dd className="text-[#16191f] mt-0.5">
                    {table.creationDateTime ? new Date(table.creationDateTime).toLocaleString() : "–"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#545b64]">Deletion protection</dt>
                  <dd className="text-[#16191f] mt-0.5 font-medium">
                    {table.deletionProtection ? "Enabled" : "Disabled"}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Read/Write Capacity Card */}
            <div className="bg-white border border-[#eaeded] rounded p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#eaeded] pb-2">
                <h2 className="text-[16px] font-bold text-[#16191f]">Capacity mode</h2>
                <button
                  onClick={() => setShowEditCapacityModal(true)}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="px-3 text-[12px] font-bold text-[#0073bb] hover:underline"
                >
                  Edit capacity
                </button>
              </div>

              <dl className="grid grid-cols-2 gap-3 text-[13px]">
                <div>
                  <dt className="text-[#545b64]">Capacity mode</dt>
                  <dd className="font-bold text-[#16191f] mt-0.5">
                    {table.billingMode === "PAY_PER_REQUEST" ? "On-demand" : "Provisioned"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#545b64]">Throughput calculation</dt>
                  <dd className="text-[#16191f] mt-0.5">
                    {table.billingMode === "PAY_PER_REQUEST" ? "Pay-per-request" : "Fixed provisioned"}
                  </dd>
                </div>
                {table.billingMode === "PROVISIONED" && (
                  <>
                    <div>
                      <dt className="text-[#545b64]">Read capacity units (RCU)</dt>
                      <dd className="font-bold text-[#16191f] mt-0.5">{table.readCapacityUnits ?? 5}</dd>
                    </div>
                    <div>
                      <dt className="text-[#545b64]">Write capacity units (WCU)</dt>
                      <dd className="font-bold text-[#16191f] mt-0.5">{table.writeCapacityUnits ?? 5}</dd>
                    </div>
                  </>
                )}
              </dl>

              {/* Encryption Info */}
              <div className="pt-4 border-t border-[#eaeded] space-y-2">
                <h3 className="text-[14px] font-bold text-[#16191f]">Encryption at rest</h3>
                <p className="text-[12px] text-[#545b64]">
                  {table.sseDescription?.SSEType === "KMS"
                    ? `KMS Customer Managed Key: ${table.sseDescription.KMSMasterKeyArn || "arn:aws:kms:..."}`
                    : "Amazon DynamoDB owned key (default standard envelope encryption)"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Explore items */}
      {activeTab === "items" && (
        <div className="space-y-4">
          {/* Scan / Query Expression Card */}
          <div className="bg-white border border-[#eaeded] rounded p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#eaeded] pb-3">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer text-[13px] font-bold text-[#16191f]">
                  <input
                    type="radio"
                    name="opType"
                    checked={operationType === "scan"}
                    onChange={() => setOperationType("scan")}
                    className="text-[#ec7211] focus:ring-[#ec7211]"
                  />
                  <span>Scan</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-[13px] font-bold text-[#16191f]">
                  <input
                    type="radio"
                    name="opType"
                    checked={operationType === "query"}
                    onChange={() => setOperationType("query")}
                    className="text-[#ec7211] focus:ring-[#ec7211]"
                  />
                  <span>Query</span>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRunSearch}
                  disabled={isPending}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="px-4 text-[13px] font-bold rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors"
                >
                  {isPending ? "Running..." : "Run"}
                </button>
              </div>
            </div>

            {/* Query Parameters */}
            {operationType === "query" && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-[12px] font-bold text-[#16191f]">
                    {table.partitionKey} (Partition key) <span className="text-[#d13212]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter value"
                    value={queryPartitionValue}
                    onChange={(e) => setQueryPartitionValue(e.target.value)}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                    className="w-full px-3 text-[13px] border border-[#eaeded] rounded focus:outline-none focus:border-[#ec7211] mt-1"
                  />
                </div>

                {table.sortKey && (
                  <>
                    <div>
                      <label className="block text-[12px] font-bold text-[#16191f]">
                        {table.sortKey} Condition
                      </label>
                      <select
                        value={querySortOperator}
                        onChange={(e) => setQuerySortOperator(e.target.value as any)}
                        style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                        className="w-full px-3 text-[13px] border border-[#eaeded] rounded bg-white mt-1"
                      >
                        <option value="=">=</option>
                        <option value="<">&lt;</option>
                        <option value="<=">&le;</option>
                        <option value=">">&gt;</option>
                        <option value=">=">&ge;</option>
                        <option value="begins_with">begins_with</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[12px] font-bold text-[#16191f]">
                        {table.sortKey} Value
                      </label>
                      <input
                        type="text"
                        placeholder="Optional sort key value"
                        value={querySortValue}
                        onChange={(e) => setQuerySortValue(e.target.value)}
                        style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                        className="w-full px-3 text-[13px] border border-[#eaeded] rounded focus:outline-none focus:border-[#ec7211] mt-1"
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Items Table Card */}
          <div className="bg-white border border-[#eaeded] rounded shadow-sm overflow-hidden">
            {/* Items Toolbar */}
            <div className="p-4 border-b border-[#eaeded] flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="text-[14px] font-bold text-[#16191f]">
                Items returned ({items.length})
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenCreateItem}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="px-3 text-[13px] font-bold rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors"
                >
                  Create item
                </button>
                <button
                  onClick={handleOpenEditItem}
                  disabled={selectedItemIndex === null}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className={`px-3 text-[13px] font-bold rounded border transition-colors ${
                    selectedItemIndex !== null
                      ? "border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3]"
                      : "border-[#eaeded] text-[#879596] cursor-not-allowed bg-[#fafafa]"
                  }`}
                >
                  Edit item
                </button>
                <button
                  onClick={handleDeleteSelectedItem}
                  disabled={selectedItemIndex === null || isPending}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className={`px-3 text-[13px] font-bold rounded border transition-colors ${
                    selectedItemIndex !== null
                      ? "border-[#d13212] text-[#d13212] hover:bg-[#fdf2f2]"
                      : "border-[#eaeded] text-[#879596] cursor-not-allowed bg-[#fafafa]"
                  }`}
                >
                  Delete item
                </button>
              </div>
            </div>

            {/* Items Grid */}
            {items.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <p className="text-[14px] text-[#545b64]">No items returned from scan/query.</p>
                <button
                  onClick={handleOpenCreateItem}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="px-4 text-[13px] font-bold rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors"
                >
                  Create item
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-left text-[13px]">
                  <thead className="bg-[#fafafa] text-[#545b64] border-b border-[#eaeded] font-bold uppercase text-[11px] tracking-wider sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-4 py-3 w-10"></th>
                      {discoveredColumns.map((col) => (
                        <th key={col} className="px-4 py-3 whitespace-nowrap">
                          {col}
                          {col === table.partitionKey && <span className="text-[#ec7211] ml-1">(Partition)</span>}
                          {col === table.sortKey && <span className="text-[#0073bb] ml-1">(Sort)</span>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eaeded]">
                    {items.map((item, idx) => {
                      const isSelected = selectedItemIndex === idx;
                      return (
                        <tr
                          key={idx}
                          onClick={() => setSelectedItemIndex(idx)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? "bg-[#f2f8fd]" : "hover:bg-[#fafafa]"
                          }`}
                        >
                          <td className="px-4 py-3 text-center">
                            <input
                              type="radio"
                              name="selectedItem"
                              checked={isSelected}
                              onChange={() => setSelectedItemIndex(idx)}
                              className="h-4 w-4 text-[#ec7211] border-[#d5dbdb] focus:ring-[#ec7211]"
                            />
                          </td>
                          {discoveredColumns.map((col) => {
                            const valObj = item[col];
                            return (
                              <td key={col} className="px-4 py-3 font-mono text-[12px] text-[#16191f] max-w-xs truncate">
                                {valObj ? String(valObj.value) : <span className="text-[#879596] font-sans">–</span>}
                              </td>
                            );
                          })}
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

      {/* Tab 3: Indexes */}
      {activeTab === "indexes" && (
        <div className="space-y-6">
          <div className="bg-white border border-[#eaeded] rounded shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#eaeded]">
              <h2 className="text-[16px] font-bold text-[#16191f]">Global secondary indexes (GSI)</h2>
              <p className="text-[12px] text-[#545b64] mt-0.5">
                Indexes with partition key and sort key that can be different from those on the base table.
              </p>
            </div>
            {table.globalSecondaryIndexes.length === 0 ? (
              <div className="p-6 text-center text-[#545b64] text-[13px]">
                No global secondary indexes defined for this table.
              </div>
            ) : (
              <table className="w-full text-left text-[13px]">
                <thead className="bg-[#fafafa] text-[#545b64] border-b border-[#eaeded] font-bold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Index name</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Partition key</th>
                    <th className="px-4 py-3">Sort key</th>
                    <th className="px-4 py-3">Projection</th>
                    <th className="px-4 py-3">RCU / WCU</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeded]">
                  {table.globalSecondaryIndexes.map((g) => (
                    <tr key={g.IndexName} className="hover:bg-[#fafafa]">
                      <td className="px-4 py-3 font-bold text-[#16191f]">{g.IndexName}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#edf7ed] text-[#1d8102]">
                          {g.IndexStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {g.KeySchema.find((k) => k.KeyType === "HASH")?.AttributeName || "–"}
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {g.KeySchema.find((k) => k.KeyType === "RANGE")?.AttributeName || "–"}
                      </td>
                      <td className="px-4 py-3">{g.ProjectionType}</td>
                      <td className="px-4 py-3">
                        {g.ProvisionedThroughput
                          ? `${g.ProvisionedThroughput.ReadCapacityUnits} / ${g.ProvisionedThroughput.WriteCapacityUnits}`
                          : "Inherited"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="bg-white border border-[#eaeded] rounded shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#eaeded]">
              <h2 className="text-[16px] font-bold text-[#16191f]">Local secondary indexes (LSI)</h2>
              <p className="text-[12px] text-[#545b64] mt-0.5">
                Indexes that have the same partition key as the table, but a different sort key.
              </p>
            </div>
            {table.localSecondaryIndexes.length === 0 ? (
              <div className="p-6 text-center text-[#545b64] text-[13px]">
                No local secondary indexes defined for this table.
              </div>
            ) : (
              <table className="w-full text-left text-[13px]">
                <thead className="bg-[#fafafa] text-[#545b64] border-b border-[#eaeded] font-bold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Index name</th>
                    <th className="px-4 py-3">Partition key</th>
                    <th className="px-4 py-3">Sort key</th>
                    <th className="px-4 py-3">Projection</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeded]">
                  {table.localSecondaryIndexes.map((l) => (
                    <tr key={l.IndexName} className="hover:bg-[#fafafa]">
                      <td className="px-4 py-3 font-bold text-[#16191f]">{l.IndexName}</td>
                      <td className="px-4 py-3 font-mono">
                        {l.KeySchema.find((k) => k.KeyType === "HASH")?.AttributeName || "–"}
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {l.KeySchema.find((k) => k.KeyType === "RANGE")?.AttributeName || "–"}
                      </td>
                      <td className="px-4 py-3">{l.ProjectionType}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Monitor */}
      {activeTab === "monitor" && (
        <div className="space-y-6">
          <div className="bg-white border border-[#eaeded] rounded p-5 shadow-sm space-y-4">
            <h2 className="text-[16px] font-bold text-[#16191f]">CloudWatch Operational Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: "Consumed Read Capacity Units", value: "0.00 RCU", subtitle: "Average consumption" },
                { title: "Consumed Write Capacity Units", value: "0.00 WCU", subtitle: "Average consumption" },
                { title: "Throttled Read Requests", value: "0 requests", subtitle: "Read throughput limits" },
                { title: "Throttled Write Requests", value: "0 requests", subtitle: "Write throughput limits" },
                { title: "System Errors", value: "0 errors", subtitle: "5xx server errors" },
                { title: "Successful Request Latency", value: "1.2 ms", subtitle: "P99 average latency" },
              ].map((m, i) => (
                <div key={i} className="border border-[#eaeded] rounded p-4 bg-[#fafafa]">
                  <div className="text-[12px] font-bold text-[#545b64]">{m.title}</div>
                  <div className="text-[22px] font-bold text-[#16191f] mt-1">{m.value}</div>
                  <div className="text-[11px] text-[#879596] mt-0.5">{m.subtitle}</div>
                  <div className="h-16 mt-3 bg-white border border-[#eaeded] rounded flex items-center justify-center text-[11px] text-[#879596]">
                    CloudWatch metrics live stream
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Additional settings */}
      {activeTab === "settings" && (
        <div className="space-y-6">
          {/* Time to Live (TTL) Card */}
          <div className="bg-white border border-[#eaeded] rounded p-5 shadow-sm flex items-start justify-between">
            <div className="space-y-1">
              <h2 className="text-[16px] font-bold text-[#16191f]">Time to Live (TTL)</h2>
              <p className="text-[13px] text-[#545b64]">
                TTL allows you to define when items in a table expire so that they can be automatically deleted from the database.
              </p>
              <div className="pt-2 flex items-center gap-4 text-[13px]">
                <div>
                  Status:{" "}
                  <strong className={table.timeToLive?.TimeToLiveStatus === "ENABLED" ? "text-[#1d8102]" : "text-[#545b64]"}>
                    {table.timeToLive?.TimeToLiveStatus || "DISABLED"}
                  </strong>
                </div>
                {table.timeToLive?.AttributeName && (
                  <div>
                    TTL attribute: <code className="bg-[#f2f3f3] px-1.5 py-0.5 rounded">{table.timeToLive.AttributeName}</code>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowTtlModal(true)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="px-3 text-[13px] font-bold rounded border border-[#545b64] text-[#16191f] bg-white hover:bg-[#f2f3f3] transition-colors"
            >
              Manage TTL
            </button>
          </div>

          {/* Point-in-time recovery (PITR) Card */}
          <div className="bg-white border border-[#eaeded] rounded p-5 shadow-sm flex items-start justify-between">
            <div className="space-y-1">
              <h2 className="text-[16px] font-bold text-[#16191f]">Point-in-time recovery (PITR)</h2>
              <p className="text-[13px] text-[#545b64]">
                Point-in-time recovery helps protect your DynamoDB tables from accidental write or delete operations with continuous backups for up to 35 days.
              </p>
              <div className="pt-2 text-[13px]">
                Status:{" "}
                <strong className={table.continuousBackups?.PointInTimeRecoveryStatus === "ENABLED" ? "text-[#1d8102]" : "text-[#545b64]"}>
                  {table.continuousBackups?.PointInTimeRecoveryStatus || "DISABLED"}
                </strong>
              </div>
            </div>
            <button
              onClick={() => setShowPitrModal(true)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="px-3 text-[13px] font-bold rounded border border-[#545b64] text-[#16191f] bg-white hover:bg-[#f2f3f3] transition-colors"
            >
              Manage PITR
            </button>
          </div>

          {/* Deletion protection Card */}
          <div className="bg-white border border-[#eaeded] rounded p-5 shadow-sm flex items-start justify-between">
            <div className="space-y-1">
              <h2 className="text-[16px] font-bold text-[#16191f]">Deletion protection</h2>
              <p className="text-[13px] text-[#545b64]">
                Protects the table from being accidentally deleted. When enabled, any DeleteTable requests will fail.
              </p>
              <div className="pt-2 text-[13px]">
                Status: <strong>{table.deletionProtection ? "Enabled" : "Disabled"}</strong>
              </div>
            </div>
            <button
              onClick={() => setShowDelProtModal(true)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="px-3 text-[13px] font-bold rounded border border-[#545b64] text-[#16191f] bg-white hover:bg-[#f2f3f3] transition-colors"
            >
              Manage protection
            </button>
          </div>
        </div>
      )}

      {/* Tab 6: Backups */}
      {activeTab === "backups" && (
        <div className="space-y-4">
          <div className="bg-white border border-[#eaeded] rounded shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#eaeded] flex items-center justify-between">
              <div>
                <h2 className="text-[16px] font-bold text-[#16191f]">Table on-demand backups</h2>
                <p className="text-[12px] text-[#545b64]">
                  Create point-in-time on-demand backups of this table for disaster recovery or archive requirements.
                </p>
              </div>
              <button
                onClick={() => setShowCreateBackupModal(true)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-3 text-[13px] font-bold rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors"
              >
                Create backup
              </button>
            </div>

            {backupsList.length === 0 ? (
              <div className="p-8 text-center text-[#545b64] text-[13px]">
                No on-demand backups created for this table yet.
              </div>
            ) : (
              <table className="w-full text-left text-[13px]">
                <thead className="bg-[#fafafa] text-[#545b64] border-b border-[#eaeded] font-bold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Backup name</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Backup size</th>
                    <th className="px-4 py-3">Creation date</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeded]">
                  {backupsList.map((b) => (
                    <tr key={b.BackupArn} className="hover:bg-[#fafafa]">
                      <td className="px-4 py-3 font-bold text-[#16191f]">{b.BackupName}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#edf7ed] text-[#1d8102]">
                          {b.BackupStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">{b.BackupType}</td>
                      <td className="px-4 py-3">{formatBytes(b.BackupSizeBytes)}</td>
                      <td className="px-4 py-3">{new Date(b.BackupCreationDateTime).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => {
                            setSelectedBackupForRestore(b);
                            setRestoreTableName(`${b.TableName}-restored`);
                            setShowRestoreModal(true);
                          }}
                          className="text-[12px] text-[#0073bb] hover:underline font-bold"
                        >
                          Restore
                        </button>
                        <span className="text-[#eaeded]">|</span>
                        <button
                          onClick={() => {
                            startTransition(async () => {
                              const res = await deleteBackupAction(b.BackupArn);
                              if (res.success) {
                                setBackupsList(backupsList.filter((x) => x.BackupArn !== b.BackupArn));
                                setSuccessBanner(`Backup '${b.BackupName}' deleted.`);
                              }
                            });
                          }}
                          className="text-[12px] text-[#d13212] hover:underline font-bold"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Tab 7: Exports and streams */}
      {activeTab === "streams" && (
        <div className="space-y-6">
          {/* DynamoDB Streams Card */}
          <div className="bg-white border border-[#eaeded] rounded p-5 shadow-sm flex items-start justify-between">
            <div className="space-y-1">
              <h2 className="text-[16px] font-bold text-[#16191f]">DynamoDB stream details</h2>
              <p className="text-[13px] text-[#545b64]">
                Captures a time-ordered sequence of item-level modifications in a DynamoDB table.
              </p>
              <div className="pt-2 text-[13px] space-y-1">
                <div>
                  Status:{" "}
                  <strong className={table.streamSpecification?.StreamEnabled ? "text-[#1d8102]" : "text-[#545b64]"}>
                    {table.streamSpecification?.StreamEnabled ? "Enabled" : "Disabled"}
                  </strong>
                </div>
                {table.streamSpecification?.LatestStreamArn && (
                  <div className="font-mono text-[12px] text-[#545b64]">
                    Stream ARN: {table.streamSpecification.LatestStreamArn}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowStreamModal(true)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="px-3 text-[13px] font-bold rounded border border-[#545b64] text-[#16191f] bg-white hover:bg-[#f2f3f3] transition-colors"
            >
              Manage stream
            </button>
          </div>

          {/* Trigger Lambda Functions */}
          <div className="bg-white border border-[#eaeded] rounded p-5 shadow-sm flex items-start justify-between">
            <div className="space-y-1">
              <h2 className="text-[16px] font-bold text-[#16191f]">Trigger Lambda functions</h2>
              <p className="text-[13px] text-[#545b64]">
                Automatically invoke an AWS Lambda function to process changes captured by DynamoDB Streams.
              </p>
              <div className="pt-2 text-[12px] text-[#545b64]">
                Available functions: {lambdaFunctions.length} in account
              </div>
            </div>
            <button
              onClick={() => setShowLambdaModal(true)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="px-3 text-[13px] font-bold rounded border border-[#545b64] text-[#16191f] bg-white hover:bg-[#f2f3f3] transition-colors"
            >
              Create trigger
            </button>
          </div>

          {/* Export to Amazon S3 */}
          <div className="bg-white border border-[#eaeded] rounded p-5 shadow-sm flex items-start justify-between">
            <div className="space-y-1">
              <h2 className="text-[16px] font-bold text-[#16191f]">Export to Amazon S3</h2>
              <p className="text-[13px] text-[#545b64]">
                Export table data to an Amazon S3 bucket in DynamoDB JSON or Amazon Ion format for analysis or archiving.
              </p>
              <div className="pt-2 text-[12px] text-[#545b64]">
                Available buckets: {s3Buckets.length} in account
              </div>
            </div>
            <button
              onClick={() => setShowS3ExportModal(true)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="px-3 text-[13px] font-bold rounded border border-[#545b64] text-[#16191f] bg-white hover:bg-[#f2f3f3] transition-colors"
            >
              Export to S3
            </button>
          </div>

          {/* Amazon Kinesis Streaming Destination */}
          <div className="bg-white border border-[#eaeded] rounded p-5 shadow-sm flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-[16px] font-bold text-[#16191f]">Amazon Kinesis data stream destination</h2>
                {(table.kinesisDestinations || []).length > 0 ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#edf7ed] text-[#1d8102]">
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#f2f3f3] text-[#545b64]">
                    Disabled
                  </span>
                )}
              </div>
              <p className="text-[13px] text-[#545b64]">
                Stream item-level mutations to an Amazon Kinesis data stream for real-time analytics.
              </p>
              {(table.kinesisDestinations || []).length > 0 ? (
                <div className="pt-2 text-[12px] space-y-1">
                  {table.kinesisDestinations!.map((kd) => (
                    <div key={kd.StreamArn} className="flex items-center gap-3">
                      <span className="font-mono text-[#16191f]">{kd.StreamArn}</span>
                      <button
                        onClick={() => handleDisableKinesisDestination(kd.StreamArn)}
                        disabled={isUpdatingKinesis}
                        className="text-[#d13212] font-bold hover:underline text-[12px]"
                      >
                        Disable
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="pt-2 text-[12px] text-[#545b64]">
                  Capture table activity and replicate it directly into Kinesis Data Streams.
                </div>
              )}
            </div>
            {(table.kinesisDestinations || []).length === 0 && (
              <button
                onClick={() => setShowKinesisModal(true)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-3 text-[13px] font-bold rounded border border-[#545b64] text-[#16191f] bg-white hover:bg-[#f2f3f3] transition-colors"
              >
                Manage streaming to Kinesis
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tab 8: Tags */}
      {activeTab === "tags" && (
        <div className="space-y-4">
          <div className="bg-white border border-[#eaeded] rounded shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#eaeded] flex items-center justify-between">
              <div>
                <h2 className="text-[16px] font-bold text-[#16191f]">Tags</h2>
                <p className="text-[12px] text-[#545b64]">
                  Key-value tags assigned to this DynamoDB table.
                </p>
              </div>
              <button
                onClick={() => {
                  setEditableTags([...table.tags]);
                  setShowTagsModal(true);
                }}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-3 text-[13px] font-bold rounded border border-[#545b64] text-[#16191f] bg-white hover:bg-[#f2f3f3] transition-colors"
              >
                Manage tags
              </button>
            </div>

            {table.tags.length === 0 ? (
              <div className="p-6 text-center text-[#545b64] text-[13px]">
                No tags assigned to this table.
              </div>
            ) : (
              <table className="w-full text-left text-[13px]">
                <thead className="bg-[#fafafa] text-[#545b64] border-b border-[#eaeded] font-bold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Key</th>
                    <th className="px-4 py-3">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeded]">
                  {table.tags.map((t) => (
                    <tr key={t.Key} className="hover:bg-[#fafafa]">
                      <td className="px-4 py-3 font-bold text-[#16191f]">{t.Key}</td>
                      <td className="px-4 py-3 text-[#545b64]">{t.Value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Create / Edit Item */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-[#eaeded] rounded-lg shadow-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#eaeded] pb-3">
              <h3 className="text-[18px] font-bold text-[#16191f]">
                {itemModalMode === "create" ? "Create item" : "Edit item"}
              </h3>
              <div className="flex items-center gap-2 border border-[#eaeded] rounded p-0.5 text-[12px]">
                <button
                  type="button"
                  onClick={() => setItemInputFormat("form")}
                  className={`px-3 py-1 font-bold rounded ${itemInputFormat === "form" ? "bg-[#ec7211] text-white" : "text-[#545b64]"}`}
                >
                  Form
                </button>
                <button
                  type="button"
                  onClick={() => setItemInputFormat("json")}
                  className={`px-3 py-1 font-bold rounded ${itemInputFormat === "json" ? "bg-[#ec7211] text-white" : "text-[#545b64]"}`}
                >
                  JSON
                </button>
              </div>
            </div>

            {itemInputFormat === "form" ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold text-[#16191f]">Attributes</span>
                  <button
                    type="button"
                    onClick={() => setItemAttributes([...itemAttributes, { name: "", type: "S", value: "" }])}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                    className="px-2.5 text-[12px] font-bold rounded border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3]"
                  >
                    Add new attribute
                  </button>
                </div>

                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                  {itemAttributes.map((attr, idx) => {
                    const isKey = attr.name === table.partitionKey || attr.name === table.sortKey;
                    return (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Attribute name"
                          value={attr.name}
                          disabled={isKey && itemModalMode === "edit"}
                          onChange={(e) => {
                            const updated = [...itemAttributes];
                            updated[idx].name = e.target.value;
                            setItemAttributes(updated);
                          }}
                          style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                          className="w-1/3 px-3 text-[13px] border border-[#eaeded] rounded focus:outline-none focus:border-[#ec7211] disabled:bg-[#fafafa]"
                        />
                        <select
                          value={attr.type}
                          disabled={isKey && itemModalMode === "edit"}
                          onChange={(e) => {
                            const updated = [...itemAttributes];
                            updated[idx].type = e.target.value;
                            setItemAttributes(updated);
                          }}
                          style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                          className="w-28 px-2 text-[13px] border border-[#eaeded] rounded bg-white focus:outline-none focus:border-[#ec7211] disabled:bg-[#fafafa]"
                        >
                          <option value="S">String</option>
                          <option value="N">Number</option>
                          <option value="BOOL">Boolean</option>
                          <option value="NULL">Null</option>
                          <option value="B">Binary</option>
                          <option value="L">List</option>
                          <option value="M">Map</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Value"
                          value={attr.value}
                          onChange={(e) => {
                            const updated = [...itemAttributes];
                            updated[idx].value = e.target.value;
                            setItemAttributes(updated);
                          }}
                          style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                          className="flex-1 px-3 text-[13px] border border-[#eaeded] rounded focus:outline-none focus:border-[#ec7211]"
                        />
                        {!isKey && (
                          <button
                            type="button"
                            onClick={() => setItemAttributes(itemAttributes.filter((_, i) => i !== idx))}
                            className="p-1 text-[#d13212] hover:bg-[#fdf2f2] rounded"
                            title="Remove attribute"
                          >
                            &times;
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block text-[12px] font-bold text-[#16191f]">
                  Raw JSON Payload
                </label>
                <textarea
                  rows={10}
                  value={itemJsonText}
                  onChange={(e) => setItemJsonText(e.target.value)}
                  className="w-full p-3 font-mono text-[12px] border border-[#eaeded] rounded focus:outline-none focus:border-[#ec7211]"
                />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowItemModal(false)}
                disabled={isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 text-[13px] font-bold rounded border border-[#545b64] text-[#16191f] bg-white hover:bg-[#f2f3f3]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveItem}
                disabled={isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-6 text-[13px] font-bold rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
              >
                {isPending ? "Saving..." : "Save item"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Edit Capacity */}
      {showEditCapacityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-[#eaeded] rounded-lg shadow-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">Edit capacity mode</h3>
            <div className="space-y-3">
              <label className="flex items-start gap-2.5 cursor-pointer p-3 border border-[#eaeded] rounded hover:bg-[#fafafa]">
                <input
                  type="radio"
                  name="editBilling"
                  checked={editBillingMode === "PAY_PER_REQUEST"}
                  onChange={() => setEditBillingMode("PAY_PER_REQUEST")}
                  className="mt-0.5 text-[#ec7211] focus:ring-[#ec7211]"
                />
                <div>
                  <div className="text-[13px] font-bold text-[#16191f]">On-demand</div>
                  <div className="text-[12px] text-[#545b64]">Pay per request for read and write requests</div>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer p-3 border border-[#eaeded] rounded hover:bg-[#fafafa]">
                <input
                  type="radio"
                  name="editBilling"
                  checked={editBillingMode === "PROVISIONED"}
                  onChange={() => setEditBillingMode("PROVISIONED")}
                  className="mt-0.5 text-[#ec7211] focus:ring-[#ec7211]"
                />
                <div>
                  <div className="text-[13px] font-bold text-[#16191f]">Provisioned</div>
                  <div className="text-[12px] text-[#545b64]">Allocate Read and Write Capacity Units</div>
                </div>
              </label>

              {editBillingMode === "PROVISIONED" && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[12px] font-bold text-[#16191f]">RCU</label>
                    <input
                      type="number"
                      min="1"
                      value={editRcu}
                      onChange={(e) => setEditRcu(parseInt(e.target.value) || 1)}
                      style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                      className="w-full px-3 text-[13px] border border-[#eaeded] rounded mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-[#16191f]">WCU</label>
                    <input
                      type="number"
                      min="1"
                      value={editWcu}
                      onChange={(e) => setEditWcu(parseInt(e.target.value) || 1)}
                      style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                      className="w-full px-3 text-[13px] border border-[#eaeded] rounded mt-1"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowEditCapacityModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 text-[13px] font-bold rounded border border-[#545b64] text-[#16191f]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCapacity}
                disabled={isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-5 text-[13px] font-bold rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Manage TTL */}
      {showTtlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-[#eaeded] rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">Manage Time to Live (TTL)</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer text-[13px] font-bold text-[#16191f]">
                <input
                  type="checkbox"
                  checked={ttlEnabled}
                  onChange={(e) => setTtlEnabled(e.target.checked)}
                  className="h-4 w-4 text-[#ec7211] focus:ring-[#ec7211]"
                />
                <span>Enable TTL</span>
              </label>

              {ttlEnabled && (
                <div>
                  <label className="block text-[12px] font-bold text-[#16191f]">
                    TTL attribute name <span className="text-[#d13212]">*</span>
                  </label>
                  <input
                    type="text"
                    value={ttlAttribute}
                    onChange={(e) => setTtlAttribute(e.target.value)}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                    className="w-full px-3 text-[13px] border border-[#eaeded] rounded mt-1"
                  />
                  <p className="text-[11px] text-[#545b64] mt-1">
                    Items with an epoch timestamp in this attribute will be expired automatically.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowTtlModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 text-[13px] font-bold rounded border border-[#545b64] text-[#16191f]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveTtl}
                disabled={isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-5 text-[13px] font-bold rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Manage PITR */}
      {showPitrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-[#eaeded] rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">Manage Point-in-time recovery (PITR)</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer text-[13px] font-bold text-[#16191f]">
                <input
                  type="checkbox"
                  checked={pitrEnabled}
                  onChange={(e) => setPitrEnabled(e.target.checked)}
                  className="h-4 w-4 text-[#ec7211] focus:ring-[#ec7211]"
                />
                <span>Enable Point-in-time recovery</span>
              </label>
              <p className="text-[12px] text-[#545b64]">
                Continuous automatic backups allow you to restore this table to any second in the past 35 days.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowPitrModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 text-[13px] font-bold rounded border border-[#545b64] text-[#16191f]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePitr}
                disabled={isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-5 text-[13px] font-bold rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Deletion Protection */}
      {showDelProtModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-[#eaeded] rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">Manage deletion protection</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer text-[13px] font-bold text-[#16191f]">
                <input
                  type="checkbox"
                  checked={delProtEnabled}
                  onChange={(e) => setDelProtEnabled(e.target.checked)}
                  className="h-4 w-4 text-[#ec7211] focus:ring-[#ec7211]"
                />
                <span>Enable deletion protection</span>
              </label>
              <p className="text-[12px] text-[#545b64]">
                When enabled, the table cannot be deleted via the AWS Console, AWS CLI, or SDKs.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowDelProtModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 text-[13px] font-bold rounded border border-[#545b64] text-[#16191f]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveDelProt}
                disabled={isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-5 text-[13px] font-bold rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Create Backup */}
      {showCreateBackupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-[#eaeded] rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">Create on-demand backup</h3>
            <div>
              <label className="block text-[12px] font-bold text-[#16191f]">
                Backup name <span className="text-[#d13212]">*</span>
              </label>
              <input
                type="text"
                required
                value={backupNameInput}
                onChange={(e) => setBackupNameInput(e.target.value)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                className="w-full px-3 text-[13px] border border-[#eaeded] rounded mt-1"
              />
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowCreateBackupModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 text-[13px] font-bold rounded border border-[#545b64] text-[#16191f]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateBackup}
                disabled={isPending || !backupNameInput.trim()}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-5 text-[13px] font-bold rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
              >
                {isPending ? "Creating..." : "Create backup"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Restore Backup */}
      {showRestoreModal && selectedBackupForRestore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-[#eaeded] rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">
              Restore table from backup: {selectedBackupForRestore.BackupName}
            </h3>
            <p className="text-[13px] text-[#545b64]">
              Restoring creates a brand new table with data populated from this point-in-time snapshot.
            </p>
            <div>
              <label className="block text-[12px] font-bold text-[#16191f]">
                Target table name <span className="text-[#d13212]">*</span>
              </label>
              <input
                type="text"
                required
                value={restoreTableName}
                onChange={(e) => setRestoreTableName(e.target.value)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                className="w-full px-3 text-[13px] border border-[#eaeded] rounded mt-1"
              />
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowRestoreModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 text-[13px] font-bold rounded border border-[#545b64] text-[#16191f]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRestoreBackup}
                disabled={isPending || !restoreTableName.trim()}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-5 text-[13px] font-bold rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
              >
                {isPending ? "Restoring..." : "Restore table"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Streams Configuration */}
      {showStreamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-[#eaeded] rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">Manage DynamoDB stream</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer text-[13px] font-bold text-[#16191f]">
                <input
                  type="checkbox"
                  checked={streamEnabledState}
                  onChange={(e) => setStreamEnabledState(e.target.checked)}
                  className="h-4 w-4 text-[#ec7211] focus:ring-[#ec7211]"
                />
                <span>Enable DynamoDB stream</span>
              </label>

              {streamEnabledState && (
                <div>
                  <label className="block text-[12px] font-bold text-[#16191f]">
                    View type
                  </label>
                  <select
                    value={streamViewType}
                    onChange={(e) => setStreamViewType(e.target.value as any)}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                    className="w-full px-3 text-[13px] border border-[#eaeded] rounded bg-white mt-1"
                  >
                    <option value="NEW_AND_OLD_IMAGES">New and old images</option>
                    <option value="NEW_IMAGE">New image only</option>
                    <option value="OLD_IMAGE">Old image only</option>
                    <option value="KEYS_ONLY">Keys only</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowStreamModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 text-[13px] font-bold rounded border border-[#545b64] text-[#16191f]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveStream}
                disabled={isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-5 text-[13px] font-bold rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Lambda Trigger */}
      {showLambdaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-[#eaeded] rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">Create Lambda trigger</h3>
            <p className="text-[13px] text-[#545b64]">
              Select a Lambda function to invoke whenever items are created, modified, or deleted in this table.
            </p>
            {lambdaFunctions.length === 0 ? (
              <div className="p-3 bg-[#f2f8fd] border border-[#eaeded] rounded text-[12px] text-[#545b64]">
                No Lambda functions found in this Region.{" "}
                <Link href="/lambda" className="text-[#0073bb] underline">
                  Create a function in AWS Lambda
                </Link>
              </div>
            ) : (
              <div>
                <label className="block text-[12px] font-bold text-[#16191f]">Lambda function</label>
                <select
                  value={selectedLambdaArn}
                  onChange={(e) => setSelectedLambdaArn(e.target.value)}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                  className="w-full px-3 text-[13px] border border-[#eaeded] rounded bg-white mt-1"
                >
                  {lambdaFunctions.map((f) => (
                    <option key={f.FunctionArn} value={f.FunctionArn}>
                      {f.FunctionName} ({f.Runtime || "custom"})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowLambdaModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 text-[13px] font-bold rounded border border-[#545b64] text-[#16191f]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLambdaModal(false);
                  setSuccessBanner("Lambda trigger configured successfully.");
                }}
                disabled={lambdaFunctions.length === 0}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-5 text-[13px] font-bold rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] disabled:opacity-50"
              >
                Create trigger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: S3 Export */}
      {showS3ExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-[#eaeded] rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">Export table to Amazon S3</h3>
            <p className="text-[13px] text-[#545b64]">
              Select an existing Amazon S3 bucket destination to store table exports.
            </p>
            {s3Buckets.length === 0 ? (
              <div className="p-3 bg-[#f2f8fd] border border-[#eaeded] rounded text-[12px] text-[#545b64]">
                No S3 buckets found.{" "}
                <Link href="/s3" className="text-[#0073bb] underline">
                  Create bucket in Amazon S3
                </Link>
              </div>
            ) : (
              <div>
                <label className="block text-[12px] font-bold text-[#16191f]">Destination bucket</label>
                <select
                  value={selectedS3Bucket}
                  onChange={(e) => setSelectedS3Bucket(e.target.value)}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                  className="w-full px-3 text-[13px] border border-[#eaeded] rounded bg-white mt-1"
                >
                  {s3Buckets.map((b) => (
                    <option key={b.Name} value={b.Name}>
                      {b.Name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowS3ExportModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 text-[13px] font-bold rounded border border-[#545b64] text-[#16191f]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowS3ExportModal(false);
                  setSuccessBanner(`Export job initiated to S3 bucket '${selectedS3Bucket}'.`);
                }}
                disabled={s3Buckets.length === 0}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-5 text-[13px] font-bold rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] disabled:opacity-50"
              >
                Export
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Manage Tags */}
      {showTagsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-[#eaeded] rounded-lg shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#eaeded] pb-2">
              <h3 className="text-[18px] font-bold text-[#16191f]">Manage tags</h3>
              <button
                type="button"
                onClick={() => setEditableTags([...editableTags, { Key: "", Value: "" }])}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-3 text-[12px] font-bold rounded border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3]"
              >
                Add new tag
              </button>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {editableTags.map((t, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Key"
                    value={t.Key}
                    onChange={(e) => {
                      const updated = [...editableTags];
                      updated[idx].Key = e.target.value;
                      setEditableTags(updated);
                    }}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                    className="flex-1 px-3 text-[13px] border border-[#eaeded] rounded"
                  />
                  <input
                    type="text"
                    placeholder="Value"
                    value={t.Value}
                    onChange={(e) => {
                      const updated = [...editableTags];
                      updated[idx].Value = e.target.value;
                      setEditableTags(updated);
                    }}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                    className="flex-1 px-3 text-[13px] border border-[#eaeded] rounded"
                  />
                  <button
                    type="button"
                    onClick={() => setEditableTags(editableTags.filter((_, i) => i !== idx))}
                    className="p-1 text-[#d13212] hover:bg-[#fdf2f2] rounded"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowTagsModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 text-[13px] font-bold rounded border border-[#545b64] text-[#16191f]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveTags}
                disabled={isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-5 text-[13px] font-bold rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
              >
                Save tags
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Kinesis Streaming Destination */}
      {showKinesisModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-[#eaeded] rounded-lg shadow-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">
              Manage streaming to Amazon Kinesis
            </h3>
            <p className="text-[13px] text-[#545b64]">
              Select an Amazon Kinesis data stream destination to replicate table changes in real time.
            </p>

            {kinesisStreams.length === 0 ? (
              <div className="p-4 bg-[#fafafa] border border-[#eaeded] rounded text-[13px] text-[#545b64] space-y-2">
                <div>No Amazon Kinesis data streams found in this Region.</div>
                <Link
                  href="/kinesis/streams/create"
                  className="inline-block text-[#0073bb] font-bold hover:underline"
                >
                  Create a data stream in Amazon Kinesis &rarr;
                </Link>
              </div>
            ) : (
              <div>
                <label className="block text-[12px] font-bold text-[#16191f]">
                  Destination Kinesis data stream <span className="text-[#d13212]">*</span>
                </label>
                <select
                  value={selectedKinesisArn}
                  onChange={(e) => setSelectedKinesisArn(e.target.value)}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                  className="mt-1 w-full px-3 text-[13px] border border-[#eaeded] rounded bg-white"
                >
                  {kinesisStreams.map((s) => (
                    <option key={s.StreamArn} value={s.StreamArn}>
                      {s.StreamName} ({s.StreamArn})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowKinesisModal(false)}
                disabled={isUpdatingKinesis}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 text-[13px] font-bold rounded border border-[#545b64] text-[#16191f] bg-white hover:bg-[#f2f3f3]"
              >
                Cancel
              </button>
              {kinesisStreams.length > 0 && (
                <button
                  type="button"
                  onClick={handleEnableKinesisDestination}
                  disabled={isUpdatingKinesis || !selectedKinesisArn}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="px-5 text-[13px] font-bold rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] disabled:opacity-50"
                >
                  {isUpdatingKinesis ? "Enabling..." : "Turn on stream"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Delete Table */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-[#eaeded] rounded-lg shadow-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">
              Delete table: {table.name}
            </h3>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to permanently delete table <strong className="text-[#16191f]">{table.name}</strong>?
              All {table.itemCount} item(s) and {table.globalSecondaryIndexes.length} secondary index(es) will be deleted immediately.
            </p>

            <div className="bg-[#fdf2f2] border-l-4 border-[#d13212] p-3 text-[13px] text-[#d13212]">
              To confirm deletion, type <strong className="font-mono">{table.name}</strong> below:
            </div>

            <div>
              <input
                type="text"
                placeholder={table.name}
                value={confirmDeleteInput}
                onChange={(e) => setConfirmDeleteInput(e.target.value)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                className="w-full px-3 text-[13px] border border-[#eaeded] rounded focus:outline-none focus:border-[#ec7211]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setConfirmDeleteInput("");
                }}
                disabled={isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 text-[13px] font-bold rounded border border-[#545b64] text-[#16191f] bg-white hover:bg-[#f2f3f3]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteTable}
                disabled={confirmDeleteInput !== table.name || isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className={`px-5 text-[13px] font-bold rounded transition-colors ${
                  confirmDeleteInput === table.name && !isPending
                    ? "bg-[#d13212] text-white hover:bg-[#b02a0f]"
                    : "bg-[#eaeded] text-[#879596] cursor-not-allowed"
                }`}
              >
                {isPending ? "Deleting..." : "Delete table"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
