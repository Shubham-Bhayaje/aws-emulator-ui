/**
 * src/components/ec2/EC2DashboardClient.tsx – Interactive client dashboard for Amazon EC2.
 * Calculates live compute metrics from the AWS Emulator across 12 resource categories.
 * Zero emojis, Cloudscape enterprise styling.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import EmulatorOfflineBanner from "@/components/EmulatorOfflineBanner";
import {
  EC2Instance,
  SecurityGroup,
  KeyPair,
  ElasticIp,
} from "@/lib/ec2-data";
import {
  EBSVolume,
  EBSSnapshot,
  PlacementGroupModel,
  DedicatedHostItem,
  LoadBalancerModel,
  TargetGroupModel,
  AutoScalingGroupModel,
  NetworkInterfaceModel,
} from "@/app/ec2/actions";

interface EC2DashboardClientProps {
  initialInstances?: EC2Instance[];
  initialSecurityGroups?: SecurityGroup[];
  initialKeyPairs?: KeyPair[];
  initialElasticIps?: ElasticIp[];
  initialVolumes?: EBSVolume[];
  initialSnapshots?: EBSSnapshot[];
  initialPlacementGroups?: PlacementGroupModel[];
  initialDedicatedHosts?: DedicatedHostItem[];
  initialLoadBalancers?: LoadBalancerModel[];
  initialTargetGroups?: TargetGroupModel[];
  initialAutoScalingGroups?: AutoScalingGroupModel[];
  initialNetworkInterfaces?: NetworkInterfaceModel[];
  isLive: boolean;
  liveError?: string;
}

export default function EC2DashboardClient({
  initialInstances = [],
  initialSecurityGroups = [],
  initialKeyPairs = [],
  initialElasticIps = [],
  initialVolumes = [],
  initialSnapshots = [],
  initialPlacementGroups = [],
  initialDedicatedHosts = [],
  initialLoadBalancers = [],
  initialTargetGroups = [],
  initialAutoScalingGroups = [],
  initialNetworkInterfaces = [],
  isLive,
  liveError,
}: EC2DashboardClientProps) {
  const [instances] = useState<EC2Instance[]>(initialInstances);
  const [secGroups] = useState<SecurityGroup[]>(initialSecurityGroups);
  const [keyPairs] = useState<KeyPair[]>(initialKeyPairs);
  const [elasticIps] = useState<ElasticIp[]>(initialElasticIps);
  const [volumes] = useState<EBSVolume[]>(initialVolumes);
  const [snapshots] = useState<EBSSnapshot[]>(initialSnapshots);
  const [placementGroups] = useState<PlacementGroupModel[]>(initialPlacementGroups);
  const [dedicatedHosts] = useState<DedicatedHostItem[]>(initialDedicatedHosts);
  const [loadBalancers] = useState<LoadBalancerModel[]>(initialLoadBalancers);
  const [targetGroups] = useState<TargetGroupModel[]>(initialTargetGroups);
  const [autoScalingGroups] = useState<AutoScalingGroupModel[]>(initialAutoScalingGroups);
  const [networkInterfaces] = useState<NetworkInterfaceModel[]>(initialNetworkInterfaces);

  const runningCount = instances.filter((i) => i.state === "running").length;

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Connection Status / Offline Warning Banner */}
      {!isLive || liveError ? (
        <EmulatorOfflineBanner error={liveError} />
      ) : (
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#f2f8f0] border border-[#b8dfaf] rounded-sm text-[12px] text-[#1d8102]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#1d8102] animate-pulse" />
            <span className="font-semibold">AWS Emulator Connected</span>
            <span className="text-[#545b64]">|</span>
            <span className="text-[#545b64]">Endpoint: https://127.0.0.1:9297 (Region: us-east-1)</span>
          </div>
          <span className="font-mono text-[11px] text-[#2b7d2b]">Live EC2 API Protocol</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#eaeded] pb-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#16191f]">EC2 Dashboard</h1>
          <p className="text-[13px] text-[#545b64]">
            Amazon Elastic Compute Cloud (EC2) provides resizable computing capacity in the AWS Cloud.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/ec2/instances"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="px-3 border border-[#545b64] rounded-sm text-[#16191f] hover:bg-[#f2f3f3] font-bold text-[13px] whitespace-nowrap inline-flex items-center justify-center transition-colors"
          >
            View instances
          </Link>
          <Link
            href="/ec2/launch"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="px-4 bg-[#ec7211] text-white rounded-sm hover:bg-[#eb5f07] font-bold text-[13px] whitespace-nowrap inline-flex items-center justify-center transition-colors"
          >
            Launch instance
          </Link>
        </div>
      </div>

      {/* Main Grid: Resources (8 cols) & Service Health (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Resources Summary Grid */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-[#d5dbdb] rounded-sm awsui-shadow">
            <div className="px-5 py-3.5 border-b border-[#eaeded] flex items-center justify-between">
              <div>
                <h2 className="text-[15px] font-bold text-[#16191f]">Resources</h2>
                <p className="text-[12px] text-[#545b64]">Resources in the active Region</p>
              </div>
              <span className="text-[12px] text-[#545b64]">Region: US East (N. Virginia)</span>
            </div>

            <div className="p-5 grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-8">
              <div>
                <div className="text-[12px] text-[#545b64]">Instances (running)</div>
                <Link
                  href="/ec2/instances"
                  className="text-[26px] font-semibold text-[#0073bb] hover:underline"
                >
                  {runningCount}
                </Link>
              </div>

              <div>
                <div className="text-[12px] text-[#545b64]">Dedicated Hosts</div>
                <Link
                  href="/ec2/dedicated-hosts"
                  className="text-[26px] font-semibold text-[#0073bb] hover:underline"
                >
                  {dedicatedHosts.length}
                </Link>
              </div>

              <div>
                <div className="text-[12px] text-[#545b64]">Instances (all)</div>
                <Link
                  href="/ec2/instances"
                  className="text-[26px] font-semibold text-[#0073bb] hover:underline"
                >
                  {instances.length}
                </Link>
              </div>

              <div>
                <div className="text-[12px] text-[#545b64]">Placement Groups</div>
                <Link
                  href="/ec2/placement-groups"
                  className="text-[26px] font-semibold text-[#0073bb] hover:underline"
                >
                  {placementGroups.length}
                </Link>
              </div>

              <div>
                <div className="text-[12px] text-[#545b64]">Elastic IPs</div>
                <Link
                  href="/ec2/elastic-ips"
                  className="text-[26px] font-semibold text-[#0073bb] hover:underline"
                >
                  {elasticIps.length}
                </Link>
              </div>

              <div>
                <div className="text-[12px] text-[#545b64]">Auto Scaling Groups</div>
                <Link
                  href="/ec2/auto-scaling-groups"
                  className="text-[26px] font-semibold text-[#0073bb] hover:underline"
                >
                  {autoScalingGroups.length}
                </Link>
              </div>

              <div>
                <div className="text-[12px] text-[#545b64]">Target Groups</div>
                <Link
                  href="/ec2/target-groups"
                  className="text-[26px] font-semibold text-[#0073bb] hover:underline"
                >
                  {targetGroups.length}
                </Link>
              </div>

              <div>
                <div className="text-[12px] text-[#545b64]">Load Balancers</div>
                <Link
                  href="/ec2/load-balancers"
                  className="text-[26px] font-semibold text-[#0073bb] hover:underline"
                >
                  {loadBalancers.length}
                </Link>
              </div>

              <div>
                <div className="text-[12px] text-[#545b64]">Key Pairs</div>
                <Link
                  href="/ec2/key-pairs"
                  className="text-[26px] font-semibold text-[#0073bb] hover:underline"
                >
                  {keyPairs.length}
                </Link>
              </div>

              <div>
                <div className="text-[12px] text-[#545b64]">Snapshots</div>
                <Link
                  href="/ec2/snapshots"
                  className="text-[26px] font-semibold text-[#0073bb] hover:underline"
                >
                  {snapshots.length}
                </Link>
              </div>

              <div>
                <div className="text-[12px] text-[#545b64]">Volumes</div>
                <Link
                  href="/ec2/volumes"
                  className="text-[26px] font-semibold text-[#0073bb] hover:underline"
                >
                  {volumes.length}
                </Link>
              </div>

              <div>
                <div className="text-[12px] text-[#545b64]">Security Groups</div>
                <Link
                  href="/ec2/security-groups"
                  className="text-[26px] font-semibold text-[#0073bb] hover:underline"
                >
                  {secGroups.length}
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Launch Cards */}
          <div className="bg-white border border-[#d5dbdb] rounded-sm p-5 space-y-4">
            <h2 className="text-[15px] font-bold text-[#16191f]">Launch an instance</h2>
            <p className="text-[13px] text-[#545b64]">
              To get started, launch an Amazon EC2 instance, which is a virtual server in the cloud.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <Link
                href="/ec2/launch"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 bg-[#ec7211] text-white rounded-sm hover:bg-[#eb5f07] text-[13px] font-bold whitespace-nowrap inline-flex items-center justify-center transition-colors"
              >
                Launch instance
              </Link>
              <Link
                href="/ec2/instances"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] text-[13px] font-bold whitespace-nowrap inline-flex items-center justify-center rounded-sm transition-colors"
              >
                Browse instances
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Service Health & Availability Zones */}
        <div className="lg:col-span-4 space-y-6">
          {/* Service Health */}
          <div className="bg-white border border-[#d5dbdb] rounded-sm p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-[14px] font-bold text-[#16191f]">Service health</h2>
              <span className="w-2.5 h-2.5 rounded-full bg-[#1d8102]" />
            </div>
            <p className="text-[12px] text-[#545b64]">
              Amazon EC2 is operating normally in US East (N. Virginia).
            </p>
            <div className="pt-2 border-t border-[#eaeded] text-[12px] space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#545b64]">us-east-1a:</span>
                <span className="text-[#1d8102] font-medium">Available</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#545b64]">us-east-1b:</span>
                <span className="text-[#1d8102] font-medium">Available</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#545b64]">us-east-1c:</span>
                <span className="text-[#1d8102] font-medium">Available</span>
              </div>
            </div>
          </div>

          {/* Zones & VPC Status */}
          <div className="bg-white border border-[#d5dbdb] rounded-sm p-5 space-y-3 text-[13px]">
            <h2 className="text-[14px] font-bold text-[#16191f]">Network & Security</h2>
            <div className="space-y-2 text-[12px]">
              <div className="flex justify-between">
                <span className="text-[#545b64]">Default VPC:</span>
                <span className="font-mono text-[#0073bb]">vpc-00000000000000001</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#545b64]">Subnets:</span>
                <span className="font-mono text-[#16191f]">3 Available</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#545b64]">Network Interfaces:</span>
                <Link href="/ec2/network-interfaces" className="font-mono text-[#0073bb] hover:underline">
                  {networkInterfaces.length} Active
                </Link>
              </div>
              <div className="flex justify-between">
                <span className="text-[#545b64]">Internet Gateway:</span>
                <span className="text-[#1d8102] font-medium">Attached</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
