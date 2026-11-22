"use client";

import { useState } from "react";
import Link from "next/link";
import { VpcDashboardStats, getVpcDashboardStatsAction } from "./actions";

interface Props {
  initialStats: VpcDashboardStats;
}

export default function VpcDashboardClient({ initialStats }: Props) {
  const [stats, setStats] = useState<VpcDashboardStats>(initialStats);
  const [loading, setLoading] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await getVpcDashboardStatsAction();
      if (res.success) {
        setStats(res.stats);
      }
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: "VPCs", count: stats.vpcsCount, href: "/vpc/vpcs", desc: "Virtual Private Clouds" },
    { label: "Subnets", count: stats.subnetsCount, href: "/vpc/subnets", desc: "Subnets in Availability Zones" },
    { label: "Route tables", count: stats.routeTablesCount, href: "/vpc/route-tables", desc: "Network routing tables" },
    { label: "Internet gateways", count: stats.internetGatewaysCount, href: "/vpc/internet-gateways", desc: "Public internet access" },
    { label: "NAT gateways", count: stats.natGatewaysCount, href: "/vpc/nat-gateways", desc: "Managed outbound NAT" },
    { label: "Elastic IP addresses", count: stats.elasticIpsCount, href: "/vpc/elastic-ips", desc: "Static public IPv4 addresses" },
    { label: "Endpoints", count: stats.endpointsCount, href: "/vpc/endpoints", desc: "VPC Endpoints (PrivateLink)" },
    { label: "Security groups", count: stats.securityGroupsCount, href: "/vpc/security-groups", desc: "Instance-level firewalls" },
    { label: "Network ACLs", count: stats.networkAclsCount, href: "/vpc/network-acls", desc: "Subnet-level firewalls" },
    { label: "Peering connections", count: stats.peeringConnectionsCount, href: "/vpc/peering-connections", desc: "VPC-to-VPC routing" },
    { label: "DHCP option sets", count: stats.dhcpOptionsCount, href: "/vpc/dhcp-options", desc: "Domain & DNS configs" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#eaeded]">
        <div>
          <h1 className="text-[24px] font-bold text-[#16191f]">VPC Dashboard</h1>
          <p className="text-[14px] text-[#545b64] mt-1">
            Amazon Virtual Private Cloud (Amazon VPC) lets you launch AWS resources in a logically isolated virtual network that you define.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-3 py-1.5 text-[13px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa] transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          <Link
            href="/vpc/vpcs/create"
            className="px-4 py-1.5 text-[13px] font-bold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded inline-flex items-center justify-center transition-colors shadow-sm"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Create VPC
          </Link>
        </div>
      </div>

      {/* Region Status Banner */}
      <div className="p-4 bg-purple-50/50 border border-purple-200 rounded text-[13px] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-purple-900">Current Region:</span>
          <span className="font-mono text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">us-east-1</span>
          <span className="text-purple-700">All VPC resources are scoped to this AWS Region.</span>
        </div>
        <div className="text-xs text-purple-700 font-medium">
          Connected live to AWS Emulator
        </div>
      </div>

      {/* Resource Count Cards Grid */}
      <div>
        <h2 className="text-[16px] font-bold text-[#16191f] mb-3">Resources in this Region</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className="group block p-4 bg-white border border-[#d5dbdb] rounded hover:border-[#8C4FFF] hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-[#545b64] group-hover:text-[#8C4FFF] transition-colors">
                  {card.label}
                </span>
                <span className="text-[22px] font-bold text-[#16191f]">
                  {card.count}
                </span>
              </div>
              <p className="text-[11px] text-[#879596] mt-1 truncate">
                {card.desc}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Getting Started Guide */}
      <div className="bg-white border border-[#d5dbdb] rounded p-6 space-y-4">
        <h2 className="text-[16px] font-bold text-[#16191f]">How Amazon VPC Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[13px]">
          <div className="space-y-1.5 p-3 rounded bg-[#f8f9fa] border border-[#eaeded]">
            <span className="font-bold text-[#16191f] block text-sm">1. Define IP Address Range</span>
            <p className="text-[#545b64]">
              Assign an IPv4 CIDR block (e.g. <code className="font-mono text-xs">10.0.0.0/16</code>) establishing the private network boundary for your VPC.
            </p>
          </div>
          <div className="space-y-1.5 p-3 rounded bg-[#f8f9fa] border border-[#eaeded]">
            <span className="font-bold text-[#16191f] block text-sm">2. Create Subnets</span>
            <p className="text-[#545b64]">
              Divide the VPC CIDR across Availability Zones. Designate public subnets for load balancers and private subnets for application workloads.
            </p>
          </div>
          <div className="space-y-1.5 p-3 rounded bg-[#f8f9fa] border border-[#eaeded]">
            <span className="font-bold text-[#16191f] block text-sm">3. Configure Routing & Gateways</span>
            <p className="text-[#545b64]">
              Attach an Internet Gateway to route inbound/outbound public traffic. Use NAT Gateways in public subnets to allow private subnets outbound access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
