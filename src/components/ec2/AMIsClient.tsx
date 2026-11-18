/**
 * src/components/ec2/AMIsClient.tsx – Authentic AWS EC2 AMIs Console.
 * Directly connected to live AWS Emulator with real image discovery, registration, and launch actions.
 * Zero emojis, Cloudscape enterprise styling.
 */

"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  AmiItem,
  fetchLiveAmis,
  registerLiveAmi,
  deregisterLiveAmi,
} from "@/app/ec2/actions";

interface Props {
  initialAmis: AmiItem[];
  isLive: boolean;
}

export default function AMIsClient({ initialAmis, isLive }: Props) {
  const [amis, setAmis] = useState<AmiItem[]>(initialAmis);
  const [selectedId, setSelectedId] = useState<string | null>(initialAmis[0]?.id || null);
  const [scope, setScope] = useState<"self" | "amazon" | "all" | "public">("all");
  const [search, setSearch] = useState("");
  const [activeBottomTab, setActiveBottomTab] = useState<"details" | "storage" | "permissions">("details");

  // Modals
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showDeregisterModal, setShowDeregisterModal] = useState(false);

  // Form State
  const [regName, setRegName] = useState("");
  const [regDesc, setRegDesc] = useState("");
  const [regRootDev, setRegRootDev] = useState("/dev/xvda");
  const [regArch, setRegArch] = useState("x86_64");

  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedAmi = amis.find((a) => a.id === selectedId) || null;

  async function handleScopeChange(newScope: "self" | "amazon" | "all" | "public") {
    setScope(newScope);
    startTransition(async () => {
      const fresh = await fetchLiveAmis(newScope);
      setAmis(fresh.amis);
      if (fresh.amis.length > 0 && (!selectedId || !fresh.amis.some((a) => a.id === selectedId))) {
        setSelectedId(fresh.amis[0].id);
      }
    });
  }

  async function refreshAmis() {
    startTransition(async () => {
      const fresh = await fetchLiveAmis(scope);
      setAmis(fresh.amis);
      setFeedback("Refreshed AMIs from AWS Emulator.");
      setTimeout(() => setFeedback(null), 3000);
    });
  }

  function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!regName.trim()) return;

    startTransition(async () => {
      const res = await registerLiveAmi({
        name: regName.trim(),
        description: regDesc.trim() || undefined,
        rootDeviceName: regRootDev,
        architecture: regArch,
      });

      if (res.success && res.imageId) {
        setShowRegisterModal(false);
        setRegName("");
        setRegDesc("");
        const fresh = await fetchLiveAmis(scope);
        setAmis(fresh.amis);
        setSelectedId(res.imageId);
        setFeedback(`Successfully registered AMI (${res.imageId}).`);
      } else {
        setFeedback(`Registration failed: ${res.error || "Unknown error"}`);
      }
      setTimeout(() => setFeedback(null), 4000);
    });
  }

  function handleDeregister() {
    if (!selectedId) return;
    startTransition(async () => {
      const res = await deregisterLiveAmi(selectedId);
      if (res.success) {
        setShowDeregisterModal(false);
        const fresh = await fetchLiveAmis(scope);
        setAmis(fresh.amis);
        setFeedback(`Deregistered AMI ${selectedId}.`);
      } else {
        setFeedback(`Deregistration failed: ${res.error || "Unknown error"}`);
      }
      setTimeout(() => setFeedback(null), 4000);
    });
  }

  const filtered = amis.filter(
    (a) =>
      a.id.toLowerCase().includes(search.toLowerCase()) ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.description.toLowerCase().includes(search.toLowerCase()) ||
      a.platform.toLowerCase().includes(search.toLowerCase())
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
              {isLive ? "EC2 AMIs Connected (AWS Emulator)" : "Disconnected from AWS Emulator (127.0.0.1:9297)"}
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
              <h2 className="text-[18px] font-bold text-[#16191f]">AMIs</h2>
              <span className="text-[13px] text-[#545b64]">({filtered.length})</span>
            </div>
            <p className="text-[13px] text-[#545b64] mt-0.5">
              An Amazon Machine Image (AMI) provides the information required to launch an instance. You can launch instances from AMIs provided by AWS, our user community, or your own customized images.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 self-start md:self-center">
            <button
              onClick={refreshAmis}
              disabled={isPending}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-3.5 bg-white border border-[#aab7b8] hover:border-[#16191f] text-[#16191f] text-[13px] font-bold rounded-sm whitespace-nowrap inline-flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
            >
              Refresh
            </button>
            <button
              onClick={() => setShowRegisterModal(true)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-3.5 bg-white border border-[#aab7b8] hover:border-[#16191f] text-[#16191f] text-[13px] font-bold rounded-sm whitespace-nowrap inline-flex items-center justify-center transition-colors cursor-pointer"
            >
              Register new AMI
            </button>
            <button
              onClick={() => setShowDeregisterModal(true)}
              disabled={!selectedAmi || selectedAmi.ownerAlias === "amazon"}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-3.5 border border-[#aab7b8] text-[#16191f] text-[13px] font-bold rounded-sm whitespace-nowrap inline-flex items-center justify-center transition-colors hover:border-[#16191f] disabled:border-[#eaeded] disabled:bg-[#f2f3f3] disabled:text-[#aab7b8] disabled:cursor-not-allowed cursor-pointer"
            >
              Deregister AMI
            </button>
            <Link
              href={selectedAmi ? `/ec2/launch?amiId=${selectedAmi.id}` : "/ec2/launch"}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-4 bg-[#ec7211] hover:bg-[#eb5f07] text-white text-[13px] font-bold rounded-sm whitespace-nowrap inline-flex items-center justify-center shadow-sm transition-colors cursor-pointer"
            >
              Launch instance from AMI
            </Link>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-4 bg-[#f8f9fa] border-b border-[#eaeded] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <select
              value={scope}
              onChange={(e) => handleScopeChange(e.target.value as any)}
              className="h-[32px] border border-[#aab7b8] rounded-sm px-3 text-[13px] font-medium bg-white text-[#16191f] focus:outline-none focus:border-[#ec7211]"
            >
              <option value="all">All images (60+)</option>
              <option value="amazon">Amazon images</option>
              <option value="self">Owned by me</option>
              <option value="public">Public images</option>
            </select>

            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Filter AMIs by name, ID, or platform..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-3 pr-8 h-[32px] text-[13px] border border-[#aab7b8] rounded-sm focus:outline-none focus:border-[#ec7211] bg-white text-[#16191f]"
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
          </div>
          <span className="text-[12px] text-[#545b64]">
            {filtered.length} of {amis.length} images
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[220px]">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[#eaeded] bg-[#fafafa] text-[#545b64] text-[12px] font-semibold tracking-wider">
                <th className="py-2.5 px-3 w-10 text-center"></th>
                <th className="py-2.5 px-3">AMI Name</th>
                <th className="py-2.5 px-3">AMI ID</th>
                <th className="py-2.5 px-3">Source</th>
                <th className="py-2.5 px-3">Owner</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Platform</th>
                <th className="py-2.5 px-3">Architecture</th>
                <th className="py-2.5 px-3">Root device</th>
                <th className="py-2.5 px-3">Visibility</th>
                <th className="py-2.5 px-3">Creation date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-[#545b64]">
                    <p className="font-semibold text-[14px]">No AMIs found for this filter</p>
                    <p className="text-[12px] text-[#879596] mt-1">
                      Switch to "All images" or register a new AMI to get started.
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((ami) => {
                  const isSelected = selectedId === ami.id;

                  return (
                    <tr
                      key={ami.id}
                      onClick={() => setSelectedId(ami.id)}
                      className={`border-b border-[#eaeded] cursor-pointer transition-colors ${
                        isSelected ? "bg-[#f1faff]" : "hover:bg-[#f8f9fa]"
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="radio"
                          name="selected_ami"
                          checked={isSelected}
                          onChange={() => setSelectedId(ami.id)}
                          className="accent-[#ec7211]"
                        />
                      </td>
                      <td className="py-2.5 px-3 font-medium text-[#16191f] max-w-[260px] truncate" title={ami.name}>
                        {ami.name}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[#0073bb] font-medium">{ami.id}</td>
                      <td className="py-2.5 px-3 text-[#545b64] capitalize">{ami.ownerAlias || "other"}</td>
                      <td className="py-2.5 px-3 font-mono text-[12px] text-[#545b64]">{ami.owner}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            ami.state === "available"
                              ? "bg-[#e7f4e4] text-[#1d8102]"
                              : "bg-[#fff3e0] text-[#b35900]"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              ami.state === "available" ? "bg-[#1d8102]" : "bg-[#b35900]"
                            }`}
                          />
                          {ami.state}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[#545b64]">{ami.platform}</td>
                      <td className="py-2.5 px-3 font-mono text-[12px]">{ami.architecture}</td>
                      <td className="py-2.5 px-3 uppercase text-[12px]">{ami.rootDeviceType}</td>
                      <td className="py-2.5 px-3">
                        <span className="text-[12px] text-[#545b64]">
                          {ami.isPublic ? "Public" : "Private"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[#545b64]">{ami.creationDate}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Item Drawer */}
      {selectedAmi && (
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
              Details
            </button>
            <button
              onClick={() => setActiveBottomTab("storage")}
              className={`py-2.5 px-4 text-[13px] font-semibold border-b-2 transition-colors ${
                activeBottomTab === "storage"
                  ? "border-[#ec7211] text-[#ec7211]"
                  : "border-transparent text-[#545b64] hover:text-[#16191f]"
              }`}
            >
              Storage / Block devices
            </button>
            <button
              onClick={() => setActiveBottomTab("permissions")}
              className={`py-2.5 px-4 text-[13px] font-semibold border-b-2 transition-colors ${
                activeBottomTab === "permissions"
                  ? "border-[#ec7211] text-[#ec7211]"
                  : "border-transparent text-[#545b64] hover:text-[#16191f]"
              }`}
            >
              Permissions & visibility
            </button>
          </div>

          <div className="p-6">
            {activeBottomTab === "details" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[13px]">
                <div className="space-y-4">
                  <div>
                    <span className="block text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                      AMI ID
                    </span>
                    <span className="font-mono text-[#0073bb] font-medium mt-0.5 block">{selectedAmi.id}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                      AMI Name
                    </span>
                    <span className="font-medium text-[#16191f] mt-0.5 block">{selectedAmi.name}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                      Description
                    </span>
                    <span className="text-[#545b64] mt-0.5 block">{selectedAmi.description}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="block text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                      Platform
                    </span>
                    <span className="text-[#16191f] mt-0.5 block">{selectedAmi.platform}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                      Architecture
                    </span>
                    <span className="font-mono text-[#16191f] mt-0.5 block">{selectedAmi.architecture}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                      Virtualization type
                    </span>
                    <span className="uppercase text-[#16191f] mt-0.5 block">{selectedAmi.virtualizationType}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="block text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                      Owner Account
                    </span>
                    <span className="font-mono text-[#16191f] mt-0.5 block">{selectedAmi.owner}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                      Status
                    </span>
                    <span className="font-medium capitalize text-[#16191f] mt-0.5 block">{selectedAmi.state}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                      Creation date
                    </span>
                    <span className="text-[#16191f] mt-0.5 block">{selectedAmi.creationDate}</span>
                  </div>
                </div>
              </div>
            )}

            {activeBottomTab === "storage" && (
              <div className="space-y-4 text-[13px]">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-[#fafafa] border border-[#eaeded] rounded-sm">
                    <span className="block text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                      Root Device Type
                    </span>
                    <span className="text-[16px] font-bold text-[#16191f] uppercase mt-1 block">
                      {selectedAmi.rootDeviceType}
                    </span>
                  </div>
                  <div className="p-4 bg-[#fafafa] border border-[#eaeded] rounded-sm">
                    <span className="block text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                      Root Device Name
                    </span>
                    <span className="text-[16px] font-bold font-mono text-[#16191f] mt-1 block">
                      {selectedAmi.rootDeviceName}
                    </span>
                  </div>
                  <div className="p-4 bg-[#fafafa] border border-[#eaeded] rounded-sm">
                    <span className="block text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                      Block Device Count
                    </span>
                    <span className="text-[16px] font-bold text-[#16191f] mt-1 block">
                      {selectedAmi.blockDeviceMappings?.length || 1} Device(s)
                    </span>
                  </div>
                </div>

                <div className="border border-[#eaeded] rounded-sm overflow-hidden mt-4">
                  <table className="w-full text-left text-[12px]">
                    <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64]">
                      <tr>
                        <th className="py-2 px-3">Device name</th>
                        <th className="py-2 px-3">Volume size</th>
                        <th className="py-2 px-3">Volume type</th>
                        <th className="py-2 px-3">Delete on termination</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedAmi.blockDeviceMappings || []).map((b, i) => (
                        <tr key={i} className="border-b border-[#eaeded]">
                          <td className="py-2 px-3 font-mono font-medium">{b.deviceName}</td>
                          <td className="py-2 px-3">{b.volumeSize} GiB</td>
                          <td className="py-2 px-3 uppercase">{b.volumeType}</td>
                          <td className="py-2 px-3">{b.deleteOnTermination ? "True" : "False"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeBottomTab === "permissions" && (
              <div className="space-y-3 text-[13px] text-[#545b64]">
                <div className="bg-[#fafafa] border border-[#eaeded] p-4 rounded-sm space-y-2">
                  <div className="font-semibold text-[#16191f]">
                    Visibility:{" "}
                    <span className="font-bold text-[#0073bb]">
                      {selectedAmi.isPublic ? "Public AMI" : "Private AMI"}
                    </span>
                  </div>
                  <p className="text-[12px]">
                    {selectedAmi.isPublic
                      ? "This AMI is globally visible and can be launched by any AWS account."
                      : "This AMI is private and only available to your AWS account."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Register AMI Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-sm border border-[#d5dbdb] shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in duration-150">
            <div className="px-6 py-4 border-b border-[#eaeded] flex items-center justify-between">
              <h3 className="text-[16px] font-bold text-[#16191f]">Register New Custom AMI</h3>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="text-[#545b64] hover:text-[#16191f] text-[18px] font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleRegister} className="p-6 space-y-4 text-[13px]">
              <div>
                <label className="block font-semibold text-[#16191f] mb-1">AMI Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. my-custom-golden-image-v1"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full border border-[#aab7b8] rounded-sm px-3 py-1.5 focus:border-[#ec7211] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#16191f] mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Hardened Linux image with custom runtime dependencies"
                  value={regDesc}
                  onChange={(e) => setRegDesc(e.target.value)}
                  className="w-full border border-[#aab7b8] rounded-sm px-3 py-1.5 focus:border-[#ec7211] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#16191f] mb-1">Root Device Name</label>
                  <input
                    type="text"
                    value={regRootDev}
                    onChange={(e) => setRegRootDev(e.target.value)}
                    className="w-full border border-[#aab7b8] rounded-sm px-3 py-1.5 focus:border-[#ec7211] focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#16191f] mb-1">Architecture</label>
                  <select
                    value={regArch}
                    onChange={(e) => setRegArch(e.target.value)}
                    className="w-full border border-[#aab7b8] rounded-sm px-3 py-1.5 focus:border-[#ec7211] focus:outline-none"
                  >
                    <option value="x86_64">x86_64 (64-bit)</option>
                    <option value="arm64">arm64 (64-bit Arm)</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-[#f8f9fa] border border-[#eaeded] rounded-sm text-[12px] text-[#545b64]">
                Registering an AMI creates a custom image record in the AWS Emulator which can be used to launch new EC2 instances.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#eaeded]">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="h-[32px] px-4 border border-[#aab7b8] text-[#16191f] font-bold rounded-sm hover:border-[#16191f] whitespace-nowrap inline-flex items-center justify-center transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="h-[32px] px-4 bg-[#ec7211] text-white font-bold rounded-sm hover:bg-[#eb5f07] disabled:opacity-50 whitespace-nowrap inline-flex items-center justify-center shadow-sm transition-colors cursor-pointer"
                >
                  {isPending ? "Registering..." : "Register AMI"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deregister Modal */}
      {showDeregisterModal && selectedAmi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-sm border border-[#d5dbdb] shadow-xl w-full max-w-md overflow-hidden animate-in fade-in duration-150">
            <div className="px-6 py-4 border-b border-[#eaeded] flex items-center justify-between">
              <h3 className="text-[16px] font-bold text-[#16191f]">Deregister AMI</h3>
              <button
                onClick={() => setShowDeregisterModal(false)}
                className="text-[#545b64] hover:text-[#16191f] text-[18px] font-bold"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4 text-[13px]">
              <p className="text-[#16191f]">
                Are you sure you want to deregister AMI{" "}
                <span className="font-mono font-bold text-[#0073bb]">{selectedAmi.id}</span> ({selectedAmi.name})?
              </p>
              <p className="text-[#545b64] text-[12px]">
                Once deregistered, you will no longer be able to launch new instances from this AMI. Any instances previously launched from this AMI will continue running uninterrupted.
              </p>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#eaeded]">
                <button
                  onClick={() => setShowDeregisterModal(false)}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="h-[32px] px-4 border border-[#aab7b8] text-[#16191f] font-bold rounded-sm hover:border-[#16191f] whitespace-nowrap inline-flex items-center justify-center transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeregister}
                  disabled={isPending}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="h-[32px] px-4 bg-[#d13212] text-white font-bold rounded-sm hover:bg-[#b0270d] disabled:opacity-50 whitespace-nowrap inline-flex items-center justify-center shadow-sm transition-colors cursor-pointer"
                >
                  {isPending ? "Deregistering..." : "Deregister"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
