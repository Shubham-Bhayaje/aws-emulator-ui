/**
 * src/components/ec2/CreateLaunchTemplateWizard.tsx – Authentic AWS EC2 Create Launch Template Wizard.
 * Full multi-section configuration wizard with sticky summary sidebar and live emulator integration.
 * Zero emojis, Cloudscape enterprise styling.
 */

"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SecurityGroup, KeyPair } from "@/lib/ec2-data";
import { createLiveLaunchTemplate } from "@/app/ec2/actions";

interface Props {
  initialSecurityGroups: SecurityGroup[];
  initialKeyPairs: KeyPair[];
  existingTemplates: Array<{ id: string; name: string }>;
}

const QUICK_START_AMIS = [
  {
    id: "ami-0c7217cdde317cfec",
    name: "Amazon Linux 2023 AMI",
    platform: "Amazon Linux",
    desc: "Amazon Linux 2023.6 provided by AWS (Free tier eligible)",
    arch: "64-bit (x86)",
    freeTier: true,
  },
  {
    id: "ami-080e1f13689e07408",
    name: "Ubuntu Server 24.04 LTS",
    platform: "Ubuntu",
    desc: "Canonical, Ubuntu, 24.04 LTS, amd64 noble (Free tier eligible)",
    arch: "64-bit (x86)",
    freeTier: true,
  },
  {
    id: "ami-0c101f26f147fa7ab",
    name: "Red Hat Enterprise Linux 9",
    platform: "Red Hat",
    desc: "Red Hat Enterprise Linux 9 (HVM), EBS General Purpose (gp3)",
    arch: "64-bit (x86)",
    freeTier: false,
  },
  {
    id: "ami-0d5eff06f840b45e9",
    name: "Windows Server 2022 Base",
    platform: "Windows",
    desc: "Microsoft Windows Server 2022 Standard edition",
    arch: "64-bit (x86)",
    freeTier: false,
  },
];

const INSTANCE_TYPES = [
  { type: "t3.nano", vCpu: 2, memoryGib: 0.5, desc: "2 vCPU, 0.5 GiB Memory" },
  { type: "t3.micro", vCpu: 2, memoryGib: 1.0, desc: "2 vCPU, 1.0 GiB Memory (Free tier eligible)" },
  { type: "t3.small", vCpu: 2, memoryGib: 2.0, desc: "2 vCPU, 2.0 GiB Memory" },
  { type: "t3.medium", vCpu: 2, memoryGib: 4.0, desc: "2 vCPU, 4.0 GiB Memory" },
  { type: "t3.large", vCpu: 2, memoryGib: 8.0, desc: "2 vCPU, 8.0 GiB Memory" },
  { type: "c5.large", vCpu: 2, memoryGib: 4.0, desc: "2 vCPU, 4.0 GiB Memory, Compute Optimized" },
  { type: "m5.large", vCpu: 2, memoryGib: 8.0, desc: "2 vCPU, 8.0 GiB Memory, General Purpose" },
];

