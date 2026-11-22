"use client";

import Link from "next/link";
import { useState } from "react";
import { LocationDashboardStats, getLocationDashboardStatsAction } from "./actions";

interface Props {
  initialStats: LocationDashboardStats;
}

export default function LocationDashboardClient({ initialStats }: Props) {
  const [stats, setStats] = useState<LocationDashboardStats>(initialStats);
  const [refreshing, setRefreshing] = useState(false);

  const refreshStats = async () => {
    setRefreshing(true);
    try {
      const next = await getLocationDashboardStatsAction();
      setStats(next);
    } catch {
      // ignore
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center text-[12px] text-[#545b64]">
        <span>Amazon Location Service</span>
        <span className="mx-1 text-[#879596]">/</span>
        <span className="text-[#16191f] font-medium">Overview</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#eaeded]">
        <div>
          <h1 className="text-[24px] font-bold text-[#16191f]">Amazon Location Service</h1>
          <p className="text-[14px] text-[#545b64] mt-1">
            Easily add location data, maps, geocoding, routing, and device tracking to your applications securely using trusted geospatial data providers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refreshStats}
            disabled={refreshing}
            className="px-3 py-1.5 text-[13px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa] transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Resource Inventory Cards */}
      <div>
        <h2 className="text-[16px] font-bold text-[#16191f] mb-3">Service resources</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Maps */}
          <div className="bg-white border border-[#d5dbdb] rounded p-4 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-bold text-[#16191f]">Maps</span>
                <span className="text-[12px] font-mono px-2 py-0.5 bg-[#f2f3f3] text-[#16191f] rounded">
                  {stats.mapsCount}
                </span>
              </div>
              <p className="text-[12px] text-[#545b64] mt-2">
                Interactive map styles from Esri, HERE, and Open Data for web and mobile visualization.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#eaeded] flex items-center justify-between">
              <Link
                href="/location/maps"
                className="text-[12px] font-medium text-[#0073bb] hover:underline"
              >
                View maps &rarr;
              </Link>
              <Link
                href="/location/maps/create"
                className="px-2.5 py-1 text-[12px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa]"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Create map
              </Link>
            </div>
          </div>

          {/* Trackers */}
          <div className="bg-white border border-[#d5dbdb] rounded p-4 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-bold text-[#16191f]">Trackers</span>
                <span className="text-[12px] font-mono px-2 py-0.5 bg-[#f2f3f3] text-[#16191f] rounded">
                  {stats.trackersCount}
                </span>
              </div>
              <p className="text-[12px] text-[#545b64] mt-2">
                Receive, evaluate, and store device location updates with position filtering and EventBridge alerts.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#eaeded] flex items-center justify-between">
              <Link
                href="/location/trackers"
                className="text-[12px] font-medium text-[#0073bb] hover:underline"
              >
                View trackers &rarr;
              </Link>
              <Link
                href="/location/trackers/create"
                className="px-2.5 py-1 text-[12px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa]"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Create tracker
              </Link>
            </div>
          </div>

          {/* Geofence Collections */}
          <div className="bg-white border border-[#d5dbdb] rounded p-4 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-bold text-[#16191f]">Geofence collections</span>
                <span className="text-[12px] font-mono px-2 py-0.5 bg-[#f2f3f3] text-[#16191f] rounded">
                  {stats.geofenceCollectionsCount}
                </span>
              </div>
              <p className="text-[12px] text-[#545b64] mt-2">
                Define virtual boundaries using circles or polygons to trigger entry and exit alerts for tracked devices.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#eaeded] flex items-center justify-between">
              <Link
                href="/location/geofences"
                className="text-[12px] font-medium text-[#0073bb] hover:underline"
              >
                View collections &rarr;
              </Link>
              <Link
                href="/location/geofences/create"
                className="px-2.5 py-1 text-[12px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa]"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Create collection
              </Link>
            </div>
          </div>

          {/* Route Calculators */}
          <div className="bg-white border border-[#d5dbdb] rounded p-4 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-bold text-[#16191f]">Route calculators</span>
                <span className="text-[12px] font-mono px-2 py-0.5 bg-[#f2f3f3] text-[#16191f] rounded">
                  {stats.routeCalculatorsCount}
                </span>
              </div>
              <p className="text-[12px] text-[#545b64] mt-2">
                Calculate travel time, distance, and directions based on current road conditions and travel modes.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#eaeded] flex items-center justify-between">
              <Link
                href="/location/routes"
                className="text-[12px] font-medium text-[#0073bb] hover:underline"
              >
                View route calculators &rarr;
              </Link>
              <Link
                href="/location/routes/create"
                className="px-2.5 py-1 text-[12px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa]"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Create calculator
              </Link>
            </div>
          </div>

          {/* Place Indexes */}
          <div className="bg-white border border-[#d5dbdb] rounded p-4 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-bold text-[#16191f]">Place indexes</span>
                <span className="text-[12px] font-mono px-2 py-0.5 bg-[#f2f3f3] text-[#16191f] rounded">
                  {stats.placeIndexesCount}
                </span>
              </div>
              <p className="text-[12px] text-[#545b64] mt-2">
                Convert addresses to geographic coordinates (geocoding) and coordinates into addresses (reverse geocoding).
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#eaeded] flex items-center justify-between">
              <Link
                href="/location/places"
                className="text-[12px] font-medium text-[#0073bb] hover:underline"
              >
                View place indexes &rarr;
              </Link>
              <span className="text-[11px] text-[#879596]">Emulator scaffolded</span>
            </div>
          </div>

          {/* API Keys */}
          <div className="bg-white border border-[#d5dbdb] rounded p-4 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-bold text-[#16191f]">API keys</span>
                <span className="text-[12px] font-mono px-2 py-0.5 bg-[#f2f3f3] text-[#16191f] rounded">
                  {stats.apiKeysCount}
                </span>
              </div>
              <p className="text-[12px] text-[#545b64] mt-2">
                Generate secure keys to allow front-end applications to access maps and places without IAM credentials.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#eaeded] flex items-center justify-between">
              <Link
                href="/location/api-keys"
                className="text-[12px] font-medium text-[#0073bb] hover:underline"
              >
                View API keys &rarr;
              </Link>
              <span className="text-[11px] text-[#879596]">Emulator scaffolded</span>
            </div>
          </div>
        </div>
      </div>

      {/* Getting Started / Integration Guide */}
      <div className="bg-[#f2f8fd] border border-[#a4cbe8] rounded p-5">
        <h3 className="text-[15px] font-bold text-[#16191f]">How Amazon Location Service works</h3>
        <p className="text-[13px] text-[#545b64] mt-1 leading-relaxed">
          Amazon Location Service lets you build location-aware applications using commercial map tiles, reverse geocoding, asset tracking, and geofencing. Data privacy is built in: queries are anonymized before being routed to providers, and your tracking coordinates remain securely inside your AWS account.
        </p>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-[12px]">
          <div className="bg-white p-3 rounded border border-[#d5dbdb]">
            <div className="font-bold text-[#16191f] mb-1">1. Render Maps</div>
            <p className="text-[#545b64]">
              Create a map resource and embed it with MapLibre GL JS or Mapbox GL using vector styles from Esri or Open Data.
            </p>
          </div>
          <div className="bg-white p-3 rounded border border-[#d5dbdb]">
            <div className="font-bold text-[#16191f] mb-1">2. Track Devices</div>
            <p className="text-[#545b64]">
              Publish telemetry points from IoT devices or mobile clients using `BatchUpdateDevicePosition` with customizable filtering.
            </p>
          </div>
          <div className="bg-white p-3 rounded border border-[#d5dbdb]">
            <div className="font-bold text-[#16191f] mb-1">3. Evaluate Geofences</div>
            <p className="text-[#545b64]">
              Associate a tracker with a geofence collection to automatically emit EventBridge events whenever a device enters or leaves a boundary.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
