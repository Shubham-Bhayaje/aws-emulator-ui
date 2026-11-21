"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createTableAction } from "../../actions";
import { KmsKeyOption } from "../../types";

interface CreateTableClientProps {
  kmsKeys: KmsKeyOption[];
}

export default function CreateTableClient({ kmsKeys }: CreateTableClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [tableName, setTableName] = useState("");
  const [partitionKeyName, setPartitionKeyName] = useState("");
  const [partitionKeyType, setPartitionKeyType] = useState<"S" | "N" | "B">("S");
  const [hasSortKey, setHasSortKey] = useState(false);
  const [sortKeyName, setSortKeyName] = useState("");
  const [sortKeyType, setSortKeyType] = useState<"S" | "N" | "B">("S");

  // Settings: Default vs Customize
  const [settingsMode, setSettingsMode] = useState<"default" | "custom">("default");
  const [billingMode, setBillingMode] = useState<"PAY_PER_REQUEST" | "PROVISIONED">("PAY_PER_REQUEST");
  const [readCapacityUnits, setReadCapacityUnits] = useState(5);
  const [writeCapacityUnits, setWriteCapacityUnits] = useState(5);
  const [deletionProtection, setDeletionProtection] = useState(false);

  // Encryption
  const [sseType, setSseType] = useState<"DEFAULT" | "AWS_MANAGED" | "KMS">("DEFAULT");
  const [selectedKmsKeyId, setSelectedKmsKeyId] = useState<string>(kmsKeys[0]?.KeyId || "");

  // Tags
  const [tags, setTags] = useState<{ Key: string; Value: string }[]>([]);

  function handleAddTag() {
    setTags([...tags, { Key: "", Value: "" }]);
  }

  function handleRemoveTag(index: number) {
    setTags(tags.filter((_, i) => i !== index));
  }

  function handleTagChange(index: number, field: "Key" | "Value", val: string) {
    const updated = [...tags];
    updated[index][field] = val;
    setTags(updated);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!tableName.trim()) {
      setError("Table name is required.");
      return;
    }
    if (!partitionKeyName.trim()) {
      setError("Partition key name is required.");
      return;
    }
    if (hasSortKey && !sortKeyName.trim()) {
      setError("Sort key name is required when sort key is enabled.");
      return;
    }

    startTransition(async () => {
      const res = await createTableAction({
        tableName: tableName.trim(),
        partitionKeyName: partitionKeyName.trim(),
        partitionKeyType,
        hasSortKey,
        sortKeyName: hasSortKey ? sortKeyName.trim() : undefined,
        sortKeyType: hasSortKey ? sortKeyType : undefined,
        billingMode: settingsMode === "default" ? "PAY_PER_REQUEST" : billingMode,
        readCapacityUnits: settingsMode === "custom" && billingMode === "PROVISIONED" ? readCapacityUnits : undefined,
        writeCapacityUnits: settingsMode === "custom" && billingMode === "PROVISIONED" ? writeCapacityUnits : undefined,
        deletionProtection: settingsMode === "custom" ? deletionProtection : false,
        sseType: settingsMode === "custom" && sseType === "KMS" ? "KMS" : "DEFAULT",
        kmsMasterKeyId: settingsMode === "custom" && sseType === "KMS" ? selectedKmsKeyId : undefined,
        tags: tags.filter((t) => t.Key.trim() !== ""),
      });

      if (res.success && res.tableName) {
        router.push(`/dynamodb/tables/${encodeURIComponent(res.tableName)}`);
      } else {
        setError(res.error || "Failed to create DynamoDB table.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-[24px] font-bold text-[#16191f]">Create table</h1>
        <p className="text-[14px] text-[#545b64] mt-0.5">
          A table is a collection of data in Amazon DynamoDB. To learn more, see{" "}
          <span className="text-[#0073bb]">Core Components of Amazon DynamoDB</span>.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-[#fdf2f2] border-l-4 border-[#d13212] text-[13px] text-[#d13212] rounded">
          {error}
        </div>
      )}

      {/* Table details Card */}
      <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-5">
        <div>
          <h2 className="text-[16px] font-bold text-[#16191f]">Table details</h2>
          <p className="text-[13px] text-[#545b64]">
            Specify the primary key of the table. You cannot change the primary key schema after the table is created.
          </p>
        </div>

        {/* Table Name */}
        <div className="space-y-1">
          <label className="block text-[13px] font-bold text-[#16191f]">
            Table name <span className="text-[#d13212]">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Users"
            value={tableName}
            onChange={(e) => setTableName(e.target.value)}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
            className="w-full max-w-lg px-3 text-[13px] border border-[#eaeded] rounded focus:outline-none focus:border-[#ec7211]"
          />
          <p className="text-[12px] text-[#545b64]">
            Must be 3 to 255 characters and contain only letters, numbers, underscores (_), dashes (-), and dots (.).
          </p>
        </div>

        {/* Partition Key */}
        <div className="space-y-2 pt-2 border-t border-[#eaeded]">
          <label className="block text-[13px] font-bold text-[#16191f]">
            Partition key <span className="text-[#d13212]">*</span>
          </label>
          <p className="text-[12px] text-[#545b64]">
            Part of the primary key used to partition data across multiple storage partitions.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-lg">
            <div className="flex-1">
              <input
                type="text"
                required
                placeholder="e.g. userId"
                value={partitionKeyName}
                onChange={(e) => setPartitionKeyName(e.target.value)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                className="w-full px-3 text-[13px] border border-[#eaeded] rounded focus:outline-none focus:border-[#ec7211]"
              />
            </div>
            <div className="w-40">
              <select
                value={partitionKeyType}
                onChange={(e) => setPartitionKeyType(e.target.value as any)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                className="w-full px-3 text-[13px] border border-[#eaeded] rounded bg-white focus:outline-none focus:border-[#ec7211]"
              >
                <option value="S">String</option>
                <option value="N">Number</option>
                <option value="B">Binary</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sort Key (optional) */}
        <div className="space-y-3 pt-2 border-t border-[#eaeded]">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="sortKeyToggle"
              checked={hasSortKey}
              onChange={(e) => setHasSortKey(e.target.checked)}
              className="h-4 w-4 text-[#ec7211] border-[#d5dbdb] rounded focus:ring-[#ec7211]"
            />
            <label htmlFor="sortKeyToggle" className="text-[13px] font-bold text-[#16191f] cursor-pointer">
              Add sort key (optional)
            </label>
          </div>
          <p className="text-[12px] text-[#545b64]">
            A sort key lets you sort and search items within the same partition key.
          </p>

          {hasSortKey && (
            <div className="flex flex-col sm:flex-row gap-3 max-w-lg pl-6">
              <div className="flex-1">
                <input
                  type="text"
                  required={hasSortKey}
                  placeholder="e.g. createdAt"
                  value={sortKeyName}
                  onChange={(e) => setSortKeyName(e.target.value)}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                  className="w-full px-3 text-[13px] border border-[#eaeded] rounded focus:outline-none focus:border-[#ec7211]"
                />
              </div>
              <div className="w-40">
                <select
                  value={sortKeyType}
                  onChange={(e) => setSortKeyType(e.target.value as any)}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                  className="w-full px-3 text-[13px] border border-[#eaeded] rounded bg-white focus:outline-none focus:border-[#ec7211]"
                >
                  <option value="S">String</option>
                  <option value="N">Number</option>
                  <option value="B">Binary</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table settings Card */}
      <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-5">
        <div>
          <h2 className="text-[16px] font-bold text-[#16191f]">Table settings</h2>
          <p className="text-[13px] text-[#545b64]">
            Choose whether to use recommended default settings or customize your table capacity and encryption.
          </p>
        </div>

        <div className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer p-3 rounded border border-[#eaeded] hover:bg-[#fafafa]">
            <input
              type="radio"
              name="settingsMode"
              checked={settingsMode === "default"}
              onChange={() => setSettingsMode("default")}
              className="mt-0.5 text-[#ec7211] focus:ring-[#ec7211]"
            />
            <div>
              <div className="text-[13px] font-bold text-[#16191f]">Default settings</div>
              <div className="text-[12px] text-[#545b64]">
                The fastest way to create a table. Uses DynamoDB Standard table class, On-demand capacity mode, and Amazon DynamoDB owned KMS encryption key.
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer p-3 rounded border border-[#eaeded] hover:bg-[#fafafa]">
            <input
              type="radio"
              name="settingsMode"
              checked={settingsMode === "custom"}
              onChange={() => setSettingsMode("custom")}
              className="mt-0.5 text-[#ec7211] focus:ring-[#ec7211]"
            />
            <div>
              <div className="text-[13px] font-bold text-[#16191f]">Customize settings</div>
              <div className="text-[12px] text-[#545b64]">
                Configure capacity calculation, read/write units, secondary indexes, and customer managed KMS encryption keys.
              </div>
            </div>
          </label>
        </div>

        {/* Custom Settings Expansion */}
        {settingsMode === "custom" && (
          <div className="space-y-6 pt-4 border-t border-[#eaeded]">
            {/* Read/Write Capacity Mode */}
            <div className="space-y-3">
              <h3 className="text-[14px] font-bold text-[#16191f]">Read/write capacity settings</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
                <label className="p-3 border border-[#eaeded] rounded flex items-start gap-2.5 cursor-pointer hover:bg-[#fafafa]">
                  <input
                    type="radio"
                    name="billingMode"
                    checked={billingMode === "PAY_PER_REQUEST"}
                    onChange={() => setBillingMode("PAY_PER_REQUEST")}
                    className="mt-0.5 text-[#ec7211] focus:ring-[#ec7211]"
                  />
                  <div>
                    <div className="text-[13px] font-bold text-[#16191f]">On-demand</div>
                    <div className="text-[12px] text-[#545b64]">
                      Pay per request for read and write operations. Best for unknown workloads.
                    </div>
                  </div>
                </label>

                <label className="p-3 border border-[#eaeded] rounded flex items-start gap-2.5 cursor-pointer hover:bg-[#fafafa]">
                  <input
                    type="radio"
                    name="billingMode"
                    checked={billingMode === "PROVISIONED"}
                    onChange={() => setBillingMode("PROVISIONED")}
                    className="mt-0.5 text-[#ec7211] focus:ring-[#ec7211]"
                  />
                  <div>
                    <div className="text-[13px] font-bold text-[#16191f]">Provisioned</div>
                    <div className="text-[12px] text-[#545b64]">
                      Specify Read Capacity Units (RCU) and Write Capacity Units (WCU).
                    </div>
                  </div>
                </label>
              </div>

              {billingMode === "PROVISIONED" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl pl-4 pt-2">
                  <div>
                    <label className="block text-[12px] font-bold text-[#16191f]">
                      Read capacity units (RCU)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="40000"
                      value={readCapacityUnits}
                      onChange={(e) => setReadCapacityUnits(parseInt(e.target.value) || 1)}
                      style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                      className="w-full px-3 text-[13px] border border-[#eaeded] rounded focus:outline-none focus:border-[#ec7211] mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-[#16191f]">
                      Write capacity units (WCU)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="40000"
                      value={writeCapacityUnits}
                      onChange={(e) => setWriteCapacityUnits(parseInt(e.target.value) || 1)}
                      style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                      className="w-full px-3 text-[13px] border border-[#eaeded] rounded focus:outline-none focus:border-[#ec7211] mt-1"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Encryption at Rest */}
            <div className="space-y-3 pt-4 border-t border-[#eaeded]">
              <h3 className="text-[14px] font-bold text-[#16191f]">Encryption at rest</h3>
              <p className="text-[12px] text-[#545b64]">
                Choose how DynamoDB encrypts your table data at rest using AWS Key Management Service (KMS).
              </p>

              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-[13px] text-[#16191f]">
                  <input
                    type="radio"
                    name="sseType"
                    checked={sseType === "DEFAULT"}
                    onChange={() => setSseType("DEFAULT")}
                    className="text-[#ec7211] focus:ring-[#ec7211]"
                  />
                  <span>Amazon DynamoDB owned key (default, free of charge)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-[13px] text-[#16191f]">
                  <input
                    type="radio"
                    name="sseType"
                    checked={sseType === "KMS"}
                    onChange={() => setSseType("KMS")}
                    className="text-[#ec7211] focus:ring-[#ec7211]"
                  />
                  <span>Stored in your account of AWS KMS (Customer Managed Key)</span>
                </label>

                {sseType === "KMS" && (
                  <div className="pl-6 pt-2 max-w-lg space-y-2">
                    {kmsKeys.length === 0 ? (
                      <div className="p-3 bg-[#f2f8fd] border border-[#eaeded] rounded text-[12px] text-[#545b64]">
                        No customer managed keys found in this Region.{" "}
                        <Link href="/kms/customer-keys" className="text-[#0073bb] underline">
                          Create key in AWS KMS
                        </Link>
                      </div>
                    ) : (
                      <select
                        value={selectedKmsKeyId}
                        onChange={(e) => setSelectedKmsKeyId(e.target.value)}
                        style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                        className="w-full px-3 text-[13px] border border-[#eaeded] rounded bg-white focus:outline-none focus:border-[#ec7211]"
                      >
                        {kmsKeys.map((k) => (
                          <option key={k.KeyId} value={k.KeyId}>
                            {k.AliasName || k.KeyId} ({k.KeyId.slice(0, 8)}...)
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Deletion Protection */}
            <div className="space-y-2 pt-4 border-t border-[#eaeded]">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="deletionProtection"
                  checked={deletionProtection}
                  onChange={(e) => setDeletionProtection(e.target.checked)}
                  className="h-4 w-4 text-[#ec7211] border-[#d5dbdb] rounded focus:ring-[#ec7211]"
                />
                <label htmlFor="deletionProtection" className="text-[13px] font-bold text-[#16191f] cursor-pointer">
                  Enable deletion protection
                </label>
              </div>
              <p className="text-[12px] text-[#545b64] pl-6">
                Protects the table from being accidentally deleted by an administrator or application.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Tags Card */}
      <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[16px] font-bold text-[#16191f]">Tags</h2>
            <p className="text-[13px] text-[#545b64]">
              A tag is a label that you assign to an AWS resource. Each tag consists of a key and an optional value.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddTag}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="px-3 text-[13px] font-bold rounded border border-[#545b64] text-[#16191f] bg-white hover:bg-[#f2f3f3] transition-colors"
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
                  value={tag.Key}
                  onChange={(e) => handleTagChange(idx, "Key", e.target.value)}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                  className="flex-1 px-3 text-[13px] border border-[#eaeded] rounded focus:outline-none focus:border-[#ec7211]"
                />
                <input
                  type="text"
                  placeholder="Value"
                  value={tag.Value}
                  onChange={(e) => handleTagChange(idx, "Value", e.target.value)}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                  className="flex-1 px-3 text-[13px] border border-[#eaeded] rounded focus:outline-none focus:border-[#ec7211]"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveTag(idx)}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="px-3 text-[13px] font-bold text-[#d13212] hover:bg-[#fdf2f2] rounded border border-[#eaeded]"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons Footer */}
      <div className="flex justify-end gap-3 pt-4 border-t border-[#eaeded]">
        <Link
          href="/dynamodb/tables"
          style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#545b64] text-[#16191f] bg-white hover:bg-[#f2f3f3] transition-colors"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isPending}
          style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          className="inline-flex items-center justify-center font-bold text-[13px] px-6 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors disabled:opacity-50"
        >
          {isPending ? "Creating table..." : "Create table"}
        </button>
      </div>
    </form>
  );
}
