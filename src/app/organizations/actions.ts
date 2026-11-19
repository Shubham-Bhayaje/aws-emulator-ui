/**
 * src/app/organizations/actions.ts – Server Actions for AWS Organizations.
 * Fully backed by the live local AWS Emulator and state persistence.
 * Zero emojis, Cloudscape enterprise standard.
 */

"use server";

import { revalidatePath } from "next/cache";
import {
  loadOrganizationsState,
  saveOrganizationsState,
  fetchLiveOrganization,
  fetchLiveRoots,
  fetchLiveOUsForParent,
  createLiveOU,
  deleteLiveOU,
  describeLiveOU,
  AccountRecord,
  SCPRecord,
  TrustedServiceRecord,
} from "@/lib/organizationsStore";

export interface OrgHierarchyOU {
  id: string;
  arn: string;
  name: string;
  parentId: string;
  path?: string;
  childrenOUs: OrgHierarchyOU[];
  accounts: AccountRecord[];
}

export interface OrgHierarchyRoot {
  id: string;
  arn: string;
  name: string;
  policyTypes: Array<{ type?: string; status?: string }>;
  childrenOUs: OrgHierarchyOU[];
  accounts: AccountRecord[];
}

export interface OrgHierarchyData {
  organization: {
    id: string;
    arn: string;
    featureSet: string;
    masterAccountId: string;
    masterAccountArn: string;
    masterAccountEmail: string;
    availablePolicyTypes: Array<{ type?: string; status?: string }>;
  } | null;
  roots: OrgHierarchyRoot[];
  allOUs: Array<{ id: string; name: string; arn: string; parentId: string }>;
  allAccounts: AccountRecord[];
  allPolicies: SCPRecord[];
  trustedServices: TrustedServiceRecord[];
  stats: {
    totalAccounts: number;
    totalOUs: number;
    totalPolicies: number;
    totalRoots: number;
  };
}

/**
 * Fetch full live Organizations hierarchy.
 */
