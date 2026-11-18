/**
 * src/components/ec2/NetworkInterfacesClient.tsx – AWS Network Interfaces Console Replica.
 * Zero emojis, Cloudscape enterprise styling.
 */

"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  NetworkInterfaceModel,
  createLiveNetworkInterface,
  deleteLiveNetworkInterface,
  attachLiveNetworkInterface,
  detachLiveNetworkInterface,
  fetchLiveNetworkInterfaces,
} from "@/app/ec2/actions";
import { EC2Instance, SecurityGroup } from "@/lib/ec2-data";

interface Props {
  initialInterfaces?: NetworkInterfaceModel[];
  instances?: EC2Instance[];
  securityGroups?: SecurityGroup[];
  isLive?: boolean;
  liveError?: string;
}

export default function NetworkInterfacesClient({
  initialInterfaces = [],
  instances = [],
  securityGroups = [],
  isLive = true,
  liveError,
}: Props) {
  const [interfaces, setInterfaces] = useState<NetworkInterfaceModel[]>(initialInterfaces || []);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialInterfaces && initialInterfaces.length > 0 ? initialInterfaces[0]?.id : null
  );
  const [search, setSearch] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"details" | "securityGroups" | "tags">("details");
  const [isPending, startTransition] = useTransition();

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [showDetachModal, setShowDetachModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Create Form State
  const [createName, setCreateName] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createSubnetId, setCreateSubnetId] = useState("subnet-00000000000000001");
  const [createPrivateIp, setCreatePrivateIp] = useState("");
  const [createSelectedSg, setCreateSelectedSg] = useState<string>(
    securityGroups && securityGroups.length > 0 ? securityGroups[0].id : ""
  );

  // Attach Form State
  const [attachInstanceId, setAttachInstanceId] = useState<string>(
    instances && instances.length > 0 ? instances[0].id : ""
  );
  const [attachDeviceIndex, setAttachDeviceIndex] = useState<number>(1);

  // Detach Form State
  const [detachForce, setDetachForce] = useState(false);

  const selectedEni = (interfaces || []).find((e) => e.id === selectedId) || null;

  const totalCount = (interfaces || []).length;
  const inUseCount = (interfaces || []).filter((e) => (e.status || "").toLowerCase() === "in-use").length;
  const availableCount = (interfaces || []).filter((e) => (e.status || "").toLowerCase() === "available").length;

  function refreshInterfaces() {
    startTransition(async () => {
      const res = await fetchLiveNetworkInterfaces();
      const list = res.interfaces || [];
      setInterfaces(list);
      if (list.length > 0 && (!selectedId || !list.some((e) => e.id === selectedId))) {
        setSelectedId(list[0]?.id || null);
      }
    });
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!createSubnetId.trim()) return;

    startTransition(async () => {
      const res = await createLiveNetworkInterface({
        subnetId: createSubnetId.trim(),
        description: createDescription.trim() || undefined,
        name: createName.trim() || undefined,
        privateIpAddress: createPrivateIp.trim() || undefined,
        groups: createSelectedSg ? [createSelectedSg] : undefined,
      });

      if (res.success && res.interfaceId) {
        setShowCreateModal(false);
        setCreateName("");
        setCreateDescription("");
        setCreatePrivateIp("");
        const fresh = await fetchLiveNetworkInterfaces();
        const list = fresh.interfaces || [];
        setInterfaces(list);
        setSelectedId(res.interfaceId);
        setFeedback(`Created network interface "${res.interfaceId}" successfully.`);
      } else {
        setFeedback(`Failed to create network interface: ${res.error || "Unknown error"}`);
      }
      setTimeout(() => setFeedback(null), 5000);
    });
  }

  function handleAttach(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEni || !attachInstanceId) return;

    startTransition(async () => {
      const res = await attachLiveNetworkInterface({
        networkInterfaceId: selectedEni.id,
        instanceId: attachInstanceId,
        deviceIndex: attachDeviceIndex,
      });

      if (res.success) {
        setShowAttachModal(false);
        const fresh = await fetchLiveNetworkInterfaces();
        setInterfaces(fresh.interfaces || []);
        setFeedback(`Attached ${selectedEni.id} to instance ${attachInstanceId}.`);
      } else {
        setFeedback(`Failed to attach network interface: ${res.error || "Unknown error"}`);
      }
      setTimeout(() => setFeedback(null), 5000);
    });
  }

  function handleDetach(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEni || !selectedEni.attachmentId) return;

    startTransition(async () => {
      const res = await detachLiveNetworkInterface({
        attachmentId: selectedEni.attachmentId!,
        force: detachForce,
      });

      if (res.success) {
        setShowDetachModal(false);
        setDetachForce(false);
        const fresh = await fetchLiveNetworkInterfaces();
        setInterfaces(fresh.interfaces || []);
        setFeedback(`Detached ${selectedEni.id} successfully.`);
      } else {
        setFeedback(`Failed to detach network interface: ${res.error || "Unknown error"}`);
      }
      setTimeout(() => setFeedback(null), 5000);
    });
  }

  function handleDelete() {
    if (!selectedEni) return;
    const targetId = selectedEni.id;

    startTransition(async () => {
      setShowDeleteModal(false);
      const res = await deleteLiveNetworkInterface(targetId);
      if (res.success) {
        const fresh = await fetchLiveNetworkInterfaces();
        const list = fresh.interfaces || [];
        setInterfaces(list);
        setSelectedId(list.length > 0 ? list[0]?.id : null);
        setFeedback(`Deleted network interface "${targetId}" successfully.`);
      } else {
        setFeedback(`Failed to delete network interface: ${res.error || "Unknown error"}`);
      }
      setTimeout(() => setFeedback(null), 5000);
    });
  }

  const filteredEnis = (interfaces || []).filter((eni) => {
    const term = search.toLowerCase();
    return (
      (eni.id || "").toLowerCase().includes(term) ||
      (eni.name || "").toLowerCase().includes(term) ||
      (eni.privateIp || "").toLowerCase().includes(term) ||
      (eni.publicIp || "").toLowerCase().includes(term) ||
      (eni.instanceId || "").toLowerCase().includes(term) ||
      (eni.subnetId || "").toLowerCase().includes(term) ||
      (eni.vpcId || "").toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-4 max-w-[1400px]">
      {/* Live Badge Banner */}
      <div className="flex items-center justify-between bg-white border border-[#d5dbdb] px-4 py-2.5 rounded-sm shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`inline-block w-2.5 h-2.5 rounded-full ${
                isLive ? "bg-[#1d8102]" : "bg-[#ec7211]"
              }`}
            />
            <span className="text-[12px] font-semibold text-[#16191f]">
              {isLive ? "Network Interfaces Connected (AWS Emulator)" : "Mock Data Mode"}
            </span>
          </div>
          <span className="text-[#95a5a6] text-[12px]">|</span>
          <span className="text-[12px] font-mono text-[#545b64]">Region: us-east-1</span>
        </div>
        <span className="text-[11px] text-[#545b64]">AWS Elastic Network Interface (ENI)</span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#d5dbdb] p-4 rounded-sm shadow-xs">
          <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
            Total Network Interfaces
          </div>
          <div className="text-[24px] font-bold text-[#16191f] mt-1">{totalCount}</div>
          <div className="text-[11px] text-[#545b64] mt-0.5">Virtual network cards in VPC</div>
        </div>

        <div className="bg-white border border-[#d5dbdb] p-4 rounded-sm shadow-xs">
          <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
            In-Use Interfaces
          </div>
          <div className="text-[24px] font-bold text-[#1d8102] mt-1">{inUseCount}</div>
          <div className="text-[11px] text-[#545b64] mt-0.5">Attached to running EC2 instances</div>
        </div>

        <div className="bg-white border border-[#d5dbdb] p-4 rounded-sm shadow-xs">
          <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
            Available Interfaces
          </div>
          <div className="text-[24px] font-bold text-[#0073bb] mt-1">{availableCount}</div>
          <div className="text-[11px] text-[#545b64] mt-0.5">Detached and ready for attachment</div>
        </div>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`p-3 rounded-sm border text-[13px] flex items-center justify-between ${
            feedback.includes("Failed") || feedback.includes("failed")
              ? "bg-[#fdf3f1] border-[#d13212] text-[#d13212]"
              : "bg-[#f2f8fd] border-[#0073bb] text-[#0073bb]"
          }`}
        >
          <span>{feedback}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-[12px] font-bold hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-white border border-[#d5dbdb] rounded-sm shadow-xs">
        {/* Header & Actions Toolbar */}
        <div className="p-4 border-b border-[#eaeded] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-[18px] font-bold text-[#16191f]">
              Network Interfaces ({totalCount})
            </h1>
            <p className="text-[12px] text-[#545b64] mt-0.5">
              An Elastic Network Interface (ENI) represents a virtual network interface card in your VPC.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refreshInterfaces}
              disabled={isPending}
              title="Refresh network interfaces"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-3 border border-[#aab7b8] rounded-sm text-[13px] font-bold text-[#16191f] bg-white hover:bg-[#f2f3f3] whitespace-nowrap inline-flex items-center justify-center transition-colors disabled:opacity-50"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`mr-1.5 ${isPending ? "animate-spin" : ""}`}
              >
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
              Refresh
            </button>

            {selectedEni?.status === "available" ? (
              <button
                onClick={() => setShowAttachModal(true)}
                disabled={isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-3 border border-[#aab7b8] rounded-sm text-[13px] font-bold text-[#16191f] bg-white hover:bg-[#f2f3f3] whitespace-nowrap inline-flex items-center justify-center transition-colors"
              >
                Attach
              </button>
            ) : selectedEni?.status === "in-use" && selectedEni?.attachmentId ? (
              <button
                onClick={() => setShowDetachModal(true)}
                disabled={isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-3 border border-[#aab7b8] rounded-sm text-[13px] font-bold text-[#16191f] bg-white hover:bg-[#f2f3f3] whitespace-nowrap inline-flex items-center justify-center transition-colors"
              >
                Detach
              </button>
            ) : null}

            <button
              onClick={() => setShowDeleteModal(true)}
              disabled={!selectedEni || isPending || selectedEni.status === "in-use"}
              title={selectedEni?.status === "in-use" ? "Detach the interface before deleting" : "Delete network interface"}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className={`h-[32px] px-3 border rounded-sm text-[13px] font-bold whitespace-nowrap inline-flex items-center justify-center transition-colors ${
                selectedEni && selectedEni.status !== "in-use"
                  ? "border-[#d5dbdb] text-[#d13212] hover:bg-[#fdf3f1] bg-white"
                  : "border-[#eaeded] text-[#aab7b8] cursor-not-allowed bg-white"
              }`}
            >
              Delete
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-4 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] whitespace-nowrap inline-flex items-center justify-center transition-colors shadow-xs"
            >
              Create network interface
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="p-3 border-b border-[#eaeded] bg-[#fafafa]">
          <div className="relative max-w-[450px]">
            <input
              type="text"
              placeholder="Filter network interfaces by ID, IP, instance, subnet..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] bg-white text-[#16191f] focus:outline-hidden focus:border-[#0073bb]"
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
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] text-[11px] font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3 w-10 text-center"></th>
                <th className="py-2.5 px-4">Network interface ID</th>
                <th className="py-2.5 px-3">Name</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Primary private IPv4</th>
                <th className="py-2.5 px-3">Public IPv4</th>
                <th className="py-2.5 px-3">Instance ID</th>
                <th className="py-2.5 px-3">Device index</th>
                <th className="py-2.5 px-3">Subnet ID</th>
                <th className="py-2.5 px-3">VPC ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded] text-[#16191f]">
              {filteredEnis.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-[#545b64]">
                    No network interfaces found in region us-east-1.
                  </td>
                </tr>
              ) : (
                filteredEnis.map((eni) => {
                  const isSelected = selectedId === eni.id;
                  const isInUse = (eni.status || "").toLowerCase() === "in-use";
                  return (
                    <tr
                      key={eni.id}
                      onClick={() => setSelectedId(eni.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? "bg-[#f2f8fd]" : "hover:bg-[#fafafa]"
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="radio"
                          name="selectedEni"
                          checked={isSelected}
                          onChange={() => setSelectedId(eni.id)}
                          className="accent-[#0073bb] cursor-pointer"
                        />
                      </td>
                      <td className="py-2.5 px-4 font-mono font-bold text-[#0073bb]">
                        {eni.id}
                      </td>
                      <td className="py-2.5 px-3 text-[#16191f]">
                        {eni.name || "—"}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium ${
                            isInUse
                              ? "bg-[#e6f4ea] text-[#137333]"
                              : "bg-[#e7f4fe] text-[#0073bb]"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isInUse ? "bg-[#137333]" : "bg-[#0073bb]"
                            }`}
                          />
                          {eni.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[12px]">
                        {eni.privateIp}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[12px] text-[#0073bb]">
                        {eni.publicIp || "—"}
                      </td>
                      <td className="py-2.5 px-3">
                        {eni.instanceId ? (
                          <Link
                            href={`/ec2/instances/${eni.instanceId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-mono text-[#0073bb] hover:underline"
                          >
                            {eni.instanceId}
                          </Link>
                        ) : (
                          <span className="text-[#545b64]">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[12px] text-[#545b64]">
                        {eni.deviceIndex ?? "—"}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[12px] text-[#545b64]">
                        {eni.subnetId}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[12px] text-[#0073bb]">
                        {eni.vpcId}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cloudscape Bottom Drawer for Details, Security Groups, and Tags */}
      {selectedEni && (
        <div className="bg-white border border-[#d5dbdb] rounded-sm shadow-xs mt-4">
          <div className="border-b border-[#eaeded] flex items-center px-4">
            <button
              onClick={() => setActiveTab("details")}
              className={`py-3 px-4 text-[13px] font-bold border-b-2 transition-colors ${
                activeTab === "details"
                  ? "border-[#0073bb] text-[#0073bb]"
                  : "border-transparent text-[#545b64] hover:text-[#16191f]"
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab("securityGroups")}
              className={`py-3 px-4 text-[13px] font-bold border-b-2 transition-colors ${
                activeTab === "securityGroups"
                  ? "border-[#0073bb] text-[#0073bb]"
                  : "border-transparent text-[#545b64] hover:text-[#16191f]"
              }`}
            >
              Security groups
            </button>
            <button
              onClick={() => setActiveTab("tags")}
              className={`py-3 px-4 text-[13px] font-bold border-b-2 transition-colors ${
                activeTab === "tags"
                  ? "border-[#0073bb] text-[#0073bb]"
                  : "border-transparent text-[#545b64] hover:text-[#16191f]"
              }`}
            >
              Tags
            </button>
          </div>

          <div className="p-6">
            {activeTab === "details" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-6 gap-x-8 text-[13px]">
                <div>
                  <div className="text-[12px] text-[#545b64] font-medium">Network interface ID</div>
                  <div className="font-mono font-bold text-[#16191f] mt-1">{selectedEni.id}</div>
                </div>

                <div>
                  <div className="text-[12px] text-[#545b64] font-medium">Status</div>
                  <div className="text-[#16191f] mt-1 capitalize font-medium">{selectedEni.status}</div>
                </div>

                <div>
                  <div className="text-[12px] text-[#545b64] font-medium">Primary private IPv4</div>
                  <div className="font-mono text-[#16191f] mt-1">{selectedEni.privateIp}</div>
                </div>

                <div>
                  <div className="text-[12px] text-[#545b64] font-medium">Public IPv4 address</div>
                  <div className="font-mono text-[#0073bb] mt-1">{selectedEni.publicIp || "—"}</div>
                </div>

                <div>
                  <div className="text-[12px] text-[#545b64] font-medium">Attached instance ID</div>
                  <div className="font-mono text-[#16191f] mt-1">
                    {selectedEni.instanceId ? (
                      <Link href={`/ec2/instances/${selectedEni.instanceId}`} className="text-[#0073bb] hover:underline">
                        {selectedEni.instanceId}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-[12px] text-[#545b64] font-medium">Attachment ID</div>
                  <div className="font-mono text-[#545b64] mt-1">{selectedEni.attachmentId || "—"}</div>
                </div>

                <div>
                  <div className="text-[12px] text-[#545b64] font-medium">Device index</div>
                  <div className="font-mono text-[#16191f] mt-1">{selectedEni.deviceIndex ?? "—"}</div>
                </div>

                <div>
                  <div className="text-[12px] text-[#545b64] font-medium">Attachment time</div>
                  <div className="text-[#545b64] mt-1">{selectedEni.attachmentTime || "—"}</div>
                </div>

                <div>
                  <div className="text-[12px] text-[#545b64] font-medium">MAC address</div>
                  <div className="font-mono text-[#16191f] mt-1">{selectedEni.macAddress}</div>
                </div>

                <div>
                  <div className="text-[12px] text-[#545b64] font-medium">Subnet ID</div>
                  <div className="font-mono text-[#0073bb] mt-1">{selectedEni.subnetId}</div>
                </div>

                <div>
                  <div className="text-[12px] text-[#545b64] font-medium">VPC ID</div>
                  <div className="font-mono text-[#0073bb] mt-1">{selectedEni.vpcId}</div>
                </div>

                <div>
                  <div className="text-[12px] text-[#545b64] font-medium">Description</div>
                  <div className="text-[#16191f] mt-1">{selectedEni.description || "—"}</div>
                </div>

                <div className="md:col-span-2 lg:col-span-4">
                  <div className="text-[12px] text-[#545b64] font-medium">ARN</div>
                  <div className="font-mono text-[12px] text-[#16191f] mt-1 break-all">
                    {selectedEni.arn || `arn:aws:ec2:us-east-1:000000000000:network-interface/${selectedEni.id}`}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "securityGroups" && (
              <div>
                <div className="text-[13px] font-bold text-[#16191f] mb-3">
                  Security groups ({selectedEni.securityGroups?.length || 0})
                </div>
                {!selectedEni.securityGroups || selectedEni.securityGroups.length === 0 ? (
                  <div className="text-[13px] text-[#545b64] py-4">No security groups associated.</div>
                ) : (
                  <table className="w-full max-w-lg text-[13px] border border-[#eaeded]">
                    <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] text-[11px] font-semibold uppercase">
                      <tr>
                        <th className="py-2 px-3 text-left">Security group ID</th>
                        <th className="py-2 px-3 text-left">Security group name</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eaeded]">
                      {selectedEni.securityGroups.map((sg) => (
                        <tr key={sg.id}>
                          <td className="py-2 px-3 font-mono font-medium text-[#0073bb]">{sg.id}</td>
                          <td className="py-2 px-3 text-[#16191f]">{sg.name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {activeTab === "tags" && (
              <div>
                <div className="text-[13px] font-bold text-[#16191f] mb-3">
                  Tags ({Object.keys(selectedEni.tags || {}).length})
                </div>
                {Object.keys(selectedEni.tags || {}).length === 0 ? (
                  <div className="text-[13px] text-[#545b64] py-4">No tags associated with this network interface.</div>
                ) : (
                  <table className="w-full max-w-lg text-[13px] border border-[#eaeded]">
                    <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] text-[11px] font-semibold uppercase">
                      <tr>
                        <th className="py-2 px-3 text-left">Key</th>
                        <th className="py-2 px-3 text-left">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eaeded]">
                      {Object.entries(selectedEni.tags || {}).map(([k, v]) => (
                        <tr key={k}>
                          <td className="py-2 px-3 font-medium text-[#16191f]">{k}</td>
                          <td className="py-2 px-3 text-[#545b64]">{v}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <form
            onSubmit={handleCreate}
            className="bg-white rounded-sm border border-[#d5dbdb] shadow-xl w-full max-w-lg p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#eaeded] pb-3">
              <h3 className="text-[17px] font-bold text-[#16191f]">Create network interface</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-[#545b64] hover:text-[#16191f]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                Name tag (optional)
              </label>
              <input
                type="text"
                placeholder="e.g. secondary-api-nic"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] text-[#16191f] focus:outline-hidden focus:border-[#0073bb]"
              />
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                Subnet ID <span className="text-[#d13212]">*</span>
              </label>
              <input
                type="text"
                required
                value={createSubnetId}
                onChange={(e) => setCreateSubnetId(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm font-mono text-[13px] text-[#16191f] focus:outline-hidden focus:border-[#0073bb]"
              />
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                Private IPv4 address (optional)
              </label>
              <input
                type="text"
                placeholder="Leave blank for auto-assign"
                value={createPrivateIp}
                onChange={(e) => setCreatePrivateIp(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm font-mono text-[13px] text-[#16191f] focus:outline-hidden focus:border-[#0073bb]"
              />
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                Security group
              </label>
              <select
                value={createSelectedSg}
                onChange={(e) => setCreateSelectedSg(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] bg-white text-[#16191f]"
              >
                {securityGroups.length === 0 ? (
                  <option value="">No security groups available</option>
                ) : (
                  securityGroups.map((sg) => (
                    <option key={sg.id} value={sg.id}>
                      {sg.name} ({sg.id})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                Description (optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Primary ENI for analytics worker"
                value={createDescription}
                onChange={(e) => setCreateDescription(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] text-[#16191f] focus:outline-hidden focus:border-[#0073bb]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-4 border border-[#aab7b8] rounded-sm text-[13px] font-bold text-[#16191f] hover:bg-[#f2f3f3] whitespace-nowrap inline-flex items-center justify-center transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-4 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] whitespace-nowrap inline-flex items-center justify-center transition-colors disabled:opacity-50"
              >
                {isPending ? "Creating..." : "Create network interface"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Attach Modal */}
      {showAttachModal && selectedEni && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <form
            onSubmit={handleAttach}
            className="bg-white rounded-sm border border-[#d5dbdb] shadow-xl w-full max-w-lg p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#eaeded] pb-3">
              <h3 className="text-[17px] font-bold text-[#16191f]">Attach network interface</h3>
              <button
                type="button"
                onClick={() => setShowAttachModal(false)}
                className="text-[#545b64] hover:text-[#16191f]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">Network interface</label>
              <div className="font-mono text-[13px] text-[#16191f] bg-[#fafafa] p-2 border border-[#eaeded] rounded-sm">
                {selectedEni.id} ({selectedEni.privateIp})
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                Instance <span className="text-[#d13212]">*</span>
              </label>
              <select
                required
                value={attachInstanceId}
                onChange={(e) => setAttachInstanceId(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] bg-white text-[#16191f]"
              >
                {instances.length === 0 ? (
                  <option value="">No instances available</option>
                ) : (
                  instances.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name ? `${inst.name} (${inst.id})` : inst.id} - {inst.state}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                Device index
              </label>
              <input
                type="number"
                min={1}
                max={15}
                value={attachDeviceIndex}
                onChange={(e) => setAttachDeviceIndex(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] bg-white text-[#16191f]"
              />
              <p className="text-[11px] text-[#545b64] mt-1">
                The device index (e.g. 1 for eth1) determines the order of the interface.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowAttachModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-4 border border-[#aab7b8] rounded-sm text-[13px] font-bold text-[#16191f] hover:bg-[#f2f3f3] whitespace-nowrap inline-flex items-center justify-center transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending || !attachInstanceId}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-4 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] whitespace-nowrap inline-flex items-center justify-center transition-colors disabled:opacity-50"
              >
                {isPending ? "Attaching..." : "Attach"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Detach Modal */}
      {showDetachModal && selectedEni && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <form
            onSubmit={handleDetach}
            className="bg-white rounded-sm border border-[#d5dbdb] shadow-xl w-full max-w-md p-6 space-y-4"
          >
            <h3 className="text-[17px] font-bold text-[#16191f]">Detach network interface</h3>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to detach network interface{" "}
              <strong className="text-[#16191f] font-mono">{selectedEni.id}</strong> from instance{" "}
              <strong className="text-[#16191f] font-mono">{selectedEni.instanceId}</strong>?
            </p>

            <label className="flex items-center gap-2 cursor-pointer text-[13px] text-[#16191f]">
              <input
                type="checkbox"
                checked={detachForce}
                onChange={(e) => setDetachForce(e.target.checked)}
                className="accent-[#0073bb]"
              />
              <span>Force detach</span>
            </label>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowDetachModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-4 border border-[#aab7b8] rounded-sm text-[13px] font-bold text-[#16191f] hover:bg-[#f2f3f3] whitespace-nowrap inline-flex items-center justify-center transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-4 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] whitespace-nowrap inline-flex items-center justify-center transition-colors disabled:opacity-50"
              >
                {isPending ? "Detaching..." : "Detach"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedEni && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-sm border border-[#d5dbdb] shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-[17px] font-bold text-[#16191f]">Delete network interface</h3>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to delete network interface{" "}
              <strong className="text-[#16191f] font-mono">{selectedEni.id}</strong>?
              This action is irreversible and the IP addresses allocated to this interface will be released.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-4 border border-[#aab7b8] rounded-sm text-[13px] font-bold text-[#16191f] hover:bg-[#f2f3f3] whitespace-nowrap inline-flex items-center justify-center transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-4 bg-[#d13212] text-white rounded-sm text-[13px] font-bold hover:bg-[#b02008] whitespace-nowrap inline-flex items-center justify-center transition-colors disabled:opacity-50"
              >
                {isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
