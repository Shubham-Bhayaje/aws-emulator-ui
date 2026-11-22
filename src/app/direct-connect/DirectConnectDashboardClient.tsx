"use client";

import Link from "next/link";
import {
  DxConnectionItem,
  DxGatewayItem,
  DxVirtualInterfaceItem,
  DxLocationItem,
} from "./dx-actions";

interface Props {
  connections: DxConnectionItem[];
  gateways: DxGatewayItem[];
  virtualInterfaces: DxVirtualInterfaceItem[];
  locations: DxLocationItem[];
}

export default function DirectConnectDashboardClient({
  connections,
  gateways,
  virtualInterfaces,
  locations,
}: Props) {
  const activeConnections = connections.filter((c) => c.connectionState !== "deleted");
  const activeGateways = gateways.filter((g) => g.directConnectGatewayState !== "deleted");
  const activeVifs = virtualInterfaces.filter((v) => v.virtualInterfaceState !== "deleted");

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-bold text-[#16191f]">AWS Direct Connect Dashboard</h1>
        <p className="text-[13px] text-[#545b64] mt-0.5">
          Establish dedicated network connections from your premises directly to AWS to reduce network costs, increase bandwidth throughput, and provide a more consistent network experience.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-[#eaeded] rounded-xl p-5 shadow-sm">
          <div className="text-xs text-[#545b64] font-medium uppercase tracking-wider">Connections</div>
          <div className="text-2xl font-bold text-[#16191f] mt-1">{activeConnections.length}</div>
          <Link href="/direct-connect/connections" className="text-xs text-[#0073bb] hover:underline mt-2 inline-block">
            View connections &rarr;
          </Link>
        </div>

        <div className="bg-white border border-[#eaeded] rounded-xl p-5 shadow-sm">
          <div className="text-xs text-[#545b64] font-medium uppercase tracking-wider">Direct Connect Gateways</div>
          <div className="text-2xl font-bold text-[#16191f] mt-1">{activeGateways.length}</div>
          <Link href="/direct-connect/gateways" className="text-xs text-[#0073bb] hover:underline mt-2 inline-block">
            View gateways &rarr;
          </Link>
        </div>

        <div className="bg-white border border-[#eaeded] rounded-xl p-5 shadow-sm">
          <div className="text-xs text-[#545b64] font-medium uppercase tracking-wider">Virtual Interfaces</div>
          <div className="text-2xl font-bold text-[#16191f] mt-1">{activeVifs.length}</div>
          <Link href="/direct-connect/virtual-interfaces" className="text-xs text-[#0073bb] hover:underline mt-2 inline-block">
            View virtual interfaces &rarr;
          </Link>
        </div>

        <div className="bg-white border border-[#eaeded] rounded-xl p-5 shadow-sm">
          <div className="text-xs text-[#545b64] font-medium uppercase tracking-wider">Available Locations</div>
          <div className="text-2xl font-bold text-[#16191f] mt-1">{locations.length}</div>
          <span className="text-xs text-gray-500 mt-2 inline-block">Ashburn & Reston facilities</span>
        </div>
      </div>

      {/* Quick Setup Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-[#eaeded] rounded-xl p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-[#8C4FFF] flex items-center justify-center font-bold text-sm mb-3">
              1
            </div>
            <h3 className="text-base font-bold text-[#16191f]">Order dedicated connection</h3>
            <p className="text-[13px] text-[#545b64] mt-1">
              Select an AWS Direct Connect location and port speed (1 Gbps, 10 Gbps, or 100 Gbps). AWS provisions your physical port and provides an LOA-CFA document for your colocation provider.
            </p>
          </div>
          <Link
            href="/direct-connect/connections/create"
            className="inline-flex items-center justify-center px-4 text-xs font-semibold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded shadow-sm"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Create connection
          </Link>
        </div>

        <div className="bg-white border border-[#eaeded] rounded-xl p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0073bb] flex items-center justify-center font-bold text-sm mb-3">
              2
            </div>
            <h3 className="text-base font-bold text-[#16191f]">Direct Connect gateway</h3>
            <p className="text-[13px] text-[#545b64] mt-1">
              A Direct Connect gateway is a globally available resource that enables your on-premises routers to connect to multiple Amazon VPCs or AWS Transit Gateways across any AWS Region.
            </p>
          </div>
          <Link
            href="/direct-connect/gateways/create"
            className="inline-flex items-center justify-center px-4 text-xs font-semibold text-[#16191f] bg-white border border-[#d5dbdb] hover:bg-gray-50 rounded shadow-sm"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Create DX gateway
          </Link>
        </div>

        <div className="bg-white border border-[#eaeded] rounded-xl p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm mb-3">
              3
            </div>
            <h3 className="text-base font-bold text-[#16191f]">Virtual interfaces (VIF)</h3>
            <p className="text-[13px] text-[#545b64] mt-1">
              Configure Private Virtual Interfaces (to access private VPC subnets), Transit Virtual Interfaces (to access Transit Gateways), or Public Virtual Interfaces (to access AWS public services).
            </p>
          </div>
          <Link
            href="/direct-connect/virtual-interfaces/create"
            className="inline-flex items-center justify-center px-4 text-xs font-semibold text-[#16191f] bg-white border border-[#d5dbdb] hover:bg-gray-50 rounded shadow-sm"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Create virtual interface
          </Link>
        </div>
      </div>

      {/* Architecture Overview Diagram Card */}
      <div className="bg-white border border-[#eaeded] rounded-xl p-6 shadow-sm space-y-4">
        <h3 className="text-[16px] font-bold text-[#16191f]">How AWS Direct Connect works</h3>
        <p className="text-[13px] text-[#545b64]">
          AWS Direct Connect bypasses the public internet entirely, establishing dedicated optical cross-connects inside partner colocation data centers directly into the AWS global network backbone.
        </p>

        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono space-y-2 text-gray-800">
          <div className="font-bold text-[#16191f] mb-2 font-sans text-[13px]">Direct Connect Network Architecture:</div>
          <div className="overflow-x-auto whitespace-pre">
{`+--------------------------+          +------------------------------------+          +---------------------------+
|   On-Premises Network    |          |    AWS Direct Connect Facility     |          |       AWS Cloud Fabric    |
| (Customer Data Center)   |          |      (e.g., Equinix DC2)           |          |                           |
|                          |          |                                    |          |                           |
|  +--------------------+  |          |  +-------------+  +-------------+  |  Private |  +---------------------+  |
|  | Customer Router    |==|==========|=>| Meet-Me-Room|==| AWS DX Port |==|==========|=>| Direct Connect GW   |  |
|  | (BGP ASN: 65000)   |  |  Cross-  |  | Patch Panel |  | (1G / 10G)  |  |   VIF    |  | (Amazon ASN: 64512) |  |
|  +--------------------+  |  Connect |  +-------------+  +-------------+  |          |  +----------+----------+  |
+--------------------------+  (LOA-CFA)                                                |             |             |
                                                                                      |      +------+------+      |
                                                                                      |      |             |      |
                                                                                      |  +---v---+     +---v---+  |
                                                                                      |  | VPC A |     |  TGW  |  |
                                                                                      |  +-------+     +-------+  |
                                                                                      +---------------------------+`}
          </div>
        </div>
      </div>
    </div>
  );
}
