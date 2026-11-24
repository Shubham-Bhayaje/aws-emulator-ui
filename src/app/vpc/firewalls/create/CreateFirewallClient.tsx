"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createLiveFirewall } from "../../network-firewall-actions";
import EmulatorOfflineBanner from "@/components/EmulatorOfflineBanner";

interface Props {
  vpcs: Array<{ id: string; name: string; cidr: string; isDefault: boolean }>;
  subnets: Array<{ id: string; vpcId: string; az: string; cidr: string; name: string }>;
  policies: Array<{ name: string; arn: string }>;
  kmsKeys: Array<{ keyId: string; alias: string }>;
}

export default function CreateFirewallClient({ vpcs, subnets, policies, kmsKeys }: Props) {
  const router = useRouter();

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedVpcId, setSelectedVpcId] = useState(vpcs[0]?.id || "");
  const [selectedPolicyArn, setSelectedPolicyArn] = useState(policies[0]?.arn || "");
  const [selectedSubnetIds, setSelectedSubnetIds] = useState<string[]>([]);
  const [deleteProtection, setDeleteProtection] = useState(false);
  const [subnetChangeProtection, setSubnetChangeProtection] = useState(false);
  const [policyChangeProtection, setPolicyChangeProtection] = useState(false);
  const [encryptionType, setEncryptionType] = useState<"AWS_OWNED" | "CUSTOMER_KMS">("AWS_OWNED");
  const [selectedKmsKeyId, setSelectedKmsKeyId] = useState(kmsKeys[0]?.keyId || "");
  const [tags, setTags] = useState<Array<{ key: string; value: string }>>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter subnets by selected VPC
  const availableSubnets = subnets.filter((s) => s.vpcId === selectedVpcId);

  function toggleSubnet(subnetId: string) {
    setSelectedSubnetIds((prev) =>
      prev.includes(subnetId) ? prev.filter((id) => id !== subnetId) : [...prev, subnetId]
    );
  }

  function addTag() {
    setTags((prev) => [...prev, { key: "", value: "" }]);
  }

  function updateTag(index: number, field: "key" | "value", val: string) {
    setTags((prev) => {
      const copy = [...prev];
      copy[index][field] = val;
      return copy;
    });
  }

  function removeTag(index: number) {
    setTags((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Firewall name is required.");
      return;
    }
    if (!selectedVpcId) {
      setError("Please select a VPC.");
      return;
    }
    if (!selectedPolicyArn) {
      setError("Please select a Firewall Policy. If none exists, create one in Firewall policies.");
      return;
    }
    if (selectedSubnetIds.length === 0) {
      setError("Please select at least one subnet for your firewall endpoint.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await createLiveFirewall({
        name: name.trim(),
        description: description.trim() || undefined,
        vpcId: selectedVpcId,
        policyArn: selectedPolicyArn,
        subnetMappings: selectedSubnetIds.map((id) => ({ subnetId: id })),
        deleteProtection,
        subnetChangeProtection,
        policyChangeProtection,
        kmsKeyId: encryptionType === "CUSTOMER_KMS" ? selectedKmsKeyId : undefined,
        tags: tags.filter((t) => t.key.trim()),
      });

      if (res.success && res.firewall) {
        router.push(`/vpc/firewalls/${res.firewall.FirewallName}`);
      } else {
        setError(res.error || "Failed to create firewall.");
        setIsSubmitting(false);
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-[1000px]">
      {/* Breadcrumb & Title */}
      <div className="border-b border-[#eaeded] pb-4">
        <div className="text-[12px] text-[#545b64] mb-1 flex items-center gap-1.5">
          <Link href="/vpc" className="hover:underline">VPC</Link>
          <span>&rsaquo;</span>
          <Link href="/vpc/firewalls" className="hover:underline">Firewalls</Link>
          <span>&rsaquo;</span>
          <span className="text-[#16191f]">Create firewall</span>
        </div>
        <h1 className="text-[22px] font-bold text-[#16191f]">Create firewall</h1>
        <p className="text-[13px] text-[#545b64] mt-0.5">
          Configure and deploy a managed network firewall to inspect and filter VPC traffic.
        </p>
      </div>

      {error && <EmulatorOfflineBanner error={error} />}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Firewall details */}
        <div className="bg-white border border-[#d5dbdb] rounded-sm p-5 space-y-4 shadow-xs">
          <h2 className="text-[16px] font-bold text-[#16191f]">Firewall details</h2>

          <div>
            <label className="block text-[13px] font-bold text-[#16191f] mb-1">
              Firewall name <span className="text-[#d13212]">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. production-perimeter-firewall"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full max-w-[480px] px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded-sm text-[#16191f] focus:border-[#0073bb] outline-hidden"
            />
            <p className="text-[12px] text-[#545b64] mt-1">
              Up to 128 characters (letters, numbers, hyphens, and underscores).
            </p>
          </div>

          <div>
            <label className="block text-[13px] font-bold text-[#16191f] mb-1">
              Description <span className="text-[#545b64] font-normal">- optional</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Inspects ingress and egress perimeter VPC traffic"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full max-w-[480px] px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded-sm text-[#16191f] focus:border-[#0073bb] outline-hidden"
            />
          </div>

          <div>
            <label className="block text-[13px] font-bold text-[#16191f] mb-1">
              VPC <span className="text-[#d13212]">*</span>
            </label>
            {vpcs.length === 0 ? (
              <div className="p-3 bg-[#fdf3f1] border border-[#f5b8b0] text-[13px] text-[#d13212] rounded-sm max-w-[480px]">
                No VPCs found in this Region. <Link href="/vpc/vpcs" className="underline font-bold">Create a VPC first</Link>.
              </div>
            ) : (
              <select
                value={selectedVpcId}
                onChange={(e) => {
                  setSelectedVpcId(e.target.value);
                  setSelectedSubnetIds([]);
                }}
                className="w-full max-w-[480px] px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded-sm text-[#16191f] bg-white focus:border-[#0073bb] outline-hidden"
              >
                {vpcs.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.id} {v.name && v.name !== v.id ? `(${v.name})` : ""} - {v.cidr} {v.isDefault ? "[Default]" : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-[13px] font-bold text-[#16191f] mb-1">
              Firewall policy <span className="text-[#d13212]">*</span>
            </label>
            {policies.length === 0 ? (
              <div className="p-3 bg-[#fdf3f1] border border-[#f5b8b0] text-[13px] text-[#d13212] rounded-sm max-w-[480px]">
                No firewall policies found.{" "}
                <Link href="/vpc/firewall-policies/create" className="underline font-bold">
                  Create a firewall policy first
                </Link>.
              </div>
            ) : (
              <select
                value={selectedPolicyArn}
                onChange={(e) => setSelectedPolicyArn(e.target.value)}
                className="w-full max-w-[480px] px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded-sm text-[#16191f] bg-white focus:border-[#0073bb] outline-hidden"
              >
                {policies.map((p) => (
                  <option key={p.arn} value={p.arn}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Step 2: Subnet mappings */}
        <div className="bg-white border border-[#d5dbdb] rounded-sm p-5 space-y-4 shadow-xs">
          <div>
            <h2 className="text-[16px] font-bold text-[#16191f]">Firewall subnet mappings</h2>
            <p className="text-[13px] text-[#545b64] mt-0.5">
              Select one subnet for each Availability Zone where you want to deploy a firewall endpoint. Network Firewall provisions a VPC endpoint in each chosen subnet.
            </p>
          </div>

          {availableSubnets.length === 0 ? (
            <div className="p-4 bg-[#fafafa] border border-[#eaeded] rounded-sm text-center text-[#545b64] text-[13px]">
              No subnets found for the selected VPC ({selectedVpcId}).
            </div>
          ) : (
            <div className="border border-[#eaeded] rounded-sm overflow-hidden">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64]">
                  <tr>
                    <th className="w-10 px-3 py-2"></th>
                    <th className="px-3 py-2">Subnet ID</th>
                    <th className="px-3 py-2">Availability Zone</th>
                    <th className="px-3 py-2">IPv4 CIDR</th>
                    <th className="px-3 py-2">Subnet Name</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeded]">
                  {availableSubnets.map((sub) => {
                    const isChecked = selectedSubnetIds.includes(sub.id);
                    return (
                      <tr
                        key={sub.id}
                        className={`hover:bg-[#fbfbfb] cursor-pointer ${isChecked ? "bg-[#f2f8fc]" : ""}`}
                        onClick={() => toggleSubnet(sub.id)}
                      >
                        <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSubnet(sub.id)}
                            className="accent-[#0073bb]"
                          />
                        </td>
                        <td className="px-3 py-2 font-mono font-medium text-[#0073bb]">{sub.id}</td>
                        <td className="px-3 py-2">{sub.az}</td>
                        <td className="px-3 py-2 font-mono text-[12px]">{sub.cidr}</td>
                        <td className="px-3 py-2 text-[#545b64]">{sub.name || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Step 3: Protections & Encryption */}
        <div className="bg-white border border-[#d5dbdb] rounded-sm p-5 space-y-4 shadow-xs">
          <h2 className="text-[16px] font-bold text-[#16191f]">Protections and Encryption</h2>

          <div className="space-y-3">
            <label className="flex items-start gap-2 cursor-pointer text-[13px] text-[#16191f]">
              <input
                type="checkbox"
                checked={deleteProtection}
                onChange={(e) => setDeleteProtection(e.target.checked)}
                className="mt-0.5 accent-[#0073bb]"
              />
              <div>
                <span className="font-semibold">Delete protection</span>
                <p className="text-[12px] text-[#545b64]">Prevents the firewall from being deleted accidentally.</p>
              </div>
            </label>

            <label className="flex items-start gap-2 cursor-pointer text-[13px] text-[#16191f]">
              <input
                type="checkbox"
                checked={subnetChangeProtection}
                onChange={(e) => setSubnetChangeProtection(e.target.checked)}
                className="mt-0.5 accent-[#0073bb]"
              />
              <div>
                <span className="font-semibold">Subnet change protection</span>
                <p className="text-[12px] text-[#545b64]">Prevents changes to the firewall subnet mappings.</p>
              </div>
            </label>

            <label className="flex items-start gap-2 cursor-pointer text-[13px] text-[#16191f]">
              <input
                type="checkbox"
                checked={policyChangeProtection}
                onChange={(e) => setPolicyChangeProtection(e.target.checked)}
                className="mt-0.5 accent-[#0073bb]"
              />
              <div>
                <span className="font-semibold">Policy change protection</span>
                <p className="text-[12px] text-[#545b64]">Prevents changes to the associated firewall policy.</p>
              </div>
            </label>
          </div>

          <div className="border-t border-[#eaeded] pt-4 space-y-2">
            <label className="block text-[13px] font-bold text-[#16191f]">
              KMS encryption configuration
            </label>
            <div className="flex gap-4 text-[13px]">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="encryptionType"
                  value="AWS_OWNED"
                  checked={encryptionType === "AWS_OWNED"}
                  onChange={() => setEncryptionType("AWS_OWNED")}
                  className="accent-[#0073bb]"
                />
                AWS owned KMS key (Default)
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="encryptionType"
                  value="CUSTOMER_KMS"
                  checked={encryptionType === "CUSTOMER_KMS"}
                  onChange={() => setEncryptionType("CUSTOMER_KMS")}
                  className="accent-[#0073bb]"
                />
                Customer managed key (KMS CMK)
              </label>
            </div>

            {encryptionType === "CUSTOMER_KMS" && (
              <div className="pt-2">
                {kmsKeys.length === 0 ? (
                  <p className="text-[12px] text-[#545b64]">
                    No customer managed KMS keys found. Using AWS owned key.
                  </p>
                ) : (
                  <select
                    value={selectedKmsKeyId}
                    onChange={(e) => setSelectedKmsKeyId(e.target.value)}
                    className="w-full max-w-[480px] px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded-sm text-[#16191f] bg-white focus:border-[#0073bb] outline-hidden"
                  >
                    {kmsKeys.map((k) => (
                      <option key={k.keyId} value={k.keyId}>
                        {k.alias} ({k.keyId})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Step 4: Tags */}
        <div className="bg-white border border-[#d5dbdb] rounded-sm p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[16px] font-bold text-[#16191f]">Tags</h2>
              <p className="text-[13px] text-[#545b64] mt-0.5">
                A tag is a label that you assign to an AWS resource.
              </p>
            </div>
            <button
              type="button"
              onClick={addTag}
              className="px-3 py-1 text-[12px] font-medium border border-[#aab7b8] rounded-sm bg-white hover:bg-[#f2f3f3]"
            >
              Add new tag
            </button>
          </div>

          {tags.length > 0 && (
            <div className="space-y-2">
              {tags.map((t, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Key"
                    value={t.key}
                    onChange={(e) => updateTag(idx, "key", e.target.value)}
                    className="w-1/3 px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded-sm"
                  />
                  <input
                    type="text"
                    placeholder="Value"
                    value={t.value}
                    onChange={(e) => updateTag(idx, "value", e.target.value)}
                    className="w-1/3 px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeTag(idx)}
                    className="px-2.5 py-1.5 text-[12px] border border-[#aab7b8] rounded-sm hover:bg-[#f2f3f3] text-[#d13212]"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#eaeded]">
          <Link
            href="/vpc/firewalls"
            className="px-4 py-1.5 text-[13px] font-medium border border-[#aab7b8] rounded-sm bg-white text-[#16191f] hover:bg-[#f2f3f3]"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-1.5 text-[13px] font-medium bg-[#ec7211] text-white rounded-sm hover:bg-[#eb5f07] disabled:opacity-50"
          >
            {isSubmitting ? "Creating firewall..." : "Create firewall"}
          </button>
        </div>
      </form>
    </div>
  );
}