export async function fetchOrganizationHierarchy(): Promise<OrgHierarchyData> {
  const [orgRes, rootsRes] = await Promise.all([
    fetchLiveOrganization(),
    fetchLiveRoots(),
  ]);

  const defaultRootId = rootsRes.roots[0]?.Id || "r-7qygd7aa";
  const state = loadOrganizationsState(defaultRootId);

  // Sync Master Account from live DescribeOrganization response
  const org = orgRes.org;
  if (org && org.MasterAccountId) {
    const existingMaster = state.accounts.find((a) => a.id === org.MasterAccountId);
    if (existingMaster) {
      existingMaster.email = org.MasterAccountEmail || existingMaster.email;
      existingMaster.arn = org.MasterAccountArn || existingMaster.arn;
      existingMaster.isManagementAccount = true;
    } else {
      state.accounts.unshift({
        id: org.MasterAccountId,
        name: "Management Account",
        email: org.MasterAccountEmail || `${org.MasterAccountId}@example.com`,
        arn: org.MasterAccountArn || `arn:aws:organizations::${org.MasterAccountId}:account/${org.Id}/${org.MasterAccountId}`,
        status: "ACTIVE",
        joinedMethod: "INVITED",
        joinedTimestamp: new Date().toISOString(),
        parentId: defaultRootId,
        roleName: "OrganizationAccountAccessRole",
        attachedPolicies: ["p-FullAWSAccess"],
        tags: { Environment: "Management", ManagedBy: "AWS-Organizations" },
        isManagementAccount: true,
      });
      saveOrganizationsState(state);
    }
  }

  // Fetch live OUs for root
  const rootOUsRes = await fetchLiveOUsForParent(defaultRootId);
  const rootOUs = rootOUsRes.ous || [];

  // Recursively fetch child OUs
  const allOUsList: Array<{ id: string; name: string; arn: string; parentId: string }> = [];

  async function resolveOUChildren(ou: any, parentId: string): Promise<OrgHierarchyOU> {
    const currentOUId = ou.Id || "";
    allOUsList.push({
      id: currentOUId,
      name: ou.Name || "",
      arn: ou.Arn || "",
      parentId: parentId,
    });

    const childRes = await fetchLiveOUsForParent(currentOUId);
    const rawChildren = childRes.ous || [];
    const childrenOUs: OrgHierarchyOU[] = [];

    for (const child of rawChildren) {
      const resolved = await resolveOUChildren(child, currentOUId);
      childrenOUs.push(resolved);
    }

    const ouAccounts = state.accounts.filter((a) => a.parentId === currentOUId);

    return {
      id: currentOUId,
      arn: ou.Arn || "",
      name: ou.Name || "",
      parentId: parentId,
      path: ou.Path,
      childrenOUs,
      accounts: ouAccounts,
    };
  }

  const structuredRoots: OrgHierarchyRoot[] = [];

  for (const r of rootsRes.roots) {
    const rId = r.Id || defaultRootId;
    const directOUChildren: OrgHierarchyOU[] = [];

    const directOUs = await fetchLiveOUsForParent(rId);
    for (const ou of directOUs.ous || []) {
      const resolved = await resolveOUChildren(ou, rId);
      directOUChildren.push(resolved);
    }

    const rootAccounts = state.accounts.filter((a) => a.parentId === rId);

    structuredRoots.push({
      id: rId,
      arn: r.Arn || "",
      name: r.Name || "Root",
      policyTypes: (r.PolicyTypes || []).map((pt) => ({
        type: pt.Type,
        status: pt.Status,
      })),
      childrenOUs: directOUChildren,
      accounts: rootAccounts,
    });
  }

  // Fallback if roots list is empty
  if (structuredRoots.length === 0) {
    const directOUChildren: OrgHierarchyOU[] = [];
    for (const ou of rootOUs) {
      const resolved = await resolveOUChildren(ou, defaultRootId);
      directOUChildren.push(resolved);
    }
    const rootAccounts = state.accounts.filter((a) => a.parentId === defaultRootId);

    structuredRoots.push({
      id: defaultRootId,
      arn: `arn:aws:organizations::000000000000:root/o-8sh3tqaaaa/${defaultRootId}`,
      name: "Root",
      policyTypes: [{ type: "SERVICE_CONTROL_POLICY", status: "ENABLED" }],
      childrenOUs: directOUChildren,
      accounts: rootAccounts,
    });
  }

  const orgId = org?.Id || rootsRes.roots[0]?.Arn?.split("/")[1] || "o-8sh3tqaaaa";
  const masterAccountId = org?.MasterAccountId || "000000000000";

  return {
    organization: {
      id: orgId,
      arn: org?.Arn || `arn:aws:organizations::${masterAccountId}:organization/${orgId}`,
      featureSet: org?.FeatureSet || "ALL",
      masterAccountId: masterAccountId,
      masterAccountArn: org?.MasterAccountArn || `arn:aws:organizations::${masterAccountId}:account/${orgId}/${masterAccountId}`,
      masterAccountEmail: org?.MasterAccountEmail || `${masterAccountId}@example.com`,
      availablePolicyTypes: (org?.AvailablePolicyTypes || [{ Type: "SERVICE_CONTROL_POLICY", Status: "ENABLED" }]).map((pt) => ({
        type: pt.Type || "SERVICE_CONTROL_POLICY",
        status: pt.Status || "ENABLED",
      })),
    },
    roots: structuredRoots,
    allOUs: allOUsList,
    allAccounts: state.accounts,
    allPolicies: state.policies,
    trustedServices: state.trustedServices,
    stats: {
      totalAccounts: state.accounts.length,
      totalOUs: allOUsList.length,
      totalPolicies: state.policies.length,
      totalRoots: structuredRoots.length,
    },
  };
}

/**
 * Create a new live Organizational Unit.
 */
