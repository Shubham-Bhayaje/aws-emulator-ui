/**
 * src/components/ec2/CapacityReservationsClient.tsx – Authentic AWS EC2 Capacity Reservations Management.
 * Connected to live AWS Emulator with real capacity creation, cancellation, and utilization inspection.
 * Zero emojis, Cloudscape enterprise styling.
 */

"use client";

import React, { useState, useTransition } from "react";
import {
  CapacityReservationItem,
  fetchLiveCapacityReservations,
  createLiveCapacityReservation,
  cancelLiveCapacityReservation,
} from "@/app/ec2/actions";

interface Props {
  initialReservations: CapacityReservationItem[];
  isLive: boolean;
}

export default function CapacityReservationsClient({
  initialReservations,
  isLive,
}: Props) {
  const [reservations, setReservations] = useState<CapacityReservationItem[]>(initialReservations);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialReservations[0]?.id || null
  );
  const [search, setSearch] = useState("");
  const [activeBottomTab, setActiveBottomTab] = useState<"details" | "utilization" | "matching">("details");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Form State
  const [instanceType, setInstanceType] = useState("t3.micro");
  const [instancePlatform, setInstancePlatform] = useState("Linux/UNIX");
  const [availabilityZone, setAvailabilityZone] = useState("us-east-1a");
  const [instanceCount, setInstanceCount] = useState(1);
  const [tenancy, setTenancy] = useState("default");
  const [instanceMatchCriteria, setInstanceMatchCriteria] = useState("open");

  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedCR = reservations.find((r) => r.id === selectedId) || null;

  async function refreshReservations() {
    startTransition(async () => {
      const fresh = await fetchLiveCapacityReservations();
      setReservations(fresh.reservations);
      setFeedback("Refreshed Capacity Reservations from AWS Emulator.");
      setTimeout(() => setFeedback(null), 3000);
    });
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await createLiveCapacityReservation({
        instanceType,
        availabilityZone,
        instanceCount,
        instancePlatform,
        tenancy,
      });

      if (res.success && res.reservationId) {
        setShowCreateModal(false);
        const fresh = await fetchLiveCapacityReservations();
        setReservations(fresh.reservations);
        setSelectedId(res.reservationId);
        setFeedback(`Successfully created Capacity Reservation (${res.reservationId}).`);
      } else {
        setFeedback(`Creation failed: ${res.error || "Unknown error"}`);
      }
      setTimeout(() => setFeedback(null), 4000);
    });
  }

  function handleCancel() {
    if (!selectedId) return;
    startTransition(async () => {
      const res = await cancelLiveCapacityReservation(selectedId);
      if (res.success) {
        setShowCancelModal(false);
        const fresh = await fetchLiveCapacityReservations();
        setReservations(fresh.reservations);
        setFeedback(`Capacity Reservation ${selectedId} cancelled.`);
      } else {
        setFeedback(`Failed to cancel reservation: ${res.error || "Unknown error"}`);
      }
      setTimeout(() => setFeedback(null), 4000);
    });
  }

  const filtered = reservations.filter(
    (r) =>
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.instanceType.toLowerCase().includes(search.toLowerCase()) ||
      r.availabilityZone.toLowerCase().includes(search.toLowerCase())
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
              {isLive ? "EC2 Capacity Reservations Connected (AWS Emulator)" : "Disconnected from AWS Emulator (127.0.0.1:9297)"}
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
              <h2 className="text-[18px] font-bold text-[#16191f]">Capacity Reservations</h2>
              <span className="text-[13px] text-[#545b64]">({filtered.length})</span>
            </div>
            <p className="text-[13px] text-[#545b64] mt-0.5">
              On-Demand Capacity Reservations allow you to reserve compute capacity for your Amazon EC2 instances in a specific Availability Zone for any duration.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 self-start md:self-center">
            <button
              onClick={refreshReservations}
              disabled={isPending}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-3.5 bg-white border border-[#aab7b8] hover:border-[#16191f] text-[#16191f] text-[13px] font-bold rounded-sm whitespace-nowrap inline-flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
            >
              Refresh
            </button>
            <button
              onClick={() => setShowCancelModal(true)}
              disabled={!selectedCR || selectedCR.state === "cancelled"}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-3.5 border border-[#aab7b8] text-[#16191f] text-[13px] font-bold rounded-sm whitespace-nowrap inline-flex items-center justify-center transition-colors hover:border-[#16191f] disabled:border-[#eaeded] disabled:bg-[#f2f3f3] disabled:text-[#aab7b8] disabled:cursor-not-allowed cursor-pointer"
            >
              Cancel Reservation
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-4 bg-[#ec7211] hover:bg-[#eb5f07] text-white text-[13px] font-bold rounded-sm whitespace-nowrap inline-flex items-center justify-center shadow-sm transition-colors cursor-pointer"
            >
              Create Capacity Reservation
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-4 bg-[#f8f9fa] border-b border-[#eaeded] flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              placeholder="Filter by reservation ID, instance type, or availability zone..."
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
            {filtered.length} of {reservations.length} reservations
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[220px]">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[#eaeded] bg-[#fafafa] text-[#545b64] text-[12px] font-semibold tracking-wider">
                <th className="py-2.5 px-3 w-10 text-center"></th>
                <th className="py-2.5 px-3">Reservation ID</th>
                <th className="py-2.5 px-3">State</th>
                <th className="py-2.5 px-3">Instance type</th>
                <th className="py-2.5 px-3">Platform</th>
                <th className="py-2.5 px-3">Availability Zone</th>
                <th className="py-2.5 px-3 text-right">Total Count</th>
                <th className="py-2.5 px-3 text-right">Available</th>
                <th className="py-2.5 px-3">Tenancy</th>
                <th className="py-2.5 px-3">Eligibility</th>
                <th className="py-2.5 px-3">End Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-[#545b64]">
                    <p className="font-semibold text-[14px]">No Capacity Reservations found</p>
                    <p className="text-[12px] text-[#879596] mt-1">
                      Create an On-Demand Capacity Reservation to guarantee compute capacity in an Availability Zone.
                    </p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="mt-4 px-3 py-1.5 bg-[#ec7211] text-white text-[12px] font-medium rounded-sm hover:bg-[#eb5f07]"
                    >
                      Create Capacity Reservation
                    </button>
                  </td>
                </tr>
              ) : (
                filtered.map((cr) => {
                  const isSelected = selectedId === cr.id;

                  return (
                    <tr
                      key={cr.id}
                      onClick={() => setSelectedId(cr.id)}
                      className={`border-b border-[#eaeded] cursor-pointer transition-colors ${
                        isSelected ? "bg-[#f1faff]" : "hover:bg-[#f8f9fa]"
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="radio"
                          name="selected_cr"
                          checked={isSelected}
                          onChange={() => setSelectedId(cr.id)}
                          className="accent-[#ec7211]"
                        />
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[#0073bb] font-medium">{cr.id}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            cr.state === "active"
                              ? "bg-[#e7f4e4] text-[#1d8102]"
                              : cr.state === "cancelled"
                              ? "bg-[#eaeded] text-[#545b64]"
                              : "bg-[#fff3e0] text-[#b35900]"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              cr.state === "active"
                                ? "bg-[#1d8102]"
                                : cr.state === "cancelled"
                                ? "bg-[#545b64]"
                                : "bg-[#b35900]"
                            }`}
                          />
                          {cr.state}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-medium">{cr.instanceType}</td>
                      <td className="py-2.5 px-3 text-[#545b64]">{cr.instancePlatform}</td>
                      <td className="py-2.5 px-3 text-[#545b64]">{cr.availabilityZone}</td>
                      <td className="py-2.5 px-3 text-right font-medium">{cr.totalInstanceCount}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium text-[#1d8102]">
                        {cr.availableInstanceCount}
                      </td>
                      <td className="py-2.5 px-3 capitalize text-[12px]">{cr.tenancy}</td>
                      <td className="py-2.5 px-3 capitalize text-[12px]">{cr.instanceMatchCriteria}</td>
                      <td className="py-2.5 px-3 capitalize text-[#545b64]">{cr.endDateType}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Item Drawer */}
      {selectedCR && (
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
              Reservation details
            </button>
            <button
              onClick={() => setActiveBottomTab("utilization")}
              className={`py-2.5 px-4 text-[13px] font-semibold border-b-2 transition-colors ${
                activeBottomTab === "utilization"
                  ? "border-[#ec7211] text-[#ec7211]"
                  : "border-transparent text-[#545b64] hover:text-[#16191f]"
              }`}
            >
              Capacity & utilization
            </button>
            <button
              onClick={() => setActiveBottomTab("matching")}
              className={`py-2.5 px-4 text-[13px] font-semibold border-b-2 transition-colors ${
                activeBottomTab === "matching"
                  ? "border-[#ec7211] text-[#ec7211]"
                  : "border-transparent text-[#545b64] hover:text-[#16191f]"
              }`}
            >
              Matching rules
            </button>
          </div>

          <div className="p-6">
            {activeBottomTab === "details" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[13px]">
                <div className="space-y-4">
                  <div>
                    <span className="block text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                      Reservation ID
                    </span>
                    <span className="font-mono text-[#16191f] mt-0.5 block">{selectedCR.id}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                      State
                    </span>
                    <span className="font-medium text-[#16191f] capitalize mt-0.5 block">
                      {selectedCR.state}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                      Owner ID
                    </span>
                    <span className="font-mono text-[#16191f] mt-0.5 block">{selectedCR.ownerId}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="block text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                      Instance type
                    </span>
                    <span className="font-mono text-[#16191f] mt-0.5 block">{selectedCR.instanceType}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                      Availability Zone
                    </span>
                    <span className="text-[#16191f] mt-0.5 block">{selectedCR.availabilityZone}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                      Platform
                    </span>
                    <span className="text-[#16191f] mt-0.5 block">{selectedCR.instancePlatform}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="block text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                      Tenancy
                    </span>
                    <span className="text-[#16191f] capitalize mt-0.5 block">{selectedCR.tenancy}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                      Eligibility
                    </span>
                    <span className="text-[#16191f] capitalize mt-0.5 block">
                      {selectedCR.instanceMatchCriteria}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                      Start date
                    </span>
                    <span className="text-[#16191f] mt-0.5 block">{selectedCR.startDate}</span>
                  </div>
                </div>
              </div>
            )}

            {activeBottomTab === "utilization" && (
              <div className="space-y-4 text-[13px]">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-[#fafafa] border border-[#eaeded] rounded-sm">
                    <span className="block text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                      Total Reserved Capacity
                    </span>
                    <span className="text-[20px] font-bold text-[#16191f] font-mono mt-1 block">
                      {selectedCR.totalInstanceCount} Instances
                    </span>
                  </div>
                  <div className="p-4 bg-[#fafafa] border border-[#eaeded] rounded-sm">
                    <span className="block text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                      Available Unused
                    </span>
                    <span className="text-[20px] font-bold text-[#1d8102] font-mono mt-1 block">
                      {selectedCR.availableInstanceCount} Instances
                    </span>
                  </div>
                  <div className="p-4 bg-[#fafafa] border border-[#eaeded] rounded-sm">
                    <span className="block text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                      Active In-Use
                    </span>
                    <span className="text-[20px] font-bold text-[#0073bb] font-mono mt-1 block">
                      {selectedCR.totalInstanceCount - selectedCR.availableInstanceCount} Instances
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-[#fafafa] border border-[#eaeded] rounded-sm space-y-2">
                  <div className="flex justify-between text-[12px] text-[#545b64]">
                    <span>Capacity Allocated</span>
                    <span>
                      {(
                        ((selectedCR.totalInstanceCount - selectedCR.availableInstanceCount) /
                          selectedCR.totalInstanceCount) *
                        100
                      ).toFixed(0)}
                      % in use
                    </span>
                  </div>
                  <div className="w-full bg-[#eaeded] h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#0073bb] h-full"
                      style={{
                        width: `${Math.max(
                          0,
                          Math.min(
                            100,
                            ((selectedCR.totalInstanceCount - selectedCR.availableInstanceCount) /
                              selectedCR.totalInstanceCount) *
                              100
                          )
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeBottomTab === "matching" && (
              <div className="space-y-3 text-[13px] text-[#545b64]">
                <p>
                  Instance eligibility determines how instances qualify to consume this reserved capacity:
                </p>
                <div className="bg-[#fafafa] border border-[#eaeded] p-4 rounded-sm space-y-2">
                  <div className="font-semibold text-[#16191f]">
                    Current Setting: <span className="capitalize">{selectedCR.instanceMatchCriteria}</span>
                  </div>
                  {selectedCR.instanceMatchCriteria === "open" ? (
                    <p className="text-[12px]">
                      Any instance launched in <span className="font-medium text-[#16191f]">{selectedCR.availabilityZone}</span> matching instance type <span className="font-medium text-[#16191f]">{selectedCR.instanceType}</span> and platform <span className="font-medium text-[#16191f]">{selectedCR.instancePlatform}</span> will automatically consume this reserved capacity.
                    </p>
                  ) : (
                    <p className="text-[12px]">
                      Only instances launched explicitly targeting Reservation ID <code className="font-semibold text-[#0073bb]">{selectedCR.id}</code> will consume this capacity.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-sm border border-[#d5dbdb] shadow-xl w-full max-w-xl overflow-hidden animate-in fade-in duration-150">
            <div className="px-6 py-4 border-b border-[#eaeded] flex items-center justify-between">
              <h3 className="text-[16px] font-bold text-[#16191f]">Create Capacity Reservation</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-[#545b64] hover:text-[#16191f] text-[18px] font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4 text-[13px]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#16191f] mb-1">Instance Type</label>
                  <select
                    value={instanceType}
                    onChange={(e) => setInstanceType(e.target.value)}
                    className="w-full border border-[#aab7b8] rounded-sm px-3 py-1.5 focus:border-[#ec7211] focus:outline-none font-mono"
                  >
                    <option value="t3.micro">t3.micro</option>
                    <option value="t3.small">t3.small</option>
                    <option value="t3.medium">t3.medium</option>
                    <option value="m5.large">m5.large</option>
                    <option value="c5.xlarge">c5.xlarge</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#16191f] mb-1">Platform</label>
                  <select
                    value={instancePlatform}
                    onChange={(e) => setInstancePlatform(e.target.value)}
                    className="w-full border border-[#aab7b8] rounded-sm px-3 py-1.5 focus:border-[#ec7211] focus:outline-none"
                  >
                    <option value="Linux/UNIX">Linux/UNIX</option>
                    <option value="Red Hat Enterprise Linux">Red Hat Enterprise Linux</option>
                    <option value="SUSE Linux">SUSE Linux</option>
                    <option value="Windows">Windows</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <label className="block font-semibold text-[#16191f] mb-1">Tenancy</label>
                  <select
                    value={tenancy}
                    onChange={(e) => setTenancy(e.target.value)}
                    className="w-full border border-[#aab7b8] rounded-sm px-3 py-1.5 focus:border-[#ec7211] focus:outline-none"
                  >
                    <option value="default">Default</option>
                    <option value="dedicated">Dedicated</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#16191f] mb-1">Instance Eligibility</label>
                  <select
                    value={instanceMatchCriteria}
                    onChange={(e) => setInstanceMatchCriteria(e.target.value)}
                    className="w-full border border-[#aab7b8] rounded-sm px-3 py-1.5 focus:border-[#ec7211] focus:outline-none"
                  >
                    <option value="open">Open (Any matching instance)</option>
                    <option value="targeted">Targeted (Only targeted instances)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#16191f] mb-1">Number of Instances</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={instanceCount}
                    onChange={(e) => setInstanceCount(parseInt(e.target.value, 10) || 1)}
                    className="w-full border border-[#aab7b8] rounded-sm px-3 py-1.5 focus:border-[#ec7211] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-[#f8f9fa] border border-[#eaeded] rounded-sm text-[12px] text-[#545b64]">
                Once active, the reservation guarantees capacity in {availabilityZone}. You are billed the standard On-Demand rate for the reserved capacity whether instances are running or idle.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#eaeded]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
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
                  {isPending ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && selectedCR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-sm border border-[#d5dbdb] shadow-xl w-full max-w-md overflow-hidden animate-in fade-in duration-150">
            <div className="px-6 py-4 border-b border-[#eaeded] flex items-center justify-between">
              <h3 className="text-[16px] font-bold text-[#16191f]">Cancel Capacity Reservation</h3>
              <button
                onClick={() => setShowCancelModal(false)}
                className="text-[#545b64] hover:text-[#16191f] text-[18px] font-bold"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4 text-[13px]">
              <p className="text-[#16191f]">
                Are you sure you want to cancel capacity reservation{" "}
                <span className="font-mono font-bold text-[#0073bb]">{selectedCR.id}</span>?
              </p>
              <p className="text-[#545b64] text-[12px]">
                Upon cancellation, any capacity that was held by this reservation is immediately released. Any currently running instances will continue to run at normal On-Demand rates.
              </p>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#eaeded]">
                <button
                  onClick={() => setShowCancelModal(false)}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="px-4 border border-[#545b64] text-[#16191f] font-bold text-[13px] rounded-sm hover:bg-[#f2f3f3] whitespace-nowrap inline-flex items-center justify-center transition-colors"
                >
                  Keep Reservation
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isPending}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="px-4 bg-[#d13212] text-white font-bold text-[13px] rounded-sm hover:bg-[#b0270d] disabled:opacity-50 whitespace-nowrap inline-flex items-center justify-center transition-colors"
                >
                  {isPending ? "Cancelling..." : "Cancel Reservation"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
