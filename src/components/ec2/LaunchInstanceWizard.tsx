/**
 * LaunchInstanceWizard.tsx – Authentic AWS EC2 Launch Instance Wizard.
 * Full multi-step form with live right-side summary drawer and instant persistence.
 * Zero emojis, Cloudscape enterprise styling.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import EmulatorOfflineBanner from "@/components/EmulatorOfflineBanner";
import {
  EC2Instance,
  SecurityGroup,
  KeyPair,
} from "@/lib/ec2-data";
import { launchLiveInstance } from "@/app/ec2/actions";

const AMI_OPTIONS = [
  {
    id: "ami-080e1f13689e07408",
    name: "Ubuntu Server 24.04 LTS",
    platform: "Ubuntu",
    desc: "Canonical, Ubuntu, 24.04 LTS, amd64 noble image with full developer and system tools",
    arch: "64-bit (x86)",
    freeTier: true,
  },
  {
    id: "ami-0c7217cdde317cfec",
    name: "Amazon Linux 2023 AMI",
    platform: "Amazon Linux",
    desc: "Amazon Linux 2023.5.20240916.0 provided by Amazon Web Services",
    arch: "64-bit (x86)",
    freeTier: true,
  },
  {
    id: "ami-0c101f26f147fa7ab",
    name: "Red Hat Enterprise Linux 9",
    platform: "Red Hat",
    desc: "Red Hat Enterprise Linux version 9.4 (HVM), EBS General Purpose (gp3) Init",
    arch: "64-bit (x86)",
    freeTier: false,
  },
  {
    id: "ami-0d5eff06f840b45e9",
    name: "Microsoft Windows Server 2022 Base",
    platform: "Windows",
    desc: "Microsoft Windows Server 2022 Standard edition with Desktop Experience",
    arch: "64-bit (x86)",
    freeTier: false,
  },
];

const INSTANCE_TYPES = [
  { type: "t2.micro", vCpu: 1, memoryGib: 1.0, storage: "EBS only", network: "Low to Moderate", freeTier: true },
  { type: "t3.micro", vCpu: 2, memoryGib: 1.0, storage: "EBS only", network: "Up to 5 Gbps", freeTier: false },
  { type: "t3.small", vCpu: 2, memoryGib: 2.0, storage: "EBS only", network: "Up to 5 Gbps", freeTier: false },
  { type: "t3.medium", vCpu: 2, memoryGib: 4.0, storage: "EBS only", network: "Up to 5 Gbps", freeTier: false },
  { type: "m5.large", vCpu: 2, memoryGib: 8.0, storage: "EBS only", network: "Up to 10 Gbps", freeTier: false },
  { type: "c5.xlarge", vCpu: 4, memoryGib: 8.0, storage: "EBS only", network: "Up to 10 Gbps", freeTier: false },
];

const DEFAULT_FALLBACK_SG: SecurityGroup = {
  id: "sg-default",
  name: "default",
  description: "Default security group",
  vpcId: "vpc-00000000000000001",
  ownerId: "000000000000",
  arn: "arn:aws:ec2:us-east-1:000000000000:security-group/sg-default",
  tags: {},
  inboundRules: [],
  outboundRules: [],
};

interface LaunchInstanceWizardProps {
  initialSecurityGroups?: SecurityGroup[];
  initialKeyPairs?: KeyPair[];
}

export default function LaunchInstanceWizard({
  initialSecurityGroups = [],
  initialKeyPairs = [],
}: LaunchInstanceWizardProps) {
  const router = useRouter();

  // Wizard state
  const [instanceName, setInstanceName] = useState("");
  const [selectedAmiId, setSelectedAmiId] = useState(AMI_OPTIONS[0].id);
  const [selectedType, setSelectedType] = useState("t3.micro");
  const [selectedKeyPair, setSelectedKeyPair] = useState(
    initialKeyPairs[0]?.name || ""
  );
  const [selectedSgId, setSelectedSgId] = useState(
    initialSecurityGroups[0]?.id || DEFAULT_FALLBACK_SG.id
  );
  const [allowSsh, setAllowSsh] = useState(true);
  const [allowHttp, setAllowHttp] = useState(true);
  const [allowHttps, setAllowHttps] = useState(true);
  const [volumeSizeGb, setVolumeSizeGb] = useState("20");
  const [iamRole, setIamRole] = useState("None");
  const [userData, setUserData] = useState("#!/bin/bash\necho 'Hello from EC2' > /var/www/html/index.html");

  const [secGroups] = useState<SecurityGroup[]>(
    initialSecurityGroups.length > 0 ? initialSecurityGroups : [DEFAULT_FALLBACK_SG]
  );
  const [keyPairs] = useState<KeyPair[]>(initialKeyPairs);
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);

  const currentAmi = AMI_OPTIONS.find((a) => a.id === selectedAmiId) || AMI_OPTIONS[0];
  const currentTypeObj = INSTANCE_TYPES.find((t) => t.type === selectedType) || INSTANCE_TYPES[1];
  const currentSg = secGroups.find((s) => s.id === selectedSgId) || secGroups[0] || DEFAULT_FALLBACK_SG;

  async function handleLaunch(e: React.FormEvent) {
    e.preventDefault();
    setIsLaunching(true);
    setLaunchError(null);

    try {
      const res = await launchLiveInstance({
        name: instanceName.trim() || `instance-${Date.now().toString().slice(-4)}`,
        imageId: selectedAmiId,
        instanceType: selectedType,
        keyName: selectedKeyPair && selectedKeyPair !== "none" ? selectedKeyPair : undefined,
        securityGroupId: selectedSgId && selectedSgId !== "sg-default" ? selectedSgId : undefined,
      });

      if (res.success && res.instance) {
        setIsLaunching(false);
        router.push("/ec2/instances");
        return;
      }
      setLaunchError(res.error || "Failed to launch instance on AWS Emulator.");
      setIsLaunching(false);
    } catch (err: any) {
      setLaunchError(err.message || "Failed to communicate with AWS Emulator.");
      setIsLaunching(false);
    }
  }

  return (
    <div className="max-w-[1400px] space-y-6">
      {/* Breadcrumb & Title */}
      <div className="flex items-center justify-between border-b border-[#eaeded] pb-4">
        <div>
          <div className="text-[12px] text-[#545b64] mb-1 flex items-center gap-1.5">
            <Link href="/ec2" className="hover:underline">EC2</Link>
            <span>&rsaquo;</span>
            <Link href="/ec2/instances" className="hover:underline">Instances</Link>
            <span>&rsaquo;</span>
            <span className="text-[#16191f]">Launch an instance</span>
          </div>
          <h1 className="text-[22px] font-bold text-[#16191f]">Launch an instance</h1>
          <p className="text-[13px] text-[#545b64]">
            Configure and deploy virtual server instances on Amazon Web Services.
          </p>
        </div>
      </div>

      {launchError && (
        <EmulatorOfflineBanner
          error={launchError}
          onRetry={() => {
            setLaunchError(null);
          }}
        />
      )}

      <form onSubmit={handleLaunch} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form Content (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. Name and Tags */}
          <div className="bg-white border border-[#d5dbdb] rounded-sm p-5 space-y-3 awsui-shadow">
            <h2 className="text-[16px] font-bold text-[#16191f]">Name and tags</h2>
            <div>
              <label className="block text-[13px] font-medium text-[#16191f] mb-1">
                Name
              </label>
              <input
                type="text"
                placeholder="e.g. My Web Server"
                value={instanceName}
                onChange={(e) => setInstanceName(e.target.value)}
                className="w-full max-w-[480px] px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded-sm text-[#16191f] focus:border-[#0073bb] outline-hidden"
              />
              <p className="text-[11px] text-[#545b64] mt-1">
                A tag is a label that you assign to an AWS resource. The Name tag helps identify the instance.
              </p>
            </div>
          </div>

          {/* 2. Application and OS Images (Amazon Machine Image) */}
          <div className="bg-white border border-[#d5dbdb] rounded-sm p-5 space-y-4 awsui-shadow">
            <div className="flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-[#16191f]">
                Application and OS Images (Amazon Machine Image)
              </h2>
              <span className="text-[12px] text-[#0073bb] cursor-pointer hover:underline">
                Browse more AMIs
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {AMI_OPTIONS.map((ami) => {
                const isSelected = selectedAmiId === ami.id;
                return (
                  <div
                    key={ami.id}
                    onClick={() => setSelectedAmiId(ami.id)}
                    className={`p-3.5 border rounded-sm cursor-pointer transition-all ${
                      isSelected
                        ? "border-[#0073bb] bg-[#f2f8fd] ring-1 ring-[#0073bb]"
                        : "border-[#eaeded] hover:border-[#aab7b8] bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-[13px] text-[#16191f]">{ami.name}</div>
                      {ami.freeTier && (
                        <span className="text-[10px] bg-[#f2f8f0] text-[#1d8102] border border-[#b8dfaf] px-1.5 py-0.5 rounded-xs font-semibold shrink-0">
                          Free tier eligible
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#545b64] mt-1 leading-snug line-clamp-2">{ami.desc}</p>
                    <div className="flex items-center gap-3 text-[11px] text-[#879596] font-mono mt-2">
                      <span>{ami.id}</span>
                      <span>{ami.arch}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Instance Type */}
          <div className="bg-white border border-[#d5dbdb] rounded-sm p-5 space-y-3 awsui-shadow">
            <h2 className="text-[16px] font-bold text-[#16191f]">Instance type</h2>
            <div className="max-w-[480px]">
              <label className="block text-[13px] font-medium text-[#16191f] mb-1">
                Instance type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded-sm text-[#16191f] focus:border-[#0073bb] outline-hidden bg-white"
              >
                {INSTANCE_TYPES.map((t) => (
                  <option key={t.type} value={t.type}>
                    {t.type} ({t.vCpu} vCPU, {t.memoryGib} GiB Memory, {t.network})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-[#545b64] mt-1.5">
                Current selection: <strong className="text-[#16191f]">{currentTypeObj.type}</strong> &bull; {currentTypeObj.vCpu} vCPU, {currentTypeObj.memoryGib} GiB RAM &bull; Network: {currentTypeObj.network}
              </p>
            </div>
          </div>

          {/* 4. Key Pair (Login) */}
          <div className="bg-white border border-[#d5dbdb] rounded-sm p-5 space-y-3 awsui-shadow">
            <div className="flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-[#16191f]">Key pair (login)</h2>
              <Link href="/ec2/key-pairs" className="text-[12px] text-[#0073bb] hover:underline">
                Create new key pair
              </Link>
            </div>
            <div className="max-w-[480px]">
              <label className="block text-[13px] font-medium text-[#16191f] mb-1">
                Key pair name
              </label>
              <select
                value={selectedKeyPair}
                onChange={(e) => setSelectedKeyPair(e.target.value)}
                className="w-full px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded-sm text-[#16191f] focus:border-[#0073bb] outline-hidden bg-white"
              >
                {keyPairs.map((k) => (
                  <option key={k.id} value={k.name}>
                    {k.name} ({k.type})
                  </option>
                ))}
                <option value="Proceed without key pair">Proceed without a key pair (Not recommended)</option>
              </select>
              <p className="text-[11px] text-[#545b64] mt-1">
                You can use a key pair to securely connect to your Linux instance via SSH.
              </p>
            </div>
          </div>

          {/* 5. Network Settings & Security Groups */}
          <div className="bg-white border border-[#d5dbdb] rounded-sm p-5 space-y-4 awsui-shadow">
            <h2 className="text-[16px] font-bold text-[#16191f]">Network settings</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
              <div>
                <span className="text-[#545b64] block mb-0.5">VPC</span>
                <span className="font-mono text-[#16191f]">vpc-0a1b2c3d4e5f67890 (default)</span>
              </div>
              <div>
                <span className="text-[#545b64] block mb-0.5">Subnet</span>
                <span className="font-mono text-[#16191f]">subnet-0a1b2c3d4e5f0001 (us-east-1a)</span>
              </div>
            </div>

            <div className="border-t border-[#eaeded] pt-3 space-y-2">
              <label className="block text-[13px] font-medium text-[#16191f]">
                Firewall (security groups)
              </label>
              <select
                value={selectedSgId}
                onChange={(e) => setSelectedSgId(e.target.value)}
                className="w-full max-w-[480px] px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded-sm text-[#16191f] focus:border-[#0073bb] outline-hidden bg-white"
              >
                {secGroups.map((sg) => (
                  <option key={sg.id} value={sg.id}>
                    {sg.name} ({sg.id}) &mdash; {sg.description}
                  </option>
                ))}
              </select>

              <div className="pt-2 space-y-2 text-[13px]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowSsh}
                    onChange={(e) => setAllowSsh(e.target.checked)}
                    className="rounded-xs"
                  />
                  <span>Allow SSH traffic from Anywhere (0.0.0.0/0)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowHttp}
                    onChange={(e) => setAllowHttp(e.target.checked)}
                    className="rounded-xs"
                  />
                  <span>Allow HTTP traffic from the internet</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowHttps}
                    onChange={(e) => setAllowHttps(e.target.checked)}
                    className="rounded-xs"
                  />
                  <span>Allow HTTPS traffic from the internet</span>
                </label>
              </div>
            </div>
          </div>

          {/* 6. Configure Storage */}
          <div className="bg-white border border-[#d5dbdb] rounded-sm p-5 space-y-3 awsui-shadow">
            <h2 className="text-[16px] font-bold text-[#16191f]">Configure storage</h2>
            <div className="flex items-center gap-3 text-[13px]">
              <span className="font-semibold text-[#16191f]">1x</span>
              <input
                type="number"
                min="8"
                max="16384"
                value={volumeSizeGb}
                onChange={(e) => setVolumeSizeGb(e.target.value)}
                className="w-20 px-2 py-1 text-[13px] border border-[#aab7b8] rounded text-[#16191f]"
              />
              <span className="font-medium text-[#16191f]">GiB</span>
              <span className="text-[#545b64]">General purpose SSD (gp3) &bull; Root volume</span>
            </div>
          </div>

          {/* 7. Advanced Details */}
          <div className="bg-white border border-[#d5dbdb] rounded-sm p-5 space-y-3 awsui-shadow">
            <h2 className="text-[16px] font-bold text-[#16191f]">Advanced details</h2>
            <div className="max-w-[480px] space-y-3">
              <div>
                <label className="block text-[13px] font-medium text-[#16191f] mb-1">
                  IAM instance profile
                </label>
                <select
                  value={iamRole}
                  onChange={(e) => setIamRole(e.target.value)}
                  className="w-full px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded-sm text-[#16191f] bg-white outline-hidden"
                >
                  <option value="None">None</option>
                  <option value="EC2-SSM-WebRole">EC2-SSM-WebRole</option>
                  <option value="EC2-DynamoDB-AccessRole">EC2-DynamoDB-AccessRole</option>
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#16191f] mb-1">
                  User data (optional startup script)
                </label>
                <textarea
                  rows={3}
                  value={userData}
                  onChange={(e) => setUserData(e.target.value)}
                  className="w-full font-mono text-[12px] p-2 border border-[#aab7b8] rounded text-[#16191f] outline-hidden"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Sticky Summary Drawer (4 Cols) */}
        <div className="lg:col-span-4 sticky top-6 space-y-4">
          <div className="bg-white border border-[#d5dbdb] rounded-sm p-5 awsui-shadow space-y-4">
            <h3 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-3">
              Summary
            </h3>

            <div className="space-y-3 text-[13px]">
              <div>
                <div className="text-[11px] text-[#545b64] uppercase font-bold">Number of instances</div>
                <div className="font-semibold text-[#16191f]">1</div>
              </div>

              <div>
                <div className="text-[11px] text-[#545b64] uppercase font-bold">Software Image (AMI)</div>
                <div className="font-medium text-[#16191f] truncate">{currentAmi.name}</div>
                <div className="text-[11px] font-mono text-[#879596]">{currentAmi.id}</div>
              </div>

              <div>
                <div className="text-[11px] text-[#545b64] uppercase font-bold">Virtual server type</div>
                <div className="font-medium text-[#16191f]">
                  {currentTypeObj.type} ({currentTypeObj.vCpu} vCPU, {currentTypeObj.memoryGib} GiB Memory)
                </div>
              </div>

              <div>
                <div className="text-[11px] text-[#545b64] uppercase font-bold">Firewall (Security group)</div>
                <div className="font-medium text-[#16191f]">{currentSg?.name || "default"}</div>
                <div className="text-[11px] text-[#879596] font-mono">{currentSg?.id || "sg-default"}</div>
              </div>

              <div>
                <div className="text-[11px] text-[#545b64] uppercase font-bold">Storage (Volumes)</div>
                <div className="font-medium text-[#16191f]">1 volume(s) - {volumeSizeGb} GiB gp3</div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#eaeded] space-y-2">
              <button
                type="submit"
                disabled={isLaunching}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="w-full bg-[#ec7211] text-white rounded-sm font-bold hover:bg-[#eb5f07] transition-colors shadow-xs text-[13px] whitespace-nowrap inline-flex items-center justify-center gap-2"
              >
                {isLaunching ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                      <path d="M12 2a10 10 0 0 1 10 10" />
                    </svg>
                    <span>Launching instance...</span>
                  </>
                ) : (
                  <span>Launch instance</span>
                )}
              </button>
              <Link
                href="/ec2/instances"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="w-full border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] rounded-sm font-bold text-[13px] whitespace-nowrap inline-flex items-center justify-center transition-colors"
              >
                Cancel
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
