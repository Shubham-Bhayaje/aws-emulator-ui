"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createKeyspaceAction } from "../actions";

export default function CreateKeyspaceClient() {
  const router = useRouter();
  const [keyspaceName, setKeyspaceName] = useState("");
  const [replicationStrategy, setReplicationStrategy] = useState<"SINGLE_REGION" | "MULTI_REGION">("SINGLE_REGION");
  const [tags, setTags] = useState<{ key: string; value: string }[]>([]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isValidName = /^[a-zA-Z0-9_]{1,48}$/.test(keyspaceName.trim());

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
    if (!isValidName) {
      setError("Keyspace name must be between 1 and 48 characters and contain only letters, numbers, and underscores.");
      return;
    }
    setError(null);

    const tagRecord: Record<string, string> = {};
    for (const t of tags) {
      if (t.key.trim()) {
        tagRecord[t.key.trim()] = t.value.trim();
      }
    }

    startTransition(async () => {
      const res = await createKeyspaceAction({
        keyspaceName: keyspaceName.trim(),
        replicationStrategy,
        tags: Object.keys(tagRecord).length > 0 ? tagRecord : undefined,
      });

      if (res.success) {
        router.push(`/keyspaces/${encodeURIComponent(keyspaceName.trim())}`);
      } else {
        setError(res.error || "Failed to create keyspace.");
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
        <span className="text-[#16191f] font-medium">Create keyspace</span>
      </div>

      <div>
        <h1 className="text-[24px] font-bold text-[#16191f]">Create keyspace</h1>
        <p className="text-[14px] text-[#545b64] mt-0.5">
          Specify keyspace settings and replication strategy. A keyspace defines the replication strategy for all contained tables.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-[#fdf2f2] border-l-4 border-[#d13212] text-[13px] text-[#d13212] rounded flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="font-bold">&times;</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Keyspace Name Card */}
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
          <h2 className="text-[16px] font-bold text-[#16191f]">Keyspace settings</h2>

          <div className="space-y-1.5">
            <label className="block text-[13px] font-bold text-[#16191f]">
              Keyspace name
            </label>
            <p className="text-[12px] text-[#545b64]">
              Must be 1 to 48 characters long and contain only letters, numbers, and underscores. Cannot be changed after creation.
            </p>
            <input
              type="text"
              placeholder="my_keyspace"
              value={keyspaceName}
              onChange={(e) => setKeyspaceName(e.target.value)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
              className="w-full max-w-lg px-3 border border-[#eaeded] rounded focus:outline-none focus:border-[#ec7211] font-mono text-[13px]"
              required
            />
            {keyspaceName && !isValidName && (
              <p className="text-[12px] text-[#d13212]">
                Name must be 1 to 48 characters and contain only alphanumeric characters and underscores.
              </p>
            )}
          </div>
        </div>

        {/* Replication Strategy Card */}
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
          <h2 className="text-[16px] font-bold text-[#16191f]">Replication strategy</h2>
          <p className="text-[12px] text-[#545b64]">
            Choose how data in this keyspace is replicated across AWS Regions.
          </p>

          <div className="space-y-3">
            <label className="flex items-start gap-3 p-3 border border-[#eaeded] rounded cursor-pointer hover:bg-[#fafafa]">
              <input
                type="radio"
                name="replication_strategy"
                value="SINGLE_REGION"
                checked={replicationStrategy === "SINGLE_REGION"}
                onChange={() => setReplicationStrategy("SINGLE_REGION")}
                className="mt-1 h-4 w-4 text-[#ec7211] focus:ring-[#ec7211]"
              />
              <div className="space-y-1">
                <span className="font-bold text-[13px] text-[#16191f]">Single-Region replication (Default)</span>
                <p className="text-[12px] text-[#545b64]">
                  Replicates data across three Availability Zones in the current AWS Region.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 border border-[#eaeded] rounded cursor-pointer hover:bg-[#fafafa]">
              <input
                type="radio"
                name="replication_strategy"
                value="MULTI_REGION"
                checked={replicationStrategy === "MULTI_REGION"}
                onChange={() => setReplicationStrategy("MULTI_REGION")}
                className="mt-1 h-4 w-4 text-[#ec7211] focus:ring-[#ec7211]"
              />
              <div className="space-y-1">
                <span className="font-bold text-[13px] text-[#16191f]">Multi-Region replication</span>
                <p className="text-[12px] text-[#545b64]">
                  Automates asynchronous multi-Region replication across geographically dispersed Regions for global low latency.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Tags Card */}
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[16px] font-bold text-[#16191f]">Tags (optional)</h2>
              <p className="text-[12px] text-[#545b64]">
                A tag is a label that you assign to an AWS resource. Each tag consists of a key and an optional value.
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

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/keyspaces"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center justify-center px-4 rounded border border-[#545b64] text-[#16191f] font-bold text-[13px] hover:bg-[#f2f3f3] transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={!isValidName || isPending}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className={`inline-flex items-center justify-center px-5 rounded font-bold text-[13px] text-white transition-colors ${
              isValidName && !isPending
                ? "bg-[#ec7211] hover:bg-[#eb5f07] cursor-pointer"
                : "bg-[#eaeded] text-[#aab7b8] cursor-not-allowed"
            }`}
          >
            {isPending ? "Creating keyspace..." : "Create keyspace"}
          </button>
        </div>
      </form>
    </div>
  );
}
