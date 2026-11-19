/**
 * src/app/organizations/OrganizationsClient.tsx – Client component for AWS Organizations.
 * Hierarchical tree/list view of Roots, OUs, and Accounts with Add Account, Create OU,
 * Move Account, and Delete OU modals.
 * Zero emojis, Cloudscape enterprise standard.
 * 100% Valid HTML table structure (no invalid <div> wrapping <tr>).
 */

"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  OrgHierarchyData,
  createOrganizationalUnitAction,
  deleteOrganizationalUnitAction,
  createAccountAction,
  inviteAccountAction,
  moveAccountAction,
  closeAccountAction,
} from "./actions";

interface OrganizationsClientProps {
  data: OrgHierarchyData;
}

interface TreeRow {
  key: string;
  id: string;
  name: string;
  type: "ROOT" | "OU" | "ACCOUNT";
  depth: number;
  email?: string;
  status: string;
  subType: string;
  hasChildren: boolean;
  isExpanded: boolean;
  arn: string;
  isManagementAccount?: boolean;
}

export function OrganizationsClient({ data }: OrganizationsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<{ id: string; type: "ROOT" | "OU" | "ACCOUNT"; name: string } | null>(null);

  // Modals
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [addAccountTab, setAddAccountTab] = useState<"create" | "invite">("create");
  const [showCreateOUModal, setShowCreateOUModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showDeleteOUModal, setShowDeleteOUModal] = useState(false);
  const [showCloseAccountModal, setShowCloseAccountModal] = useState(false);

  // Form states
  const [createAccountName, setCreateAccountName] = useState("");
  const [createAccountEmail, setCreateAccountEmail] = useState("");
  const [createAccountParent, setCreateAccountParent] = useState(data.roots[0]?.id || "r-7qygd7aa");
  const [createAccountRole, setCreateAccountRole] = useState("OrganizationAccountAccessRole");

  const [inviteAccountInput, setInviteAccountInput] = useState("");
  const [inviteAccountParent, setInviteAccountParent] = useState(data.roots[0]?.id || "r-7qygd7aa");

  const [createOUName, setCreateOUName] = useState("");
  const [createOUParent, setCreateOUParent] = useState(data.roots[0]?.id || "r-7qygd7aa");

  const [moveDestinationParent, setMoveDestinationParent] = useState(data.roots[0]?.id || "r-7qygd7aa");

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Expanded tree nodes (Root expanded by default)
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    [data.roots[0]?.id || "r-7qygd7aa"]: true,
  });

  const toggleNode = (id: string) => {
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Available parent targets (Roots + all OUs)
  const parentOptions = useMemo(() => [
    ...data.roots.map((r) => ({ id: r.id, name: `${r.name} (${r.id}) [Root]` })),
    ...data.allOUs.map((ou) => ({ id: ou.id, name: `${ou.name} (${ou.id}) [OU]` })),
  ], [data.roots, data.allOUs]);

  // Build flattened visible rows array directly compliant with HTML table structure
  const visibleRows = useMemo(() => {
    const rows: TreeRow[] = [];
    const searchLower = search.trim().toLowerCase();

    const flattenOU = (ou: any, depth: number) => {
      const isExpanded = expandedNodes[ou.id] !== false;
      const hasChildren = (ou.childrenOUs && ou.childrenOUs.length > 0) || (ou.accounts && ou.accounts.length > 0);

      const matchesSearch =
        !searchLower ||
        ou.name.toLowerCase().includes(searchLower) ||
        ou.id.toLowerCase().includes(searchLower);

      if (matchesSearch) {
        rows.push({
          key: `ou-${ou.id}`,
          id: ou.id,
          name: ou.name,
          type: "OU",
          depth,
          status: "Active",
          subType: "Organizational unit",
          hasChildren,
          isExpanded,
          arn: ou.arn,
        });
      }

      if (isExpanded || searchLower) {
        if (ou.childrenOUs) {
          for (const childOU of ou.childrenOUs) {
            flattenOU(childOU, depth + 1);
          }
        }
        if (ou.accounts) {
          for (const acc of ou.accounts) {
            flattenAccount(acc, depth + 1);
          }
        }
      }
    };

    const flattenAccount = (acc: any, depth: number) => {
      const matchesSearch =
        !searchLower ||
        acc.name.toLowerCase().includes(searchLower) ||
        acc.id.toLowerCase().includes(searchLower) ||
        (acc.email && acc.email.toLowerCase().includes(searchLower));

      if (matchesSearch) {
        rows.push({
          key: `acc-${acc.id}`,
          id: acc.id,
          name: acc.name,
          type: "ACCOUNT",
          depth,
          email: acc.email,
          status: acc.status || "ACTIVE",
          subType: acc.isManagementAccount ? "Management account" : acc.joinedMethod === "CREATED" ? "Created" : "Invited",
          hasChildren: false,
          isExpanded: false,
          arn: acc.arn,
          isManagementAccount: acc.isManagementAccount,
        });
      }
    };

    for (const root of data.roots) {
      const isRootExpanded = expandedNodes[root.id] !== false;
      const hasChildren = (root.childrenOUs && root.childrenOUs.length > 0) || (root.accounts && root.accounts.length > 0);

      rows.push({
        key: `root-${root.id}`,
        id: root.id,
        name: root.name,
        type: "ROOT",
        depth: 0,
        status: "Active",
        subType: "Organization Root",
        hasChildren,
        isExpanded: isRootExpanded,
        arn: root.arn,
      });

      if (isRootExpanded || searchLower) {
        if (root.childrenOUs) {
          for (const ou of root.childrenOUs) {
            flattenOU(ou, 1);
          }
        }
        if (root.accounts) {
          for (const acc of root.accounts) {
            flattenAccount(acc, 1);
          }
        }
      }
    }

    return rows;
  }, [data.roots, expandedNodes, search]);

  // Handle Add Account
  const handleAddAccount = () => {
    setActionError(null);
    setActionSuccess(null);
    startTransition(async () => {
      if (addAccountTab === "create") {
        const res = await createAccountAction({
          name: createAccountName,
          email: createAccountEmail,
          parentId: createAccountParent,
          roleName: createAccountRole,
        });
        if (res.success) {
          setShowAddAccountModal(false);
          setCreateAccountName("");
          setCreateAccountEmail("");
          setActionSuccess(`Account ${res.account?.name} (${res.account?.id}) created successfully.`);
          router.refresh();
        } else {
          setActionError(res.error || "Failed to create account.");
        }
      } else {
        const res = await inviteAccountAction({
          accountIdOrEmail: inviteAccountInput,
          parentId: inviteAccountParent,
        });
        if (res.success) {
          setShowAddAccountModal(false);
          setInviteAccountInput("");
          setActionSuccess(`Invitation sent to ${inviteAccountInput}. Account enrolled.`);
          router.refresh();
        } else {
          setActionError(res.error || "Failed to invite account.");
        }
      }
    });
  };

  // Handle Create OU
  const handleCreateOU = () => {
    setActionError(null);
    setActionSuccess(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("parentId", createOUParent);
      formData.set("name", createOUName);
      const res = await createOrganizationalUnitAction(formData);
      if (res.success) {
        setShowCreateOUModal(false);
        setCreateOUName("");
        setActionSuccess(`Organizational Unit "${res.ou?.Name}" (${res.ou?.Id}) created successfully.`);
        router.refresh();
      } else {
        setActionError(res.error || "Failed to create organizational unit.");
      }
    });
  };

  // Handle Move Account
  const handleMoveAccount = () => {
    if (!selectedItem || selectedItem.type !== "ACCOUNT") return;
    setActionError(null);
    setActionSuccess(null);
    startTransition(async () => {
      const res = await moveAccountAction(selectedItem.id, moveDestinationParent);
      if (res.success) {
        setShowMoveModal(false);
        setActionSuccess(`Account ${selectedItem.name} moved successfully.`);
        setSelectedItem(null);
        router.refresh();
      } else {
        setActionError(res.error || "Failed to move account.");
      }
    });
  };

  // Handle Delete OU
  const handleDeleteOU = () => {
    if (!selectedItem || selectedItem.type !== "OU") return;
    setActionError(null);
    setActionSuccess(null);
    startTransition(async () => {
      const res = await deleteOrganizationalUnitAction(selectedItem.id);
      if (res.success) {
        setShowDeleteOUModal(false);
        setActionSuccess(`Organizational Unit ${selectedItem.name} (${selectedItem.id}) deleted.`);
        setSelectedItem(null);
        router.refresh();
      } else {
        setActionError(res.error || "Failed to delete organizational unit.");
      }
    });
  };

  // Handle Close Account
  const handleCloseAccount = () => {
    if (!selectedItem || selectedItem.type !== "ACCOUNT") return;
    setActionError(null);
    setActionSuccess(null);
    startTransition(async () => {
      const res = await closeAccountAction(selectedItem.id);
      if (res.success) {
        setShowCloseAccountModal(false);
        setActionSuccess(`Account ${selectedItem.name} has been closed.`);
        setSelectedItem(null);
        router.refresh();
      } else {
        setActionError(res.error || "Failed to close account.");
      }
    });
  };

  return (
    <div>
      {/* Notifications / Alerts */}
      {actionSuccess && (
        <div className="mb-4 bg-[#f2f8f0] border border-[#1d8102] rounded p-3 text-[13px] text-[#1d8102] flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="text-[#545b64] font-bold text-sm ml-4">
            Dismiss
          </button>
        </div>
      )}

      {actionError && (
        <div className="mb-4 bg-[#fdf3f1] border border-[#d13212] rounded p-3 text-[13px] text-[#d13212] flex items-center justify-between">
          <span>Error: {actionError}</span>
          <button onClick={() => setActionError(null)} className="text-[#545b64] font-bold text-sm ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* Top 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-semibold text-[#545b64] uppercase tracking-wide">AWS Accounts</div>
          <div className="text-[28px] font-bold text-[#16191f] mt-1">{data.stats.totalAccounts}</div>
          <div className="text-[12px] text-[#545b64] mt-1">1 Management account, {data.stats.totalAccounts - 1} Member accounts</div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-semibold text-[#545b64] uppercase tracking-wide">Organizational Units</div>
          <div className="text-[28px] font-bold text-[#16191f] mt-1">{data.stats.totalOUs}</div>
          <div className="text-[12px] text-[#545b64] mt-1">Under {data.stats.totalRoots} organization root(s)</div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-semibold text-[#545b64] uppercase tracking-wide">Policies</div>
          <div className="text-[28px] font-bold text-[#16191f] mt-1">{data.stats.totalPolicies}</div>
          <div className="text-[12px] text-[#545b64] mt-1">Service control policies (SCPs)</div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-semibold text-[#545b64] uppercase tracking-wide">Feature Set</div>
          <div className="text-[28px] font-bold text-[#16191f] mt-1">ALL</div>
          <div className="text-[12px] text-[#1d8102] font-semibold mt-1">All features enabled</div>
        </div>
      </div>

      {/* Actions Toolbar */}
      <div className="bg-white border border-[#eaeded] rounded-t p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search by name, ID, or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-[280px] border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] text-[#16191f] focus:outline-none focus:border-[#ec7211]"
          />
          {selectedItem && (
            <div className="text-[13px] text-[#545b64] font-medium bg-[#f2f3f3] px-2.5 py-1 rounded border border-[#eaeded]">
              Selected: <span className="font-bold text-[#16191f]">{selectedItem.name}</span> ({selectedItem.type})
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Add an AWS account */}
          <button
            onClick={() => {
              setActionError(null);
              setShowAddAccountModal(true);
            }}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] bg-[#ec7211] hover:bg-[#eb5f07] text-white px-4 rounded shadow-sm transition-colors"
          >
            Add an AWS account
          </button>

          {/* Create organizational unit */}
          <button
            onClick={() => {
              setActionError(null);
              setShowCreateOUModal(true);
            }}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-3 rounded transition-colors"
          >
            Create organizational unit
          </button>

          {/* Move */}
          <button
            disabled={!selectedItem || selectedItem.type !== "ACCOUNT"}
            onClick={() => {
              setActionError(null);
              setShowMoveModal(true);
            }}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className={`whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] border rounded px-3 transition-colors ${
              selectedItem?.type === "ACCOUNT"
                ? "bg-white border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3]"
                : "bg-[#f2f3f3] border-[#d5dbdb] text-[#95999e] cursor-not-allowed"
            }`}
          >
            Move
          </button>

          {/* Delete OU */}
          {selectedItem?.type === "OU" && (
            <button
              onClick={() => {
                setActionError(null);
                setShowDeleteOUModal(true);
              }}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#d13212] text-[#d13212] hover:bg-[#fdf3f1] px-3 rounded transition-colors"
            >
              Delete OU
            </button>
          )}

          {/* Close Account */}
          {selectedItem?.type === "ACCOUNT" && selectedItem.id !== "000000000000" && (
            <button
              onClick={() => {
                setActionError(null);
                setShowCloseAccountModal(true);
              }}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#d13212] text-[#d13212] hover:bg-[#fdf3f1] px-3 rounded transition-colors"
            >
              Close account
            </button>
          )}
        </div>
      </div>

      {/* Hierarchical Tree Table */}
      <div className="bg-white border border-t-0 border-[#eaeded] rounded-b overflow-x-auto shadow-sm">
        <table className="w-full text-left text-[13px] text-[#16191f]">
          <thead className="bg-[#f8f9fa] border-b border-[#eaeded] font-semibold text-[#545b64] uppercase text-[11px] tracking-wider">
            <tr>
              <th className="py-2.5 px-4 w-[320px]">Name</th>
              <th className="py-2.5 px-4 w-[160px]">ID</th>
              <th className="py-2.5 px-4 w-[240px]">Email</th>
              <th className="py-2.5 px-4 w-[100px]">Status</th>
              <th className="py-2.5 px-4 w-[140px]">Type / Joined</th>
              <th className="py-2.5 px-4 w-[80px] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eaeded]">
            {visibleRows.map((row) => {
              const isSelected = selectedItem?.id === row.id;

              return (
                <tr
                  key={row.key}
                  onClick={() => setSelectedItem({ id: row.id, type: row.type, name: row.name })}
                  className={`hover:bg-[#f2f8fc] cursor-pointer transition-colors ${
                    isSelected ? "bg-[#ebf4fa]" : ""
                  } ${row.type === "ROOT" ? "bg-[#fcfdfe] font-bold" : ""}`}
                >
                  <td className="py-2.5 px-4 flex items-center">
                    <span style={{ marginLeft: `${row.depth * 20}px` }} className="mr-2 inline-flex items-center">
                      {row.hasChildren ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleNode(row.id);
                          }}
                          className="text-[#545b64] hover:text-[#16191f] text-xs font-mono mr-1.5 w-4 text-center font-bold"
                        >
                          {row.isExpanded ? "v" : ">"}
                        </button>
                      ) : (
                        <span className="w-4 mr-1.5" />
                      )}
                      <span className="font-semibold text-[#545b64] mr-1.5">
                        {row.type === "ROOT" ? "[Root]" : row.type === "OU" ? "[OU]" : "[Acc]"}
                      </span>
                    </span>
                    {row.type === "ROOT" ? (
                      <span className="text-[#16191f] font-bold">{row.name}</span>
                    ) : row.type === "OU" ? (
                      <Link
                        href={`/organizations/ou/${row.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-semibold text-[#0972d3] hover:underline"
                      >
                        {row.name}
                      </Link>
                    ) : (
                      <Link
                        href={`/organizations/accounts/${row.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-medium text-[#0972d3] hover:underline"
                      >
                        {row.name}
                      </Link>
                    )}
                    {row.isManagementAccount && (
                      <span className="ml-2 inline-block bg-[#f1faff] text-[#0073bb] border border-[#0073bb]/30 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded">
                        Management
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-[12px] text-[#545b64]">{row.id}</td>
                  <td className="py-2.5 px-4 text-[#545b64]">{row.email || "—"}</td>
                  <td className="py-2.5 px-4">
                    <span
                      className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded ${
                        row.status === "ACTIVE" || row.status === "Active"
                          ? "bg-[#f2f8f0] text-[#1d8102]"
                          : row.status === "SUSPENDED"
                          ? "bg-[#fff8e1] text-[#b7791f]"
                          : "bg-[#f2f3f3] text-[#545b64]"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-[#545b64]">{row.subType}</td>
                  <td className="py-2.5 px-4 text-right">
                    {row.type === "ROOT" ? (
                      <span className="text-[#545b64]">—</span>
                    ) : row.type === "OU" ? (
                      <Link
                        href={`/organizations/ou/${row.id}`}
                        className="text-[#0972d3] hover:underline font-medium text-[12px]"
                      >
                        View
                      </Link>
                    ) : (
                      <Link
                        href={`/organizations/accounts/${row.id}`}
                        className="text-[#0972d3] hover:underline font-medium text-[12px]"
                      >
                        View
                      </Link>
                    )}
                  </td>
                </tr>
              );
            })}
            {visibleRows.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[#545b64]">
                  No organizational units or accounts found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL: Add an AWS Account */}
      {showAddAccountModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg border border-[#eaeded] overflow-hidden">
            <div className="bg-[#f8f9fa] border-b border-[#eaeded] px-6 py-4 flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-[#16191f]">Add an AWS account</h2>
              <button
                onClick={() => setShowAddAccountModal(false)}
                className="text-[#545b64] hover:text-[#16191f] font-bold text-lg"
              >
                X
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="border-b border-[#eaeded] flex px-6">
              <button
                onClick={() => setAddAccountTab("create")}
                className={`py-3 mr-6 text-[13px] font-semibold border-b-2 transition-colors ${
                  addAccountTab === "create"
                    ? "border-[#ec7211] text-[#ec7211]"
                    : "border-transparent text-[#545b64] hover:text-[#16191f]"
                }`}
              >
                Create an AWS account
              </button>
              <button
                onClick={() => setAddAccountTab("invite")}
                className={`py-3 text-[13px] font-semibold border-b-2 transition-colors ${
                  addAccountTab === "invite"
                    ? "border-[#ec7211] text-[#ec7211]"
                    : "border-transparent text-[#545b64] hover:text-[#16191f]"
                }`}
              >
                Invite an AWS account
              </button>
            </div>

            <div className="p-6 space-y-4 text-[13px]">
              {addAccountTab === "create" ? (
                <>
                  <div>
                    <label className="block font-semibold text-[#16191f] mb-1">AWS account name</label>
                    <input
                      type="text"
                      placeholder="e.g. Production-Workloads"
                      value={createAccountName}
                      onChange={(e) => setCreateAccountName(e.target.value)}
                      className="w-full border border-[#aab7b8] rounded px-3 py-1.5 focus:outline-none focus:border-[#ec7211]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#16191f] mb-1">Email address of the account owner</label>
                    <input
                      type="email"
                      placeholder="e.g. prod-admin@example.com"
                      value={createAccountEmail}
                      onChange={(e) => setCreateAccountEmail(e.target.value)}
                      className="w-full border border-[#aab7b8] rounded px-3 py-1.5 focus:outline-none focus:border-[#ec7211]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#16191f] mb-1">IAM role name</label>
                    <input
                      type="text"
                      value={createAccountRole}
                      onChange={(e) => setCreateAccountRole(e.target.value)}
                      className="w-full border border-[#aab7b8] rounded px-3 py-1.5 focus:outline-none focus:border-[#ec7211]"
                    />
                    <p className="text-[11px] text-[#545b64] mt-1">
                      Role created automatically to allow administrators in the management account to access this account.
                    </p>
                  </div>
                  <div>
                    <label className="block font-semibold text-[#16191f] mb-1">Parent container</label>
                    <select
                      value={createAccountParent}
                      onChange={(e) => setCreateAccountParent(e.target.value)}
                      className="w-full border border-[#aab7b8] rounded px-3 py-1.5 focus:outline-none focus:border-[#ec7211]"
                    >
                      {parentOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block font-semibold text-[#16191f] mb-1">Account ID or Email address</label>
                    <input
                      type="text"
                      placeholder="12-digit account ID or owner email"
                      value={inviteAccountInput}
                      onChange={(e) => setInviteAccountInput(e.target.value)}
                      className="w-full border border-[#aab7b8] rounded px-3 py-1.5 focus:outline-none focus:border-[#ec7211]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#16191f] mb-1">Parent container</label>
                    <select
                      value={inviteAccountParent}
                      onChange={(e) => setInviteAccountParent(e.target.value)}
                      className="w-full border border-[#aab7b8] rounded px-3 py-1.5 focus:outline-none focus:border-[#ec7211]"
                    >
                      {parentOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>

            <div className="bg-[#f8f9fa] border-t border-[#eaeded] px-6 py-3 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddAccountModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-4 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleAddAccount}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] bg-[#ec7211] hover:bg-[#eb5f07] text-white px-4 rounded shadow-sm transition-colors disabled:opacity-50"
              >
                {isPending ? "Processing..." : addAccountTab === "create" ? "Create AWS account" : "Send invitation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Create Organizational Unit */}
      {showCreateOUModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg border border-[#eaeded] overflow-hidden">
            <div className="bg-[#f8f9fa] border-b border-[#eaeded] px-6 py-4 flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-[#16191f]">Create organizational unit</h2>
              <button
                onClick={() => setShowCreateOUModal(false)}
                className="text-[#545b64] hover:text-[#16191f] font-bold text-lg"
              >
                X
              </button>
            </div>

            <div className="p-6 space-y-4 text-[13px]">
              <div>
                <label className="block font-semibold text-[#16191f] mb-1">Parent container</label>
                <select
                  value={createOUParent}
                  onChange={(e) => setCreateOUParent(e.target.value)}
                  className="w-full border border-[#aab7b8] rounded px-3 py-1.5 focus:outline-none focus:border-[#ec7211]"
                >
                  {parentOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-[#545b64] mt-1">
                  The Root or existing Organizational Unit that will contain this new OU.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-[#16191f] mb-1">Organizational unit name</label>
                <input
                  type="text"
                  placeholder="e.g. Core, Security, Workloads, Sandbox"
                  value={createOUName}
                  onChange={(e) => setCreateOUName(e.target.value)}
                  className="w-full border border-[#aab7b8] rounded px-3 py-1.5 focus:outline-none focus:border-[#ec7211]"
                />
              </div>
            </div>

            <div className="bg-[#f8f9fa] border-t border-[#eaeded] px-6 py-3 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCreateOUModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-4 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending || !createOUName.trim()}
                onClick={handleCreateOU}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] bg-[#ec7211] hover:bg-[#eb5f07] text-white px-4 rounded shadow-sm transition-colors disabled:opacity-50"
              >
                {isPending ? "Creating..." : "Create organizational unit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Move Account */}
      {showMoveModal && selectedItem?.type === "ACCOUNT" && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg border border-[#eaeded] overflow-hidden">
            <div className="bg-[#f8f9fa] border-b border-[#eaeded] px-6 py-4 flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-[#16191f]">Move account</h2>
              <button
                onClick={() => setShowMoveModal(false)}
                className="text-[#545b64] hover:text-[#16191f] font-bold text-lg"
              >
                X
              </button>
            </div>

            <div className="p-6 space-y-4 text-[13px]">
              <p className="text-[#545b64]">
                Move <strong className="text-[#16191f]">{selectedItem.name}</strong> ({selectedItem.id}) to a different
                Root or Organizational Unit. Policies attached to the target parent will automatically apply.
              </p>

              <div>
                <label className="block font-semibold text-[#16191f] mb-1">Destination container</label>
                <select
                  value={moveDestinationParent}
                  onChange={(e) => setMoveDestinationParent(e.target.value)}
                  className="w-full border border-[#aab7b8] rounded px-3 py-1.5 focus:outline-none focus:border-[#ec7211]"
                >
                  {parentOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-[#f8f9fa] border-t border-[#eaeded] px-6 py-3 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowMoveModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-4 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleMoveAccount}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] bg-[#ec7211] hover:bg-[#eb5f07] text-white px-4 rounded shadow-sm transition-colors disabled:opacity-50"
              >
                {isPending ? "Moving..." : "Move account"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Delete OU */}
      {showDeleteOUModal && selectedItem?.type === "OU" && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg border border-[#eaeded] overflow-hidden">
            <div className="bg-[#f8f9fa] border-b border-[#eaeded] px-6 py-4 flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-[#d13212]">Delete organizational unit</h2>
              <button
                onClick={() => setShowDeleteOUModal(false)}
                className="text-[#545b64] hover:text-[#16191f] font-bold text-lg"
              >
                X
              </button>
            </div>

            <div className="p-6 space-y-4 text-[13px]">
              <p className="text-[#545b64]">
                Are you sure you want to delete organizational unit{" "}
                <strong className="text-[#16191f]">{selectedItem.name}</strong> ({selectedItem.id})? This action cannot be
                undone.
              </p>
              <div className="bg-[#fff8e1] border border-[#b7791f] rounded p-3 text-[12px] text-[#744210]">
                <strong>Notice:</strong> An organizational unit can only be deleted if all member accounts and child OUs
                have been moved or removed.
              </div>
            </div>

            <div className="bg-[#f8f9fa] border-t border-[#eaeded] px-6 py-3 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteOUModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-4 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleDeleteOU}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] bg-[#d13212] hover:bg-[#b02a0f] text-white px-4 rounded shadow-sm transition-colors disabled:opacity-50"
              >
                {isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Close Account */}
      {showCloseAccountModal && selectedItem?.type === "ACCOUNT" && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg border border-[#eaeded] overflow-hidden">
            <div className="bg-[#f8f9fa] border-b border-[#eaeded] px-6 py-4 flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-[#d13212]">Close account</h2>
              <button
                onClick={() => setShowCloseAccountModal(false)}
                className="text-[#545b64] hover:text-[#16191f] font-bold text-lg"
              >
                X
              </button>
            </div>

            <div className="p-6 space-y-4 text-[13px]">
              <p className="text-[#545b64]">
                Are you sure you want to close account{" "}
                <strong className="text-[#16191f]">{selectedItem.name}</strong> ({selectedItem.id})? All resources in
                this account will stop and become inaccessible.
              </p>
            </div>

            <div className="bg-[#f8f9fa] border-t border-[#eaeded] px-6 py-3 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCloseAccountModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-4 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleCloseAccount}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] bg-[#d13212] hover:bg-[#b02a0f] text-white px-4 rounded shadow-sm transition-colors disabled:opacity-50"
              >
                {isPending ? "Closing..." : "Close account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
