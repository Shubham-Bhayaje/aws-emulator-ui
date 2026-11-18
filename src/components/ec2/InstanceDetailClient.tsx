/**
 * InstanceDetailClient.tsx – Client component for single EC2 Instance inspection.
 * Connected to live AWS Emulator via Server Actions.
 * Zero emojis, Cloudscape enterprise styling.
 */

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EC2Instance } from "@/lib/ec2-data";
import {
  LiveInstanceDetail,
  startLiveInstance,
  stopLiveInstance,
  terminateLiveInstance,
} from "@/app/ec2/actions";

interface InstanceDetailClientProps {
  instanceId: string;
  liveDetail?: LiveInstanceDetail | null;
  isLive?: boolean;
  errorMessage?: string;
}

export default function InstanceDetailClient({
  instanceId,
  liveDetail,
  isLive = true,
  errorMessage,
}: InstanceDetailClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "details" | "status" | "monitoring" | "security" | "networking" | "storage" | "tags"
  >("details");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  const [instance, setInstanceState] = useState<LiveInstanceDetail | null>(liveDetail || null);

  function copyText(txt: string, key: string) {
    navigator.clipboard.writeText(txt);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  function handleStateChange(newState: "running" | "stopped" | "terminated") {
    if (!instance) return;
    setInstanceState((prev) => prev ? { ...prev, state: newState } : null);
    startTransition(async () => {
      if (newState === "running") {
        setFeedback("Starting instance on AWS Emulator...");
        const res = await startLiveInstance(instance.id);
        if (res.success) setFeedback("Instance started.");
        else setFeedback(`Error: ${res.error}`);
      } else if (newState === "stopped") {
        setFeedback("Stopping instance on AWS Emulator...");
        const res = await stopLiveInstance(instance.id);
        if (res.success) setFeedback("Instance stopped.");
        else setFeedback(`Error: ${res.error}`);
      } else if (newState === "terminated") {
        setFeedback("Terminating instance on AWS Emulator...");
        const res = await terminateLiveInstance(instance.id);
        if (res.success) setFeedback("Instance terminated.");
        else setFeedback(`Error: ${res.error}`);
      }
      setTimeout(() => setFeedback(null), 3000);
    });
  }

  if (!instance) {
    return (
      <div className="space-y-6 max-w-[1400px]">
        <div className="text-[12px] text-[#545b64] mb-1 flex items-center gap-1.5">
          <Link href="/ec2" className="hover:underline">EC2</Link>
          <span>&rsaquo;</span>
          <Link href="/ec2/instances" className="hover:underline">Instances</Link>
          <span>&rsaquo;</span>
          <span className="font-mono text-[#16191f]">{instanceId}</span>
        </div>

        <div className="p-6 bg-white border border-[#d5dbdb] rounded-sm text-center space-y-3">
          <h2 className="text-[16px] font-bold text-[#d13212]">Instance Not Found</h2>
          <p className="text-[13px] text-[#545b64]">
            {errorMessage || `The instance "${instanceId}" was not found in the AWS Emulator.`}
          </p>
          <div className="pt-2">
            <Link
              href="/ec2/instances"
              className="px-4 py-2 bg-[#ec7211] text-white rounded-sm text-[13px] font-medium hover:bg-[#eb5f07]"
            >
              Return to instances
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Live Badge */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#f2f8f0] border border-[#b8dfaf] rounded-sm text-[12px] text-[#1d8102]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#1d8102] animate-pulse" />
          <span className="font-semibold">Live AWS Emulator Data</span>
          <span className="text-[#545b64]">|</span>
          <span>Attributes fetched live from container (127.0.0.1:9297)</span>
        </div>
        {feedback && <span className="font-medium text-[#0073bb]">{feedback}</span>}
      </div>

      {/* Breadcrumb & Header */}
      <div>
        <div className="text-[12px] text-[#545b64] mb-1 flex items-center gap-1.5">
          <Link href="/ec2" className="hover:underline">EC2</Link>
          <span>&rsaquo;</span>
          <Link href="/ec2/instances" className="hover:underline">Instances</Link>
          <span>&rsaquo;</span>
          <span className="font-mono text-[#16191f]">{instance.id}</span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#eaeded] pb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-[22px] font-bold text-[#16191f]">{instance.name}</h1>
            <span className="font-mono text-[14px] text-[#545b64]">({instance.id})</span>
            <span
              className={`text-[11px] px-2.5 py-0.5 rounded font-semibold capitalize ${
                instance.state === "running"
                  ? "bg-[#f2f8f0] text-[#1d8102] border border-[#b8dfaf]"
                  : instance.state === "stopped"
                  ? "bg-[#f2f3f3] text-[#545b64] border border-[#d5dbdb]"
                  : "bg-[#fdf3f1] text-[#d13212] border border-[#f5b8b0]"
              }`}
            >
              {instance.state}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {instance.state === "running" ? (
              <button
                onClick={() => handleStateChange("stopped")}
                disabled={isPending}
                className="px-3 py-1.5 text-[13px] border border-[#545b64] rounded-sm text-[#16191f] hover:bg-[#f2f3f3] disabled:opacity-50"
              >
                Stop instance
              </button>
            ) : instance.state === "stopped" ? (
              <button
                onClick={() => handleStateChange("running")}
                disabled={isPending}
                className="px-3 py-1.5 text-[13px] bg-[#0073bb] text-white rounded-sm hover:bg-[#005a9e] disabled:opacity-50"
              >
                Start instance
              </button>
            ) : null}

            <Link
              href="/ec2/instances"
              className="px-3 py-1.5 text-[13px] border border-[#545b64] rounded-sm text-[#16191f] hover:bg-[#f2f3f3]"
            >
              Back to instances
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="border-b border-[#eaeded] flex gap-2 text-[13px]">
        {(["details", "status", "monitoring", "security", "networking", "storage", "tags"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 border-b-2 font-medium capitalize transition-colors ${
              activeTab === tab
                ? "border-[#ec7211] text-[#ec7211]"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            {tab === "status" ? "Status checks" : tab}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="bg-white border border-[#d5dbdb] rounded-sm p-6 awsui-shadow">
        {activeTab === "details" && (
          <div className="space-y-6">
            <h2 className="text-[16px] font-bold text-[#16191f]">Instance details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[13px]">
              <div className="space-y-3">
                <div>
                  <div className="text-[11px] text-[#545b64] uppercase font-bold">Instance ID</div>
                  <div className="font-mono text-[#0073bb] mt-0.5 flex items-center gap-2">
                    {instance.id}
                    <button
                      onClick={() => copyText(instance.id, "id")}
                      className="text-[11px] text-[#545b64] hover:underline"
                    >
                      {copiedKey === "id" ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-[#545b64] uppercase font-bold">Public IPv4 address</div>
                  <div className="font-mono text-[#16191f] mt-0.5">{instance.publicIp || "—"}</div>
                </div>

                <div>
                  <div className="text-[11px] text-[#545b64] uppercase font-bold">Private IPv4 address</div>
                  <div className="font-mono text-[#16191f] mt-0.5">{instance.privateIp || "—"}</div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-[11px] text-[#545b64] uppercase font-bold">Instance type</div>
                  <div className="font-mono text-[#16191f] mt-0.5">{instance.instanceType}</div>
                </div>

                <div>
                  <div className="text-[11px] text-[#545b64] uppercase font-bold">Availability Zone</div>
                  <div className="text-[#16191f] mt-0.5">{instance.availabilityZone}</div>
                </div>

                <div>
                  <div className="text-[11px] text-[#545b64] uppercase font-bold">AMI ID</div>
                  <div className="font-mono text-[#0073bb] mt-0.5">{instance.amiId}</div>
                  <div className="text-[11px] text-[#545b64] truncate">{instance.amiName}</div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-[11px] text-[#545b64] uppercase font-bold">VPC ID</div>
                  <div className="font-mono text-[#0073bb] mt-0.5">{instance.vpcId}</div>
                </div>

                <div>
                  <div className="text-[11px] text-[#545b64] uppercase font-bold">Subnet ID</div>
                  <div className="font-mono text-[#0073bb] mt-0.5">{instance.subnetId}</div>
                </div>

                <div>
                  <div className="text-[11px] text-[#545b64] uppercase font-bold">Key Pair Name</div>
                  <div className="text-[#0073bb] mt-0.5">{instance.keyName}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "status" && (
          <div className="space-y-4">
            <h2 className="text-[16px] font-bold text-[#16191f]">Status check details</h2>
            <div className="flex items-center gap-2 p-3 bg-[#f2f8f0] border border-[#b8dfaf] rounded text-[13px] text-[#1d8102]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1d8102]" />
              <span className="font-bold">{instance.statusCheck}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px] pt-2">
              <div className="p-4 border border-[#eaeded] rounded bg-[#fafafa] space-y-1">
                <div className="font-bold text-[#16191f]">System reachability check</div>
                <div className="text-[#1d8102] font-semibold">
                  {instance.state === "running" ? "Passed" : "Not applicable (instance not running)"}
                </div>
                <p className="text-[12px] text-[#545b64]">
                  Verifies that AWS systems required to use this instance are working correctly.
                </p>
              </div>

              <div className="p-4 border border-[#eaeded] rounded bg-[#fafafa] space-y-1">
                <div className="font-bold text-[#16191f]">Instance reachability check</div>
                <div className="text-[#1d8102] font-semibold">
                  {instance.state === "running" ? "Passed" : "Not applicable (instance not running)"}
                </div>
                <p className="text-[12px] text-[#545b64]">
                  Verifies that the operating system on the instance is accepting network traffic.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "monitoring" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-[#16191f]">CloudWatch Metrics (Emulator Simulation)</h2>
              <span className="text-[12px] text-[#545b64]">1-minute intervals</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* CPU Utilization Chart */}
              <div className="p-4 border border-[#eaeded] rounded bg-[#fafafa] space-y-2">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="font-bold text-[#16191f]">CPUUtilization (%)</span>
                  <span className="font-mono text-[#0073bb]">Avg: 3.2%</span>
                </div>
                <svg className="w-full h-28" viewBox="0 0 300 100">
                  <polyline
                    fill="none"
                    stroke="#0073bb"
                    strokeWidth="2"
                    points="0,85 30,80 60,78 90,65 120,70 150,60 180,68 210,72 240,65 270,70 300,68"
                  />
                  <line x1="0" y1="95" x2="300" y2="95" stroke="#d5dbdb" strokeWidth="1" />
                </svg>
              </div>

              {/* Network In Chart */}
              <div className="p-4 border border-[#eaeded] rounded bg-[#fafafa] space-y-2">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="font-bold text-[#16191f]">NetworkIn (Bytes)</span>
                  <span className="font-mono text-[#10b981]">128 KB</span>
                </div>
                <svg className="w-full h-28" viewBox="0 0 300 100">
                  <polyline
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    points="0,90 30,85 60,60 90,40 120,75 150,80 180,30 210,65 240,50 270,80 300,75"
                  />
                  <line x1="0" y1="95" x2="300" y2="95" stroke="#d5dbdb" strokeWidth="1" />
                </svg>
              </div>

              {/* Disk Read/Write Chart */}
              <div className="p-4 border border-[#eaeded] rounded bg-[#fafafa] space-y-2">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="font-bold text-[#16191f]">DiskReadOps</span>
                  <span className="font-mono text-[#8b5cf6]">10 IOPS</span>
                </div>
                <svg className="w-full h-28" viewBox="0 0 300 100">
                  <polyline
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="2"
                    points="0,92 30,90 60,88 90,85 120,70 150,88 180,82 210,90 240,88 270,85 300,88"
                  />
                  <line x1="0" y1="95" x2="300" y2="95" stroke="#d5dbdb" strokeWidth="1" />
                </svg>
              </div>
            </div>
          </div>
        )}

        {activeTab === "security" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[16px] font-bold text-[#16191f]">Security details</h2>
                <div className="text-[13px] text-[#545b64] mt-1">
                  Attached Security Group: <strong className="text-[#0073bb]">{instance.securityGroupName}</strong> ({instance.securityGroupId})
                </div>
              </div>
              <Link
                href="/ec2/security-groups"
                className="px-3 py-1.5 bg-[#ec7211] text-white rounded text-[12px] font-medium hover:bg-[#eb5f07] transition-colors"
              >
                Edit inbound rules &rarr;
              </Link>
            </div>

            <div className="border border-[#eaeded] rounded overflow-hidden mt-3">
              <table className="w-full text-[12px] text-left">
                <thead className="bg-[#f2f3f3] text-[#545b64] font-semibold">
                  <tr>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3">Protocol</th>
                    <th className="py-2 px-3">Port range</th>
                    <th className="py-2 px-3">Source</th>
                    <th className="py-2 px-3">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeded]">
                  {instance.securityGroupRulesList && instance.securityGroupRulesList.length > 0 ? (
                    instance.securityGroupRulesList.map((rule, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 font-medium text-[#16191f]">{rule.type}</td>
                        <td className="py-2 px-3 text-[#545b64]">{rule.protocol}</td>
                        <td className="py-2 px-3 font-mono">{rule.portRange}</td>
                        <td className="py-2 px-3 font-mono">{rule.source}</td>
                        <td className="py-2 px-3 text-[#545b64]">{rule.description}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-4 px-3 text-center text-[#545b64]">
                        No inbound rules attached to this group in emulator.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "networking" && (
          <div className="space-y-4">
            <h2 className="text-[16px] font-bold text-[#16191f]">Network interfaces (Live from Emulator)</h2>
            {instance.networkInterfacesList && instance.networkInterfacesList.length > 0 ? (
              <div className="space-y-4">
                {instance.networkInterfacesList.map((eni, idx) => (
                  <div key={idx} className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[13px] p-4 bg-[#fafafa] border border-[#eaeded] rounded">
                    <div>
                      <div className="text-[11px] text-[#545b64] uppercase font-bold">Network Interface ID</div>
                      <div className="font-mono text-[#0073bb] mt-0.5">{eni.id}</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-[#545b64] uppercase font-bold">MAC Address</div>
                      <div className="font-mono text-[#16191f] mt-0.5">{eni.mac}</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-[#545b64] uppercase font-bold">Private IPv4 IP</div>
                      <div className="font-mono text-[#16191f] mt-0.5">{eni.privateIp}</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-[#545b64] uppercase font-bold">Public IPv4 IP</div>
                      <div className="font-mono text-[#16191f] mt-0.5">{eni.publicIp || instance.publicIp || "—"}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-[#545b64]">No active network interfaces attached (instance may be terminated).</p>
            )}
          </div>
        )}

        {activeTab === "storage" && (
          <div className="space-y-4">
            <h2 className="text-[16px] font-bold text-[#16191f]">Block devices (Live from Emulator)</h2>
            <div className="border border-[#eaeded] rounded overflow-hidden">
              <table className="w-full text-[12px] text-left">
                <thead className="bg-[#f2f3f3] text-[#545b64] font-semibold">
                  <tr>
                    <th className="py-2 px-3">Device name</th>
                    <th className="py-2 px-3">Volume ID</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Attachment Time</th>
                    <th className="py-2 px-3">Delete on termination</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeded]">
                  {instance.blockDevicesList && instance.blockDevicesList.length > 0 ? (
                    instance.blockDevicesList.map((bdm, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 font-mono font-medium text-[#16191f]">{bdm.deviceName}</td>
                        <td className="py-2 px-3 font-mono text-[#0073bb]">{bdm.volumeId}</td>
                        <td className="py-2 px-3 capitalize">
                          <span className="text-[#1d8102] font-semibold">{bdm.status}</span>
                        </td>
                        <td className="py-2 px-3 text-[#545b64]">{bdm.attachTime}</td>
                        <td className="py-2 px-3 text-[#545b64]">{bdm.deleteOnTermination ? "Yes" : "No"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-4 px-3 text-center text-[#545b64]">
                        No block devices attached.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "tags" && (
          <div className="space-y-4">
            <h2 className="text-[16px] font-bold text-[#16191f]">Tags</h2>
            <div className="border border-[#eaeded] rounded overflow-hidden">
              <table className="w-full text-[12px] text-left">
                <thead className="bg-[#f2f3f3] text-[#545b64] font-semibold">
                  <tr>
                    <th className="py-2 px-3">Key</th>
                    <th className="py-2 px-3">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeded]">
                  {instance.tags && Object.keys(instance.tags).length > 0 ? (
                    Object.entries(instance.tags).map(([k, v]) => (
                      <tr key={k}>
                        <td className="py-2 px-3 font-medium text-[#16191f]">{k}</td>
                        <td className="py-2 px-3 text-[#545b64]">{v}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="py-4 px-3 text-center text-[#545b64]">
                        No tags assigned to this instance.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