export async function createOrganizationalUnitAction(formData: FormData) {
  const parentId = (formData.get("parentId") as string)?.trim();
  const name = (formData.get("name") as string)?.trim();

  if (!parentId) {
    return { success: false, error: "Parent ID is required." };
  }
  if (!name) {
    return { success: false, error: "Organizational unit name is required." };
  }

  const res = await createLiveOU(parentId, name);
  if (!res.success) {
    return { success: false, error: res.error };
  }

  revalidatePath("/organizations");
  revalidatePath(`/organizations/ou/${res.ou?.Id}`);
  return { success: true, ou: res.ou };
}

/**
 * Delete a live Organizational Unit.
 */
export async function deleteOrganizationalUnitAction(ouId: string) {
  if (!ouId) {
    return { success: false, error: "Organizational Unit ID is required." };
  }

  // Safety check: verify no accounts or child OUs are attached
  const state = loadOrganizationsState();
  const accountsInOU = state.accounts.filter((a) => a.parentId === ouId);
  if (accountsInOU.length > 0) {
    return {
      success: false,
      error: `Cannot delete OU ${ouId} because it contains ${accountsInOU.length} member account(s). Move or remove accounts before deleting.`,
    };
  }

  const childOUs = await fetchLiveOUsForParent(ouId);
  if (childOUs.ous && childOUs.ous.length > 0) {
    return {
      success: false,
      error: `Cannot delete OU ${ouId} because it contains child organizational units. Move or delete child units first.`,
    };
  }

  const res = await deleteLiveOU(ouId);
  if (!res.success) {
    return { success: false, error: res.error };
  }

  revalidatePath("/organizations");
  return { success: true };
}

/**
 * Create an AWS Account.
 */
export async function createAccountAction(params: {
  name: string;
  email: string;
  parentId: string;
  roleName?: string;
  tags?: Record<string, string>;
}) {
  const name = params.name.trim();
  const email = params.email.trim();
  const parentId = params.parentId.trim();
  const roleName = params.roleName?.trim() || "OrganizationAccountAccessRole";

  if (!name) return { success: false, error: "Account name is required." };
  if (!email) return { success: false, error: "Account owner email is required." };
  if (!parentId) return { success: false, error: "Parent ID is required." };

  const state = loadOrganizationsState();

  // Check uniqueness of email
  if (state.accounts.some((a) => a.email.toLowerCase() === email.toLowerCase())) {
    return { success: false, error: `An account with email ${email} already exists in this organization.` };
  }

  // Generate a random 12-digit AWS Account ID
  let newAccountId = "";
  do {
    newAccountId = Math.floor(100000000000 + Math.random() * 900000000000).toString();
  } while (state.accounts.some((a) => a.id === newAccountId));

  const orgRes = await fetchLiveOrganization();
  const orgId = orgRes.org?.Id || "o-8sh3tqaaaa";

  const newAccount: AccountRecord = {
    id: newAccountId,
    name,
    email,
    arn: `arn:aws:organizations::000000000000:account/${orgId}/${newAccountId}`,
    status: "ACTIVE",
    joinedMethod: "CREATED",
    joinedTimestamp: new Date().toISOString(),
    parentId,
    roleName,
    attachedPolicies: ["p-FullAWSAccess"],
    tags: params.tags || { ManagedBy: "AWS-Organizations" },
    isManagementAccount: false,
  };

  state.accounts.push(newAccount);
  saveOrganizationsState(state);

  revalidatePath("/organizations");
  revalidatePath(`/organizations/accounts/${newAccountId}`);
  return { success: true, account: newAccount };
}

/**
 * Invite an existing AWS Account.
 */
