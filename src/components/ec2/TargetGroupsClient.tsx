/**
 * src/components/ec2/TargetGroupsClient.tsx – AWS Target Groups Console Replica.
 * Follows authentic AWS Elastic Load Balancing Target Group creation wizard (2 steps)
 * and interactive target health/registration/deregistration.
 * Zero emojis, Cloudscape enterprise styling.
 */

"use client";

import React, { useState, useEffect, useTransition, useCallback } from "react";
import {
  TargetGroupModel,
  TargetHealthModel,
  AvailableInstanceModel,
  createLiveTargetGroup,
  deleteLiveTargetGroup,
  fetchLiveTargetGroups,
  fetchLiveTargetHealth,
  registerLiveTargets,
  deregisterLiveTargets,
  fetchLiveAvailableInstances,
} from "@/app/ec2/actions";

interface Props {
  initialTargetGroups?: TargetGroupModel[];
  initialAvailableInstances?: AvailableInstanceModel[];
  defaultVpcId?: string;
  isLive?: boolean;
  liveError?: string;
}

export default function TargetGroupsClient({
  initialTargetGroups = [],
  initialAvailableInstances = [],
  defaultVpcId = "vpc-00000000000000001",
  isLive = true,
  liveError,
}: Props) {
  const [targetGroups, setTargetGroups] = useState<TargetGroupModel[]>(initialTargetGroups || []);
  const [availableInstances, setAvailableInstances] = useState<AvailableInstanceModel[]>(
    initialAvailableInstances || []
  );
  const [selectedArn, setSelectedArn] = useState<string | null>(
    initialTargetGroups && initialTargetGroups.length > 0 ? initialTargetGroups[0]?.arn : null
  );
  const [search, setSearch] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"details" | "healthChecks" | "targets">("details");
  const [isPending, startTransition] = useTransition();

  // Targets tab live data for selected TG
  const [targetHealthList, setTargetHealthList] = useState<TargetHealthModel[]>([]);
  const [selectedTargetIds, setSelectedTargetIds] = useState<string[]>([]);
  const [isLoadingHealth, setIsLoadingHealth] = useState(false);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createStep, setCreateStep] = useState<1 | 2>(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // Form State - Step 1
  const [createName, setCreateName] = useState("");
  const [createType, setCreateType] = useState<"instance" | "ip">("instance");
  const [createProtocol, setCreateProtocol] = useState<string>("HTTP");
  const [createPort, setCreatePort] = useState<number>(80);
  const [createPath, setCreatePath] = useState<string>("/");
  const [createVpcId, setCreateVpcId] = useState<string>(defaultVpcId);
  const [showAdvancedHealth, setShowAdvancedHealth] = useState(false);
  const [healthyThreshold, setHealthyThreshold] = useState<number>(5);
  const [unhealthyThreshold, setUnhealthyThreshold] = useState<number>(2);
  const [healthTimeout, setHealthTimeout] = useState<number>(5);
  const [healthInterval, setHealthInterval] = useState<number>(30);

  // Form State - Step 2 (Register targets during creation)
  const [wizardSelectedInstanceIds, setWizardSelectedInstanceIds] = useState<string[]>([]);
  const [wizardTargetPort, setWizardTargetPort] = useState<number>(80);
  const [wizardInstanceSearch, setWizardInstanceSearch] = useState("");
  const [wizardPendingTargets, setWizardPendingTargets] = useState<
    { id: string; port: number; name: string; az: string; ip?: string }[]
  >([]);

  // Register Targets Modal State (for existing Target Group)
  const [regSelectedInstanceIds, setRegSelectedInstanceIds] = useState<string[]>([]);
  const [regTargetPort, setRegTargetPort] = useState<number>(80);
  const [regInstanceSearch, setRegInstanceSearch] = useState("");
  const [regPendingTargets, setRegPendingTargets] = useState<
    { id: string; port: number; name: string; az: string; ip?: string }[]
  >([]);

  const selectedTg = (targetGroups || []).find((tg) => tg.arn === selectedArn) || null;

  const totalCount = (targetGroups || []).length;
  const httpCount = (targetGroups || []).filter(
    (tg) =>
      (tg.protocol || "").toUpperCase() === "HTTP" || (tg.protocol || "").toUpperCase() === "HTTPS"
  ).length;
  const instanceTypeCount = (targetGroups || []).filter(
    (tg) => (tg.targetType || "").toLowerCase() === "instance"
  ).length;

  // Load target health when active tab is targets or selected TG changes
  const loadTargetHealth = useCallback(async (arn: string) => {
    setIsLoadingHealth(true);
    try {
      const res = await fetchLiveTargetHealth(arn);
      if (res.success) {
        setTargetHealthList(res.targets);
      } else {
        setTargetHealthList([]);
      }
    } catch {
      setTargetHealthList([]);
    } finally {
      setIsLoadingHealth(false);
    }
  }, []);

  useEffect(() => {
    if (selectedArn && activeTab === "targets") {
      loadTargetHealth(selectedArn);
      setSelectedTargetIds([]);
    }
  }, [selectedArn, activeTab, loadTargetHealth]);

  function refreshTargetGroups() {
    startTransition(async () => {
      const res = await fetchLiveTargetGroups();
      const list = res.targetGroups || [];
      setTargetGroups(list);
      if (list.length > 0 && (!selectedArn || !list.some((tg) => tg.arn === selectedArn))) {
        setSelectedArn(list[0]?.arn || null);
      }
      if (selectedArn && activeTab === "targets") {
        await loadTargetHealth(selectedArn);
      }
    });
  }

  function resetCreateWizard() {
    setCreateStep(1);
    setCreateName("");
    setCreateType("instance");
    setCreateProtocol("HTTP");
    setCreatePort(80);
    setCreatePath("/");
    setCreateVpcId(defaultVpcId);
    setShowAdvancedHealth(false);
    setWizardSelectedInstanceIds([]);
    setWizardTargetPort(80);
    setWizardInstanceSearch("");
    setWizardPendingTargets([]);
  }

  function openCreateModal() {
    resetCreateWizard();
    setShowCreateModal(true);
    // Refresh available instances
    fetchLiveAvailableInstances()
      .then((insts) => setAvailableInstances(insts))
      .catch(() => {});
  }

  function handleStep1Next(e: React.FormEvent) {
    e.preventDefault();
    if (!createName.trim()) return;
    setWizardTargetPort(createPort);
    setCreateStep(2);
  }

  function handleWizardIncludePending() {
    if (wizardSelectedInstanceIds.length === 0) return;
    const newItems: { id: string; port: number; name: string; az: string; ip?: string }[] = [];

    for (const id of wizardSelectedInstanceIds) {
      if (!wizardPendingTargets.some((p) => p.id === id && p.port === wizardTargetPort)) {
        const inst = availableInstances.find((i) => i.id === id);
        newItems.push({
          id,
          port: wizardTargetPort,
          name: inst?.name || id,
          az: inst?.availabilityZone || "us-east-1a",
          ip: inst?.privateIp || "",
        });
      }
    }

    setWizardPendingTargets((prev) => [...prev, ...newItems]);
    setWizardSelectedInstanceIds([]);
  }

  function handleWizardRemovePending(id: string, port: number) {
    setWizardPendingTargets((prev) => prev.filter((p) => !(p.id === id && p.port === port)));
  }

  function handleFinalCreate() {
    if (!createName.trim()) return;

    startTransition(async () => {
      const res = await createLiveTargetGroup({
        name: createName.trim(),
        targetType: createType,
        protocol: createProtocol,
        port: createPort,
        vpcId: createVpcId || defaultVpcId,
        healthCheckPath: createPath.trim() || "/",
        initialTargets: wizardPendingTargets.map((t) => ({
          id: t.id,
          port: t.port,
          availabilityZone: t.az,
        })),
      });

      if (res.success && res.targetGroupArn) {
        setShowCreateModal(false);
        resetCreateWizard();
        const fresh = await fetchLiveTargetGroups();
        const list = fresh.targetGroups || [];
        setTargetGroups(list);
        setSelectedArn(res.targetGroupArn);
        setFeedback(
          `Target group "${createName.trim()}" created successfully with ${
            wizardPendingTargets.length
          } registered target(s).`
        );
      } else {
        setFeedback(`Failed to create target group: ${res.error || "Unknown error"}`);
      }
      setTimeout(() => setFeedback(null), 5000);
    });
  }

  function handleDelete() {
    if (!selectedTg) return;
    const targetArn = selectedTg.arn;
    const targetName = selectedTg.name;

    startTransition(async () => {
      setShowDeleteModal(false);
      const res = await deleteLiveTargetGroup(targetArn);
      if (res.success) {
        const fresh = await fetchLiveTargetGroups();
        const list = fresh.targetGroups || [];
        setTargetGroups(list);
        setSelectedArn(list.length > 0 ? list[0]?.arn : null);
        setFeedback(`Deleted target group "${targetName}" successfully.`);
      } else {
        setFeedback(`Failed to delete target group: ${res.error || "Unknown error"}`);
      }
      setTimeout(() => setFeedback(null), 5000);
    });
  }

  // Register targets to existing TG
  function openRegisterModal() {
    if (!selectedTg) return;
    setRegSelectedInstanceIds([]);
    setRegTargetPort(selectedTg.port || 80);
    setRegInstanceSearch("");
    setRegPendingTargets([]);
    setShowRegisterModal(true);
    fetchLiveAvailableInstances()
      .then((insts) => setAvailableInstances(insts))
      .catch(() => {});
  }

  function handleRegIncludePending() {
    if (regSelectedInstanceIds.length === 0) return;
    const newItems: { id: string; port: number; name: string; az: string; ip?: string }[] = [];

    for (const id of regSelectedInstanceIds) {
      if (!regPendingTargets.some((p) => p.id === id && p.port === regTargetPort)) {
        const inst = availableInstances.find((i) => i.id === id);
        newItems.push({
          id,
          port: regTargetPort,
          name: inst?.name || id,
          az: inst?.availabilityZone || "us-east-1a",
          ip: inst?.privateIp || "",
        });
      }
    }

    setRegPendingTargets((prev) => [...prev, ...newItems]);
    setRegSelectedInstanceIds([]);
  }

  function handleRegRemovePending(id: string, port: number) {
    setRegPendingTargets((prev) => prev.filter((p) => !(p.id === id && p.port === port)));
  }

  function handleExecuteRegister() {
    if (!selectedTg || regPendingTargets.length === 0) return;

    startTransition(async () => {
      const res = await registerLiveTargets(
        selectedTg.arn,
        regPendingTargets.map((t) => ({
          id: t.id,
          port: t.port,
          availabilityZone: t.az,
        }))
      );

      if (res.success) {
        setShowRegisterModal(false);
        setRegPendingTargets([]);
        setRegSelectedInstanceIds([]);
        await loadTargetHealth(selectedTg.arn);
        setFeedback(
          `Registered ${regPendingTargets.length} target(s) to "${selectedTg.name}" successfully.`
        );
      } else {
        setFeedback(`Failed to register targets: ${res.error || "Unknown error"}`);
      }
      setTimeout(() => setFeedback(null), 5000);
    });
  }

  function handleDeregisterSelected() {
    if (!selectedTg || selectedTargetIds.length === 0) return;

    startTransition(async () => {
      const targetsToDeregister = targetHealthList
        .filter((t) => selectedTargetIds.includes(t.id))
        .map((t) => ({ id: t.id, port: t.port }));

      const res = await deregisterLiveTargets(selectedTg.arn, targetsToDeregister);
      if (res.success) {
        setSelectedTargetIds([]);
        await loadTargetHealth(selectedTg.arn);
        setFeedback(`Deregistered ${targetsToDeregister.length} target(s) successfully.`);
      } else {
        setFeedback(`Failed to deregister targets: ${res.error || "Unknown error"}`);
      }
      setTimeout(() => setFeedback(null), 5000);
    });
  }

  const filtered = (targetGroups || []).filter((tg) => {
    const term = search.toLowerCase();
    return (
      (tg.name || "").toLowerCase().includes(term) ||
      (tg.targetType || "").toLowerCase().includes(term) ||
      (tg.protocol || "").toLowerCase().includes(term) ||
      (tg.vpcId || "").toLowerCase().includes(term)
    );
  });

  const filteredWizardInstances = (availableInstances || []).filter((i) => {
    const term = wizardInstanceSearch.toLowerCase();
    return (
      i.name.toLowerCase().includes(term) ||
      i.id.toLowerCase().includes(term) ||
      (i.privateIp || "").toLowerCase().includes(term)
    );
  });

  const filteredRegInstances = (availableInstances || []).filter((i) => {
    const term = regInstanceSearch.toLowerCase();
    return (
      i.name.toLowerCase().includes(term) ||
      i.id.toLowerCase().includes(term) ||
      (i.privateIp || "").toLowerCase().includes(term)
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
              {isLive
                ? "Target Groups Connected (AWS Emulator)"
                : "Disconnected from AWS Emulator (127.0.0.1:9297)"}
            </span>
          </div>
          <span className="text-[#95a5a6] text-[12px]">|</span>
          <span className="text-[12px] font-mono text-[#545b64]">Region: us-east-1</span>
        </div>
        <span className="text-[11px] text-[#545b64]">AWS Elastic Load Balancing Target Groups</span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#d5dbdb] p-4 rounded-sm shadow-xs">
          <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
            Total Target Groups
          </div>
          <div className="text-[24px] font-bold text-[#16191f] mt-1">{totalCount}</div>
          <div className="text-[11px] text-[#545b64] mt-0.5">Collections of registered backend targets</div>
        </div>

        <div className="bg-white border border-[#d5dbdb] p-4 rounded-sm shadow-xs">
          <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
            HTTP / HTTPS Groups
          </div>
          <div className="text-[24px] font-bold text-[#0073bb] mt-1">{httpCount}</div>
          <div className="text-[11px] text-[#545b64] mt-0.5">Application routing targets</div>
        </div>

        <div className="bg-white border border-[#d5dbdb] p-4 rounded-sm shadow-xs">
          <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
            Instance Targets
          </div>
          <div className="text-[24px] font-bold text-[#1d8102] mt-1">{instanceTypeCount}</div>
          <div className="text-[11px] text-[#545b64] mt-0.5">Targeting EC2 virtual instances</div>
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
              Target Groups ({totalCount})
            </h1>
            <p className="text-[12px] text-[#545b64] mt-0.5">
              Target groups route requests to individual registered targets, such as EC2 instances, using the specified protocol and port.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refreshTargetGroups}
              disabled={isPending}
              title="Refresh target groups"
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
              disabled={!selectedTg || isPending}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className={`h-[32px] px-3 border rounded-sm text-[13px] font-bold whitespace-nowrap inline-flex items-center justify-center transition-colors ${
                selectedTg
                  ? "border-[#d5dbdb] text-[#d13212] hover:bg-[#fdf3f1] bg-white"
                  : "border-[#eaeded] text-[#aab7b8] cursor-not-allowed bg-white"
              }`}
            >
              Delete target group
            </button>

            <button
              onClick={openCreateModal}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-4 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] whitespace-nowrap inline-flex items-center justify-center transition-colors shadow-xs"
            >
              Create target group
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="p-3 border-b border-[#eaeded] bg-[#fafafa]">
          <div className="relative max-w-[450px]">
            <input
              type="text"
              placeholder="Filter target groups by name, protocol, or VPC..."
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
                <th className="py-2.5 px-3">Target type</th>
                <th className="py-2.5 px-3">Protocol</th>
                <th className="py-2.5 px-3">Port</th>
                <th className="py-2.5 px-3">VPC ID</th>
                <th className="py-2.5 px-3">Health check path</th>
                <th className="py-2.5 px-3">Load balancers</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded] text-[#16191f]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-[#545b64]">
                    No target groups found in region us-east-1.
                  </td>
                </tr>
              ) : (
                filtered.map((tg) => {
                  const isSelected = selectedArn === tg.arn;
                  return (
                    <tr
                      key={tg.arn}
                      onClick={() => setSelectedArn(tg.arn)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? "bg-[#f2f8fd]" : "hover:bg-[#fafafa]"
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="radio"
                          name="selectedTg"
                          checked={isSelected}
                          onChange={() => setSelectedArn(tg.arn)}
                          className="accent-[#0073bb] cursor-pointer"
                        />
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-[#0073bb]">
                        {tg.name}
                      </td>
                      <td className="py-2.5 px-3 capitalize">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#f2f3f3] text-[#16191f]">
                          {tg.targetType}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-medium">
                        {tg.protocol}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[12px]">
                        {tg.port}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[12px] text-[#0073bb]">
                        {tg.vpcId}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[12px] text-[#545b64]">
                        {tg.healthCheckPath || "/"}
                      </td>
                      <td className="py-2.5 px-3 text-[#545b64]">
                        {tg.loadBalancerArns?.length ?? 0}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cloudscape Bottom Drawer for Selected Target Group Details */}
      {selectedTg && (
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
              onClick={() => setActiveTab("healthChecks")}
              className={`py-3 px-4 text-[13px] font-bold border-b-2 transition-colors ${
                activeTab === "healthChecks"
                  ? "border-[#0073bb] text-[#0073bb]"
                  : "border-transparent text-[#545b64] hover:text-[#16191f]"
              }`}
            >
              Health checks
            </button>
            <button
              onClick={() => setActiveTab("targets")}
              className={`py-3 px-4 text-[13px] font-bold border-b-2 transition-colors ${
                activeTab === "targets"
                  ? "border-[#0073bb] text-[#0073bb]"
                  : "border-transparent text-[#545b64] hover:text-[#16191f]"
              }`}
            >
              Targets ({targetHealthList.length})
            </button>
          </div>

          <div className="p-6">
            {/* Details Tab */}
            {activeTab === "details" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8 text-[13px]">
                <div>
                  <div className="text-[12px] text-[#545b64] font-medium">Target group name</div>
                  <div className="font-bold text-[#16191f] mt-1">{selectedTg.name}</div>
                </div>

                <div>
                  <div className="text-[12px] text-[#545b64] font-medium">Target type</div>
                  <div className="font-medium text-[#16191f] mt-1 capitalize">{selectedTg.targetType}</div>
                </div>

                <div>
                  <div className="text-[12px] text-[#545b64] font-medium">Protocol : Port</div>
                  <div className="font-mono text-[#16191f] mt-1">{selectedTg.protocol}:{selectedTg.port}</div>
                </div>

                <div>
                  <div className="text-[12px] text-[#545b64] font-medium">VPC ID</div>
                  <div className="font-mono text-[#0073bb] mt-1">{selectedTg.vpcId}</div>
                </div>

                <div>
                  <div className="text-[12px] text-[#545b64] font-medium">Associated load balancers</div>
                  <div className="text-[#16191f] mt-1">{selectedTg.loadBalancerArns?.length || 0}</div>
                </div>

                <div className="md:col-span-2 lg:col-span-3">
                  <div className="text-[12px] text-[#545b64] font-medium">ARN</div>
                  <div className="font-mono text-[12px] text-[#16191f] mt-1 break-all">
                    {selectedTg.arn}
                  </div>
                </div>
              </div>
            )}

            {/* Health checks Tab */}
            {activeTab === "healthChecks" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8 text-[13px]">
                <div>
                  <div className="text-[12px] text-[#545b64] font-medium">Health check protocol</div>
                  <div className="font-mono text-[#16191f] mt-1">{selectedTg.healthCheckProtocol}</div>
                </div>

                <div>
                  <div className="text-[12px] text-[#545b64] font-medium">Health check path</div>
                  <div className="font-mono text-[#16191f] mt-1">{selectedTg.healthCheckPath}</div>
                </div>

                <div>
                  <div className="text-[12px] text-[#545b64] font-medium">Health check port</div>
                  <div className="font-mono text-[#16191f] mt-1">{selectedTg.healthCheckPort}</div>
                </div>

                <div>
                  <div className="text-[12px] text-[#545b64] font-medium">Healthy threshold</div>
                  <div className="text-[#16191f] mt-1">{selectedTg.healthyThresholdCount} consecutive successes</div>
                </div>

                <div>
                  <div className="text-[12px] text-[#545b64] font-medium">Unhealthy threshold</div>
                  <div className="text-[#16191f] mt-1">{selectedTg.unhealthyThresholdCount} consecutive failures</div>
                </div>

                <div>
                  <div className="text-[12px] text-[#545b64] font-medium">Timeout / Interval</div>
                  <div className="text-[#16191f] mt-1">{selectedTg.healthCheckTimeoutSeconds}s timeout / {selectedTg.healthCheckIntervalSeconds}s interval</div>
                </div>
              </div>
            )}

            {/* Targets Tab */}
            {activeTab === "targets" && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#eaeded]">
                  <div>
                    <h3 className="text-[14px] font-bold text-[#16191f]">
                      Registered targets ({targetHealthList.length})
                    </h3>
                    <p className="text-[12px] text-[#545b64]">
                      Targets registered to this target group receive traffic forwarded by associated load balancers.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => loadTargetHealth(selectedTg.arn)}
                      disabled={isLoadingHealth || isPending}
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
                        className={`mr-1.5 ${isLoadingHealth ? "animate-spin" : ""}`}
                      >
                        <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                      </svg>
                      Refresh
                    </button>

                    <button
                      onClick={handleDeregisterSelected}
                      disabled={selectedTargetIds.length === 0 || isPending}
                      style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                      className={`h-[32px] px-3 border rounded-sm text-[13px] font-bold whitespace-nowrap inline-flex items-center justify-center transition-colors ${
                        selectedTargetIds.length > 0
                          ? "border-[#d5dbdb] text-[#d13212] hover:bg-[#fdf3f1] bg-white"
                          : "border-[#eaeded] text-[#aab7b8] cursor-not-allowed bg-white"
                      }`}
                    >
                      Deregister ({selectedTargetIds.length})
                    </button>

                    <button
                      onClick={openRegisterModal}
                      style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                      className="h-[32px] px-3 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] whitespace-nowrap inline-flex items-center justify-center transition-colors shadow-xs"
                    >
                      Register targets
                    </button>
                  </div>
                </div>

                {isLoadingHealth ? (
                  <div className="py-8 text-center text-[#545b64] text-[13px]">
                    Loading target health descriptions from AWS Emulator...
                  </div>
                ) : targetHealthList.length === 0 ? (
                  <div className="p-6 bg-[#fafafa] border border-[#eaeded] rounded-sm text-center">
                    <p className="text-[13px] font-bold text-[#16191f]">No active targets registered</p>
                    <p className="text-[12px] text-[#545b64] mt-1 mb-4">
                      No instances or IP addresses are registered with this target group.
                    </p>
                    <button
                      onClick={openRegisterModal}
                      style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                      className="h-[32px] px-4 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] whitespace-nowrap inline-flex items-center justify-center transition-colors shadow-xs"
                    >
                      Register targets
                    </button>
                  </div>
                ) : (
                  <div className="border border-[#eaeded] rounded-sm overflow-x-auto">
                    <table className="w-full text-left border-collapse text-[13px]">
                      <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] text-[11px] font-semibold uppercase tracking-wider">
                        <tr>
                          <th className="py-2.5 px-3 w-10 text-center">
                            <input
                              type="checkbox"
                              checked={
                                targetHealthList.length > 0 &&
                                selectedTargetIds.length === targetHealthList.length
                              }
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedTargetIds(targetHealthList.map((t) => t.id));
                                } else {
                                  setSelectedTargetIds([]);
                                }
                              }}
                              className="accent-[#0073bb] cursor-pointer"
                            />
                          </th>
                          <th className="py-2.5 px-3">Target ID</th>
                          <th className="py-2.5 px-3">Port</th>
                          <th className="py-2.5 px-3">Availability Zone</th>
                          <th className="py-2.5 px-3">Health Status</th>
                          <th className="py-2.5 px-3">Reason</th>
                          <th className="py-2.5 px-3">Health Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#eaeded] text-[#16191f]">
                        {targetHealthList.map((target) => {
                          const isChecked = selectedTargetIds.includes(target.id);
                          const state = (target.state || "").toLowerCase();
                          return (
                            <tr
                              key={`${target.id}-${target.port}`}
                              className={`transition-colors ${
                                isChecked ? "bg-[#f2f8fd]" : "hover:bg-[#fafafa]"
                              }`}
                            >
                              <td className="py-2.5 px-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    setSelectedTargetIds((prev) =>
                                      isChecked
                                        ? prev.filter((id) => id !== target.id)
                                        : [...prev, target.id]
                                    );
                                  }}
                                  className="accent-[#0073bb] cursor-pointer"
                                />
                              </td>
                              <td className="py-2.5 px-3 font-mono font-medium text-[#0073bb]">
                                {target.id}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-[12px]">{target.port}</td>
                              <td className="py-2.5 px-3 text-[#545b64]">
                                {target.availabilityZone || "all"}
                              </td>
                              <td className="py-2.5 px-3">
                                {state === "healthy" ? (
                                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#f2f8fd] text-[#1d8102] border border-[#a2d8a5]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#1d8102]" />
                                    Healthy
                                  </span>
                                ) : state === "initial" ? (
                                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#fbf3d5] text-[#b07b04] border border-[#f0d486]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#ec7211]" />
                                    Initial
                                  </span>
                                ) : state === "unhealthy" ? (
                                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#fdf3f1] text-[#d13212] border border-[#f5b8ad]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#d13212]" />
                                    Unhealthy
                                  </span>
                                ) : state === "draining" ? (
                                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#fff8e5] text-[#8c6b00] border border-[#ffd27f]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#eb5f07]" />
                                    Draining
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#f2f3f3] text-[#545b64] border border-[#d5dbdb]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#879596]" />
                                    Unused
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-[12px] text-[#545b64]">
                                {target.reason || "—"}
                              </td>
                              <td className="py-2.5 px-3 text-[12px] text-[#545b64]">
                                {target.description || (
                                  state === "unused"
                                    ? "Target group is not configured to receive traffic from any load balancers or instance is not in service."
                                    : "Target health evaluated by target group."
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2-Step AWS Replica Create Target Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-sm border border-[#d5dbdb] shadow-xl w-full max-w-3xl my-8 flex flex-col max-h-[90vh]">
            {/* Modal Header & Step Indicator */}
            <div className="p-5 border-b border-[#eaeded] flex-shrink-0">
              <div className="flex items-center justify-between pb-3 border-b border-[#eaeded]">
                <h3 className="text-[17px] font-bold text-[#16191f]">Create target group</h3>
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

              {/* Step Flow Indicator */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div
                  className={`flex items-center gap-3 p-2.5 rounded-sm border transition-colors ${
                    createStep === 1
                      ? "border-[#0073bb] bg-[#f2f8fd]"
                      : "border-[#eaeded] bg-[#fafafa] opacity-80"
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold ${
                      createStep === 1
                        ? "bg-[#0073bb] text-white"
                        : "bg-[#1d8102] text-white"
                    }`}
                  >
                    {createStep === 2 ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      "1"
                    )}
                  </span>
                  <div>
                    <div className="text-[12px] font-bold text-[#16191f]">Step 1: Specify group details</div>
                    <div className="text-[11px] text-[#545b64]">Target type, protocol, port, VPC</div>
                  </div>
                </div>

                <div
                  className={`flex items-center gap-3 p-2.5 rounded-sm border transition-colors ${
                    createStep === 2
                      ? "border-[#0073bb] bg-[#f2f8fd]"
                      : "border-[#eaeded] bg-[#fafafa]"
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold ${
                      createStep === 2
                        ? "bg-[#0073bb] text-white"
                        : "bg-[#eaeded] text-[#545b64]"
                    }`}
                  >
                    2
                  </span>
                  <div>
                    <div className="text-[12px] font-bold text-[#16191f]">Step 2: Register targets</div>
                    <div className="text-[11px] text-[#545b64]">Choose EC2 instances to register</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {createStep === 1 && (
                <form id="step1-form" onSubmit={handleStep1Next} className="space-y-5">
                  {/* Choose Target Type */}
                  <div>
                    <label className="block text-[13px] font-bold text-[#16191f] mb-2">
                      Choose a target type
                    </label>
                    <p className="text-[12px] text-[#545b64] mb-3">
                      Target type specifies how you route traffic to targets. Instances targets are identified by instance ID.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div
                        onClick={() => setCreateType("instance")}
                        className={`p-3.5 border rounded-sm cursor-pointer transition-colors ${
                          createType === "instance"
                            ? "border-[#0073bb] bg-[#f2f8fd]"
                            : "border-[#d5dbdb] bg-white hover:bg-[#fafafa]"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="wizardTargetType"
                            checked={createType === "instance"}
                            onChange={() => setCreateType("instance")}
                            className="accent-[#0073bb]"
                          />
                          <span className="text-[13px] font-bold text-[#16191f]">Instances</span>
                        </div>
                        <p className="text-[11px] text-[#545b64] mt-1.5 ml-5">
                          Targets are specified by instance ID. Traffic is routed to instances using primary private IP addresses.
                        </p>
                      </div>

                      <div
                        onClick={() => setCreateType("ip")}
                        className={`p-3.5 border rounded-sm cursor-pointer transition-colors ${
                          createType === "ip"
                            ? "border-[#0073bb] bg-[#f2f8fd]"
                            : "border-[#d5dbdb] bg-white hover:bg-[#fafafa]"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="wizardTargetType"
                            checked={createType === "ip"}
                            onChange={() => setCreateType("ip")}
                            className="accent-[#0073bb]"
                          />
                          <span className="text-[13px] font-bold text-[#16191f]">IP addresses</span>
                        </div>
                        <p className="text-[11px] text-[#545b64] mt-1.5 ml-5">
                          Targets are specified by IPv4 or IPv6 address. Targets can be in VPC or on-premises.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Target Group Name */}
                  <div>
                    <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                      Target group name <span className="text-[#d13212]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. web-app-tg"
                      value={createName}
                      onChange={(e) => setCreateName(e.target.value)}
                      className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] text-[#16191f] focus:outline-hidden focus:border-[#0073bb]"
                    />
                    <p className="text-[11px] text-[#545b64] mt-1">
                      Target group names must contain up to 32 alphanumeric characters or hyphens.
                    </p>
                  </div>

                  {/* Protocol & Port */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[12px] font-bold text-[#16191f] mb-1">Protocol</label>
                      <select
                        value={createProtocol}
                        onChange={(e) => setCreateProtocol(e.target.value)}
                        className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] bg-white text-[#16191f]"
                      >
                        <option value="HTTP">HTTP</option>
                        <option value="HTTPS">HTTPS</option>
                        <option value="TCP">TCP</option>
                        <option value="TLS">TLS</option>
                        <option value="UDP">UDP</option>
                        <option value="TCP_UDP">TCP_UDP</option>
                        <option value="GENEVE">GENEVE</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[12px] font-bold text-[#16191f] mb-1">Port</label>
                      <input
                        type="number"
                        min={1}
                        max={65535}
                        value={createPort}
                        onChange={(e) => setCreatePort(parseInt(e.target.value, 10) || 80)}
                        className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] text-[#16191f]"
                      />
                    </div>
                  </div>

                  {/* VPC Selection */}
                  <div>
                    <label className="block text-[12px] font-bold text-[#16191f] mb-1">VPC</label>
                    <input
                      type="text"
                      value={createVpcId}
                      onChange={(e) => setCreateVpcId(e.target.value)}
                      placeholder="vpc-00000000000000001"
                      className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm font-mono text-[13px] text-[#16191f]"
                    />
                    <p className="text-[11px] text-[#545b64] mt-1">
                      Targets must belong to the chosen Virtual Private Cloud (VPC).
                    </p>
                  </div>

                  {/* Health Check Settings */}
                  <div className="border-t border-[#eaeded] pt-4">
                    <h4 className="text-[13px] font-bold text-[#16191f] mb-2">Health checks</h4>
                    <div>
                      <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                        Health check path
                      </label>
                      <input
                        type="text"
                        value={createPath}
                        onChange={(e) => setCreatePath(e.target.value)}
                        className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm font-mono text-[13px] text-[#16191f]"
                        placeholder="/"
                      />
                      <p className="text-[11px] text-[#545b64] mt-1">
                        The destination on targets for health check probes (e.g. / or /api/health).
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowAdvancedHealth(!showAdvancedHealth)}
                      className="text-[12px] font-bold text-[#0073bb] hover:underline mt-3 inline-flex items-center gap-1"
                    >
                      {showAdvancedHealth ? "Hide" : "Show"} advanced health check settings
                    </button>

                    {showAdvancedHealth && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 p-3 bg-[#fafafa] border border-[#eaeded] rounded-sm text-[12px]">
                        <div>
                          <label className="block text-[#545b64] font-medium mb-1">Healthy threshold</label>
                          <input
                            type="number"
                            min={2}
                            max={10}
                            value={healthyThreshold}
                            onChange={(e) => setHealthyThreshold(parseInt(e.target.value, 10) || 5)}
                            className="w-full px-2 py-1 border border-[#aab7b8] rounded-sm bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[#545b64] font-medium mb-1">Unhealthy threshold</label>
                          <input
                            type="number"
                            min={2}
                            max={10}
                            value={unhealthyThreshold}
                            onChange={(e) => setUnhealthyThreshold(parseInt(e.target.value, 10) || 2)}
                            className="w-full px-2 py-1 border border-[#aab7b8] rounded-sm bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[#545b64] font-medium mb-1">Timeout (s)</label>
                          <input
                            type="number"
                            min={2}
                            max={60}
                            value={healthTimeout}
                            onChange={(e) => setHealthTimeout(parseInt(e.target.value, 10) || 5)}
                            className="w-full px-2 py-1 border border-[#aab7b8] rounded-sm bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[#545b64] font-medium mb-1">Interval (s)</label>
                          <input
                            type="number"
                            min={5}
                            max={300}
                            value={healthInterval}
                            onChange={(e) => setHealthInterval(parseInt(e.target.value, 10) || 30)}
                            className="w-full px-2 py-1 border border-[#aab7b8] rounded-sm bg-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </form>
              )}

              {createStep === 2 && (
                <div className="space-y-5">
                  <div>
                    <h4 className="text-[14px] font-bold text-[#16191f]">Register targets</h4>
                    <p className="text-[12px] text-[#545b64] mt-0.5">
                      Select instances and specify ports to register as targets for this target group.
                    </p>
                  </div>

                  {/* Available instances section */}
                  <div className="border border-[#eaeded] rounded-sm">
                    <div className="p-3 bg-[#fafafa] border-b border-[#eaeded] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="text-[13px] font-bold text-[#16191f]">
                          Available instances ({availableInstances.length})
                        </div>
                        <div className="text-[11px] text-[#545b64]">
                          Instances running in region us-east-1.
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <label className="text-[12px] font-medium text-[#16191f] whitespace-nowrap">
                            Ports for selected:
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={65535}
                            value={wizardTargetPort}
                            onChange={(e) => setWizardTargetPort(parseInt(e.target.value, 10) || 80)}
                            className="w-20 px-2 py-1 border border-[#aab7b8] rounded-sm text-[12px] font-mono text-[#16191f]"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={handleWizardIncludePending}
                          disabled={wizardSelectedInstanceIds.length === 0}
                          style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                          className={`h-[32px] px-3 border rounded-sm text-[12px] font-bold whitespace-nowrap inline-flex items-center justify-center transition-colors ${
                            wizardSelectedInstanceIds.length > 0
                              ? "border-[#0073bb] bg-[#0073bb] text-white hover:bg-[#005a92]"
                              : "border-[#eaeded] bg-white text-[#aab7b8] cursor-not-allowed"
                          }`}
                        >
                          Include as pending below ({wizardSelectedInstanceIds.length})
                        </button>
                      </div>
                    </div>

                    {/* Filter inside table */}
                    <div className="p-2 border-b border-[#eaeded] bg-white">
                      <input
                        type="text"
                        placeholder="Search available instances by name or ID..."
                        value={wizardInstanceSearch}
                        onChange={(e) => setWizardInstanceSearch(e.target.value)}
                        className="w-full px-2.5 py-1 border border-[#aab7b8] rounded-sm text-[12px] bg-white text-[#16191f]"
                      />
                    </div>

                    <div className="max-h-[220px] overflow-y-auto">
                      <table className="w-full text-left border-collapse text-[12px]">
                        <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] font-semibold sticky top-0">
                          <tr>
                            <th className="py-2 px-3 w-10 text-center">
                              <input
                                type="checkbox"
                                checked={
                                  filteredWizardInstances.length > 0 &&
                                  wizardSelectedInstanceIds.length === filteredWizardInstances.length
                                }
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setWizardSelectedInstanceIds(
                                      filteredWizardInstances.map((i) => i.id)
                                    );
                                  } else {
                                    setWizardSelectedInstanceIds([]);
                                  }
                                }}
                                className="accent-[#0073bb] cursor-pointer"
                              />
                            </th>
                            <th className="py-2 px-3">Name</th>
                            <th className="py-2 px-3">Instance ID</th>
                            <th className="py-2 px-3">State</th>
                            <th className="py-2 px-3">Type</th>
                            <th className="py-2 px-3">Zone</th>
                            <th className="py-2 px-3">Private IP</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#eaeded] text-[#16191f]">
                          {filteredWizardInstances.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="py-6 text-center text-[#545b64]">
                                No EC2 instances found. You can still create the target group and register instances later.
                              </td>
                            </tr>
                          ) : (
                            filteredWizardInstances.map((inst) => {
                              const isChecked = wizardSelectedInstanceIds.includes(inst.id);
                              return (
                                <tr
                                  key={inst.id}
                                  onClick={() => {
                                    setWizardSelectedInstanceIds((prev) =>
                                      isChecked
                                        ? prev.filter((id) => id !== inst.id)
                                        : [...prev, inst.id]
                                    );
                                  }}
                                  className={`cursor-pointer transition-colors ${
                                    isChecked ? "bg-[#f2f8fd]" : "hover:bg-[#fafafa]"
                                  }`}
                                >
                                  <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {
                                        setWizardSelectedInstanceIds((prev) =>
                                          isChecked
                                            ? prev.filter((id) => id !== inst.id)
                                            : [...prev, inst.id]
                                        );
                                      }}
                                      className="accent-[#0073bb] cursor-pointer"
                                    />
                                  </td>
                                  <td className="py-2 px-3 font-semibold text-[#0073bb]">
                                    {inst.name}
                                  </td>
                                  <td className="py-2 px-3 font-mono text-[#545b64]">{inst.id}</td>
                                  <td className="py-2 px-3">
                                    <span
                                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                        inst.state === "running"
                                          ? "bg-[#f2f8fd] text-[#1d8102]"
                                          : "bg-[#f2f3f3] text-[#545b64]"
                                      }`}
                                    >
                                      {inst.state}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3 font-mono text-[#545b64]">{inst.type}</td>
                                  <td className="py-2 px-3 text-[#545b64]">{inst.availabilityZone}</td>
                                  <td className="py-2 px-3 font-mono text-[#545b64]">
                                    {inst.privateIp || "—"}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Review targets (Pending registration) */}
                  <div className="border border-[#eaeded] rounded-sm">
                    <div className="p-3 bg-[#fafafa] border-b border-[#eaeded]">
                      <div className="text-[13px] font-bold text-[#16191f]">
                        Review targets ({wizardPendingTargets.length})
                      </div>
                      <div className="text-[11px] text-[#545b64]">
                        These targets will be registered when you create the target group.
                      </div>
                    </div>

                    {wizardPendingTargets.length === 0 ? (
                      <div className="p-4 text-center text-[#545b64] text-[12px]">
                        No targets pending. Select instances above and click &quot;Include as pending below&quot;.
                      </div>
                    ) : (
                      <div className="max-h-[160px] overflow-y-auto">
                        <table className="w-full text-left border-collapse text-[12px]">
                          <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] font-semibold sticky top-0">
                            <tr>
                              <th className="py-2 px-3">Target ID</th>
                              <th className="py-2 px-3">Name</th>
                              <th className="py-2 px-3">Port</th>
                              <th className="py-2 px-3">Zone</th>
                              <th className="py-2 px-3">IPv4</th>
                              <th className="py-2 px-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#eaeded] text-[#16191f]">
                            {wizardPendingTargets.map((target) => (
                              <tr key={`${target.id}-${target.port}`} className="hover:bg-[#fafafa]">
                                <td className="py-2 px-3 font-mono font-medium text-[#0073bb]">
                                  {target.id}
                                </td>
                                <td className="py-2 px-3 text-[#16191f]">{target.name}</td>
                                <td className="py-2 px-3 font-mono">{target.port}</td>
                                <td className="py-2 px-3 text-[#545b64]">{target.az}</td>
                                <td className="py-2 px-3 font-mono text-[#545b64]">
                                  {target.ip || "—"}
                                </td>
                                <td className="py-2 px-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => handleWizardRemovePending(target.id, target.port)}
                                    className="text-[11px] font-bold text-[#d13212] hover:underline"
                                  >
                                    Remove
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#eaeded] flex items-center justify-between flex-shrink-0 bg-[#fafafa]">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-4 border border-[#aab7b8] rounded-sm text-[13px] font-bold text-[#16191f] bg-white hover:bg-[#f2f3f3] whitespace-nowrap inline-flex items-center justify-center transition-colors"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                {createStep === 2 && (
                  <button
                    type="button"
                    onClick={() => setCreateStep(1)}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                    className="h-[32px] px-4 border border-[#aab7b8] rounded-sm text-[13px] font-bold text-[#16191f] bg-white hover:bg-[#f2f3f3] whitespace-nowrap inline-flex items-center justify-center transition-colors"
                  >
                    Previous
                  </button>
                )}

                {createStep === 1 ? (
                  <button
                    type="submit"
                    form="step1-form"
                    disabled={!createName.trim()}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                    className="h-[32px] px-4 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] whitespace-nowrap inline-flex items-center justify-center transition-colors disabled:opacity-50 shadow-xs"
                  >
                    Next: Register targets
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleFinalCreate}
                    disabled={isPending}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                    className="h-[32px] px-4 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] whitespace-nowrap inline-flex items-center justify-center transition-colors disabled:opacity-50 shadow-xs"
                  >
                    {isPending ? "Creating target group..." : "Create target group"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Register Targets Modal for Existing Target Group */}
      {showRegisterModal && selectedTg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-sm border border-[#d5dbdb] shadow-xl w-full max-w-3xl my-8 flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-[#eaeded] flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-[17px] font-bold text-[#16191f]">
                  Register targets to {selectedTg.name}
                </h3>
                <p className="text-[12px] text-[#545b64] mt-0.5">
                  Select instances and specify port to register as targets.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRegisterModal(false)}
                className="text-[#545b64] hover:text-[#16191f]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Available instances */}
              <div className="border border-[#eaeded] rounded-sm">
                <div className="p-3 bg-[#fafafa] border-b border-[#eaeded] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-[13px] font-bold text-[#16191f]">
                      Available instances ({availableInstances.length})
                    </div>
                    <div className="text-[11px] text-[#545b64]">
                      Select EC2 instances to include in the registration list.
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <label className="text-[12px] font-medium text-[#16191f] whitespace-nowrap">
                        Port:
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={65535}
                        value={regTargetPort}
                        onChange={(e) => setRegTargetPort(parseInt(e.target.value, 10) || 80)}
                        className="w-20 px-2 py-1 border border-[#aab7b8] rounded-sm text-[12px] font-mono text-[#16191f]"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleRegIncludePending}
                      disabled={regSelectedInstanceIds.length === 0}
                      style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                      className={`h-[32px] px-3 border rounded-sm text-[12px] font-bold whitespace-nowrap inline-flex items-center justify-center transition-colors ${
                        regSelectedInstanceIds.length > 0
                          ? "border-[#0073bb] bg-[#0073bb] text-white hover:bg-[#005a92]"
                          : "border-[#eaeded] bg-white text-[#aab7b8] cursor-not-allowed"
                      }`}
                    >
                      Include as pending below ({regSelectedInstanceIds.length})
                    </button>
                  </div>
                </div>

                <div className="p-2 border-b border-[#eaeded] bg-white">
                  <input
                    type="text"
                    placeholder="Search available instances..."
                    value={regInstanceSearch}
                    onChange={(e) => setRegInstanceSearch(e.target.value)}
                    className="w-full px-2.5 py-1 border border-[#aab7b8] rounded-sm text-[12px] bg-white text-[#16191f]"
                  />
                </div>

                <div className="max-h-[220px] overflow-y-auto">
                  <table className="w-full text-left border-collapse text-[12px]">
                    <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] font-semibold sticky top-0">
                      <tr>
                        <th className="py-2 px-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={
                              filteredRegInstances.length > 0 &&
                              regSelectedInstanceIds.length === filteredRegInstances.length
                            }
                            onChange={(e) => {
                              if (e.target.checked) {
                                setRegSelectedInstanceIds(filteredRegInstances.map((i) => i.id));
                              } else {
                                setRegSelectedInstanceIds([]);
                              }
                            }}
                            className="accent-[#0073bb] cursor-pointer"
                          />
                        </th>
                        <th className="py-2 px-3">Name</th>
                        <th className="py-2 px-3">Instance ID</th>
                        <th className="py-2 px-3">State</th>
                        <th className="py-2 px-3">Type</th>
                        <th className="py-2 px-3">Zone</th>
                        <th className="py-2 px-3">Private IP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eaeded] text-[#16191f]">
                      {filteredRegInstances.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-6 text-center text-[#545b64]">
                            No instances available.
                          </td>
                        </tr>
                      ) : (
                        filteredRegInstances.map((inst) => {
                          const isChecked = regSelectedInstanceIds.includes(inst.id);
                          return (
                            <tr
                              key={inst.id}
                              onClick={() => {
                                setRegSelectedInstanceIds((prev) =>
                                  isChecked
                                    ? prev.filter((id) => id !== inst.id)
                                    : [...prev, inst.id]
                                );
                              }}
                              className={`cursor-pointer transition-colors ${
                                isChecked ? "bg-[#f2f8fd]" : "hover:bg-[#fafafa]"
                              }`}
                            >
                              <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    setRegSelectedInstanceIds((prev) =>
                                      isChecked
                                        ? prev.filter((id) => id !== inst.id)
                                        : [...prev, inst.id]
                                    );
                                  }}
                                  className="accent-[#0073bb] cursor-pointer"
                                />
                              </td>
                              <td className="py-2 px-3 font-semibold text-[#0073bb]">
                                {inst.name}
                              </td>
                              <td className="py-2 px-3 font-mono text-[#545b64]">{inst.id}</td>
                              <td className="py-2 px-3">
                                <span
                                  className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                    inst.state === "running"
                                          ? "bg-[#f2f8fd] text-[#1d8102]"
                                          : "bg-[#f2f3f3] text-[#545b64]"
                                  }`}
                                >
                                  {inst.state}
                                </span>
                              </td>
                              <td className="py-2 px-3 font-mono text-[#545b64]">{inst.type}</td>
                              <td className="py-2 px-3 text-[#545b64]">{inst.availabilityZone}</td>
                              <td className="py-2 px-3 font-mono text-[#545b64]">
                                {inst.privateIp || "—"}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Review pending targets */}
              <div className="border border-[#eaeded] rounded-sm">
                <div className="p-3 bg-[#fafafa] border-b border-[#eaeded]">
                  <div className="text-[13px] font-bold text-[#16191f]">
                    Pending targets to register ({regPendingTargets.length})
                  </div>
                  <div className="text-[11px] text-[#545b64]">
                    These targets will be registered to {selectedTg.name}.
                  </div>
                </div>

                {regPendingTargets.length === 0 ? (
                  <div className="p-4 text-center text-[#545b64] text-[12px]">
                    No targets selected. Check instances above and click &quot;Include as pending below&quot;.
                  </div>
                ) : (
                  <div className="max-h-[160px] overflow-y-auto">
                    <table className="w-full text-left border-collapse text-[12px]">
                      <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] font-semibold sticky top-0">
                        <tr>
                          <th className="py-2 px-3">Target ID</th>
                          <th className="py-2 px-3">Name</th>
                          <th className="py-2 px-3">Port</th>
                          <th className="py-2 px-3">Zone</th>
                          <th className="py-2 px-3">IPv4</th>
                          <th className="py-2 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#eaeded] text-[#16191f]">
                        {regPendingTargets.map((target) => (
                          <tr key={`${target.id}-${target.port}`} className="hover:bg-[#fafafa]">
                            <td className="py-2 px-3 font-mono font-medium text-[#0073bb]">
                              {target.id}
                            </td>
                            <td className="py-2 px-3 text-[#16191f]">{target.name}</td>
                            <td className="py-2 px-3 font-mono">{target.port}</td>
                            <td className="py-2 px-3 text-[#545b64]">{target.az}</td>
                            <td className="py-2 px-3 font-mono text-[#545b64]">
                              {target.ip || "—"}
                            </td>
                            <td className="py-2 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleRegRemovePending(target.id, target.port)}
                                className="text-[11px] font-bold text-[#d13212] hover:underline"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-[#eaeded] flex items-center justify-between flex-shrink-0 bg-[#fafafa]">
              <button
                type="button"
                onClick={() => setShowRegisterModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-4 border border-[#aab7b8] rounded-sm text-[13px] font-bold text-[#16191f] bg-white hover:bg-[#f2f3f3] whitespace-nowrap inline-flex items-center justify-center transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteRegister}
                disabled={regPendingTargets.length === 0 || isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-4 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] whitespace-nowrap inline-flex items-center justify-center transition-colors disabled:opacity-50 shadow-xs"
              >
                {isPending ? "Registering..." : `Register targets (${regPendingTargets.length})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedTg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-sm border border-[#d5dbdb] shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-[17px] font-bold text-[#16191f]">Delete target group</h3>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to delete target group <strong className="text-[#16191f]">{selectedTg.name}</strong>?
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
