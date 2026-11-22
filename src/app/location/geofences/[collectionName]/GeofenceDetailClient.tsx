"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  GeofenceCollectionSummary,
  GeofenceItem,
  putGeofenceAction,
  listGeofencesAction,
  batchDeleteGeofenceAction,
  deleteGeofenceCollectionAction,
} from "../../actions";

interface Props {
  collection: GeofenceCollectionSummary;
  initialGeofences: GeofenceItem[];
}

export default function GeofenceDetailClient({ collection, initialGeofences }: Props) {
  const router = useRouter();

  const [geofences, setGeofences] = useState<GeofenceItem[]>(initialGeofences);
  const [selectedGeofenceId, setSelectedGeofenceId] = useState<string | null>(null);
  const [copiedArn, setCopiedArn] = useState(false);

  // Add Geofence Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [geoId, setGeoId] = useState("");
  const [geoType, setGeoType] = useState<"Circle" | "Polygon">("Circle");
  const [geoLng, setGeoLng] = useState("-122.3321");
  const [geoLat, setGeoLat] = useState("47.6062");
  const [geoRadius, setGeoRadius] = useState("1500");
  const [savingGeofence, setSavingGeofence] = useState(false);

  // Delete Collection Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [deleting, setDeleting] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleCopyArn = () => {
    if (!collection.CollectionArn) return;
    navigator.clipboard.writeText(collection.CollectionArn);
    setCopiedArn(true);
    setTimeout(() => setCopiedArn(false), 2000);
  };

  const refreshGeofences = async () => {
    try {
      const res = await listGeofencesAction(collection.CollectionName);
      if (res.success) {
        setGeofences(res.geofences);
      }
    } catch {
      // ignore
    }
  };

  const handleAddGeofence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!geoId.trim()) return;

    setSavingGeofence(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const lng = parseFloat(geoLng);
      const lat = parseFloat(geoLat);
      const radius = parseFloat(geoRadius);

      if (geoType === "Circle" && (isNaN(lng) || isNaN(lat) || isNaN(radius) || radius <= 0)) {
        setErrorMsg("Center coordinates and radius must be valid positive numbers.");
        setSavingGeofence(false);
        return;
      }

      const res = await putGeofenceAction({
        collectionName: collection.CollectionName,
        geofenceId: geoId.trim(),
        type: "Circle",
        center: [lng, lat],
        radius,
      });

      if (res.success) {
        setSuccessMsg(`Geofence "${geoId.trim()}" successfully created.`);
        setAddModalOpen(false);
        setGeoId("");
        await refreshGeofences();
      } else {
        setErrorMsg(res.error || "Failed to add geofence.");
      }
    } catch {
      setErrorMsg("Error creating geofence.");
    } finally {
      setSavingGeofence(false);
    }
  };

  const handleDeleteGeofence = async (id: string) => {
    setErrorMsg(null);
    try {
      const res = await batchDeleteGeofenceAction(collection.CollectionName, [id]);
      if (res.success) {
        setSuccessMsg(`Geofence "${id}" deleted.`);
        await refreshGeofences();
        if (selectedGeofenceId === id) setSelectedGeofenceId(null);
      } else {
        setErrorMsg(res.error || "Failed to delete geofence.");
      }
    } catch {
      setErrorMsg("Error deleting geofence.");
    }
  };

  const handleDeleteCollection = async () => {
    if (deleteConfirmName !== collection.CollectionName) return;
    setDeleting(true);
    setErrorMsg(null);
    try {
      const res = await deleteGeofenceCollectionAction(collection.CollectionName);
      if (res.success) {
        router.push("/location/geofences");
      } else {
        setErrorMsg(res.error || "Failed to delete geofence collection");
      }
    } catch {
      setErrorMsg("Error deleting collection");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center text-[12px] text-[#545b64]">
        <Link href="/location" className="hover:underline">
          Amazon Location Service
        </Link>
        <span className="mx-1 text-[#879596]">/</span>
        <Link href="/location/geofences" className="hover:underline">
          Geofence collections
        </Link>
        <span className="mx-1 text-[#879596]">/</span>
        <span className="text-[#16191f] font-medium">{collection.CollectionName}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#eaeded]">
        <div className="flex items-center gap-3">
          <h1 className="text-[20px] font-bold text-[#16191f]">{collection.CollectionName}</h1>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#e7f4e4] text-[#1d8102] border border-[#b8dfaf]">
            Active
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAddModalOpen(true)}
            className="px-4 py-1.5 text-[13px] font-bold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded shadow-sm transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Add geofence
          </button>
          <button
            onClick={() => {
              setDeleteConfirmName("");
              setDeleteModalOpen(true);
            }}
            className="px-3 py-1.5 text-[13px] font-medium text-[#d13212] border border-[#d5dbdb] rounded hover:bg-[#fafafa]"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Delete
          </button>
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

      {/* Overview Metadata Cards */}
      <div className="bg-white border border-[#d5dbdb] rounded p-5 shadow-sm space-y-4">
        <h2 className="text-[15px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
          Collection details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-[13px]">
          <div>
            <div className="text-[12px] text-[#545b64] font-medium">Pricing plan</div>
            <div className="text-[#16191f] font-semibold mt-0.5">
              {collection.PricingPlan || "RequestBasedUsage"}
            </div>
          </div>
          <div>
            <div className="text-[12px] text-[#545b64] font-medium">Encryption key</div>
            <div className="font-mono text-[#16191f] font-semibold mt-0.5">
              {collection.KmsKeyId || "AWS owned key"}
            </div>
          </div>
          <div>
            <div className="text-[12px] text-[#545b64] font-medium">Geofence count</div>
            <div className="text-[#16191f] font-semibold mt-0.5">{geofences.length}</div>
          </div>
          <div>
            <div className="text-[12px] text-[#545b64] font-medium">Created at</div>
            <div className="text-[#16191f] mt-0.5">
              {collection.CreateTime ? new Date(collection.CreateTime).toLocaleString() : "-"}
            </div>
          </div>
        </div>

        {collection.CollectionArn && (
          <div className="pt-2 border-t border-[#eaeded] flex items-center justify-between gap-4">
            <div className="truncate text-[12px] text-[#545b64]">
              <span className="font-medium text-[#16191f]">ARN: </span>
              <span className="font-mono text-[11px]">{collection.CollectionArn}</span>
            </div>
            <button
              onClick={handleCopyArn}
              className="text-[12px] text-[#0073bb] hover:underline font-medium shrink-0"
            >
              {copiedArn ? "Copied!" : "Copy ARN"}
            </button>
          </div>
        )}
      </div>

      {/* Geofences List Table */}
      <div className="bg-white border border-[#d5dbdb] rounded overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-[#eaeded] flex items-center justify-between">
          <h3 className="text-[14px] font-bold text-[#16191f]">
            Geofences in collection ({geofences.length})
          </h3>
          <button
            onClick={refreshGeofences}
            className="text-[12px] text-[#0073bb] hover:underline font-medium"
          >
            Refresh
          </button>
        </div>

        <table className="w-full text-left text-[13px]">
          <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] font-medium">
            <tr>
              <th className="py-2.5 px-4 font-semibold text-[#16191f]">Geofence ID</th>
              <th className="py-2.5 px-4 font-semibold text-[#16191f]">Geometry type</th>
              <th className="py-2.5 px-4 font-semibold text-[#16191f]">Parameters</th>
              <th className="py-2.5 px-4 font-semibold text-[#16191f]">Status</th>
              <th className="py-2.5 px-4 font-semibold text-[#16191f]">Created at</th>
              <th className="py-2.5 px-4 text-right font-semibold text-[#16191f]">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eaeded]">
            {geofences.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[#545b64]">
                  No geofences in this collection. Click &quot;Add geofence&quot; to define a circular or polygonal boundary.
                </td>
              </tr>
            ) : (
              geofences.map((geo) => (
                <tr key={geo.GeofenceId} className="hover:bg-[#f2f8fd]">
                  <td className="py-2.5 px-4 font-medium text-[#16191f]">
                    {geo.GeofenceId}
                  </td>
                  <td className="py-2.5 px-4 text-[#545b64]">{geo.GeometryType}</td>
                  <td className="py-2.5 px-4 font-mono text-[11px] text-[#16191f]">
                    {geo.Circle
                      ? `Center: [${geo.Circle.Center[0].toFixed(4)}, ${geo.Circle.Center[1].toFixed(4)}], Radius: ${geo.Circle.Radius}m`
                      : "Polygon coordinates"}
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#e7f4e4] text-[#1d8102]">
                      {geo.Status || "ACTIVE"}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-[#545b64]">
                    {geo.CreateTime ? new Date(geo.CreateTime).toLocaleString() : "-"}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <button
                      onClick={() => handleDeleteGeofence(geo.GeofenceId)}
                      className="text-[12px] text-[#d13212] hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Geofence Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#d5dbdb] shadow-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-[16px] font-bold text-[#16191f]">Add geofence (PutGeofence)</h3>
            <p className="text-[12px] text-[#545b64]">
              Define a geographic boundary for this collection. Devices entering or leaving this zone will trigger alerts.
            </p>

            <form onSubmit={handleAddGeofence} className="space-y-4 text-[13px]">
              <div>
                <label className="block text-[12px] font-medium text-[#16191f] mb-1">
                  Geofence ID <span className="text-[#d13212]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={geoId}
                  onChange={(e) => setGeoId(e.target.value)}
                  placeholder="e.g. seattle-depot-north"
                  className="w-full px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#16191f] mb-1">
                  Geometry type
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="geoType"
                      value="Circle"
                      checked={geoType === "Circle"}
                      onChange={() => setGeoType("Circle")}
                      className="accent-[#ec7211]"
                    />
                    <span>Circle (Center coordinate + Radius)</span>
                  </label>
                </div>
              </div>

              {geoType === "Circle" && (
                <div className="grid grid-cols-2 gap-3 bg-[#fafafa] p-3 rounded border border-[#eaeded]">
                  <div>
                    <label className="block text-[11px] font-medium text-[#16191f] mb-1">
                      Center Longitude
                    </label>
                    <input
                      type="text"
                      required
                      value={geoLng}
                      onChange={(e) => setGeoLng(e.target.value)}
                      placeholder="-122.3321"
                      className="w-full px-2 py-1 text-[12px] border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211] bg-white"
                      style={{ height: "30px" }}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#16191f] mb-1">
                      Center Latitude
                    </label>
                    <input
                      type="text"
                      required
                      value={geoLat}
                      onChange={(e) => setGeoLat(e.target.value)}
                      placeholder="47.6062"
                      className="w-full px-2 py-1 text-[12px] border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211] bg-white"
                      style={{ height: "30px" }}
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[11px] font-medium text-[#16191f] mb-1">
                      Radius (meters)
                    </label>
                    <input
                      type="number"
                      required
                      min={10}
                      max={100000}
                      value={geoRadius}
                      onChange={(e) => setGeoRadius(e.target.value)}
                      placeholder="1500"
                      className="w-full px-2 py-1 text-[12px] border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211] bg-white"
                      style={{ height: "30px" }}
                    />
                    <p className="text-[10px] text-[#545b64] mt-1">
                      Default: 1,500 meters (~0.93 miles) around center point.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-[#eaeded]">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-3 py-1.5 text-[13px] text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa]"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingGeofence}
                  className="px-4 py-1.5 text-[13px] font-bold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded transition-colors shadow-sm"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  {savingGeofence ? "Saving..." : "Add geofence"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Collection Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#d5dbdb] shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-[16px] font-bold text-[#16191f]">Delete geofence collection</h3>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to delete <strong className="text-[#16191f]">{collection.CollectionName}</strong>? All {geofences.length} geofence boundaries will be permanently removed.
            </p>
            <div>
              <label className="block text-[12px] font-medium text-[#16191f] mb-1">
                To confirm deletion, type <strong>{collection.CollectionName}</strong> below:
              </label>
              <input
                type="text"
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
                placeholder={collection.CollectionName}
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
                onClick={handleDeleteCollection}
                disabled={deleteConfirmName !== collection.CollectionName || deleting}
                className={`px-4 py-1.5 text-[13px] font-bold text-white rounded transition-colors ${
                  deleteConfirmName === collection.CollectionName && !deleting
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