export async function inviteAccountAction(params: {
  accountIdOrEmail: string;
  parentId: string;
  notes?: string;
}) {
  const input = params.accountIdOrEmail.trim();
  const parentId = params.parentId.trim();

  if (!input) return { success: false, error: "Account ID or email is required." };
  if (!parentId) return { success: false, error: "Parent ID is required." };

  const state = loadOrganizationsState();

  let targetId = input;
  let targetEmail = input.includes("@") ? input : `${input}@member.example.com`;

  if (/^\d{12}$/.test(input)) {
    targetId = input;
    targetEmail = `${input}@member.example.com`;
  } else if (input.includes("@")) {
    targetId = Math.floor(100000000000 + Math.random() * 900000000000).toString();
    targetEmail = input;
  } else {
    return { success: false, error: "Enter a valid 12-digit AWS Account ID or valid email address." };
  }

  if (state.accounts.some((a) => a.id === targetId || a.email.toLowerCase() === targetEmail.toLowerCase())) {
    return { success: false, error: `Account ${input} is already a member of this organization.` };
  }

  const orgRes = await fetchLiveOrganization();
  const orgId = orgRes.org?.Id || "o-8sh3tqaaaa";

  const newAccount: AccountRecord = {
    id: targetId,
    name: input.includes("@") ? input.split("@")[0] : `Account-${targetId.slice(-4)}`,
    email: targetEmail,
    arn: `arn:aws:organizations::000000000000:account/${orgId}/${targetId}`,
    status: "ACTIVE",
    joinedMethod: "INVITED",
    joinedTimestamp: new Date().toISOString(),
    parentId,
    roleName: "OrganizationAccountAccessRole",
    attachedPolicies: ["p-FullAWSAccess"],
    tags: { Invited: "true", ManagedBy: "AWS-Organizations" },
    isManagementAccount: false,
  };

  state.accounts.push(newAccount);
  saveOrganizationsState(state);

  revalidatePath("/organizations");
  revalidatePath(`/organizations/accounts/${targetId}`);
  return { success: true, account: newAccount };
}

/**
 * Move an account to a different parent (Root or OU).
 */
export async function moveAccountAction(accountId: string, destinationParentId: string) {
  if (!accountId || !destinationParentId) {
    return { success: false, error: "Account ID and Destination Parent ID are required." };
  }

  const state = loadOrganizationsState();
  const acc = state.accounts.find((a) => a.id === accountId);
  if (!acc) {
    return { success: false, error: `Account ${accountId} not found.` };
  }

  acc.parentId = destinationParentId;
  saveOrganizationsState(state);

  revalidatePath("/organizations");
  revalidatePath(`/organizations/accounts/${accountId}`);
  return { success: true };
}

/**
 * Close a member account.
 */
export async function closeAccountAction(accountId: string) {
  const state = loadOrganizationsState();
  const accIndex = state.accounts.findIndex((a) => a.id === accountId);
  if (accIndex === -1) {
    return { success: false, error: `Account ${accountId} not found.` };
  }

  if (state.accounts[accIndex].isManagementAccount || accountId === "000000000000") {
    return { success: false, error: "Cannot close the management account of the organization." };
  }

  // Update status or remove
  state.accounts[accIndex].status = "PENDING_CLOSURE";
  saveOrganizationsState(state);

  revalidatePath("/organizations");
  revalidatePath(`/organizations/accounts/${accountId}`);
  return { success: true };
}

/**
 * Create a new Service Control Policy (SCP).
 */
