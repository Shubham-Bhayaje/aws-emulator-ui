"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KmsKeyOption } from "../../types";
import { createTableAction } from "../../actions";

interface CreateTableClientProps {
  keyspaceName: string;
  kmsKeys: KmsKeyOption[];
  initialError?: string;
}

interface ColumnFormItem {
  id: string;
  name: string;
  type: string;
  keyRole: "PARTITION" | "CLUSTERING" | "REGULAR";
  clusteringOrder: "ASC" | "DESC";
}

const CASSANDRA_DATA_TYPES = [
  "text",
  "ascii",
  "bigint",
  "blob",
  "boolean",
  "counter",
  "date",
  "decimal",
  "double",
  "float",
  "inet",
  "int",
  "smallint",
  "time",
  "timestamp",
  "timeuuid",
  "tinyint",
  "uuid",
  "varchar",
  "varint",
];

export default function CreateTableClient({
  keyspaceName,
  kmsKeys,
  initialError,
}: CreateTableClientProps) {
  const router = useRouter();
  const [tableName, setTableName] = useState("");
  const [columns, setColumns] = useState<ColumnFormItem[]>([
    { id: "col-1", name: "id", type: "uuid", keyRole: "PARTITION", clusteringOrder: "ASC" },
    { id: "col-2", name: "created_at", type: "timestamp", keyRole: "CLUSTERING", clusteringOrder: "DESC" },
    { id: "col-3", name: "payload", type: "text", keyRole: "REGULAR", clusteringOrder: "ASC" },
  ]);

  // Capacity Mode
  const [capacityMode, setCapacityMode] = useState<"PAY_PER_REQUEST" | "PROVISIONED">("PAY_PER_REQUEST");
  const [rcu, setRcu] = useState(5);
  const [wcu, setWcu] = useState(5);

  // Encryption
  const [encryptionType, setEncryptionType] = useState<"AWS_OWNED_KMS_KEY" | "CUSTOMER_MANAGED_KMS_KEY">("AWS_OWNED_KMS_KEY");
  const [selectedKmsKey, setSelectedKmsKey] = useState<string>(kmsKeys[0]?.KeyArn || "");

  // PITR
  const [enablePitr, setEnablePitr] = useState(false);

  // TTL
  const [enableTtl, setEnableTtl] = useState(false);
  const [ttlSeconds, setTtlSeconds] = useState(86400);

  // Tags
  const [tags, setTags] = useState<{ key: string; value: string }[]>([]);

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(initialError || null);

  const isValidTableName = /^[a-zA-Z0-9_]{1,48}$/.test(tableName.trim());

  function handleAddColumn() {
    setColumns([
      ...columns,
      {
        id: `col-${Date.now()}`,
        name: "",
        type: "text",
        keyRole: "REGULAR",
        clusteringOrder: "ASC",
      },
    ]);
  }

  function handleRemoveColumn(id: string) {
    if (columns.length <= 1) return;
    setColumns(columns.filter((c) => c.id !== id));
  }

  function handleColumnChange(id: string, field: keyof ColumnFormItem, value: string) {
    setColumns(
      columns.map((c) => {
        if (c.id === id) {
          return { ...c, [field]: value };
        }
        return c;
      })
    );
  }

  function handleAddTag() {
    setTags([...tags, { key: "", value: "" }]);
  }

  function handleRemoveTag(idx: number) {
    setTags(tags.filter((_, i) => i !== idx));
  }

  function handleTagChange(idx: number, field: "key" | "value", val: string) {
    const updated = [...tags];
    updated[idx][field] = val;
    setTags(updated);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidTableName) {
      setError("Table name must be 1-48 alphanumeric characters and underscores.");
      return;
    }

    const partitionKeys = columns.filter((c) => c.keyRole === "PARTITION");
    if (partitionKeys.length === 0) {
      setError("Table must have at least one partition key column.");
      return;
    }

    const hasEmptyColName = columns.some((c) => !c.name.trim());
    if (hasEmptyColName) {
      setError("All columns must have a valid column name.");
      return;
    }

    const colNames = columns.map((c) => c.name.trim().toLowerCase());
    const uniqueColNames = new Set(colNames);
    if (uniqueColNames.size !== colNames.length) {
      setError("Column names must be unique within the table.");
      return;
    }

    setError(null);

    const clusteringKeys = columns
      .filter((c) => c.keyRole === "CLUSTERING")
      .map((c) => ({
        name: c.name.trim(),
        orderBy: c.clusteringOrder,
      }));

    const schemaDefinition = {
      allColumns: columns.map((c) => ({
        name: c.name.trim(),
        type: c.type,
      })),
      partitionKeys: partitionKeys.map((p) => ({
        name: p.name.trim(),
      })),
      clusteringKeys,
    };

    const tagRecord: Record<string, string> = {};
    for (const t of tags) {
      if (t.key.trim()) {
        tagRecord[t.key.trim()] = t.value.trim();
      }
    }

    startTransition(async () => {
      const res = await createTableAction({
        keyspaceName,
        tableName: tableName.trim(),
        schemaDefinition,
        capacitySpecification: {
          throughputMode: capacityMode,
          readCapacityUnits: capacityMode === "PROVISIONED" ? Number(rcu) : undefined,
          writeCapacityUnits: capacityMode === "PROVISIONED" ? Number(wcu) : undefined,
        },
        encryptionSpecification: {
          type: encryptionType,
          kmsKeyIdentifier: encryptionType === "CUSTOMER_MANAGED_KMS_KEY" ? selectedKmsKey : undefined,
        },
        pointInTimeRecovery: {
          status: enablePitr ? "ENABLED" : "DISABLED",
        },
        defaultTimeToLive: enableTtl ? Number(ttlSeconds) : 0,
        tags: Object.keys(tagRecord).length > 0 ? tagRecord : undefined,
      });

      if (res.success) {
        router.push(`/keyspaces/${encodeURIComponent(keyspaceName)}/tables/${encodeURIComponent(tableName.trim())}`);
      } else {
        setError(res.error || "Failed to create table.");
      }
    });
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Breadcrumb */}
      <div className="text-[12px] text-[#545b64] flex items-center gap-1.5">
        <Link href="/" className="hover:underline text-[#0073bb]">Console Home</Link>
        <span>/</span>
        <Link href="/keyspaces" className="hover:underline text-[#0073bb]">Keyspaces</Link>
        <span>/</span>
        <Link href={`/keyspaces/${encodeURIComponent(keyspaceName)}`} className="hover:underline text-[#0073bb]">
          {keyspaceName}
        </Link>
        <span>/</span>
        <span className="text-[#16191f] font-medium">Create table</span>
      </div>

      <div>
        <h1 className="text-[24px] font-bold text-[#16191f]">Create table</h1>
        <p className="text-[14px] text-[#545b64] mt-0.5">
          Define the schema, capacity mode, encryption, and recovery settings for a table in keyspace{" "}
          <strong className="font-mono text-[#16191f]">{keyspaceName}</strong>.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-[#fdf2f2] border-l-4 border-[#d13212] text-[13px] text-[#d13212] rounded flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="font-bold">&times;</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Table Details Card */}
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
          <h2 className="text-[16px] font-bold text-[#16191f]">Table details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[13px] font-bold text-[#16191f]">
                Keyspace name
              </label>
              <input
                type="text"
                value={keyspaceName}
                disabled
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                className="w-full px-3 border border-[#eaeded] bg-[#f2f3f3] text-[#545b64] rounded font-mono text-[13px] cursor-not-allowed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[13px] font-bold text-[#16191f]">
                Table name
              </label>
              <input
                type="text"
                placeholder="users"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                className="w-full px-3 border border-[#eaeded] rounded focus:outline-none focus:border-[#ec7211] font-mono text-[13px]"
                required
              />
              <p className="text-[11px] text-[#545b64]">
                1 to 48 characters (letters, numbers, underscores).
              </p>
            </div>
          </div>
        </div>

        {/* Schema Definition Card */}
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[16px] font-bold text-[#16191f]">Columns & primary key</h2>
              <p className="text-[12px] text-[#545b64]">
                Specify table columns and designate at least one Partition Key (HASH).
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddColumn}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center px-3 border border-[#545b64] text-[#16191f] rounded font-bold text-[12px] hover:bg-[#f2f3f3]"
            >
              Add column
            </button>
          </div>

          <div className="overflow-x-auto border border-[#eaeded] rounded">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[#fafafa] text-[#545b64] border-b border-[#eaeded] font-bold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-2.5">Column name</th>
                  <th className="px-4 py-2.5">Data type</th>
                  <th className="px-4 py-2.5">Key role</th>
                  <th className="px-4 py-2.5">Clustering order</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded]">
                {columns.map((col) => (
                  <tr key={col.id} className="hover:bg-[#fafafa]">
                    <td className="px-4 py-2.5">
                      <input
                        type="text"
                        placeholder="column_name"
                        value={col.name}
                        onChange={(e) => handleColumnChange(col.id, "name", e.target.value)}
                        style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                        className="w-full px-2.5 border border-[#eaeded] rounded text-[13px] font-mono"
                        required
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      <select
                        value={col.type}
                        onChange={(e) => handleColumnChange(col.id, "type", e.target.value)}
                        style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                        className="w-full px-2.5 border border-[#eaeded] rounded text-[13px] bg-white font-mono"
                      >
                        {CASSANDRA_DATA_TYPES.map((dt) => (
                          <option key={dt} value={dt}>
                            {dt}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2.5">
                      <select
                        value={col.keyRole}
                        onChange={(e) =>
                          handleColumnChange(col.id, "keyRole", e.target.value as "PARTITION" | "CLUSTERING" | "REGULAR")
                        }
                        style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                        className="w-full px-2.5 border border-[#eaeded] rounded text-[13px] bg-white"
                      >
                        <option value="PARTITION">Partition key</option>
                        <option value="CLUSTERING">Clustering key</option>
                        <option value="REGULAR">Regular column</option>
                      </select>
                    </td>
                    <td className="px-4 py-2.5">
                      {col.keyRole === "CLUSTERING" ? (
                        <select
                          value={col.clusteringOrder}
                          onChange={(e) =>
                            handleColumnChange(col.id, "clusteringOrder", e.target.value as "ASC" | "DESC")
                          }
                          style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                          className="w-full px-2.5 border border-[#eaeded] rounded text-[13px] bg-white"
                        >
                          <option value="ASC">Ascending (ASC)</option>
                          <option value="DESC">Descending (DESC)</option>
                        </select>
                      ) : (
                        <span className="text-[#aab7b8] text-[12px] italic">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveColumn(col.id)}
                        disabled={columns.length <= 1}
                        style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                        className={`text-[12px] font-bold ${
                          columns.length <= 1
                            ? "text-[#aab7b8] cursor-not-allowed"
                            : "text-[#d13212] hover:underline cursor-pointer"
                        }`}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Capacity Mode Card */}
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
          <h2 className="text-[16px] font-bold text-[#16191f]">Capacity mode</h2>
          <p className="text-[12px] text-[#545b64]">
            Choose how you want to be billed for read and write throughput.
          </p>

          <div className="space-y-3">
            <label className="flex items-start gap-3 p-3 border border-[#eaeded] rounded cursor-pointer hover:bg-[#fafafa]">
              <input
                type="radio"
                name="capacity_mode"
                value="PAY_PER_REQUEST"
                checked={capacityMode === "PAY_PER_REQUEST"}
                onChange={() => setCapacityMode("PAY_PER_REQUEST")}
                className="mt-1 h-4 w-4 text-[#ec7211]"
              />
              <div className="space-y-1">
                <span className="font-bold text-[13px] text-[#16191f]">On-demand (Default)</span>
                <p className="text-[12px] text-[#545b64]">
                  Flexible capacity that automatically accommodates unpredictable workloads. You pay only for read and write requests performed.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 border border-[#eaeded] rounded cursor-pointer hover:bg-[#fafafa]">
              <input
                type="radio"
                name="capacity_mode"
                value="PROVISIONED"
                checked={capacityMode === "PROVISIONED"}
                onChange={() => setCapacityMode("PROVISIONED")}
                className="mt-1 h-4 w-4 text-[#ec7211]"
              />
              <div className="space-y-1 flex-1">
                <span className="font-bold text-[13px] text-[#16191f]">Provisioned</span>
                <p className="text-[12px] text-[#545b64]">
                  Specify the number of read and write units expected. Best for predictable traffic patterns.
                </p>

                {capacityMode === "PROVISIONED" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3">
                    <div className="space-y-1">
                      <label className="block text-[12px] font-bold text-[#16191f]">Read capacity units (RCU)</label>
                      <input
                        type="number"
                        min="1"
                        value={rcu}
                        onChange={(e) => setRcu(Math.max(1, parseInt(e.target.value) || 1))}
                        style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                        className="w-full px-3 border border-[#eaeded] rounded text-[13px]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[12px] font-bold text-[#16191f]">Write capacity units (WCU)</label>
                      <input
                        type="number"
                        min="1"
                        value={wcu}
                        onChange={(e) => setWcu(Math.max(1, parseInt(e.target.value) || 1))}
                        style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                        className="w-full px-3 border border-[#eaeded] rounded text-[13px]"
                      />
                    </div>
                  </div>
                )}
              </div>
            </label>
          </div>
        </div>

        {/* Encryption at Rest Card */}
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
          <h2 className="text-[16px] font-bold text-[#16191f]">Encryption at rest</h2>
          <p className="text-[12px] text-[#545b64]">
            All data in Amazon Keyspaces is encrypted at rest using AWS Key Management Service (KMS).
          </p>

          <div className="space-y-3">
            <label className="flex items-start gap-3 p-3 border border-[#eaeded] rounded cursor-pointer hover:bg-[#fafafa]">
              <input
                type="radio"
                name="encryption_type"
                value="AWS_OWNED_KMS_KEY"
                checked={encryptionType === "AWS_OWNED_KMS_KEY"}
                onChange={() => setEncryptionType("AWS_OWNED_KMS_KEY")}
                className="mt-1 h-4 w-4 text-[#ec7211]"
              />
              <div className="space-y-1">
                <span className="font-bold text-[13px] text-[#16191f]">AWS owned key (Default)</span>
                <p className="text-[12px] text-[#545b64]">
                  No additional charge. The table is protected by a multi-tenant AWS Key Management Service key owned by Amazon Keyspaces.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 border border-[#eaeded] rounded cursor-pointer hover:bg-[#fafafa]">
              <input
                type="radio"
                name="encryption_type"
                value="CUSTOMER_MANAGED_KMS_KEY"
                checked={encryptionType === "CUSTOMER_MANAGED_KMS_KEY"}
                onChange={() => setEncryptionType("CUSTOMER_MANAGED_KMS_KEY")}
                className="mt-1 h-4 w-4 text-[#ec7211]"
              />
              <div className="space-y-1 flex-1">
                <span className="font-bold text-[13px] text-[#16191f]">Customer managed key (KMS)</span>
                <p className="text-[12px] text-[#545b64]">
                  Use a customer managed key stored in your account to maintain full control of encryption keys and policies.
                </p>

                {encryptionType === "CUSTOMER_MANAGED_KMS_KEY" && (
                  <div className="pt-2">
                    {kmsKeys.length === 0 ? (
                      <div className="p-3 bg-[#f2f8fd] border border-[#bce2f5] rounded text-[12px] text-[#0073bb]">
                        No customer managed keys found in this Region.{" "}
                        <Link href="/kms/create" className="underline font-bold">
                          Create a KMS key in KMS
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <label className="block text-[12px] font-bold text-[#16191f]">Select KMS key</label>
                        <select
                          value={selectedKmsKey}
                          onChange={(e) => setSelectedKmsKey(e.target.value)}
                          style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                          className="w-full max-w-lg px-3 border border-[#eaeded] rounded text-[13px] bg-white font-mono"
                        >
                          {kmsKeys.map((k) => (
                            <option key={k.KeyId} value={k.KeyArn}>
                              {k.AliasName ? `${k.AliasName} (${k.KeyId.slice(0, 8)}...)` : k.KeyArn}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </label>
          </div>
        </div>

        {/* Additional Settings: PITR & TTL */}
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
          <h2 className="text-[16px] font-bold text-[#16191f]">Point-in-time recovery & Time to live</h2>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="pitr_checkbox"
                checked={enablePitr}
                onChange={(e) => setEnablePitr(e.target.checked)}
                className="mt-1 h-4 w-4 text-[#ec7211] rounded border-[#eaeded]"
              />
              <label htmlFor="pitr_checkbox" className="cursor-pointer space-y-1">
                <span className="font-bold text-[13px] text-[#16191f]">Enable Point-in-time recovery (PITR)</span>
                <p className="text-[12px] text-[#545b64]">
                  Continuous automated backups that protect your table from accidental writes or deletes. Restore to any second during the last 35 days.
                </p>
              </label>
            </div>

            <div className="flex items-start gap-3 pt-2 border-t border-[#eaeded]">
              <input
                type="checkbox"
                id="ttl_checkbox"
                checked={enableTtl}
                onChange={(e) => setEnableTtl(e.target.checked)}
                className="mt-1 h-4 w-4 text-[#ec7211] rounded border-[#eaeded]"
              />
              <div className="cursor-pointer space-y-1 flex-1">
                <label htmlFor="ttl_checkbox" className="font-bold text-[13px] text-[#16191f]">
                  Enable Default Time to Live (TTL)
                </label>
                <p className="text-[12px] text-[#545b64]">
                  Automatically expire rows after a specified duration in seconds.
                </p>

                {enableTtl && (
                  <div className="pt-2 max-w-xs space-y-1">
                    <label className="block text-[12px] font-bold text-[#16191f]">Duration (seconds)</label>
                    <input
                      type="number"
                      min="1"
                      value={ttlSeconds}
                      onChange={(e) => setTtlSeconds(Math.max(1, parseInt(e.target.value) || 1))}
                      style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                      className="w-full px-3 border border-[#eaeded] rounded text-[13px]"
                    />
                    <p className="text-[11px] text-[#545b64]">86400 seconds = 1 day</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[16px] font-bold text-[#16191f]">Tags (optional)</h2>
              <p className="text-[12px] text-[#545b64]">
                Assign custom metadata tags to this table.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddTag}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center px-3 border border-[#545b64] text-[#16191f] rounded font-bold text-[12px] hover:bg-[#f2f3f3]"
            >
              Add new tag
            </button>
          </div>

          {tags.length > 0 && (
            <div className="space-y-2">
              {tags.map((tag, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Key"
                    value={tag.key}
                    onChange={(e) => handleTagChange(idx, "key", e.target.value)}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                    className="flex-1 px-3 border border-[#eaeded] rounded text-[13px]"
                  />
                  <input
                    type="text"
                    placeholder="Value"
                    value={tag.value}
                    onChange={(e) => handleTagChange(idx, "value", e.target.value)}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                    className="flex-1 px-3 border border-[#eaeded] rounded text-[13px]"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(idx)}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                    className="px-3 text-[#d13212] font-bold text-[12px] hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href={`/keyspaces/${encodeURIComponent(keyspaceName)}`}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center justify-center px-4 rounded border border-[#545b64] text-[#16191f] font-bold text-[13px] hover:bg-[#f2f3f3]"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={!isValidTableName || isPending}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className={`inline-flex items-center justify-center px-5 rounded font-bold text-[13px] text-white transition-colors ${
              isValidTableName && !isPending
                ? "bg-[#ec7211] hover:bg-[#eb5f07] cursor-pointer"
                : "bg-[#eaeded] text-[#aab7b8] cursor-not-allowed"
            }`}
          >
            {isPending ? "Creating table..." : "Create table"}
          </button>
        </div>
      </form>
    </div>
  );
}
