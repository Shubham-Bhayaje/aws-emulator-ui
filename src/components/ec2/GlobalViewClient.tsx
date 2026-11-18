/**
 * src/components/ec2/GlobalViewClient.tsx – Authentic Amazon EC2 Global View Console.
 * Multi-region resource explorer and aggregate monitor connected to live AWS Emulator.
 * Zero emojis, Cloudscape enterprise styling.
 */

"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  EC2Instance,
  SecurityGroup,
  KeyPair,
  ElasticIp,
} from "@/lib/ec2-data";
import {
  EBSVolume,
  EBSSnapshot,
  NetworkInterfaceModel,
  fetchLiveEC2Instances,
  fetchLiveVolumes,
  fetchLiveSnapshots,
  fetchLiveKeyPairs,
  fetchLiveSecurityGroups,
  fetchLiveElasticIps,
  fetchLiveNetworkInterfaces,
} from "@/app/ec2/actions";

interface Props {
  initialInstances: EC2Instance[];
  initialVolumes: EBSVolume[];
  initialSnapshots: EBSSnapshot[];
  initialKeyPairs: KeyPair[];
  initialSecurityGroups: SecurityGroup[];
  initialElasticIps: ElasticIp[];
  initialNetworkInterfaces: NetworkInterfaceModel[];
  isLive: boolean;
}

