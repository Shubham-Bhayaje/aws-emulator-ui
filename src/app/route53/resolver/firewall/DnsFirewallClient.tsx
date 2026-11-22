"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDateTime } from "@/lib/dateUtils";
import {
  FirewallConfigItem,
  FirewallDomainListItem,
  FirewallRuleGroupItem,
  listFirewallConfigsAction,
  listFirewallDomainListsAction,
  listFirewallRuleGroupsAction,
} from "../resolver-actions";

interface Props {
  initialConfigs: FirewallConfigItem[];
  initialDomainLists: FirewallDomainListItem[];
  initialRuleGroups: FirewallRuleGroupItem[];
}

export default function DnsFirewallClient({
  initialConfigs,
  initialDomainLists,
  initialRuleGroups,
}: Props) {
  const [activeTab, setActiveTab] = useState<"configs" | "domain-lists" | "rule-groups">("configs");
  const [configs, setConfigs] = useState<FirewallConfigItem[]>(initialConfigs);
  const [domainLists, setDomainLists] = useState<FirewallDomainListItem[]>(initialDomainLists);
  const [ruleGroups, setRuleGroups] = useState<FirewallRuleGroupItem[]>(initialRuleGroups);

  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const refreshData = async () => {
    setRefreshing(true);
    const [cRes, dRes, rRes] = await Promise.all([
      listFirewallConfigsAction(),
      listFirewallDomainListsAction(),
      listFirewallRuleGroupsAction(),
    ]);
    if (cRes.success) setConfigs(cRes.configs);
    if (dRes.success) setDomainLists(dRes.domainLists);
    if (rRes.success) setRuleGroups(rRes.ruleGroups);
    setRefreshing(false);
  };

  const filteredConfigs = configs.filter(
    (c) =>
      c.resourceId.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase())
  );

  const filteredDomainLists = domainLists.filter(
    (d) =>
      (d.name?.toLowerCase() || "").includes(search.toLowerCase()) ||
      d.id.toLowerCase().includes(search.toLowerCase())
  );

  const filteredRuleGroups = ruleGroups.filter(
    (r) =>
      (r.name?.toLowerCase() || "").includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">DNS Firewall</h1>
          <p className="text-xs text-gray-500 mt-1">
            Route 53 Resolver DNS Firewall lets you monitor and filter outgoing DNS queries from your VPCs
            against known malicious domains and customized allow/block lists.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={refreshData}
            disabled={refreshing}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="px-3 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded shadow-sm disabled:opacity-50"
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-6 text-xs">
          <button
            onClick={() => {
              setActiveTab("configs");
              setSearch("");
            }}
            className={`pb-3 font-semibold border-b-2 flex items-center space-x-1.5 ${
              activeTab === "configs"
                ? "border-[#ec7211] text-[#ec7211]"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <span>VPC configurations</span>
            <span className="bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded-full text-[10px]">
              {configs.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab("domain-lists");
              setSearch("");
            }}
            className={`pb-3 font-semibold border-b-2 flex items-center space-x-1.5 ${
              activeTab === "domain-lists"
                ? "border-[#ec7211] text-[#ec7211]"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <span>Domain lists</span>
            <span className="bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded-full text-[10px]">
              {domainLists.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab("rule-groups");
              setSearch("");
            }}
            className={`pb-3 font-semibold border-b-2 flex items-center space-x-1.5 ${
              activeTab === "rule-groups"
                ? "border-[#ec7211] text-[#ec7211]"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <span>Rule groups</span>
            <span className="bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded-full text-[10px]">
              {ruleGroups.length}
            </span>
          </button>
        </nav>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-gray-200 rounded p-3 flex items-center justify-between gap-3 text-xs">
        <div className="flex-1 max-w-sm">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Tab: VPC Configurations */}
      {activeTab === "configs" && (
        <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#fafafa] text-gray-600 border-b border-gray-200 font-medium">
                <tr>
                  <th className="py-2.5 px-4">Configuration ID</th>
                  <th className="py-2.5 px-4">VPC ID</th>
                  <th className="py-2.5 px-4">Fail-open status</th>
                  <th className="py-2.5 px-4">Owner account</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredConfigs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500">
                      No VPC firewall configurations found.
                    </td>
                  </tr>
                ) : (
                  filteredConfigs.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="py-2.5 px-4 font-mono text-gray-900">{c.id}</td>
                      <td className="py-2.5 px-4 font-mono text-[#0073bb]">
                        <Link href={`/vpc/vpcs/${c.resourceId}`} className="hover:underline">
                          {c.resourceId}
                        </Link>
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold border ${
                            c.firewallFailOpen === "ENABLED"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-gray-100 text-gray-700 border-gray-300"
                          }`}
                        >
                          {c.firewallFailOpen}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-gray-600">{c.ownerId || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Domain Lists */}
      {activeTab === "domain-lists" && (
        <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#fafafa] text-gray-600 border-b border-gray-200 font-medium">
                <tr>
                  <th className="py-2.5 px-4">Domain list name</th>
                  <th className="py-2.5 px-4">List ID</th>
                  <th className="py-2.5 px-4">Domain count</th>
                  <th className="py-2.5 px-4">Managed owner</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Creation time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDomainLists.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">
                      No domain lists found.
                    </td>
                  </tr>
                ) : (
                  filteredDomainLists.map((d) => (
                    <tr key={d.id} className="hover:bg-gray-50">
                      <td className="py-2.5 px-4 font-semibold text-gray-900">{d.name}</td>
                      <td className="py-2.5 px-4 font-mono text-gray-600">{d.id}</td>
                      <td className="py-2.5 px-4 text-gray-700 font-medium">{d.domainCount ?? 0}</td>
                      <td className="py-2.5 px-4">
                        {d.managedOwnerName ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                            {d.managedOwnerName}
                          </span>
                        ) : (
                          <span className="text-gray-500">Custom</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-green-50 text-green-700 border border-green-200">
                          {d.status || "COMPLETE"}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-gray-500 font-mono" suppressHydrationWarning>
                        {formatDateTime(d.creationTime)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Rule Groups */}
      {activeTab === "rule-groups" && (
        <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#fafafa] text-gray-600 border-b border-gray-200 font-medium">
                <tr>
                  <th className="py-2.5 px-4">Rule group name</th>
                  <th className="py-2.5 px-4">Rule group ID</th>
                  <th className="py-2.5 px-4">Rule count</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Share status</th>
                  <th className="py-2.5 px-4">Creation time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRuleGroups.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">
                      No firewall rule groups found.
                    </td>
                  </tr>
                ) : (
                  filteredRuleGroups.map((rg) => (
                    <tr key={rg.id} className="hover:bg-gray-50">
                      <td className="py-2.5 px-4 font-semibold text-gray-900">{rg.name}</td>
                      <td className="py-2.5 px-4 font-mono text-gray-600">{rg.id}</td>
                      <td className="py-2.5 px-4 text-gray-700 font-medium">{rg.ruleCount ?? 0}</td>
                      <td className="py-2.5 px-4">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-green-50 text-green-700 border border-green-200">
                          {rg.status || "COMPLETE"}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-gray-600">{rg.shareStatus || "NOT_SHARED"}</td>
                      <td className="py-2.5 px-4 text-gray-500 font-mono" suppressHydrationWarning>
                        {formatDateTime(rg.creationTime)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
