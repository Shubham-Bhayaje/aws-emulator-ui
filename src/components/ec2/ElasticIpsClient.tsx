/**
 * src/components/ec2/ElasticIpsClient.tsx – AWS Elastic IPs Console Replica.
 * Zero emojis, Cloudscape enterprise styling.
 */

"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  ElasticIp,
  EC2Instance,
} from "@/lib/ec2-data";
import {
  allocateLiveElasticIp,
  releaseLiveElasticIp,
  fetchLiveElasticIps,
  associateLiveElasticIp,
  disassociateLiveElasticIp,
} from "@/app/ec2/actions";

interface Props {
  initialElasticIps?: ElasticIp[];
  instances?: EC2Instance[];
  isLive?: boolean;
  liveError?: string;
}

export default function ElasticIpsClient({
  initialElasticIps = [],
  instances = [],
  isLive = true,
  liveError,
}: Props) {
  const [elasticIps, setElasticIps] = useState<ElasticIp[]>(initialElasticIps || []);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialElasticIps && initialElasticIps.length > 0 ? initialElasticIps[0]?.allocationId : null
  );
  const [search, setSearch] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"details" | "tags">("details");
  const [isPending, startTransition] = useTransition();

  // Modals
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [showAssociateModal, setShowAssociateModal] = useState(false);
  const [showDisassociateModal, setShowDisassociateModal] = useState(false);
  const [showReleaseModal, setShowReleaseModal] = useState(false);

  // Association Form
  const [targetInstanceId, setTargetInstanceId] = useState<string>(
    instances && instances.length > 0 ? instances[0]?.id : ""
  );
  const [privateIpAddress, setPrivateIpAddress] = useState("");

  const selectedEip = (elasticIps || []).find((e) => e.allocationId === selectedId) || null;

  const totalCount = (elasticIps || []).length;
  const associatedCount = (elasticIps || []).filter((e) => e.associatedInstanceId || e.associationId).length;
  const unassociatedCount = totalCount - associatedCount;

  function refreshIps() {
    startTransition(async () => {
      const res = await fetchLiveElasticIps();
      const list = res.elasticIps || [];
      setElasticIps(list);
      if (list.length > 0 && (!selectedId || !list.some((e) => e.allocationId === selectedId))) {
        setSelectedId(list[0]?.allocationId || null);
      }
    });
  }

  function handleAllocateIp() {
    setShowAllocateModal(false);
    startTransition(async () => {
      const res = await allocateLiveElasticIp();
      if (res.success && res.elasticIp) {
        const fresh = await fetchLiveElasticIps();
        const list = fresh.elasticIps || [];
        setElasticIps(list);
        setSelectedId(res.elasticIp.allocationId);
        setFeedback(`Allocated new Elastic IP: ${res.elasticIp.publicIp} (${res.elasticIp.allocationId})`);
      } else {
        setFeedback(`Allocation failed: ${res.error || "Unknown error"}`);
      }
      setTimeout(() => setFeedback(null), 5000);
    });
  }

  function handleAssociate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEip || !targetInstanceId) return;

    startTransition(async () => {
      const res = await associateLiveElasticIp({
        allocationId: selectedEip.allocationId,
        instanceId: targetInstanceId,
        privateIpAddress: privateIpAddress.trim() || undefined,
      });

      if (res.success) {
        setShowAssociateModal(false);
        const fresh = await fetchLiveElasticIps();
        setElasticIps(fresh.elasticIps || []);
        setFeedback(`Associated ${selectedEip.publicIp} with instance ${targetInstanceId}.`);
      } else {
        setFeedback(`Association failed: ${res.error || "Unknown error"}`);
      }
      setTimeout(() => setFeedback(null), 5000);
    });
  }

  function handleDisassociate() {
    if (!selectedEip || !selectedEip.associationId) return;
    const targetAssocId = selectedEip.associationId;
    const ipStr = selectedEip.publicIp;

    startTransition(async () => {
      const res = await disassociateLiveElasticIp(targetAssocId);
      if (res.success) {
        setShowDisassociateModal(false);
        const fresh = await fetchLiveElasticIps();
        setElasticIps(fresh.elasticIps || []);
        setFeedback(`Disassociated ${ipStr}.`);
      } else {
        setFeedback(`Disassociation failed: ${res.error || "Unknown error"}`);
      }
      setTimeout(() => setFeedback(null), 5000);
    });
  }

  function handleReleaseIp() {
    if (!selectedEip) return;
    const targetAllocId = selectedEip.allocationId;
    const ipStr = selectedEip.publicIp;

    startTransition(async () => {
      const res = await releaseLiveElasticIp(targetAllocId);
      if (res.success) {
        setShowReleaseModal(false);
        const fresh = await fetchLiveElasticIps();
        const list = fresh.elasticIps || [];
        setElasticIps(list);
        setSelectedId(list[0]?.allocationId || null);
        setFeedback(`Released Elastic IP ${ipStr} (${targetAllocId}).`);
      } else {
        setFeedback(`Release failed: ${res.error || "Unknown error"}`);
      }
      setTimeout(() => setFeedback(null), 5000);
    });
  }

  const filtered = (elasticIps || []).filter(
    (e) =>
      e.publicIp.toLowerCase().includes(search.toLowerCase()) ||
      e.allocationId.toLowerCase().includes(search.toLowerCase()) ||
      (e.associatedInstanceId && e.associatedInstanceId.toLowerCase().includes(search.toLowerCase()))
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
              {isLive ? "Elastic IP Service Connected (AWS Emulator)" : "Mock Data Mode"}
            </span>
          </div>
          <span className="text-[#95a5a6] text-[12px]">|</span>
          <span className="text-[12px] font-mono text-[#545b64]">Region: us-east-1</span>
        </div>
        {feedback && <span className="text-[12px] text-[#0073bb] font-medium">{feedback}</span>}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#eaeded] p-4 rounded-sm awsui-shadow">
          <div className="text-[12px] font-medium text-[#545b64] uppercase tracking-wide">
            Total Allocated IPs
          </div>
          <div className="text-[26px] font-bold text-[#16191f] mt-1">{totalCount}</div>
        </div>

        <div className="bg-white border border-[#eaeded] p-4 rounded-sm awsui-shadow">
          <div className="text-[12px] font-medium text-[#545b64] uppercase tracking-wide">
            Associated with Instances
          </div>
          <div className="text-[26px] font-bold text-[#1d8102] mt-1">{associatedCount}</div>
        </div>

        <div className="bg-white border border-[#eaeded] p-4 rounded-sm awsui-shadow">
          <div className="text-[12px] font-medium text-[#545b64] uppercase tracking-wide">
            Unassociated / Free
          </div>
          <div className="text-[26px] font-bold text-[#0073bb] mt-1">{unassociatedCount}</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-[#eaeded] rounded-sm awsui-shadow">
        <div className="p-4 border-b border-[#eaeded] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2">
              <h2 className="text-[18px] font-bold text-[#16191f]">Elastic IP addresses</h2>
              <span className="text-[13px] text-[#545b64]">({filtered.length})</span>
            </div>
            <p className="text-[13px] text-[#545b64] mt-0.5">
              An Elastic IP address is a static, public IPv4 address designed for dynamic cloud computing.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 self-start md:self-center">
            <button
              onClick={refreshIps}
              disabled={isPending}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-3.5 bg-white border border-[#aab7b8] hover:border-[#16191f] text-[#16191f] text-[13px] font-bold rounded-sm whitespace-nowrap inline-flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
            >
              Refresh
            </button>
            <button
              onClick={() => setShowAssociateModal(true)}
              disabled={!selectedEip || Boolean(selectedEip.associatedInstanceId)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-3.5 border border-[#aab7b8] text-[#16191f] text-[13px] font-bold rounded-sm whitespace-nowrap inline-flex items-center justify-center transition-colors hover:border-[#16191f] disabled:border-[#eaeded] disabled:bg-[#f2f3f3] disabled:text-[#aab7b8] disabled:cursor-not-allowed cursor-pointer"
            >
              Associate Elastic IP
            </button>
            <button
              onClick={() => setShowDisassociateModal(true)}
              disabled={!selectedEip || !selectedEip.associatedInstanceId}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-3.5 border border-[#aab7b8] text-[#16191f] text-[13px] font-bold rounded-sm whitespace-nowrap inline-flex items-center justify-center transition-colors hover:border-[#16191f] disabled:border-[#eaeded] disabled:bg-[#f2f3f3] disabled:text-[#aab7b8] disabled:cursor-not-allowed cursor-pointer"
            >
              Disassociate Elastic IP
            </button>
            <button
              onClick={() => setShowReleaseModal(true)}
              disabled={!selectedEip}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-3.5 border border-[#aab7b8] text-[#d13212] text-[13px] font-bold rounded-sm whitespace-nowrap inline-flex items-center justify-center transition-colors hover:border-[#d13212] disabled:border-[#eaeded] disabled:bg-[#f2f3f3] disabled:text-[#aab7b8] disabled:cursor-not-allowed cursor-pointer"
            >
              Release Elastic IP
            </button>
            <button
              onClick={() => setShowAllocateModal(true)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-4 bg-[#ec7211] hover:bg-[#eb5f07] text-white text-[13px] font-bold rounded-sm whitespace-nowrap inline-flex items-center justify-center shadow-sm transition-colors cursor-pointer"
            >
              Allocate Elastic IP address
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-4 bg-[#f8f9fa] border-b border-[#eaeded] flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              placeholder="Filter by IP address, allocation ID, or instance..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-3 pr-8 py-1.5 text-[13px] border border-[#aab7b8] rounded-sm focus:outline-none focus:border-[#ec7211] bg-white text-[#16191f]"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] text-[11px] font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4 w-10 text-center"></th>
                <th className="py-2.5 px-3">Allocated IPv4 address</th>
                <th className="py-2.5 px-3">Allocation ID</th>
                <th className="py-2.5 px-3">Associated instance ID</th>
                <th className="py-2.5 px-3">Private IP address</th>
                <th className="py-2.5 px-3">Association ID</th>
                <th className="py-2.5 px-3">Network interface ID</th>
                <th className="py-2.5 px-3">Scope</th>
                <th className="py-2.5 px-3">Network border group</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded] text-[#16191f]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="text-[16px] font-bold text-[#16191f]">
                        No Elastic IP addresses found
                      </div>
                      <p className="text-[13px] text-[#545b64]">
                        You can allocate a static public IPv4 address from Amazon&apos;s pool of addresses and associate it with any running or stopped EC2 instance.
                      </p>
                      <button
                        onClick={() => setShowAllocateModal(true)}
                        style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                        className="h-[32px] px-4 bg-[#ec7211] hover:bg-[#eb5f07] text-white text-[13px] font-bold rounded-sm whitespace-nowrap inline-flex items-center justify-center shadow-sm transition-colors cursor-pointer"
                      >
                        Allocate Elastic IP address
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((eip) => {
                  const isSelected = selectedId === eip.allocationId;
                  return (
                    <tr
                      key={eip.allocationId}
                      onClick={() => setSelectedId(eip.allocationId)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? "bg-[#f2f8fd]" : "hover:bg-[#f9fafb]"
                      }`}
                    >
                      <td className="py-3 px-4 text-center">
                        <input
                          type="radio"
                          name="eip-select"
                          checked={isSelected}
                          onChange={() => setSelectedId(eip.allocationId)}
                          className="h-4 w-4 text-[#ec7211] border-[#aab7b8] focus:ring-0"
                        />
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-[#0073bb]">
                        {eip.publicIp}
                      </td>
                      <td className="py-3 px-3 font-mono text-[12px] text-[#545b64]">
                        {eip.allocationId}
                      </td>
                      <td className="py-3 px-3">
                        {eip.associatedInstanceId ? (
                          <Link
                            href={`/ec2/instances/${eip.associatedInstanceId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-mono text-[#0073bb] hover:underline font-medium"
                          >
                            {eip.associatedInstanceId}
                          </Link>
                        ) : (
                          <span className="text-[#879596]">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-[12px] text-[#16191f]">
                        {eip.privateIpAddress || "—"}
                      </td>
                      <td className="py-3 px-3 font-mono text-[12px] text-[#545b64]">
                        {eip.associationId || "—"}
                      </td>
                      <td className="py-3 px-3 font-mono text-[12px] text-[#545b64]">
                        {eip.networkInterfaceId || "—"}
                      </td>
                      <td className="py-3 px-3 uppercase text-[11px] font-mono text-[#545b64]">
                        {eip.domain}
                      </td>
                      <td className="py-3 px-3 text-[#545b64] text-[12px]">
                        {eip.networkBorderGroup || "us-east-1"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Detail Drawer */}
      {selectedEip && (
        <div className="bg-white border border-[#eaeded] rounded-sm awsui-shadow">
          <div className="border-b border-[#eaeded] px-6 pt-4">
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-[16px] font-bold text-[#16191f] font-mono">
                {selectedEip.publicIp}
              </h3>
              <span className="text-[13px] text-[#545b64]">({selectedEip.allocationId})</span>
            </div>

            <div className="flex gap-6 border-b border-[#eaeded] -mb-[1px]">
              <button
                onClick={() => setActiveTab("details")}
                className={`pb-2 text-[13px] font-bold border-b-2 transition-colors ${
                  activeTab === "details"
                    ? "border-[#ec7211] text-[#ec7211]"
                    : "border-transparent text-[#545b64] hover:text-[#16191f]"
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab("tags")}
                className={`pb-2 text-[13px] font-bold border-b-2 transition-colors ${
                  activeTab === "tags"
                    ? "border-[#ec7211] text-[#ec7211]"
                    : "border-transparent text-[#545b64] hover:text-[#16191f]"
                }`}
              >
                Tags ({Object.keys(selectedEip.tags || {}).length})
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === "details" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[13px]">
                <div className="space-y-4">
                  <div>
                    <span className="text-[#545b64] block text-[12px]">Allocated IPv4 address</span>
                    <span className="font-mono font-bold text-[#16191f]">{selectedEip.publicIp}</span>
                  </div>
                  <div>
                    <span className="text-[#545b64] block text-[12px]">Allocation ID</span>
                    <span className="font-mono text-[#0073bb]">{selectedEip.allocationId}</span>
                  </div>
                  <div>
                    <span className="text-[#545b64] block text-[12px]">Association ID</span>
                    <span className="font-mono text-[#545b64]">{selectedEip.associationId || "—"}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-[#545b64] block text-[12px]">Associated instance ID</span>
                    {selectedEip.associatedInstanceId ? (
                      <Link
                        href={`/ec2/instances/${selectedEip.associatedInstanceId}`}
                        className="font-mono text-[#0073bb] hover:underline font-medium"
                      >
                        {selectedEip.associatedInstanceId}
                      </Link>
                    ) : (
                      <span className="text-[#545b64]">Not associated</span>
                    )}
                  </div>
                  <div>
                    <span className="text-[#545b64] block text-[12px]">Private IP address</span>
                    <span className="font-mono text-[#16191f]">{selectedEip.privateIpAddress || "—"}</span>
                  </div>
                  <div>
                    <span className="text-[#545b64] block text-[12px]">Network interface ID</span>
                    <span className="font-mono text-[#545b64]">{selectedEip.networkInterfaceId || "—"}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-[#545b64] block text-[12px]">Scope</span>
                    <span className="uppercase font-mono text-[#16191f]">{selectedEip.domain}</span>
                  </div>
                  <div>
                    <span className="text-[#545b64] block text-[12px]">Network border group</span>
                    <span className="text-[#16191f]">{selectedEip.networkBorderGroup || "us-east-1"}</span>
                  </div>
                  <div>
                    <span className="text-[#545b64] block text-[12px]">Amazon Resource Name (ARN)</span>
                    <span className="font-mono text-[12px] text-[#545b64] break-all">
                      {selectedEip.arn || `arn:aws:ec2:us-east-1:000000000000:elastic-ip/${selectedEip.allocationId}`}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "tags" && (
              <div className="space-y-4">
                {selectedEip.tags && Object.keys(selectedEip.tags).length > 0 ? (
                  <div className="border border-[#eaeded] rounded-sm overflow-hidden">
                    <table className="w-full text-left text-[13px]">
                      <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] text-[11px] font-semibold uppercase">
                        <tr>
                          <th className="py-2.5 px-4">Key</th>
                          <th className="py-2.5 px-4">Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#eaeded]">
                        {Object.entries(selectedEip.tags).map(([k, v]) => (
                          <tr key={k}>
                            <td className="py-2 px-4 font-mono font-semibold text-[#16191f]">{k}</td>
                            <td className="py-2 px-4 text-[#545b64]">{v}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-6 text-center text-[#545b64] text-[13px]">
                    No tags associated with this Elastic IP.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal 1: Allocate Elastic IP Confirmation */}
      {showAllocateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-sm border border-[#d5dbdb] awsui-shadow w-full max-w-md p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">Allocate Elastic IP address</h3>
            <p className="text-[13px] text-[#545b64]">
              Allocate a static public IPv4 address from Amazon&apos;s pool of IPv4 addresses in the <strong>us-east-1</strong> region.
            </p>
            <div className="bg-[#f8f9fa] border border-[#eaeded] p-3 rounded-sm text-[12px] text-[#16191f] space-y-1">
              <div><strong>Network border group:</strong> us-east-1</div>
              <div><strong>Public IPv4 address pool:</strong> Amazon&apos;s pool of IPv4 addresses</div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowAllocateModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-3.5 border border-[#aab7b8] hover:border-[#16191f] text-[#16191f] text-[13px] font-bold rounded-sm whitespace-nowrap inline-flex items-center justify-center transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAllocateIp}
                disabled={isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-4 bg-[#ec7211] hover:bg-[#eb5f07] text-white text-[13px] font-bold rounded-sm whitespace-nowrap inline-flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
              >
                {isPending ? "Allocating..." : "Allocate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Associate Elastic IP */}
      {showAssociateModal && selectedEip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <form
            onSubmit={handleAssociate}
            className="bg-white rounded-sm border border-[#d5dbdb] awsui-shadow w-full max-w-md p-6 space-y-4"
          >
            <div className="border-b border-[#eaeded] pb-3">
              <h3 className="text-[18px] font-bold text-[#16191f]">Associate Elastic IP address</h3>
              <p className="text-[12px] text-[#545b64] mt-0.5">
                Associate <strong className="font-mono text-[#16191f]">{selectedEip.publicIp}</strong> with a running or stopped EC2 instance.
              </p>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                Instance
              </label>
              {(instances || []).length > 0 ? (
                <select
                  value={targetInstanceId}
                  onChange={(e) => setTargetInstanceId(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] bg-white text-[#16191f]"
                  required
                >
                  {(instances || []).map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.id} ({inst.name || "unnamed"}) - {inst.state}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="e.g. i-00000000000000001"
                  value={targetInstanceId}
                  onChange={(e) => setTargetInstanceId(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] text-[#16191f]"
                  required
                />
              )}
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                Private IP address (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. 172.31.0.4"
                value={privateIpAddress}
                onChange={(e) => setPrivateIpAddress(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] text-[#16191f] font-mono"
              />
              <span className="text-[11px] text-[#545b64]">
                Leave empty to associate with the primary private IPv4 address.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowAssociateModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-3.5 border border-[#aab7b8] hover:border-[#16191f] text-[#16191f] text-[13px] font-bold rounded-sm whitespace-nowrap inline-flex items-center justify-center transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending || !targetInstanceId}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-4 bg-[#ec7211] hover:bg-[#eb5f07] text-white text-[13px] font-bold rounded-sm whitespace-nowrap inline-flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
              >
                {isPending ? "Associating..." : "Associate"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal 3: Disassociate Elastic IP */}
      {showDisassociateModal && selectedEip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-sm border border-[#d5dbdb] awsui-shadow w-full max-w-md p-6">
            <h3 className="text-[18px] font-bold text-[#16191f]">Disassociate Elastic IP address</h3>
            <p className="text-[13px] text-[#545b64] mt-2">
              Are you sure you want to disassociate Elastic IP{" "}
              <strong className="text-[#16191f] font-mono">{selectedEip.publicIp}</strong> from instance{" "}
              <strong className="text-[#16191f] font-mono">{selectedEip.associatedInstanceId}</strong>?
            </p>
            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                onClick={() => setShowDisassociateModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-3.5 border border-[#aab7b8] hover:border-[#16191f] text-[#16191f] text-[13px] font-bold rounded-sm whitespace-nowrap inline-flex items-center justify-center transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDisassociate}
                disabled={isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-4 bg-[#ec7211] hover:bg-[#eb5f07] text-white text-[13px] font-bold rounded-sm whitespace-nowrap inline-flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
              >
                {isPending ? "Disassociating..." : "Disassociate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Release Elastic IP */}
      {showReleaseModal && selectedEip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-sm border border-[#d5dbdb] awsui-shadow w-full max-w-md p-6">
            <h3 className="text-[18px] font-bold text-[#16191f]">Release Elastic IP address</h3>
            <p className="text-[13px] text-[#545b64] mt-2">
              Are you sure you want to release Elastic IP address{" "}
              <strong className="text-[#16191f] font-mono">{selectedEip.publicIp}</strong> (
              {selectedEip.allocationId})?
            </p>
            <p className="text-[12px] text-[#d13212] mt-3">
              Once released, this IP address is returned to Amazon&apos;s pool and you might not be able to re-allocate it.
            </p>
            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                onClick={() => setShowReleaseModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-3.5 border border-[#aab7b8] hover:border-[#16191f] text-[#16191f] text-[13px] font-bold rounded-sm whitespace-nowrap inline-flex items-center justify-center transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleReleaseIp}
                disabled={isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-4 bg-[#d13212] hover:bg-[#b02008] text-white text-[13px] font-bold rounded-sm whitespace-nowrap inline-flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
              >
                {isPending ? "Releasing..." : "Release"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
