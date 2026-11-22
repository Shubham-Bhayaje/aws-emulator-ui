"use client";

import Link from "next/link";
import { useState } from "react";
import { MapSummary, listMapsAction, deleteMapAction } from "../actions";

interface Props {
  initialMaps: MapSummary[];
}

export default function MapsClient({ initialMaps }: Props) {
  const [maps, setMaps] = useState<MapSummary[]>(initialMaps);
  const [search, setSearch] = useState("");
  const [selectedMap, setSelectedMap] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const refreshMaps = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await listMapsAction();
      if (res.success) {
        setMaps(res.maps);
        if (selectedMap && !res.maps.some((m) => m.MapName === selectedMap)) {
          setSelectedMap(null);
        }
      } else {
        setErrorMsg(res.error || "Failed to load maps");
      }
    } catch {
      setErrorMsg("Error refreshing maps");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedMap || deleteConfirmName !== selectedMap) return;
    setDeleting(true);
    setErrorMsg(null);
    try {
      const res = await deleteMapAction(selectedMap);
      if (res.success) {
        setSuccessMsg(`Map "${selectedMap}" successfully deleted.`);
        setDeleteModalOpen(false);
        setSelectedMap(null);
        setDeleteConfirmName("");
        await refreshMaps();
      } else {
        setErrorMsg(res.error || "Failed to delete map");
      }
    } catch {
      setErrorMsg("Error deleting map");
    } finally {
      setDeleting(false);
    }
  };

  const filtered = maps.filter(
    (m) =>
      m.MapName.toLowerCase().includes(search.toLowerCase()) ||
      (m.Description && m.Description.toLowerCase().includes(search.toLowerCase())) ||
      (m.Style && m.Style.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center text-[12px] text-[#545b64]">
        <Link href="/location" className="hover:underline">
          Amazon Location Service
        </Link>
        <span className="mx-1 text-[#879596]">/</span>
        <span className="text-[#16191f] font-medium">Maps</span>
      </div>

      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#eaeded]">
        <div>
          <h1 className="text-[20px] font-bold text-[#16191f]">Maps ({maps.length})</h1>
          <p className="text-[13px] text-[#545b64] mt-0.5">
            Configure map resources to render vector and raster basemaps in web and mobile applications.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refreshMaps}
            disabled={loading}
            className="px-3 py-1.5 text-[13px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa]"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          <button
            onClick={() => {
              if (selectedMap) {
                setDeleteConfirmName("");
                setDeleteModalOpen(true);
              }
            }}
            disabled={!selectedMap}
            className={`px-3 py-1.5 text-[13px] font-medium rounded border ${
              selectedMap
                ? "border-[#d5dbdb] text-[#16191f] hover:bg-[#fafafa]"
                : "border-[#eaeded] text-[#879596] cursor-not-allowed bg-[#fafafa]"
            }`}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Delete
          </button>
          <Link
            href="/location/maps/create"
            className="px-4 py-1.5 text-[13px] font-bold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded inline-flex items-center justify-center transition-colors shadow-sm"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Create map
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
            placeholder="Search maps by name or style"
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
              <th className="py-2.5 px-4 font-semibold text-[#16191f]">Data provider</th>
              <th className="py-2.5 px-4 font-semibold text-[#16191f]">Style</th>
              <th className="py-2.5 px-4 font-semibold text-[#16191f]">Pricing plan</th>
              <th className="py-2.5 px-4 font-semibold text-[#16191f]">Created at</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eaeded]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[#545b64]">
                  {search ? "No maps found matching search criteria." : "No maps created yet."}
                </td>
              </tr>
            ) : (
              filtered.map((map) => (
                <tr
                  key={map.MapName}
                  className={`hover:bg-[#f2f8fd] transition-colors cursor-pointer ${
                    selectedMap === map.MapName ? "bg-[#f2f8fd]" : ""
                  }`}
                  onClick={() => setSelectedMap(selectedMap === map.MapName ? null : map.MapName)}
                >
                  <td className="py-2.5 px-3 text-center">
                    <input
                      type="radio"
                      checked={selectedMap === map.MapName}
                      onChange={() => setSelectedMap(map.MapName)}
                      className="accent-[#ec7211]"
                    />
                  </td>
                  <td className="py-2.5 px-4 font-medium">
                    <Link
                      href={`/location/maps/${map.MapName}`}
                      className="text-[#0073bb] hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {map.MapName}
                    </Link>
                    {map.Description && (
                      <div className="text-[11px] text-[#545b64]">{map.Description}</div>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-[#545b64]">{map.DataSource || "Esri"}</td>
                  <td className="py-2.5 px-4 font-mono text-[12px] text-[#16191f]">
                    {map.Style || "VectorEsriStreets"}
                  </td>
                  <td className="py-2.5 px-4 text-[#545b64]">{map.PricingPlan || "RequestBasedUsage"}</td>
                  <td className="py-2.5 px-4 text-[#545b64]">
                    {map.CreateTime ? new Date(map.CreateTime).toLocaleString() : "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && selectedMap && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#d5dbdb] shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-[16px] font-bold text-[#16191f]">Delete map</h3>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to delete the map <strong className="text-[#16191f]">{selectedMap}</strong>? This action cannot be undone. Front-end applications using this map will receive 404 errors.
            </p>
            <div>
              <label className="block text-[12px] font-medium text-[#16191f] mb-1">
                To confirm deletion, type <strong>{selectedMap}</strong> below:
              </label>
              <input
                type="text"
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
                placeholder={selectedMap}
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
                disabled={deleteConfirmName !== selectedMap || deleting}
                className={`px-4 py-1.5 text-[13px] font-bold text-white rounded transition-colors ${
                  deleteConfirmName === selectedMap && !deleting
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
