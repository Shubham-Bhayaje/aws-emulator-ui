/**
 * src/app/cloudhsm/create/CreateClusterWizardClient.tsx – Create Cluster Wizard.
 * Matches official AWS CloudHSM console wizard.
 * Zero emojis, Cloudscape enterprise standard, strict 32px button height standard.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { VpcOption, SubnetOption, ClusterMode } from "../types";
import { createClusterAction } from "../actions";

interface CreateClusterWizardClientProps {
  vpcs: VpcOption[];
  subnets: SubnetOption[];
}

export function CreateClusterWizardClient({
  vpcs,
  subnets,
}: CreateClusterWizardClientProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [mode, setMode] = useState<ClusterMode>("FIPS");
  const [hsmType, setHsmType] = useState("hsm2m.medium");
  const [selectedVpcId, setSelectedVpcId] = useState<string>(vpcs[0]?.vpcId || "");
  const [selectedSubnetIds, setSelectedSubnetIds] = useState<Record<string, string>>({}); // { [az]: subnetId }
  const [retentionDays, setRetentionDays] = useState(90);
  const [tags, setTags] = useState<Array<{ Key: string; Value: string }>>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Available subnets for the chosen VPC
  const availableSubnets = subnets.filter((s) => s.vpcId === selectedVpcId);

  // Auto-select first subnet per AZ if none selected yet
  const handleVpcChange = (vpcId: string) => {
    setSelectedVpcId(vpcId);
    const newSubnets = subnets.filter((s) => s.vpcId === vpcId);
    const initialMap: Record<string, string> = {};
    for (const sub of newSubnets) {
      if (!initialMap[sub.availabilityZone]) {
        initialMap[sub.availabilityZone] = sub.subnetId;
      }
    }
    setSelectedSubnetIds(initialMap);
  };

  const handleSubnetToggle = (az: string, subnetId: string) => {
    setSelectedSubnetIds((prev) => {
      const next = { ...prev };
      if (next[az] === subnetId) {
        delete next[az];
      } else {
        next[az] = subnetId;
      }
      return next;
    });
  };

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

  const selectedSubnetList = Object.values(selectedSubnetIds);

  const handleSubmit = async () => {
    if (selectedSubnetList.length === 0) {
      setError("Please select at least one subnet for your cluster.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const validTags = tags.filter((t) => t.Key.trim() !== "");
      const res = await createClusterAction({
        hsmType,
        subnetIds: selectedSubnetList,
        mode,
        backupRetentionPolicyDays: retentionDays,
        tagList: validTags.length > 0 ? validTags : undefined,
      });

      if (res.success && res.cluster) {
        router.push(`/cloudhsm/clusters/${res.cluster.clusterId}`);
      } else {
        setError(res.error || "Failed to create cluster");
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
        <Link href="/cloudhsm" className="hover:underline text-[#0972d3]">
          CloudHSM
        </Link>{" "}
        &gt;{" "}
        <Link href="/cloudhsm" className="hover:underline text-[#0972d3]">
          Clusters
        </Link>{" "}
        &gt; <span className="font-bold text-[#16191f]">Create cluster</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-[24px] font-bold text-[#16191f]">Create cluster</h1>
        <p className="text-[13px] text-[#545b64] mt-0.5">
          Choose the configuration for your new AWS CloudHSM cluster.
        </p>
      </div>

      {/* Error alert */}
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
          { step: 1, label: "1. Cluster details" },
          { step: 2, label: "2. Network & VPC" },
          { step: 3, label: "3. Backup retention" },
          { step: 4, label: "4. Review & create" },
        ].map((s) => (
          <button
            key={s.step}
            type="button"
            onClick={() => setCurrentStep(s.step)}
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

      {/* Step 1: Cluster details */}
      {currentStep === 1 && (
        <div className="bg-white border border-[#eaeded] rounded p-6 space-y-6">
          <div>
            <h2 className="text-[16px] font-bold text-[#16191f] mb-1">Cluster mode</h2>
            <p className="text-[12px] text-[#545b64] mb-3">
              FIPS mode validates HSM cryptographic algorithms and security according to FIPS 140-2 Level 3.
            </p>
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-3 border border-[#eaeded] rounded cursor-pointer hover:bg-[#fafafa]">
                <input
                  type="radio"
                  name="clusterMode"
                  value="FIPS"
                  checked={mode === "FIPS"}
                  onChange={() => setMode("FIPS")}
                  className="mt-0.5 text-[#0972d3] focus:ring-0"
                />
                <div>
                  <div className="text-[13px] font-bold text-[#16191f]">FIPS mode (Default)</div>
                  <div className="text-[12px] text-[#545b64]">
                    Cryptographic operations comply with FIPS 140-2 Level 3 standards.
                  </div>
                </div>
              </label>
              <label className="flex items-start gap-3 p-3 border border-[#eaeded] rounded cursor-pointer hover:bg-[#fafafa]">
                <input
                  type="radio"
                  name="clusterMode"
                  value="NON_FIPS"
                  checked={mode === "NON_FIPS"}
                  onChange={() => setMode("NON_FIPS")}
                  className="mt-0.5 text-[#0972d3] focus:ring-0"
                />
                <div>
                  <div className="text-[13px] font-bold text-[#16191f]">Non-FIPS mode</div>
                  <div className="text-[12px] text-[#545b64]">
                    Standard operational mode without strict FIPS 140-2 validation.
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div className="border-t border-[#eaeded] pt-6">
            <h2 className="text-[16px] font-bold text-[#16191f] mb-1">HSM type</h2>
            <p className="text-[12px] text-[#545b64] mb-3">
              Select the hardware security module instance type for the cluster.
            </p>
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-3 border border-[#eaeded] rounded cursor-pointer hover:bg-[#fafafa]">
                <input
                  type="radio"
                  name="hsmType"
                  value="hsm2m.medium"
                  checked={hsmType === "hsm2m.medium"}
                  onChange={() => setHsmType("hsm2m.medium")}
                  className="mt-0.5 text-[#0972d3] focus:ring-0"
                />
                <div>
                  <div className="text-[13px] font-bold text-[#16191f]">hsm2m.medium (Recommended)</div>
                  <div className="text-[12px] text-[#545b64]">
                    Supported by the local emulator engine. Dedicated hardware security module instance.
                  </div>
                </div>
              </label>
              <label className="flex items-start gap-3 p-3 border border-[#eaeded] rounded cursor-pointer hover:bg-[#fafafa]">
                <input
                  type="radio"
                  name="hsmType"
                  value="hsm1.medium"
                  checked={hsmType === "hsm1.medium"}
                  onChange={() => setHsmType("hsm1.medium")}
                  className="mt-0.5 text-[#0972d3] focus:ring-0"
                />
                <div>
                  <div className="text-[13px] font-bold text-[#16191f]">hsm1.medium</div>
                  <div className="text-[12px] text-[#545b64]">
                    Legacy CloudHSM hardware instance type.
                  </div>
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

      {/* Step 2: Network & VPC */}
      {currentStep === 2 && (
        <div className="bg-white border border-[#eaeded] rounded p-6 space-y-6">
          <div>
            <h2 className="text-[16px] font-bold text-[#16191f] mb-1">VPC</h2>
            <p className="text-[12px] text-[#545b64] mb-3">
              Select the Amazon Virtual Private Cloud (VPC) where your CloudHSM cluster will reside.
            </p>
            {vpcs.length === 0 ? (
              <div className="p-4 rounded border border-[#eaeded] bg-[#fafafa] text-center space-y-2">
                <div className="text-[13px] text-[#545b64]">No VPCs found in this AWS Region.</div>
                <Link
                  href="/vpc"
                  className="text-[13px] text-[#0972d3] font-bold hover:underline"
                >
                  Create a VPC in Amazon VPC console
                </Link>
              </div>
            ) : (
              <select
                value={selectedVpcId}
                onChange={(e) => handleVpcChange(e.target.value)}
                className="w-full text-[13px] px-3 py-2 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3] bg-white font-mono"
              >
                {vpcs.map((v) => (
                  <option key={v.vpcId} value={v.vpcId}>
                    {v.vpcId} {v.name && v.name !== v.vpcId ? `(${v.name})` : ""} {v.cidrBlock ? `- ${v.cidrBlock}` : ""}{" "}
                    {v.isDefault ? "[Default VPC]" : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="border-t border-[#eaeded] pt-6">
            <h2 className="text-[16px] font-bold text-[#16191f] mb-1">Subnets</h2>
            <p className="text-[12px] text-[#545b64] mb-3">
              Select one subnet per Availability Zone. CloudHSM creates an Elastic Network Interface (ENI) in the subnets you choose when provisioning HSMs.
            </p>
            {availableSubnets.length === 0 ? (
              <div className="p-4 rounded border border-[#eaeded] bg-[#fafafa] text-[13px] text-[#545b64]">
                No subnets available in selected VPC.
              </div>
            ) : (
              <div className="border border-[#eaeded] rounded overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#fafafa] border-b border-[#eaeded] text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                      <th className="py-2.5 px-4 w-12 text-center">Select</th>
                      <th className="py-2.5 px-4">Availability Zone</th>
                      <th className="py-2.5 px-4">Subnet ID</th>
                      <th className="py-2.5 px-4">IPv4 CIDR</th>
                      <th className="py-2.5 px-4 text-center">Available IPs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eaeded] text-[13px]">
                    {availableSubnets.map((sub) => {
                      const isChecked = selectedSubnetIds[sub.availabilityZone] === sub.subnetId;
                      return (
                        <tr
                          key={sub.subnetId}
                          onClick={() => handleSubnetToggle(sub.availabilityZone, sub.subnetId)}
                          className={`cursor-pointer hover:bg-[#f2f8fd] ${
                            isChecked ? "bg-[#e7f2fa]" : ""
                          }`}
                        >
                          <td className="py-2.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleSubnetToggle(sub.availabilityZone, sub.subnetId)}
                              className="h-4 w-4 text-[#0972d3] border-gray-300 rounded focus:ring-0 cursor-pointer"
                            />
                          </td>
                          <td className="py-2.5 px-4 font-mono font-medium">{sub.availabilityZone}</td>
                          <td className="py-2.5 px-4 font-mono text-[#0972d3]">{sub.subnetId}</td>
                          <td className="py-2.5 px-4 font-mono text-[#545b64]">{sub.cidrBlock || "-"}</td>
                          <td className="py-2.5 px-4 text-center text-[#545b64]">
                            {sub.availableIpAddressCount !== undefined ? sub.availableIpAddressCount : "4091"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <div className="mt-2 text-[12px] text-[#545b64]">
              Selected {selectedSubnetList.length} subnet(s) across {Object.keys(selectedSubnetIds).length} Availability Zone(s).
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
                if (selectedSubnetList.length === 0) {
                  setError("Please select at least one subnet.");
                  return;
                }
                setError(null);
                setCurrentStep(3);
              }}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] px-5 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Backup retention */}
      {currentStep === 3 && (
        <div className="bg-white border border-[#eaeded] rounded p-6 space-y-6">
          <div>
            <h2 className="text-[16px] font-bold text-[#16191f] mb-1">Backup retention policy</h2>
            <p className="text-[12px] text-[#545b64] mb-3">
              CloudHSM creates automated daily backups of your cluster. Specify the number of days backups are retained before being deleted automatically.
            </p>
            <div className="max-w-xs space-y-1">
              <label className="text-[12px] font-bold text-[#16191f]">Retention period (days):</label>
              <input
                type="number"
                min={7}
                max={379}
                value={retentionDays}
                onChange={(e) => setRetentionDays(parseInt(e.target.value) || 90)}
                className="w-full text-[13px] px-3 py-2 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3]"
              />
              <span className="text-[11px] text-[#545b64]">Between 7 and 379 days (default is 90 days).</span>
            </div>
          </div>

          <div className="border-t border-[#eaeded] pt-6">
            <h2 className="text-[16px] font-bold text-[#16191f] mb-1">Tags (optional)</h2>
            <p className="text-[12px] text-[#545b64] mb-3">
              A tag is a label that you assign to an AWS resource. Each tag consists of a key and an optional value.
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
              onClick={() => setCurrentStep(4)}
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
            <h2 className="text-[18px] font-bold text-[#16191f] mb-4">Review cluster configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-[#eaeded] rounded bg-[#fafafa] space-y-2">
                <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wider">Cluster Details</div>
                <div className="text-[13px]"><span className="text-[#545b64]">Mode:</span> <strong>{mode}</strong></div>
                <div className="text-[13px]"><span className="text-[#545b64]">HSM Type:</span> <strong>{hsmType}</strong></div>
                <div className="text-[13px]"><span className="text-[#545b64]">Backup Retention:</span> <strong>{retentionDays} days</strong></div>
              </div>
              <div className="p-4 border border-[#eaeded] rounded bg-[#fafafa] space-y-2">
                <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wider">Network & VPC</div>
                <div className="text-[13px]"><span className="text-[#545b64]">VPC:</span> <strong>{selectedVpcId}</strong></div>
                <div className="text-[13px]"><span className="text-[#545b64]">Selected Subnets:</span> <strong>{selectedSubnetList.length}</strong></div>
                <div className="text-[12px] font-mono text-[#545b64]">
                  {selectedSubnetList.join(", ")}
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 border border-[#0073bb] bg-[#f1faff] rounded text-[12px] text-[#004a80]">
            When you create a cluster, AWS CloudHSM provisions the cluster in your VPC. After creation, you will add one or more HSMs and initialize the cluster with your issuing CA.
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
                href="/cloudhsm"
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
                {isSubmitting ? "Creating cluster..." : "Create cluster"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
