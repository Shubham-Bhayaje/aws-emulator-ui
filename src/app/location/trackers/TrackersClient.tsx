"use client";

import Link from "next/link";
import { useState } from "react";
import { TrackerSummary, listTrackersAction, deleteTrackerAction } from "../actions";

interface Props {
  initialTrackers: TrackerSummary[];
}

export default function TrackersClient({ initialTrackers }: Props) {
  const [trackers, setTrackers] = useState<TrackerSummary[]>(initialTrackers);
  const [search, setSearch] = useState("");
  const [selectedTracker, setSelectedTracker] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const refreshTrackers = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await listTrackersAction();
      if (res.success) {
        setTrackers(res.trackers);
        if (selectedTracker && !res.trackers.some((t) => t.TrackerName === selectedTracker)) {
          setSelectedTracker(null);
        }
      } else {
        setErrorMsg(res.error || "Failed to load trackers");
      }
    } catch {
      setErrorMsg("Error refreshing trackers");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTracker || deleteConfirmName !== selectedTracker) return;
    setDeleting(true);
    setErrorMsg(null);
    try {
      const res = await deleteTrackerAction(selectedTracker);
      if (res.success) {
        setSuccessMsg(`Tracker "${selectedTracker}" successfully deleted.`);
        setDeleteModalOpen(false);
        setSelectedTracker(null);
        setDeleteConfirmName("");
        await refreshTrackers();
      } else {
        setErrorMsg(res.error || "Failed to delete tracker");
      }
    } catch {
      setErrorMsg("Error deleting tracker");
    } finally {
      setDeleting(false);
    }
  };

  const filtered = trackers.filter(
    (t) =>
      t.TrackerName.toLowerCase().includes(search.toLowerCase()) ||
      (t.Description && t.Description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center text-[12px] text-[#545b64]">
        <Link href="/location" className="hover:underline">
          Amazon Location Service
        </Link>
        <span className="mx-1 text-[#879596]">/</span>
        <span className="text-[#16191f] font-medium">Trackers</span>
      </div>

      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#eaeded]">
        <div>
          <h1 className="text-[20px] font-bold text-[#16191f]">Trackers ({trackers.length})</h1>
          <p className="text-[13px] text-[#545b64] mt-0.5">
            Capture, filter, and track device location updates from IoT devices and fleet assets.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refreshTrackers}
            disabled={loading}
            className="px-3 py-1.5 text-[13px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa]"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          <button
            onClick={() => {
              if (selectedTracker) {
                setDeleteConfirmName("");
                setDeleteModalOpen(true);
              }
            }}
            disabled={!selectedTracker}
            className={`px-3 py-1.5 text-[13px] font-medium rounded border ${
              selectedTracker
                ? "border-[#d5dbdb] text-[#16191f] hover:bg-[#fafafa]"
                : "border-[#eaeded] text-[#879596] cursor-not-allowed bg-[#fafafa]"
            }`}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Delete
          </button>
          <Link
            href="/location/trackers/create"
            className="px-4 py-1.5 text-[13px] font-bold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded inline-flex items-center justify-center transition-colors shadow-sm"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Create tracker
          </Link>
        </div>
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div className="p-3 bg-[#fdf2f2] border border-[#d13212] rounded text-[13px] text-[#d13212]">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="p-3 bg-[#f2f8f0] border border-[#1d8102] rounded text-[13px] text-[#1d8102]">
          {successMsg}
        </div>
      )}

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="w-full max-w-md">
          <input
            type="text"
            placeholder="Search trackers by name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="border border-[#eaeded] rounded bg-white overflow-hidden shadow-sm">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] font-medium">
            <tr>
              <th className="py-2.5 px-3 w-10 text-center"></th>
              <th className="py-2.5 px-4 font-semibold text-[#16191f]">Name</th>
              <th className="py-2.5 px-4 font-semibold text-[#16191f]">Description</th>
              <th className="py-2.5 px-4 font-semibold text-[#16191f]">Pricing plan</th>
              <th className="py-2.5 px-4 font-semibold text-[#16191f]">Created at</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eaeded]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-[#545b64]">
                  {search ? "No trackers found matching search criteria." : "No trackers created yet."}
                </td>
              </tr>
            ) : (
              filtered.map((trk) => (
                <tr
                  key={trk.TrackerName}
                  className={`hover:bg-[#f2f8fd] transition-colors cursor-pointer ${
                    selectedTracker === trk.TrackerName ? "bg-[#f2f8fd]" : ""
                  }`}
                  onClick={() => setSelectedTracker(selectedTracker === trk.TrackerName ? null : trk.TrackerName)}
                >
                  <td className="py-2.5 px-3 text-center">
                    <input
                      type="radio"
                      checked={selectedTracker === trk.TrackerName}
                      onChange={() => setSelectedTracker(trk.TrackerName)}
                      className="accent-[#ec7211]"
                    />
                  </td>
                  <td className="py-2.5 px-4 font-medium">
                    <Link
                      href={`/location/trackers/${trk.TrackerName}`}
                      className="text-[#0073bb] hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {trk.TrackerName}
                    </Link>
                  </td>
                  <td className="py-2.5 px-4 text-[#545b64]">{trk.Description || "—"}</td>
                  <td className="py-2.5 px-4 text-[#545b64]">{trk.PricingPlan || "RequestBasedUsage"}</td>
                  <td className="py-2.5 px-4 text-[#545b64]">
                    {trk.CreateTime ? new Date(trk.CreateTime).toLocaleString() : "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && selectedTracker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#d5dbdb] shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-[16px] font-bold text-[#16191f]">Delete tracker</h3>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to delete the tracker <strong className="text-[#16191f]">{selectedTracker}</strong>? All stored device position records will be removed.
            </p>
            <div>
              <label className="block text-[12px] font-medium text-[#16191f] mb-1">
                To confirm deletion, type <strong>{selectedTracker}</strong> below:
              </label>
              <input
                type="text"
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
                placeholder={selectedTracker}
                className="w-full px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#eaeded]">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-3 py-1.5 text-[13px] text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa]"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteConfirmName !== selectedTracker || deleting}
                className={`px-4 py-1.5 text-[13px] font-bold text-white rounded transition-colors ${
                  deleteConfirmName === selectedTracker && !deleting
                    ? "bg-[#d13212] hover:bg-[#b0270c]"
                    : "bg-[#eaeded] text-[#879596] cursor-not-allowed"
                }`}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
