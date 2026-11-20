/**
 * src/app/s3/[bucket]/object/ObjectDetailClient.tsx
 * Authentic replica of AWS S3 Object Overview / Detail console.
 * Cloudscape enterprise standard, zero emojis, strict 32px button height standard.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { S3ObjectDetail } from "../../types";
import { deleteObject } from "../../actions";

interface ObjectDetailClientProps {
  object: S3ObjectDetail;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + " " + units[i];
}

export function ObjectDetailClient({ object }: ObjectDetailClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "properties" | "permissions">("overview");
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLabel(label);
    setTimeout(() => setCopiedLabel(null), 2000);
  };

  const handleDelete = async () => {
    if (!confirm(`Delete object "${object.key}" permanently?`)) return;
    setIsDeleting(true);
    const res = await deleteObject(object.bucket, object.key);
    if (res.success) {
      router.push(`/s3/${object.bucket}`);
      router.refresh();
    } else {
      alert(res.error || "Failed to delete object.");
      setIsDeleting(false);
    }
  };

  const objectUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/s3/download?bucket=${object.bucket}&key=${encodeURIComponent(
          object.key
        )}`
      : `/api/s3/download?bucket=${object.bucket}&key=${encodeURIComponent(object.key)}`;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Breadcrumb & Header */}
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
          <Link href={`/s3/${object.bucket}`} className="hover:underline text-[#0972d3]">
            {object.bucket}
          </Link>
          <span>/</span>
          <span className="font-semibold text-[#16191f]">{object.key}</span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-bold text-[#16191f] tracking-tight">{object.key}</h1>
          </div>

          {/* Action Buttons (32px standard) */}
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`/api/s3/download?bucket=${object.bucket}&key=${encodeURIComponent(object.key)}`}
              target="_blank"
              rel="noreferrer"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd] transition-colors shadow-sm"
            >
              Open
            </a>
            <a
              href={`/api/s3/download?bucket=${object.bucket}&key=${encodeURIComponent(object.key)}`}
              download
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd] transition-colors shadow-sm"
            >
              Download
            </a>
            <button
              type="button"
              onClick={() => copyToClipboard(object.s3Uri, "s3Uri")}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd] transition-colors shadow-sm"
            >
              {copiedLabel === "s3Uri" ? "Copied S3 URI" : "Copy S3 URI"}
            </button>
            <button
              type="button"
              onClick={() => copyToClipboard(objectUrl, "url")}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd] transition-colors shadow-sm"
            >
              {copiedLabel === "url" ? "Copied URL" : "Copy URL"}
            </button>
            <button
              type="button"
              onClick={() => copyToClipboard(object.arn, "arn")}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd] transition-colors shadow-sm"
            >
              {copiedLabel === "arn" ? "Copied ARN" : "Copy ARN"}
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleDelete}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border border-[#d13212] bg-white text-[#d13212] hover:bg-[#fbeeed] transition-colors shadow-sm"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>

      {/* Cloudscape Tabs */}
      <div className="flex border-b border-[#eaeded] space-x-6 text-[13px] font-medium">
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-2.5 transition-colors ${
            activeTab === "overview"
              ? "border-b-2 border-[#0972d3] text-[#0972d3] font-bold"
              : "text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          Overview
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
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Object overview card */}
          <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
            <h2 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
              Object overview
            </h2>

            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-[13px]">
              <div>
                <dt className="text-[#545b64] mb-1">Key</dt>
                <dd className="font-semibold text-[#16191f] font-mono">{object.key}</dd>
              </div>

              <div>
                <dt className="text-[#545b64] mb-1">Amazon S3 URI</dt>
                <dd className="flex items-center gap-2">
                  <span className="font-mono text-[#0972d3]">{object.s3Uri}</span>
                  <button
                    onClick={() => copyToClipboard(object.s3Uri, "s3UriCard")}
                    className="text-[#0972d3] text-[11px] hover:underline"
                  >
                    {copiedLabel === "s3UriCard" ? "Copied" : "Copy"}
                  </button>
                </dd>
              </div>

              <div>
                <dt className="text-[#545b64] mb-1">Amazon Resource Name (ARN)</dt>
                <dd className="flex items-center gap-2">
                  <span className="font-mono text-[#0972d3]">{object.arn}</span>
                  <button
                    onClick={() => copyToClipboard(object.arn, "arnCard")}
                    className="text-[#0972d3] text-[11px] hover:underline"
                  >
                    {copiedLabel === "arnCard" ? "Copied" : "Copy"}
                  </button>
                </dd>
              </div>

              <div>
                <dt className="text-[#545b64] mb-1">Size</dt>
                <dd className="text-[#16191f] font-semibold">{formatBytes(object.size)}</dd>
              </div>

              <div>
                <dt className="text-[#545b64] mb-1">Type</dt>
                <dd className="text-[#16191f] font-mono">{object.contentType}</dd>
              </div>

              <div>
                <dt className="text-[#545b64] mb-1">Last modified</dt>
                <dd className="text-[#16191f]">{object.lastModified}</dd>
              </div>

              <div>
                <dt className="text-[#545b64] mb-1">ETag</dt>
                <dd className="text-[#16191f] font-mono">{object.eTag}</dd>
              </div>

              <div>
                <dt className="text-[#545b64] mb-1">Storage class</dt>
                <dd className="text-[#16191f] font-semibold">{object.storageClass}</dd>
              </div>

              {object.versionId && (
                <div>
                  <dt className="text-[#545b64] mb-1">Version ID</dt>
                  <dd className="font-mono text-[12px] text-[#16191f]">{object.versionId}</dd>
                </div>
              )}

              <div>
                <dt className="text-[#545b64] mb-1">Server-side encryption</dt>
                <dd className="text-[#16191f]">
                  {object.serverSideEncryption === "aws:kms"
                    ? "AWS Key Management Service (SSE-KMS)"
                    : object.serverSideEncryption
                    ? "Amazon S3 managed keys (SSE-S3)"
                    : "None / Bucket Default"}
                </dd>
              </div>

              {object.ssekmsKeyId && (
                <div>
                  <dt className="text-[#545b64] mb-1">AWS KMS key ID</dt>
                  <dd className="font-mono text-[#0972d3]">{object.ssekmsKeyId}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      )}

      {/* TAB 2: PROPERTIES */}
      {activeTab === "properties" && (
        <div className="space-y-6">
          {/* Metadata Card */}
          <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
            <h2 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
              Metadata
            </h2>
            <p className="text-[13px] text-[#545b64]">
              System-defined metadata is generated by Amazon S3. User-defined metadata can be added on upload.
            </p>

            <div className="border border-[#eaeded] rounded overflow-hidden">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] font-semibold text-[12px]">
                  <tr>
                    <th className="p-3">Type</th>
                    <th className="p-3">Key</th>
                    <th className="p-3">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeded]">
                  <tr>
                    <td className="p-3 text-[#545b64]">System-defined</td>
                    <td className="p-3 font-mono font-medium">Content-Type</td>
                    <td className="p-3 font-mono">{object.contentType}</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-[#545b64]">System-defined</td>
                    <td className="p-3 font-mono font-medium">Content-Length</td>
                    <td className="p-3 font-mono">{object.size} bytes</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-[#545b64]">System-defined</td>
                    <td className="p-3 font-mono font-medium">ETag</td>
                    <td className="p-3 font-mono">{object.eTag}</td>
                  </tr>
                  {Object.entries(object.metadata || {}).map(([k, v]) => (
                    <tr key={k}>
                      <td className="p-3 text-[#0972d3]">User-defined</td>
                      <td className="p-3 font-mono font-medium">{k}</td>
                      <td className="p-3 font-mono">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Storage Class Card */}
          <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-2">
            <h2 className="text-[16px] font-bold text-[#16191f]">Storage class: {object.storageClass}</h2>
            <p className="text-[13px] text-[#545b64]">
              Objects in this storage class are designed for high durability and immediate access.
            </p>
          </div>
        </div>
      )}

      {/* TAB 3: PERMISSIONS */}
      {activeTab === "permissions" && (
        <div className="space-y-6">
          {/* Object ACL Card */}
          <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
            <h2 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
              Access control list (ACL)
            </h2>
            <div className="border border-[#eaeded] rounded overflow-hidden">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] font-semibold text-[12px]">
                  <tr>
                    <th className="p-3">Grantee</th>
                    <th className="p-3">Objects</th>
                    <th className="p-3">Object ACL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeded]">
                  <tr>
                    <td className="p-3 font-medium text-[#16191f]">Bucket owner (current account)</td>
                    <td className="p-3 text-[#16191f]">Read</td>
                    <td className="p-3 text-[#16191f]">Read, Write</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-[#545b64]">Everyone (public access)</td>
                    <td className="p-3 text-[#545b64]">—</td>
                    <td className="p-3 text-[#545b64]">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
