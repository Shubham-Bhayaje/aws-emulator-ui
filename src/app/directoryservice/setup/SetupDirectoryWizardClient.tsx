/**
 * src/app/directoryservice/setup/SetupDirectoryWizardClient.tsx – Set Up Directory Wizard.
 * Matches official AWS Directory Service console wizard.
 * Zero emojis, Cloudscape enterprise standard, strict 32px button height standard.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { VpcOption, SubnetOption, DirectoryTag } from "../types";
import { createDirectoryAction } from "../actions";

interface SetupDirectoryWizardClientProps {
  vpcs: VpcOption[];
  subnets: SubnetOption[];
}

export function SetupDirectoryWizardClient({
  vpcs,
  subnets,
}: SetupDirectoryWizardClientProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [type, setType] = useState<"SimpleAD" | "MicrosoftAD" | "ADConnector">("SimpleAD");
  const [edition, setEdition] = useState<"Standard" | "Enterprise">("Standard");
  const [size, setSize] = useState<"Small" | "Large">("Small");

  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [description, setDescription] = useState("");

  const [selectedVpcId, setSelectedVpcId] = useState(vpcs[0]?.vpcId || "");
  const [subnet1, setSubnet1] = useState("");
  const [subnet2, setSubnet2] = useState("");

  const [tags, setTags] = useState<DirectoryTag[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter subnets by chosen VPC
  const availableSubnets = subnets.filter((s) => s.vpcId === selectedVpcId);

  // Initialize subnets when VPC changes
  const handleVpcChange = (vpcId: string) => {
    setSelectedVpcId(vpcId);
    const subList = subnets.filter((s) => s.vpcId === vpcId);
    if (subList.length >= 2) {
      setSubnet1(subList[0].subnetId);
      setSubnet2(subList[1].subnetId);
    } else if (subList.length === 1) {
      setSubnet1(subList[0].subnetId);
      setSubnet2("");
    } else {
      setSubnet1("");
      setSubnet2("");
    }
  };

  if (!subnet1 && availableSubnets.length >= 2 && !subnet2) {
    setSubnet1(availableSubnets[0].subnetId);
    setSubnet2(availableSubnets[1].subnetId);
  }

  const handleAddTag = () => {
    setTags((prev) => [...prev, { Key: "", Value: "" }]);
  };

  const handleRemoveTag = (index: number) => {
    setTags((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTagChange = (index: number, field: "Key" | "Value", val: string) => {
    setTags((prev) => {
      const next = [...prev];
      next[index][field] = val;
      return next;
    });
  };

  const validateStep2 = () => {
    if (!name.trim()) {
      setError("Directory DNS name is required.");
      return false;
    }
    if (!password) {
      setError("Administrator password is required.");
      return false;
    }
    if (password.length < 8) {
      setError("Administrator password must be at least 8 characters.");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return false;
    }
    setError(null);
    return true;
  };

  const validateStep3 = () => {
    if (!selectedVpcId) {
      setError("A VPC is required.");
      return false;
    }
    if (!subnet1 || !subnet2) {
      setError("Directory Service requires exactly two subnets in two different Availability Zones.");
      return false;
    }
    if (subnet1 === subnet2) {
      setError("Subnets must be in different Availability Zones.");
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const validTags = tags.filter((t) => t.Key.trim() !== "");
      const res = await createDirectoryAction({
        type,
        name: name.trim(),
        shortName: shortName.trim() || undefined,
        password,
        description: description.trim() || undefined,
        size: type !== "MicrosoftAD" ? size : undefined,
        edition: type === "MicrosoftAD" ? edition : undefined,
        vpcId: selectedVpcId,
        subnetIds: [subnet1, subnet2],
        tags: validTags.length > 0 ? validTags : undefined,
      });

      if (res.success && res.directoryId) {
        router.push(`/directoryservice/directories/${res.directoryId}`);
      } else {
        setError(res.error || "Failed to set up directory");
        setIsSubmitting(false);
      }
    } catch (err: unknown) {
      setError(String(err));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Breadcrumb */}
      <div className="text-[12px] text-[#545b64]">
        <Link href="/directoryservice" className="hover:underline text-[#0972d3]">
          Directory Service
        </Link>{" "}
        &gt;{" "}
        <Link href="/directoryservice" className="hover:underline text-[#0972d3]">
          Directories
        </Link>{" "}
        &gt; <span className="font-bold text-[#16191f]">Set up directory</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-[24px] font-bold text-[#16191f]">Set up directory</h1>
        <p className="text-[13px] text-[#545b64] mt-0.5">
          Choose the directory type and configure settings for your new directory.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded border bg-[#fdf2f2] border-[#d13212] text-[#900] text-[13px] flex items-start justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="font-bold ml-4">
            &times;
          </button>
        </div>
      )}

      {/* Step Indicators */}
      <div className="flex border-b border-[#eaeded]">
        {[
          { step: 1, label: "1. Directory type" },
          { step: 2, label: "2. Directory details" },
          { step: 3, label: "3. Network & VPC" },
          { step: 4, label: "4. Review & create" },
        ].map((s) => (
          <button
            key={s.step}
            type="button"
            onClick={() => {
              if (s.step === 2 && !validateStep2()) return;
              if (s.step === 3 && !validateStep3()) return;
              setCurrentStep(s.step);
            }}
            className={`py-2 px-4 text-[13px] font-medium border-b-2 -mb-[1px] transition-colors ${
              currentStep === s.step
                ? "border-[#ec7211] text-[#ec7211] font-bold"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Step 1: Directory type */}
      {currentStep === 1 && (
        <div className="bg-white border border-[#eaeded] rounded p-6 space-y-6">
          <div>
            <h2 className="text-[16px] font-bold text-[#16191f] mb-1">Select directory type</h2>
            <p className="text-[12px] text-[#545b64] mb-4">
              Choose the directory type that best fits your workload and application integration needs.
            </p>
            <div className="space-y-4">
              {/* Simple AD */}
              <label
                className={`flex items-start gap-3 p-4 border rounded cursor-pointer transition-colors ${
                  type === "SimpleAD" ? "border-[#0972d3] bg-[#f2f8fd]" : "border-[#eaeded] hover:bg-[#fafafa]"
                }`}
              >
                <input
                  type="radio"
                  name="directoryType"
                  value="SimpleAD"
                  checked={type === "SimpleAD"}
                  onChange={() => setType("SimpleAD")}
                  className="mt-1 text-[#0972d3] focus:ring-0"
                />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] font-bold text-[#16191f]">Simple AD (Recommended for local dev)</span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#edf7ed] text-[#1e4620]">
                      Samba-compatible
                    </span>
                  </div>
                  <p className="text-[12px] text-[#545b64]">
                    Powered by Samba 4, Simple AD provides basic Active Directory-compatible features such as user accounts, group policies, and Kerberos authentication for low cost.
                  </p>
                  {type === "SimpleAD" && (
                    <div className="pt-2 border-t border-[#eaeded] flex items-center gap-4">
                      <span className="text-[12px] font-bold text-[#16191f]">Directory size:</span>
                      <label className="flex items-center gap-1.5 text-[12px]">
                        <input
                          type="radio"
                          name="simpleAdSize"
                          value="Small"
                          checked={size === "Small"}
                          onChange={() => setSize("Small")}
                        />
                        Small (Up to 500 users)
                      </label>
                      <label className="flex items-center gap-1.5 text-[12px]">
                        <input
                          type="radio"
                          name="simpleAdSize"
                          value="Large"
                          checked={size === "Large"}
                          onChange={() => setSize("Large")}
                        />
                        Large (Up to 5,000 users)
                      </label>
                    </div>
                  )}
                </div>
              </label>

              {/* AWS Managed Microsoft AD */}
              <label
                className={`flex items-start gap-3 p-4 border rounded cursor-pointer transition-colors ${
                  type === "MicrosoftAD" ? "border-[#0972d3] bg-[#f2f8fd]" : "border-[#eaeded] hover:bg-[#fafafa]"
                }`}
              >
                <input
                  type="radio"
                  name="directoryType"
                  value="MicrosoftAD"
                  checked={type === "MicrosoftAD"}
                  onChange={() => setType("MicrosoftAD")}
                  className="mt-1 text-[#0972d3] focus:ring-0"
                />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] font-bold text-[#16191f]">AWS Managed Microsoft AD</span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#f1faff] text-[#004a80]">
                      Enterprise AD
                    </span>
                  </div>
                  <p className="text-[12px] text-[#545b64]">
                    Actual Microsoft Active Directory running on Windows Server domain controllers managed by AWS. Supports trust relationships, fine-grained password policies, and multi-region replication.
                  </p>
                  {type === "MicrosoftAD" && (
                    <div className="pt-2 border-t border-[#eaeded] flex items-center gap-4">
                      <span className="text-[12px] font-bold text-[#16191f]">Edition:</span>
                      <label className="flex items-center gap-1.5 text-[12px]">
                        <input
                          type="radio"
                          name="msAdEdition"
                          value="Standard"
                          checked={edition === "Standard"}
                          onChange={() => setEdition("Standard")}
                        />
                        Standard Edition (Up to 30,000 directory objects)
                      </label>
                      <label className="flex items-center gap-1.5 text-[12px]">
                        <input
                          type="radio"
                          name="msAdEdition"
                          value="Enterprise"
                          checked={edition === "Enterprise"}
                          onChange={() => setEdition("Enterprise")}
                        />
                        Enterprise Edition (Up to 500,000 directory objects)
                      </label>
                    </div>
                  )}
                </div>
              </label>

              {/* AD Connector */}
              <label
                className={`flex items-start gap-3 p-4 border rounded cursor-pointer transition-colors ${
                  type === "ADConnector" ? "border-[#0972d3] bg-[#f2f8fd]" : "border-[#eaeded] hover:bg-[#fafafa]"
                }`}
              >
                <input
                  type="radio"
                  name="directoryType"
                  value="ADConnector"
                  checked={type === "ADConnector"}
                  onChange={() => setType("ADConnector")}
                  className="mt-1 text-[#0972d3] focus:ring-0"
                />
                <div className="flex-1 space-y-1">
                  <span className="text-[14px] font-bold text-[#16191f]">AD Connector</span>
                  <p className="text-[12px] text-[#545b64]">
                    A proxy gateway for redirecting directory requests to your existing on-premises Active Directory without caching credentials in the cloud.
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-[#eaeded]">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] px-5 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Directory details */}
      {currentStep === 2 && (
        <div className="bg-white border border-[#eaeded] rounded p-6 space-y-6">
          <div>
            <h2 className="text-[16px] font-bold text-[#16191f] mb-1">Directory information</h2>
            <p className="text-[12px] text-[#545b64] mb-4">
              Configure DNS and administrative credentials for your directory.
            </p>

            <div className="space-y-4 max-w-xl">
              <div className="space-y-1">
                <label className="text-[12px] font-bold text-[#16191f]">Directory DNS name:</label>
                <input
                  type="text"
                  placeholder="e.g. corp.example.com"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!shortName && e.target.value.includes(".")) {
                      setShortName(e.target.value.split(".")[0].toUpperCase().slice(0, 15));
                    }
                  }}
                  className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3] font-mono"
                />
                <span className="text-[11px] text-[#545b64]">A fully qualified domain name (FQDN).</span>
              </div>

              <div className="space-y-1">
                <label className="text-[12px] font-bold text-[#16191f]">Directory NetBIOS name (optional):</label>
                <input
                  type="text"
                  placeholder="e.g. CORP"
                  maxLength={15}
                  value={shortName}
                  onChange={(e) => setShortName(e.target.value.toUpperCase())}
                  className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3] font-mono"
                />
                <span className="text-[11px] text-[#545b64]">Short name used by pre-Windows 2000 clients (up to 15 characters).</span>
              </div>

              <div className="space-y-1">
                <label className="text-[12px] font-bold text-[#16191f]">Administrator password:</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3]"
                />
                <span className="text-[11px] text-[#545b64]">
                  8-64 characters with 3 of: uppercase, lowercase, numbers, symbols.
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-[12px] font-bold text-[#16191f]">Confirm password:</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[12px] font-bold text-[#16191f]">Description (optional):</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Corporate development directory"
                  maxLength={128}
                  className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3]"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-[#eaeded]">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3]"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => {
                if (validateStep2()) setCurrentStep(3);
              }}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] px-5 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Network & VPC */}
      {currentStep === 3 && (
        <div className="bg-white border border-[#eaeded] rounded p-6 space-y-6">
          <div>
            <h2 className="text-[16px] font-bold text-[#16191f] mb-1">VPC and subnets</h2>
            <p className="text-[12px] text-[#545b64] mb-4">
              Select the VPC and two subnets in different Availability Zones to host your domain controllers.
            </p>

            <div className="space-y-4 max-w-xl">
              <div className="space-y-1">
                <label className="text-[12px] font-bold text-[#16191f]">VPC:</label>
                <select
                  value={selectedVpcId}
                  onChange={(e) => handleVpcChange(e.target.value)}
                  className="w-full text-[13px] px-3 py-2 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3] bg-white font-mono"
                >
                  {vpcs.map((v) => (
                    <option key={v.vpcId} value={v.vpcId}>
                      {v.vpcId} {v.name && v.name !== v.vpcId ? `(${v.name})` : ""} {v.cidrBlock ? `- ${v.cidrBlock}` : ""}{" "}
                      {v.isDefault ? "[Default]" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <label className="text-[12px] font-bold text-[#16191f]">Subnet 1 (AZ 1):</label>
                  <select
                    value={subnet1}
                    onChange={(e) => setSubnet1(e.target.value)}
                    className="w-full text-[13px] px-3 py-2 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3] bg-white font-mono"
                  >
                    {availableSubnets.map((s) => (
                      <option key={s.subnetId} value={s.subnetId}>
                        {s.subnetId} ({s.availabilityZone})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[12px] font-bold text-[#16191f]">Subnet 2 (AZ 2):</label>
                  <select
                    value={subnet2}
                    onChange={(e) => setSubnet2(e.target.value)}
                    className="w-full text-[13px] px-3 py-2 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3] bg-white font-mono"
                  >
                    {availableSubnets.map((s) => (
                      <option key={s.subnetId} value={s.subnetId}>
                        {s.subnetId} ({s.availabilityZone})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-[#eaeded] pt-6">
            <h2 className="text-[16px] font-bold text-[#16191f] mb-1">Tags (optional)</h2>
            <p className="text-[12px] text-[#545b64] mb-3">
              Add key-value metadata tags to your directory resource.
            </p>
            {tags.length > 0 && (
              <div className="space-y-2 mb-3">
                {tags.map((t, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Key"
                      value={t.Key}
                      onChange={(e) => handleTagChange(idx, "Key", e.target.value)}
                      className="text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded w-1/3"
                    />
                    <input
                      type="text"
                      placeholder="Value"
                      value={t.Value}
                      onChange={(e) => handleTagChange(idx, "Value", e.target.value)}
                      className="text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded w-1/2"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(idx)}
                      style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                      className="px-3 text-[12px] text-[#d13212] border border-[#d13212] rounded hover:bg-[#fdf2f2]"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={handleAddTag}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3]"
            >
              Add tag
            </button>
          </div>

          <div className="flex justify-between pt-4 border-t border-[#eaeded]">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3]"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => {
                if (validateStep3()) setCurrentStep(4);
              }}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] px-5 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Review & create */}
      {currentStep === 4 && (
        <div className="bg-white border border-[#eaeded] rounded p-6 space-y-6">
          <div>
            <h2 className="text-[18px] font-bold text-[#16191f] mb-4">Review directory configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-[#eaeded] rounded bg-[#fafafa] space-y-2">
                <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wider">Directory Type & Details</div>
                <div className="text-[13px]"><span className="text-[#545b64]">Type:</span> <strong>{type}</strong></div>
                {type === "MicrosoftAD" && (
                  <div className="text-[13px]"><span className="text-[#545b64]">Edition:</span> <strong>{edition}</strong></div>
                )}
                {type !== "MicrosoftAD" && (
                  <div className="text-[13px]"><span className="text-[#545b64]">Size:</span> <strong>{size}</strong></div>
                )}
                <div className="text-[13px]"><span className="text-[#545b64]">DNS name:</span> <strong className="font-mono">{name}</strong></div>
                {shortName && (
                  <div className="text-[13px]"><span className="text-[#545b64]">NetBIOS name:</span> <strong className="font-mono">{shortName}</strong></div>
                )}
              </div>
              <div className="p-4 border border-[#eaeded] rounded bg-[#fafafa] space-y-2">
                <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wider">Network & VPC</div>
                <div className="text-[13px]"><span className="text-[#545b64]">VPC:</span> <strong className="font-mono">{selectedVpcId}</strong></div>
                <div className="text-[13px]"><span className="text-[#545b64]">Subnet 1:</span> <span className="font-mono">{subnet1}</span></div>
                <div className="text-[13px]"><span className="text-[#545b64]">Subnet 2:</span> <span className="font-mono">{subnet2}</span></div>
              </div>
            </div>
          </div>

          <div className="p-3 border border-[#0073bb] bg-[#f1faff] rounded text-[12px] text-[#004a80]">
            When you create your directory, AWS provisions domain controllers across two Availability Zones for high availability.
          </div>

          <div className="flex justify-between pt-4 border-t border-[#eaeded]">
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              disabled={isSubmitting}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3]"
            >
              Previous
            </button>
            <div className="flex items-center gap-2">
              <Link
                href="/directoryservice"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3]"
              >
                Cancel
              </Link>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-5 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] disabled:opacity-50"
              >
                {isSubmitting ? "Setting up directory..." : "Set up directory"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
