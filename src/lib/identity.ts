/**
 * lib/identity.ts – Server-side Active Identity Manager
 *
 * Tracks the active user/role in session cookies and fetches attached policy
 * documents from the local AWS Emulator for client evaluation.
 */

"use server";

import { cookies } from "next/headers";
import { iam } from "./aws";
import {
  ListUsersCommand,
  ListRolesCommand,
  ListAttachedUserPoliciesCommand,
  ListUserPoliciesCommand,
  GetUserPolicyCommand,
  GetPolicyCommand,
  GetPolicyVersionCommand,
  ListAttachedRolePoliciesCommand,
  ListRolePoliciesCommand,
  GetRolePolicyCommand,
} from "@aws-sdk/client-iam";
import { ActiveIdentity, PolicyDocument } from "./permissions";

const COOKIE_NAME = "aws_active_identity";

const DEFAULT_ADMIN: ActiveIdentity = {
  type: "admin",
  name: "emulator",
  accountId: "000000000000",
  policies: [
    {
      name: "AdministratorAccess",
      document: {
        Version: "2012-10-17",
        Statement: [{ Effect: "Allow", Action: "*", Resource: "*" }],
      },
    },
  ],
};

/**
 * Helper to safely parse policy document whether raw JSON string, URL-encoded string, or object.
 */
function parsePolicyDocument(docRaw: unknown): PolicyDocument | undefined {
  if (!docRaw) return undefined;
  if (typeof docRaw === "object") return docRaw as PolicyDocument;
  if (typeof docRaw === "string") {
    try {
      return JSON.parse(decodeURIComponent(docRaw)) as PolicyDocument;
    } catch {
      try {
        return JSON.parse(docRaw) as PolicyDocument;
      } catch {
        return undefined;
      }
    }
  }
  return undefined;
}

/**
 * Returns the currently active identity, always retrieving live policy documents
 * from the emulator so permission changes take effect immediately.
 */
export async function getActiveIdentity(): Promise<ActiveIdentity> {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get(COOKIE_NAME)?.value;
    if (!raw) return DEFAULT_ADMIN;
    const parsed = JSON.parse(raw) as ActiveIdentity;
    if (parsed.type === "admin" || parsed.name === "emulator") {
      return DEFAULT_ADMIN;
    }

    // Always fetch live policy documents for the active user or role
    let freshPolicies: { name: string; document?: PolicyDocument }[] = [];
    if (parsed.type === "user") {
      freshPolicies = await fetchUserPolicyDocuments(parsed.name);
    } else if (parsed.type === "role") {
      freshPolicies = await fetchRolePolicyDocuments(parsed.name);
    }

    return {
      type: parsed.type,
      name: parsed.name,
      accountId: parsed.accountId || "000000000000",
      policies: freshPolicies,
    };
  } catch {
    return DEFAULT_ADMIN;
  }
}

/**
 * Loads all policy documents for a given IAM User (attached managed + inline policies).
 */
async function fetchUserPolicyDocuments(userName: string): Promise<{ name: string; document?: PolicyDocument }[]> {
  try {
    const results: { name: string; document?: PolicyDocument }[] = [];

    // 1. Attached managed policies
    const attachedRes = await iam.send(new ListAttachedUserPoliciesCommand({ UserName: userName }));
    const attached = attachedRes.AttachedPolicies || [];

    for (const p of attached) {
      if (!p.PolicyArn) continue;
      try {
        const pol = await iam.send(new GetPolicyCommand({ PolicyArn: p.PolicyArn }));
        const defaultVerId = pol.Policy?.DefaultVersionId;
        if (!defaultVerId) continue;

        const verRes = await iam.send(
          new GetPolicyVersionCommand({ PolicyArn: p.PolicyArn, VersionId: defaultVerId })
        );
        const parsed = parsePolicyDocument(verRes.PolicyVersion?.Document);
        if (parsed) {
          results.push({ name: p.PolicyName || p.PolicyArn, document: parsed });
        }
      } catch (err) {
        console.warn(`Failed to load policy document for ${p.PolicyArn}:`, err);
      }
    }

    // 2. Inline user policies
    try {
      const inlineRes = await iam.send(new ListUserPoliciesCommand({ UserName: userName }));
      for (const polName of inlineRes.PolicyNames || []) {
        try {
          const polRes = await iam.send(new GetUserPolicyCommand({ UserName: userName, PolicyName: polName }));
          const parsed = parsePolicyDocument(polRes.PolicyDocument);
          if (parsed) {
            results.push({ name: polName, document: parsed });
          }
        } catch { /* ignore */ }
      }
    } catch { /* ignore */ }

    return results;
  } catch (e) {
    console.warn(`Failed to list policies for user ${userName}:`, e);
    return [];
  }
}

/**
 * Loads all policy documents for a given IAM Role (attached managed + inline policies).
 */