export default function CreateLaunchTemplateWizard({
  initialSecurityGroups,
  initialKeyPairs,
  existingTemplates,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Template Identification
  const [templateName, setTemplateName] = useState("");
  const [versionDescription, setVersionDescription] = useState("");
  const [autoScalingGuidance, setAutoScalingGuidance] = useState(false);
  const [sourceTemplateId, setSourceTemplateId] = useState<string>("none");

  // AMI
  const [selectedAmiId, setSelectedAmiId] = useState<string>(QUICK_START_AMIS[0].id);
  const [customAmiId, setCustomAmiId] = useState<string>("");
  const [architecture, setArchitecture] = useState<"x86_64" | "arm64">("x86_64");

  // Instance Type
  const [selectedInstanceType, setSelectedInstanceType] = useState<string>("t3.micro");

  // Key Pair
  const [selectedKeyName, setSelectedKeyName] = useState<string>(
    initialKeyPairs[0]?.name || "none"
  );

  // Network Settings
  const [selectedSecurityGroupIds, setSelectedSecurityGroupIds] = useState<string[]>(
    initialSecurityGroups[0] ? [initialSecurityGroups[0].id] : []
  );

  // Storage
  const [volumeSize, setVolumeSize] = useState<number>(8);
  const [volumeType, setVolumeType] = useState<string>("gp3");
  const [deleteOnTermination, setDeleteOnTermination] = useState<boolean>(true);
  const [encrypted, setEncrypted] = useState<boolean>(false);

  // Advanced Details
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [iamInstanceProfile, setIamInstanceProfile] = useState<string>("none");
  const [shutdownBehavior, setShutdownBehavior] = useState<"stop" | "terminate">("stop");
  const [detailedMonitoring, setDetailedMonitoring] = useState<boolean>(false);
  const [creditSpecification, setCreditSpecification] = useState<"standard" | "unlimited">("standard");
  const [userData, setUserData] = useState<string>("#!/bin/bash\n# User data script executed on instance boot\necho 'Configured by Launch Template' > /tmp/launch-template.log\n");

  const effectiveAmiId = customAmiId.trim() || selectedAmiId;
  const currentAmiObj = QUICK_START_AMIS.find((a) => a.id === selectedAmiId) || QUICK_START_AMIS[0];
  const currentTypeObj = INSTANCE_TYPES.find((t) => t.type === selectedInstanceType) || INSTANCE_TYPES[1];

  function toggleSecurityGroup(id: string) {
    setSelectedSecurityGroupIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!templateName.trim()) {
      setErrorMessage("Launch template name is required.");
      return;
    }

    setErrorMessage(null);
    startTransition(async () => {
      const res = await createLiveLaunchTemplate({
        name: templateName.trim(),
        versionDescription: versionDescription.trim() || undefined,
        imageId: effectiveAmiId,
        instanceType: selectedInstanceType,
        keyName: selectedKeyName !== "none" ? selectedKeyName : undefined,
        securityGroupIds: selectedSecurityGroupIds.length > 0 ? selectedSecurityGroupIds : undefined,
        volumeSize,
        volumeType,
        deleteOnTermination,
        userData: userData.trim() || undefined,
        monitoring: detailedMonitoring,
      });

      if (res.success) {
        router.push("/ec2/launch-templates");
      } else {
        setErrorMessage(res.error || "Failed to create launch template in AWS Emulator.");
      }
    });
  }

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Breadcrumb & Header */}
      <div>
        <div className="text-[12px] text-[#545b64] mb-1 flex items-center gap-1.5">
          <Link href="/ec2" className="hover:underline">EC2</Link>
          <span>&rsaquo;</span>
          <Link href="/ec2/launch-templates" className="hover:underline">Launch Templates</Link>
          <span>&rsaquo;</span>
          <span className="text-[#16191f]">Create launch template</span>
        </div>
        <div className="border-b border-[#eaeded] pb-4">
          <h1 className="text-[22px] font-bold text-[#16191f]">Create launch template</h1>
          <p className="text-[13px] text-[#545b64] mt-0.5">
            Specify instance configuration parameters to save and reuse when launching EC2 instances or configuring Auto Scaling groups.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-[#fdf3f1] border border-[#f5b8b0] text-[#d13212] text-[13px] rounded-sm">
          <strong>Error:</strong> {errorMessage}
        </div>
      )}

      {/* Main Grid: Left Config Cards, Right Summary */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Configuration Cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Launch template name and description */}
          <div className="bg-white border border-[#d5dbdb] rounded-sm p-5 space-y-4 awsui-shadow">
            <h2 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
              Launch template name and description
            </h2>

            <div>
              <label className="block text-[13px] font-bold text-[#16191f] mb-1">
                Launch template name <span className="text-[#d13212]">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. web-server-template"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] focus:outline-none focus:border-[#ec7211]"
              />
              <p className="text-[11px] text-[#545b64] mt-1">
                Must be unique to this region. Up to 128 characters, letters, numbers, periods, hyphens, and underscores.
              </p>
            </div>

            <div>
              <label className="block text-[13px] font-bold text-[#16191f] mb-1">
                Template version description
              </label>
              <input
                type="text"
                placeholder="e.g. Initial version for production web server"
                value={versionDescription}
                onChange={(e) => setVersionDescription(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] focus:outline-none focus:border-[#ec7211]"
              />
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-[13px] text-[#16191f]">
                <input
                  type="checkbox"
                  checked={autoScalingGuidance}
                  onChange={(e) => setAutoScalingGuidance(e.target.checked)}
                  className="rounded text-[#ec7211] focus:ring-[#ec7211]"
                />
                <span className="font-medium">Auto Scaling guidance</span>
              </label>
              <p className="text-[11px] text-[#545b64] ml-5 mt-0.5">
                Provide guidance to help set up a template for use with EC2 Auto Scaling.
              </p>
            </div>

            {existingTemplates.length > 0 && (
              <div className="pt-2">
                <label className="block text-[13px] font-bold text-[#16191f] mb-1">
                  Source template <span className="text-[11px] font-normal text-[#545b64]">(optional)</span>
                </label>
                <select
                  value={sourceTemplateId}
                  onChange={(e) => setSourceTemplateId(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] bg-white"
                >
                  <option value="none">None (Start with empty template)</option>
                  {existingTemplates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.id})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Card 2: Application and OS Images (Amazon Machine Image) */}
          <div className="bg-white border border-[#d5dbdb] rounded-sm p-5 space-y-4 awsui-shadow">
            <h2 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
              Application and OS Images (Amazon Machine Image)
            </h2>
            <p className="text-[12px] text-[#545b64]">
              An AMI is a template that contains the software configuration (operating system, application server, and applications) required to launch your instance.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {QUICK_START_AMIS.map((ami) => (
                <button
                  type="button"
                  key={ami.id}
                  onClick={() => {
                    setSelectedAmiId(ami.id);
                    setCustomAmiId("");
                  }}
                  className={`p-3 border rounded-sm text-left flex flex-col justify-between transition-all ${
                    selectedAmiId === ami.id && !customAmiId
                      ? "border-[#ec7211] bg-[#fdfaf7] ring-1 ring-[#ec7211]"
                      : "border-[#d5dbdb] hover:border-[#aab7b8] bg-white"
                  }`}
                >
                  <div>
                    <span className="text-[12px] font-bold text-[#16191f] block leading-snug">
                      {ami.platform}
                    </span>
                    <span className="text-[10px] text-[#545b64] mt-0.5 line-clamp-2">
                      {ami.name}
                    </span>
                  </div>
                  {ami.freeTier && (
                    <span className="mt-2 text-[10px] font-medium text-[#1d8102] bg-[#f2f8f0] px-1.5 py-0.5 rounded w-fit">
                      Free tier
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="pt-2">
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                AMI ID
              </label>
              <input
                type="text"
                value={effectiveAmiId}
                onChange={(e) => setCustomAmiId(e.target.value)}
                placeholder="e.g. ami-0c7217cdde317cfec"
                className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm font-mono text-[13px]"
              />
              <p className="text-[11px] text-[#545b64] mt-1">
                {currentAmiObj.desc}
              </p>
            </div>

            <div className="pt-2">
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                Architecture
              </label>
              <div className="flex gap-4 text-[13px]">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="arch"
                    checked={architecture === "x86_64"}
                    onChange={() => setArchitecture("x86_64")}
                    className="text-[#ec7211] focus:ring-[#ec7211]"
                  />
                  <span>64-bit (x86)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="arch"
                    checked={architecture === "arm64"}
                    onChange={() => setArchitecture("arm64")}
                    className="text-[#ec7211] focus:ring-[#ec7211]"
                  />
                  <span>64-bit (Arm)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Card 3: Instance type */}
          <div className="bg-white border border-[#d5dbdb] rounded-sm p-5 space-y-4 awsui-shadow">
            <h2 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
              Instance type
            </h2>
            <p className="text-[12px] text-[#545b64]">
              EC2 provides a wide selection of instance types optimized to fit different use cases. Instance types comprise varying combinations of CPU, memory, storage, and networking capacity.
            </p>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                Instance type
              </label>
              <select
                value={selectedInstanceType}
                onChange={(e) => setSelectedInstanceType(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] bg-white font-mono"
              >
                {INSTANCE_TYPES.map((t) => (
                  <option key={t.type} value={t.type}>
                    {t.type} — {t.desc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Card 4: Key pair (login) */}
          <div className="bg-white border border-[#d5dbdb] rounded-sm p-5 space-y-4 awsui-shadow">
            <h2 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
              Key pair (login)
            </h2>
            <p className="text-[12px] text-[#545b64]">
              You can use a key pair to securely connect to your instance. Ensure that you have access to the selected key pair file.
            </p>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                Key pair name
              </label>
              <select
                value={selectedKeyName}
                onChange={(e) => setSelectedKeyName(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] bg-white"
              >
                <option value="none">Proceed without a key pair (Not recommended)</option>
                {initialKeyPairs.map((kp) => (
                  <option key={kp.id} value={kp.name}>
                    {kp.name} ({kp.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Card 5: Network settings (Security groups) */}
          <div className="bg-white border border-[#d5dbdb] rounded-sm p-5 space-y-4 awsui-shadow">
            <h2 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
              Network settings (Firewall / Security groups)
            </h2>
            <p className="text-[12px] text-[#545b64]">
              A security group is a set of firewall rules that control the traffic for your instance. Add rules to allow specific traffic to reach your instance.
            </p>

            <div className="space-y-2">
              <label className="block text-[12px] font-bold text-[#16191f]">
                Select existing security groups (AWS Emulator)
              </label>
              <div className="border border-[#eaeded] rounded-sm divide-y divide-[#eaeded] max-h-48 overflow-y-auto">
                {initialSecurityGroups.map((sg) => {
                  const isChecked = selectedSecurityGroupIds.includes(sg.id);
                  return (
                    <label
                      key={sg.id}
                      className="flex items-center gap-3 p-2.5 hover:bg-[#fbfbfb] cursor-pointer text-[13px]"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSecurityGroup(sg.id)}
                        className="rounded text-[#ec7211] focus:ring-[#ec7211]"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-[#16191f]">{sg.name}</div>
                        <div className="text-[11px] font-mono text-[#545b64]">{sg.id} • {sg.description}</div>
                      </div>
                      <span className="text-[11px] text-[#545b64]">
                        {sg.inboundRules?.length || 0} rules
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Card 6: Configure storage (Volumes) */}
          <div className="bg-white border border-[#d5dbdb] rounded-sm p-5 space-y-4 awsui-shadow">
            <h2 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
              Configure storage
            </h2>

            <div className="p-3 bg-[#fafafa] border border-[#eaeded] rounded-sm space-y-3">
              <div className="flex items-center justify-between text-[13px] font-bold text-[#16191f]">
                <span>1x 8 GiB Root volume (EBS)</span>
                <span className="text-[11px] font-mono text-[#545b64]">/dev/xvda</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#545b64] mb-1">
                    Size (GiB)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={16384}
                    value={volumeSize}
                    onChange={(e) => setVolumeSize(parseInt(e.target.value) || 8)}
                    className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#545b64] mb-1">
                    Volume type
                  </label>
                  <select
                    value={volumeType}
                    onChange={(e) => setVolumeType(e.target.value)}
                    className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] bg-white font-mono"
                  >
                    <option value="gp3">General Purpose SSD (gp3)</option>
                    <option value="gp2">General Purpose SSD (gp2)</option>
                    <option value="io1">Provisioned IOPS SSD (io1)</option>
                    <option value="st1">Throughput Optimized HDD (st1)</option>
                    <option value="sc1">Cold HDD (sc1)</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-1.5 cursor-pointer text-[12px] text-[#16191f]">
                    <input
                      type="checkbox"
                      checked={deleteOnTermination}
                      onChange={(e) => setDeleteOnTermination(e.target.checked)}
                      className="rounded text-[#ec7211] focus:ring-[#ec7211]"
                    />
                    <span>Delete on termination</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[12px] text-[#16191f] mt-1">
                    <input
                      type="checkbox"
                      checked={encrypted}
                      onChange={(e) => setEncrypted(e.target.checked)}
                      className="rounded text-[#ec7211] focus:ring-[#ec7211]"
                    />
                    <span>Encrypted (EBS)</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Card 7: Advanced details */}
          <div className="bg-white border border-[#d5dbdb] rounded-sm p-5 space-y-4 awsui-shadow">
            <div
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center justify-between cursor-pointer select-none"
            >
              <h2 className="text-[16px] font-bold text-[#16191f]">
                Advanced details
              </h2>
              <span className="text-[13px] text-[#0073bb] font-medium hover:underline">
                {showAdvanced ? "Hide advanced details" : "Expand advanced details"}
              </span>
            </div>

            {showAdvanced && (
              <div className="pt-3 border-t border-[#eaeded] space-y-4">
                <div>
                  <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                    IAM instance profile
                  </label>
                  <select
                    value={iamInstanceProfile}
                    onChange={(e) => setIamInstanceProfile(e.target.value)}
                    className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] bg-white"
                  >
                    <option value="none">No IAM instance profile</option>
                    <option value="EC2-Admin-Role">EC2-Admin-Role</option>
                    <option value="AmazonSSMRoleForInstancesQuickSetup">AmazonSSMRoleForInstancesQuickSetup</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                      Shutdown behavior
                    </label>
                    <select
                      value={shutdownBehavior}
                      onChange={(e) => setShutdownBehavior(e.target.value as any)}
                      className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] bg-white"
                    >
                      <option value="stop">Stop</option>
                      <option value="terminate">Terminate</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                      Credit specification (T-series)
                    </label>
                    <select
                      value={creditSpecification}
                      onChange={(e) => setCreditSpecification(e.target.value as any)}
                      className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] bg-white"
                    >
                      <option value="standard">Standard</option>
                      <option value="unlimited">Unlimited</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer text-[13px] text-[#16191f]">
                    <input
                      type="checkbox"
                      checked={detailedMonitoring}
                      onChange={(e) => setDetailedMonitoring(e.target.checked)}
                      className="rounded text-[#ec7211] focus:ring-[#ec7211]"
                    />
                    <span className="font-medium">Detailed CloudWatch monitoring</span>
                  </label>
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                    User data
                  </label>
                  <textarea
                    rows={5}
                    value={userData}
                    onChange={(e) => setUserData(e.target.value)}
                    className="w-full px-3 py-2 border border-[#aab7b8] rounded-sm font-mono text-[12px] bg-[#fafafa]"
                    placeholder="#!/bin/bash&#10;# Custom shell script to run when instance boots"
                  />
                  <p className="text-[11px] text-[#545b64] mt-1">
                    Specify user data to configure an instance or run a configuration script during launch.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Sticky Summary Panel */}
        <div className="lg:col-span-1 sticky top-6 space-y-4">
          <div className="bg-white border border-[#d5dbdb] rounded-sm p-5 space-y-4 awsui-shadow">
            <h2 className="text-[17px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
              Summary
            </h2>

            <div className="space-y-3 text-[13px]">
              <div>
                <span className="text-[#545b64] text-[11px] uppercase font-semibold block">Template Name</span>
                <span className="font-semibold text-[#16191f]">{templateName || "—"}</span>
              </div>

              <div>
                <span className="text-[#545b64] text-[11px] uppercase font-semibold block">Software Image (AMI)</span>
                <span className="font-medium text-[#16191f]">{currentAmiObj.platform}</span>
                <div className="font-mono text-[11px] text-[#545b64]">{effectiveAmiId}</div>
              </div>

              <div>
                <span className="text-[#545b64] text-[11px] uppercase font-semibold block">Virtual server type</span>
                <span className="font-mono text-[#16191f] font-semibold">{selectedInstanceType}</span>
                <div className="text-[11px] text-[#545b64]">
                  {currentTypeObj.vCpu} vCPUs, {currentTypeObj.memoryGib} GiB Memory
                </div>
              </div>

              <div>
                <span className="text-[#545b64] text-[11px] uppercase font-semibold block">Firewall (Security Groups)</span>
                <span className="text-[#16191f]">
                  {selectedSecurityGroupIds.length} security group{selectedSecurityGroupIds.length !== 1 ? "s" : ""} selected
                </span>
              </div>

              <div>
                <span className="text-[#545b64] text-[11px] uppercase font-semibold block">Storage (Volume)</span>
                <span className="text-[#16191f]">
                  1 volume — {volumeSize} GiB ({volumeType})
                </span>
              </div>

              <div>
                <span className="text-[#545b64] text-[11px] uppercase font-semibold block">Key pair (login)</span>
                <span className="text-[#16191f]">{selectedKeyName !== "none" ? selectedKeyName : "None"}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-[#eaeded] space-y-2">
              <button
                type="submit"
                disabled={isPending || !templateName.trim()}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="w-full bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] disabled:opacity-50 transition-colors shadow-xs whitespace-nowrap inline-flex items-center justify-center"
              >
                {isPending ? "Creating template..." : "Create launch template"}
              </button>

              <Link
                href="/ec2/launch-templates"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="w-full border border-[#545b64] rounded-sm text-[13px] font-bold text-[#16191f] hover:bg-[#f2f3f3] whitespace-nowrap inline-flex items-center justify-center transition-colors"
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
