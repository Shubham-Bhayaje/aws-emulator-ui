/**
 * ObjectActions – Client component for object table with selection, delete, download, create folder.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteObject, createFolder } from "../actions";

type Obj = { key: string; name: string; size: number; lastModified: string };

type Props = {
  bucket: string;
  prefix: string;
  folders: string[];
  objects: Obj[];
};

// Format file size nicely
function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + " " + units[i];
}

export function ObjectActions({ bucket, prefix, folders, objects }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const router = useRouter();

  const allItems = [
    ...folders.map((f) => ({ key: f, name: f.slice(prefix.length), isFolder: true })),
    ...objects.map((o) => ({ key: o.key, name: o.name, isFolder: false })),
  ];

  function toggleSelect(key: string) {
    const next = new Set(selected);
    if (next.has(key)) next.delete(key); else next.add(key);
    setSelected(next);
  }

  async function handleDelete() {
    if (selected.size === 0) return;
    if (!confirm("Delete " + selected.size + " object(s)?")) return;
    setLoading(true); setError(null);
    for (const key of selected) {
      const result = await deleteObject(bucket, key);
      if (result?.error) { setError(result.error); setLoading(false); return; }
    }
    setSelected(new Set()); setLoading(false); router.refresh();
  }

  async function handleCreateFolder(formData: FormData) {
    formData.set("bucket", bucket);
    formData.set("prefix", prefix);
    await createFolder(formData);
    setShowFolderModal(false);
  }

  return (
    <>
      {error && (
        <div className="bg-[#fdf3f1] border border-[#d13212] rounded p-3 mb-3 text-[13px] text-[#d13212] flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-[#d13212]">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {showFolderModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
          <div className="bg-white rounded shadow-lg w-[420px] border border-[#d5dbdb]">
            <div className="px-5 py-3 border-b border-[#eaeded]">
              <h3 className="text-[16px] font-bold text-[#16191f]">Create folder</h3>
            </div>
            <form action={handleCreateFolder} className="px-5 py-4">
              <label className="block text-[13px] font-bold text-[#16191f] mb-1">Folder name</label>
              <input name="folderName" type="text" required placeholder="Folder name" autoFocus
                className="w-full border border-[#aab7b8] rounded-sm px-3 py-[6px] text-[13px] focus:outline-none focus:border-[#0073bb] mb-4" />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowFolderModal(false)}
                  className="px-3 py-[5px] text-[13px] border border-[#545b64] rounded-sm text-[#545b64]">Cancel</button>
                <button type="submit" className="px-3 py-[5px] text-[13px] bg-[#ec7211] text-white rounded-sm hover:bg-[#eb5f07]">Create folder</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white border border-[#d5dbdb] rounded awsui-shadow">
        <div className="px-4 py-2.5 border-b border-[#eaeded] flex items-center justify-between">
          <h2 className="text-[14px] font-bold text-[#16191f]">Objects ({folders.length + objects.length})</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowFolderModal(true)}
              className="px-3 py-[4px] text-[13px] border border-[#545b64] rounded-sm text-[#545b64] hover:bg-[#fafafa]">Create folder</button>
            {selected.size === 1 && !Array.from(selected)[0].endsWith("/") && (
              <a href={"/api/s3/download?bucket=" + bucket + "&key=" + encodeURIComponent(Array.from(selected)[0])}
                className="px-3 py-[4px] text-[13px] border border-[#545b64] rounded-sm text-[#545b64] hover:bg-[#fafafa] inline-block">Download</a>
            )}
            <button onClick={handleDelete} disabled={selected.size === 0 || loading}
              className="px-3 py-[4px] text-[13px] border border-[#545b64] rounded-sm text-[#545b64] hover:bg-[#fafafa] disabled:opacity-40 disabled:cursor-not-allowed">Delete</button>
            <Link href={"/s3/" + bucket + "/upload" + (prefix ? "?prefix=" + encodeURIComponent(prefix) : "")}
              className="px-3 py-[4px] text-[13px] bg-[#ec7211] text-white rounded-sm hover:bg-[#eb5f07] inline-block">Upload</Link>
          </div>
        </div>

        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-[#fafafa] border-b border-[#eaeded] text-left text-[#545b64]">
              <th className="py-2 px-4 w-8 font-medium">
                <input type="checkbox" className="accent-[#0073bb]"
                  checked={allItems.length > 0 && selected.size === allItems.length}
                  onChange={() => { if (selected.size === allItems.length) setSelected(new Set()); else setSelected(new Set(allItems.map((i) => i.key))); }} />
              </th>
              <th className="py-2 px-4 font-medium">Name</th>
              <th className="py-2 px-4 font-medium">Type</th>
              <th className="py-2 px-4 font-medium">Last modified</th>
              <th className="py-2 px-4 font-medium">Size</th>
            </tr>
          </thead>
          <tbody>
            {allItems.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-[#545b64]">This bucket is empty. Choose <strong>Upload</strong> to add objects.</td></tr>
            ) : (
              <>
                {folders.map((f) => {
                  const folderName = f.slice(prefix.length).replace(/\/$/, "");
                  return (
                    <tr key={f} className="border-b border-[#eaeded] hover:bg-[#f2f8fd]">
                      <td className="py-2 px-4"><input type="checkbox" checked={selected.has(f)} onChange={() => toggleSelect(f)} className="accent-[#0073bb]" /></td>
                      <td className="py-2 px-4">
                        <Link href={"/s3/" + bucket + "?prefix=" + encodeURIComponent(f)} className="inline-flex items-center gap-1.5 text-[#0073bb] hover:text-[#ec7211] hover:underline">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#545b64]">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                          </svg>
                          <span>{folderName}/</span>
                        </Link>
                      </td>
                      <td className="py-2 px-4 text-[#545b64]">Folder</td>
                      <td className="py-2 px-4 text-[#545b64]">—</td>
                      <td className="py-2 px-4 text-[#545b64]">—</td>
                    </tr>
                  );
                })}
                {objects.map((obj) => (
                  <tr key={obj.key} className="border-b border-[#eaeded] hover:bg-[#f2f8fd]">
                    <td className="py-2 px-4"><input type="checkbox" checked={selected.has(obj.key)} onChange={() => toggleSelect(obj.key)} className="accent-[#0073bb]" /></td>
                    <td className="py-2 px-4">
                      <a href={"/api/s3/download?bucket=" + bucket + "&key=" + encodeURIComponent(obj.key)} className="text-[#0073bb] hover:text-[#ec7211] hover:underline">{obj.name}</a>
                    </td>
                    <td className="py-2 px-4 text-[#545b64]">File</td>
                    <td className="py-2 px-4 text-[#545b64]">{obj.lastModified}</td>
                    <td className="py-2 px-4 text-[#545b64]">{formatSize(obj.size)}</td>
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
