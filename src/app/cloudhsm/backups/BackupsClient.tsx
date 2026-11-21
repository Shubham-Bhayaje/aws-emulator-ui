/**
 * src/app/cloudhsm/backups/BackupsClient.tsx – AWS CloudHSM Backups Component.
 * Zero emojis, Cloudscape enterprise standard, strict 32px button height standard.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { BackupSummary } from "../types";
import { describeBackupsAction } from "../actions";

interface BackupsClientProps {
  initialBackups: BackupSummary[];
  initialError?: string;
}

export function BackupsClient({ initialBackups, initialError }: BackupsClientProps) {
  const [backups, setBackups] = useState<BackupSummary[]>(initialBackups);
  const [error, setError] = useState<string | null>(initialError || null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const res = await describeBackupsAction();
      if (res.success) {
        setBackups(res.backups);
      } else {
        setError(res.error || "Failed to refresh backups");
      }
    } catch (err: unknown) {
      setError(String(err));
    } finally {
      setIsRefreshing(false);
    }
  };

  const filtered = backups.filter((b) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.backupId.toLowerCase().includes(q) ||
      b.clusterId?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="text-[12px] text-[#545b64]">
        <Link href="/cloudhsm" className="hover:underline text-[#0972d3]">
          CloudHSM
        </Link>{" "}
        &gt; <span className="font-bold text-[#16191f]">Backups</span>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold text-[#16191f]">Backups</h1>
          <p className="text-[13px] text-[#545b64] mt-0.5">
            Backups of your AWS CloudHSM clusters.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3]"
          >
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Emulator compatibility notice */}
      <div className="p-4 rounded border border-[#0073bb] bg-[#f1faff] text-[13px] text-[#004a80] space-y-1">
        <div className="font-bold">Emulator Notice:</div>
        <div>
          In the local AWS Emulator, the <code>DescribeBackups</code> operation is scaffolded. Automated cluster backups are recorded and retained locally according to each cluster&apos;s configured retention policy.
        </div>
      </div>

      {error && !error.includes("scaffolded") && (
        <div className="p-4 rounded border bg-[#fdf2f2] border-[#d13212] text-[#900] text-[13px]">
          {error}
        </div>
      )}

      {/* Table container */}
      <div className="bg-white border border-[#eaeded] rounded overflow-hidden">
        <div className="p-3 border-b border-[#eaeded] bg-[#fafafa]">
          <input
            type="text"
            placeholder="Search backups by Backup ID or Cluster ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-md text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3] bg-white"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#fafafa] border-b border-[#eaeded] text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                <th className="py-2.5 px-4">Backup ID</th>
                <th className="py-2.5 px-4">Cluster ID</th>
                <th className="py-2.5 px-4">State</th>
                <th className="py-2.5 px-4">Mode</th>
                <th className="py-2.5 px-4">Created</th>
                <th className="py-2.5 px-4">Expires</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded] text-[13px]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#545b64]">
                    <div className="max-w-md mx-auto space-y-2">
                      <div className="text-[16px] font-bold text-[#16191f]">No backups found</div>
                      <p className="text-[13px] text-[#545b64]">
                        CloudHSM automatically creates backups of your clusters on a daily basis.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((b) => (
                  <tr key={b.backupId} className="hover:bg-[#f2f8fd]">
                    <td className="py-2.5 px-4 font-mono font-medium text-[#0972d3]">{b.backupId}</td>
                    <td className="py-2.5 px-4 font-mono">{b.clusterId || "-"}</td>
                    <td className="py-2.5 px-4">{b.backupState || "READY"}</td>
                    <td className="py-2.5 px-4">{b.mode || "FIPS"}</td>
                    <td className="py-2.5 px-4 text-[#545b64]">{b.createTimestamp || "-"}</td>
                    <td className="py-2.5 px-4 text-[#545b64]">{b.deleteTimestamp || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 border-t border-[#eaeded] text-[12px] text-[#545b64] bg-[#fafafa]">
          Showing {filtered.length} of {backups.length} backups
        </div>
      </div>
    </div>
  );
}
