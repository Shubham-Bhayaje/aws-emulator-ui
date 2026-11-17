/**
 * UploadForm – Client component with drag-and-drop file upload.
 */

"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { uploadObject } from "../../actions";

type Props = { bucket: string; prefix: string };

export function UploadForm({ bucket, prefix }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true); setError(null);
    const formData = new FormData();
    formData.set("bucket", bucket);
    formData.set("prefix", prefix);
    formData.set("file", file);
    const result = await uploadObject(formData);
    if (result?.error) { setError(result.error); setLoading(false); }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="bg-[#fdf3f1] border border-[#d13212] rounded p-3 mb-4 text-[13px] text-[#d13212]">⚠ {error}</div>
      )}

      <div className="bg-white border border-[#d5dbdb] rounded awsui-shadow mb-4">
        <div className="px-5 py-3 border-b border-[#eaeded]">
          <h2 className="text-[16px] font-bold text-[#16191f]">Files and folders</h2>
        </div>
        <div className="p-5">
          <div className={"border-2 border-dashed rounded p-8 text-center transition-colors " + (dragOver ? "border-[#0073bb] bg-[#f2f8fd]" : "border-[#d5dbdb]")}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}>
            {file ? (
              <div className="text-[13px]">
                <div className="text-[#16191f] font-medium mb-1">📄 {file.name}</div>
                <div className="text-[#545b64]">{(file.size / 1024).toFixed(1)} KB</div>
                <button type="button" onClick={() => setFile(null)} className="text-[#0073bb] hover:underline mt-2 text-[12px]">Remove</button>
              </div>
            ) : (
              <div>
                <div className="text-[13px] text-[#545b64] mb-2">Drag and drop files here, or</div>
                <button type="button" onClick={() => inputRef.current?.click()}
                  className="px-3 py-[5px] text-[13px] border border-[#545b64] rounded-sm text-[#545b64] hover:bg-[#fafafa]">Add files</button>
              </div>
            )}
          </div>
          <input ref={inputRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); }} />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Link href={"/s3/" + bucket + (prefix ? "?prefix=" + encodeURIComponent(prefix) : "")}
          className="px-4 py-[6px] text-[13px] border border-[#545b64] rounded-sm text-[#545b64] hover:bg-[#fafafa]">Cancel</Link>
        <button type="submit" disabled={!file || loading}
          className="px-4 py-[6px] text-[13px] bg-[#ec7211] text-white rounded-sm hover:bg-[#eb5f07] disabled:opacity-50">
          {loading ? "Uploading..." : "Upload"}</button>
      </div>
    </form>
  );
}
