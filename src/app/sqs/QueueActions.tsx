/**
 * QueueActions – Client component for queue table with select, delete, purge.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteQueue, purgeQueue } from "./actions";

type Queue = { url: string; name: string; type: string; created: string };

export function QueueActions({ queues }: { queues: Queue[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function toggleSelect(url: string) {
    const next = new Set(selected);
    if (next.has(url)) next.delete(url); else next.add(url);
    setSelected(next);
  }

  async function handleDelete() {
    if (!confirm("Delete " + selected.size + " queue(s)?")) return;
    setLoading(true); setError(null);
    for (const url of selected) {
      const r = await deleteQueue(url);
      if (r?.error) { setError(r.error); setLoading(false); return; }
    }
    setSelected(new Set()); setLoading(false); router.refresh();
  }

  async function handlePurge() {
    if (!confirm("Purge all messages from " + selected.size + " queue(s)?")) return;
    setLoading(true); setError(null);
    for (const url of selected) {
      const r = await purgeQueue(url);
      if (r?.error) { setError(r.error); setLoading(false); return; }
    }
    setSelected(new Set()); setLoading(false); router.refresh();
  }

  return (
    <>
      {error && <div className="bg-[#fdf3f1] border border-[#d13212] rounded p-3 mb-3 text-[13px] text-[#d13212]">⚠ {error}</div>}

      <div className="bg-white border border-[#d5dbdb] rounded awsui-shadow">
        <div className="px-4 py-2.5 border-b border-[#eaeded] flex items-center justify-between">
          <h2 className="text-[14px] font-bold text-[#16191f]">Queues ({queues.length})</h2>
          <div className="flex items-center gap-2">
            <button onClick={handlePurge} disabled={selected.size === 0 || loading}
              className="px-3 py-[4px] text-[13px] border border-[#545b64] rounded-sm text-[#545b64] hover:bg-[#fafafa] disabled:opacity-40 disabled:cursor-not-allowed">Purge</button>
            <button onClick={handleDelete} disabled={selected.size === 0 || loading}
              className="px-3 py-[4px] text-[13px] border border-[#545b64] rounded-sm text-[#545b64] hover:bg-[#fafafa] disabled:opacity-40 disabled:cursor-not-allowed">Delete</button>
            <Link href="/sqs/create" className="px-3 py-[4px] text-[13px] bg-[#ec7211] text-white rounded-sm hover:bg-[#eb5f07] inline-block">Create queue</Link>
          </div>
        </div>

        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-[#fafafa] border-b border-[#eaeded] text-left text-[#545b64]">
              <th className="py-2 px-4 w-8 font-medium"><input type="checkbox" className="accent-[#0073bb]"
                checked={queues.length > 0 && selected.size === queues.length}
                onChange={() => { if (selected.size === queues.length) setSelected(new Set()); else setSelected(new Set(queues.map(q => q.url))); }} /></th>
              <th className="py-2 px-4 font-medium">Name</th>
              <th className="py-2 px-4 font-medium">Type</th>
              <th className="py-2 px-4 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {queues.length === 0 ? (
              <tr><td colSpan={4} className="py-8 text-center text-[#545b64]">No queues. Choose <strong>Create queue</strong> to get started.</td></tr>
            ) : queues.map((q) => (
              <tr key={q.url} className="border-b border-[#eaeded] hover:bg-[#f2f8fd]">
                <td className="py-2 px-4"><input type="checkbox" checked={selected.has(q.url)} onChange={() => toggleSelect(q.url)} className="accent-[#0073bb]" /></td>
                <td className="py-2 px-4"><Link href={"/sqs/" + encodeURIComponent(q.name)} className="text-[#0073bb] hover:text-[#ec7211] hover:underline">{q.name}</Link></td>
                <td className="py-2 px-4 text-[#545b64]">{q.type}</td>
                <td className="py-2 px-4 text-[#545b64]">{q.created}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
