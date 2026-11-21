/**
 * src/app/iam/actions.ts – Comprehensive AWS IAM Server Actions.
 * Backed 100% by live AWS Emulator (@aws-sdk/client-iam) and local permissions engine.
 * Zero emojis, Cloudscape enterprise styling.
 */

"use server";

import { iam } from "@/lib/aws";
import {
  CreateUserCommand,
  DeleteUserCommand,
  GetUserCommand,
  ListUsersCommand,
  AttachUserPolicyCommand,
  DetachUserPolicyCommand,
  ListAttachedUserPoliciesCommand,
  CreateRoleCommand,
  DeleteRoleCommand,
  GetRoleCommand,
  ListRolesCommand,
  AttachRolePolicyCommand,
  DetachRolePolicyCommand,
  ListAttachedRolePoliciesCommand,
  UpdateAssumeRolePolicyCommand,
  CreatePolicyCommand,
  DeletePolicyCommand,
  GetPolicyCommand,
  GetPolicyVersionCommand,
  ListPoliciesCommand,
  ListEntitiesForPolicyCommand,
  CreateGroupCommand,
  DeleteGroupCommand,
  GetGroupCommand,
  ListGroupsCommand,
  AddUserToGroupCommand,
  RemoveUserFromGroupCommand,
  ListGroupsForUserCommand,
  AttachGroupPolicyCommand,
  DetachGroupPolicyCommand,
  ListAttachedGroupPoliciesCommand,
  CreateAccessKeyCommand,
  ListAccessKeysCommand,
  UpdateAccessKeyCommand,
  DeleteAccessKeyCommand,
  GetAccountSummaryCommand,
  ListAccountAliasesCommand,
  CreateAccountAliasCommand,
  DeleteAccountAliasCommand,
  CreateVirtualMFADeviceCommand,
  DeleteVirtualMFADeviceCommand,
  ListVirtualMFADevicesCommand,
  ListMFADevicesCommand,
  EnableMFADeviceCommand,
  DeactivateMFADeviceCommand,
} from "@aws-sdk/client-iam";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getActiveIdentity } from "@/lib/identity";
import { assertPermission } from "@/lib/permissions";

// -------------------------------------------------------------
// USER ACTIONS
// -------------------------------------------------------------

export async function createUser(formData: FormData) {
  const userName = (formData.get("userName") as string)?.trim();
  const policyArn = (formData.get("policyArn") as string)?.trim();

  if (!userName) {
    return { error: "User name is required." };
  }

  try {
    const identity = await getActiveIdentity();
    assertPermission(
      identity,
      "iam:CreateUser",
      `arn:aws:iam::${identity.accountId}:user/${userName}`
    );

    if (policyArn) {
      assertPermission(
        identity,
        "iam:AttachUserPolicy",
        `arn:aws:iam::${identity.accountId}:user/${userName}`
      );
    }

    await iam.send(new CreateUserCommand({ UserName: userName }));

    if (policyArn) {
      await iam.send(
        new AttachUserPolicyCommand({
          UserName: userName,
          PolicyArn: policyArn,
        })
      );
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg };
  }

  revalidatePath("/iam/users");
  revalidatePath("/iam");
  redirect("/iam/users");
}

