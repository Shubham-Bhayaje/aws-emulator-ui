"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  RouteCalculatorSummary,
  deleteRouteCalculatorAction,
  calculateRouteAction,
} from "../../actions";

interface Props {
  calculator: RouteCalculatorSummary;
}

export default function RouteDetailClient({ calculator }: Props) {
  const router = useRouter();

  const [copiedArn, setCopiedArn] = useState(false);

  // Route calculation playground state
  const [depLng, setDepLng] = useState("-122.3321");
  const [depLat, setDepLat] = useState("47.6062");
  const [destLng, setDestLng] = useState("-122.3088");
  const [destLat, setDestLat] = useState("47.4502");
  const [travelMode, setTravelMode] = useState<"Car" | "Truck" | "Walking">("Car");

  const [calculating, setCalculating] = useState(false);
  const [routeResult, setRouteResult] = useState<{
    distanceKm?: number;
    durationSeconds?: number;
    notSupported?: boolean;
    note?: string;
  } | null>(null);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [deleting, setDeleting] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCopyArn = () => {
    if (!calculator.CalculatorArn) return;
    navigator.clipboard.writeText(calculator.CalculatorArn);
    setCopiedArn(true);
    setTimeout(() => setCopiedArn(false), 2000);
  };

  const handleCalculateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    const dLng = parseFloat(depLng);
    const dLat = parseFloat(depLat);
    const aLng = parseFloat(destLng);
    const aLat = parseFloat(destLat);

    if (isNaN(dLng) || isNaN(dLat) || isNaN(aLng) || isNaN(aLat)) {
      setErrorMsg("Departure and destination coordinates must be valid numbers.");
      return;
    }

    setCalculating(true);
    setErrorMsg(null);
    setRouteResult(null);

    try {
      const res = await calculateRouteAction({
        calculatorName: calculator.CalculatorName,
        departurePosition: [dLng, dLat],
        destinationPosition: [aLng, aLat],
        travelMode,
      });

      if (res.success) {
        setRouteResult({
          distanceKm: res.distanceKm,
          durationSeconds: res.durationSeconds,
        });
      } else if (res.notSupported) {
        // Calculate direct great-circle approximation for learner testing
        const dLatRad = ((aLat - dLat) * Math.PI) / 180;
        const dLngRad = ((aLng - dLng) * Math.PI) / 180;
        const a =
          Math.sin(dLatRad / 2) * Math.sin(dLatRad / 2) +
          Math.cos((dLat * Math.PI) / 180) *
            Math.cos((aLat * Math.PI) / 180) *
            Math.sin(dLngRad / 2) *
            Math.sin(dLngRad / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const straightKm = Math.round(6371 * c * 10) / 10;
        const estMinutes = Math.round((straightKm / (travelMode === "Walking" ? 4.5 : 55)) * 60);

        setRouteResult({
          notSupported: true,
          distanceKm: straightKm,
          durationSeconds: estMinutes * 60,
          note: "Calculated via direct geodesic estimation: The local AWS Emulator has not yet implemented the CalculateRoute API backend (operation is scaffolded).",
        });
      } else {
        setErrorMsg(res.error || "Failed to calculate route.");
      }
    } catch {
      setErrorMsg("Error communicating with route calculator.");
    } finally {
      setCalculating(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmName !== calculator.CalculatorName) return;
    setDeleting(true);
    setErrorMsg(null);
    try {
      const res = await deleteRouteCalculatorAction(calculator.CalculatorName);
      if (res.success) {
        router.push("/location/routes");
      } else {
        setErrorMsg(res.error || "Failed to delete route calculator");
      }
    } catch {
      setErrorMsg("Error deleting calculator");
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
        <Link href="/location/routes" className="hover:underline">
          Route calculators
        </Link>
        <span className="mx-1 text-[#879596]">/</span>
        <span className="text-[#16191f] font-medium">{calculator.CalculatorName}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#eaeded]">
        <div className="flex items-center gap-3">
          <h1 className="text-[20px] font-bold text-[#16191f]">{calculator.CalculatorName}</h1>
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

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-3 bg-[#fdf2f2] border border-[#d13212] rounded text-[13px] text-[#d13212]">
          {errorMsg}
        </div>
      )}

      {/* Overview Metadata Cards */}
      <div className="bg-white border border-[#d5dbdb] rounded p-5 shadow-sm space-y-4">
        <h2 className="text-[15px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
          Route calculator details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-[13px]">
          <div>
            <div className="text-[12px] text-[#545b64] font-medium">Data provider</div>
            <div className="text-[#16191f] font-semibold mt-0.5">
              {calculator.DataSource || "Esri"}
            </div>
          </div>
          <div>
            <div className="text-[12px] text-[#545b64] font-medium">Pricing plan</div>
            <div className="text-[#16191f] font-semibold mt-0.5">
              {calculator.PricingPlan || "RequestBasedUsage"}
            </div>
          </div>
          <div>
            <div className="text-[12px] text-[#545b64] font-medium">Description</div>
            <div className="text-[#16191f] mt-0.5">{calculator.Description || "—"}</div>
          </div>
          <div>
            <div className="text-[12px] text-[#545b64] font-medium">Created at</div>
            <div className="text-[#16191f] mt-0.5">
              {calculator.CreateTime ? new Date(calculator.CreateTime).toLocaleString() : "-"}
            </div>
          </div>
        </div>

        {calculator.CalculatorArn && (
          <div className="pt-2 border-t border-[#eaeded] flex items-center justify-between gap-4">
            <div className="truncate text-[12px] text-[#545b64]">
              <span className="font-medium text-[#16191f]">ARN: </span>
              <span className="font-mono text-[11px]">{calculator.CalculatorArn}</span>
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

      {/* Interactive Route Testing Playground */}
      <div className="bg-white border border-[#d5dbdb] rounded p-5 space-y-4 shadow-sm">
        <div>
          <h3 className="text-[15px] font-bold text-[#16191f]">
            Route calculation playground (CalculateRoute)
          </h3>
          <p className="text-[12px] text-[#545b64] mt-0.5">
            Test routing queries between two geographic coordinates using this calculator resource.
          </p>
        </div>

        <form onSubmit={handleCalculateRoute} className="space-y-4 text-[13px]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Departure */}
            <div className="bg-[#fafafa] p-3 rounded border border-[#eaeded] space-y-2">
              <div className="font-bold text-[#16191f] text-[12px]">Departure position</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-[#545b64] mb-1">Longitude</label>
                  <input
                    type="text"
                    required
                    value={depLng}
                    onChange={(e) => setDepLng(e.target.value)}
                    className="w-full px-2 py-1 text-[12px] border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211] bg-white"
                    style={{ height: "30px" }}
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#545b64] mb-1">Latitude</label>
                  <input
                    type="text"
                    required
                    value={depLat}
                    onChange={(e) => setDepLat(e.target.value)}
                    className="w-full px-2 py-1 text-[12px] border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211] bg-white"
                    style={{ height: "30px" }}
                  />
                </div>
              </div>
            </div>

            {/* Destination */}
            <div className="bg-[#fafafa] p-3 rounded border border-[#eaeded] space-y-2">
              <div className="font-bold text-[#16191f] text-[12px]">Destination position</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-[#545b64] mb-1">Longitude</label>
                  <input
                    type="text"
                    required
                    value={destLng}
                    onChange={(e) => setDestLng(e.target.value)}
                    className="w-full px-2 py-1 text-[12px] border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211] bg-white"
                    style={{ height: "30px" }}
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#545b64] mb-1">Latitude</label>
                  <input
                    type="text"
                    required
                    value={destLat}
                    onChange={(e) => setDestLat(e.target.value)}
                    className="w-full px-2 py-1 text-[12px] border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211] bg-white"
                    style={{ height: "30px" }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Travel Mode & Presets */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
            <div className="flex items-center gap-3">
              <span className="text-[12px] font-medium text-[#16191f]">Travel mode:</span>
              {(["Car", "Truck", "Walking"] as const).map((mode) => (
                <label key={mode} className="flex items-center gap-1.5 cursor-pointer text-[12px]">
                  <input
                    type="radio"
                    name="travelMode"
                    value={mode}
                    checked={travelMode === mode}
                    onChange={() => setTravelMode(mode)}
                    className="accent-[#ec7211]"
                  />
                  <span>{mode}</span>
                </label>
              ))}
            </div>

            <div className="flex items-center gap-2 text-[11px] text-[#545b64]">
              <span>Sample routes:</span>
              <button
                type="button"
                onClick={() => {
                  setDepLng("-122.3321");
                  setDepLat("47.6062");
                  setDestLng("-122.3088");
                  setDestLat("47.4502");
                }}
                className="text-[#0073bb] hover:underline"
              >
                Seattle &rarr; SeaTac Airport
              </button>
              <span>|</span>
              <button
                type="button"
                onClick={() => {
                  setDepLng("-122.3321");
                  setDepLat("47.6062");
                  setDestLng("-122.2015");
                  setDestLat("47.6101");
                }}
                className="text-[#0073bb] hover:underline"
              >
                Seattle &rarr; Bellevue
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-[#eaeded]">
            <button
              type="submit"
              disabled={calculating}
              className="px-4 py-1.5 text-[13px] font-bold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded transition-colors shadow-sm"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              {calculating ? "Calculating route..." : "Calculate route"}
            </button>
          </div>
        </form>

        {/* Route Calculation Result */}
        {routeResult && (
          <div className="mt-4 p-4 rounded border border-[#a4cbe8] bg-[#f2f8fd] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold text-[#16191f]">Calculation Results</span>
              {routeResult.notSupported && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#fff8e6] text-[#b35900] border border-[#fed688]">
                  Emulator Geodesic Estimation
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[13px] pt-1">
              <div className="bg-white p-3 rounded border border-[#d5dbdb]">
                <div className="text-[11px] text-[#545b64]">Total Distance</div>
                <div className="text-[16px] font-bold text-[#16191f] mt-0.5">
                  {routeResult.distanceKm?.toFixed(1)} km
                </div>
              </div>
              <div className="bg-white p-3 rounded border border-[#d5dbdb]">
                <div className="text-[11px] text-[#545b64]">Estimated Duration</div>
                <div className="text-[16px] font-bold text-[#16191f] mt-0.5">
                  {Math.round((routeResult.durationSeconds || 0) / 60)} minutes
                </div>
              </div>
              <div className="bg-white p-3 rounded border border-[#d5dbdb]">
                <div className="text-[11px] text-[#545b64]">Travel Mode</div>
                <div className="text-[16px] font-bold text-[#16191f] mt-0.5">
                  {travelMode}
                </div>
              </div>
            </div>

            {routeResult.note && (
              <p className="text-[11px] text-[#545b64] pt-1 leading-snug">
                {routeResult.note}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#d5dbdb] shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-[16px] font-bold text-[#16191f]">Delete route calculator</h3>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to delete <strong className="text-[#16191f]">{calculator.CalculatorName}</strong>? Applications calculating routes with this resource will receive errors.
            </p>
            <div>
              <label className="block text-[12px] font-medium text-[#16191f] mb-1">
                To confirm deletion, type <strong>{calculator.CalculatorName}</strong> below:
              </label>
              <input
                type="text"
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
                placeholder={calculator.CalculatorName}
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
                disabled={deleteConfirmName !== calculator.CalculatorName || deleting}
                className={`px-4 py-1.5 text-[13px] font-bold text-white rounded transition-colors ${
                  deleteConfirmName === calculator.CalculatorName && !deleting
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
