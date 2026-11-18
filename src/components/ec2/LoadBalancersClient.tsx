/**
 * src/components/ec2/LoadBalancersClient.tsx – AWS Elastic Load Balancers Console Replica.
 * Zero emojis, Cloudscape enterprise styling.
 */

"use client";

import React, { useState, useTransition } from "react";
import {
  LoadBalancerModel,
  createLiveLoadBalancer,
  deleteLiveLoadBalancer,
  fetchLiveLoadBalancers,
} from "@/app/ec2/actions";
import { SecurityGroup } from "@/lib/ec2-data";

interface Props {
  initialLoadBalancers?: LoadBalancerModel[];
  securityGroups?: SecurityGroup[];
  subnets?: string[];
  isLive?: boolean;
  liveError?: string;
}

export default function LoadBalancersClient({
  initialLoadBalancers = [],
  securityGroups = [],
  subnets = ["subnet-00000000000000007", "subnet-00000000000000009", "subnet-0000000000000000b"],
  isLive = true,
  liveError,
}: Props) {
  const [loadBalancers, setLoadBalancers] = useState<LoadBalancerModel[]>(initialLoadBalancers || []);
  const [selectedArn, setSelectedArn] = useState<string | null>(
    initialLoadBalancers && initialLoadBalancers.length > 0 ? initialLoadBalancers[0]?.arn : null
  );
  const [search, setSearch] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"details" | "listeners" | "tags">("details");
  const [isPending, startTransition] = useTransition();

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Create Form State
  const [createName, setCreateName] = useState("");
  const [createType, setCreateType] = useState<"application" | "network">("application");
  const [createScheme, setCreateScheme] = useState<"internet-facing" | "internal">("internet-facing");
  const [selectedSubnets, setSelectedSubnets] = useState<string[]>(
    subnets.slice(0, 2)
  );
  const [createSelectedSg, setCreateSelectedSg] = useState<string>(
    securityGroups && securityGroups.length > 0 ? securityGroups[0].id : ""
  );

  const selectedLb = (loadBalancers || []).find((lb) => lb.arn === selectedArn) || null;

  const totalCount = (loadBalancers || []).length;
  const albCount = (loadBalancers || []).filter((lb) => (lb.type || "").toLowerCase() === "application").length;
  const nlbCount = (loadBalancers || []).filter((lb) => (lb.type || "").toLowerCase() === "network").length;
  const activeCount = (loadBalancers || []).filter((lb) => (lb.state || "").toLowerCase() === "active").length;

  function refreshLoadBalancers() {
    startTransition(async () => {
      const res = await fetchLiveLoadBalancers();
      const list = res.loadBalancers || [];
      setLoadBalancers(list);
      if (list.length > 0 && (!selectedArn || !list.some((lb) => lb.arn === selectedArn))) {
        setSelectedArn(list[0]?.arn || null);
      }
    });
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!createName.trim()) return;
    if (selectedSubnets.length < 2) {
      alert("Please select at least 2 subnets across different Availability Zones.");
      return;
    }

    startTransition(async () => {
      const res = await createLiveLoadBalancer({
        name: createName.trim(),
        type: createType,
        scheme: createScheme,
        subnets: selectedSubnets,
        securityGroups: createSelectedSg ? [createSelectedSg] : undefined,
      });

      if (res.success && res.loadBalancerArn) {
        setShowCreateModal(false);
        setCreateName("");
        const fresh = await fetchLiveLoadBalancers();
        const list = fresh.loadBalancers || [];
        setLoadBalancers(list);
        setSelectedArn(res.loadBalancerArn);
        setFeedback(`Created load balancer "${createName.trim()}" successfully.`);
      } else {
        setFeedback(`Failed to create load balancer: ${res.error || "Unknown error"}`);
      }
      setTimeout(() => setFeedback(null), 5000);
    });
  }

  function handleDelete() {
    if (!selectedLb) return;
    const targetArn = selectedLb.arn;
    const targetName = selectedLb.name;

    startTransition(async () => {
      setShowDeleteModal(false);
      const res = await deleteLiveLoadBalancer(targetArn);
      if (res.success) {
        const fresh = await fetchLiveLoadBalancers();
        const list = fresh.loadBalancers || [];
        setLoadBalancers(list);
        setSelectedArn(list.length > 0 ? list[0]?.arn : null);
        setFeedback(`Deleted load balancer "${targetName}" successfully.`);
      } else {
        setFeedback(`Failed to delete load balancer: ${res.error || "Unknown error"}`);
      }
      setTimeout(() => setFeedback(null), 5000);
    });
  }

  function toggleSubnet(sub: string) {
    if (selectedSubnets.includes(sub)) {
      if (selectedSubnets.length > 2) {
        setSelectedSubnets(selectedSubnets.filter((s) => s !== sub));
      }
    } else {
      setSelectedSubnets([...selectedSubnets, sub]);
    }
  }

  const filtered = (loadBalancers || []).filter((lb) => {
    const term = search.toLowerCase();
    return (
      (lb.name || "").toLowerCase().includes(term) ||
      (lb.dnsName || "").toLowerCase().includes(term) ||
      (lb.vpcId || "").toLowerCase().includes(term) ||
      (lb.type || "").toLowerCase().includes(term)
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
              {isLive ? "Elastic Load Balancing (ELBv2) Connected (AWS Emulator)" : "Disconnected from AWS Emulator (127.0.0.1:9297)"}
            </span>
          </div>
          <span className="text-[#95a5a6] text-[12px]">|</span>
          <span className="text-[12px] font-mono text-[#545b64]">Region: us-east-1</span>
        </div>
        <span className="text-[11px] text-[#545b64]">AWS Elastic Load Balancing Service</span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-[#d5dbdb] p-4 rounded-sm shadow-xs">
          <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
            Total Load Balancers
          </div>
          <div className="text-[24px] font-bold text-[#16191f] mt-1">{totalCount}</div>
          <div className="text-[11px] text-[#545b64] mt-0.5">High availability entry points</div>
        </div>

        <div className="bg-white border border-[#d5dbdb] p-4 rounded-sm shadow-xs">
          <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
            Application (ALB)
          </div>
          <div className="text-[24px] font-bold text-[#0073bb] mt-1">{albCount}</div>
          <div className="text-[11px] text-[#545b64] mt-0.5">Layer 7 HTTP / HTTPS routing</div>
        </div>

        <div className="bg-white border border-[#d5dbdb] p-4 rounded-sm shadow-xs">
          <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
            Network (NLB)
          </div>
          <div className="text-[24px] font-bold text-[#545b64] mt-1">{nlbCount}</div>
          <div className="text-[11px] text-[#545b64] mt-0.5">Layer 4 ultra-low latency TCP/UDP</div>
        </div>

        <div className="bg-white border border-[#d5dbdb] p-4 rounded-sm shadow-xs">
          <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
            Active Status
          </div>
          <div className="text-[24px] font-bold text-[#1d8102] mt-1">{activeCount}</div>
          <div className="text-[11px] text-[#545b64] mt-0.5">Serving live client traffic</div>
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
              Load Balancers ({totalCount})
            </h1>
            <p className="text-[12px] text-[#545b64] mt-0.5">
              Elastic Load Balancing automatically distributes your incoming traffic across multiple instances, containers, and IP addresses.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refreshLoadBalancers}
              disabled={isPending}
              title="Refresh load balancers"
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

            <button
              onClick={() => setShowDeleteModal(true)}
              disabled={!selectedLb || isPending}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className={`h-[32px] px-3 border rounded-sm text-[13px] font-bold whitespace-nowrap inline-flex items-center justify-center transition-colors ${
                selectedLb
                  ? "border-[#d5dbdb] text-[#d13212] hover:bg-[#fdf3f1] bg-white"
                  : "border-[#eaeded] text-[#aab7b8] cursor-not-allowed bg-white"
              }`}
            >
              Delete load balancer
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-4 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] whitespace-nowrap inline-flex items-center justify-center transition-colors shadow-xs"
            >
              Create load balancer
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="p-3 border-b border-[#eaeded] bg-[#fafafa]">
          <div className="relative max-w-[450px]">
            <input
              type="text"
              placeholder="Filter load balancers by name, DNS, or VPC..."
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
                <th className="py-2.5 px-4">Name</th>
                <th className="py-2.5 px-3">DNS name</th>
                <th className="py-2.5 px-3">State</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Scheme</th>
                <th className="py-2.5 px-3">VPC ID</th>
                <th className="py-2.5 px-3">Availability Zones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded] text-[#16191f]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-[#545b64]">
                    No load balancers found in region us-east-1.
                  </td>
                </tr>
              ) : (
                filtered.map((lb) => {
                  const isSelected = selectedArn === lb.arn;
                  return (
                    <tr
                      key={lb.arn}
                      onClick={() => setSelectedArn(lb.arn)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? "bg-[#f2f8fd]" : "hover:bg-[#fafafa]"
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="radio"
                          name="selectedLb"
                          checked={isSelected}
                          onChange={() => setSelectedArn(lb.arn)}
                          className="accent-[#0073bb] cursor-pointer"
                        />
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-[#0073bb]">
                        {lb.name}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[12px] text-[#545b64]">
                        {lb.dnsName || "—"}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-[#e6f4ea] text-[#137333]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#137333]" />
                          {lb.state}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 capitalize">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#f2f3f3] text-[#16191f] uppercase">
                          {lb.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 capitalize text-[#545b64]">
                        {lb.scheme}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[12px] text-[#0073bb]">
                        {lb.vpcId}
                      </td>
                      <td className="py-2.5 px-3 text-[12px] text-[#545b64]">
                        {lb.availabilityZones?.join(", ") || "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cloudscape Bottom Drawer for Details */}
      {selectedLb && (
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
              onClick={() => setActiveTab("listeners")}
              className={`py-3 px-4 text-[13px] font-bold border-b-2 transition-colors ${
                activeTab === "listeners"
                  ? "border-[#0073bb] text-[#0073bb]"
                  : "border-transparent text-[#545b64] hover:text-[#16191f]"
              }`}
            >
              Listeners and routing
            </button>
          </div>

          <div className="p-6">
            {activeTab === "details" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8 text-[13px]">
                <div>
                  <div className="text-[12px] text-[#545b64] font-medium">Load balancer name</div>
                  <div className="font-bold text-[#16191f] mt-1">{selectedLb.name}</div>
                </div>

                <div>
                  <div className="text-[12px] text-[#545b64] font-medium">Type</div>
                  <div className="font-medium text-[#16191f] mt-1 capitalize">{selectedLb.type}</div>
                </div>

                <div>
                  <div className="text-[12px] text-[#545b64] font-medium">Scheme</div>
                  <div className="text-[#16191f] mt-1 capitalize">{selectedLb.scheme}</div>
                </div>

                <div>
                  <div className="text-[12px] text-[#545b64] font-medium">State</div>
                  <div className="text-[#137333] font-medium mt-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#137333]" />
                    {selectedLb.state}
                  </div>
                </div>

                <div>
                  <div className="text-[12px] text-[#545b64] font-medium">DNS name</div>
                  <div className="font-mono text-[12px] text-[#0073bb] mt-1 break-all">
                    {selectedLb.dnsName}
                  </div>
                </div>

                <div>
                  <div className="text-[12px] text-[#545b64] font-medium">VPC ID</div>
                  <div className="font-mono text-[#0073bb] mt-1">{selectedLb.vpcId}</div>
                </div>

                <div>
                  <div className="text-[12px] text-[#545b64] font-medium">IP address type</div>
                  <div className="text-[#16191f] mt-1 uppercase font-mono">{selectedLb.ipAddressType}</div>
                </div>

                <div>
                  <div className="text-[12px] text-[#545b64] font-medium">Security groups</div>
                  <div className="text-[#16191f] mt-1 font-mono text-[12px]">
                    {selectedLb.securityGroups?.length > 0 ? selectedLb.securityGroups.join(", ") : "None"}
                  </div>
                </div>

                <div>
                  <div className="text-[12px] text-[#545b64] font-medium">Created time</div>
                  <div className="text-[#545b64] mt-1">{selectedLb.createdTime || "—"}</div>
                </div>

                <div className="md:col-span-2 lg:col-span-3">
                  <div className="text-[12px] text-[#545b64] font-medium">ARN</div>
                  <div className="font-mono text-[12px] text-[#16191f] mt-1 break-all">
                    {selectedLb.arn}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-[13px] font-bold text-[#16191f]">Listeners</div>
                <div className="p-4 bg-[#fafafa] border border-[#eaeded] rounded-sm text-[13px] text-[#545b64]">
                  Default listener HTTP:80 forwarding to registered target groups.
                </div>
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
              <h3 className="text-[17px] font-bold text-[#16191f]">Create load balancer</h3>
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
                Load balancer name <span className="text-[#d13212]">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. app-web-alb"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] text-[#16191f] focus:outline-hidden focus:border-[#0073bb]"
              />
              <p className="text-[11px] text-[#545b64] mt-1">
                Can be up to 32 alphanumeric characters, with hyphens.
              </p>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">Type</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-[13px]">
                  <input
                    type="radio"
                    name="lbType"
                    checked={createType === "application"}
                    onChange={() => setCreateType("application")}
                    className="accent-[#0073bb]"
                  />
                  <span>Application Load Balancer (HTTP/HTTPS)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-[13px]">
                  <input
                    type="radio"
                    name="lbType"
                    checked={createType === "network"}
                    onChange={() => setCreateType("network")}
                    className="accent-[#0073bb]"
                  />
                  <span>Network (TCP/UDP)</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">Scheme</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-[13px]">
                  <input
                    type="radio"
                    name="lbScheme"
                    checked={createScheme === "internet-facing"}
                    onChange={() => setCreateScheme("internet-facing")}
                    className="accent-[#0073bb]"
                  />
                  <span>Internet-facing</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-[13px]">
                  <input
                    type="radio"
                    name="lbScheme"
                    checked={createScheme === "internal"}
                    onChange={() => setCreateScheme("internal")}
                    className="accent-[#0073bb]"
                  />
                  <span>Internal</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                Subnets (select at least 2) <span className="text-[#d13212]">*</span>
              </label>
              <div className="space-y-1.5 border border-[#eaeded] p-2.5 rounded-sm bg-[#fafafa]">
                {subnets.map((sub) => (
                  <label key={sub} className="flex items-center gap-2 cursor-pointer text-[12px]">
                    <input
                      type="checkbox"
                      checked={selectedSubnets.includes(sub)}
                      onChange={() => toggleSubnet(sub)}
                      className="accent-[#0073bb]"
                    />
                    <span className="font-mono text-[#16191f]">{sub}</span>
                  </label>
                ))}
              </div>
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
                {isPending ? "Creating..." : "Create load balancer"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedLb && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-sm border border-[#d5dbdb] shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-[17px] font-bold text-[#16191f]">Delete load balancer</h3>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to delete load balancer <strong className="text-[#16191f]">{selectedLb.name}</strong>?
              Traffic will immediately stop routing through this load balancer.
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
