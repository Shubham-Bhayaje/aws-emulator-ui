"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createLiveRuleGroup } from "../../network-firewall-actions";
import EmulatorOfflineBanner from "@/components/EmulatorOfflineBanner";

interface Props {
  kmsKeys: Array<{ keyId: string; alias: string }>;
}

export default function CreateRuleGroupClient({ kmsKeys }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = searchParams.get("type") === "STATELESS" ? "STATELESS" : "STATEFUL";

  // Form State
  const [type, setType] = useState<"STATELESS" | "STATEFUL">(initialType);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [capacity, setCapacity] = useState("100");

  // Stateless Rules State
  const [statelessRules, setStatelessRules] = useState([
    {
      priority: 1,
      action: "aws:pass",
      source: "0.0.0.0/0",
      destination: "0.0.0.0/0",
      protocol: "All",
    },
  ]);

  // Stateful Rules State
  const [statefulRuleType, setStatefulRuleType] = useState<"DOMAIN_LIST" | "SURICATA" | "5_TUPLE">("DOMAIN_LIST");
  const [domainTargets, setDomainTargets] = useState(".example.com\n.google.com");
  const [domainAction, setDomainAction] = useState<"ALLOWLIST" | "DENYLIST">("DENYLIST");
  const [suricataRules, setSuricataRules] = useState(
    'drop tcp any any -> any 80 (msg:"Block plain HTTP"; sid:100001; rev:1;)\nalert tcp any any -> any 443 (msg:"Detect TLS traffic"; sid:100002; rev:1;)'
  );
  const [fiveTupleRules, setFiveTupleRules] = useState([
    {
      action: "DROP" as const,
      protocol: "TCP",
      source: "0.0.0.0/0",
      sourcePort: "ANY",
      direction: "FORWARD" as const,
      destination: "10.0.0.0/8",
      destinationPort: "22",
    },
  ]);

  // Encryption & Tags
  const [encryptionType, setEncryptionType] = useState<"AWS_OWNED" | "CUSTOMER_KMS">("AWS_OWNED");
  const [selectedKmsKeyId, setSelectedKmsKeyId] = useState(kmsKeys[0]?.keyId || "");
  const [tags, setTags] = useState<Array<{ key: string; value: string }>>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addStatelessRule() {
    setStatelessRules((prev) => [
      ...prev,
      {
        priority: prev.length + 1,
        action: "aws:pass",
        source: "0.0.0.0/0",
        destination: "0.0.0.0/0",
        protocol: "All",
      },
    ]);
  }

  function addFiveTupleRule() {
    setFiveTupleRules((prev) => [
      ...prev,
      {
        action: "DROP" as const,
        protocol: "TCP",
        source: "0.0.0.0/0",
        sourcePort: "ANY",
        direction: "FORWARD" as const,
        destination: "0.0.0.0/0",
        destinationPort: "80",
      },
    ]);
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
      setError("Rule group name is required.");
      return;
    }
    const capNum = parseInt(capacity);
    if (isNaN(capNum) || capNum <= 0) {
      setError("Capacity must be a positive integer.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await createLiveRuleGroup({
        name: name.trim(),
        type,
        capacity: capNum,
        description: description.trim() || undefined,
        kmsKeyId: encryptionType === "CUSTOMER_KMS" ? selectedKmsKeyId : undefined,
        tags: tags.filter((t) => t.key.trim()),
        statelessRules:
          type === "STATELESS"
            ? statelessRules.map((r) => ({
                priority: r.priority,
                actions: [r.action],
                sources: [r.source],
                destinations: [r.destination],
              }))
            : undefined,
        statefulRuleType: type === "STATEFUL" ? statefulRuleType : undefined,
        statefulDomainList:
          type === "STATEFUL" && statefulRuleType === "DOMAIN_LIST"
            ? {
                targets: domainTargets
                  .split("\n")
                  .map((t) => t.trim())
                  .filter(Boolean),
                targetTypes: ["TLS_SNI", "HTTP_HOST"],
                actionType: domainAction,
              }
            : undefined,
        statefulSuricataRules:
          type === "STATEFUL" && statefulRuleType === "SURICATA" ? suricataRules : undefined,
        stateful5TupleRules:
          type === "STATEFUL" && statefulRuleType === "5_TUPLE" ? fiveTupleRules : undefined,
      });

      if (res.success && res.ruleGroupResponse) {
        router.push(`/vpc/rule-groups/${res.ruleGroupResponse.RuleGroupName}?type=${type}`);
      } else {
        setError(res.error || "Failed to create rule group.");
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
          <Link href="/vpc/rule-groups" className="hover:underline">Rule groups</Link>
          <span>&rsaquo;</span>
          <span className="text-[#16191f]">Create rule group</span>
        </div>
        <h1 className="text-[22px] font-bold text-[#16191f]">Create rule group</h1>
        <p className="text-[13px] text-[#545b64] mt-0.5">
          Define stateless or stateful traffic inspection criteria with domain filtering or Suricata IPS rules.
        </p>
      </div>

      {error && <EmulatorOfflineBanner error={error} />}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Type Selection */}
        <div className="bg-white border border-[#d5dbdb] rounded-sm p-5 space-y-4 shadow-xs">
          <h2 className="text-[16px] font-bold text-[#16191f]">Rule group format</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label
              className={`p-4 border rounded-sm cursor-pointer block ${
                type === "STATELESS"
                  ? "border-[#0073bb] bg-[#f2f8fc]"
                  : "border-[#d5dbdb] hover:border-[#aab7b8]"
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="rgType"
                  value="STATELESS"
                  checked={type === "STATELESS"}
                  onChange={() => setType("STATELESS")}
                  className="accent-[#0073bb]"
                />
                <span className="font-bold text-[14px] text-[#16191f]">Stateless rule group</span>
              </div>
              <p className="text-[12px] text-[#545b64] mt-2 ml-5">
                Evaluates each packet individually against standard 5-tuple attributes (IPs, ports, protocols). High throughput and microsecond latency.
              </p>
            </label>

            <label
              className={`p-4 border rounded-sm cursor-pointer block ${
                type === "STATEFUL"
                  ? "border-[#0073bb] bg-[#f2f8fc]"
                  : "border-[#d5dbdb] hover:border-[#aab7b8]"
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="rgType"
                  value="STATEFUL"
                  checked={type === "STATEFUL"}
                  onChange={() => setType("STATEFUL")}
                  className="accent-[#0073bb]"
                />
                <span className="font-bold text-[14px] text-[#16191f]">Stateful rule group</span>
              </div>
              <p className="text-[12px] text-[#545b64] mt-2 ml-5">
                Evaluates connections in context using deep packet inspection. Supports domain lists, Suricata compatible IPS rules, and 5-tuple rules.
              </p>
            </label>
          </div>
        </div>

        {/* Step 2: Details */}
        <div className="bg-white border border-[#d5dbdb] rounded-sm p-5 space-y-4 shadow-xs">
          <h2 className="text-[16px] font-bold text-[#16191f]">Rule group details</h2>

          <div>
            <label className="block text-[13px] font-bold text-[#16191f] mb-1">
              Name <span className="text-[#d13212]">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. drop-unauthorized-domains"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full max-w-[480px] px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded-sm text-[#16191f] focus:border-[#0073bb] outline-hidden"
            />
          </div>

          <div>
            <label className="block text-[13px] font-bold text-[#16191f] mb-1">
              Capacity <span className="text-[#d13212]">*</span>
            </label>
            <input
              type="number"
              required
              min="1"
              max="30000"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="w-full max-w-[200px] px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded-sm text-[#16191f] focus:border-[#0073bb] outline-hidden"
            />
            <p className="text-[12px] text-[#545b64] mt-1">
              Maximum rule capacity units (RU) reserved for this rule group.
            </p>
          </div>

          <div>
            <label className="block text-[13px] font-bold text-[#16191f] mb-1">
              Description <span className="text-[#545b64] font-normal">- optional</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Filters web traffic and blocks malicious outbound connections"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full max-w-[480px] px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded-sm text-[#16191f] focus:border-[#0073bb] outline-hidden"
            />
          </div>
        </div>

        {/* Step 3: Rule Definitions */}
        {type === "STATELESS" ? (
          <div className="bg-white border border-[#d5dbdb] rounded-sm p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[16px] font-bold text-[#16191f]">Stateless rules</h2>
                <p className="text-[13px] text-[#545b64] mt-0.5">
                  Rules are evaluated in ascending priority order (1 is highest priority).
                </p>
              </div>
              <button
                type="button"
                onClick={addStatelessRule}
                className="px-3 py-1 text-[12px] font-medium border border-[#aab7b8] rounded-sm bg-white hover:bg-[#f2f3f3]"
              >
                Add rule
              </button>
            </div>

            <div className="border border-[#eaeded] rounded-sm overflow-hidden">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64]">
                  <tr>
                    <th className="w-20 px-3 py-2">Priority</th>
                    <th className="px-3 py-2">Source IP</th>
                    <th className="px-3 py-2">Destination IP</th>
                    <th className="w-40 px-3 py-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeded]">
                  {statelessRules.map((rule, idx) => (
                    <tr key={idx} className="hover:bg-[#fbfbfb]">
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={rule.priority}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            setStatelessRules((prev) =>
                              prev.map((r, i) => (i === idx ? { ...r, priority: val } : r))
                            );
                          }}
                          className="w-16 px-2 py-1 text-[12px] border border-[#aab7b8] rounded-sm"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={rule.source}
                          onChange={(e) => {
                            const val = e.target.value;
                            setStatelessRules((prev) =>
                              prev.map((r, i) => (i === idx ? { ...r, source: val } : r))
                            );
                          }}
                          className="w-full px-2 py-1 text-[12px] border border-[#aab7b8] rounded-sm"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={rule.destination}
                          onChange={(e) => {
                            const val = e.target.value;
                            setStatelessRules((prev) =>
                              prev.map((r, i) => (i === idx ? { ...r, destination: val } : r))
                            );
                          }}
                          className="w-full px-2 py-1 text-[12px] border border-[#aab7b8] rounded-sm"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={rule.action}
                          onChange={(e) => {
                            const val = e.target.value;
                            setStatelessRules((prev) =>
                              prev.map((r, i) => (i === idx ? { ...r, action: val } : r))
                            );
                          }}
                          className="w-full px-2 py-1 text-[12px] border border-[#aab7b8] rounded-sm bg-white"
                        >
                          <option value="aws:pass">Pass</option>
                          <option value="aws:drop">Drop</option>
                          <option value="aws:forward_to_sfe">Forward to stateful</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-[#d5dbdb] rounded-sm p-5 space-y-4 shadow-xs">
            <h2 className="text-[16px] font-bold text-[#16191f]">Stateful rule options</h2>

            <div className="flex gap-4 text-[13px]">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="statefulSubtype"
                  value="DOMAIN_LIST"
                  checked={statefulRuleType === "DOMAIN_LIST"}
                  onChange={() => setStatefulRuleType("DOMAIN_LIST")}
                  className="accent-[#0073bb]"
                />
                Domain list
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="statefulSubtype"
                  value="SURICATA"
                  checked={statefulRuleType === "SURICATA"}
                  onChange={() => setStatefulRuleType("SURICATA")}
                  className="accent-[#0073bb]"
                />
                Suricata compatible IPS rules
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="statefulSubtype"
                  value="5_TUPLE"
                  checked={statefulRuleType === "5_TUPLE"}
                  onChange={() => setStatefulRuleType("5_TUPLE")}
                  className="accent-[#0073bb]"
                />
                Standard 5-tuple stateful rules
              </label>
            </div>

            {statefulRuleType === "DOMAIN_LIST" && (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-[13px] font-bold text-[#16191f] mb-1">
                    Action type
                  </label>
                  <div className="flex gap-4 text-[13px]">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="domAction"
                        value="DENYLIST"
                        checked={domainAction === "DENYLIST"}
                        onChange={() => setDomainAction("DENYLIST")}
                        className="accent-[#0073bb]"
                      />
                      Denylist (Block traffic to domains)
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="domAction"
                        value="ALLOWLIST"
                        checked={domainAction === "ALLOWLIST"}
                        onChange={() => setDomainAction("ALLOWLIST")}
                        className="accent-[#0073bb]"
                      />
                      Allowlist (Only allow traffic to domains)
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-[#16191f] mb-1">
                    Domain targets (one per line)
                  </label>
                  <textarea
                    rows={4}
                    value={domainTargets}
                    onChange={(e) => setDomainTargets(e.target.value)}
                    placeholder=".example.com&#10;api.service.org"
                    className="w-full max-w-[600px] px-3 py-2 text-[13px] font-mono border border-[#aab7b8] rounded-sm focus:border-[#0073bb] outline-hidden"
                  />
                  <p className="text-[12px] text-[#545b64] mt-1">
                    Matches HTTP Host and TLS SNI domain headers. Use a leading dot (e.g. <span className="font-mono">.example.com</span>) to match all subdomains.
                  </p>
                </div>
              </div>
            )}

            {statefulRuleType === "SURICATA" && (
              <div className="pt-2">
                <label className="block text-[13px] font-bold text-[#16191f] mb-1">
                  Suricata IPS rules string
                </label>
                <textarea
                  rows={6}
                  value={suricataRules}
                  onChange={(e) => setSuricataRules(e.target.value)}
                  placeholder='drop tcp any any -> any 80 (msg:"Block HTTP"; sid:100001; rev:1;)'
                  className="w-full px-3 py-2 text-[13px] font-mono border border-[#aab7b8] rounded-sm focus:border-[#0073bb] outline-hidden bg-[#fafafa]"
                />
                <p className="text-[12px] text-[#545b64] mt-1">
                  Standard open-source Suricata rule specifications with unique <span className="font-mono">sid</span> identifiers.
                </p>
              </div>
            )}

            {statefulRuleType === "5_TUPLE" && (
              <div className="space-y-3 pt-2">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={addFiveTupleRule}
                    className="px-3 py-1 text-[12px] font-medium border border-[#aab7b8] rounded-sm bg-white hover:bg-[#f2f3f3]"
                  >
                    Add 5-tuple rule
                  </button>
                </div>
                <div className="border border-[#eaeded] rounded-sm overflow-hidden">
                  <table className="w-full text-left text-[12px]">
                    <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64]">
                      <tr>
                        <th className="px-2 py-2">Action</th>
                        <th className="px-2 py-2">Protocol</th>
                        <th className="px-2 py-2">Source</th>
                        <th className="px-2 py-2">Src Port</th>
                        <th className="px-2 py-2">Destination</th>
                        <th className="px-2 py-2">Dst Port</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eaeded]">
                      {fiveTupleRules.map((r, idx) => (
                        <tr key={idx}>
                          <td className="px-2 py-1.5">
                            <select
                              value={r.action}
                              onChange={(e) => {
                                const val = e.target.value as any;
                                setFiveTupleRules((prev) =>
                                  prev.map((item, i) => (i === idx ? { ...item, action: val } : item))
                                );
                              }}
                              className="px-2 py-1 border border-[#aab7b8] rounded-sm bg-white"
                            >
                              <option value="PASS">PASS</option>
                              <option value="DROP">DROP</option>
                              <option value="ALERT">ALERT</option>
                            </select>
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              type="text"
                              value={r.protocol}
                              onChange={(e) => {
                                const val = e.target.value;
                                setFiveTupleRules((prev) =>
                                  prev.map((item, i) => (i === idx ? { ...item, protocol: val } : item))
                                );
                              }}
                              className="w-16 px-2 py-1 border border-[#aab7b8] rounded-sm"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              type="text"
                              value={r.source}
                              onChange={(e) => {
                                const val = e.target.value;
                                setFiveTupleRules((prev) =>
                                  prev.map((item, i) => (i === idx ? { ...item, source: val } : item))
                                );
                              }}
                              className="w-28 px-2 py-1 border border-[#aab7b8] rounded-sm"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              type="text"
                              value={r.sourcePort}
                              onChange={(e) => {
                                const val = e.target.value;
                                setFiveTupleRules((prev) =>
                                  prev.map((item, i) => (i === idx ? { ...item, sourcePort: val } : item))
                                );
                              }}
                              className="w-16 px-2 py-1 border border-[#aab7b8] rounded-sm"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              type="text"
                              value={r.destination}
                              onChange={(e) => {
                                const val = e.target.value;
                                setFiveTupleRules((prev) =>
                                  prev.map((item, i) => (i === idx ? { ...item, destination: val } : item))
                                );
                              }}
                              className="w-28 px-2 py-1 border border-[#aab7b8] rounded-sm"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              type="text"
                              value={r.destinationPort}
                              onChange={(e) => {
                                const val = e.target.value;
                                setFiveTupleRules((prev) =>
                                  prev.map((item, i) => (i === idx ? { ...item, destinationPort: val } : item))
                                );
                              }}
                              className="w-16 px-2 py-1 border border-[#aab7b8] rounded-sm"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Encryption */}
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

        {/* Step 5: Tags */}
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
            href="/vpc/rule-groups"
            className="px-4 py-1.5 text-[13px] font-medium border border-[#aab7b8] rounded-sm bg-white text-[#16191f] hover:bg-[#f2f3f3]"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-1.5 text-[13px] font-medium bg-[#ec7211] text-white rounded-sm hover:bg-[#eb5f07] disabled:opacity-50"
          >
            {isSubmitting ? "Creating rule group..." : "Create rule group"}
          </button>
        </div>
      </form>
    </div>
  );
}