export async function createSCPAction(params: {
  name: string;
  description: string;
  content: string;
  targetIds?: string[];
}) {
  const name = params.name.trim();
  const description = params.description.trim();
  const content = params.content.trim();

  if (!name) return { success: false, error: "Policy name is required." };
  if (!content) return { success: false, error: "Policy document is required." };

  try {
    JSON.parse(content);
  } catch {
    return { success: false, error: "Policy document must be valid JSON." };
  }

  const state = loadOrganizationsState();
  const policyId = `p-${name.replace(/[^a-zA-Z0-9]/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;

  const orgRes = await fetchLiveOrganization();
  const orgId = orgRes.org?.Id || "o-8sh3tqaaaa";

  const newPolicy: SCPRecord = {
    id: policyId,
    name,
    description: description || "Customer managed Service Control Policy",
    arn: `arn:aws:organizations::000000000000:policy/${orgId}/service_control_policy/${policyId}`,
    type: "SERVICE_CONTROL_POLICY",
    awsManaged: false,
    content,
    createdDate: new Date().toISOString(),
    attachedTargets: [],
  };

  // Attach to specified targets
  if (params.targetIds && params.targetIds.length > 0) {
    for (const tId of params.targetIds) {
      const acc = state.accounts.find((a) => a.id === tId);
      if (acc) {
        newPolicy.attachedTargets.push({ id: tId, name: acc.name, type: "ACCOUNT" });
        if (!acc.attachedPolicies.includes(policyId)) {
          acc.attachedPolicies.push(policyId);
        }
      }
    }
  }

  state.policies.push(newPolicy);
  saveOrganizationsState(state);

  revalidatePath("/organizations/policies");
  revalidatePath(`/organizations/policies/${policyId}`);
  return { success: true, policy: newPolicy };
}

/**
 * Delete a Service Control Policy.
 */
export async function deleteSCPAction(policyId: string) {
  const state = loadOrganizationsState();
  const pIndex = state.policies.findIndex((p) => p.id === policyId);
  if (pIndex === -1) {
    return { success: false, error: `Policy ${policyId} not found.` };
  }

  if (state.policies[pIndex].awsManaged) {
    return { success: false, error: "Cannot delete an AWS managed policy." };
  }

  // Detach from all accounts
  for (const acc of state.accounts) {
    acc.attachedPolicies = acc.attachedPolicies.filter((p) => p !== policyId);
  }

  state.policies.splice(pIndex, 1);
  saveOrganizationsState(state);

  revalidatePath("/organizations/policies");
  return { success: true };
}

/**
 * Attach policy to a target (Root, OU, or Account).
 */
export async function attachPolicyAction(
  policyId: string,
  targetId: string,
  targetName: string,
  targetType: "ROOT" | "ORGANIZATIONAL_UNIT" | "ACCOUNT"
) {
  const state = loadOrganizationsState();
  const policy = state.policies.find((p) => p.id === policyId);
  if (!policy) return { success: false, error: `Policy ${policyId} not found.` };

  if (!policy.attachedTargets.some((t) => t.id === targetId)) {
    policy.attachedTargets.push({ id: targetId, name: targetName, type: targetType });
  }

  if (targetType === "ACCOUNT") {
    const acc = state.accounts.find((a) => a.id === targetId);
    if (acc && !acc.attachedPolicies.includes(policyId)) {
      acc.attachedPolicies.push(policyId);
    }
  }

  saveOrganizationsState(state);
  revalidatePath("/organizations/policies");
  revalidatePath(`/organizations/policies/${policyId}`);
  revalidatePath(`/organizations/accounts/${targetId}`);
  return { success: true };
}

/**
 * Detach policy from a target.
 */
export async function detachPolicyAction(policyId: string, targetId: string) {
  const state = loadOrganizationsState();
  const policy = state.policies.find((p) => p.id === policyId);
  if (!policy) return { success: false, error: `Policy ${policyId} not found.` };

  policy.attachedTargets = policy.attachedTargets.filter((t) => t.id !== targetId);

  const acc = state.accounts.find((a) => a.id === targetId);
  if (acc) {
    acc.attachedPolicies = acc.attachedPolicies.filter((p) => p !== policyId);
  }

  saveOrganizationsState(state);
  revalidatePath("/organizations/policies");
  revalidatePath(`/organizations/policies/${policyId}`);
  revalidatePath(`/organizations/accounts/${targetId}`);
  return { success: true };
}

/**
 * Toggle trusted service access in Organizations Settings.
 */
export async function toggleTrustedServiceAction(servicePrincipal: string, enable: boolean) {
  const state = loadOrganizationsState();
  const svc = state.trustedServices.find((s) => s.servicePrincipal === servicePrincipal);
  if (svc) {
    svc.status = enable ? "ENABLED" : "DISABLED";
    saveOrganizationsState(state);
  }

  revalidatePath("/organizations/settings");
  return { success: true };
}
