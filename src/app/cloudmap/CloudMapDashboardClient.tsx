"use client";

import Link from "next/link";
import { useState } from "react";
import { CloudMapStats, getCloudMapDashboardStatsAction } from "./actions";

interface Props {
  initialStats: CloudMapStats;
}

export default function CloudMapDashboardClient({ initialStats }: Props) {
  const [stats, setStats] = useState<CloudMapStats>(initialStats);
  const [refreshing, setRefreshing] = useState(false);

  const refreshStats = async () => {
    setRefreshing(true);
    try {
      const next = await getCloudMapDashboardStatsAction();
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
        <span>AWS Cloud Map</span>
        <span className="mx-1 text-[#879596]">/</span>
        <span className="text-[#16191f] font-medium">Overview</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#eaeded]">
        <div>
          <h1 className="text-[24px] font-bold text-[#16191f]">AWS Cloud Map</h1>
          <p className="text-[14px] text-[#545b64] mt-1">
            Service discovery for cloud resources. Define friendly names for your application services and automatically track dynamic endpoints, health status, and attributes.
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
          <Link
            href="/cloudmap/namespaces/create"
            className="px-4 py-1.5 text-[13px] font-bold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded inline-flex items-center justify-center transition-colors shadow-sm"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Create namespace
          </Link>
        </div>
      </div>

      {/* Resource Inventory Metrics Cards */}
      <div>
        <h2 className="text-[16px] font-bold text-[#16191f] mb-3">Service summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Namespaces Card */}
          <div className="bg-white border border-[#d5dbdb] rounded p-5 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-bold text-[#16191f]">Namespaces</span>
                <span className="text-[14px] font-bold font-mono px-2 py-0.5 bg-[#f2f3f3] text-[#16191f] rounded">
                  {stats.namespacesCount}
                </span>
              </div>
              <p className="text-[12px] text-[#545b64] mt-2">
                Logical domains grouping your services by network boundary or application tier.
              </p>
              <div className="mt-3 pt-2 border-t border-[#eaeded] grid grid-cols-3 gap-2 text-[11px] text-[#545b64]">
                <div>
                  <span className="font-semibold text-[#16191f] block">{stats.httpNamespacesCount}</span>
                  <span>HTTP</span>
                </div>
                <div>
                  <span className="font-semibold text-[#16191f] block">{stats.privateDnsNamespacesCount}</span>
                  <span>Private DNS</span>
                </div>
                <div>
                  <span className="font-semibold text-[#16191f] block">{stats.publicDnsNamespacesCount}</span>
                  <span>Public DNS</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#eaeded] flex items-center justify-between">
              <Link
                href="/cloudmap/namespaces"
                className="text-[12px] font-medium text-[#0073bb] hover:underline"
              >
                View namespaces &rarr;
              </Link>
              <Link
                href="/cloudmap/namespaces/create"
                className="text-[12px] font-medium text-[#0073bb] hover:underline"
              >
                + New namespace
              </Link>
            </div>
          </div>

          {/* Services Card */}
          <div className="bg-white border border-[#d5dbdb] rounded p-5 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-bold text-[#16191f]">Services</span>
                <span className="text-[14px] font-bold font-mono px-2 py-0.5 bg-[#f2f3f3] text-[#16191f] rounded">
                  {stats.servicesCount}
                </span>
              </div>
              <p className="text-[12px] text-[#545b64] mt-2">
                Named service entities representing microservices (e.g. `users-service`, `billing-api`) with routing policies and health checks.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#eaeded] flex items-center justify-between">
              <Link
                href="/cloudmap/services"
                className="text-[12px] font-medium text-[#0073bb] hover:underline"
              >
                View services &rarr;
              </Link>
              <Link
                href="/cloudmap/services/create"
                className="text-[12px] font-medium text-[#0073bb] hover:underline"
              >
                + New service
              </Link>
            </div>
          </div>

          {/* Instances Card */}
          <div className="bg-white border border-[#d5dbdb] rounded p-5 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-bold text-[#16191f]">Registered Instances</span>
                <span className="text-[14px] font-bold font-mono px-2 py-0.5 bg-[#f2f3f3] text-[#16191f] rounded">
                  {stats.instancesCount}
                </span>
              </div>
              <p className="text-[12px] text-[#545b64] mt-2">
                Active endpoints (IP addresses, ports, and metadata attributes) registered across your microservices.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#eaeded]">
              <span className="text-[12px] text-[#545b64]">
                Discover instances via API (`DiscoverInstances`) or DNS queries.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Architecture & Discovery Guide */}
      <div className="bg-[#f2f8fd] border border-[#a4cbe8] rounded p-5">
        <h3 className="text-[15px] font-bold text-[#16191f]">How AWS Cloud Map Works</h3>
        <p className="text-[13px] text-[#545b64] mt-1 leading-relaxed">
          AWS Cloud Map simplifies microservice discovery by keeping an up-to-date registry of dynamic endpoints and application metadata. When new container tasks or servers launch, they register with Cloud Map. Upstream clients query Cloud Map to retrieve healthy endpoints.
        </p>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-[12px]">
          <div className="bg-white p-3.5 rounded border border-[#d5dbdb]">
            <div className="font-bold text-[#16191f] mb-1">1. Configure Namespace</div>
            <p className="text-[#545b64]">
              Create an HTTP namespace for API-only discovery, or a Private/Public DNS namespace for standard domain name resolution.
            </p>
          </div>
          <div className="bg-white p-3.5 rounded border border-[#d5dbdb]">
            <div className="font-bold text-[#16191f] mb-1">2. Define Services</div>
            <p className="text-[#545b64]">
              Configure service routing policies (Multivalue Answer or Weighted) and optional custom application health checking.
            </p>
          </div>
          <div className="bg-white p-3.5 rounded border border-[#d5dbdb]">
            <div className="font-bold text-[#16191f] mb-1">3. Discover Endpoints</div>
            <p className="text-[#545b64]">
              Clients call `DiscoverInstances` or submit standard DNS queries to receive healthy endpoint addresses and custom attributes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
