/**
 * src/components/ec2/DedicatedHostsClient.tsx – Authentic AWS EC2 Dedicated Hosts Management.
 * Connected to live AWS Emulator with real host allocation, release, and hardware inspection.
 * Zero emojis, Cloudscape enterprise styling.
 */

"use client";

import React, { useState, useTransition } from "react";
import {
  DedicatedHostItem,
  fetchLiveDedicatedHosts,
  allocateLiveDedicatedHost,
  releaseLiveDedicatedHost,
} from "@/app/ec2/actions";

interface Props {
  initialHosts: DedicatedHostItem[];
  isLive: boolean;
}

export default function DedicatedHostsClient({ initialHosts, isLive }: Props) {
  const [hosts, setHosts] = useState<DedicatedHostItem[]>(initialHosts);
  const [selectedId, setSelectedId] = useState<string | null>(initialHosts[0]?.hostId || null);
  const [search, setSearch] = useState("");
  const [activeBottomTab, setActiveBottomTab] = useState<"details" | "hardware" | "instances">("details");

  // Modals
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [showReleaseModal, setShowReleaseModal] = useState(false);

  // Form State
  const [instanceFamily, setInstanceFamily] = useState("m5.large");
  const [availabilityZone, setAvailabilityZone] = useState("us-east-1a");
  const [autoPlacement, setAutoPlacement] = useState<"on" | "off">("on");
  const [hostRecovery, setHostRecovery] = useState<"on" | "off">("on");
  const [quantity, setQuantity] = useState(1);

  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedHost = hosts.find((h) => h.hostId === selectedId) || null;

  async function refreshHosts() {
    startTransition(async () => {
      const fresh = await fetchLiveDedicatedHosts();
      setHosts(fresh.hosts);
      setFeedback("Refreshed Dedicated Hosts from AWS Emulator.");
      setTimeout(() => setFeedback(null), 3000);
    });
  }

  function handleAllocate(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await allocateLiveDedicatedHost({
        instanceFamily,
        availabilityZone,
        quantity,
        autoPlacement,
        hostRecovery,
      });

      if (res.success && res.hostId) {
        setShowAllocateModal(false);
        const fresh = await fetchLiveDedicatedHosts();
        setHosts(fresh.hosts);
        setSelectedId(res.hostId);
        setFeedback(`Successfully allocated Dedicated Host (${res.hostId}).`);
      } else {
        setFeedback(`Allocation failed: ${res.error || "Unknown error"}`);
      }
      setTimeout(() => setFeedback(null), 4000);
    });
  }

  function handleRelease() {
    if (!selectedId) return;
    startTransition(async () => {
      const res = await releaseLiveDedicatedHost(selectedId);
      if (res.success) {
        setShowReleaseModal(false);
        const fresh = await fetchLiveDedicatedHosts();
        setHosts(fresh.hosts);
        setFeedback(`Dedicated Host ${selectedId} released.`);
      } else {
        setFeedback(`Failed to release host: ${res.error || "Unknown error"}`);
      }
      setTimeout(() => setFeedback(null), 4000);
    });
  }

  const filtered = hosts.filter(
    (h) =>
      h.hostId.toLowerCase().includes(search.toLowerCase()) ||
      h.instanceFamily.toLowerCase().includes(search.toLowerCase()) ||
      h.availabilityZone.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-[1400px]">
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
              {isLive ? "EC2 Dedicated Hosts Connected (AWS Emulator)" : "Mock Mode"}
            </span>
          </div>
          <span className="text-[#95a5a6] text-[12px]">|</span>
          <span className="text-[12px] font-mono text-[#545b64]">Region: us-east-1</span>
        </div>
        {feedback && <span className="text-[12px] text-[#0073bb] font-medium">{feedback}</span>}
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-[#eaeded] rounded-sm awsui-shadow">
        <div className="p-4 border-b border-[#eaeded] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2">
              <h2 className="text-[18px] font-bold text-[#16191f]">Dedicated Hosts</h2>
              <span className="text-[13px] text-[#545b64]">({filtered.length})</span>
            </div>
            <p className="text-[13px] text-[#545b64] mt-0.5">
              An Amazon EC2 Dedicated Host is a physical server with EC2 instance capacity fully dedicated to your use, allowing you to address compliance requirements and use your existing per-socket or per-core software licenses.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 self-start md:self-center">
            <button
              onClick={refreshHosts}
              disabled={isPending}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-3.5 bg-white border border-[#aab7b8] hover:border-[#16191f] text-[#16191f] text-[13px] font-bold rounded-sm whitespace-nowrap inline-flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
            >
              Refresh
            </button>
            <button
              onClick={() => setShowReleaseModal(true)}
              disabled={!selectedHost || selectedHost.state === "released"}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-3.5 border border-[#aab7b8] text-[#16191f] text-[13px] font-bold rounded-sm whitespace-nowrap inline-flex items-center justify-center transition-colors hover:border-[#16191f] disabled:border-[#eaeded] disabled:bg-[#f2f3f3] disabled:text-[#aab7b8] disabled:cursor-not-allowed cursor-pointer"
            >
              Release Host
            </button>
            <button
              onClick={() => setShowAllocateModal(true)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-4 bg-[#ec7211] hover:bg-[#eb5f07] text-white text-[13px] font-bold rounded-sm whitespace-nowrap inline-flex items-center justify-center shadow-sm transition-colors cursor-pointer"
            >
              Allocate Dedicated Host
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-4 bg-[#f8f9fa] border-b border-[#eaeded] flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              placeholder="Filter by host ID, family, or availability zone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-3 pr-8 py-1.5 text-[13px] border border-[#aab7b8] rounded-sm focus:outline-none focus:border-[#ec7211] bg-white text-[#16191f]"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-[12px]"
              >
                Clear
              </button>
            )}
          </div>
          <span className="text-[12px] text-[#545b64]">
            {filtered.length} of {hosts.length} hosts
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[220px]">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[#eaeded] bg-[#fafafa] text-[#545b64] text-[12px] font-semibold tracking-wider">
                <th className="py-2.5 px-3 w-10 text-center"></th>
                <th className="py-2.5 px-3">Host ID</th>
                <th className="py-2.5 px-3">State</th>
                <th className="py-2.5 px-3">Instance family</th>
                <th className="py-2.5 px-3">Instance type</th>
                <th className="py-2.5 px-3">Availability Zone</th>
                <th className="py-2.5 px-3 text-right">Physical Cores</th>
                <th className="py-2.5 px-3 text-right">Total vCPUs</th>
                <th className="py-2.5 px-3">Auto-placement</th>
                <th className="py-2.5 px-3">Host recovery</th>
                <th className="py-2.5 px-3 text-right">Running Instances</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-[#545b64]">
                    <p className="font-semibold text-[14px]">No Dedicated Hosts found</p>
                    <p className="text-[12px] text-[#879596] mt-1">
                      Allocate a Dedicated Host to launch instances onto physical hardware reserved exclusively for you.
                    </p>
                    <button
                      onClick={() => setShowAllocateModal(true)}
                      className="mt-4 px-3 py-1.5 bg-[#ec7211] text-white text-[12px] font-medium rounded-sm hover:bg-[#eb5f07]"
                    >
                      Allocate Dedicated Host
                    </button>
                  </td>
                </tr>
              ) : (
                filtered.map((h) => {
                  const isSelected = selectedId === h.hostId;

                  return (
                    <tr
                      key={h.hostId}
                      onClick={() => setSelectedId(h.hostId)}
                      className={`border-b border-[#eaeded] cursor-pointer transition-colors ${
                        isSelected ? "bg-[#f1faff]" : "hover:bg-[#f8f9fa]"
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="radio"
                          name="selected_host"
                          checked={isSelected}
                          onChange={() => setSelectedId(h.hostId)}
                          className="accent-[#ec7211]"
                        />
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[#0073bb] font-medium">{h.hostId}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            h.state === "available"
                              ? "bg-[#e7f4e4] text-[#1d8102]"
                              : h.state === "released"
                              ? "bg-[#eaeded] text-[#545b64]"
                              : "bg-[#fff3e0] text-[#b35900]"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              h.state === "available"
                                ? "bg-[#1d8102]"
                                : h.state === "released"
                                ? "bg-[#545b64]"
                                : "bg-[#b35900]"
                            }`}
                          />
                          {h.state}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-medium uppercase">{h.instanceFamily}</td>
                      <td className="py-2.5 px-3 font-mono text-[#545b64]">{h.instanceType}</td>
                      <td className="py-2.5 px-3 text-[#545b64]">{h.availabilityZone}</td>
                      <td className="py-2.5 px-3 text-right">{h.cores}</td>
                      <td className="py-2.5 px-3 text-right">{h.totalVCpus}</td>
                      <td className="py-2.5 px-3 uppercase text-[12px]">{h.autoPlacement}</td>
                      <td className="py-2.5 px-3 uppercase text-[12px]">{h.hostRecovery}</td>
                      <td className="py-2.5 px-3 text-right font-medium">{h.runningInstancesCount}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Host Drawer */}
      {selectedHost && (
        <div className="bg-white border border-[#eaeded] rounded-sm awsui-shadow">
          <div className="border-b border-[#eaeded] flex items-center px-4 bg-[#fafafa]">
            <button
              onClick={() => setActiveBottomTab("details")}
              className={`py-2.5 px-4 text-[13px] font-semibold border-b-2 transition-colors ${
                activeBottomTab === "details"
                  ? "border-[#ec7211] text-[#ec7211]"
                  : "border-transparent text-[#545b64] hover:text-[#16191f]"
              }`}
            >
              Host summary
            </button>
            <button
              onClick={() => setActiveBottomTab("hardware")}
              className={`py-2.5 px-4 text-[13px] font-semibold border-b-2 transition-colors ${
                activeBottomTab === "hardware"
                  ? "border-[#ec7211] text-[#ec7211]"
                  : "border-transparent text-[#545b64] hover:text-[#16191f]"
              }`}
            >
              Hardware & capacity
            </button>
            <button
              onClick={() => setActiveBottomTab("instances")}
              className={`py-2.5 px-4 text-[13px] font-semibold border-b-2 transition-colors ${
                activeBottomTab === "instances"
                  ? "border-[#ec7211] text-[#ec7211]"
                  : "border-transparent text-[#545b64] hover:text-[#16191f]"
              }`}
            >
              Instances on this host
            </button>
          </div>

          <div className="p-6">
            {activeBottomTab === "details" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[13px]">
                <div className="space-y-4">
                  <div>
                    <span className="block text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                      Host ID
                    </span>
                    <span className="font-mono text-[#16191f] mt-0.5 block">{selectedHost.hostId}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                      State
                    </span>
                    <span className="font-medium text-[#16191f] capitalize mt-0.5 block">
                      {selectedHost.state}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                      Owner ID
                    </span>
                    <span className="font-mono text-[#16191f] mt-0.5 block">{selectedHost.ownerId}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="block text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                      Availability Zone
                    </span>
                    <span className="text-[#16191f] mt-0.5 block">{selectedHost.availabilityZone}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                      Auto-placement
                    </span>
                    <span className="text-[#16191f] uppercase mt-0.5 block">{selectedHost.autoPlacement}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                      Host recovery
                    </span>
                    <span className="text-[#16191f] uppercase mt-0.5 block">{selectedHost.hostRecovery}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="block text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                      Allocation time
                    </span>
                    <span className="text-[#16191f] mt-0.5 block">{selectedHost.allocationTime}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                      Release time
                    </span>
                    <span className="text-[#16191f] mt-0.5 block">{selectedHost.releaseTime || "—"}</span>
                  </div>
                </div>
              </div>
            )}

            {activeBottomTab === "hardware" && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-[13px]">
                <div className="p-4 bg-[#fafafa] border border-[#eaeded] rounded-sm">
                  <span className="block text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                    Sockets
                  </span>
                  <span className="text-[20px] font-bold text-[#16191f] font-mono mt-1 block">2</span>
                </div>
                <div className="p-4 bg-[#fafafa] border border-[#eaeded] rounded-sm">
                  <span className="block text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                    Physical Cores
                  </span>
                  <span className="text-[20px] font-bold text-[#16191f] font-mono mt-1 block">
                    {selectedHost.cores}
                  </span>
                </div>
                <div className="p-4 bg-[#fafafa] border border-[#eaeded] rounded-sm">
                  <span className="block text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                    Total vCPUs
                  </span>
                  <span className="text-[20px] font-bold text-[#16191f] font-mono mt-1 block">
                    {selectedHost.totalVCpus}
                  </span>
                </div>
                <div className="p-4 bg-[#fafafa] border border-[#eaeded] rounded-sm">
                  <span className="block text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                    Available vCPUs
                  </span>
                  <span className="text-[20px] font-bold text-[#1d8102] font-mono mt-1 block">
                    {selectedHost.totalVCpus - selectedHost.runningInstancesCount * 2}
                  </span>
                </div>
              </div>
            )}

            {activeBottomTab === "instances" && (
              <div className="space-y-3 text-[13px] text-[#545b64]">
                {selectedHost.runningInstancesCount === 0 ? (
                  <p>No instances are currently running on this Dedicated Host.</p>
                ) : (
                  <p>{selectedHost.runningInstancesCount} instances running on this dedicated physical server.</p>
                )}
                <div className="bg-[#fafafa] border border-[#eaeded] p-3 rounded-sm text-[12px]">
                  <span>To launch an instance onto this Dedicated Host, specify tenancy as </span>
                  <code className="text-[#0073bb] font-semibold">host</code>
                  <span> and provide Host ID </span>
                  <code className="text-[#0073bb] font-semibold">{selectedHost.hostId}</code>.
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Allocate Modal */}
      {showAllocateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-sm border border-[#d5dbdb] shadow-xl w-full max-w-xl overflow-hidden animate-in fade-in duration-150">
            <div className="px-6 py-4 border-b border-[#eaeded] flex items-center justify-between">
              <h3 className="text-[16px] font-bold text-[#16191f]">Allocate Dedicated Host</h3>
              <button
                onClick={() => setShowAllocateModal(false)}
                className="text-[#545b64] hover:text-[#16191f] text-[18px] font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAllocate} className="p-6 space-y-4 text-[13px]">
              <div>
                <label className="block font-semibold text-[#16191f] mb-1">Instance Family & Type</label>
                <select
                  value={instanceFamily}
                  onChange={(e) => setInstanceFamily(e.target.value)}
                  className="w-full border border-[#aab7b8] rounded-sm px-3 py-1.5 focus:border-[#ec7211] focus:outline-none font-mono"
                >
                  <option value="m5.large">m5.large (General Purpose - 48 Cores, 96 vCPUs)</option>
                  <option value="c5.xlarge">c5.xlarge (Compute Optimized - 36 Cores, 72 vCPUs)</option>
                  <option value="r5.large">r5.large (Memory Optimized - 48 Cores, 96 vCPUs)</option>
                  <option value="t3.large">t3.large (Burstable General Purpose)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#16191f] mb-1">Availability Zone</label>
                <select
                  value={availabilityZone}
                  onChange={(e) => setAvailabilityZone(e.target.value)}
                  className="w-full border border-[#aab7b8] rounded-sm px-3 py-1.5 focus:border-[#ec7211] focus:outline-none"
                >
                  <option value="us-east-1a">us-east-1a</option>
                  <option value="us-east-1b">us-east-1b</option>
                  <option value="us-east-1c">us-east-1c</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#16191f] mb-1">Instance Auto-placement</label>
                  <select
                    value={autoPlacement}
                    onChange={(e) => setAutoPlacement(e.target.value as any)}
                    className="w-full border border-[#aab7b8] rounded-sm px-3 py-1.5 focus:border-[#ec7211] focus:outline-none"
                  >
                    <option value="on">On (Permits untargeted instances)</option>
                    <option value="off">Off (Only targeted instances)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#16191f] mb-1">Host Recovery</label>
                  <select
                    value={hostRecovery}
                    onChange={(e) => setHostRecovery(e.target.value as any)}
                    className="w-full border border-[#aab7b8] rounded-sm px-3 py-1.5 focus:border-[#ec7211] focus:outline-none"
                  >
                    <option value="on">On (Automatic replacement on fault)</option>
                    <option value="off">Off</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#16191f] mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                  className="w-full border border-[#aab7b8] rounded-sm px-3 py-1.5 focus:border-[#ec7211] focus:outline-none font-mono"
                />
              </div>

              <div className="p-3 bg-[#f8f9fa] border border-[#eaeded] rounded-sm text-[12px] text-[#545b64]">
                Dedicated Hosts are billed per-host for each second that they remain allocated, regardless of whether instances are running.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#eaeded]">
                <button
                  type="button"
                  onClick={() => setShowAllocateModal(false)}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="px-4 border border-[#545b64] text-[#16191f] font-bold text-[13px] rounded-sm hover:bg-[#f2f3f3] whitespace-nowrap inline-flex items-center justify-center transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="px-4 bg-[#ec7211] text-white font-bold text-[13px] rounded-sm hover:bg-[#eb5f07] disabled:opacity-50 whitespace-nowrap inline-flex items-center justify-center transition-colors"
                >
                  {isPending ? "Allocating..." : "Allocate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Release Modal */}
      {showReleaseModal && selectedHost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-sm border border-[#d5dbdb] shadow-xl w-full max-w-md overflow-hidden animate-in fade-in duration-150">
            <div className="px-6 py-4 border-b border-[#eaeded] flex items-center justify-between">
              <h3 className="text-[16px] font-bold text-[#16191f]">Release Dedicated Host</h3>
              <button
                onClick={() => setShowReleaseModal(false)}
                className="text-[#545b64] hover:text-[#16191f] text-[18px] font-bold"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4 text-[13px]">
              <p className="text-[#16191f]">
                Are you sure you want to release host{" "}
                <span className="font-mono font-bold text-[#0073bb]">{selectedHost.hostId}</span>?
              </p>
              <p className="text-[#545b64] text-[12px]">
                Once released, all hardware reservations for this server end, and you will no longer be charged.
              </p>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#eaeded]">
                <button
                  onClick={() => setShowReleaseModal(false)}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="px-4 border border-[#545b64] text-[#16191f] font-bold text-[13px] rounded-sm hover:bg-[#f2f3f3] whitespace-nowrap inline-flex items-center justify-center transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRelease}
                  disabled={isPending}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="px-4 bg-[#d13212] text-white font-bold text-[13px] rounded-sm hover:bg-[#b0270d] disabled:opacity-50 whitespace-nowrap inline-flex items-center justify-center transition-colors"
                >
                  {isPending ? "Releasing..." : "Release Host"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