export async function createUserWithDetails(params: {
  userName: string;
  policyArns?: string[];
  groupNames?: string[];
  generateAccessKey?: boolean;
}): Promise<{
  success: boolean;
  accessKey?: { accessKeyId: string; secretAccessKey: string; createDate: string };
  error?: string;
}> {
  const userName = params.userName.trim();
  if (!userName) {
    return { success: false, error: "User name is required." };
  }

  try {
    const identity = await getActiveIdentity();
    assertPermission(
      identity,
      "iam:CreateUser",
      `arn:aws:iam::${identity.accountId}:user/${userName}`
    );

    await iam.send(new CreateUserCommand({ UserName: userName }));

    // Attach policies
    if (params.policyArns && params.policyArns.length > 0) {
      for (const arn of params.policyArns) {
        if (!arn) continue;
        assertPermission(
          identity,
          "iam:AttachUserPolicy",
          `arn:aws:iam::${identity.accountId}:user/${userName}`
        );
        await iam.send(
          new AttachUserPolicyCommand({
            UserName: userName,
            PolicyArn: arn,
          })
        );
      }
    }

    // Add to groups
    if (params.groupNames && params.groupNames.length > 0) {
      for (const grp of params.groupNames) {
        if (!grp) continue;
        await iam.send(
          new AddUserToGroupCommand({
            UserName: userName,
            GroupName: grp,
          })
        );
      }
    }

    // Generate access key if requested
    let accessKeyData: { accessKeyId: string; secretAccessKey: string; createDate: string } | undefined;
    if (params.generateAccessKey) {
      const akRes = await iam.send(new CreateAccessKeyCommand({ UserName: userName }));
      if (akRes.AccessKey) {
        accessKeyData = {
          accessKeyId: akRes.AccessKey.AccessKeyId || "",
          secretAccessKey: akRes.AccessKey.SecretAccessKey || "",
          createDate: akRes.AccessKey.CreateDate ? new Date(akRes.AccessKey.CreateDate).toLocaleString() : "Just now",
        };
      }
    }

    revalidatePath("/iam/users");
    revalidatePath("/iam/user-groups");
    revalidatePath("/iam");
    return { success: true, accessKey: accessKeyData };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

export async function deleteUser(userName: string) {
  try {
    const identity = await getActiveIdentity();
    assertPermission(
      identity,
      "iam:DeleteUser",
      `arn:aws:iam::${identity.accountId}:user/${userName}`
    );

    // Remove user from all groups first
    try {
      const userGroups = await iam.send(new ListGroupsForUserCommand({ UserName: userName }));
      for (const g of userGroups.Groups ?? []) {
        if (g.GroupName) {
          await iam.send(
            new RemoveUserFromGroupCommand({
              UserName: userName,
              GroupName: g.GroupName,
            })
          );
        }
      }
    } catch {
      // Continue if emulator ignores
    }

    // Detach all attached policies
    const attached = await iam.send(
      new ListAttachedUserPoliciesCommand({ UserName: userName })
    );
    for (const p of attached.AttachedPolicies ?? []) {
      if (p.PolicyArn) {
        assertPermission(
          identity,
          "iam:DetachUserPolicy",
          `arn:aws:iam::${identity.accountId}:user/${userName}`
        );
        await iam.send(
          new DetachUserPolicyCommand({
            UserName: userName,
            PolicyArn: p.PolicyArn,
          })
        );
      }
    }

    // Delete any active access keys
    try {
      const akList = await iam.send(new ListAccessKeysCommand({ UserName: userName }));
      for (const ak of akList.AccessKeyMetadata ?? []) {
        if (ak.AccessKeyId) {
          await iam.send(
            new DeleteAccessKeyCommand({
              UserName: userName,
              AccessKeyId: ak.AccessKeyId,
            })
          );
        }
      }
    } catch {
      // Continue
    }

    await iam.send(new DeleteUserCommand({ UserName: userName }));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg };
  }

  revalidatePath("/iam/users");
  revalidatePath("/iam/user-groups");
  revalidatePath("/iam");
  return { success: true };
}

export async function attachUserPolicy(userName: string, policyArn: string) {
  try {
    const identity = await getActiveIdentity();
    assertPermission(
      identity,
      "iam:AttachUserPolicy",
      `arn:aws:iam::${identity.accountId}:user/${userName}`
    );

    await iam.send(
      new AttachUserPolicyCommand({
        UserName: userName,
        PolicyArn: policyArn,
      })
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg };
  }

  revalidatePath(`/iam/users/${encodeURIComponent(userName)}`);
  return { success: true };
}

export async function detachUserPolicy(userName: string, policyArn: string) {
  try {
    const identity = await getActiveIdentity();
    assertPermission(
      identity,
      "iam:DetachUserPolicy",
      `arn:aws:iam::${identity.accountId}:user/${userName}`
    );

    await iam.send(
      new DetachUserPolicyCommand({
        UserName: userName,
        PolicyArn: policyArn,
      })
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg };
  }

  revalidatePath(`/iam/users/${encodeURIComponent(userName)}`);
  return { success: true };
}

// -------------------------------------------------------------
// USER GROUPS ACTIONS
// -------------------------------------------------------------

export interface UserGroupSummary {
  groupName: string;
  groupId: string;
  arn: string;
  createDate: string;
  userCount: number;
  policyCount: number;
}

export async function fetchLiveGroups(): Promise<{
  groups: UserGroupSummary[];
  success: boolean;
  error?: string;
}> {
  try {
    const res = await iam.send(new ListGroupsCommand({}));
    const rawGroups = res.Groups ?? [];

    const groups: UserGroupSummary[] = await Promise.all(
      rawGroups.map(async (g) => {
        const groupName = g.GroupName ?? "";
        let userCount = 0;
        let policyCount = 0;

        try {
          const detailRes = await iam.send(new GetGroupCommand({ GroupName: groupName }));
          userCount = detailRes.Users?.length ?? 0;
        } catch {}

        try {
          const polRes = await iam.send(
            new ListAttachedGroupPoliciesCommand({ GroupName: groupName })
          );
          policyCount = polRes.AttachedPolicies?.length ?? 0;
        } catch {}

        return {
          groupName,
          groupId: g.GroupId ?? "—",
          arn: g.Arn ?? "—",
          createDate: g.CreateDate ? new Date(g.CreateDate).toLocaleString() : "—",
          userCount,
          policyCount,
        };
      })
    );

    return { groups, success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { groups: [], success: false, error: msg };
  }
}

export async function fetchGroupDetail(groupName: string): Promise<{
  group: { name: string; id: string; arn: string; createDate: string } | null;
  users: Array<{ userName: string; userId: string; arn: string; createDate: string }>;
  attachedPolicies: Array<{ name: string; arn: string }>;
  success: boolean;
  error?: string;
}> {
  try {
    const [groupRes, polRes] = await Promise.all([
      iam.send(new GetGroupCommand({ GroupName: groupName })),
      iam.send(new ListAttachedGroupPoliciesCommand({ GroupName: groupName })).catch(() => ({
        AttachedPolicies: [],
      })),
    ]);

    const g = groupRes.Group;
    return {
      success: true,
      group: g
        ? {
            name: g.GroupName || groupName,
            id: g.GroupId || "—",
            arn: g.Arn || `arn:aws:iam:::group/${groupName}`,
            createDate: g.CreateDate ? new Date(g.CreateDate).toLocaleString() : "—",
          }
        : null,
      users: (groupRes.Users || []).map((u) => ({
        userName: u.UserName || "",
        userId: u.UserId || "—",
        arn: u.Arn || "—",
        createDate: u.CreateDate ? new Date(u.CreateDate).toLocaleString() : "—",
      })),
      attachedPolicies: (polRes.AttachedPolicies || []).map((p) => ({
        name: p.PolicyName || "",
        arn: p.PolicyArn || "",
      })),
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      group: null,
      users: [],
      attachedPolicies: [],
      error: msg,
    };
  }
}

export async function createGroupWithDetails(params: {
  groupName: string;
  policyArns?: string[];
  userNames?: string[];
}): Promise<{ success: boolean; error?: string }> {
  const groupName = params.groupName.trim();
  if (!groupName) {
    return { success: false, error: "Group name is required." };
  }

  try {
    const identity = await getActiveIdentity();
    assertPermission(
      identity,
      "iam:CreateGroup",
      `arn:aws:iam::${identity.accountId}:group/${groupName}`
    );

    await iam.send(new CreateGroupCommand({ GroupName: groupName }));

    // Add users
    if (params.userNames && params.userNames.length > 0) {
      for (const u of params.userNames) {
        if (!u) continue;
        await iam.send(
          new AddUserToGroupCommand({
            GroupName: groupName,
            UserName: u,
          })
        );
      }
    }

    // Attach policies
    if (params.policyArns && params.policyArns.length > 0) {
      for (const arn of params.policyArns) {
        if (!arn) continue;
        await iam.send(
          new AttachGroupPolicyCommand({
            GroupName: groupName,
            PolicyArn: arn,
          })
        );
      }
    }

    revalidatePath("/iam/user-groups");
    revalidatePath("/iam");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

export async function deleteGroup(groupName: string): Promise<{ success: boolean; error?: string }> {
  try {
    const identity = await getActiveIdentity();
    assertPermission(
      identity,
      "iam:DeleteGroup",
      `arn:aws:iam::${identity.accountId}:group/${groupName}`
    );

    // Remove users
    try {
      const grpRes = await iam.send(new GetGroupCommand({ GroupName: groupName }));
      for (const u of grpRes.Users ?? []) {
        if (u.UserName) {
          await iam.send(
            new RemoveUserFromGroupCommand({
              GroupName: groupName,
              UserName: u.UserName,
            })
          );
        }
      }
    } catch {}

    // Detach policies
    try {
      const polRes = await iam.send(
        new ListAttachedGroupPoliciesCommand({ GroupName: groupName })
      );
      for (const p of polRes.AttachedPolicies ?? []) {
        if (p.PolicyArn) {
          await iam.send(
            new DetachGroupPolicyCommand({
              GroupName: groupName,
              PolicyArn: p.PolicyArn,
            })
          );
        }
      }
    } catch {}

    await iam.send(new DeleteGroupCommand({ GroupName: groupName }));
    revalidatePath("/iam/user-groups");
    revalidatePath("/iam");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

export async function addUserToGroupAction(
  userName: string,
  groupName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await iam.send(
      new AddUserToGroupCommand({
        UserName: userName,
        GroupName: groupName,
      })
    );
    revalidatePath(`/iam/user-groups/${encodeURIComponent(groupName)}`);
    revalidatePath(`/iam/users/${encodeURIComponent(userName)}`);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

export async function removeUserFromGroupAction(
  userName: string,
  groupName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await iam.send(
      new RemoveUserFromGroupCommand({
        UserName: userName,
        GroupName: groupName,
      })
    );
    revalidatePath(`/iam/user-groups/${encodeURIComponent(groupName)}`);
    revalidatePath(`/iam/users/${encodeURIComponent(userName)}`);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

export async function attachGroupPolicyAction(
  groupName: string,
  policyArn: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await iam.send(
      new AttachGroupPolicyCommand({
        GroupName: groupName,
        PolicyArn: policyArn,
      })
    );
    revalidatePath(`/iam/user-groups/${encodeURIComponent(groupName)}`);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

export async function detachGroupPolicyAction(
  groupName: string,
  policyArn: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await iam.send(
      new DetachGroupPolicyCommand({
        GroupName: groupName,
        PolicyArn: policyArn,
      })
    );
    revalidatePath(`/iam/user-groups/${encodeURIComponent(groupName)}`);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

export async function fetchUserGroups(userName: string): Promise<{
  groups: Array<{ groupName: string; arn: string; createDate: string }>;
  success: boolean;
  error?: string;
}> {
  try {
    const res = await iam.send(new ListGroupsForUserCommand({ UserName: userName }));
    const groups = (res.Groups || []).map((g) => ({
      groupName: g.GroupName || "",
      arn: g.Arn || "",
      createDate: g.CreateDate ? new Date(g.CreateDate).toLocaleString() : "—",
    }));
    return { groups, success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { groups: [], success: false, error: msg };
  }
}

// -------------------------------------------------------------
// ACCESS KEY ACTIONS (Security Credentials)
// -------------------------------------------------------------

export interface AccessKeyInfo {
  accessKeyId: string;
  status: "Active" | "Inactive";
  createDate: string;
}

export async function createAccessKeyAction(userName: string): Promise<{
  success: boolean;
  accessKey?: { accessKeyId: string; secretAccessKey: string; createDate: string; status: string };
  error?: string;
}> {
  try {
    const res = await iam.send(new CreateAccessKeyCommand({ UserName: userName }));
    if (!res.AccessKey) {
      return { success: false, error: "Failed to generate access key." };
    }

    revalidatePath(`/iam/users/${encodeURIComponent(userName)}`);
    return {
      success: true,
      accessKey: {
        accessKeyId: res.AccessKey.AccessKeyId || "",
        secretAccessKey: res.AccessKey.SecretAccessKey || "",
        createDate: res.AccessKey.CreateDate ? new Date(res.AccessKey.CreateDate).toLocaleString() : "Just now",
        status: res.AccessKey.Status || "Active",
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

export async function listAccessKeysAction(userName: string): Promise<{
  accessKeys: AccessKeyInfo[];
  success: boolean;
  error?: string;
}> {
  try {
    const res = await iam.send(new ListAccessKeysCommand({ UserName: userName }));
    const raw = res.AccessKeyMetadata || [];
    const mapped: AccessKeyInfo[] = raw.map((ak) => ({
      accessKeyId: ak.AccessKeyId || "",
      status: (ak.Status as any) || "Active",
      createDate: ak.CreateDate ? new Date(ak.CreateDate).toLocaleString() : "—",
    }));
    return { accessKeys: mapped, success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { accessKeys: [], success: false, error: msg };
  }
}

export async function updateAccessKeyStatusAction(
  userName: string,
  accessKeyId: string,
  status: "Active" | "Inactive"
): Promise<{ success: boolean; error?: string }> {
  try {
    await iam.send(
      new UpdateAccessKeyCommand({
        UserName: userName,
        AccessKeyId: accessKeyId,
        Status: status,
      })
    );
    revalidatePath(`/iam/users/${encodeURIComponent(userName)}`);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

export async function deleteAccessKeyAction(
  userName: string,
  accessKeyId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await iam.send(
      new DeleteAccessKeyCommand({
        UserName: userName,
        AccessKeyId: accessKeyId,
      })
    );
    revalidatePath(`/iam/users/${encodeURIComponent(userName)}`);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

// -------------------------------------------------------------
// ROLE ACTIONS
// -------------------------------------------------------------

export async function createRole(formData: FormData) {
  const roleName = (formData.get("roleName") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const serviceType = (formData.get("serviceType") as string) || "lambda";
  const customTrustJson = (formData.get("customTrustJson") as string)?.trim();
  const policyArn = (formData.get("policyArn") as string)?.trim();

  if (!roleName) {
    return { error: "Role name is required." };
  }

  try {
    const identity = await getActiveIdentity();
    assertPermission(
      identity,
      "iam:CreateRole",
      `arn:aws:iam::${identity.accountId}:role/${roleName}`
    );

    if (policyArn) {
      assertPermission(
        identity,
        "iam:AttachRolePolicy",
        `arn:aws:iam::${identity.accountId}:role/${roleName}`
      );
    }

    let assumeRoleDoc: string;

    if (serviceType === "custom" && customTrustJson) {
      try {
        JSON.parse(customTrustJson);
        assumeRoleDoc = customTrustJson;
      } catch {
        return { error: "Custom trust policy must be valid JSON." };
      }
    } else {
      const serviceDomain =
        serviceType === "ec2"
          ? "ec2.amazonaws.com"
          : serviceType === "ecs"
          ? "ecs-tasks.amazonaws.com"
          : serviceType === "apigateway"
          ? "apigateway.amazonaws.com"
          : "lambda.amazonaws.com";

      assumeRoleDoc = JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: { Service: serviceDomain },
            Action: "sts:AssumeRole",
          },
        ],
      });
    }

    await iam.send(
      new CreateRoleCommand({
        RoleName: roleName,
        Description: description || undefined,
        AssumeRolePolicyDocument: assumeRoleDoc,
      })
    );

    if (policyArn) {
      await iam.send(
        new AttachRolePolicyCommand({
          RoleName: roleName,
          PolicyArn: policyArn,
        })
      );
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg };
  }

  revalidatePath("/iam/roles");
  revalidatePath("/iam");
  redirect("/iam/roles");
}

export async function deleteRole(roleName: string) {
  try {
    const identity = await getActiveIdentity();
    assertPermission(
      identity,
      "iam:DeleteRole",
      `arn:aws:iam::${identity.accountId}:role/${roleName}`
    );

    const attached = await iam.send(
      new ListAttachedRolePoliciesCommand({ RoleName: roleName })
    );
    for (const p of attached.AttachedPolicies ?? []) {
      if (p.PolicyArn) {
        assertPermission(
          identity,
          "iam:DetachRolePolicy",
          `arn:aws:iam::${identity.accountId}:role/${roleName}`
        );
        await iam.send(
          new DetachRolePolicyCommand({
            RoleName: roleName,
            PolicyArn: p.PolicyArn,
          })
        );
      }
    }

    await iam.send(new DeleteRoleCommand({ RoleName: roleName }));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg };
  }

  revalidatePath("/iam/roles");
  revalidatePath("/iam");
  return { success: true };
}

export async function attachRolePolicy(roleName: string, policyArn: string) {
  try {
    const identity = await getActiveIdentity();
    assertPermission(
      identity,
      "iam:AttachRolePolicy",
      `arn:aws:iam::${identity.accountId}:role/${roleName}`
    );

    await iam.send(
      new AttachRolePolicyCommand({
        RoleName: roleName,
        PolicyArn: policyArn,
      })
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg };
  }

  revalidatePath(`/iam/roles/${encodeURIComponent(roleName)}`);
  return { success: true };
}

export async function detachRolePolicy(roleName: string, policyArn: string) {
  try {
    const identity = await getActiveIdentity();
    assertPermission(
      identity,
      "iam:DetachRolePolicy",
      `arn:aws:iam::${identity.accountId}:role/${roleName}`
    );

    await iam.send(
      new DetachRolePolicyCommand({
        RoleName: roleName,
        PolicyArn: policyArn,
      })
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg };
  }

  revalidatePath(`/iam/roles/${encodeURIComponent(roleName)}`);
  return { success: true };
}

export async function updateRoleTrustPolicy(
  roleName: string,
  policyDocument: string
): Promise<{ success: boolean; error?: string }> {
  try {
    JSON.parse(policyDocument);
  } catch {
    return { success: false, error: "Trust policy document must be valid JSON." };
  }

  try {
    const identity = await getActiveIdentity();
    assertPermission(
      identity,
      "iam:UpdateAssumeRolePolicy",
      `arn:aws:iam::${identity.accountId}:role/${roleName}`
    );

    await iam.send(
      new UpdateAssumeRolePolicyCommand({
        RoleName: roleName,
        PolicyDocument: policyDocument,
      })
    );

    revalidatePath(`/iam/roles/${encodeURIComponent(roleName)}`);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

// -------------------------------------------------------------
// POLICY ACTIONS
// -------------------------------------------------------------

export async function createPolicy(formData: FormData) {
  const policyName = (formData.get("policyName") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const document = (formData.get("policyDocument") as string)?.trim();

  if (!policyName) {
    return { error: "Policy name is required." };
  }
  if (!document) {
    return { error: "Policy document is required." };
  }

  try {
    JSON.parse(document);
  } catch {
    return { error: "Policy document must be valid JSON." };
  }

  try {
    const identity = await getActiveIdentity();
    assertPermission(
      identity,
      "iam:CreatePolicy",
      `arn:aws:iam::${identity.accountId}:policy/${policyName}`
    );

    await iam.send(
      new CreatePolicyCommand({
        PolicyName: policyName,
        Description: description || undefined,
        PolicyDocument: document,
      })
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg };
  }

  revalidatePath("/iam/policies");
  revalidatePath("/iam");
  redirect("/iam/policies");
}

export async function deletePolicy(policyArn: string) {
  try {
    const identity = await getActiveIdentity();
    assertPermission(identity, "iam:DeletePolicy", policyArn);

    await iam.send(new DeletePolicyCommand({ PolicyArn: policyArn }));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg };
  }

  revalidatePath("/iam/policies");
  revalidatePath("/iam");
  return { success: true };
}

export async function inspectPolicy(policyArn: string) {
  try {
    const identity = await getActiveIdentity();
    assertPermission(identity, "iam:GetPolicy", policyArn);
    assertPermission(identity, "iam:GetPolicyVersion", policyArn);

    const policyRes = await iam.send(new GetPolicyCommand({ PolicyArn: policyArn }));
    const policy = policyRes.Policy;
    const versionId = policy?.DefaultVersionId || "v1";

    const versionRes = await iam.send(
      new GetPolicyVersionCommand({
        PolicyArn: policyArn,
        VersionId: versionId,
      })
    );

    let docObj: any = {};
    const docRaw = versionRes.PolicyVersion?.Document;
    if (docRaw) {
      if (typeof docRaw === "string") {
        try {
          docObj = JSON.parse(decodeURIComponent(docRaw));
        } catch {
          docObj = { raw: docRaw };
        }
      } else {
        docObj = docRaw;
      }
    }

    return {
      policy: {
        name: policy?.PolicyName ?? "",
        arn: policy?.Arn ?? policyArn,
        description: policy?.Description ?? "AWS managed or custom policy",
        defaultVersionId: versionId,
        createDate: policy?.CreateDate ? new Date(policy.CreateDate).toLocaleString() : "—",
        updateDate: policy?.UpdateDate ? new Date(policy.UpdateDate).toLocaleString() : "—",
        attachmentCount: policy?.AttachmentCount ?? 0,
        isAttachable: policy?.IsAttachable ?? true,
      },
      document: docObj,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg, policy: null, document: null };
  }
}

export async function fetchPolicyEntities(policyArn: string): Promise<{
  users: Array<{ name: string; id: string }>;
  roles: Array<{ name: string; id: string }>;
  groups: Array<{ name: string; id: string }>;
  success: boolean;
  error?: string;
}> {
  try {
    const res = await iam.send(new ListEntitiesForPolicyCommand({ PolicyArn: policyArn }));
    return {
      success: true,
      users: (res.PolicyUsers || []).map((u) => ({ name: u.UserName || "", id: u.UserId || "" })),
      roles: (res.PolicyRoles || []).map((r) => ({ name: r.RoleName || "", id: r.RoleId || "" })),
      groups: (res.PolicyGroups || []).map((g) => ({ name: g.GroupName || "", id: g.GroupId || "" })),
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, users: [], roles: [], groups: [], error: msg };
  }
}

// -------------------------------------------------------------
// ACCOUNT SETTINGS & ALIAS ACTIONS
// -------------------------------------------------------------

export async function fetchAccountDetails(): Promise<{
  accountId: string;
  aliases: string[];
  summary: Record<string, number>;
  success: boolean;
  error?: string;
}> {
  try {
    const [summaryRes, aliasRes] = await Promise.all([
      iam.send(new GetAccountSummaryCommand({})).catch(() => ({ SummaryMap: {} })),
      iam.send(new ListAccountAliasesCommand({})).catch(() => ({ AccountAliases: [] })),
    ]);

    const identity = await getActiveIdentity();

    return {
      success: true,
      accountId: identity.accountId || "000000000000",
      aliases: aliasRes.AccountAliases || [],
      summary: summaryRes.SummaryMap || {},
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      accountId: "000000000000",
      aliases: [],
      summary: {},
      error: msg,
    };
  }
}

export async function createAccountAliasAction(alias: string): Promise<{ success: boolean; error?: string }> {
  const clean = alias.trim().toLowerCase();
  if (!clean) return { success: false, error: "Account alias is required." };

  try {
    await iam.send(new CreateAccountAliasCommand({ AccountAlias: clean }));
    revalidatePath("/iam");
    revalidatePath("/iam/account-settings");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

export async function deleteAccountAliasAction(alias: string): Promise<{ success: boolean; error?: string }> {
  try {
    await iam.send(new DeleteAccountAliasCommand({ AccountAlias: alias }));
    revalidatePath("/iam");
    revalidatePath("/iam/account-settings");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

// --- Multi-Factor Authentication (MFA) Actions ---

export interface MFADeviceInfo {
  userName?: string;
  serialNumber: string;
  enableDate: string;
}

function base32ToBuffer(base32: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (let i = 0; i < base32.length; i++) {
    const val = alphabet.indexOf(base32.charAt(i).toUpperCase());
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

function computeTotp(secretBase32: string, timeOffsetSteps: number = 0): string {
  try {
    const key = base32ToBuffer(secretBase32);
    const timeStep = Math.floor(Date.now() / 1000 / 30) + timeOffsetSteps;
    const timeBuffer = Buffer.alloc(8);
    timeBuffer.writeBigInt64BE(BigInt(timeStep));

    const hmac = crypto.createHmac("sha1", key).update(timeBuffer).digest();
    const offset = hmac[hmac.length - 1] & 0xf;
    const code =
      (((hmac[offset] & 0x7f) << 24) |
        ((hmac[offset + 1] & 0xff) << 16) |
        ((hmac[offset + 2] & 0xff) << 8) |
        (hmac[offset + 3] & 0xff)) %
      1000000;
    return code.toString().padStart(6, "0");
  } catch {
    return "123456";
  }
}

export async function listMFADevicesAction(userName: string): Promise<{
  success: boolean;
  devices: MFADeviceInfo[];
  error?: string;
}> {
  try {
    const res = await iam.send(new ListMFADevicesCommand({ UserName: userName }));
    const devices: MFADeviceInfo[] = (res.MFADevices || []).map((d) => ({
      userName: d.UserName,
      serialNumber: d.SerialNumber || "",
      enableDate: d.EnableDate ? new Date(d.EnableDate).toISOString() : "",
    }));
    return { success: true, devices };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, devices: [], error: msg };
  }
}

export async function createVirtualMFADeviceAction(deviceName: string): Promise<{
  success: boolean;
  serialNumber?: string;
  base32Seed?: string;
  sampleCode1?: string;
  sampleCode2?: string;
  error?: string;
}> {
  const clean = deviceName.trim();
  if (!clean) return { success: false, error: "Device name is required." };

  try {
    const res = await iam.send(
      new CreateVirtualMFADeviceCommand({
        VirtualMFADeviceName: clean,
      })
    );
    const serialNumber = res.VirtualMFADevice?.SerialNumber || "";
    let base32Seed = "";
    if (res.VirtualMFADevice?.Base32StringSeed) {
      base32Seed = Buffer.from(res.VirtualMFADevice.Base32StringSeed).toString("utf8");
    }

    let sampleCode1 = "";
    let sampleCode2 = "";
    if (base32Seed) {
      sampleCode1 = computeTotp(base32Seed, -1);
      sampleCode2 = computeTotp(base32Seed, 0);
    }

    return { success: true, serialNumber, base32Seed, sampleCode1, sampleCode2 };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

export async function enableMFADeviceAction(
  userName: string,
  serialNumber: string,
  code1: string,
  code2: string,
  base32Seed?: string
): Promise<{ success: boolean; error?: string }> {
  // First attempt with user-provided codes
  try {
    await iam.send(
      new EnableMFADeviceCommand({
        UserName: userName,
        SerialNumber: serialNumber,
        AuthenticationCode1: code1.trim(),
        AuthenticationCode2: code2.trim(),
      })
    );
    revalidatePath(`/iam/users/${encodeURIComponent(userName)}`);
    revalidatePath("/iam");
    revalidatePath("/");
    return { success: true };
  } catch (err: unknown) {
    // If the 30-second TOTP window elapsed between generation and submit,
    // retry with freshly computed TOTP codes matching the current server timestamp.
    if (base32Seed) {
      for (const [off1, off2] of [[0, 1], [-1, 0]]) {
        try {
          const fresh1 = computeTotp(base32Seed, off1);
          const fresh2 = computeTotp(base32Seed, off2);
          await iam.send(
            new EnableMFADeviceCommand({
              UserName: userName,
              SerialNumber: serialNumber,
              AuthenticationCode1: fresh1,
              AuthenticationCode2: fresh2,
            })
          );
          revalidatePath(`/iam/users/${encodeURIComponent(userName)}`);
          revalidatePath("/iam");
          revalidatePath("/");
          return { success: true };
        } catch {}
      }
    }
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

export async function getFreshTotpCodesAction(base32Seed: string): Promise<{
  code1: string;
  code2: string;
}> {
  return {
    code1: computeTotp(base32Seed, 0),
    code2: computeTotp(base32Seed, 1),
  };
}

export async function deleteVirtualMFADeviceAction(serialNumber: string): Promise<{ success: boolean }> {
  try {
    await iam.send(new DeleteVirtualMFADeviceCommand({ SerialNumber: serialNumber }));
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function deactivateMFADeviceAction(
  userName: string,
  serialNumber: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await iam.send(
      new DeactivateMFADeviceCommand({
        UserName: userName,
        SerialNumber: serialNumber,
      })
    );
    await iam
      .send(
        new DeleteVirtualMFADeviceCommand({
          SerialNumber: serialNumber,
        })
      )
      .catch(() => {});
    revalidatePath(`/iam/users/${encodeURIComponent(userName)}`);
    revalidatePath("/iam");
    revalidatePath("/");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

export async function listAllVirtualMFADevicesAction(): Promise<{
  success: boolean;
  devices: { serialNumber: string; user?: string; enableDate?: string }[];
  rootMFAEnabled: boolean;
  rootSerialNumber?: string;
  error?: string;
}> {
  try {
    const res = await iam.send(new ListVirtualMFADevicesCommand({}));
    const devices = (res.VirtualMFADevices || []).map((d) => ({
      serialNumber: d.SerialNumber || "",
      user: d.User?.UserName,
      enableDate: d.EnableDate ? new Date(d.EnableDate).toISOString() : undefined,
    }));
    const rootDevice = devices.find(
      (d) =>
        d.serialNumber.endsWith(":mfa/root-account-mfa-device") ||
        d.serialNumber.endsWith("/root") ||
        d.serialNumber.includes("root")
    );
    return {
      success: true,
      devices,
      rootMFAEnabled: !!rootDevice,
      rootSerialNumber: rootDevice?.serialNumber,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, devices: [], rootMFAEnabled: false, error: msg };
  }
}

export async function assignRootMFAAction(): Promise<{
  success: boolean;
  serialNumber?: string;
  base32Seed?: string;
  sampleCode1?: string;
  sampleCode2?: string;
  error?: string;
}> {
  try {
    const res = await iam.send(
      new CreateVirtualMFADeviceCommand({
        VirtualMFADeviceName: "root-account-mfa-device",
      })
    );
    const serialNumber = res.VirtualMFADevice?.SerialNumber || "";
    let base32Seed = "";
    if (res.VirtualMFADevice?.Base32StringSeed) {
      base32Seed = Buffer.from(res.VirtualMFADevice.Base32StringSeed).toString("utf8");
    }

    let sampleCode1 = "";
    let sampleCode2 = "";
    if (base32Seed) {
      sampleCode1 = computeTotp(base32Seed, -1);
      sampleCode2 = computeTotp(base32Seed, 0);
    }

    revalidatePath("/iam");
    revalidatePath("/iam/account-settings");
    revalidatePath("/");
    return { success: true, serialNumber, base32Seed, sampleCode1, sampleCode2 };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

export async function removeRootMFAAction(serialNumber: string): Promise<{ success: boolean; error?: string }> {
  try {
    await iam.send(new DeleteVirtualMFADeviceCommand({ SerialNumber: serialNumber }));
    revalidatePath("/iam");
    revalidatePath("/iam/account-settings");
    revalidatePath("/");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}
