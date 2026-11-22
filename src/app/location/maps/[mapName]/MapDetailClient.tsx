"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MapSummary, deleteMapAction } from "../../actions";

interface Props {
  map: MapSummary;
}

const PRESET_LOCATIONS = [
  { name: "Seattle, WA", lat: 47.6062, lng: -122.3321, zoom: 12 },
  { name: "New York, NY", lat: 40.7128, lng: -74.006, zoom: 12 },
  { name: "London, UK", lat: 51.5074, lng: -0.1278, zoom: 12 },
  { name: "Tokyo, Japan", lat: 35.6762, lng: 139.6503, zoom: 12 },
];

export default function MapDetailClient({ map }: Props) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"preview" | "embed" | "tags">("preview");
  const [zoomLevel, setZoomLevel] = useState(12);
  const [centerLoc, setCenterLoc] = useState(PRESET_LOCATIONS[0]);
  const [copiedArn, setCopiedArn] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCopyArn = () => {
    if (!map.MapArn) return;
    navigator.clipboard.writeText(map.MapArn);
    setCopiedArn(true);
    setTimeout(() => setCopiedArn(false), 2000);
  };

  const handleDelete = async () => {
    if (deleteConfirmName !== map.MapName) return;
    setDeleting(true);
    setErrorMsg(null);
    try {
      const res = await deleteMapAction(map.MapName);
      if (res.success) {
        router.push("/location/maps");
      } else {
        setErrorMsg(res.error || "Failed to delete map");
      }
    } catch {
      setErrorMsg("Error deleting map");
    } finally {
      setDeleting(false);
    }
  };

  const embedCodeSnippet = `<!-- MapLibre GL JS Integration for Amazon Location Service -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${map.MapName} Map</title>
  <link href="https://unpkg.com/maplibre-gl@3.x/dist/maplibre-gl.css" rel="stylesheet" />
  <script src="https://unpkg.com/maplibre-gl@3.x/dist/maplibre-gl.js"></script>
  <script src="https://unpkg.com/@aws/amazon-location-client"></script>
</head>
<body style="margin: 0; padding: 0;">
  <div id="map" style="width: 100vw; height: 100vh;"></div>
  <script>
    const map = new maplibregl.Map({
      container: "map",
      style: "https://maps.geo.us-east-1.amazonaws.com/maps/v0/maps/${map.MapName}/style-descriptor",
      center: [${centerLoc.lng}, ${centerLoc.lat}],
      zoom: ${zoomLevel},
      transformRequest: (url, resourceType) => {
        // Authenticate with Amazon Location API Key or Cognito Identity Pool
        return {
          url: url,
          headers: { "x-amz-user-agent": "aws-location-maplibre" }
        };
      }
    });
    map.addControl(new maplibregl.NavigationControl(), "top-right");
  </script>
</body>
</html>`;

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(embedCodeSnippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center text-[12px] text-[#545b64]">
        <Link href="/location" className="hover:underline">
          Amazon Location Service
        </Link>
        <span className="mx-1 text-[#879596]">/</span>
        <Link href="/location/maps" className="hover:underline">
          Maps
        </Link>
        <span className="mx-1 text-[#879596]">/</span>
        <span className="text-[#16191f] font-medium">{map.MapName}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#eaeded]">
        <div className="flex items-center gap-3">
          <h1 className="text-[20px] font-bold text-[#16191f]">{map.MapName}</h1>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#e7f4e4] text-[#1d8102] border border-[#b8dfaf]">
            Active
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("embed")}
            className="px-3 py-1.5 text-[13px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa]"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Embed map
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

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-3 bg-[#fdf2f2] border border-[#d13212] rounded text-[13px] text-[#d13212]">
          {errorMsg}
        </div>
      )}

      {/* Overview Metadata Cards */}
      <div className="bg-white border border-[#d5dbdb] rounded p-5 shadow-sm space-y-4">
        <h2 className="text-[15px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
          Map details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-[13px]">
          <div>
            <div className="text-[12px] text-[#545b64] font-medium">Style</div>
            <div className="font-mono text-[#16191f] font-semibold mt-0.5">
              {map.Style || "VectorEsriStreets"}
            </div>
          </div>
          <div>
            <div className="text-[12px] text-[#545b64] font-medium">Data provider</div>
            <div className="text-[#16191f] font-semibold mt-0.5">{map.DataSource || "Esri"}</div>
          </div>
          <div>
            <div className="text-[12px] text-[#545b64] font-medium">Pricing plan</div>
            <div className="text-[#16191f] font-semibold mt-0.5">
              {map.PricingPlan || "RequestBasedUsage"}
            </div>
          </div>
          <div>
            <div className="text-[12px] text-[#545b64] font-medium">Created at</div>
            <div className="text-[#16191f] mt-0.5">
              {map.CreateTime ? new Date(map.CreateTime).toLocaleString() : "-"}
            </div>
          </div>
        </div>

        {map.MapArn && (
          <div className="pt-2 border-t border-[#eaeded] flex items-center justify-between gap-4">
            <div className="truncate text-[12px] text-[#545b64]">
              <span className="font-medium text-[#16191f]">ARN: </span>
              <span className="font-mono text-[11px]">{map.MapArn}</span>
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
          onClick={() => setActiveTab("preview")}
          className={`pb-2.5 font-bold transition-colors border-b-2 ${
            activeTab === "preview"
              ? "border-[#ec7211] text-[#ec7211]"
              : "border-transparent text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          Interactive preview
        </button>
        <button
          onClick={() => setActiveTab("embed")}
          className={`pb-2.5 font-bold transition-colors border-b-2 ${
            activeTab === "embed"
              ? "border-[#ec7211] text-[#ec7211]"
              : "border-transparent text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          Embed code snippet
        </button>
      </div>

      {/* Tab 1: Interactive Preview Canvas */}
      {activeTab === "preview" && (
        <div className="bg-white border border-[#d5dbdb] rounded p-5 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-[14px] font-bold text-[#16191f]">Map canvas preview</h3>
              <p className="text-[12px] text-[#545b64]">
                Interactive viewport simulation for style <strong>{map.Style || "VectorEsriStreets"}</strong>.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-[#545b64] font-medium">Preset city:</span>
              <select
                value={centerLoc.name}
                onChange={(e) => {
                  const match = PRESET_LOCATIONS.find((p) => p.name === e.target.value);
                  if (match) setCenterLoc(match);
                }}
                className="px-2 py-1 text-[12px] border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
                style={{ height: "28px" }}
              >
                {PRESET_LOCATIONS.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Interactive SVG Canvas */}
          <div className="relative w-full h-[400px] bg-[#eef2f3] rounded border border-[#d5dbdb] overflow-hidden select-none">
            {/* Visual Basemap Grid & Features */}
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="street-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#d6dcde" strokeWidth="1" />
                </pattern>
                <pattern id="highway-grid" width="160" height="160" patternUnits="userSpaceOnUse">
                  <path d="M 160 0 L 0 0 0 160" fill="none" stroke="#ffd89b" strokeWidth="2.5" />
                </pattern>
              </defs>

              {/* Waterway polygon */}
              <path
                d="M -20 180 Q 200 120 400 240 T 900 160 L 900 450 L -20 450 Z"
                fill="#bce1f7"
              />

              {/* Park polygon */}
              <rect x="250" y="80" width="180" height="110" rx="10" fill="#d2edcb" stroke="#b2ddaa" strokeWidth="1" />
              <text x="340" y="140" textAnchor="middle" fill="#5a8b51" fontSize="12" fontWeight="bold">
                Metropolitan Park
              </text>

              {/* Street grid background */}
              <rect width="100%" height="100%" fill="url(#street-grid)" opacity="0.8" />
              <rect width="100%" height="100%" fill="url(#highway-grid)" opacity="0.6" />

              {/* Central Map Marker Pin */}
              <g transform="translate(350, 180)">
                <path
                  d="M 0 -28 C -12 -28 -16 -16 0 0 C 16 -16 12 -28 0 -28 Z"
                  fill="#d13212"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                <circle cx="0" cy="-18" r="4.5" fill="#ffffff" />
              </g>
            </svg>

            {/* Viewport UI Controls Overlay */}
            <div className="absolute top-3 right-3 bg-white/95 rounded border border-[#d5dbdb] shadow-md flex flex-col p-1 gap-1">
              <button
                onClick={() => setZoomLevel((z) => Math.min(18, z + 1))}
                className="w-7 h-7 flex items-center justify-center font-bold text-[#16191f] hover:bg-[#f2f3f3] rounded"
                title="Zoom in"
              >
                +
              </button>
              <div className="h-px bg-[#eaeded]" />
              <button
                onClick={() => setZoomLevel((z) => Math.max(1, z - 1))}
                className="w-7 h-7 flex items-center justify-center font-bold text-[#16191f] hover:bg-[#f2f3f3] rounded"
                title="Zoom out"
              >
                -
              </button>
            </div>

            {/* Bottom Coordinate Bar */}
            <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm rounded px-3 py-1 border border-[#d5dbdb] text-[11px] text-[#16191f] flex items-center gap-4">
              <div>
                <span className="text-[#545b64]">Center: </span>
                <span className="font-mono font-medium">
                  {centerLoc.lat.toFixed(4)}, {centerLoc.lng.toFixed(4)}
                </span>
              </div>
              <div className="border-l border-[#d5dbdb] pl-3">
                <span className="text-[#545b64]">Zoom: </span>
                <span className="font-mono font-semibold">{zoomLevel}</span>
              </div>
              <div className="border-l border-[#d5dbdb] pl-3">
                <span className="text-[#545b64]">Provider: </span>
                <span className="font-medium">{map.DataSource || "Esri"}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Embed Code Snippet */}
      {activeTab === "embed" && (
        <div className="bg-white border border-[#d5dbdb] rounded p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[14px] font-bold text-[#16191f]">
                MapLibre GL JS code snippet
              </h3>
              <p className="text-[12px] text-[#545b64]">
                Copy and paste this HTML template to embed your Amazon Location map into any front-end web project.
              </p>
            </div>
            <button
              onClick={handleCopySnippet}
              className="px-3 py-1.5 text-[12px] font-bold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              {copiedSnippet ? "Copied!" : "Copy code"}
            </button>
          </div>

          <pre className="bg-[#1e1e1e] text-[#d4d4d4] p-4 rounded text-[12px] font-mono overflow-x-auto leading-relaxed">
            {embedCodeSnippet}
          </pre>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#d5dbdb] shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-[16px] font-bold text-[#16191f]">Delete map</h3>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to delete the map <strong className="text-[#16191f]">{map.MapName}</strong>? This action cannot be undone.
            </p>
            <div>
              <label className="block text-[12px] font-medium text-[#16191f] mb-1">
                To confirm deletion, type <strong>{map.MapName}</strong> below:
              </label>
              <input
                type="text"
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
                placeholder={map.MapName}
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
                disabled={deleteConfirmName !== map.MapName || deleting}
                className={`px-4 py-1.5 text-[13px] font-bold text-white rounded transition-colors ${
                  deleteConfirmName === map.MapName && !deleting
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
