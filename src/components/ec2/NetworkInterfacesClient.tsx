/**
 * src/components/ec2/NetworkInterfacesClient.tsx – Elastic Network Interfaces (ENI).
 * Zero emojis, Cloudscape enterprise styling.
 */

"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  NetworkInterfaceModel,
  createLiveNetworkInterface,
  deleteLiveNetworkInterface,
  fetchLiveNetworkInterfaces,
} from "@/app/ec2/actions";

interface Props {
  initialInterfaces: NetworkInterfaceModel[];
  isLive: boolean;
}

export default function NetworkInterfacesClient({ initialInterfaces, isLive }: Props) {
  const [interfaces, setInterfaces] = useState<NetworkInterfaceModel[]>(initialInterfaces);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEniId, setSelectedEniId] = useState<string | null>(null);

  // Form
  const [subnetId, setSubnetId] = useState("subnet-00000000000000007");
  const [desc, setDesc] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!subnetId.trim()) return;

    startTransition(async () => {
      const res = await createLiveNetworkInterface(subnetId.trim(), desc.trim());
      if (res.success) {
        const fresh = await fetchLiveNetworkInterfaces();
        setInterfaces(fresh.interfaces);
        setShowCreateModal(false);
        setDesc("");
      } else {
        alert("Failed to create network interface: " + res.error);
      }
    });
  }

  function handleDelete() {
    if (!selectedEniId) return;
    const targetId = selectedEniId;
    setShowDeleteModal(false);
    setSelectedEniId(null);

    setInterfaces(interfaces.filter((e) => e.id !== targetId));

    startTransition(async () => {
      await deleteLiveNetworkInterface(targetId);
      const fresh = await fetchLiveNetworkInterfaces();
      setInterfaces(fresh.interfaces);
    });
  }

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

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-1.5 bg-[#ec7211] text-white rounded-sm text-[13px] font-medium hover:bg-[#eb5f07]"
          >
            Create network interface
          </button>
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
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded] text-[#16191f]">
              {filteredEnis.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-[#545b64]">
                    No network interfaces found on the emulator.
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
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedEniId(eni.id);
                          setShowDeleteModal(true);
                        }}
                        className="text-[#d13212] hover:underline text-[12px]"
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
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <form
            onSubmit={handleCreate}
            className="bg-white rounded-sm border border-[#d5dbdb] awsui-shadow w-full max-w-md p-6 space-y-4"
          >
            <h3 className="text-[17px] font-bold text-[#16191f]">Create network interface</h3>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                Subnet ID <span className="text-[#d13212]">*</span>
              </label>
              <input
                type="text"
                required
                value={subnetId}
                onChange={(e) => setSubnetId(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#aab7b8] rounded font-mono text-[13px]"
              />
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                Description
              </label>
              <input
                type="text"
                placeholder="Optional description"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#aab7b8] rounded text-[13px]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-1.5 border border-[#545b64] rounded text-[13px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-1.5 bg-[#ec7211] text-white rounded text-[13px] font-medium hover:bg-[#eb5f07]"
              >
                {isPending ? "Creating..." : "Create network interface"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-sm border border-[#d5dbdb] awsui-shadow w-full max-w-md p-6">
            <h3 className="text-[17px] font-bold text-[#16191f]">Delete network interface</h3>
            <p className="text-[13px] text-[#545b64] mt-2">
              Are you sure you want to delete network interface{" "}
              <strong className="text-[#16191f] font-mono">{selectedEniId}</strong>?
            </p>
            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-1.5 border border-[#545b64] rounded text-[13px]"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-1.5 bg-[#d13212] text-white rounded text-[13px] font-medium hover:bg-[#b02008]"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
