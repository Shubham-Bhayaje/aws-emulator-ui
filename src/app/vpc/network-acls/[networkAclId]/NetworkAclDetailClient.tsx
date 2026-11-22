"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  NetworkAclItem,
  NetworkAclEntryItem,
  SubnetItem,
  VpcItem,
  createNetworkAclEntryAction,
  deleteNetworkAclEntryAction,
  deleteNetworkAclAction,
} from "../../actions";

interface Props {
  networkAcl: NetworkAclItem;
  associatedSubnets: SubnetItem[];
  allSubnets: SubnetItem[];
  vpc?: VpcItem;
}

export default function NetworkAclDetailClient({
  networkAcl: initialAcl,
  associatedSubnets,
  vpc,
}: Props) {
  const router = useRouter();

  const [acl, setAcl] = useState<NetworkAclItem>(initialAcl);
  const [activeTab, setActiveTab] = useState<"details" | "inbound" | "outbound" | "subnets" | "tags">("details");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Actions dropdown
  const [isActionsOpen, setIsActionsOpen] = useState(false);

  // Rule modal
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [ruleModalEgress, setRuleModalEgress] = useState(false);
  const [ruleNumber, setRuleNumber] = useState<number>(100);
  const [ruleProtocol, setRuleProtocol] = useState("-1");
  const [ruleAction, setRuleAction] = useState<"allow" | "deny">("allow");
  const [ruleCidr, setRuleCidr] = useState("0.0.0.0/0");
  const [rulePortFrom, setRulePortFrom] = useState("");
  const [rulePortTo, setRulePortTo] = useState("");
  const [ruleLoading, setRuleLoading] = useState(false);

  // Delete modal
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const inboundRules = (acl.Entries || []).filter((e) => !e.Egress);
  const outboundRules = (acl.Entries || []).filter((e) => e.Egress);

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setRuleLoading(true);
    setMessage(null);
    try {
      const res = await createNetworkAclEntryAction({
        networkAclId: acl.NetworkAclId,
        ruleNumber: Number(ruleNumber),
        protocol: ruleProtocol,
        ruleAction: ruleAction,
        egress: ruleModalEgress,
        cidrBlock: ruleCidr,
        portRange:
          rulePortFrom || rulePortTo
            ? {
                from: rulePortFrom ? Number(rulePortFrom) : undefined,
                to: rulePortTo ? Number(rulePortTo) : undefined,
              }
            : undefined,
      });

      if (res.success) {
        const newEntry: NetworkAclEntryItem = {
          RuleNumber: Number(ruleNumber),
          Protocol: ruleProtocol,
          RuleAction: ruleAction,
          Egress: ruleModalEgress,
          CidrBlock: ruleCidr,
          PortRange:
            rulePortFrom || rulePortTo
              ? {
                  From: rulePortFrom ? Number(rulePortFrom) : undefined,
                  To: rulePortTo ? Number(rulePortTo) : undefined,
                }
              : undefined,
        };

        const updatedEntries = [...(acl.Entries || []).filter((entry) => !(entry.RuleNumber === Number(ruleNumber) && entry.Egress === ruleModalEgress)), newEntry].sort(
          (a, b) => a.RuleNumber - b.RuleNumber
        );

        setAcl({ ...acl, Entries: updatedEntries });
        setIsRuleModalOpen(false);
        setMessage({ type: "success", text: `Rule ${ruleNumber} created successfully.` });
      } else {
        setMessage({ type: "error", text: res.error || "Failed to add ACL rule" });
      }
    } finally {
      setRuleLoading(false);
    }
  };

  const handleDeleteRule = async (ruleNum: number, egress: boolean) => {
    setMessage(null);
    try {
      const res = await deleteNetworkAclEntryAction(acl.NetworkAclId, ruleNum, egress);
      if (res.success) {
        setAcl({
          ...acl,
          Entries: (acl.Entries || []).filter(
            (e) => !(e.RuleNumber === ruleNum && e.Egress === egress)
          ),
        });
        setMessage({ type: "success", text: `Rule ${ruleNum} deleted.` });
      } else {
        setMessage({ type: "error", text: res.error || "Failed to delete ACL rule" });
      }
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : String(err) });
    }
  };

  const handleDeleteAcl = async () => {
    setDeleteLoading(true);
    setMessage(null);
    try {
      const res = await deleteNetworkAclAction(acl.NetworkAclId);
      if (res.success) {
        setIsDeleteOpen(false);
        router.push("/vpc/network-acls");
      } else {
        setMessage({ type: "error", text: res.error || "Failed to delete Network ACL" });
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Bar */}
      <div className="flex items-center gap-2 text-[12px] text-[#545b64]">
        <Link href="/vpc/vpcs" className="hover:text-[#0073bb]">
          Virtual Private Cloud
        </Link>
        <span>&gt;</span>
        <Link href="/vpc/network-acls" className="hover:text-[#0073bb]">
          Network ACLs
        </Link>
        <span>&gt;</span>
        <span className="text-[#16191f] font-mono font-medium">{acl.NetworkAclId}</span>
      </div>

      {/* Header and Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#eaeded]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[22px] font-bold text-[#16191f]">
              {acl.Name || acl.NetworkAclId}
            </h1>
            {acl.IsDefault && (
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Default
              </span>
            )}
          </div>
          <p className="text-[13px] text-[#545b64] mt-1 font-mono">{acl.NetworkAclId}</p>
        </div>

        <div className="flex items-center gap-2 relative">
          <Link
            href="/vpc/network-acls"
            className="px-3 text-[13px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa] transition-colors flex items-center justify-center"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            View all Network ACLs
          </Link>

          <button
            onClick={() => {
              setRuleModalEgress(false);
              setRuleNumber(100);
              setIsRuleModalOpen(true);
            }}
            className="px-3 text-[13px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa] transition-colors flex items-center justify-center"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Add inbound rule
          </button>

          <div className="relative">
            <button
              onClick={() => setIsActionsOpen(!isActionsOpen)}
              className="px-3 text-[13px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa] transition-colors flex items-center gap-1.5"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              <span>Actions</span>
              <span className="text-[10px]">▼</span>
            </button>

            {isActionsOpen && (
              <div
                className="absolute right-0 mt-1 w-56 bg-white border border-[#d5dbdb] rounded shadow-lg z-20 py-1"
                onClick={() => setIsActionsOpen(false)}
              >
                <button
                  onClick={() => {
                    setRuleModalEgress(false);
                    setRuleNumber(100);
                    setIsRuleModalOpen(true);
                  }}
                  className="w-full text-left px-4 py-2 text-[13px] text-[#16191f] hover:bg-[#f2f8fd] flex items-center gap-2"
                >
                  Edit inbound rules
                </button>
                <button
                  onClick={() => {
                    setRuleModalEgress(true);
                    setRuleNumber(100);
                    setIsRuleModalOpen(true);
                  }}
                  className="w-full text-left px-4 py-2 text-[13px] text-[#16191f] hover:bg-[#f2f8fd] flex items-center gap-2"
                >
                  Edit outbound rules
                </button>
                {!acl.IsDefault && (
                  <>
                    <div className="border-t border-[#eaeded] my-1" />
                    <button
                      onClick={() => setIsDeleteOpen(true)}
                      className="w-full text-left px-4 py-2 text-[13px] text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      Delete network ACL
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`p-3 rounded text-[13px] border ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-[#eaeded]">
        <div className="flex gap-6 -mb-px">
          <button
            onClick={() => setActiveTab("details")}
            className={`pb-2.5 text-[14px] font-medium transition-colors border-b-2 ${
              activeTab === "details"
                ? "border-[#ec7211] text-[#ec7211]"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab("inbound")}
            className={`pb-2.5 text-[14px] font-medium transition-colors border-b-2 ${
              activeTab === "inbound"
                ? "border-[#ec7211] text-[#ec7211]"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Inbound rules ({inboundRules.length})
          </button>
          <button
            onClick={() => setActiveTab("outbound")}
            className={`pb-2.5 text-[14px] font-medium transition-colors border-b-2 ${
              activeTab === "outbound"
                ? "border-[#ec7211] text-[#ec7211]"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Outbound rules ({outboundRules.length})
          </button>
          <button
            onClick={() => setActiveTab("subnets")}
            className={`pb-2.5 text-[14px] font-medium transition-colors border-b-2 ${
              activeTab === "subnets"
                ? "border-[#ec7211] text-[#ec7211]"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Subnet associations ({associatedSubnets.length})
          </button>
          <button
            onClick={() => setActiveTab("tags")}
            className={`pb-2.5 text-[14px] font-medium transition-colors border-b-2 ${
              activeTab === "tags"
                ? "border-[#ec7211] text-[#ec7211]"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Tags ({Object.keys(acl.Tags || {}).length})
          </button>
        </div>
      </div>

      {/* Tab: Details */}
      {activeTab === "details" && (
        <div className="space-y-6">
          <div className="bg-white border border-[#eaeded] rounded p-5">
            <h3 className="text-[15px] font-bold text-[#16191f] mb-4">Network ACL summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-[13px]">
              <div>
                <dt className="text-[#545b64] font-medium">Network ACL ID</dt>
                <dd className="mt-1 font-mono text-[#16191f] font-semibold">{acl.NetworkAclId}</dd>
              </div>

              <div>
                <dt className="text-[#545b64] font-medium">VPC</dt>
                <dd className="mt-1">
                  <Link
                    href={`/vpc/vpcs/${acl.VpcId}`}
                    className="text-[#0073bb] hover:underline font-mono"
                  >
                    {vpc?.Name ? `${vpc.Name} (${acl.VpcId})` : acl.VpcId}
                  </Link>
                </dd>
              </div>

              <div>
                <dt className="text-[#545b64] font-medium">Default ACL</dt>
                <dd className="mt-1 text-[#16191f]">{acl.IsDefault ? "Yes" : "No"}</dd>
              </div>

              <div>
                <dt className="text-[#545b64] font-medium">Associated subnets</dt>
                <dd className="mt-1 font-semibold text-[#16191f]">{associatedSubnets.length}</dd>
              </div>

              <div>
                <dt className="text-[#545b64] font-medium">Inbound rules count</dt>
                <dd className="mt-1 text-[#16191f]">{inboundRules.length}</dd>
              </div>

              <div>
                <dt className="text-[#545b64] font-medium">Outbound rules count</dt>
                <dd className="mt-1 text-[#16191f]">{outboundRules.length}</dd>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Inbound rules */}
      {activeTab === "inbound" && (
        <div className="bg-white border border-[#eaeded] rounded overflow-hidden">
          <div className="p-4 border-b border-[#eaeded] flex justify-between items-center">
            <h3 className="text-[14px] font-bold text-[#16191f]">Inbound rules</h3>
            <button
              onClick={() => {
                setRuleModalEgress(false);
                setRuleNumber(100);
                setIsRuleModalOpen(true);
              }}
              className="px-3 text-[12px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa]"
              style={{ height: "28px" }}
            >
              Add inbound rule
            </button>
          </div>
          <table className="min-w-full text-[13px]">
            <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64]">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Rule #</th>
                <th className="px-4 py-2 text-left font-medium">Type / Protocol</th>
                <th className="px-4 py-2 text-left font-medium">Port range</th>
                <th className="px-4 py-2 text-left font-medium">Source</th>
                <th className="px-4 py-2 text-left font-medium">Allow / Deny</th>
                <th className="px-4 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded]">
              {inboundRules.map((rule) => (
                <tr key={rule.RuleNumber} className="hover:bg-[#f2f8fd]">
                  <td className="px-4 py-2 font-mono font-medium text-[#16191f]">
                    {rule.RuleNumber === 32767 ? "*" : rule.RuleNumber}
                  </td>
                  <td className="px-4 py-2 text-[#16191f]">
                    {rule.Protocol === "-1" ? "All traffic" : `Protocol ${rule.Protocol}`}
                  </td>
                  <td className="px-4 py-2 text-[#16191f]">
                    {rule.PortRange?.From !== undefined && rule.PortRange?.To !== undefined
                      ? `${rule.PortRange.From} - ${rule.PortRange.To}`
                      : "All"}
                  </td>
                  <td className="px-4 py-2 font-mono text-[#16191f]">{rule.CidrBlock || "0.0.0.0/0"}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${
                        rule.RuleAction === "allow"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      }`}
                    >
                      {rule.RuleAction.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    {rule.RuleNumber !== 32767 && (
                      <button
                        onClick={() => handleDeleteRule(rule.RuleNumber, false)}
                        className="text-red-600 hover:underline text-[12px]"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Outbound rules */}
      {activeTab === "outbound" && (
        <div className="bg-white border border-[#eaeded] rounded overflow-hidden">
          <div className="p-4 border-b border-[#eaeded] flex justify-between items-center">
            <h3 className="text-[14px] font-bold text-[#16191f]">Outbound rules</h3>
            <button
              onClick={() => {
                setRuleModalEgress(true);
                setRuleNumber(100);
                setIsRuleModalOpen(true);
              }}
              className="px-3 text-[12px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa]"
              style={{ height: "28px" }}
            >
              Add outbound rule
            </button>
          </div>
          <table className="min-w-full text-[13px]">
            <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64]">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Rule #</th>
                <th className="px-4 py-2 text-left font-medium">Type / Protocol</th>
                <th className="px-4 py-2 text-left font-medium">Port range</th>
                <th className="px-4 py-2 text-left font-medium">Destination</th>
                <th className="px-4 py-2 text-left font-medium">Allow / Deny</th>
                <th className="px-4 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded]">
              {outboundRules.map((rule) => (
                <tr key={rule.RuleNumber} className="hover:bg-[#f2f8fd]">
                  <td className="px-4 py-2 font-mono font-medium text-[#16191f]">
                    {rule.RuleNumber === 32767 ? "*" : rule.RuleNumber}
                  </td>
                  <td className="px-4 py-2 text-[#16191f]">
                    {rule.Protocol === "-1" ? "All traffic" : `Protocol ${rule.Protocol}`}
                  </td>
                  <td className="px-4 py-2 text-[#16191f]">
                    {rule.PortRange?.From !== undefined && rule.PortRange?.To !== undefined
                      ? `${rule.PortRange.From} - ${rule.PortRange.To}`
                      : "All"}
                  </td>
                  <td className="px-4 py-2 font-mono text-[#16191f]">{rule.CidrBlock || "0.0.0.0/0"}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${
                        rule.RuleAction === "allow"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      }`}
                    >
                      {rule.RuleAction.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    {rule.RuleNumber !== 32767 && (
                      <button
                        onClick={() => handleDeleteRule(rule.RuleNumber, true)}
                        className="text-red-600 hover:underline text-[12px]"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Subnet associations */}
      {activeTab === "subnets" && (
        <div className="bg-white border border-[#eaeded] rounded overflow-hidden">
          <div className="p-4 border-b border-[#eaeded]">
            <h3 className="text-[14px] font-bold text-[#16191f]">Associated subnets</h3>
          </div>
          {associatedSubnets.length > 0 ? (
            <table className="min-w-full text-[13px]">
              <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64]">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Subnet ID</th>
                  <th className="px-4 py-2 text-left font-medium">Name</th>
                  <th className="px-4 py-2 text-left font-medium">IPv4 CIDR</th>
                  <th className="px-4 py-2 text-left font-medium">Availability Zone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded]">
                {associatedSubnets.map((sub) => (
                  <tr key={sub.SubnetId} className="hover:bg-[#f2f8fd]">
                    <td className="px-4 py-2">
                      <Link
                        href={`/vpc/subnets/${sub.SubnetId}`}
                        className="text-[#0073bb] hover:underline font-mono"
                      >
                        {sub.SubnetId}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-[#16191f]">{sub.Name || "-"}</td>
                    <td className="px-4 py-2 font-mono text-[#16191f]">{sub.CidrBlock}</td>
                    <td className="px-4 py-2 text-[#16191f]">{sub.AvailabilityZone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6 text-center text-[13px] text-[#545b64]">No subnets currently associated with this Network ACL.</div>
          )}
        </div>
      )}

      {/* Tab: Tags */}
      {activeTab === "tags" && (
        <div className="bg-white border border-[#eaeded] rounded overflow-hidden">
          <div className="p-4 border-b border-[#eaeded]">
            <h3 className="text-[14px] font-bold text-[#16191f]">Tags</h3>
          </div>
          {acl.Tags && Object.keys(acl.Tags).length > 0 ? (
            <table className="min-w-full text-[13px]">
              <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64]">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Key</th>
                  <th className="px-4 py-2 text-left font-medium">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded]">
                {Object.entries(acl.Tags).map(([k, v]) => (
                  <tr key={k}>
                    <td className="px-4 py-2 font-mono text-[#16191f]">{k}</td>
                    <td className="px-4 py-2 text-[#16191f]">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6 text-center text-[13px] text-[#545b64]">No tags associated with this Network ACL.</div>
          )}
        </div>
      )}

      {/* Rule Modal */}
      {isRuleModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleAddRule}
            className="bg-white rounded border border-[#eaeded] shadow-xl max-w-lg w-full p-6 space-y-4"
          >
            <h3 className="text-[18px] font-bold text-[#16191f]">
              Add {ruleModalEgress ? "Outbound" : "Inbound"} ACL Rule
            </h3>
            <div className="space-y-3 text-[13px]">
              <div>
                <label className="block text-[12px] font-medium text-[#16191f] mb-1">
                  Rule number (e.g. 100)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={32766}
                  value={ruleNumber}
                  onChange={(e) => setRuleNumber(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#16191f] mb-1">Protocol</label>
                <select
                  value={ruleProtocol}
                  onChange={(e) => setRuleProtocol(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
                >
                  <option value="-1">All traffic (-1)</option>
                  <option value="6">TCP (6)</option>
                  <option value="17">UDP (17)</option>
                  <option value="1">ICMP (1)</option>
                </select>
              </div>

              {(ruleProtocol === "6" || ruleProtocol === "17") && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-medium text-[#16191f] mb-1">Port from</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={rulePortFrom}
                      onChange={(e) => setRulePortFrom(e.target.value)}
                      className="w-full px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-[#16191f] mb-1">Port to</label>
                    <input
                      type="number"
                      placeholder="65535"
                      value={rulePortTo}
                      onChange={(e) => setRulePortTo(e.target.value)}
                      className="w-full px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[12px] font-medium text-[#16191f] mb-1">
                  {ruleModalEgress ? "Destination CIDR" : "Source CIDR"}
                </label>
                <input
                  type="text"
                  required
                  value={ruleCidr}
                  onChange={(e) => setRuleCidr(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211] font-mono"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#16191f] mb-1">Action</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="ruleAction"
                      value="allow"
                      checked={ruleAction === "allow"}
                      onChange={() => setRuleAction("allow")}
                    />
                    <span>Allow</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="ruleAction"
                      value="deny"
                      checked={ruleAction === "deny"}
                      onChange={() => setRuleAction("deny")}
                    />
                    <span>Deny</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsRuleModalOpen(false)}
                disabled={ruleLoading}
                className="px-4 text-[13px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa]"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={ruleLoading}
                className="px-4 text-[13px] font-medium text-white bg-[#ec7211] rounded hover:bg-[#eb5f07] disabled:opacity-50"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
              >
                {ruleLoading ? "Saving..." : "Save rule"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">Delete Network ACL?</h3>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to delete network ACL{" "}
              <span className="font-mono font-semibold text-[#16191f]">{acl.NetworkAclId}</span>?
            </p>
            <p className="text-[12px] text-red-600 bg-red-50 p-2.5 rounded border border-red-200">
              This action cannot be undone. You cannot delete the default network ACL.
            </p>
            <div className="space-y-1">
              <label className="text-[12px] font-medium text-[#16191f]">
                To confirm deletion, type <span className="font-mono font-bold">delete</span>:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="delete"
                className="w-full px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteOpen(false);
                  setDeleteConfirmText("");
                }}
                disabled={deleteLoading}
                className="px-4 text-[13px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa]"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAcl}
                disabled={deleteLoading || deleteConfirmText !== "delete"}
                className="px-4 text-[13px] font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