async function fetchRolePolicyDocuments(roleName: string): Promise<{ name: string; document?: PolicyDocument }[]> {
  try {
    const results: { name: string; document?: PolicyDocument }[] = [];

    // 1. Attached managed policies
    const attachedRes = await iam.send(new ListAttachedRolePoliciesCommand({ RoleName: roleName }));
    const attached = attachedRes.AttachedPolicies || [];

    for (const p of attached) {
      if (!p.PolicyArn) continue;
      try {
        const pol = await iam.send(new GetPolicyCommand({ PolicyArn: p.PolicyArn }));
        const defaultVerId = pol.Policy?.DefaultVersionId;
        if (!defaultVerId) continue;

        const verRes = await iam.send(
          new GetPolicyVersionCommand({ PolicyArn: p.PolicyArn, VersionId: defaultVerId })
        );
        const parsed = parsePolicyDocument(verRes.PolicyVersion?.Document);
        if (parsed) {
          results.push({ name: p.PolicyName || p.PolicyArn, document: parsed });
        }
      } catch (err) {
        console.warn(`Failed to load policy document for ${p.PolicyArn}:`, err);
      }
    }

    // 2. Inline role policies
    try {
      const inlineRes = await iam.send(new ListRolePoliciesCommand({ RoleName: roleName }));
      for (const polName of inlineRes.PolicyNames || []) {
        try {
          const polRes = await iam.send(new GetRolePolicyCommand({ RoleName: roleName, PolicyName: polName }));
          const parsed = parsePolicyDocument(polRes.PolicyDocument);
          if (parsed) {
            results.push({ name: polName, document: parsed });
          }
        } catch { /* ignore */ }
      }
    } catch { /* ignore */ }

    return results;
  } catch (e) {
    console.warn(`Failed to list policies for role ${roleName}:`, e);
    return [];
  }
}

/**
 * Switches the active identity (Admin vs User vs Role) and persists in cookie.
 */
export async function switchIdentityAction(type: "admin" | "user" | "role", name: string): Promise<ActiveIdentity> {
  const cookieStore = await cookies();

  if (type === "admin" || name === "emulator") {
    cookieStore.delete(COOKIE_NAME);
    return DEFAULT_ADMIN;
  }

  const identityPayload = {
    type,
    name,
    accountId: "000000000000",
  };

  cookieStore.set(COOKIE_NAME, JSON.stringify(identityPayload), {
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    sameSite: "lax",
  });

  let policies: { name: string; document?: PolicyDocument }[] = [];
  if (type === "user") {
    policies = await fetchUserPolicyDocuments(name);
  } else if (type === "role") {
    policies = await fetchRolePolicyDocuments(name);
  }

  return {
    ...identityPayload,
    policies,
  };
}

/**
 * Resets back to Administrator access.
 */
export async function resetToAdminAction(): Promise<ActiveIdentity> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  return DEFAULT_ADMIN;
}

export type IdentitySummary = {
  currentIdentity: ActiveIdentity;
  users: {
    userName: string;
    createDate?: string;
    attachedPolicies: string[];
  }[];
  roles: {
    roleName: string;
    createDate?: string;
    arn?: string;
  }[];
};

/**
 * Queries available IAM Users and Roles from the local emulator for the Switch modal.
 */
export async function getAvailableIdentities(): Promise<IdentitySummary> {
  const currentIdentity = await getActiveIdentity();

  try {
    const usersRes = await iam.send(new ListUsersCommand({ MaxItems: 50 }));
    const rawUsers = usersRes.Users || [];

    const users = await Promise.all(
      rawUsers.map(async (u) => {
        const uName = u.UserName || "";
        let attachedPolicies: string[] = [];
        try {
          const polRes = await iam.send(new ListAttachedUserPoliciesCommand({ UserName: uName }));
          attachedPolicies = (polRes.AttachedPolicies || []).map((p) => p.PolicyName || "");
        } catch { /* ignore */ }

        return {
          userName: uName,
          createDate: u.CreateDate ? new Date(u.CreateDate).toLocaleDateString() : undefined,
          attachedPolicies,
        };
      })
    );

    const rolesRes = await iam.send(new ListRolesCommand({ MaxItems: 50 }));
    const rawRoles = (rolesRes.Roles || []).filter((r) => !r.RoleName?.startsWith("aws-service-role/"));

    const roles = rawRoles.map((r) => ({
      roleName: r.RoleName || "",
      createDate: r.CreateDate ? new Date(r.CreateDate).toLocaleDateString() : undefined,
      arn: r.Arn,
    }));

    return {
      currentIdentity,
      users,
      roles,
    };
  } catch (err) {
    console.warn("Failed to list identities from emulator:", err);
    return {
      currentIdentity,
      users: [],
      roles: [],
    };
  }
}
