"use client";

import Link from "next/link";

interface Props {
  metrics: {
    inboundEndpointsCount: number;
    outboundEndpointsCount: number;
    rulesCount: number;
    queryLogConfigsCount: number;
    firewallConfigsCount: number;
    firewallDomainListsCount: number;
    firewallRuleGroupsCount: number;
  };
}

export default function ResolverDashboardClient({ metrics }: Props) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#eaeded] pb-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#16191f]">Route 53 Resolver</h1>
          <p className="text-[13px] text-[#545b64] mt-1">
            Route 53 Resolver responds recursively to DNS queries from local Amazon VPCs and on-premises networks, enabling bidirectional hybrid cloud DNS resolution.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/route53/resolver/endpoints/create?direction=inbound"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="px-4 text-[13px] font-bold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded flex items-center justify-center transition-colors shadow-sm"
          >
            Create inbound endpoint
          </Link>
          <Link
            href="/route53/resolver/endpoints/create?direction=outbound"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="px-4 text-[13px] font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 flex items-center justify-center transition-colors"
          >
            Create outbound endpoint
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white border border-[#eaeded] rounded-xl p-4 shadow-sm">
          <div className="text-xs font-medium text-[#545b64]">Inbound endpoints</div>
          <div className="text-2xl font-bold text-[#16191f] mt-1">
            {metrics.inboundEndpointsCount}
          </div>
          <Link
            href="/route53/resolver/endpoints"
            className="text-xs text-[#0073bb] hover:underline mt-2 inline-block font-medium"
          >
            View endpoints &rarr;
          </Link>
        </div>

        <div className="bg-white border border-[#eaeded] rounded-xl p-4 shadow-sm">
          <div className="text-xs font-medium text-[#545b64]">Outbound endpoints</div>
          <div className="text-2xl font-bold text-[#16191f] mt-1">
            {metrics.outboundEndpointsCount}
          </div>
          <Link
            href="/route53/resolver/endpoints"
            className="text-xs text-[#0073bb] hover:underline mt-2 inline-block font-medium"
          >
            View endpoints &rarr;
          </Link>
        </div>

        <div className="bg-white border border-[#eaeded] rounded-xl p-4 shadow-sm">
          <div className="text-xs font-medium text-[#545b64]">Resolver rules</div>
          <div className="text-2xl font-bold text-[#16191f] mt-1">
            {metrics.rulesCount}
          </div>
          <Link
            href="/route53/resolver/rules"
            className="text-xs text-[#0073bb] hover:underline mt-2 inline-block font-medium"
          >
            View rules &rarr;
          </Link>
        </div>

        <div className="bg-white border border-[#eaeded] rounded-xl p-4 shadow-sm">
          <div className="text-xs font-medium text-[#545b64]">Query log configs</div>
          <div className="text-2xl font-bold text-[#16191f] mt-1">
            {metrics.queryLogConfigsCount}
          </div>
          <Link
            href="/route53/resolver/query-logging"
            className="text-xs text-[#0073bb] hover:underline mt-2 inline-block font-medium"
          >
            View query logs &rarr;
          </Link>
        </div>

        <div className="bg-white border border-[#eaeded] rounded-xl p-4 shadow-sm">
          <div className="text-xs font-medium text-[#545b64]">DNS Firewall domain lists</div>
          <div className="text-2xl font-bold text-[#16191f] mt-1">
            {metrics.firewallDomainListsCount}
          </div>
          <Link
            href="/route53/resolver/firewall"
            className="text-xs text-[#0073bb] hover:underline mt-2 inline-block font-medium"
          >
            View firewall &rarr;
          </Link>
        </div>
      </div>

      {/* Hybrid Architecture Diagram */}
      <div className="bg-white border border-[#eaeded] rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-[16px] font-bold text-[#16191f] border-b pb-2">
          Hybrid DNS Resolution Architecture
        </h2>
        <p className="text-[13px] text-[#545b64]">
          AWS Route 53 Resolver bridges on-premises DNS infrastructure and AWS cloud environments without complex DNS forwarding servers or VPN hacks.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Inbound Flow */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[14px] text-[#16191f]">Inbound DNS Flow</span>
              <span className="text-xs bg-blue-100 text-blue-800 font-medium px-2 py-0.5 rounded">
                On-premises to AWS
              </span>
            </div>
            <p className="text-xs text-gray-600">
              On-premises DNS clients resolve AWS Private Hosted Zones and internal VPC domain names.
            </p>
            <div className="font-mono text-xs bg-white p-3 rounded border border-gray-300 space-y-1 text-gray-800">
              <div>1. On-premises server queries: <span className="text-[#0073bb]">app.corp.internal</span></div>
              <div>2. On-premises DNS forwards to: <span className="text-green-700">Inbound Endpoint IP (10.0.1.10)</span></div>
              <div>3. Inbound Endpoint routes into VPC: <span className="text-purple-700">Route 53 Resolver (.2 IP)</span></div>
              <div>4. Answer returned from: <span className="text-gray-900">Route 53 Private Hosted Zone</span></div>
            </div>
            <Link
              href="/route53/resolver/endpoints/create?direction=inbound"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center px-3 text-xs font-semibold text-[#0073bb] hover:underline"
            >
              Configure Inbound Endpoint &rarr;
            </Link>
          </div>

          {/* Outbound Flow */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[14px] text-[#16191f]">Outbound DNS Flow</span>
              <span className="text-xs bg-green-100 text-green-800 font-medium px-2 py-0.5 rounded">
                AWS to On-premises
              </span>
            </div>
            <p className="text-xs text-gray-600">
              VPC workloads resolve on-premises enterprise domains using conditional forwarding rules.
            </p>
            <div className="font-mono text-xs bg-white p-3 rounded border border-gray-300 space-y-1 text-gray-800">
              <div>1. EC2 instance queries: <span className="text-[#0073bb]">dc.internal.corp</span></div>
              <div>2. VPC Resolver matches rule: <span className="text-purple-700">Forwarding Rule (*.corp)</span></div>
              <div>3. Route 53 sends via: <span className="text-green-700">Outbound Endpoint IP (10.0.2.20)</span></div>
              <div>4. Forwarded to: <span className="text-gray-900">On-premises DNS Resolver (192.168.1.53)</span></div>
            </div>
            <Link
              href="/route53/resolver/rules/create"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center px-3 text-xs font-semibold text-[#0073bb] hover:underline"
            >
              Configure Forwarding Rule &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Getting Started Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-[#eaeded] rounded-xl p-5 shadow-sm space-y-3">
          <h3 className="font-bold text-[15px] text-[#16191f]">1. Resolver Endpoints</h3>
          <p className="text-xs text-[#545b64]">
            Provision elastic network interfaces (ENIs) with private IP addresses in your VPC for inbound queries from on-premises or outbound forwarding to your corporate network.
          </p>
          <div className="pt-2">
            <Link
              href="/route53/resolver/endpoints"
              className="text-xs text-[#0073bb] font-medium hover:underline"
            >
              Manage endpoints &rarr;
            </Link>
          </div>
        </div>

        <div className="bg-white border border-[#eaeded] rounded-xl p-5 shadow-sm space-y-3">
          <h3 className="font-bold text-[15px] text-[#16191f]">2. Conditional Rules</h3>
          <p className="text-xs text-[#545b64]">
            Define domain-specific routing rules (e.g., forward all queries for corp.internal to 10.0.0.53) and associate them with one or more VPCs.
          </p>
          <div className="pt-2">
            <Link
              href="/route53/resolver/rules"
              className="text-xs text-[#0073bb] font-medium hover:underline"
            >
              Manage rules &rarr;
            </Link>
          </div>
        </div>

        <div className="bg-white border border-[#eaeded] rounded-xl p-5 shadow-sm space-y-3">
          <h3 className="font-bold text-[15px] text-[#16191f]">3. Query Logging & Firewall</h3>
          <p className="text-xs text-[#545b64]">
            Log every DNS query originating in your VPCs to CloudWatch Logs or Amazon S3, and filter malicious domain names with DNS Firewall.
          </p>
          <div className="pt-2">
            <Link
              href="/route53/resolver/query-logging"
              className="text-xs text-[#0073bb] font-medium hover:underline"
            >
              Configure query logging &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
