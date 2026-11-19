/**
 * src/app/s3/[bucket]/BucketDetailClient.tsx – S3 Bucket Detail Client Component.
 * Full replica of AWS S3 Bucket Console with Objects, Properties, Permissions, and Metrics tabs.
 * Zero emojis, Cloudscape enterprise standard, strict 32px button height standard.
 */

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { S3BucketDetail, S3ObjectSummary } from "../types";
import {
  deleteObject,
  deleteObjects,
  createFolder,
  updateBucketVersioning,
  updateBucketEncryption,
  updateBucketPublicAccessBlock,
  updateBucketPolicy,
  deleteBucketPolicy,
  updateBucketCors,
  updateBucketTagging,
} from "../actions";

interface BucketDetailClientProps {
  bucket: S3BucketDetail;
  folders: string[];
  objects: S3ObjectSummary[];
  currentPrefix: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + " " + units[i];
}

export function BucketDetailClient({
  bucket,
  folders,
  objects,
  currentPrefix,
}: BucketDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    "objects" | "properties" | "permissions" | "metrics"
  >("objects");

  // Selection in Objects table
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  // Search filter
  const [objectSearch, setObjectSearch] = useState("");

  // Modals & form state
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const [showVersioningModal, setShowVersioningModal] = useState(false);
  const [newVersioningStatus, setNewVersioningStatus] = useState<"Enabled" | "Suspended">(
    bucket.versioningStatus === "Enabled" ? "Suspended" : "Enabled"
  );

  const [showEncryptionModal, setShowEncryptionModal] = useState(false);
  const [encAlgo, setEncAlgo] = useState<"AES256" | "aws:kms">(
    bucket.encryption.sseAlgorithm === "aws:kms" ? "aws:kms" : "AES256"
  );
  const [kmsKeyIdInput, setKmsKeyIdInput] = useState(bucket.encryption.kmsKeyId || "");
  const [bucketKeyToggle, setBucketKeyToggle] = useState(bucket.encryption.bucketKeyEnabled);

  const [showPabModal, setShowPabModal] = useState(false);
  const [pabBlockAll, setPabBlockAll] = useState(
    bucket.publicAccessBlock.blockPublicAcls &&
      bucket.publicAccessBlock.ignorePublicAcls &&
      bucket.publicAccessBlock.blockPublicPolicy &&
      bucket.publicAccessBlock.restrictPublicBuckets
  );
  const [pabBlockAcls, setPabBlockAcls] = useState(bucket.publicAccessBlock.blockPublicAcls);
  const [pabIgnoreAcls, setPabIgnoreAcls] = useState(bucket.publicAccessBlock.ignorePublicAcls);
  const [pabBlockPolicy, setPabBlockPolicy] = useState(bucket.publicAccessBlock.blockPublicPolicy);
  const [pabRestrictBuckets, setPabRestrictBuckets] = useState(
    bucket.publicAccessBlock.restrictPublicBuckets
  );

  const [isEditingPolicy, setIsEditingPolicy] = useState(false);
  const [policyInput, setPolicyInput] = useState(bucket.policy || "");

  const [isEditingCors, setIsEditingCors] = useState(false);
  const [corsInput, setCorsInput] = useState(bucket.cors || "");

  const [showTagModal, setShowTagModal] = useState(false);
  const [tagsList, setTagsList] = useState(bucket.tags);
  const [tagKey, setTagKey] = useState("");
  const [tagVal, setTagVal] = useState("");

  // Feedback alerts
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNotification(label);
    setTimeout(() => setCopiedNotification(null), 2000);
  };

  // Combine items for objects table
  const allItems = [
    ...folders.map((f) => ({
      key: f,
      name: f.slice(currentPrefix.length),
      isFolder: true,
      size: 0,
      lastModified: "—",
      storageClass: "—",
    })),
    ...objects.map((o) => ({
      key: o.key,
      name: o.name,
      isFolder: false,
      size: o.size,
      lastModified: o.lastModified,
      storageClass: o.storageClass,
    })),
  ];

  const filteredItems = allItems.filter((i) =>
    i.name.toLowerCase().includes(objectSearch.toLowerCase())
  );

  const toggleSelectObject = (key: string) => {
    const next = new Set(selectedKeys);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelectedKeys(next);
  };

  const toggleAllObjects = () => {
    if (selectedKeys.size === filteredItems.length && filteredItems.length > 0) {
      setSelectedKeys(new Set());
    } else {
      setSelectedKeys(new Set(filteredItems.map((i) => i.key)));
    }
  };

  // Object Actions
  const handleDeleteObjects = () => {
    if (selectedKeys.size === 0) return;
    if (!confirm(`Delete ${selectedKeys.size} object(s)?`)) return;

    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const keys = Array.from(selectedKeys);
      const res = await deleteObjects(bucket.name, keys);
      if (res.success) {
        setSuccess(`Successfully deleted ${keys.length} object(s).`);
        setSelectedKeys(new Set());
        router.refresh();
      } else {
        setError(res.error || "Failed to delete objects.");
      }
    });
  };

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    const fd = new FormData();
    fd.set("bucket", bucket.name);
    fd.set("prefix", currentPrefix);
    fd.set("folderName", newFolderName.trim());

    setError(null);
    setSuccess(null);
    startTransition(async () => {
      await createFolder(fd);
      setShowFolderModal(false);
      setNewFolderName("");
      router.refresh();
    });
  };

  // Versioning Action
  const handleSaveVersioning = () => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await updateBucketVersioning(bucket.name, newVersioningStatus);
      if (res.success) {
        setSuccess(`Bucket versioning updated to ${newVersioningStatus}.`);
        setShowVersioningModal(false);
        router.refresh();
      } else {
        setError(res.error || "Failed to update versioning.");
      }
    });
  };

  // Encryption Action
  const handleSaveEncryption = () => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await updateBucketEncryption(
        bucket.name,
        encAlgo,
        encAlgo === "aws:kms" ? kmsKeyIdInput.trim() : undefined,
        bucketKeyToggle
      );
      if (res.success) {
        setSuccess("Default server-side encryption updated.");
        setShowEncryptionModal(false);
        router.refresh();
      } else {
        setError(res.error || "Failed to update default encryption.");
      }
    });
  };

  // Public Access Block Action
  const handleSavePab = () => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await updateBucketPublicAccessBlock(bucket.name, {
        blockPublicAcls: pabBlockAll || pabBlockAcls,
        ignorePublicAcls: pabBlockAll || pabIgnoreAcls,
        blockPublicPolicy: pabBlockAll || pabBlockPolicy,
        restrictPublicBuckets: pabBlockAll || pabRestrictBuckets,
      });
      if (res.success) {
        setSuccess("Block public access settings updated.");
        setShowPabModal(false);
        router.refresh();
      } else {
        setError(res.error || "Failed to update Block Public Access.");
      }
    });
  };

  // Policy Actions
  const handleSavePolicy = () => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await updateBucketPolicy(bucket.name, policyInput);
      if (res.success) {
        setSuccess("Bucket policy updated.");
        setIsEditingPolicy(false);
        router.refresh();
      } else {
        setError(res.error || "Failed to update bucket policy.");
      }
    });
  };

  const handleDeletePolicy = () => {
    if (!confirm("Delete bucket policy?")) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await deleteBucketPolicy(bucket.name);
      if (res.success) {
        setSuccess("Bucket policy deleted.");
        router.refresh();
      } else {
        setError(res.error || "Failed to delete bucket policy.");
      }
    });
  };

  // CORS Action
  const handleSaveCors = () => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await updateBucketCors(bucket.name, corsInput);
      if (res.success) {
        setSuccess("CORS configuration updated.");
        setIsEditingCors(false);
        router.refresh();
      } else {
        setError(res.error || "Failed to update CORS configuration.");
      }
    });
  };

  // Tagging Action
  const handleAddTag = () => {
    if (!tagKey.trim()) return;
    setTagsList([...tagsList, { key: tagKey.trim(), value: tagVal.trim() }]);
    setTagKey("");
    setTagVal("");
  };

  const handleRemoveTag = (idx: number) => {
    setTagsList(tagsList.filter((_, i) => i !== idx));
  };

  const handleSaveTags = () => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await updateBucketTagging(bucket.name, tagsList);
      if (res.success) {
        setSuccess("Tags updated successfully.");
        setShowTagModal(false);
        router.refresh();
      } else {
        setError(res.error || "Failed to update tags.");
      }
    });
  };

  // Breadcrumb path parts
  const prefixSegments = currentPrefix
    .split("/")
    .filter(Boolean)
    .map((part, i, arr) => ({
      name: part,
      prefix: arr.slice(0, i + 1).join("/") + "/",
    }));

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header & Breadcrumb */}
      <div>
        <div className="text-[12px] text-[#545b64] mb-1 flex items-center gap-1.5 font-medium">
          <Link href="/s3" className="hover:underline text-[#0972d3]">
            Amazon S3
          </Link>
          <span>/</span>
          <Link href="/s3" className="hover:underline text-[#0972d3]">
            Buckets
          </Link>
          <span>/</span>
          <span className="font-semibold text-[#16191f]">{bucket.name}</span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-[22px] font-bold text-[#16191f] tracking-tight">{bucket.name}</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => copyToClipboard(`s3://${bucket.name}`, "s3Uri")}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd] transition-colors shadow-sm"
            >
              {copiedNotification === "s3Uri" ? "Copied S3 URI" : "Copy S3 URI"}
            </button>
            <button
              onClick={() => copyToClipboard(bucket.arn, "arn")}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd] transition-colors shadow-sm"
            >
              {copiedNotification === "arn" ? "Copied ARN" : "Copy ARN"}
            </button>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-[#fbeeed] border-l-4 border-[#d13212] p-3 text-[13px] text-[#d13212] flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="underline text-[12px] ml-4">
            Dismiss
          </button>
        </div>
      )}
      {success && (
        <div className="bg-[#edfbf0] border-l-4 border-[#1d8102] p-3 text-[13px] text-[#1d8102] flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className="underline text-[12px] ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* Cloudscape Tabs */}
      <div className="flex border-b border-[#eaeded] space-x-6 text-[13px] font-medium">
        <button
          onClick={() => setActiveTab("objects")}
          className={`pb-2.5 transition-colors ${
            activeTab === "objects"
              ? "border-b-2 border-[#0972d3] text-[#0972d3] font-bold"
              : "text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          Objects ({folders.length + objects.length})
        </button>
        <button
          onClick={() => setActiveTab("properties")}
          className={`pb-2.5 transition-colors ${
            activeTab === "properties"
              ? "border-b-2 border-[#0972d3] text-[#0972d3] font-bold"
              : "text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          Properties
        </button>
        <button
          onClick={() => setActiveTab("permissions")}
          className={`pb-2.5 transition-colors ${
            activeTab === "permissions"
              ? "border-b-2 border-[#0972d3] text-[#0972d3] font-bold"
              : "text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          Permissions
        </button>
        <button
          onClick={() => setActiveTab("metrics")}
          className={`pb-2.5 transition-colors ${
            activeTab === "metrics"
              ? "border-b-2 border-[#0972d3] text-[#0972d3] font-bold"
              : "text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          Metrics
        </button>
      </div>

      {/* TAB 1: OBJECTS */}
      {activeTab === "objects" && (
        <div className="space-y-4">
          {/* Breadcrumb folder path */}
          <div className="flex items-center gap-1.5 text-[13px] bg-[#fafafa] p-2.5 rounded border border-[#eaeded]">
            <Link
              href={`/s3/${bucket.name}`}
              className="text-[#0972d3] hover:underline font-semibold"
            >
              {bucket.name}
            </Link>
            {prefixSegments.map((seg) => (
              <span key={seg.prefix} className="flex items-center gap-1.5">
                <span className="text-[#aab7b8]">/</span>
                <Link
                  href={`/s3/${bucket.name}?prefix=${encodeURIComponent(seg.prefix)}`}
                  className="text-[#0972d3] hover:underline"
                >
                  {seg.name}
                </Link>
              </span>
            ))}
          </div>

          {/* Table Container */}
          <div className="bg-white border border-[#eaeded] rounded shadow-sm overflow-hidden">
            {/* Objects Toolbar */}
            <div className="p-4 border-b border-[#eaeded] flex flex-wrap items-center justify-between gap-3 bg-[#fafafa]">
              <div className="relative min-w-[280px] flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Find objects by prefix"
                  value={objectSearch}
                  onChange={(e) => setObjectSearch(e.target.value)}
                  className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3] bg-white placeholder-[#879596]"
                />
              </div>

              {/* Action Buttons (32px Standard) */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowFolderModal(true)}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd] transition-colors shadow-sm"
                >
                  Create folder
                </button>

                {selectedKeys.size === 1 && !Array.from(selectedKeys)[0].endsWith("/") && (
                  <>
                    <a
                      href={`/api/s3/download?bucket=${bucket.name}&key=${encodeURIComponent(
                        Array.from(selectedKeys)[0]
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                      className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd] transition-colors shadow-sm"
                    >
                      Open
                    </a>
                    <a
                      href={`/api/s3/download?bucket=${bucket.name}&key=${encodeURIComponent(
                        Array.from(selectedKeys)[0]
                      )}`}
                      download
                      style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                      className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd] transition-colors shadow-sm"
                    >
                      Download
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        const k = Array.from(selectedKeys)[0];
                        const url = `${window.location.origin}/api/s3/download?bucket=${bucket.name}&key=${encodeURIComponent(k)}`;
                        copyToClipboard(url, "objUrl");
                      }}
                      style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                      className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd] transition-colors shadow-sm"
                    >
                      {copiedNotification === "objUrl" ? "Copied URL" : "Copy URL"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const k = Array.from(selectedKeys)[0];
                        copyToClipboard(`s3://${bucket.name}/${k}`, "objUri");
                      }}
                      style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                      className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd] transition-colors shadow-sm"
                    >
                      {copiedNotification === "objUri" ? "Copied S3 URI" : "Copy S3 URI"}
                    </button>
                  </>
                )}

                <button
                  onClick={handleDeleteObjects}
                  disabled={selectedKeys.size === 0 || isPending}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd] transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Delete
                </button>

                <Link
                  href={`/s3/${bucket.name}/upload${
                    currentPrefix ? `?prefix=${encodeURIComponent(currentPrefix)}` : ""
                  }`}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors shadow-sm"
                >
                  Upload
                </Link>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-[#eaeded] bg-[#fafafa] text-[#545b64] font-semibold">
                    <th className="py-2.5 px-4 w-10">
                      <input
                        type="checkbox"
                        checked={
                          filteredItems.length > 0 && selectedKeys.size === filteredItems.length
                        }
                        onChange={toggleAllObjects}
                        className="accent-[#0972d3] rounded"
                      />
                    </th>
                    <th className="py-2.5 px-4">Name</th>
                    <th className="py-2.5 px-4">Type</th>
                    <th className="py-2.5 px-4">Last modified</th>
                    <th className="py-2.5 px-4">Size</th>
                    <th className="py-2.5 px-4">Storage class</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeded]">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-[#545b64]">
                        <div className="font-semibold text-[#16191f] text-[14px] mb-1">
                          No objects found
                        </div>
                        <p className="text-[13px] max-w-md mx-auto mb-4">
                          Objects are the fundamental entities stored in Amazon S3. Upload files to
                          get started.
                        </p>
                        <Link
                          href={`/s3/${bucket.name}/upload${
                            currentPrefix ? `?prefix=${encodeURIComponent(currentPrefix)}` : ""
                          }`}
                          style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                          className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors shadow-sm"
                        >
                          Upload objects
                        </Link>
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => (
                      <tr key={item.key} className="hover:bg-[#f2f8fd] transition-colors">
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={selectedKeys.has(item.key)}
                            onChange={() => toggleSelectObject(item.key)}
                            className="accent-[#0972d3] rounded"
                          />
                        </td>
                        <td className="py-3 px-4 font-medium text-[#0972d3]">
                          {item.isFolder ? (
                            <Link
                              href={`/s3/${bucket.name}?prefix=${encodeURIComponent(item.key)}`}
                              className="hover:underline flex items-center gap-1.5"
                            >
                              <span>{item.name}</span>
                            </Link>
                          ) : (
                            <a
                              href={`/api/s3/download?bucket=${bucket.name}&key=${encodeURIComponent(
                                item.key
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="hover:underline"
                            >
                              {item.name}
                            </a>
                          )}
                        </td>
                        <td className="py-3 px-4 text-[#545b64]">
                          {item.isFolder ? "Folder" : "File"}
                        </td>
                        <td className="py-3 px-4 text-[#545b64]">{item.lastModified}</td>
                        <td className="py-3 px-4 text-[#545b64]">
                          {item.isFolder ? "—" : formatBytes(item.size)}
                        </td>
                        <td className="py-3 px-4 text-[#545b64]">{item.storageClass}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PROPERTIES */}
      {activeTab === "properties" && (
        <div className="space-y-6">
          {/* Bucket overview */}
          <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
            <h2 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
              Bucket overview
            </h2>
            <dl className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[13px]">
              <div>
                <dt className="text-[#545b64] mb-1">AWS Region</dt>
                <dd className="font-semibold text-[#16191f]">{bucket.region}</dd>
              </div>
              <div>
                <dt className="text-[#545b64] mb-1">Amazon Resource Name (ARN)</dt>
                <dd className="font-mono text-[#16191f] flex items-center gap-2">
                  <span>{bucket.arn}</span>
                  <button
                    onClick={() => copyToClipboard(bucket.arn, "arnProp")}
                    className="text-[#0972d3] text-[11px] hover:underline"
                  >
                    {copiedNotification === "arnProp" ? "Copied" : "Copy"}
                  </button>
                </dd>
              </div>
              <div>
                <dt className="text-[#545b64] mb-1">Creation date</dt>
                <dd className="text-[#16191f]">{bucket.creationDate}</dd>
              </div>
            </dl>
          </div>

          {/* Bucket Versioning Card */}
          <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm flex items-start justify-between">
            <div className="space-y-1 max-w-2xl">
              <h3 className="text-[16px] font-bold text-[#16191f]">Bucket Versioning</h3>
              <p className="text-[13px] text-[#545b64]">
                Versioning is a means of keeping multiple variants of an object in the same bucket.
                You can use versioning to preserve, retrieve, and restore every version of every
                object stored in your Amazon S3 bucket.
              </p>
              <div className="pt-2">
                <span className="text-[13px] text-[#545b64]">Status: </span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                    bucket.versioningStatus === "Enabled"
                      ? "bg-[#edfbf0] text-[#1d8102] border border-[#a4e2b0]"
                      : "bg-[#f2f3f3] text-[#545b64] border border-[#d5dbdb]"
                  }`}
                >
                  {bucket.versioningStatus}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                setNewVersioningStatus(
                  bucket.versioningStatus === "Enabled" ? "Suspended" : "Enabled"
                );
                setShowVersioningModal(true);
              }}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd] transition-colors shadow-sm"
            >
              Edit
            </button>
          </div>

          {/* Default encryption Card */}
          <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm flex items-start justify-between">
            <div className="space-y-1 max-w-2xl">
              <h3 className="text-[16px] font-bold text-[#16191f]">Default encryption</h3>
              <p className="text-[13px] text-[#545b64]">
                Server-side encryption is automatically applied to new objects stored in this bucket.
              </p>
              <div className="pt-2 text-[13px] space-y-1">
                <div>
                  <span className="text-[#545b64]">Encryption type: </span>
                  <span className="font-semibold text-[#16191f]">
                    {bucket.encryption.sseAlgorithm === "aws:kms"
                      ? "AWS Key Management Service key (SSE-KMS)"
                      : "Amazon S3 managed keys (SSE-S3)"}
                  </span>
                </div>
                {bucket.encryption.kmsKeyId && (
                  <div>
                    <span className="text-[#545b64]">KMS key ID: </span>
                    <span className="font-mono text-[#0972d3]">{bucket.encryption.kmsKeyId}</span>
                  </div>
                )}
                <div>
                  <span className="text-[#545b64]">Bucket Key: </span>
                  <span className="text-[#16191f]">
                    {bucket.encryption.bucketKeyEnabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setEncAlgo(bucket.encryption.sseAlgorithm === "aws:kms" ? "aws:kms" : "AES256");
                setKmsKeyIdInput(bucket.encryption.kmsKeyId || "");
                setBucketKeyToggle(bucket.encryption.bucketKeyEnabled);
                setShowEncryptionModal(true);
              }}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd] transition-colors shadow-sm"
            >
              Edit
            </button>
          </div>

          {/* Tags Card */}
          <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm flex items-start justify-between">
            <div className="space-y-2 max-w-2xl">
              <h3 className="text-[16px] font-bold text-[#16191f]">
                Tags ({bucket.tags.length})
              </h3>
              <p className="text-[13px] text-[#545b64]">
                You can use bucket tags to track project costs and group resources.
              </p>
              {bucket.tags.length > 0 ? (
                <div className="border border-[#eaeded] rounded overflow-hidden max-w-md mt-2">
                  <table className="w-full text-left text-[12px]">
                    <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64]">
                      <tr>
                        <th className="p-2">Key</th>
                        <th className="p-2">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eaeded]">
                      {bucket.tags.map((t, i) => (
                        <tr key={i}>
                          <td className="p-2 font-medium">{t.key}</td>
                          <td className="p-2 text-[#545b64]">{t.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-[12px] text-[#545b64]">No tags defined on this bucket.</div>
              )}
            </div>
            <button
              onClick={() => {
                setTagsList(bucket.tags);
                setShowTagModal(true);
              }}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd] transition-colors shadow-sm"
            >
              Edit tags
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: PERMISSIONS */}
      {activeTab === "permissions" && (
        <div className="space-y-6">
          {/* Block Public Access Card */}
          <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#eaeded] pb-3">
              <div>
                <h3 className="text-[16px] font-bold text-[#16191f]">
                  Block public access (bucket settings)
                </h3>
                <p className="text-[13px] text-[#545b64] mt-0.5">
                  Block public access settings apply to this bucket and its objects.
                </p>
              </div>
              <button
                onClick={() => {
                  setPabBlockAll(
                    bucket.publicAccessBlock.blockPublicAcls &&
                      bucket.publicAccessBlock.ignorePublicAcls &&
                      bucket.publicAccessBlock.blockPublicPolicy &&
                      bucket.publicAccessBlock.restrictPublicBuckets
                  );
                  setPabBlockAcls(bucket.publicAccessBlock.blockPublicAcls);
                  setPabIgnoreAcls(bucket.publicAccessBlock.ignorePublicAcls);
                  setPabBlockPolicy(bucket.publicAccessBlock.blockPublicPolicy);
                  setPabRestrictBuckets(bucket.publicAccessBlock.restrictPublicBuckets);
                  setShowPabModal(true);
                }}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd] transition-colors shadow-sm"
              >
                Edit
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px]">
              <div className="p-3 bg-[#fafafa] border border-[#eaeded] rounded space-y-1">
                <div className="font-semibold text-[#16191f]">
                  Block public access to buckets and objects granted through new ACLs
                </div>
                <div className="text-[12px] text-[#545b64]">
                  Status:{" "}
                  <span className="font-bold text-[#16191f]">
                    {bucket.publicAccessBlock.blockPublicAcls ? "On" : "Off"}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-[#fafafa] border border-[#eaeded] rounded space-y-1">
                <div className="font-semibold text-[#16191f]">
                  Block public access to buckets and objects granted through any ACLs
                </div>
                <div className="text-[12px] text-[#545b64]">
                  Status:{" "}
                  <span className="font-bold text-[#16191f]">
                    {bucket.publicAccessBlock.ignorePublicAcls ? "On" : "Off"}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-[#fafafa] border border-[#eaeded] rounded space-y-1">
                <div className="font-semibold text-[#16191f]">
                  Block public access to buckets and objects granted through new public policies
                </div>
                <div className="text-[12px] text-[#545b64]">
                  Status:{" "}
                  <span className="font-bold text-[#16191f]">
                    {bucket.publicAccessBlock.blockPublicPolicy ? "On" : "Off"}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-[#fafafa] border border-[#eaeded] rounded space-y-1">
                <div className="font-semibold text-[#16191f]">
                  Block public and cross-account access to buckets and objects with public policies
                </div>
                <div className="text-[12px] text-[#545b64]">
                  Status:{" "}
                  <span className="font-bold text-[#16191f]">
                    {bucket.publicAccessBlock.restrictPublicBuckets ? "On" : "Off"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bucket Policy Card */}
          <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eaeded] pb-3">
              <div>
                <h3 className="text-[16px] font-bold text-[#16191f]">Bucket policy</h3>
                <p className="text-[13px] text-[#545b64] mt-0.5">
                  The bucket policy, written in JSON format, provides access to the objects stored in
                  the bucket.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {bucket.policy && !isEditingPolicy && (
                  <button
                    onClick={handleDeletePolicy}
                    disabled={isPending}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                    className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border border-[#d13212] bg-white text-[#d13212] hover:bg-[#fbeeed] transition-colors shadow-sm"
                  >
                    Delete policy
                  </button>
                )}
                {!isEditingPolicy ? (
                  <button
                    onClick={() => {
                      setPolicyInput(bucket.policy || "");
                      setIsEditingPolicy(true);
                    }}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                    className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd] transition-colors shadow-sm"
                  >
                    Edit
                  </button>
                ) : null}
              </div>
            </div>

            {isEditingPolicy ? (
              <div className="space-y-4">
                <textarea
                  rows={14}
                  value={policyInput}
                  onChange={(e) => setPolicyInput(e.target.value)}
                  placeholder='{\n  "Version": "2012-10-17",\n  "Statement": []\n}'
                  className="w-full font-mono text-[12px] p-4 border border-[#aab7b8] rounded bg-[#1e293b] text-[#f8fafc] focus:outline-none focus:border-[#0972d3]"
                />
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setIsEditingPolicy(false);
                      setPolicyInput(bucket.policy || "");
                    }}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                    className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSavePolicy}
                    disabled={isPending}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                    className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors disabled:opacity-50"
                  >
                    {isPending ? "Saving..." : "Save changes"}
                  </button>
                </div>
              </div>
            ) : (
              <pre className="font-mono text-[12px] p-4 bg-[#f8f9fa] border border-[#eaeded] rounded overflow-x-auto text-[#16191f] max-h-96">
                {bucket.policy || "// No bucket policy defined"}
              </pre>
            )}
          </div>

          {/* CORS Card */}
          <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#eaeded] pb-3">
              <div>
                <h3 className="text-[16px] font-bold text-[#16191f]">
                  Cross-origin resource sharing (CORS)
                </h3>
                <p className="text-[13px] text-[#545b64] mt-0.5">
                  The CORS configuration defines client web application access permissions.
                </p>
              </div>
              {!isEditingCors && (
                <button
                  onClick={() => {
                    setCorsInput(bucket.cors || "");
                    setIsEditingCors(true);
                  }}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd] transition-colors shadow-sm"
                >
                  Edit
                </button>
              )}
            </div>

            {isEditingCors ? (
              <div className="space-y-4">
                <textarea
                  rows={10}
                  value={corsInput}
                  onChange={(e) => setCorsInput(e.target.value)}
                  placeholder='[\n  {\n    "AllowedHeaders": ["*"],\n    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],\n    "AllowedOrigins": ["*"],\n    "ExposeHeaders": []\n  }\n]'
                  className="w-full font-mono text-[12px] p-4 border border-[#aab7b8] rounded bg-[#1e293b] text-[#f8fafc] focus:outline-none focus:border-[#0972d3]"
                />
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setIsEditingCors(false);
                      setCorsInput(bucket.cors || "");
                    }}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                    className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveCors}
                    disabled={isPending}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                    className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] disabled:opacity-50"
                  >
                    {isPending ? "Saving..." : "Save changes"}
                  </button>
                </div>
              </div>
            ) : (
              <pre className="font-mono text-[12px] p-4 bg-[#f8f9fa] border border-[#eaeded] rounded overflow-x-auto text-[#16191f] max-h-72">
                {bucket.cors || "// No CORS configuration defined"}
              </pre>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: METRICS */}
      {activeTab === "metrics" && (
        <div className="space-y-6">
          <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
            <h2 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
              Bucket storage metrics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-[#fafafa] border border-[#eaeded] rounded space-y-1">
                <div className="text-[12px] font-semibold text-[#545b64] uppercase tracking-wider">
                  Total bucket size
                </div>
                <div className="text-[24px] font-bold text-[#16191f]">
                  {formatBytes(bucket.totalSizeBytes)}
                </div>
              </div>

              <div className="p-4 bg-[#fafafa] border border-[#eaeded] rounded space-y-1">
                <div className="text-[12px] font-semibold text-[#545b64] uppercase tracking-wider">
                  Total object count
                </div>
                <div className="text-[24px] font-bold text-[#16191f]">{bucket.objectCount}</div>
              </div>

              <div className="p-4 bg-[#fafafa] border border-[#eaeded] rounded space-y-1">
                <div className="text-[12px] font-semibold text-[#545b64] uppercase tracking-wider">
                  Storage class
                </div>
                <div className="text-[24px] font-bold text-[#0972d3]">STANDARD (100%)</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Create Folder */}
      {showFolderModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">Create folder</h3>
            <p className="text-[13px] text-[#545b64]">
              Folders allow you to group objects in your bucket logically.
            </p>

            <form onSubmit={handleCreateFolder} className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                  Folder name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. photos or documents"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#eaeded]">
                <button
                  type="button"
                  onClick={() => setShowFolderModal(false)}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
                >
                  Create folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Versioning */}
      {showVersioningModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">Edit Bucket Versioning</h3>
            <p className="text-[13px] text-[#545b64]">
              Once you enable versioning, you can never return to an unversioned state. You can,
              however, suspend versioning on that bucket.
            </p>

            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer text-[13px]">
                <input
                  type="radio"
                  name="versioning"
                  checked={newVersioningStatus === "Enabled"}
                  onChange={() => setNewVersioningStatus("Enabled")}
                  className="text-[#0972d3]"
                />
                <span className="font-semibold text-[#16191f]">Enable versioning</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer text-[13px]">
                <input
                  type="radio"
                  name="versioning"
                  checked={newVersioningStatus === "Suspended"}
                  onChange={() => setNewVersioningStatus("Suspended")}
                  className="text-[#0972d3]"
                />
                <span className="font-semibold text-[#16191f]">Suspend versioning</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowVersioningModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveVersioning}
                disabled={isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Edit Encryption */}
      {showEncryptionModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">Edit default encryption</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                  Encryption type
                </label>
                <div className="space-y-2">
                  <label className="flex items-start gap-2 cursor-pointer text-[13px]">
                    <input
                      type="radio"
                      name="enc"
                      checked={encAlgo === "AES256"}
                      onChange={() => setEncAlgo("AES256")}
                      className="mt-0.5 text-[#0972d3]"
                    />
                    <div>
                      <span className="font-semibold text-[#16191f]">
                        Amazon S3 managed keys (SSE-S3)
                      </span>
                      <div className="text-[12px] text-[#545b64]">
                        Encrypts each object with a unique AES-256 key managed by Amazon S3.
                      </div>
                    </div>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer text-[13px]">
                    <input
                      type="radio"
                      name="enc"
                      checked={encAlgo === "aws:kms"}
                      onChange={() => setEncAlgo("aws:kms")}
                      className="mt-0.5 text-[#0972d3]"
                    />
                    <div>
                      <span className="font-semibold text-[#16191f]">
                        AWS Key Management Service key (SSE-KMS)
                      </span>
                      <div className="text-[12px] text-[#545b64]">
                        Encrypts objects using a KMS key that you manage or an AWS managed key.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {encAlgo === "aws:kms" && (
                <div>
                  <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                    AWS KMS key ARN or alias
                  </label>
                  <input
                    type="text"
                    placeholder="alias/aws/s3 or key ARN"
                    value={kmsKeyIdInput}
                    onChange={(e) => setKmsKeyIdInput(e.target.value)}
                    className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3]"
                  />
                </div>
              )}

              <div>
                <label className="flex items-center gap-2 cursor-pointer text-[13px]">
                  <input
                    type="checkbox"
                    checked={bucketKeyToggle}
                    onChange={(e) => setBucketKeyToggle(e.target.checked)}
                    className="text-[#0972d3] rounded"
                  />
                  <span className="font-semibold text-[#16191f]">Bucket Key</span>
                </label>
                <p className="text-[12px] text-[#545b64] ml-6">
                  Decreases encryption costs by reducing KMS request traffic.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowEncryptionModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEncryption}
                disabled={isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Edit Block Public Access */}
      {showPabModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">
              Edit Block Public Access settings
            </h3>

            <div className="space-y-3">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pabBlockAll}
                  onChange={(e) => {
                    setPabBlockAll(e.target.checked);
                    if (e.target.checked) {
                      setPabBlockAcls(true);
                      setPabIgnoreAcls(true);
                      setPabBlockPolicy(true);
                      setPabRestrictBuckets(true);
                    }
                  }}
                  className="mt-1 text-[#0972d3] rounded"
                />
                <div>
                  <div className="font-bold text-[13px] text-[#16191f]">
                    Block all public access
                  </div>
                  <div className="text-[12px] text-[#545b64]">
                    Turning on this setting enables all four settings below.
                  </div>
                </div>
              </label>

              <div className="border-t border-[#eaeded] pt-3 space-y-2 ml-4">
                <label className="flex items-center gap-2 cursor-pointer text-[12px]">
                  <input
                    type="checkbox"
                    checked={pabBlockAcls}
                    onChange={(e) => setPabBlockAcls(e.target.checked)}
                    disabled={pabBlockAll}
                    className="text-[#0972d3] rounded"
                  />
                  <span>Block public access granted through new ACLs</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-[12px]">
                  <input
                    type="checkbox"
                    checked={pabIgnoreAcls}
                    onChange={(e) => setPabIgnoreAcls(e.target.checked)}
                    disabled={pabBlockAll}
                    className="text-[#0972d3] rounded"
                  />
                  <span>Block public access granted through any ACLs</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-[12px]">
                  <input
                    type="checkbox"
                    checked={pabBlockPolicy}
                    onChange={(e) => setPabBlockPolicy(e.target.checked)}
                    disabled={pabBlockAll}
                    className="text-[#0972d3] rounded"
                  />
                  <span>Block public access granted through new public policies</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-[12px]">
                  <input
                    type="checkbox"
                    checked={pabRestrictBuckets}
                    onChange={(e) => setPabRestrictBuckets(e.target.checked)}
                    disabled={pabBlockAll}
                    className="text-[#0972d3] rounded"
                  />
                  <span>Block public access through public policies</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowPabModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePab}
                disabled={isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Edit Tags */}
      {showTagModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">Edit bucket tags</h3>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Key"
                value={tagKey}
                onChange={(e) => setTagKey(e.target.value)}
                className="text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded flex-1"
              />
              <input
                type="text"
                placeholder="Value"
                value={tagVal}
                onChange={(e) => setTagVal(e.target.value)}
                className="text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded flex-1"
              />
              <button
                type="button"
                onClick={handleAddTag}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border border-[#aab7b8] bg-white hover:bg-[#f2f8fd]"
              >
                Add
              </button>
            </div>

            <div className="border border-[#eaeded] rounded overflow-hidden max-h-48 overflow-y-auto">
              <table className="w-full text-left text-[12px]">
                <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64]">
                  <tr>
                    <th className="p-2">Key</th>
                    <th className="p-2">Value</th>
                    <th className="p-2 w-16">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeded]">
                  {tagsList.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-4 text-center text-[#545b64]">
                        No tags added.
                      </td>
                    </tr>
                  ) : (
                    tagsList.map((t, idx) => (
                      <tr key={idx}>
                        <td className="p-2 font-medium">{t.key}</td>
                        <td className="p-2 text-[#545b64]">{t.value}</td>
                        <td className="p-2">
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(idx)}
                            className="text-[#d13212] hover:underline"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowTagModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveTags}
                disabled={isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
