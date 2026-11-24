"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createLiveFirewallPolicy } from "../../network-firewall-actions";
import EmulatorOfflineBanner from "@/components/EmulatorOfflineBanner";

interface Props {
  statelessRuleGroups: Array<{ name: string; arn: string }>;
  statefulRuleGroups: Array<{ name: string; arn: string }>;
  kmsKeys: Array<{ keyId: string; alias: string }>;
}

export default function CreateFirewallPolicyClient({
  statelessRuleGroups,
  statefulRuleGroups,
  kmsKeys,
}: Props) {
  const router = useRouter();

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [statelessDefaultAction, setStatelessDefaultAction] = useState("aws:forward_to_sfe");
  const [statelessFragmentAction, setStatelessFragmentAction] = useState("aws:pass");
  const [selectedStatelessArns, setSelectedStatelessArns] = useState<Array<{ arn: string; priority: number }>>([]);
  const [selectedStatefulArns, setSelectedStatefulArns] = useState<string[]>([]);
  const [statefulRuleOrder, setStatefulRuleOrder] = useState<"DEFAULT_ACTION_ORDER" | "STRICT_ORDER">("DEFAULT_ACTION_ORDER");
  const [encryptionType, setEncryptionType] = useState<"AWS_OWNED" | "CUSTOMER_KMS">("AWS_OWNED");
  const [selectedKmsKeyId, setSelectedKmsKeyId] = useState(kmsKeys[0]?.keyId || "");
  const [tags, setTags] = useState<Array<{ key: string; value: string }>>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleStateless(arn: string) {
    setSelectedStatelessArns((prev) => {
      const exists = prev.find((p) => p.arn === arn);
      if (exists) {
        return prev.filter((p) => p.arn !== arn);
      } else {
        const nextPriority = prev.length + 1;
        return [...prev, { arn, priority: nextPriority }];
      }
    });
  }

  function updateStatelessPriority(arn: string, priority: number) {
    setSelectedStatelessArns((prev) =>
      prev.map((p) => (p.arn === arn ? { ...p, priority } : p))
    );
  }

  function toggleStateful(arn: string) {
    setSelectedStatefulArns((prev) =>
      prev.includes(arn) ? prev.filter((a) => a !== arn) : [...prev, arn]
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
      setError("Firewall policy name is required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await createLiveFirewallPolicy({
        name: name.trim(),
        description: description.trim() || undefined,
        statelessDefaultActions: [statelessDefaultAction],
        statelessFragmentDefaultActions: [statelessFragmentAction],
        statelessRuleGroupReferences: selectedStatelessArns.map((s) => ({
          arn: s.arn,
          priority: s.priority,
        })),
        statefulRuleGroupReferences: selectedStatefulArns.map((arn) => ({ arn })),
        statefulEngineOptions: { ruleOrder: statefulRuleOrder },
        kmsKeyId: encryptionType === "CUSTOMER_KMS" ? selectedKmsKeyId : undefined,
        tags: tags.filter((t) => t.key.trim()),
      });

      if (res.success && res.policyResponse) {
        router.push(`/vpc/firewall-policies/${res.policyResponse.FirewallPolicyName}`);
      } else {
        setError(res.error || "Failed to create firewall policy.");
        setIsSubmitting(false);
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-[1000px]">
      {/* Breadcrumb & Header */}
      <div className="border-b border-[#eaeded] pb-4">
        <div className="text-[12px] text-[#545b64] mb-1 flex items-center gap-1.5">
          <Link href="/vpc" className="hover:underline">VPC</Link>
          <span>&rsaquo;</span>
          <Link href="/vpc/firewall-policies" className="hover:underline">Firewall policies</Link>
          <span>&rsaquo;</span>
          <span className="text-[#16191f]">Create firewall policy</span>
        </div>
        <h1 className="text-[22px] font-bold text-[#16191f]">Create firewall policy</h1>
        <p className="text-[13px] text-[#545b64] mt-0.5">
          Define stateless and stateful rule groups, rule evaluation order, and default packet actions.
        </p>
      </div>

      {error && <EmulatorOfflineBanner error={error} />}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Policy Details */}
        <div className="bg-white border border-[#d5dbdb] rounded-sm p-5 space-y-4 shadow-xs">
          <h2 className="text-[16px] font-bold text-[#16191f]">Policy details</h2>

          <div>
            <label className="block text-[13px] font-bold text-[#16191f] mb-1">
              Policy name <span className="text-[#d13212]">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. standard-inspection-policy"
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
              placeholder="e.g. Inspects egress web traffic and applies Suricata IPS rules"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full max-w-[480px] px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded-sm text-[#16191f] focus:border-[#0073bb] outline-hidden"
            />
          </div>
        </div>

        {/* Stateless default actions */}
        <div className="bg-white border border-[#d5dbdb] rounded-sm p-5 space-y-4 shadow-xs">
          <div>
            <h2 className="text-[16px] font-bold text-[#16191f]">Stateless default actions</h2>
            <p className="text-[13px] text-[#545b64] mt-0.5">
              Specify what Network Firewall does with packets that do not match any stateless rule.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-bold text-[#16191f] mb-1">
                Default action for full packets <span className="text-[#d13212]">*</span>
              </label>
              <select
                value={statelessDefaultAction}
                onChange={(e) => setStatelessDefaultAction(e.target.value)}
                className="w-full px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded-sm text-[#16191f] bg-white focus:border-[#0073bb] outline-hidden"
              >
                <option value="aws:forward_to_sfe">Forward to stateful rule groups (aws:forward_to_sfe)</option>
                <option value="aws:pass">Pass (aws:pass)</option>
                <option value="aws:drop">Drop (aws:drop)</option>
              </select>
            </div>

            <div>
              <label className="block text-[13px] font-bold text-[#16191f] mb-1">
                Default action for fragmented packets <span className="text-[#d13212]">*</span>
              </label>
              <select
                value={statelessFragmentAction}
                onChange={(e) => setStatelessFragmentAction(e.target.value)}
                className="w-full px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded-sm text-[#16191f] bg-white focus:border-[#0073bb] outline-hidden"
              >
                <option value="aws:pass">Pass (aws:pass)</option>
                <option value="aws:drop">Drop (aws:drop)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stateless Rule Groups */}
        <div className="bg-white border border-[#d5dbdb] rounded-sm p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[16px] font-bold text-[#16191f]">Stateless rule groups</h2>
              <p className="text-[13px] text-[#545b64] mt-0.5">
                Stateless rule groups evaluate packets individually according to priority order.
              </p>
            </div>
            <Link
              href="/vpc/rule-groups/create?type=STATELESS"
              className="text-[12px] text-[#0073bb] hover:underline"
            >
              Create rule group
            </Link>
          </div>

          {statelessRuleGroups.length === 0 ? (
            <p className="text-[13px] text-[#545b64]">
              No stateless rule groups found. Packets will be evaluated by stateless default actions.
            </p>
          ) : (
            <div className="border border-[#eaeded] rounded-sm overflow-hidden">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64]">
                  <tr>
                    <th className="w-10 px-3 py-2"></th>
                    <th className="px-3 py-2">Rule Group Name</th>
                    <th className="w-28 px-3 py-2">Priority</th>
                    <th className="px-3 py-2">ARN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeded]">
                  {statelessRuleGroups.map((rg) => {
                    const selected = selectedStatelessArns.find((s) => s.arn === rg.arn);
                    return (
                      <tr key={rg.arn} className="hover:bg-[#fbfbfb]">
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={Boolean(selected)}
                            onChange={() => toggleStateless(rg.arn)}
                            className="accent-[#0073bb]"
                          />
                        </td>
                        <td className="px-3 py-2 font-medium">{rg.name}</td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="1"
                            max="10000"
                            disabled={!selected}
                            value={selected?.priority || 1}
                            onChange={(e) => updateStatelessPriority(rg.arn, parseInt(e.target.value) || 1)}
                            className="w-20 px-2 py-1 text-[12px] border border-[#aab7b8] rounded-sm disabled:opacity-40"
                          />
                        </td>
                        <td className="px-3 py-2 font-mono text-[11px] text-[#545b64] break-all">{rg.arn}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Stateful Rule Groups */}
        <div className="bg-white border border-[#d5dbdb] rounded-sm p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[16px] font-bold text-[#16191f]">Stateful rule groups</h2>
              <p className="text-[13px] text-[#545b64] mt-0.5">
                Stateful rule groups evaluate network connections with contextual inspection (Suricata compatible).
              </p>
            </div>
            <Link
              href="/vpc/rule-groups/create?type=STATEFUL"
              className="text-[12px] text-[#0073bb] hover:underline"
            >
              Create rule group
            </Link>
          </div>

          <div>
            <label className="block text-[13px] font-bold text-[#16191f] mb-1">
              Stateful rule evaluation order
            </label>
            <div className="flex gap-4 text-[13px]">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="ruleOrder"
                  value="DEFAULT_ACTION_ORDER"
                  checked={statefulRuleOrder === "DEFAULT_ACTION_ORDER"}
                  onChange={() => setStatefulRuleOrder("DEFAULT_ACTION_ORDER")}
                  className="accent-[#0073bb]"
                />
                Default action order (Pass, Drop, Alert)
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="ruleOrder"
                  value="STRICT_ORDER"
                  checked={statefulRuleOrder === "STRICT_ORDER"}
                  onChange={() => setStatefulRuleOrder("STRICT_ORDER")}
                  className="accent-[#0073bb]"
                />
                Strict order (Evaluates rules strictly by priority)
              </label>
            </div>
          </div>

          {statefulRuleGroups.length === 0 ? (
            <p className="text-[13px] text-[#545b64]">
              No stateful rule groups found. Click &quot;Create rule group&quot; to build 5-tuple, domain, or Suricata rules.
            </p>
          ) : (
            <div className="border border-[#eaeded] rounded-sm overflow-hidden">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64]">
                  <tr>
                    <th className="w-10 px-3 py-2"></th>
                    <th className="px-3 py-2">Rule Group Name</th>
                    <th className="px-3 py-2">ARN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeded]">
                  {statefulRuleGroups.map((rg) => {
                    const isChecked = selectedStatefulArns.includes(rg.arn);
                    return (
                      <tr key={rg.arn} className="hover:bg-[#fbfbfb]">
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleStateful(rg.arn)}
                            className="accent-[#0073bb]"
                          />
                        </td>
                        <td className="px-3 py-2 font-medium">{rg.name}</td>
                        <td className="px-3 py-2 font-mono text-[11px] text-[#545b64] break-all">{rg.arn}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Encryption Configuration */}
        <div className="bg-white border border-[#d5dbdb] rounded-sm p-5 space-y-4 shadow-xs">
          <h2 className="text-[16px] font-bold text-[#16191f]">KMS encryption configuration</h2>
          <div className="flex gap-4 text-[13px]">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="encType"
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
                name="encType"
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
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="bg-white border border-[#d5dbdb] rounded-sm p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-bold text-[#16191f]">Tags</h2>
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
            href="/vpc/firewall-policies"
            className="px-4 py-1.5 text-[13px] font-medium border border-[#aab7b8] rounded-sm bg-white text-[#16191f] hover:bg-[#f2f3f3]"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-1.5 text-[13px] font-medium bg-[#ec7211] text-white rounded-sm hover:bg-[#eb5f07] disabled:opacity-50"
          >
            {isSubmitting ? "Creating policy..." : "Create firewall policy"}
          </button>
        </div>
      </form>
    </div>
  );
}
