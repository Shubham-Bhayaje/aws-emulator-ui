"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BackupSummary } from "../types";
import { deleteBackupAction, restoreTableFromBackupAction } from "../actions";

interface BackupsClientProps {
  backups: BackupSummary[];
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default function BackupsClient({ backups }: BackupsClientProps) {
  const router = useRouter();
  const [backupsList, setBackupsList] = useState<BackupSummary[]>(backups);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Restore Modal
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupSummary | null>(null);
  const [restoreTableName, setRestoreTableName] = useState("");

  // Delete Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [backupToDelete, setBackupToDelete] = useState<BackupSummary | null>(null);

  const filteredBackups = backupsList.filter(
    (b) =>
      b.BackupName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.TableName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalBackupSize = backupsList.reduce((acc, b) => acc + (b.BackupSizeBytes || 0), 0);
  const uniqueTables = new Set(backupsList.map((b) => b.TableName)).size;

  function handleRestore() {
    if (!selectedBackup || !restoreTableName.trim()) return;
    setError(null);
    startTransition(async () => {
      const res = await restoreTableFromBackupAction(
        restoreTableName.trim(),
        selectedBackup.BackupArn
      );
      if (res.success) {
        setShowRestoreModal(false);
        setSuccessBanner(`Table '${restoreTableName}' restored from backup.`);
        router.push(`/dynamodb/tables/${encodeURIComponent(restoreTableName.trim())}`);
      } else {
        setError(res.error || "Failed to restore table from backup.");
      }
    });
  }

  function handleDelete() {
    if (!backupToDelete) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteBackupAction(backupToDelete.BackupArn);
      if (res.success) {
        setBackupsList(backupsList.filter((b) => b.BackupArn !== backupToDelete.BackupArn));
        setShowDeleteModal(false);
        setSuccessBanner(`Backup '${backupToDelete.BackupName}' deleted.`);
      } else {
        setError(res.error || "Failed to delete backup.");
      }
    });
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold text-[#16191f]">Backups</h1>
          <p className="text-[14px] text-[#545b64] mt-0.5">
            Manage point-in-time on-demand backups and recovery across your Amazon DynamoDB tables.
          </p>
        </div>
        <div>
          <Link
            href="/dynamodb/tables"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors"
          >
            Create backup from tables
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-[#fdf2f2] border-l-4 border-[#d13212] text-[13px] text-[#d13212] rounded flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="font-bold">&times;</button>
        </div>
      )}
      {successBanner && (
        <div className="p-3 bg-[#edf7ed] border-l-4 border-[#1d8102] text-[13px] text-[#1d8102] rounded flex justify-between items-center">
          <span>{successBanner}</span>
          <button onClick={() => setSuccessBanner(null)} className="font-bold">&times;</button>
        </div>
      )}

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wider">
            Total on-demand backups
          </div>
          <div className="text-[28px] font-bold text-[#16191f] mt-1">
            {backupsList.length}
          </div>
          <div className="text-[12px] text-[#545b64] mt-1">Across all tables</div>
        </div>

        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wider">
            Protected tables
          </div>
          <div className="text-[28px] font-bold text-[#16191f] mt-1">
            {uniqueTables}
          </div>
          <div className="text-[12px] text-[#1d8102] mt-1 font-medium">With active snapshots</div>
        </div>

        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wider">
            Total backup storage
          </div>
          <div className="text-[28px] font-bold text-[#16191f] mt-1">
            {formatBytes(totalBackupSize)}
          </div>
          <div className="text-[12px] text-[#545b64] mt-1">Snapshots data payload</div>
        </div>
      </div>

      {/* Backups Inventory Card */}
      <div className="bg-white border border-[#eaeded] rounded shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#eaeded] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Find backups by name or table"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
              className="w-full px-3 text-[13px] border border-[#eaeded] rounded focus:outline-none focus:border-[#ec7211]"
            />
          </div>
          <div className="text-[12px] text-[#545b64]">
            Showing {filteredBackups.length} of {backupsList.length} backups
          </div>
        </div>

        {filteredBackups.length === 0 ? (
          <div className="p-8 text-center text-[#545b64] text-[13px]">
            No on-demand backups found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[#fafafa] text-[#545b64] border-b border-[#eaeded] font-bold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="px-5 py-3">Backup name</th>
                  <th className="px-5 py-3">Source table</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Backup size</th>
                  <th className="px-5 py-3">Creation date</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded]">
                {filteredBackups.map((b) => (
                  <tr key={b.BackupArn} className="hover:bg-[#fafafa]">
                    <td className="px-5 py-3 font-bold text-[#16191f]">{b.BackupName}</td>
                    <td className="px-5 py-3">
                      <Link
                        href={`/dynamodb/tables/${encodeURIComponent(b.TableName)}`}
                        className="text-[#0073bb] hover:underline font-bold"
                      >
                        {b.TableName}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#edf7ed] text-[#1d8102]">
                        {b.BackupStatus}
                      </span>
                    </td>
                    <td className="px-5 py-3">{formatBytes(b.BackupSizeBytes)}</td>
                    <td className="px-5 py-3">{new Date(b.BackupCreationDateTime).toLocaleString()}</td>
                    <td className="px-5 py-3 text-right space-x-2">
                      <button
                        onClick={() => {
                          setSelectedBackup(b);
                          setRestoreTableName(`${b.TableName}-restored`);
                          setShowRestoreModal(true);
                        }}
                        className="text-[12px] text-[#0073bb] hover:underline font-bold"
                      >
                        Restore table
                      </button>
                      <span className="text-[#eaeded]">|</span>
                      <button
                        onClick={() => {
                          setBackupToDelete(b);
                          setShowDeleteModal(true);
                        }}
                        className="text-[12px] text-[#d13212] hover:underline font-bold"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Restore Modal */}
      {showRestoreModal && selectedBackup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-[#eaeded] rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">
              Restore table from backup: {selectedBackup.BackupName}
            </h3>
            <p className="text-[13px] text-[#545b64]">
              Restoring creates a brand new DynamoDB table with all items populated from this backup.
            </p>
            <div>
              <label className="block text-[12px] font-bold text-[#16191f]">
                Target table name <span className="text-[#d13212]">*</span>
              </label>
              <input
                type="text"
                required
                value={restoreTableName}
                onChange={(e) => setRestoreTableName(e.target.value)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                className="w-full px-3 text-[13px] border border-[#eaeded] rounded mt-1"
              />
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowRestoreModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 text-[13px] font-bold rounded border border-[#545b64] text-[#16191f]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRestore}
                disabled={isPending || !restoreTableName.trim()}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-5 text-[13px] font-bold rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
              >
                {isPending ? "Restoring..." : "Restore table"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Backup Modal */}
      {showDeleteModal && backupToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-[#eaeded] rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">
              Delete backup: {backupToDelete.BackupName}
            </h3>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to permanently delete backup <strong className="text-[#16191f]">{backupToDelete.BackupName}</strong>? This snapshot cannot be recovered once deleted.
            </p>
            <div className="flex justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 text-[13px] font-bold rounded border border-[#545b64] text-[#16191f]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-5 text-[13px] font-bold rounded bg-[#d13212] text-white hover:bg-[#b02a0f]"
              >
                {isPending ? "Deleting..." : "Delete backup"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
