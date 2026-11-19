/**
 * src/app/s3/[bucket]/upload/UploadForm.tsx – S3 Upload Form with storage class & encryption.
 * Zero emojis, Cloudscape enterprise standard, strict 32px button height standard.
 */

"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { uploadObject } from "../../actions";

interface UploadFormProps {
  bucket: string;
  prefix: string;
}

export function UploadForm({ bucket, prefix }: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Advanced upload settings
  const [storageClass, setStorageClass] = useState("STANDARD");
  const [sseAlgo, setSseAlgo] = useState<"AES256" | "aws:kms" | "">("");
  const [kmsKeyId, setKmsKeyId] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.set("bucket", bucket);
    formData.set("prefix", prefix);
    formData.set("file", file);
    formData.set("storageClass", storageClass);
    if (sseAlgo) formData.set("sseAlgorithm", sseAlgo);
    if (sseAlgo === "aws:kms" && kmsKeyId.trim()) formData.set("ssekmsKeyId", kmsKeyId.trim());

    const result = await uploadObject(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-[#fbeeed] border-l-4 border-[#d13212] p-4 text-[13px] text-[#d13212]">
          <div className="font-bold mb-0.5">Upload failed</div>
          <div>{error}</div>
        </div>
      )}

      {/* Files upload card */}
      <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
        <h2 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
          Files and folders
        </h2>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const dropped = e.dataTransfer.files[0];
            if (dropped) setFile(dropped);
          }}
          className={`border-2 border-dashed rounded p-8 text-center transition-colors ${
            dragOver ? "border-[#0972d3] bg-[#f2f8fd]" : "border-[#aab7b8] bg-[#fafafa]"
          }`}
        >
          {file ? (
            <div className="space-y-2">
              <div className="font-semibold text-[14px] text-[#16191f]">{file.name}</div>
              <div className="text-[12px] text-[#545b64]">
                {(file.size / 1024).toFixed(1)} KB — {file.type || "application/octet-stream"}
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="text-[#d13212] text-[12px] hover:underline"
                >
                  Remove file
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-[13px] text-[#545b64]">
                Drag and drop files and folders here, or choose Add files below.
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd] transition-colors shadow-sm"
                >
                  Add files
                </button>
              </div>
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const selected = e.target.files?.[0];
              if (selected) setFile(selected);
            }}
          />
        </div>
      </div>

      {/* Storage properties card */}
      <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
        <h2 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
          Properties
        </h2>

        <div>
          <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
            Storage class
          </label>
          <select
            value={storageClass}
            onChange={(e) => setStorageClass(e.target.value)}
            className="w-full max-w-md text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3] bg-white"
          >
            <option value="STANDARD">Standard (General purpose for frequently accessed data)</option>
            <option value="INTELLIGENT_TIERING">Intelligent-Tiering (Automatic cost savings)</option>
            <option value="STANDARD_IA">Standard-IA (Infrequently accessed data)</option>
            <option value="ONEZONE_IA">One Zone-IA (Re-creatable, infrequently accessed data)</option>
            <option value="GLACIER">Glacier Flexible Retrieval (Long-term data archiving)</option>
            <option value="DEEP_ARCHIVE">Glacier Deep Archive (Lowest-cost archive storage)</option>
          </select>
        </div>

        <div>
          <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
            Server-side encryption override
          </label>
          <select
            value={sseAlgo}
            onChange={(e) => setSseAlgo(e.target.value as any)}
            className="w-full max-w-md text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3] bg-white"
          >
            <option value="">Inherit bucket default settings</option>
            <option value="AES256">Amazon S3 managed keys (SSE-S3)</option>
            <option value="aws:kms">AWS Key Management Service key (SSE-KMS)</option>
          </select>
        </div>

        {sseAlgo === "aws:kms" && (
          <div>
            <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
              AWS KMS key ID or alias
            </label>
            <input
              type="text"
              placeholder="alias/aws/s3 or KMS key ARN"
              value={kmsKeyId}
              onChange={(e) => setKmsKeyId(e.target.value)}
              className="w-full max-w-md text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3]"
            />
          </div>
        )}
      </div>

      {/* Footer action buttons */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#eaeded]">
        <Link
          href={`/s3/${bucket}${prefix ? `?prefix=${encodeURIComponent(prefix)}` : ""}`}
          style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd] transition-colors shadow-sm"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={!file || loading}
          style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-5 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "Uploading..." : "Upload"}
        </button>
      </div>
    </form>
  );
}
