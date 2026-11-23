/**
 * InstancesClient.tsx – Interactive EC2 Instances table and lifecycle management.
 * Connected to live AWS Emulator via Server Actions.
 * Features:
 * - Real-time instance state transitions against AWS Emulator (Start, Stop, Reboot, Terminate)
 * - Authentic AWS Connect modal with EC2 Instance Connect and SSH commands
 * - Bottom sliding details drawer for selected instance
 * - Filter by state, search by text, and live manual refresh
 * - Zero emojis, Cloudscape enterprise styling.
 */

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import EmulatorOfflineBanner from "@/components/EmulatorOfflineBanner";
import { EC2Instance } from "@/lib/ec2-data";
import EC2TerminalModal from "./EC2TerminalModal";
import {
  fetchLiveEC2Instances,
  startLiveInstance,
  stopLiveInstance,
  rebootLiveInstance,
  terminateLiveInstance,
} from "@/app/ec2/actions";

interface InstancesClientProps {
  initialInstances?: EC2Instance[];
  isLive?: boolean;
  liveError?: string;
}

export default function InstancesClient({
  initialInstances = [],
  isLive = true,
  liveError,
}: InstancesClientProps) {
  const [instances, setInstances] = useState<EC2Instance[]>(initialInstances);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [isPending, startTransition] = useTransition();
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Modals & dropdowns
  const [showStateMenu, setShowStateMenu] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showTerminalModal, setShowTerminalModal] = useState(false);
  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [activeConnectTab, setActiveConnectTab] = useState<"instance-connect" | "ssh" | "session-manager">("instance-connect");
  const [copiedSsh, setCopiedSsh] = useState(false);
  const [activeBottomTab, setActiveBottomTab] = useState<"details" | "status" | "security" | "networking" | "storage">("details");

  const selectedInstance = instances.find((i) => i.id === selectedId) || null;

  async function refreshInstances() {
    startTransition(async () => {
      const res = await fetchLiveEC2Instances();
      if (res.isLive) {
        setInstances(res.instances);
        setActionMessage("Refreshed live data from AWS Emulator.");
        setTimeout(() => setActionMessage(null), 3000);
      }
    });
  }

  // Lifecycle state transitions
  function handleStartInstance() {
    if (!selectedInstance || selectedInstance.state !== "stopped") return;
    setShowStateMenu(false);

    // Optimistic transition
    const updatedPending = instances.map((inst) =>
      inst.id === selectedInstance.id ? { ...inst, state: "pending" as const } : inst
    );
    setInstances(updatedPending);

    startTransition(async () => {
      const res = await startLiveInstance(selectedInstance.id);
      if (res.success) {
        setActionMessage(`Instance ${selectedInstance.id} starting...`);
        setTimeout(async () => {
          const fresh = await fetchLiveEC2Instances();
          if (fresh.isLive) setInstances(fresh.instances);
        }, 1200);
      } else {
        setActionMessage(`Error starting: ${res.error}`);
      }
    });
  }

  function handleStopInstance() {
    if (!selectedInstance || selectedInstance.state !== "running") return;
    setShowStateMenu(false);

    // Optimistic transition
    const updatedStopping = instances.map((inst) =>
      inst.id === selectedInstance.id ? { ...inst, state: "stopping" as const } : inst
    );
    setInstances(updatedStopping);

    startTransition(async () => {
      const res = await stopLiveInstance(selectedInstance.id);
      if (res.success) {
        setActionMessage(`Instance ${selectedInstance.id} stopping...`);
        setTimeout(async () => {
          const fresh = await fetchLiveEC2Instances();
          if (fresh.isLive) setInstances(fresh.instances);
        }, 1200);
      } else {
        setActionMessage(`Error stopping: ${res.error}`);
      }
    });
  }

  function handleRebootInstance() {
    if (!selectedInstance) return;
    setShowStateMenu(false);

    const updatedRebooting = instances.map((inst) =>
      inst.id === selectedInstance.id ? { ...inst, state: "rebooting" as const } : inst
    );
    setInstances(updatedRebooting);

    startTransition(async () => {
      const res = await rebootLiveInstance(selectedInstance.id);
      if (res.success) {
        setActionMessage(`Instance ${selectedInstance.id} rebooting...`);
        setTimeout(async () => {
          const fresh = await fetchLiveEC2Instances();
          if (fresh.isLive) setInstances(fresh.instances);
        }, 1500);
      } else {
        setActionMessage(`Error rebooting: ${res.error}`);
      }
    });
  }

  function handleTerminateInstance() {
    if (!selectedInstance) return;
    setShowTerminateModal(false);

    const updatedTerminating = instances.map((inst) =>
      inst.id === selectedInstance.id ? { ...inst, state: "terminated" as const } : inst
    );
    setInstances(updatedTerminating);

    startTransition(async () => {
      const res = await terminateLiveInstance(selectedInstance.id);
      if (res.success) {
        setActionMessage(`Instance ${selectedInstance.id} terminated.`);
        setTimeout(async () => {
          const fresh = await fetchLiveEC2Instances();
          if (fresh.isLive) setInstances(fresh.instances);
        }, 1200);
      } else {
        setActionMessage(`Error terminating: ${res.error}`);
      }
    });
  }

  // Filter instances
  const filteredInstances = instances.filter((inst) => {
    const matchesFilter =
      stateFilter === "all" ||
      (stateFilter === "running" && inst.state === "running") ||
      (stateFilter === "stopped" && inst.state === "stopped") ||
      (stateFilter === "terminated" && inst.state === "terminated");

    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      inst.name.toLowerCase().includes(q) ||
      inst.id.toLowerCase().includes(q) ||
      inst.publicIp.toLowerCase().includes(q) ||
      inst.privateIp.toLowerCase().includes(q) ||
      inst.instanceType.toLowerCase().includes(q);

    return matchesFilter && matchesQuery;
  });

  return (
    <div className="space-y-4 max-w-[1500px]">
      {/* Live Status Pill */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#f2f8f0] border border-[#b8dfaf] rounded-sm text-[12px] text-[#1d8102]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#1d8102] animate-pulse" />
          <span className="font-semibold">Live AWS Emulator</span>
          <span className="text-[#545b64]">|</span>
          <span>Instances queried directly from Docker container (127.0.0.1:9297)</span>
        </div>
        {actionMessage && <span className="font-medium text-[#0073bb]">{actionMessage}</span>}
      </div>

      {!isLive || liveError ? (
        <EmulatorOfflineBanner error={liveError} onRetry={refreshInstances} />
      ) : null}

      {/* Page Title & Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-bold text-[#16191f]">
            Instances <span className="text-[#545b64] font-normal">({filteredInstances.length})</span>
          </h1>
          <p className="text-[13px] text-[#545b64]">
            Manage, configure, and monitor your Amazon EC2 virtual machine instances.
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Refresh Button */}
          <button
            onClick={refreshInstances}
            disabled={isPending}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="px-3 border border-[#545b64] rounded-sm text-[#16191f] hover:bg-[#f2f3f3] text-[13px] font-bold whitespace-nowrap inline-flex items-center justify-center transition-colors gap-1.5 disabled:opacity-50"
            title="Refresh from AWS Emulator"
          >
            <svg
              className={`w-3.5 h-3.5 text-[#545b64] ${isPending ? "animate-spin" : ""}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M23 4v6h-6" />
              <path d="M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
            Refresh
          </button>

          {/* Connect Button */}
          <button
            onClick={() => setShowConnectModal(true)}
            disabled={!selectedInstance || selectedInstance.state !== "running"}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="px-3 border border-[#545b64] rounded-sm text-[#16191f] hover:bg-[#f2f3f3] text-[13px] font-bold whitespace-nowrap inline-flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Connect
          </button>

          {/* Instance State Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowStateMenu(!showStateMenu)}
              disabled={!selectedInstance}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="px-3 border border-[#545b64] rounded-sm text-[#16191f] hover:bg-[#f2f3f3] text-[13px] font-bold whitespace-nowrap inline-flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-colors gap-1"
            >
              Instance state
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {showStateMenu && selectedInstance && (
              <div
                className="absolute right-0 mt-1 w-48 bg-white border border-[#d5dbdb] rounded-sm shadow-lg z-30 py-1 text-[13px]"
                onMouseLeave={() => setShowStateMenu(false)}
              >
                <button
                  onClick={handleStartInstance}
                  disabled={selectedInstance.state !== "stopped"}
                  className="w-full text-left px-4 py-2 hover:bg-[#f2f3f3] disabled:text-[#aab7b8] disabled:hover:bg-transparent"
                >
                  Start instance
                </button>
                <button
                  onClick={handleStopInstance}
                  disabled={selectedInstance.state !== "running"}
                  className="w-full text-left px-4 py-2 hover:bg-[#f2f3f3] disabled:text-[#aab7b8] disabled:hover:bg-transparent"
                >
                  Stop instance
                </button>
                <button
                  onClick={handleRebootInstance}
                  disabled={selectedInstance.state !== "running"}
                  className="w-full text-left px-4 py-2 hover:bg-[#f2f3f3] disabled:text-[#aab7b8] disabled:hover:bg-transparent"
                >
                  Reboot instance
                </button>
                <div className="border-t border-[#eaeded] my-1" />
                <button
                  onClick={() => {
                    setShowStateMenu(false);
                    setShowTerminateModal(true);
                  }}
                  className="w-full text-left px-4 py-2 text-[#d13212] hover:bg-[#fdf3f1]"
                >
                  Terminate instance
                </button>
              </div>
            )}
          </div>

          {/* Launch instance button */}
          <Link
            href="/ec2/launch"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="px-4 bg-[#ec7211] text-white rounded-sm hover:bg-[#eb5f07] text-[13px] font-bold whitespace-nowrap inline-flex items-center justify-center transition-colors"
          >
            Launch instances
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 border border-[#d5dbdb] rounded-sm">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <input
            type="text"
            placeholder="Find instance by name, ID, or IP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-[13px] border border-[#aab7b8] rounded-sm focus:outline-none focus:border-[#0073bb] focus:ring-1 focus:ring-[#0073bb]"
          />
          <svg
            className="absolute left-2.5 top-2.5 text-[#545b64]"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>

        <div className="flex items-center gap-2 text-[13px]">
          <span className="text-[#545b64]">State:</span>
          {(["all", "running", "stopped", "terminated"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStateFilter(st)}
              className={`px-2.5 py-1 rounded-sm capitalize text-[12px] font-medium transition-colors ${
                stateFilter === st
                  ? "bg-[#0073bb] text-white"
                  : "bg-[#f2f3f3] text-[#545b64] hover:bg-[#eaeded]"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Instances Table */}
      <div className="bg-white border border-[#d5dbdb] rounded-sm overflow-x-auto awsui-shadow">
        <table className="w-full text-left border-collapse text-[13px]">
          <thead>
            <tr className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] text-[12px]">
              <th className="py-2.5 px-3 w-10 text-center">
                <input
                  type="checkbox"
                  aria-label="Select all"
                  checked={selectedId !== null && filteredInstances.some((i) => i.id === selectedId)}
                  onChange={(e) => {
                    if (e.target.checked && filteredInstances.length > 0) {
                      setSelectedId(filteredInstances[0].id);
                    } else {
                      setSelectedId(null);
                    }
                  }}
                  className="rounded border-[#aab7b8]"
                />
              </th>
              <th className="py-2.5 px-3 font-semibold">Name</th>
              <th className="py-2.5 px-3 font-semibold">Instance ID</th>
              <th className="py-2.5 px-3 font-semibold">Instance state</th>
              <th className="py-2.5 px-3 font-semibold">Instance type</th>
              <th className="py-2.5 px-3 font-semibold">Status check</th>
              <th className="py-2.5 px-3 font-semibold">Availability Zone</th>
              <th className="py-2.5 px-3 font-semibold">Public IPv4</th>
              <th className="py-2.5 px-3 font-semibold">Private IPv4</th>
              <th className="py-2.5 px-3 font-semibold">Security Group</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eaeded]">
            {filteredInstances.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-[#545b64]">
                  No instances match the current filters.
                </td>
              </tr>
            ) : (
              filteredInstances.map((inst) => {
                const isSelected = selectedId === inst.id;
                return (
                  <tr
                    key={inst.id}
                    onClick={() => setSelectedId(isSelected ? null : inst.id)}
                    className={`cursor-pointer hover:bg-[#f2f8f8] transition-colors ${
                      isSelected ? "bg-[#f2f8f8]" : ""
                    }`}
                  >
                    <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => setSelectedId(isSelected ? null : inst.id)}
                        className="rounded border-[#aab7b8]"
                        aria-label={`Select ${inst.id}`}
                      />
                    </td>
                    <td className="py-2.5 px-3 font-medium text-[#0073bb]">
                      <Link
                        href={`/ec2/instances/${inst.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="hover:underline"
                      >
                        {inst.name}
                      </Link>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[12px] text-[#0073bb]">
                      <Link
                        href={`/ec2/instances/${inst.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="hover:underline"
                      >
                        {inst.id}
                      </Link>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1.5 capitalize text-[12px]">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            inst.state === "running"
                              ? "bg-[#1d8102]"
                              : inst.state === "stopped"
                              ? "bg-[#545b64]"
                              : inst.state === "pending" || inst.state === "rebooting"
                              ? "bg-[#ec7211] animate-pulse"
                              : "bg-[#d13212]"
                          }`}
                        />
                        {inst.state}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[12px] text-[#545b64]">{inst.instanceType}</td>
                    <td className="py-2.5 px-3 text-[12px]">
                      {inst.statusCheck === "2/2 checks passed" ? (
                        <span className="text-[#1d8102] font-medium">{inst.statusCheck}</span>
                      ) : (
                        <span className="text-[#545b64]">{inst.statusCheck}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-[#545b64] text-[12px]">{inst.availabilityZone}</td>
                    <td className="py-2.5 px-3 font-mono text-[12px] text-[#16191f]">
                      {inst.publicIp || "—"}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[12px] text-[#545b64]">{inst.privateIp}</td>
                    <td className="py-2.5 px-3 text-[#0073bb] text-[12px]">{inst.securityGroupName}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Selected Instance Bottom Sliding Details Drawer */}
      {selectedInstance && (
        <div className="bg-white border border-[#d5dbdb] rounded-sm awsui-shadow mt-4">
          {/* Panel Header */}
          <div className="px-5 py-3 border-b border-[#eaeded] flex flex-wrap items-center justify-between gap-3 bg-[#fafafa]">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-[14px] text-[#16191f]">
                {selectedInstance.name} ({selectedInstance.id})
              </span>
              <span
                className={`px-2 py-0.5 text-[11px] font-medium rounded-full uppercase ${
                  selectedInstance.state === "running"
                    ? "bg-[#f2f8f0] text-[#1d8102] border border-[#b8dfaf]"
                    : selectedInstance.state === "stopped"
                    ? "bg-[#f2f3f3] text-[#545b64] border border-[#d5dbdb]"
                    : "bg-[#fdf3f1] text-[#d13212] border border-[#f5b8b0]"
                }`}
              >
                {selectedInstance.state}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/ec2/instances/${selectedInstance.id}`}
                className="text-[12px] text-[#0073bb] hover:underline font-medium"
              >
                Open full page &rarr;
              </Link>
              <button
                onClick={() => setSelectedId(null)}
                className="text-[#879596] hover:text-[#16191f] p-1"
                title="Close panel"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Panel Tabs */}
          <div className="flex items-center gap-1 border-b border-[#eaeded] px-5 text-[13px] bg-white">
            {(["details", "status", "security", "networking", "storage"] as const).map((tb) => (
              <button
                key={tb}
                onClick={() => setActiveBottomTab(tb)}
                className={`px-3 py-2 border-b-2 font-medium capitalize transition-colors ${
                  activeBottomTab === tb
                    ? "border-[#0073bb] text-[#0073bb]"
                    : "border-transparent text-[#545b64] hover:text-[#16191f]"
                }`}
              >
                {tb}
              </button>
            ))}
          </div>

          {/* Panel Tab Content */}
          <div className="p-5 text-[13px]">
            {activeBottomTab === "details" && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-[11px] text-[#545b64] uppercase font-bold">Public IPv4 address</div>
                  <div className="font-mono text-[#16191f] mt-0.5">{selectedInstance.publicIp || "—"}</div>
                </div>
                <div>
                  <div className="text-[11px] text-[#545b64] uppercase font-bold">Private IPv4 address</div>
                  <div className="font-mono text-[#16191f] mt-0.5">{selectedInstance.privateIp || "—"}</div>
                </div>
                <div>
                  <div className="text-[11px] text-[#545b64] uppercase font-bold">AMI ID</div>
                  <div className="font-mono text-[#0073bb] mt-0.5 truncate">{selectedInstance.amiId}</div>
                </div>
                <div>
                  <div className="text-[11px] text-[#545b64] uppercase font-bold">Key pair name</div>
                  <div className="text-[#0073bb] mt-0.5">{selectedInstance.keyName}</div>
                </div>
              </div>
            )}

            {activeBottomTab === "status" && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[#1d8102]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1d8102]" />
                  <span className="font-semibold">{selectedInstance.statusCheck}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-[12px] bg-[#fafafa] p-3 border border-[#eaeded] rounded">
                  <div>
                    <span className="text-[#545b64]">System reachability check:</span>{" "}
                    <strong className="text-[#1d8102]">Passed</strong>
                  </div>
                  <div>
                    <span className="text-[#545b64]">Instance reachability check:</span>{" "}
                    <strong className="text-[#1d8102]">Passed</strong>
                  </div>
                </div>
              </div>
            )}

            {activeBottomTab === "security" && (
              <div>
                <div className="text-[12px] text-[#545b64] mb-1">
                  Attached Security Group: <strong className="text-[#0073bb]">{selectedInstance.securityGroupName}</strong> ({selectedInstance.securityGroupId})
                </div>
                <p className="text-[12px] text-[#879596]">
                  Inbound traffic is filtered according to security group firewall rules.
                </p>
              </div>
            )}

            {activeBottomTab === "networking" && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-[11px] text-[#545b64] uppercase font-bold">VPC ID</div>
                  <div className="font-mono text-[#0073bb] mt-0.5">{selectedInstance.vpcId}</div>
                </div>
                <div>
                  <div className="text-[11px] text-[#545b64] uppercase font-bold">Subnet ID</div>
                  <div className="font-mono text-[#0073bb] mt-0.5">{selectedInstance.subnetId}</div>
                </div>
                <div>
                  <div className="text-[11px] text-[#545b64] uppercase font-bold">Public IPv4 DNS</div>
                  <div className="font-mono text-[#16191f] mt-0.5 truncate text-[11px]">{selectedInstance.publicDns || "—"}</div>
                </div>
              </div>
            )}

            {activeBottomTab === "storage" && (
              <div>
                <div className="text-[12px] text-[#545b64] mb-2 font-medium">Root device and block devices:</div>
                <div className="bg-[#fafafa] p-3 border border-[#eaeded] rounded text-[12px] font-mono flex items-center justify-between">
                  <span>/dev/xvda (Root volume, EBS gp3)</span>
                  <span className="text-[#1d8102] font-semibold">Attached</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Connect Modal */}
      {showConnectModal && selectedInstance && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-sm border border-[#d5dbdb] shadow-2xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#eaeded] pb-3">
              <h2 className="text-[16px] font-bold text-[#16191f]">
                Connect to instance ({selectedInstance.id})
              </h2>
              <button
                onClick={() => setShowConnectModal(false)}
                className="text-[#879596] hover:text-[#16191f]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Connect Tabs */}
            <div className="flex border-b border-[#eaeded] text-[13px]">
              {(["instance-connect", "ssh", "session-manager"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveConnectTab(t)}
                  className={`px-4 py-2 border-b-2 font-medium transition-colors ${
                    activeConnectTab === t
                      ? "border-[#0073bb] text-[#0073bb]"
                      : "border-transparent text-[#545b64] hover:text-[#16191f]"
                  }`}
                >
                  {t === "instance-connect"
                    ? "EC2 Instance Connect"
                    : t === "ssh"
                    ? "SSH Client"
                    : "Session Manager"}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {activeConnectTab === "instance-connect" && (
              <div className="space-y-4 text-[13px]">
                <p className="text-[#545b64]">
                  Connect to your instance using EC2 Instance Connect with a single click.
                </p>
                <div className="bg-[#f2f8f8] p-4 rounded border border-[#d5dbdb] space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#545b64]">User name:</span>
                    <strong className="text-[#16191f]">ec2-user</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#545b64]">Target IP:</span>
                    <span className="font-mono text-[#16191f]">{selectedInstance.publicIp || selectedInstance.privateIp}</span>
                  </div>
                </div>
                <div className="pt-2 flex justify-end gap-2">
                  <button
                    onClick={() => setShowConnectModal(false)}
                    className="px-4 py-1.5 border border-[#545b64] rounded-sm text-[13px] text-[#16191f] hover:bg-[#f2f3f3]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowConnectModal(false);
                      setShowTerminalModal(true);
                    }}
                    className="px-4 py-1.5 bg-[#ec7211] text-white rounded-sm text-[13px] font-medium hover:bg-[#eb5f07]"
                  >
                    Launch terminal
                  </button>
                </div>
              </div>
            )}

            {activeConnectTab === "ssh" && (
              <div className="space-y-4 text-[13px]">
                <p className="text-[#545b64]">
                  Connect using your local terminal with SSH and private key.
                </p>
                <div className="space-y-2">
                  <p className="font-semibold text-[#16191f]">1. Locate your private key:</p>
                  <div className="bg-[#fafafa] p-2 font-mono text-[12px] border border-[#eaeded] rounded">
                    chmod 400 {selectedInstance.keyName}.pem
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-[#16191f]">2. Connect to your instance using its Public DNS or IP:</p>
                  <div className="bg-[#16191f] text-[#34d399] p-3 font-mono text-[12px] rounded flex items-center justify-between">
                    <code>
                      ssh -i &quot;{selectedInstance.keyName}.pem&quot; ec2-user@{selectedInstance.publicIp || selectedInstance.privateIp}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`ssh -i "${selectedInstance.keyName}.pem" ec2-user@${selectedInstance.publicIp || selectedInstance.privateIp}`);
                        setCopiedSsh(true);
                        setTimeout(() => setCopiedSsh(false), 2000);
                      }}
                      className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-[11px]"
                    >
                      {copiedSsh ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setShowConnectModal(false)}
                    className="px-4 py-1.5 border border-[#545b64] rounded-sm text-[13px] text-[#16191f] hover:bg-[#f2f3f3]"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {activeConnectTab === "session-manager" && (
              <div className="space-y-4 text-[13px]">
                <p className="text-[#545b64]">
                  AWS Systems Manager Session Manager provides secure and auditable instance management without open inbound ports.
                </p>
                <div className="p-3 bg-[#f2f8f0] border border-[#b8dfaf] rounded text-[#1d8102]">
                  SSM Agent is active and responsive on instance {selectedInstance.id}.
                </div>
                <div className="pt-2 flex justify-end gap-2">
                  <button
                    onClick={() => setShowConnectModal(false)}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                    className="px-4 border border-[#545b64] rounded-sm text-[13px] font-bold text-[#16191f] hover:bg-[#f2f3f3] whitespace-nowrap inline-flex items-center justify-center transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowConnectModal(false);
                      setShowTerminalModal(true);
                    }}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                    className="px-4 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] whitespace-nowrap inline-flex items-center justify-center transition-colors"
                  >
                    Start session
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Terminate Confirmation Modal */}
      {showTerminateModal && selectedInstance && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-sm border border-[#d5dbdb] shadow-2xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-[16px] font-bold text-[#d13212]">
              Terminate instance ({selectedInstance.id})?
            </h2>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to terminate <strong className="text-[#16191f]">{selectedInstance.name}</strong>? Any Amazon EBS volumes configured to delete on termination will be deleted. This action cannot be undone.
            </p>
            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setShowTerminateModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 border border-[#545b64] rounded-sm text-[13px] font-bold text-[#16191f] hover:bg-[#f2f3f3] whitespace-nowrap inline-flex items-center justify-center transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleTerminateInstance}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 bg-[#d13212] text-white rounded-sm text-[13px] font-bold hover:bg-[#b0280e] whitespace-nowrap inline-flex items-center justify-center transition-colors"
              >
                Terminate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive EC2 Terminal Modal */}
      {showTerminalModal && selectedInstance && (
        <EC2TerminalModal
          isOpen={showTerminalModal}
          onClose={() => setShowTerminalModal(false)}
          instance={selectedInstance}
        />
      )}
    </div>
  );
}
