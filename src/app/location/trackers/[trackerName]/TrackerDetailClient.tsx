"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  TrackerSummary,
  DevicePosition,
  GeofenceCollectionSummary,
  deleteTrackerAction,
  batchUpdateDevicePositionAction,
  listTrackerDevicesAction,
  associateTrackerConsumerAction,
  disassociateTrackerConsumerAction,
  listTrackerConsumersAction,
} from "../../actions";

interface Props {
  tracker: TrackerSummary;
  initialDevices: DevicePosition[];
  initialConsumers: string[];
  availableCollections: GeofenceCollectionSummary[];
}

export default function TrackerDetailClient({
  tracker,
  initialDevices,
  initialConsumers,
  availableCollections,
}: Props) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"devices" | "geofences" | "settings">("devices");
  const [devices, setDevices] = useState<DevicePosition[]>(initialDevices);
  const [consumers, setConsumers] = useState<string[]>(initialConsumers);
  const [copiedArn, setCopiedArn] = useState(false);

  // Device simulation state
  const [simDeviceId, setSimDeviceId] = useState("truck-101");
  const [simLng, setSimLng] = useState("-122.3321");
  const [simLat, setSimLat] = useState("47.6062");
  const [updatingPos, setUpdatingPos] = useState(false);

  // Link geofence modal state
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [selectedCollectionArn, setSelectedCollectionArn] = useState(
    availableCollections[0]?.CollectionArn || ""
  );
  const [linking, setLinking] = useState(false);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [deleting, setDeleting] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleCopyArn = () => {
    if (!tracker.TrackerArn) return;
    navigator.clipboard.writeText(tracker.TrackerArn);
    setCopiedArn(true);
    setTimeout(() => setCopiedArn(false), 2000);
  };

  const refreshDevices = async () => {
    try {
      const res = await listTrackerDevicesAction(tracker.TrackerName);
      if (res.success) {
        setDevices(res.devices);
      }
    } catch {
      // ignore
    }
  };

  const handleSendPositionUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simDeviceId.trim()) return;
    const lng = parseFloat(simLng);
    const lat = parseFloat(simLat);
    if (isNaN(lng) || isNaN(lat)) {
      setErrorMsg("Longitude and Latitude must be valid numbers.");
      return;
    }

    setUpdatingPos(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await batchUpdateDevicePositionAction(tracker.TrackerName, [
        {
          deviceId: simDeviceId.trim(),
          position: [lng, lat],
          sampleTime: new Date().toISOString(),
        },
      ]);

      if (res.success) {
        setSuccessMsg(`Position update received for device "${simDeviceId.trim()}".`);
        await refreshDevices();
      } else {
        setErrorMsg(res.error || "Failed to update device position.");
      }
    } catch {
      setErrorMsg("Error communicating with location tracker.");
    } finally {
      setUpdatingPos(false);
    }
  };

  const handleAssociateConsumer = async () => {
    if (!selectedCollectionArn) return;
    setLinking(true);
    setErrorMsg(null);
    try {
      const res = await associateTrackerConsumerAction(tracker.TrackerName, selectedCollectionArn);
      if (res.success) {
        setSuccessMsg("Geofence collection linked successfully.");
        setLinkModalOpen(false);
        const next = await listTrackerConsumersAction(tracker.TrackerName);
        if (next.success) setConsumers(next.consumerArns);
      } else {
        setErrorMsg(res.error || "Failed to link geofence collection.");
      }
    } catch {
      setErrorMsg("Error linking consumer.");
    } finally {
      setLinking(false);
    }
  };

  const handleDisassociateConsumer = async (arn: string) => {
    setErrorMsg(null);
    try {
      const res = await disassociateTrackerConsumerAction(tracker.TrackerName, arn);
      if (res.success) {
        setSuccessMsg("Geofence collection unlinked.");
        const next = await listTrackerConsumersAction(tracker.TrackerName);
        if (next.success) setConsumers(next.consumerArns);
      } else {
        setErrorMsg(res.error || "Failed to unlink consumer.");
      }
    } catch {
      setErrorMsg("Error unlinking consumer.");
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmName !== tracker.TrackerName) return;
    setDeleting(true);
    setErrorMsg(null);
    try {
      const res = await deleteTrackerAction(tracker.TrackerName);
      if (res.success) {
        router.push("/location/trackers");
      } else {
        setErrorMsg(res.error || "Failed to delete tracker");
      }
    } catch {
      setErrorMsg("Error deleting tracker");
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
        <Link href="/location/trackers" className="hover:underline">
          Trackers
        </Link>
        <span className="mx-1 text-[#879596]">/</span>
        <span className="text-[#16191f] font-medium">{tracker.TrackerName}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#eaeded]">
        <div className="flex items-center gap-3">
          <h1 className="text-[20px] font-bold text-[#16191f]">{tracker.TrackerName}</h1>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#e7f4e4] text-[#1d8102] border border-[#b8dfaf]">
            Active
          </span>
        </div>
        <div className="flex items-center gap-2">
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
          Tracker details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-[13px]">
          <div>
            <div className="text-[12px] text-[#545b64] font-medium">Position filtering</div>
            <div className="font-mono text-[#16191f] font-semibold mt-0.5">
              {tracker.PositionFiltering || "TimeBased"}
            </div>
          </div>
          <div>
            <div className="text-[12px] text-[#545b64] font-medium">Pricing plan</div>
            <div className="text-[#16191f] font-semibold mt-0.5">
              {tracker.PricingPlan || "RequestBasedUsage"}
            </div>
          </div>
          <div>
            <div className="text-[12px] text-[#545b64] font-medium">Active devices</div>
            <div className="text-[#16191f] font-semibold mt-0.5">{devices.length}</div>
          </div>
          <div>
            <div className="text-[12px] text-[#545b64] font-medium">Created at</div>
            <div className="text-[#16191f] mt-0.5">
              {tracker.CreateTime ? new Date(tracker.CreateTime).toLocaleString() : "-"}
            </div>
          </div>
        </div>

        {tracker.TrackerArn && (
          <div className="pt-2 border-t border-[#eaeded] flex items-center justify-between gap-4">
            <div className="truncate text-[12px] text-[#545b64]">
              <span className="font-medium text-[#16191f]">ARN: </span>
              <span className="font-mono text-[11px]">{tracker.TrackerArn}</span>
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

      {/* Tabs */}
      <div className="border-b border-[#eaeded] flex gap-6 text-[14px]">
        <button
          onClick={() => setActiveTab("devices")}
          className={`pb-2.5 font-bold transition-colors border-b-2 ${
            activeTab === "devices"
              ? "border-[#ec7211] text-[#ec7211]"
              : "border-transparent text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          Device positions ({devices.length})
        </button>
        <button
          onClick={() => setActiveTab("geofences")}
          className={`pb-2.5 font-bold transition-colors border-b-2 ${
            activeTab === "geofences"
              ? "border-[#ec7211] text-[#ec7211]"
              : "border-transparent text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          Linked geofence collections ({consumers.length})
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`pb-2.5 font-bold transition-colors border-b-2 ${
            activeTab === "settings"
              ? "border-[#ec7211] text-[#ec7211]"
              : "border-transparent text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          Configuration settings
        </button>
      </div>

      {/* Tab 1: Device Positions & Live Telemetry Simulator */}
      {activeTab === "devices" && (
        <div className="space-y-6">
          {/* Telemetry Simulator Form */}
          <div className="bg-[#f2f8fd] border border-[#a4cbe8] rounded p-5 space-y-4">
            <div>
              <h3 className="text-[15px] font-bold text-[#16191f]">
                Simulate device position update (BatchUpdateDevicePosition)
              </h3>
              <p className="text-[12px] text-[#545b64] mt-0.5">
                Send a real telemetry coordinate update to this tracker using the AWS Location SDK.
              </p>
            </div>

            <form onSubmit={handleSendPositionUpdate} className="flex flex-wrap items-end gap-3 text-[13px]">
              <div>
                <label className="block text-[12px] font-medium text-[#16191f] mb-1">
                  Device ID
                </label>
                <input
                  type="text"
                  required
                  value={simDeviceId}
                  onChange={(e) => setSimDeviceId(e.target.value)}
                  placeholder="e.g. truck-101"
                  className="px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211] bg-white"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", width: "160px" }}
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#16191f] mb-1">
                  Longitude
                </label>
                <input
                  type="text"
                  required
                  value={simLng}
                  onChange={(e) => setSimLng(e.target.value)}
                  placeholder="-122.3321"
                  className="px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211] bg-white"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", width: "140px" }}
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#16191f] mb-1">
                  Latitude
                </label>
                <input
                  type="text"
                  required
                  value={simLat}
                  onChange={(e) => setSimLat(e.target.value)}
                  placeholder="47.6062"
                  className="px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211] bg-white"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", width: "140px" }}
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={updatingPos}
                  className="px-4 py-1.5 text-[13px] font-bold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded transition-colors shadow-sm"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  {updatingPos ? "Sending update..." : "Send position"}
                </button>
              </div>

              {/* Quick Coordinates Presets */}
              <div className="w-full flex items-center gap-2 text-[11px] text-[#545b64] pt-1">
                <span>Quick presets:</span>
                <button
                  type="button"
                  onClick={() => {
                    setSimLng("-122.3321");
                    setSimLat("47.6062");
                  }}
                  className="text-[#0073bb] hover:underline"
                >
                  Seattle Downtown
                </button>
                <span>|</span>
                <button
                  type="button"
                  onClick={() => {
                    setSimLng("-122.3088");
                    setSimLat("47.4502");
                  }}
                  className="text-[#0073bb] hover:underline"
                >
                  SeaTac Airport
                </button>
                <span>|</span>
                <button
                  type="button"
                  onClick={() => {
                    setSimLng("-122.3533");
                    setSimLat("47.6253");
                  }}
                  className="text-[#0073bb] hover:underline"
                >
                  Seattle Harbor
                </button>
              </div>
            </form>
          </div>

          {/* Active Devices Table */}
          <div className="bg-white border border-[#d5dbdb] rounded overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-[#eaeded] flex items-center justify-between">
              <h4 className="text-[14px] font-bold text-[#16191f]">
                Recorded device positions ({devices.length})
              </h4>
              <button
                onClick={refreshDevices}
                className="text-[12px] text-[#0073bb] hover:underline font-medium"
              >
                Refresh positions
              </button>
            </div>

            <table className="w-full text-left text-[13px]">
              <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] font-medium">
                <tr>
                  <th className="py-2.5 px-4 font-semibold text-[#16191f]">Device ID</th>
                  <th className="py-2.5 px-4 font-semibold text-[#16191f]">Position [Longitude, Latitude]</th>
                  <th className="py-2.5 px-4 font-semibold text-[#16191f]">Sample time</th>
                  <th className="py-2.5 px-4 font-semibold text-[#16191f]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded]">
                {devices.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-[#545b64]">
                      No device positions recorded yet. Use the simulator above to submit your first position update.
                    </td>
                  </tr>
                ) : (
                  devices.map((dev) => (
                    <tr key={dev.DeviceId} className="hover:bg-[#f2f8fd]">
                      <td className="py-2.5 px-4 font-mono font-medium text-[#0073bb]">
                        {dev.DeviceId}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[12px] text-[#16191f]">
                        [{dev.Position[0].toFixed(5)}, {dev.Position[1].toFixed(5)}]
                      </td>
                      <td className="py-2.5 px-4 text-[#545b64]">
                        {dev.SampleTime ? new Date(dev.SampleTime).toLocaleString() : "-"}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#e7f4e4] text-[#1d8102]">
                          Recorded
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Linked Geofence Collections */}
      {activeTab === "geofences" && (
        <div className="bg-white border border-[#d5dbdb] rounded p-5 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#eaeded] pb-2">
            <div>
              <h3 className="text-[14px] font-bold text-[#16191f]">
                Linked geofence collections ({consumers.length})
              </h3>
              <p className="text-[12px] text-[#545b64]">
                When linked, device position updates are automatically evaluated against collection perimeters to trigger enter and exit events.
              </p>
            </div>
            <button
              onClick={() => setLinkModalOpen(true)}
              disabled={availableCollections.length === 0}
              className={`px-3 py-1.5 text-[13px] font-medium rounded border ${
                availableCollections.length > 0
                  ? "border-[#d5dbdb] text-[#16191f] hover:bg-[#fafafa]"
                  : "border-[#eaeded] text-[#879596] cursor-not-allowed bg-[#fafafa]"
              }`}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              Link collection
            </button>
          </div>

          {availableCollections.length === 0 && (
            <div className="p-3 bg-[#f2f8fd] border border-[#a4cbe8] rounded text-[12px] text-[#545b64]">
              No geofence collections found in this account. Create a collection first under{" "}
              <Link href="/location/geofences/create" className="text-[#0073bb] underline">
                Geofence collections
              </Link>
              .
            </div>
          )}

          <div className="divide-y divide-[#eaeded]">
            {consumers.length === 0 ? (
              <div className="py-8 text-center text-[#545b64] text-[13px]">
                No geofence collections currently linked to this tracker.
              </div>
            ) : (
              consumers.map((arn) => {
                const colName = arn.split("/").pop() || arn;
                return (
                  <div key={arn} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-[#16191f] text-[13px]">{colName}</div>
                      <div className="font-mono text-[11px] text-[#879596]">{arn}</div>
                    </div>
                    <button
                      onClick={() => handleDisassociateConsumer(arn)}
                      className="text-[12px] text-[#d13212] hover:underline"
                    >
                      Unlink
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Configuration Settings */}
      {activeTab === "settings" && (
        <div className="bg-white border border-[#d5dbdb] rounded p-5 space-y-4 shadow-sm text-[13px]">
          <h3 className="text-[15px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
            Configuration summary
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-[#545b64] font-medium">Position filtering:</span>
              <p className="text-[#16191f] mt-0.5 font-mono">{tracker.PositionFiltering || "TimeBased"}</p>
            </div>
            <div>
              <span className="text-[#545b64] font-medium">Encryption key:</span>
              <p className="text-[#16191f] mt-0.5 font-mono">
                {tracker.KmsKeyId || "AWS owned key"}
              </p>
            </div>
            <div>
              <span className="text-[#545b64] font-medium">EventBridge integration:</span>
              <p className="text-[#16191f] mt-0.5">
                Active (triggers whenever linked geofence boundary is crossed)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Link Collection Modal */}
      {linkModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#d5dbdb] shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-[16px] font-bold text-[#16191f]">Link geofence collection</h3>
            <p className="text-[13px] text-[#545b64]">
              Select a geofence collection to link as a consumer for this tracker. Position updates will automatically be evaluated against geofences.
            </p>
            <div>
              <label className="block text-[12px] font-medium text-[#16191f] mb-1">
                Geofence collection
              </label>
              <select
                value={selectedCollectionArn}
                onChange={(e) => setSelectedCollectionArn(e.target.value)}
                className="w-full px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
              >
                {availableCollections.map((col) => (
                  <option key={col.CollectionArn || col.CollectionName} value={col.CollectionArn}>
                    {col.CollectionName}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#eaeded]">
              <button
                onClick={() => setLinkModalOpen(false)}
                className="px-3 py-1.5 text-[13px] text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa]"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Cancel
              </button>
              <button
                onClick={handleAssociateConsumer}
                disabled={linking || !selectedCollectionArn}
                className="px-4 py-1.5 text-[13px] font-bold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded transition-colors"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                {linking ? "Linking..." : "Link collection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#d5dbdb] shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-[16px] font-bold text-[#16191f]">Delete tracker</h3>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to delete the tracker <strong className="text-[#16191f]">{tracker.TrackerName}</strong>? All stored device position records will be removed.
            </p>
            <div>
              <label className="block text-[12px] font-medium text-[#16191f] mb-1">
                To confirm deletion, type <strong>{tracker.TrackerName}</strong> below:
              </label>
              <input
                type="text"
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
                placeholder={tracker.TrackerName}
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
                disabled={deleteConfirmName !== tracker.TrackerName || deleting}
                className={`px-4 py-1.5 text-[13px] font-bold text-white rounded transition-colors ${
                  deleteConfirmName === tracker.TrackerName && !deleting
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
