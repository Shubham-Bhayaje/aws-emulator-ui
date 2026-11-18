/**
 * src/components/ec2/NetworkInterfacesClient.tsx – Elastic Network Interfaces (ENI).
 * Zero emojis, Cloudscape enterprise styling.
 */

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { NetworkInterfaceModel } from "@/app/ec2/actions";

interface Props {
  initialInterfaces: NetworkInterfaceModel[];
  isLive: boolean;
}

export default function NetworkInterfacesClient({ initialInterfaces, isLive }: Props) {
  const [interfaces] = useState<NetworkInterfaceModel[]>(initialInterfaces);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEnis = interfaces.filter(
    (eni) =>
      eni.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eni.privateIp.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (eni.instanceId && eni.instanceId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      eni.vpcId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Live Badge */}
      <div className="flex items-center justify-between bg-white border border-[#d5dbdb] px-4 py-2.5 rounded-sm awsui-shadow">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`inline-block w-2.5 h-2.5 rounded-full ${
                isLive ? "bg-[#1d8102]" : "bg-[#ec7211]"
              }`}
            />
            <span className="text-[12px] font-semibold text-[#16191f]">
              {isLive ? "ENI Service Connected (AWS Emulator)" : "Mock Data Mode"}
            </span>
          </div>
          <span className="text-[#95a5a6] text-[12px]">|</span>
          <span className="text-[12px] font-mono text-[#545b64]">Region: us-east-1</span>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-[#eaeded] rounded-sm awsui-shadow">
        <div className="p-4 border-b border-[#eaeded] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-[16px] font-bold text-[#16191f]">Network interfaces</h2>
            <p className="text-[12px] text-[#545b64] mt-0.5">
              An Elastic Network Interface (ENI) represents a virtual network interface card in your VPC.
            </p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="p-3 border-b border-[#eaeded] bg-[#fafafa]">
          <input
            type="text"
            placeholder="Filter network interfaces by ID, IP, or attached instance..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-md px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] bg-white"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] text-[11px] font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Network interface ID</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Primary private IPv4</th>
                <th className="py-2.5 px-3">Public IPv4</th>
                <th className="py-2.5 px-3">MAC address</th>
                <th className="py-2.5 px-3">Instance ID</th>
                <th className="py-2.5 px-3">VPC ID</th>
                <th className="py-2.5 px-3">Subnet ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded] text-[#16191f]">
              {filteredEnis.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#545b64]">
                    No network interfaces found.
                  </td>
                </tr>
              ) : (
                filteredEnis.map((eni) => (
                  <tr key={eni.id} className="hover:bg-[#f2f8fd]">
                    <td className="py-3 px-4 font-mono font-bold text-[#0073bb]">
                      {eni.id}
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-[#e6f4ea] text-[#137333]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#137333]" />
                        {eni.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono">{eni.privateIp}</td>
                    <td className="py-3 px-3 font-mono text-[#0073bb]">
                      {eni.publicIp || "—"}
                    </td>
                    <td className="py-3 px-3 font-mono text-[12px] text-[#545b64]">
                      {eni.macAddress}
                    </td>
                    <td className="py-3 px-3">
                      {eni.instanceId ? (
                        <Link
                          href={`/ec2/instances/${eni.instanceId}`}
                          className="font-mono text-[#0073bb] hover:underline"
                        >
                          {eni.instanceId}
                        </Link>
                      ) : (
                        <span className="text-[#545b64]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono text-[#0073bb] text-[12px]">
                      {eni.vpcId}
                    </td>
                    <td className="py-3 px-3 font-mono text-[12px] text-[#545b64]">
                      {eni.subnetId}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