export default function GlobalViewClient({
  initialInstances = [],
  initialVolumes = [],
  initialSnapshots = [],
  initialKeyPairs = [],
  initialSecurityGroups = [],
  initialElasticIps = [],
  initialNetworkInterfaces = [],
  isLive = true,
}: Props) {
  const [instances, setInstances] = useState<EC2Instance[]>(initialInstances);
  const [volumes, setVolumes] = useState<EBSVolume[]>(initialVolumes);
  const [snapshots, setSnapshots] = useState<EBSSnapshot[]>(initialSnapshots);
  const [keyPairs, setKeyPairs] = useState<KeyPair[]>(initialKeyPairs);
  const [secGroups, setSecGroups] = useState<SecurityGroup[]>(initialSecurityGroups);
  const [elasticIps, setElasticIps] = useState<ElasticIp[]>(initialElasticIps);
  const [enis, setEnis] = useState<NetworkInterfaceModel[]>(initialNetworkInterfaces);

  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"summary" | "instances" | "volumes" | "security-groups" | "network">("summary");
  const [isPending, startTransition] = useTransition();

  const handleRefresh = () => {
    startTransition(async () => {
      const [iRes, vRes, sRes, kRes, sgRes, eRes, eniRes] = await Promise.all([
        fetchLiveEC2Instances(),
        fetchLiveVolumes(),
        fetchLiveSnapshots("self"),
        fetchLiveKeyPairs(),
        fetchLiveSecurityGroups(),
        fetchLiveElasticIps(),
        fetchLiveNetworkInterfaces(),
      ]);
      setInstances(iRes.instances || []);
      setVolumes(vRes.volumes || []);
      setSnapshots(sRes.snapshots || []);
      setKeyPairs(kRes.keyPairs || []);
      setSecGroups(sgRes.securityGroups || []);
      setElasticIps(eRes.elasticIps || []);
      setEnis(eniRes.interfaces || []);
    });
  };

  // Compile unified resource list
  const allResources = [
    ...instances.map((i) => ({
      id: i.id,
      name: i.name || "-",
      type: "Instance",
      typeColor: "bg-[#e8f0fe] text-[#174ea6]",
      region: "us-east-1",
      zone: i.availabilityZone || "us-east-1a",
      status: i.state,
      statusClass:
        i.state === "running"
          ? "bg-[#def3d6] text-[#0d5916]"
          : i.state === "stopped"
          ? "bg-[#f2f3f3] text-[#545b64]"
          : "bg-[#fff3cd] text-[#856404]",
      details: `${i.instanceType} | ${i.publicIp || i.privateIp || "No IP"}`,
      link: `/ec2/instances`,
    })),
    ...volumes.map((v) => ({
      id: v.id,
      name: v.name || "-",
      type: "Volume",
      typeColor: "bg-[#e6f4ea] text-[#137333]",
      region: "us-east-1",
      zone: v.availabilityZone || "us-east-1a",
      status: v.state,
      statusClass:
        v.state === "in-use"
          ? "bg-[#def3d6] text-[#0d5916]"
          : "bg-[#e8f0fe] text-[#174ea6]",
      details: `${v.sizeGb} GiB ${v.volumeType.toUpperCase()}`,
      link: `/ec2/volumes`,
    })),
    ...snapshots.map((s) => ({
      id: s.id,
      name: s.name || "-",
      type: "Snapshot",
      typeColor: "bg-[#f3e8fd] text-[#7627bb]",
      region: "us-east-1",
      zone: "Regional",
      status: s.state,
      statusClass: "bg-[#def3d6] text-[#0d5916]",
      details: `${s.sizeGb} GiB from ${s.volumeId}`,
      link: `/ec2/snapshots`,
    })),
    ...secGroups.map((sg) => ({
      id: sg.id,
      name: sg.name,
      type: "Security Group",
      typeColor: "bg-[#fce8e6] text-[#c5221f]",
      region: "us-east-1",
      zone: "Regional",
      status: "active",
      statusClass: "bg-[#def3d6] text-[#0d5916]",
      details: `${sg.description || "Security Group"} (${sg.inboundRules?.length || 0} inbound)`,
      link: `/ec2/security-groups`,
    })),
    ...keyPairs.map((kp) => ({
      id: kp.id || kp.name,
      name: kp.name,
      type: "Key Pair",
      typeColor: "bg-[#fef7e0] text-[#b06000]",
      region: "us-east-1",
      zone: "Regional",
      status: "active",
      statusClass: "bg-[#def3d6] text-[#0d5916]",
      details: `${kp.type || "RSA"} key`,
      link: `/ec2/key-pairs`,
    })),
    ...elasticIps.map((eip) => ({
      id: eip.allocationId || eip.publicIp,
      name: eip.tags?.Name || eip.publicIp,
      type: "Elastic IP",
      typeColor: "bg-[#e1f5fe] text-[#0277bd]",
      region: "us-east-1",
      zone: "Regional",
      status: eip.associationId ? "associated" : "unassociated",
      statusClass: eip.associationId
        ? "bg-[#def3d6] text-[#0d5916]"
        : "bg-[#fff3cd] text-[#856404]",
      details: eip.publicIp,
      link: `/ec2/elastic-ips`,
    })),
    ...enis.map((eni) => ({
      id: eni.id,
      name: eni.name || eni.description || "-",
      type: "Network Interface",
      typeColor: "bg-[#f1f3f4] text-[#3c4043]",
      region: "us-east-1",
      zone: eni.subnetId || "us-east-1a",
      status: eni.status,
      statusClass:
        eni.status === "in-use"
          ? "bg-[#def3d6] text-[#0d5916]"
          : "bg-[#f2f3f3] text-[#545b64]",
      details: `${eni.privateIp} (${eni.subnetId})`,
      link: `/ec2/network-interfaces`,
    })),
  ];

  const filteredResources = allResources.filter((r) => {
    const matchesSearch =
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.details.toLowerCase().includes(search.toLowerCase());
    const matchesType = selectedType === "all" || r.type === selectedType;
    return matchesSearch && matchesType;
  });

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
              {isLive ? "Live AWS Emulator Connected" : "Local Mock Mode"} (127.0.0.1:9297)
            </span>
          </div>
          <span className="text-[#95a5a6] text-[12px]">|</span>
          <span className="text-[12px] font-mono text-[#545b64]">Active Region: us-east-1 (N. Virginia)</span>
        </div>
        <span className="text-[11px] text-[#545b64] font-medium">Cross-Region Multi-Service Aggregator</span>
      </div>

      {/* Header and Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#eaeded] pb-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#16191f]">Amazon EC2 Global View</h1>
          <p className="text-[13px] text-[#545b64] mt-0.5">
            Monitor and discover your Amazon EC2 resources across AWS Regions from a single pane of glass.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isPending}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="px-3 border border-[#545b64] rounded-sm text-[#16191f] hover:bg-[#f2f3f3] text-[13px] font-bold whitespace-nowrap inline-flex items-center justify-center transition-colors disabled:opacity-50 gap-1.5"
            title="Refresh resources from live emulator"
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
          <Link
            href="/ec2/instances"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="px-4 bg-[#ec7211] text-white rounded-sm hover:bg-[#eb5f07] text-[13px] font-bold whitespace-nowrap inline-flex items-center justify-center transition-colors"
          >
            Open EC2 console
          </Link>
        </div>
      </div>

      {/* Resource Count KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-white border border-[#d5dbdb] p-3 rounded-sm awsui-shadow">
          <div className="text-[11px] text-[#545b64] font-medium uppercase tracking-wider">Regions</div>
          <div className="text-[22px] font-bold text-[#16191f] mt-1">1</div>
          <div className="text-[11px] text-[#137333] mt-0.5">us-east-1 active</div>
        </div>

        <div className="bg-white border border-[#d5dbdb] p-3 rounded-sm awsui-shadow">
          <div className="text-[11px] text-[#545b64] font-medium uppercase tracking-wider">Instances</div>
          <Link href="/ec2/instances" className="text-[22px] font-bold text-[#0073bb] hover:underline block mt-1">
            {instances.length}
          </Link>
          <div className="text-[11px] text-[#545b64] mt-0.5">
            {instances.filter((i) => i.state === "running").length} running
          </div>
        </div>

        <div className="bg-white border border-[#d5dbdb] p-3 rounded-sm awsui-shadow">
          <div className="text-[11px] text-[#545b64] font-medium uppercase tracking-wider">Volumes</div>
          <Link href="/ec2/volumes" className="text-[22px] font-bold text-[#0073bb] hover:underline block mt-1">
            {volumes.length}
          </Link>
          <div className="text-[11px] text-[#545b64] mt-0.5">
            {volumes.reduce((acc, v) => acc + (v.sizeGb || 0), 0)} GiB total
          </div>
        </div>

        <div className="bg-white border border-[#d5dbdb] p-3 rounded-sm awsui-shadow">
          <div className="text-[11px] text-[#545b64] font-medium uppercase tracking-wider">Snapshots</div>
          <Link href="/ec2/snapshots" className="text-[22px] font-bold text-[#0073bb] hover:underline block mt-1">
            {snapshots.length}
          </Link>
          <div className="text-[11px] text-[#545b64] mt-0.5">EBS point-in-time</div>
        </div>

        <div className="bg-white border border-[#d5dbdb] p-3 rounded-sm awsui-shadow">
          <div className="text-[11px] text-[#545b64] font-medium uppercase tracking-wider">Security Groups</div>
          <Link href="/ec2/security-groups" className="text-[22px] font-bold text-[#0073bb] hover:underline block mt-1">
            {secGroups.length}
          </Link>
          <div className="text-[11px] text-[#545b64] mt-0.5">Firewall rule sets</div>
        </div>

        <div className="bg-white border border-[#d5dbdb] p-3 rounded-sm awsui-shadow">
          <div className="text-[11px] text-[#545b64] font-medium uppercase tracking-wider">Key Pairs</div>
          <Link href="/ec2/key-pairs" className="text-[22px] font-bold text-[#0073bb] hover:underline block mt-1">
            {keyPairs.length}
          </Link>
          <div className="text-[11px] text-[#545b64] mt-0.5">SSH Credentials</div>
        </div>

        <div className="bg-white border border-[#d5dbdb] p-3 rounded-sm awsui-shadow">
          <div className="text-[11px] text-[#545b64] font-medium uppercase tracking-wider">Elastic IPs</div>
          <Link href="/ec2/elastic-ips" className="text-[22px] font-bold text-[#0073bb] hover:underline block mt-1">
            {elasticIps.length}
          </Link>
          <div className="text-[11px] text-[#545b64] mt-0.5">Static public IPv4</div>
        </div>

        <div className="bg-white border border-[#d5dbdb] p-3 rounded-sm awsui-shadow">
          <div className="text-[11px] text-[#545b64] font-medium uppercase tracking-wider">Interfaces</div>
          <Link href="/ec2/network-interfaces" className="text-[22px] font-bold text-[#0073bb] hover:underline block mt-1">
            {enis.length}
          </Link>
          <div className="text-[11px] text-[#545b64] mt-0.5">Elastic ENIs</div>
        </div>
      </div>

      {/* Region Overview Table Card */}
      <div className="bg-white border border-[#d5dbdb] rounded-sm awsui-shadow overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#eaeded] flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-bold text-[#16191f]">AWS Regions Summary</h2>
            <p className="text-[12px] text-[#545b64]">Aggregated counts per enabled AWS Region</p>
          </div>
          <span className="text-[12px] text-[#545b64]">Showing 1 Region</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] text-[11px] font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Region Name</th>
                <th className="py-2.5 px-4">Region Code</th>
                <th className="py-2.5 px-4 text-center">Instances</th>
                <th className="py-2.5 px-4 text-center">VPCs</th>
                <th className="py-2.5 px-4 text-center">Security Groups</th>
                <th className="py-2.5 px-4 text-center">Volumes</th>
                <th className="py-2.5 px-4 text-center">Snapshots</th>
                <th className="py-2.5 px-4 text-center">Key Pairs</th>
                <th className="py-2.5 px-4 text-center">Elastic IPs</th>
                <th className="py-2.5 px-4 text-center">ENIs</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded] text-[#16191f]">
              <tr className="hover:bg-[#f8f9fa]">
                <td className="py-3 px-4 font-semibold text-[#16191f] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#137333]" />
                  US East (N. Virginia)
                </td>
                <td className="py-3 px-4 font-mono text-[12px] text-[#545b64]">us-east-1</td>
                <td className="py-3 px-4 text-center">
                  <Link href="/ec2/instances" className="text-[#0073bb] hover:underline font-semibold">
                    {instances.length}
                  </Link>
                </td>
                <td className="py-3 px-4 text-center font-mono">1</td>
                <td className="py-3 px-4 text-center">
                  <Link href="/ec2/security-groups" className="text-[#0073bb] hover:underline font-semibold">
                    {secGroups.length}
                  </Link>
                </td>
                <td className="py-3 px-4 text-center">
                  <Link href="/ec2/volumes" className="text-[#0073bb] hover:underline font-semibold">
                    {volumes.length}
                  </Link>
                </td>
                <td className="py-3 px-4 text-center">
                  <Link href="/ec2/snapshots" className="text-[#0073bb] hover:underline font-semibold">
                    {snapshots.length}
                  </Link>
                </td>
                <td className="py-3 px-4 text-center">
                  <Link href="/ec2/key-pairs" className="text-[#0073bb] hover:underline font-semibold">
                    {keyPairs.length}
                  </Link>
                </td>
                <td className="py-3 px-4 text-center">
                  <Link href="/ec2/elastic-ips" className="text-[#0073bb] hover:underline font-semibold">
                    {elasticIps.length}
                  </Link>
                </td>
                <td className="py-3 px-4 text-center">
                  <Link href="/ec2/network-interfaces" className="text-[#0073bb] hover:underline font-semibold">
                    {enis.length}
                  </Link>
                </td>
                <td className="py-3 px-4 text-right">
                  <Link
                    href="/ec2/instances"
                    style={{ height: "28px", minHeight: "28px", maxHeight: "28px" }}
                    className="px-2.5 text-[12px] border border-[#545b64] rounded-sm text-[#16191f] hover:bg-[#f2f3f3] font-medium inline-flex items-center"
                  >
                    View in Region
                  </Link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Global Resource Explorer Card */}
      <div className="bg-white border border-[#d5dbdb] rounded-sm awsui-shadow">
        <div className="p-4 border-b border-[#eaeded] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-bold text-[#16191f]">Global Resource Explorer</h2>
            <p className="text-[12px] text-[#545b64]">Discover, filter, and inspect resources across services</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[12px] text-[#545b64]">
              {filteredResources.length} of {allResources.length} resources
            </span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="p-3 border-b border-[#eaeded] bg-[#fafafa] flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <input
              type="text"
              placeholder="Search across all resources by ID, name, or detail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] bg-white focus:outline-none focus:border-[#0073bb]"
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

          <div className="flex items-center gap-2">
            <label className="text-[12px] text-[#545b64] font-medium">Filter by type:</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-2.5 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] bg-white text-[#16191f]"
            >
              <option value="all">All Types ({allResources.length})</option>
              <option value="Instance">Instances ({instances.length})</option>
              <option value="Volume">Volumes ({volumes.length})</option>
              <option value="Snapshot">Snapshots ({snapshots.length})</option>
              <option value="Security Group">Security Groups ({secGroups.length})</option>
              <option value="Key Pair">Key Pairs ({keyPairs.length})</option>
              <option value="Elastic IP">Elastic IPs ({elasticIps.length})</option>
              <option value="Network Interface">Network Interfaces ({enis.length})</option>
            </select>
          </div>
        </div>

        {/* Resource Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] text-[11px] font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Resource ID</th>
                <th className="py-2.5 px-4">Name</th>
                <th className="py-2.5 px-4">Resource Type</th>
                <th className="py-2.5 px-4">Region / Zone</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Configuration & Details</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded] text-[#16191f]">
              {filteredResources.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#545b64]">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#f2f3f3] text-[#545b64] mb-3">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                    </div>
                    <div className="text-[14px] font-semibold text-[#16191f]">No resources found</div>
                    <div className="text-[12px] text-[#545b64] mt-1 max-w-sm mx-auto">
                      No live resources match your filter criteria in the current emulator configuration.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredResources.map((res, idx) => (
                  <tr key={`${res.type}-${res.id}-${idx}`} className="hover:bg-[#f8f9fa]">
                    <td className="py-2.5 px-4 font-mono text-[12px]">
                      <Link href={res.link} className="text-[#0073bb] hover:underline font-semibold">
                        {res.id}
                      </Link>
                    </td>
                    <td className="py-2.5 px-4 text-[#16191f] font-medium">{res.name}</td>
                    <td className="py-2.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${res.typeColor}`}>
                        {res.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-[12px] text-[#545b64]">
                      <span className="font-mono">{res.region}</span> ({res.zone})
                    </td>
                    <td className="py-2.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${res.statusClass}`}>
                        {res.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-[12px] text-[#545b64]">{res.details}</td>
                    <td className="py-2.5 px-4 text-right">
                      <Link
                        href={res.link}
                        className="text-[12px] text-[#0073bb] hover:underline font-medium"
                      >
                        Manage &#8594;
                      </Link>
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
